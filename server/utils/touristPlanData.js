const ALLOWED_RADII = new Set([3, 5, 10]);
const MAX_OPTIONS = 2;
const MAX_EVENTS_PER_OPTION = 8;
const MAX_PLACES_PER_OPTION = 24;

export function sanitizeTouristPlan(input, db) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Некорректный маршрут');
  }

  const city = String(input.city || '').trim().slice(0, 80);
  const date = String(input.date || '');
  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Для сохранения укажите город и дату поездки');
  }
  if (!Array.isArray(input.options) || input.options.length < 1 || input.options.length > MAX_OPTIONS) {
    throw new Error('В маршруте должно быть от одного до двух вариантов');
  }

  const options = input.options.map((option, index) => {
    if (!option || !Array.isArray(option.events) || option.events.length > MAX_EVENTS_PER_OPTION) {
      throw new Error('Вариант маршрута содержит некорректный список событий');
    }
    const events = option.events.map(({ id }) => {
      const eventId = Number(id);
      if (!Number.isSafeInteger(eventId)) throw new Error('В маршруте есть некорректное событие');
      const event = db.findEvent(eventId);
      if (!event) throw new Error('Одно из событий маршрута больше недоступно');
      return db.hydrateEvent(event);
    });
    const eventIds = new Set(events.map((event) => String(event.id)));
    const places = (Array.isArray(option.places) ? option.places : [])
      .slice(0, MAX_PLACES_PER_OPTION)
      .filter((place) => {
        if (!place || !eventIds.has(String(place.eventId))) return false;
        const lat = Number(place.lat);
        const lng = Number(place.lng);
        return place.lat != null && place.lng != null &&
          Number.isFinite(lat) && Number.isFinite(lng) &&
          lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
          typeof place.name === 'string' && place.name.trim();
      })
      .map((place) => ({
        id: String(place.id || '').slice(0, 80),
        name: place.name.trim().slice(0, 120),
        kind: place.kind === 'attraction' ? 'attraction' : 'restaurant',
        kindLabel: place.kind === 'attraction' ? 'Достопримечательность' : 'Еда и напитки',
        lat: Number(place.lat),
        lng: Number(place.lng),
        address: String(place.address || '').slice(0, 160),
        eventId: Number(place.eventId),
        distanceKm: Number.isFinite(Number(place.distanceKm))
          ? Math.max(0, Math.min(10, Number(place.distanceKm)))
          : 0,
        source: 'OpenStreetMap',
      }));
    return {
      id: `route-${index + 1}`,
      title: String(option.title || `Вариант ${index + 1}`).trim().slice(0, 60),
      events,
      places,
    };
  });

  const selectedOptionId = options.some((option) => option.id === input.selectedOptionId)
    ? input.selectedOptionId
    : options[0].id;
  const radius = input.maxDistanceKm == null ? null : Number(input.maxDistanceKm);
  return {
    city,
    date,
    days: Math.max(1, Math.min(7, Number.parseInt(input.days, 10) || 1)),
    interests: Array.isArray(input.interests)
      ? [...new Set(input.interests.filter((item) => typeof item === 'string').map((item) => item.slice(0, 50)))].slice(0, 8)
      : [],
    budget: input.budget === 'free' ? 'free' : 'any',
    maxDistanceKm: ALLOWED_RADII.has(radius) ? radius : null,
    query: String(input.query || '').trim().slice(0, 500),
    options,
    selectedOptionId,
  };
}
