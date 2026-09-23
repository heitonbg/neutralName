const RELATIVE_DAY_PATTERN = /^(Сегодня|Завтра|Послезавтра),?\s+(\d{1,2}):(\d{2})$/i;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2}),?\s*(\d{1,2}):(\d{2})$/;

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const parseEventDate = (value, now = new Date()) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
  if (!value) return null;

  const text = String(value).trim();
  const relativeMatch = text.match(RELATIVE_DAY_PATTERN);
  if (relativeMatch) {
    const dayOffset = {
      сегодня: 0,
      завтра: 1,
      послезавтра: 2
    }[relativeMatch[1].toLowerCase()];
    const result = startOfDay(now);
    result.setDate(result.getDate() + dayOffset);
    result.setHours(Number(relativeMatch[2]), Number(relativeMatch[3]), 0, 0);
    return result;
  }

  const isoMatch = text.match(ISO_DATE_PATTERN);
  if (isoMatch) {
    const [, year, month, day, hours, minutes] = isoMatch;
    const result = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    return Number.isNaN(result.getTime()) ? null : result;
  }

  const result = new Date(text);
  return Number.isNaN(result.getTime()) ? null : result;
};