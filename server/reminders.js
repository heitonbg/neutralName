// server/reminders.js
import db from './db/sqliteDatabase.js';
import { notifyUser } from './bot.js';
import { parseEventStart, processDueReminders } from './utils/reminderProcessing.js';

const CHECK_INTERVAL_MS = 60 * 1000;
const HOUR_BEFORE_MS = 60 * 60 * 1000;

let timer = null;
let tickInProgress = false;

/**
 * Планирует напоминание за час до начала события.
 * Если до начала меньше часа — не планирует.
 * Если у пользователя выключены уведомления — не планирует.
 */
export function scheduleEventReminder(event, userId) {
  if (!db.isNotificationsEnabled(userId)) return;

  const start = parseEventStart(event);
  if (!start) return;

  const sendAt = start.getTime() - HOUR_BEFORE_MS;
  if (sendAt <= Date.now()) return;

  db.scheduleReminder(event.id, userId, sendAt);
}

export function cancelEventReminder(eventId, userId) {
  db.clearReminder(eventId, userId);
}

export function startReminderWorker() {
  if (timer) return;

  const tick = async () => {
    if (tickInProgress) return;
    tickInProgress = true;
    try {
      await processDueReminders(db, notifyUser, Date.now());
    } catch (error) {
      console.warn('⚠️  Reminder worker error:', error.message);
    } finally {
      tickInProgress = false;
    }
  };

  timer = setInterval(tick, CHECK_INTERVAL_MS);
  tick();
}

export function stopReminderWorker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}