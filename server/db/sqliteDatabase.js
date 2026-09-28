// server/db/sqliteDatabase.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

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
  CREATE TABLE IF NOT EXISTS tourist_plans (
    user_id TEXT NOT NULL,
    city TEXT NOT NULL,
    date TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, city, date)
  );
  CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, event_id INTEGER NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS joins (
    event_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS participated_users (
    event_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS reminders (
    event_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    send_at INTEGER NOT NULL,
    sent INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS friendships (
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, friend_id)
  );
  CREATE INDEX IF NOT EXISTS reviews_event_id ON reviews(event_id);
  CREATE INDEX IF NOT EXISTS reminders_due ON reminders(sent, send_at);
  CREATE INDEX IF NOT EXISTS participated_event_id ON participated_users(event_id);
  CREATE INDEX IF NOT EXISTS friendships_friend ON friendships(friend_id, status);
  CREATE INDEX IF NOT EXISTS friendships_user ON friendships(user_id, status);
`);

const statements = {
  event: sql.prepare('INSERT INTO events (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'),
  user: sql.prepare('INSERT INTO users (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'),
  report: sql.prepare('INSERT INTO reports (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'),
  review: sql.prepare('INSERT INTO reviews (id, event_id, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data'),

  join: sql.prepare('INSERT OR IGNORE INTO joins (event_id, user_id) VALUES (?, ?)'),
  unjoin: sql.prepare('DELETE FROM joins WHERE event_id=? AND user_id=?'),

  addParticipant: sql.prepare('INSERT OR IGNORE INTO participated_users (event_id, user_id) VALUES (?, ?)'),
  removeParticipant: sql.prepare('DELETE FROM participated_users WHERE event_id=? AND user_id=?'),

  deleteEvent: sql.prepare('DELETE FROM events WHERE id=?'),
  deleteJoins: sql.prepare('DELETE FROM joins WHERE event_id=?'),
  deleteParticipants: sql.prepare('DELETE FROM participated_users WHERE event_id=?'),
  deleteReviews: sql.prepare('DELETE FROM reviews WHERE event_id=?'),
  deleteReminders: sql.prepare('DELETE FROM reminders WHERE event_id=?'),
  deleteUserReminders: sql.prepare('DELETE FROM reminders WHERE user_id=?'),

  setMeta: sql.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'),

  upsertReminder: sql.prepare(`
    INSERT INTO reminders (event_id, user_id, send_at, sent) VALUES (?, ?, ?, 0)
    ON CONFLICT(event_id, user_id) DO UPDATE SET send_at=excluded.send_at, sent=0
  `),
  deleteReminder: sql.prepare('DELETE FROM reminders WHERE event_id=? AND user_id=?'),
  dueReminders: sql.prepare('SELECT event_id, user_id FROM reminders WHERE sent=0 AND send_at<=?'),
  markReminderSent: sql.prepare('UPDATE reminders SET sent=1 WHERE event_id=? AND user_id=?'),

  touristPlans: sql.prepare('SELECT data FROM tourist_plans WHERE user_id=? ORDER BY updated_at DESC LIMIT 20'),
  upsertTouristPlan: sql.prepare(`
    INSERT INTO tourist_plans (user_id, city, date, data, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, city, date) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at
  `),
  pruneTouristPlans: sql.prepare(`
    DELETE FROM tourist_plans
    WHERE user_id=? AND rowid NOT IN (
      SELECT rowid FROM tourist_plans WHERE user_id=? ORDER BY updated_at DESC LIMIT 20
    )
  `),
  deleteTouristPlan: sql.prepare('DELETE FROM tourist_plans WHERE user_id=? AND city=? AND date=?'),

  // ---------- FRIENDS ----------
  upsertFriendRequest: sql.prepare(`
    INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
    VALUES (?, ?, 'pending', ?, ?)
    ON CONFLICT(user_id, friend_id) DO UPDATE SET
      status = CASE
        WHEN friendships.status = 'accepted' THEN 'accepted'
        ELSE 'pending'
      END,
      updated_at = excluded.updated_at
  `),
  acceptFriend: sql.prepare(`
    UPDATE friendships SET status = 'accepted', updated_at = ?
    WHERE user_id = ? AND friend_id = ?
  `),
  deleteFriendship: sql.prepare(`
    DELETE FROM friendships
    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
  `),
  getFriendship: sql.prepare(`
    SELECT user_id, friend_id, status FROM friendships
    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
  `),
  listAcceptedFriends: sql.prepare(`
    SELECT
      CASE WHEN user_id = ? THEN friend_id ELSE user_id END AS friend_id,
      status
    FROM friendships
    WHERE status = 'accepted' AND (user_id = ? OR friend_id = ?)
  `),
  listIncomingRequests: sql.prepare(`
    SELECT user_id AS from_id, created_at FROM friendships
    WHERE friend_id = ? AND status = 'pending'
    ORDER BY created_at DESC
  `),
  listOutgoingRequests: sql.prepare(`
    SELECT friend_id AS to_id, created_at FROM friendships
    WHERE user_id = ? AND status = 'pending'
    ORDER BY created_at DESC
  `),
};

const rows = (table) =>
  sql.prepare(`SELECT data FROM ${table}`).all().map(({ data }) => JSON.parse(data));

const users = Object.fromEntries(rows('users').map((user) => [String(user.id), user]));

const joinedUsers = new Map();
for (const { event_id, user_id } of sql.prepare('SELECT event_id, user_id FROM joins').all()) {
  if (!joinedUsers.has(event_id)) joinedUsers.set(event_id, new Set());
  joinedUsers.get(event_id).add(user_id);
}

const participatedUsers = new Map();
for (const { event_id, user_id } of sql
  .prepare('SELECT event_id, user_id FROM participated_users')
  .all()) {
  if (!participatedUsers.has(event_id)) participatedUsers.set(event_id, new Set());
  participatedUsers.get(event_id).add(user_id);
}

const db = {
  events: rows('events'),
  users,
  reports: rows('reports'),
  reviews: rows('reviews'),
  joinedUsers,
  participatedUsers,
  reminders: new Map(),
  seeded: sql.prepare("SELECT value FROM meta WHERE key='seeded'").get()?.value === 'true',

  // ---------- EVENTS ----------
  findEvent(id) {
    return this.events.find((event) => event.id === Number(id));
  },

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
      statements.deleteParticipants.run(id);
      statements.deleteReviews.run(id);
      statements.deleteReminders.run(id);
      sql.exec('COMMIT');
    } catch (error) {
      sql.exec('ROLLBACK');
      throw error;
    }
    this.events = this.events.filter((event) => event.id !== Number(id));
    this.joinedUsers.delete(Number(id));
    this.participatedUsers.delete(Number(id));
    this.reviews = this.reviews.filter((review) => review.eventId !== Number(id));
  },

  hydrateEvent(event) {
    if (!event) return null;
    const organizer = event.organizerId
      ? this.users[String(event.organizerId)] || { id: event.organizerId, name: 'Организатор' }
      : null;
    const participantIds = [...(this.joinedUsers.get(Number(event.id)) || [])].map(String);
    return { ...event, organizer, participantIds };
  },

  hydrateEvents(events) {
    return events.map((event) => this.hydrateEvent(event));
  },

  // ---------- USERS ----------
  findUser(id) {
    return this.users[String(id)] || null;
  },

  // ---------- TOURIST PLANS ----------
  getTouristPlans(userId) {
    return statements.touristPlans.all(String(userId)).map(({ data }) => JSON.parse(data));
  },

  saveTouristPlan(userId, plan) {
    const savedPlan = { ...plan, savedAt: new Date().toISOString() };
    statements.upsertTouristPlan.run(
      String(userId),
      savedPlan.city,
      savedPlan.date,
      JSON.stringify(savedPlan),
      savedPlan.savedAt
    );
    statements.pruneTouristPlans.run(String(userId), String(userId));
    return savedPlan;
  },

  deleteTouristPlan(userId, city, date) {
    statements.deleteTouristPlan.run(String(userId), city, date);
  },

  isNotificationsEnabled(userId) {
    const user = this.users[String(userId)];
    if (!user) return true;
    return user.notificationsEnabled !== false;
  },

  upsertUser(id, patch) {
    const key = String(id);
    const user = {
      ...(this.users[key] || { id: key }),
      ...patch,
      id: key,
      updatedAt: new Date().toISOString(),
    };
    statements.user.run(key, JSON.stringify(user));
    this.users[key] = user;
    return user;
  },

  // ---------- REPORTS / REVIEWS ----------
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

  // ---------- JOIN ----------
  isUserJoined(eventId, userId) {
    return this.joinedUsers.get(Number(eventId))?.has(String(userId)) || false;
  },

  addJoin(eventId, userId) {
    const event = this.findEvent(eventId);
    if (event && String(event.organizerId) === String(userId)) return;

    statements.join.run(Number(eventId), String(userId));
    if (!this.joinedUsers.has(Number(eventId))) this.joinedUsers.set(Number(eventId), new Set());
    this.joinedUsers.get(Number(eventId)).add(String(userId));

    statements.addParticipant.run(Number(eventId), String(userId));
    if (!this.participatedUsers.has(Number(eventId))) {
      this.participatedUsers.set(Number(eventId), new Set());
    }
    this.participatedUsers.get(Number(eventId)).add(String(userId));
  },

  removeJoin(eventId, userId) {
    statements.unjoin.run(Number(eventId), String(userId));
    this.joinedUsers.get(Number(eventId))?.delete(String(userId));
  },

  removeParticipant(eventId, userId) {
    statements.removeParticipant.run(Number(eventId), String(userId));
    this.participatedUsers.get(Number(eventId))?.delete(String(userId));
  },

  wasUserParticipant(eventId, userId) {
    return this.participatedUsers.get(Number(eventId))?.has(String(userId)) || false;
  },

  getParticipants(eventId) {
    const event = this.findEvent(Number(eventId));
    const organizerId = event?.organizerId && String(event.organizerId);
    const ids = [organizerId, ...(this.joinedUsers.get(Number(eventId)) || [])]
      .filter(Boolean)
      .map(String);
    return [...new Set(ids)].map((id) => ({
      ...(this.users[id] || { id, name: id === organizerId ? 'Организатор' : 'Участник' }),
      id,
      isOrganizer: id === organizerId,
    }));
  },

  // ---------- FRIENDS ----------
  addFriendRequest(fromId, toId) {
    if (String(fromId) === String(toId)) throw new Error('Нельзя добавить себя');
    const now = Date.now();
    statements.upsertFriendRequest.run(String(fromId), String(toId), now, now);
  },

  acceptFriendRequest(fromId, toId) {
    statements.acceptFriend.run(Date.now(), String(fromId), String(toId));
  },

  removeFriend(userId, friendId) {
    statements.deleteFriendship.run(
      String(userId), String(friendId),
      String(friendId), String(userId)
    );
  },

  getFriendshipStatus(userId, otherId) {
    if (String(userId) === String(otherId)) return 'self';
    const row = statements.getFriendship.get(
      String(userId), String(otherId),
      String(otherId), String(userId)
    );
    if (!row) return 'none';
    if (row.status === 'accepted') return 'friends';
    if (String(row.user_id) === String(userId)) return 'outgoing';
    return 'incoming';
  },

  listFriends(userId) {
    return statements.listAcceptedFriends.all(
      String(userId), String(userId), String(userId)
    ).map((row) => this.users[String(row.friend_id)] || { id: String(row.friend_id), name: 'Пользователь' });
  },

  listIncomingFriendRequests(userId) {
    return statements.listIncomingRequests.all(String(userId)).map((row) => ({
      user: this.users[String(row.from_id)] || { id: String(row.from_id), name: 'Пользователь' },
      createdAt: row.created_at,
    }));
  },

  listOutgoingFriendRequests(userId) {
    return statements.listOutgoingRequests.all(String(userId)).map((row) => ({
      user: this.users[String(row.to_id)] || { id: String(row.to_id), name: 'Пользователь' },
      createdAt: row.created_at,
    }));
  },

  friendIdsFor(userId) {
    return new Set(
      statements.listAcceptedFriends.all(
        String(userId), String(userId), String(userId)
      ).map((row) => String(row.friend_id))
    );
  },

  // ---------- REMINDERS ----------
  scheduleReminder(eventId, userId, sendAtMs) {
    statements.upsertReminder.run(Number(eventId), String(userId), sendAtMs);
  },

  clearReminder(eventId, userId) {
    statements.deleteReminder.run(Number(eventId), String(userId));
  },

  clearAllUserReminders(userId) {
    statements.deleteUserReminders.run(String(userId));
  },

  getDueReminders(nowMs) {
    return statements.dueReminders.all(nowMs).map((r) => ({
      eventId: r.event_id,
      userId: r.user_id,
    }));
  },

  markReminderSent(eventId, userId) {
    statements.markReminderSent.run(Number(eventId), String(userId));
  },

  setReminder(key, timerId) {
    this.reminders.set(key, timerId);
  },

  clearReminderLegacy(key) {
    const timerId = this.reminders.get(key);
    if (timerId) clearTimeout(timerId);
    this.reminders.delete(key);
  },
};

// ★ Сидинг удалён — база остаётся ровно такой, какой её наполняет пользователь.
//   Флаг `seeded` больше не устанавливается, `setMeta` остался для возможного
//   использования в будущем, но в коде больше нигде не вызывается.

export default db;