import assert from 'node:assert/strict';
import test from 'node:test';
import { findNearbyTouristPlaces } from './touristPlaces.js';

const events = [
  { id: 10, lat: 55.8, lng: 49.1 },
  { id: 11, lat: 55.9, lng: 49.2 },
];

const makeResponse = (elements) => ({
  ok: true,
  json: async () => ({ elements }),
});

test('nearby OSM places are categorized and attached to the closest route event', async () => {
  const places = await findNearbyTouristPlaces(events, 'both', async () => makeResponse([
    { type: 'node', id: 1, lat: 55.8005, lon: 49.1005, tags: { name: 'Кафе', amenity: 'cafe' } },
    { type: 'way', id: 2, center: { lat: 55.9004, lon: 49.2004 }, tags: { name: 'Музей', tourism: 'museum' } },
  ]), 100);

  assert.equal(places.length, 2);
  const cafe = places.find((place) => place.kind === 'restaurant');
  const museum = places.find((place) => place.kind === 'attraction');
  assert.equal(cafe.eventId, 10);
  assert.equal(museum.eventId, 11);
  assert.equal(cafe.source, 'OpenStreetMap');
});

test('nearby OSM search includes hotels, pedestrian streets, and bakeries', async () => {
  const places = await findNearbyTouristPlaces([
    { id: 42, lat: 56.1, lng: 50.1 },
  ], 'both', async () => makeResponse([
    { type: 'node', id: 101, lat: 56.1002, lon: 50.1002, tags: { name: 'Гостиница', tourism: 'hotel' } },
    { type: 'way', id: 102, center: { lat: 56.1003, lon: 50.1003 }, tags: { name: 'Пешеходная улица', highway: 'pedestrian' } },
    { type: 'node', id: 103, lat: 56.1004, lon: 50.1004, tags: { name: 'Пекарня', shop: 'bakery' } },
  ]), 500);

  assert.equal(places.find((place) => place.name === 'Гостиница')?.kind, 'hotel');
  assert.equal(places.find((place) => place.name === 'Пешеходная улица')?.kind, 'street');
  assert.equal(places.find((place) => place.name === 'Пекарня')?.kindLabel, 'Магазин или пекарня');
});

test('nearby place lookup caches the same stop and type request', async () => {
  let requests = 0;
  const fetchImpl = async () => {
    requests += 1;
    return makeResponse([{ type: 'node', id: 3, lat: 55.8, lon: 49.1, tags: { name: 'Кафе', amenity: 'cafe' } }]);
  };

  const first = await findNearbyTouristPlaces([events[0]], 'restaurants', fetchImpl, 200);
  const second = await findNearbyTouristPlaces([events[0]], 'restaurants', fetchImpl, 201);

  assert.equal(requests, 1);
  assert.deepEqual(second, first);
});

test('nearby place lookup retries another Overpass instance and sends valid output syntax', async () => {
  const endpoints = [];
  const places = await findNearbyTouristPlaces([events[0]], 'attractions', async (url, options) => {
    endpoints.push(url);
    const query = new URLSearchParams(options.body).get('data');
    assert.match(query, /out tags center;/);
    assert.match(query, /\["historic"\];/);
    if (endpoints.length === 1) {
      return { ok: false, status: 503, text: async () => 'busy' };
    }
    return makeResponse([
      { type: 'node', id: 8, lat: 55.8, lon: 49.1, tags: { name: 'Памятник', historic: 'monument' } },
    ]);
  }, 300);

  assert.equal(endpoints.length, 2);
  assert.equal(places[0].kind, 'attraction');
  assert.equal(places[0].name, 'Памятник');
});

test('events without coordinates do not create a false location at 0,0', async () => {
  let requested = false;
  const places = await findNearbyTouristPlaces([
    { id: 12, lat: null, lng: null },
  ], 'both', async () => {
    requested = true;
    return makeResponse([]);
  }, 400);

  assert.equal(requested, false);
  assert.deepEqual(places, []);
});
