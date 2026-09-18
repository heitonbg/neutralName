// In-memory хранилище для MVP
const db = {
  events: [],
  reports: [],
  joinedUsers: new Map(),
  reminders: new Map(),

  findEvent(id) {
    return this.events.find((e) => e.id === id);
  },

  addEvent(event) {
    this.events.push(event);
    return event;
  },

  addReport(report) {
    this.reports.push(report);
    return report;
  },

  isUserJoined(eventId, userId) {
    if (!this.joinedUsers.has(eventId)) return false;
    return this.joinedUsers.get(eventId).has(userId);
  },

  addJoin(eventId, userId) {
    if (!this.joinedUsers.has(eventId)) {
      this.joinedUsers.set(eventId, new Set());
    }
    this.joinedUsers.get(eventId).add(userId);
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

export default db;