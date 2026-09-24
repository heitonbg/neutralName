// server/db/database.js
// In-memory хранилище с персистентностью на диск (db.json).
// При первом запуске — автозаполнение из seedEvents.js.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEED_EVENTS, SEED_USERS } from './seedEvents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const loadFromDisk = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      return {
        events: raw.events || [],
        reports: raw.reports || [],
        reviews: raw.reviews || [],
        users: raw.users || {},
        joinedUsers: new Map(
          Object.entries(raw.joinedUsers || {}).map(([k, v]) => [Number(k), new Set(v)])
        ),
        reminders: new Map(),
        seeded: raw.seeded === true
      };
    }
  } catch (e) {
    console.warn('⚠️  DB load failed:', e.message);
  }
  return {
    events: [],
    reports: [],
    reviews: [],
    users: {},
    joinedUsers: new Map(),
    reminders: new Map(),
    seeded: false
  };
};

const persisted = loadFromDisk();

// ★ Миграция: если в старых событиях есть organizer как объект —
// превращаем в organizerId и переносим данные в users.
if (persisted.events.length) {
  let migrated = 0;
  for (const event of persisted.events) {
    if (event.organizer && typeof event.organizer === 'object') {
      const orgId = String(event.organizer.id);
      if (!persisted.users[orgId]) {
        persisted.users[orgId] = {
          id: orgId,
          name: event.organizer.name || 'Организатор',
          photo_url: event.organizer.photo_url || null,
          age: event.organizer.age ?? null,
          city: event.organizer.city || null,
          about: event.organizer.about || null,
          updatedAt: new Date().toISOString()
        };
      }
      event.organizerId = orgId;
      delete event.organizer;
      migrated++;
    }
  }
  if (migrated > 0) {
    console.log(`🔄 Миграция: ${migrated} событий переведены на organizerId`);
    persisted.seeded = true;
  }
}

// Если БД пустая и ранее не сидировалась — заполняем seed-данными.
if (!persisted.seeded && persisted.events.length === 0) {
  persisted.events = SEED_EVENTS.map((e) => ({ ...e }));
  persisted.users = { ...SEED_USERS };
  persisted.seeded = true;
  console.log(`🌱 БД засеяна ${persisted.events.length} событиями и ${Object.keys(persisted.users).length} пользователями`);
}

const db = {
  events: persisted.events,
  reports: persisted.reports,
  reviews: persisted.reviews,
  users: persisted.users,
  joinedUsers: persisted.joinedUsers,
  reminders: persisted.reminders,
  seeded: persisted.seeded,

  save() {
    try {
      const obj = {
        events: this.events,
        reports: this.reports,
        reviews: this.reviews,
        users: this.users,
        joinedUsers: Object.fromEntries(
          [...this.joinedUsers.entries()].map(([k, v]) => [k, Array.from(v)])
        ),
        seeded: true
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
      console.warn('⚠️  DB save failed:', e.message);
    }
  },

  // ---------- EVENTS ----------
  findEvent(id) {
    return this.events.find((e) => e.id === id);
  },

  addEvent(event) {
    this.events.push(event);
    this.save();
    return event;
  },

  updateEvent(id, patch) {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.events[index] = { ...this.events[index], ...patch, id };
    this.save();
    return this.events[index];
  },

  removeEvent(id) {
    this.events = this.events.filter((e) => e.id !== id);
    this.save();
  },

  // ★ Возвращает событие с подклеенным organizer из db.users
  hydrateEvent(event) {
    if (!event) return null;
    const organizer = event.organizerId
      ? this.users[String(event.organizerId)] || {
          id: event.organizerId,
          name: 'Организатор',
        }
      : null;
    return { ...event, organizer };
  },

  hydrateEvents(events) {
    return events.map((e) => this.hydrateEvent(e));
  },

  // ---------- USERS ----------
  findUser(id) {
    return this.users[String(id)] || null;
  },

  upsertUser(id, patch) {
    const key = String(id);
    const existing = this.users[key] || { id: key };
    this.users[key] = {
      ...existing,
      ...patch,
      id: key,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.users[key];
  },

  // ---------- REPORTS / REVIEWS ----------
  addReport(report) {
    this.reports.push(report);
    this.save();
    return report;
  },

  addReview(review) {
    this.reviews.push(review);
    this.save();
    return review;
  },

  // ---------- JOIN ----------
  isUserJoined(eventId, userId) {
    if (!this.joinedUsers.has(eventId)) return false;
    return this.joinedUsers.get(eventId).has(String(userId));
  },

  addJoin(eventId, userId) {
    if (!this.joinedUsers.has(eventId)) {
      this.joinedUsers.set(eventId, new Set());
    }
    this.joinedUsers.get(eventId).add(String(userId));
    this.save();
  },

  removeJoin(eventId, userId) {
    if (!this.joinedUsers.has(eventId)) return;
    this.joinedUsers.get(eventId).delete(String(userId));
    this.save();
  },

  // ★ Возвращает массив профилей участников события
  getParticipants(eventId) {
    const ids = this.joinedUsers.get(Number(eventId)) || new Set();
    return [...ids].map((id) => this.users[String(id)] || { id, name: 'Участник' });
  },

  // ---------- REMINDERS ----------
  setReminder(key, timerId) {
    this.reminders.set(key, timerId);
  },

  clearReminder(key) {
    const timerId = this.reminders.get(key);
    if (timerId) clearTimeout(timerId);
    this.reminders.delete(key);
  }
};

db.save();

export default db;