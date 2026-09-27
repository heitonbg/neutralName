const DEFAULT_DURATION_MINUTES = 120;
const MAX_PLAN_EVENTS = 8;

export function getEventStart(event, now = new Date()) {
  if (event?.startAt) {
    const startAt = new Date(event.startAt);
    if (!Number.isNaN(startAt.getTime())) return startAt;
  }

  const raw = String(event?.date || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[,\sT]+(\d{1,2}):(\d{2}))?/);
  if (match) {
    const start = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4] || 0),
      Number(match[5] || 0)
    );
    return Number.isNaN(start.getTime()) ? null : start;
  }

  const time = raw.match(/(\d{1,2}):(\d{2})/);
  if (/сегодня|завтра/i.test(raw)) {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + (/завтра/i.test(raw) ? 1 : 0),
      Number(time?.[1] || 0),
      Number(time?.[2] || 0)
    );
    return start;
  }

  return null;
}

export function getEventDateKey(event, now = new Date()) {
  const match = String(event?.date || '').match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const start = getEventStart(event, now);
  if (!start) return null;
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

export function getDurationMinutes(event) {
  const raw = String(event?.duration || '').trim();
  if (/^\d+$/.test(raw)) return Math.max(1, Number(raw));
  const hours = Number(raw.match(/(\d+)\s*ч/)?.[1] || 0);
  const minutes = Number(raw.match(/(\d+)\s*мин/)?.[1] || 0);
  const parsed = hours * 60 + minutes;
  return parsed > 0 ? parsed : DEFAULT_DURATION_MINUTES;
}

export function buildPlanCandidates(events, {
  city,
  date,
  days = 1,
  budget = 'any',
  maxDistanceKm = null,
  center = null,
  now = new Date(),
}) {
  const normalizedCity = String(city || '').trim().toLocaleLowerCase('ru-RU');
  if (!normalizedCity || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return [];
  const dayCount = Math.max(1, Math.min(7, Number.parseInt(days, 10) || 1));
  const firstDay = new Date(`${date}T00:00:00`);
  if (Number.isNaN(firstDay.getTime())) return [];
  const dateKeys = new Set(
    Array.from({ length: dayCount }, (_, index) => {
      const day = new Date(firstDay);
      day.setDate(day.getDate() + index);
      return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    })
  );
  const radius = Number(maxDistanceKm);
  const hasRadius = Number.isFinite(radius) && radius > 0 && Number.isFinite(center?.lat) && Number.isFinite(center?.lng);

  return events
    .filter((event) => {
      const start = getEventStart(event, now);
      const end = start && start.getTime() + getDurationMinutes(event) * 60_000;
      const eventDate = getEventDateKey(event, now);
      const withinRadius = !hasRadius || (
        event.lat != null &&
        event.lng != null &&
        distanceKm(center.lat, center.lng, Number(event.lat), Number(event.lng)) <= radius
      );
      return (
        String(event.city || '').trim().toLocaleLowerCase('ru-RU') === normalizedCity &&
        dateKeys.has(eventDate) &&
        event.format !== 'Онлайн' &&
        event.district !== 'Онлайн' &&
        start &&
        end > now.getTime() &&
        (budget !== 'free' || event.price === 'Бесплатно') &&
        withinRadius &&
        !(event.maxParticipants && event.participants >= event.maxParticipants)
      );
    })
    .sort((left, right) => getEventStart(left, now) - getEventStart(right, now))
    .slice(0, 100)
    .map((event) => ({
      id: event.id,
      date: getEventDateKey(event, now),
      title: String(event.title || '').slice(0, 160),
      category: String(event.category || '').slice(0, 60),
      description: String(event.description || '').slice(0, 240),
      startAt: getEventStart(event, now).toISOString(),
      durationMinutes: getDurationMinutes(event),
      price: String(event.price || ''),
      address: String(event.address || event.district || '').slice(0, 160),
      lat: Number.isFinite(Number(event.lat)) ? Number(event.lat) : null,
      lng: Number.isFinite(Number(event.lng)) ? Number(event.lng) : null,
      participants: Number(event.participants) || 0,
      maxParticipants: Number(event.maxParticipants) || null,
    }));
}

export function validateGeneratedPlan(plan, candidates) {
  if (!plan || !Array.isArray(plan.eventIds)) {
    throw new Error('Модель вернула некорректный план');
  }

  const candidatesById = new Map(candidates.map((event) => [String(event.id), event]));
  const uniqueEvents = [];
  const seen = new Set();
  for (const id of plan.eventIds) {
    const key = String(id);
    if (seen.has(key) || !candidatesById.has(key)) continue;
    seen.add(key);
    uniqueEvents.push(candidatesById.get(key));
    if (uniqueEvents.length >= MAX_PLAN_EVENTS) break;
  }

  uniqueEvents.sort((left, right) => new Date(left.startAt) - new Date(right.startAt));
  const scheduled = [];
  let lastEnd = -Infinity;
  let previousEvent = null;
  for (const event of uniqueEvents) {
    const start = new Date(event.startAt).getTime();
    const end = start + event.durationMinutes * 60_000;
    const sameDay = previousEvent?.date === event.date;
    const transferTime = previousEvent && sameDay
      ? estimateTransferMinutes(previousEvent, event) * 60_000
      : 0;
    if (sameDay && start < lastEnd + transferTime) continue;
    scheduled.push(event);
    lastEnd = end;
    previousEvent = event;
  }

  if (!scheduled.length) throw new Error('Не удалось подобрать события без пересечения по времени');

  return {
    events: scheduled,
  };
}

export function validateGeneratedOptions(response, candidates) {
  if (!response || !Array.isArray(response.options)) {
    throw new Error('Модель вернула некорректные варианты маршрута');
  }

  const options = [];
  const signatures = new Set();
  for (const [index, option] of response.options.entries()) {
    try {
      const plan = validateGeneratedPlan(option, candidates);
      const signature = plan.events.map((event) => String(event.id)).join(',');
      if (signatures.has(signature)) continue;
      signatures.add(signature);
      options.push({
        id: `route-${index + 1}`,
        title: String(option.title || `Вариант ${index + 1}`).trim().slice(0, 60),
        events: plan.events,
      });
    } catch {}
    if (options.length === 2) break;
  }

  if (options.length < 2) {
    throw new Error('Не удалось составить два разных маршрута. Попробуйте изменить пожелания, бюджет или радиус поиска.');
  }
  return options;
}

export function createPlanSummary(events) {
  const count = events.length;
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  const noun = remainder100 >= 11 && remainder100 <= 14
    ? 'событий'
    : remainder10 === 1
      ? 'событие'
      : remainder10 >= 2 && remainder10 <= 4
        ? 'события'
        : 'событий';
  const titles = events.map((event) => `«${event.title}»`).join(' → ');
  return `Вариант маршрута: ${count} ${noun}. ${titles}`;
}

export function parseModelPlan(content) {
  const raw = String(content || '').trim().replace(/^```(?:json)?\s*|\s*```$/gi, '');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Не удалось прочитать ответ планировщика');
  }
}

function estimateTransferMinutes(from, to) {
  const hasCoordinates = [from.lat, from.lng, to.lat, to.lng].every(Number.isFinite);
  if (!hasCoordinates) return 30;

  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(longitudeDelta / 2) ** 2;
  const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
  return Math.min(90, 15 + Math.ceil(distanceKm * 4));
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(lat2 - lat1);
  const longitudeDelta = radians(lng2 - lng1);
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}
