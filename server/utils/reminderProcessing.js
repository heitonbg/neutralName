export function parseEventStart(event) {
  if (event?.startAt) {
    const startAt = new Date(event.startAt);
    if (!Number.isNaN(startAt.getTime())) return startAt;
  }

  const raw = String(event?.date || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T,\s]+(\d{1,2}):(\d{2}))?/);
  const time = raw.match(/(\d{1,2}):(\d{2})/);

  if (iso) {
    const start = new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] ?? time?.[1] ?? 0),
      Number(iso[5] ?? time?.[2] ?? 0)
    );
    return Number.isNaN(start.getTime()) ? null : start;
  }

  if (/сегодня|завтра/i.test(raw)) {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Number(time?.[1] ?? 0),
      Number(time?.[2] ?? 0)
    );
    if (/завтра/i.test(raw)) start.setDate(start.getDate() + 1);
    return start;
  }

  return null;
}

export async function processDueReminders(db, notifyUser, nowMs = Date.now()) {
  const due = db.getDueReminders(nowMs);
  for (const { eventId, userId } of due) {
    const event = db.findEvent(eventId);
    if (!event || !db.isNotificationsEnabled(userId)) {
      db.markReminderSent(eventId, userId);
      continue;
    }

    const delivered = await notifyUser(userId, `⏰ Через час: «${event.title}»`);
    if (delivered) db.markReminderSent(eventId, userId);
  }
}