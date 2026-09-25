// server/reminders.js
import db from './db/sqliteDatabase.js';
import { notifyUser } from './bot.js';

const CHECK_INTERVAL_MS = 60 * 1000;
const HOUR_BEFORE_MS = 60 * 60 * 1000;

let timer = null;

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
    try {
      const due = db.getDueReminders(Date.now());
      for (const { eventId, userId } of due) {
        const event = db.findEvent(eventId);
        if (!event) {
          db.markReminderSent(eventId, userId);
          continue;
        }

        // ★ Повторная проверка: пользователь мог выключить уведомления
        //   после того, как напоминание уже было запланировано.
        if (!db.isNotificationsEnabled(userId)) {
          db.markReminderSent(eventId, userId);
          continue;
        }

        await notifyUser(userId, `⏰ Через час: «${event.title}»`);
        db.markReminderSent(eventId, userId);
      }
    } catch (error) {
      console.warn('⚠️  Reminder worker error:', error.message);
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

function parseEventStart(event) {
  const raw = String(event?.date || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T,\s]+(\d{1,2}):(\d{2}))?/);
  const time = raw.match(/(\d{1,2}):(\d{2})/);

  if (iso) {
    const d = new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] ?? time?.[1] ?? 0),
      Number(iso[5] ?? time?.[2] ?? 0)
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (/сегодня|завтра/i.test(raw)) {
    const now = new Date();
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Number(time?.[1] ?? 0),
      Number(time?.[2] ?? 0)
    );
    if (/завтра/i.test(raw)) d.setDate(d.getDate() + 1);
    return d;
  }

  return null;
}