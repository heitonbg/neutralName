// server/db/database.js
// In-memory хранилище с персистентностью на диск (db.json).
// При первом запуске — автозаполнение из seedEvents.js.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEED_EVENTS } from './seedEvents.js';

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
    joinedUsers: new Map(),
    reminders: new Map(),
    seeded: false
  };
};

const persisted = loadFromDisk();

// Если БД пустая и ранее не сидировалась — заполняем seed-данными.
if (!persisted.seeded && persisted.events.length === 0) {
  persisted.events = SEED_EVENTS.map((e) => ({ ...e }));
  persisted.seeded = true;
  console.log(`🌱 БД засеяна ${persisted.events.length} событиями`);
}

const db = {
  events: persisted.events,
  reports: persisted.reports,
  reviews: persisted.reviews,
  joinedUsers: persisted.joinedUsers,
  reminders: persisted.reminders,
  seeded: persisted.seeded,

  save() {
    try {
      const obj = {
        events: this.events,
        reports: this.reports,
        reviews: this.reviews,
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

  setReminder(key, timerId) {
    this.reminders.set(key, timerId);
  },

  clearReminder(key) {
    const timerId = this.reminders.get(key);
    if (timerId) clearTimeout(timerId);
    this.reminders.delete(key);
  }
};

// Сохраняем стартовое состояние (в т.ч. после сида).
db.save();

export default db;