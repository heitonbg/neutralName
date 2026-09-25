import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { SEED_EVENTS, SEED_USERS } from './seedEvents.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(directory, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
const file = process.env.DB_PATH || path.join(directory, 'events.sqlite');
fs.mkdirSync(path.dirname(file), { recursive: true });
const sql = new DatabaseSync(file);
sql.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, event_id INTEGER NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS joins (
    event_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS reviews_event_id ON reviews(event_id);
`);
const statements = {
  event: sql.prepare('INSERT INTO events (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'),
  user: sql.prepare('INSERT INTO users (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'),
  report: sql.prepare('INSERT INTO reports (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'),
  review: sql.prepare('INSERT INTO reviews (id, event_id, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'),
  join: sql.prepare('INSERT OR IGNORE INTO joins (event_id, user_id) VALUES (?, ?)'),
  unjoin: sql.prepare('DELETE FROM joins WHERE event_id=? AND user_id=?'),
  deleteEvent: sql.prepare('DELETE FROM events WHERE id=?'),
  deleteJoins: sql.prepare('DELETE FROM joins WHERE event_id=?'),
  deleteReviews: sql.prepare('DELETE FROM reviews WHERE event_id=?'),
  setMeta: sql.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
};
const rows = (table) => sql.prepare(`SELECT data FROM ${table}`).all().map(({ data }) => JSON.parse(data));
const users = Object.fromEntries(rows('users').map((user) => [String(user.id), user]));
const joinedUsers = new Map();
for (const { event_id, user_id } of sql.prepare('SELECT event_id, user_id FROM joins').all()) {
  if (!joinedUsers.has(event_id)) joinedUsers.set(event_id, new Set());
  joinedUsers.get(event_id).add(user_id);
}
const db = {
  events: rows('events'),
  users,
  reports: rows('reports'),
  reviews: rows('reviews'),
  joinedUsers,
  reminders: new Map(),
  seeded: sql.prepare("SELECT value FROM meta WHERE key='seeded'").get()?.value === 'true',
  findEvent(id) { return this.events.find((event) => event.id === Number(id)); },
  addEvent(event) {
    statements.event.run(event.id, JSON.stringify(event));
    this.events.push(event);
    return event;
  },
  updateEvent(id, patch) {
    const index = this.events.findIndex((event) => event.id === Number(id));
    if (index < 0) return null;
    const next = { ...this.events[index], ...patch, id: Number(id) };
    statements.event.run(next.id, JSON.stringify(next));
    this.events[index] = next;
    return next;
  },
  removeEvent(id) {
    sql.exec('BEGIN');
    try {
      statements.deleteEvent.run(id);
      statements.deleteJoins.run(id);
      statements.deleteReviews.run(id);
      sql.exec('COMMIT');
    } catch (error) {
      sql.exec('ROLLBACK');
      throw error;
    }
    this.events = this.events.filter((event) => event.id !== Number(id));
    this.joinedUsers.delete(Number(id));
    this.reviews = this.reviews.filter((review) => review.eventId !== Number(id));
  },
  hydrateEvent(event) {
    if (!event) return null;
    const organizer = event.organizerId
      ? this.users[String(event.organizerId)] || { id: event.organizerId, name: 'Организатор' }
      : null;
    return { ...event, organizer };
  },
  hydrateEvents(events) { return events.map((event) => this.hydrateEvent(event)); },
  findUser(id) { return this.users[String(id)] || null; },
  upsertUser(id, patch) {
    const key = String(id);
    const user = { ...(this.users[key] || { id: key }), ...patch, id: key, updatedAt: new Date().toISOString() };
    statements.user.run(key, JSON.stringify(user));
    this.users[key] = user;
    return user;
  },
  addReport(report) {
    statements.report.run(String(report.id), JSON.stringify(report));
    this.reports.push(report);
    return report;
  },
  addReview(review) {
    statements.review.run(String(review.id), review.eventId, JSON.stringify(review));
    this.reviews.push(review);
    return review;
  },
  isUserJoined(eventId, userId) { return this.joinedUsers.get(Number(eventId))?.has(String(userId)) || false; },
  addJoin(eventId, userId) {
    statements.join.run(Number(eventId), String(userId));
    if (!this.joinedUsers.has(Number(eventId))) this.joinedUsers.set(Number(eventId), new Set());
    this.joinedUsers.get(Number(eventId)).add(String(userId));
  },
  removeJoin(eventId, userId) {
    statements.unjoin.run(Number(eventId), String(userId));
    this.joinedUsers.get(Number(eventId))?.delete(String(userId));
  },
  getParticipants(eventId) {
    return [...(this.joinedUsers.get(Number(eventId)) || [])]
      .map((id) => this.users[id] || { id, name: 'Участник' });
  },
  setReminder(key, timerId) { this.reminders.set(key, timerId); },
  clearReminder(key) {
    const timerId = this.reminders.get(key);
    if (timerId) clearTimeout(timerId);
    this.reminders.delete(key);
  }
};

if (!db.seeded && db.events.length === 0) {
  let source = { events: SEED_EVENTS, users: SEED_USERS, reports: [], reviews: [], joinedUsers: {} };
  const legacyFile = process.env.LEGACY_DB_PATH || path.join(directory, 'db.json');
  if (fs.existsSync(legacyFile)) {
    // A malformed legacy database must stop startup, never be silently replaced with sample data.
    source = JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
  }
  sql.exec('BEGIN');
  try {
    for (const user of Object.values(source.users || {})) {
      statements.user.run(String(user.id), JSON.stringify(user));
      db.users[String(user.id)] = user;
    }
    for (const event of source.events || []) {
      if (event.organizer && typeof event.organizer === 'object') {
        const user = event.organizer;
        const id = String(user.id);
        if (!db.users[id]) {
          db.users[id] = { ...user, id };
          statements.user.run(id, JSON.stringify(db.users[id]));
        }
        event.organizerId = id;
        delete event.organizer;
      }
      statements.event.run(event.id, JSON.stringify(event));
      db.events.push(event);
    }
    for (const report of source.reports || []) {
      statements.report.run(String(report.id), JSON.stringify(report));
      db.reports.push(report);
    }
    for (const review of source.reviews || []) {
      statements.review.run(String(review.id), review.eventId, JSON.stringify(review));
      db.reviews.push(review);
    }
    for (const [eventId, ids] of Object.entries(source.joinedUsers || {})) {
      for (const id of ids) {
        statements.join.run(Number(eventId), String(id));
        if (!db.joinedUsers.has(Number(eventId))) db.joinedUsers.set(Number(eventId), new Set());
        db.joinedUsers.get(Number(eventId)).add(String(id));
      }
    }
    statements.setMeta.run('seeded', 'true');
    sql.exec('COMMIT');
    db.seeded = true;
  } catch (error) {
    sql.exec('ROLLBACK');
    throw error;
  }
}
export default db;
