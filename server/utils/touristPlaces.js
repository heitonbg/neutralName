const CACHE_TTL_MS = 15 * 60 * 1000;
const SEARCH_RADIUS_METERS = 700;
const MAX_PLACES = 30;
const DEFAULT_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const cache = new Map();

const TYPES = {
  restaurants: ['amenity', /^(restaurant|cafe|fast_food)$/],
  attractions: ['tourism', /^(attraction|museum|gallery|viewpoint)$/],
};

export async function findNearbyTouristPlaces(events, kind = 'both', fetchImpl = fetch, now = Date.now()) {
  const stops = events
    .filter((event) =>
      event.lat != null && event.lng != null && event.lat !== '' && event.lng !== '' &&
      Number.isFinite(Number(event.lat)) && Number.isFinite(Number(event.lng))
    )
    .slice(0, 8)
    .map((event) => ({
      id: event.id,
      lat: Number(event.lat),
      lng: Number(event.lng),
    }));
  if (!stops.length) return [];

  const normalizedKind = ['restaurants', 'attractions'].includes(kind) ? kind : 'both';
  const cacheKey = `${normalizedKind}:${stops.map((stop) => `${stop.lat.toFixed(3)},${stop.lng.toFixed(3)}`).join(';')}`;
  const cached = cache.get(cacheKey);
  if (cached && now - cached.createdAt < CACHE_TTL_MS) return cached.places;

  const filters = normalizedKind === 'both'
    ? Object.values(TYPES)
    : [TYPES[normalizedKind]];
  const queries = stops.flatMap((stop) => filters.map(([tag, values]) => {
    const expression = values.source;
    return `nwr(around:${SEARCH_RADIUS_METERS},${stop.lat},${stop.lng})["${tag}"~"${expression}"];`;
  }));
  if (normalizedKind !== 'restaurants') {
    queries.push(...stops.map((stop) =>
      `nwr(around:${SEARCH_RADIUS_METERS},${stop.lat},${stop.lng})["historic"];`
    ));
  }
  const query = `[out:json][timeout:15];(${queries.join('')});out tags center;`;
  const endpoints = [...new Set([
    process.env.OVERPASS_API_URL,
    ...DEFAULT_ENDPOINTS,
  ].filter(Boolean))];
  let data = null;
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'MAX-Events/1.0 (tourist-route places)',
          Accept: 'application/json',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        const details = (await response.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160);
        throw new Error(`Overpass ${new URL(endpoint).host} returned ${response.status}${details ? `: ${details}` : ''}`);
      }
      data = await response.json();
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!data) throw lastError || new Error('No Overpass endpoint responded');

  const places = [];
  const seen = new Set();
  for (const element of data.elements || []) {
    const tags = element.tags || {};
    const lat = Number(element.lat ?? element.center?.lat);
    const lng = Number(element.lon ?? element.center?.lon);
    const name = String(tags.name || '').trim();
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    let nearest = null;
    for (const stop of stops) {
      const distance = haversineKm(stop.lat, stop.lng, lat, lng);
      if (distance <= SEARCH_RADIUS_METERS / 1000 && (!nearest || distance < nearest.distanceKm)) {
        nearest = { eventId: stop.id, distanceKm: distance };
      }
    }
    if (!nearest) continue;

    const key = String(element.id);
    if (seen.has(key)) continue;
    seen.add(key);
    const attraction = Boolean(tags.tourism || tags.historic);
    const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', ');
    places.push({
      id: `osm-${key}`,
      name,
      kind: attraction ? 'attraction' : 'restaurant',
      kindLabel: attraction ? 'Достопримечательность' : 'Еда и напитки',
      lat,
      lng,
      address: street || String(tags['addr:place'] || ''),
      eventId: nearest.eventId,
      distanceKm: Math.round(nearest.distanceKm * 100) / 100,
      source: 'OpenStreetMap',
    });
  }

  places.sort((left, right) => left.distanceKm - right.distanceKm);
  const result = places.slice(0, MAX_PLACES);
  cache.set(cacheKey, { createdAt: now, places: result });
  return result;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(lat2 - lat1);
  const longitudeDelta = radians(lng2 - lng1);
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}
