import { normalizeTouristOption } from '../../utils/touristMapLinks.js';

export const INTERESTS = ['Культура', 'Спорт', 'Кино', 'Прогулка', 'Музыка', 'Настольные игры'];

export const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDay = (event) => {
  const date = event.startAt ? new Date(event.startAt) : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
    : String(event.date || '').split(',')[0];
};

export const formatTimeInput = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export const formatPlanSummary = (events) => {
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
  return `Маршрут: ${count} ${noun}`;
};

export const formatOptionsCount = (count) => {
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  const noun = remainder100 >= 11 && remainder100 <= 14
    ? 'вариантов'
    : remainder10 === 1
      ? 'вариант'
      : remainder10 >= 2 && remainder10 <= 4
        ? 'варианта'
        : 'вариантов';
  return `${count} ${noun} поездки`;
};

export const mergeSavedRoute = (localPlan, serverPlan) => ({
  ...localPlan,
  ...serverPlan,
  options: (serverPlan.options || []).map((serverOption, index) => {
    const localOption = localPlan.options.find((option) => option.id === serverOption.id)
      || localPlan.options[index];
    const localPlaces = new Map((localOption?.places || []).map((place) => [place.id, place]));
    const customStops = new Map((localOption?.customStops || []).map((stop) => [stop.id, stop]));
    for (const stop of serverOption.customStops || []) {
      customStops.set(stop.id, { ...customStops.get(stop.id), ...stop });
    }
    return {
      ...localOption,
      ...serverOption,
      places: (serverOption.places || localOption?.places || []).map((place) => ({
        ...localPlaces.get(place.id),
        ...place,
        kind: localPlaces.get(place.id)?.kind || place.kind,
        kindLabel: localPlaces.get(place.id)?.kindLabel || place.kindLabel,
        recommendationReason: localPlaces.get(place.id)?.recommendationReason || place.recommendationReason,
        durationMinutes: place.durationMinutes ?? localPlaces.get(place.id)?.durationMinutes ?? 45,
      })),
      customStops: [...customStops.values()],
      stopOrder: localOption?.stopOrder?.length ? localOption.stopOrder : serverOption.stopOrder || [],
      removedOverlappingEventCount: Math.max(
        Number(serverOption.removedOverlappingEventCount) || 0,
        Number(localOption?.removedOverlappingEventCount) || 0
      ),
    };
  }),
});

export const createTouristPlan = (initialPlan) => {
  if (Array.isArray(initialPlan?.options)) {
    const options = initialPlan.options.map(normalizeTouristOption);
    return {
      days: initialPlan.days || 1,
      interests: initialPlan.interests || [],
      budget: initialPlan.budget || 'any',
      maxDistanceKm: initialPlan.maxDistanceKm ?? 5,
      query: initialPlan.query || '',
      ...initialPlan,
      options,
      selectedOptionId: initialPlan.selectedOptionId || options[0]?.id,
    };
  }
  if (Array.isArray(initialPlan?.events) && initialPlan.events.length) {
    const savedOption = normalizeTouristOption({
      id: 'saved-route',
      title: 'Сохранённый маршрут',
      events: initialPlan.events,
    });
    return {
      days: 1,
      interests: [],
      budget: 'any',
      maxDistanceKm: 5,
      query: '',
      ...initialPlan,
      options: [savedOption],
      selectedOptionId: 'saved-route',
    };
  }
  return null;
};
