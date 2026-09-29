export function isEventPast(event, now = new Date()) {
  const startAt = new Date(event?.startAt);
  let start = Number.isNaN(startAt.getTime()) ? null : startAt;

  if (!start) {
    const match = String(event?.date || '').match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T,\s]+(\d{1,2}):(\d{2}))?/
    );
    if (!match) return false;
    start = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] || 0),
      Number(match[5] || 0)
    );
    if (Number.isNaN(start.getTime())) return false;
  }

  const duration = String(event?.duration || '').trim();
  let durationMs = 2 * 60 * 60 * 1000;
  if (/^\d+$/.test(duration)) {
    durationMs = Number(duration) * 60 * 1000;
  } else if (duration) {
    const hours = Number(duration.match(/(\d+)\s*ч/)?.[1] || 0);
    const minutes = Number(duration.match(/(\d+)\s*мин/)?.[1] || 0);
    const parsedDuration = (hours * 60 + minutes) * 60 * 1000;
    if (parsedDuration > 0) durationMs = parsedDuration;
  }

  return now.getTime() >= start.getTime() + durationMs;
}
