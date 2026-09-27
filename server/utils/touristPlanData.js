import { normalizeRouteEvents } from './touristPlanning.js';

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
    const loadedEvents = option.events.map(({ id }) => {
      const eventId = Number(id);
      if (!Number.isSafeInteger(eventId)) throw new Error('В маршруте есть некорректное событие');
      const event = db.findEvent(eventId);
      if (!event) throw new Error('Одно из событий маршрута больше недоступно');
      return db.hydrateEvent(event);
    });
    const uniqueEvents = [...new Map(loadedEvents.map((event) => [String(event.id), event])).values()];
    const events = normalizeRouteEvents(uniqueEvents);
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
        kind: ['attraction', 'hotel', 'street', 'shop'].includes(place.kind) ? place.kind : 'restaurant',
        kindLabel: ({
          attraction: 'Достопримечательность',
          hotel: 'Отель',
          street: 'Пешеходная улица или маршрут',
          shop: 'Магазин или пекарня',
          restaurant: 'Ресторан или кафе',
        })[place.kind] || 'Ресторан или кафе',
        lat: Number(place.lat),
        lng: Number(place.lng),
        address: String(place.address || '').slice(0, 160),
        eventId: Number(place.eventId),
        distanceKm: Number.isFinite(Number(place.distanceKm))
          ? Math.max(0, Math.min(10, Number(place.distanceKm)))
          : 0,
        durationMinutes: [30, 45, 60, 90, 120].includes(Number(place.durationMinutes))
          ? Number(place.durationMinutes)
          : ['attraction', 'street'].includes(place.kind) ? 60 : 45,
        source: 'OpenStreetMap',
      }));
    const customStops = (Array.isArray(option.customStops) ? option.customStops : [])
      .slice(0, MAX_PLACES_PER_OPTION)
      .filter((stop) => {
        const lat = Number(stop?.lat);
        const lng = Number(stop?.lng);
        return stop && typeof stop.name === 'string' && stop.name.trim() &&
          Number.isFinite(lat) && Number.isFinite(lng) &&
          lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      })
      .map((stop) => ({
        id: String(stop.id || '').slice(0, 80),
        name: stop.name.trim().slice(0, 120),
        kind: 'custom',
        kindLabel: String(stop.kindLabel || 'Моя остановка').slice(0, 80),
        lat: Number(stop.lat),
        lng: Number(stop.lng),
        address: String(stop.address || '').slice(0, 200),
        durationMinutes: [30, 45, 60, 90, 120].includes(Number(stop.durationMinutes))
          ? Number(stop.durationMinutes)
          : 45,
        source: 'manual',
        source: stop.source === 'OpenStreetMap' ? 'OpenStreetMap' : 'manual',
      }));
    const allPlaces = [...places, ...customStops];
    const eventKeys = events.map((event) => `event:${event.id}`);
    const eventKeySet = new Set(eventKeys);
    const placeKeySet = new Set(allPlaces.map((place) =>
      `${place.kind === 'custom' ? 'custom' : 'place'}:${place.id}`
    ));
    const storedEventOrder = Array.isArray(option.stopOrder)
      ? option.stopOrder.filter((key) => eventKeySet.has(key))
      : [];
    const canUseSavedOrder = storedEventOrder.length === eventKeys.length &&
      storedEventOrder.every((key, eventIndex) => key === eventKeys[eventIndex]);
    const storedPlaceOrder = canUseSavedOrder && Array.isArray(option.stopOrder)
      ? option.stopOrder.filter((key) => placeKeySet.has(key))
      : [];
    const orderedPlaces = [
      ...storedPlaceOrder.map((key) => allPlaces.find((place) =>
        `${place.kind === 'custom' ? 'custom' : 'place'}:${place.id}` === key
      )).filter(Boolean),
      ...allPlaces.filter((place) => !storedPlaceOrder.includes(
        `${place.kind === 'custom' ? 'custom' : 'place'}:${place.id}`
      )),
    ];
    const placeSlots = new Map();
    if (canUseSavedOrder) {
      let slot = 0;
      for (const key of option.stopOrder) {
        if (eventKeySet.has(key)) slot = Math.min(slot + 1, events.length);
        else if (placeKeySet.has(key) && !placeSlots.has(key)) placeSlots.set(key, slot);
      }
    }
    const placesBySlot = Array.from({ length: events.length + 1 }, () => []);
    for (const place of orderedPlaces) {
      const placeKey = `${place.kind === 'custom' ? 'custom' : 'place'}:${place.id}`;
      const linkedEventIndex = place.eventId == null
        ? -1
        : events.findIndex((event) => String(event.id) === String(place.eventId));
      const defaultSlot = linkedEventIndex < 0 ? events.length : linkedEventIndex + 1;
      const placeSlot = Math.min(placeSlots.get(placeKey) ?? defaultSlot, events.length);
      placesBySlot[placeSlot].push(placeKey);
    }
    const stopOrder = [];
    for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
      stopOrder.push(...placesBySlot[eventIndex], eventKeys[eventIndex]);
    }
    stopOrder.push(...placesBySlot[events.length]);
    return {
      id: `route-${index + 1}`,
      title: String(option.title || `Вариант ${index + 1}`).trim().slice(0, 60),
      events,
      places,
      customStops,
      stopOrder,
      removedOverlappingEventCount: Math.max(
        Number(option.removedOverlappingEventCount) || 0,
        uniqueEvents.length - events.length
      ),
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
