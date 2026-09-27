import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeTouristPlan } from './touristPlanData.js';

const database = {
  findEvent: (id) => id === 1
    ? { id: 1, title: 'Встреча', organizerId: 'owner', date: '2026-09-27, 12:00', duration: '1 ч' }
    : null,
  hydrateEvent: (event) => ({ ...event, organizer: { id: 'owner', name: 'Организатор' } }),
};

const validPlan = {
  city: 'Казань',
  date: '2026-09-27',
  days: 2,
  interests: ['Культура'],
  budget: 'free',
  maxDistanceKm: 5,
  options: [{
    id: 'client-controlled-id',
    title: 'Культурный день',
    events: [{ id: 1, title: 'Поддельное название', lat: 0, lng: 0 }],
    places: [{ id: 'osm-2', name: 'Кафе', kind: 'restaurant', lat: 55.8, lng: 49.1, eventId: 1 }],
  }],
  selectedOptionId: 'client-controlled-id',
};

test('plan persistence accepts current DB events and replaces client event data', () => {
  const plan = sanitizeTouristPlan(validPlan, database);

  assert.equal(plan.options[0].events[0].title, 'Встреча');
  assert.equal(plan.options[0].events[0].organizer.name, 'Организатор');
  assert.equal(plan.options[0].places[0].source, 'OpenStreetMap');
  assert.equal(plan.options[0].places[0].durationMinutes, 45);
  assert.deepEqual(plan.options[0].stopOrder, ['event:1', 'place:osm-2']);
  assert.equal(plan.selectedOptionId, 'route-1');
});

test('plan persistence sorts events, removes overlaps, and keeps safe attached places', () => {
  const events = [
    { id: 1, title: 'Длинное событие', organizerId: 'owner', date: '2026-09-27, 12:00', duration: '3 ч' },
    { id: 2, title: 'Пересечение', organizerId: 'owner', date: '2026-09-27, 13:30', duration: '1 ч' },
    { id: 3, title: 'После', organizerId: 'owner', date: '2026-09-27, 17:00', duration: '1 ч' },
  ];
  const plan = sanitizeTouristPlan({
    ...validPlan,
    options: [{
      events: [{ id: 2 }, { id: 3 }, { id: 1 }],
      places: [
        { id: 'osm-conflict', name: 'Conflict place', kind: 'restaurant', lat: 55.8, lng: 49.1, eventId: 2 },
        { id: 'osm-safe', name: 'Safe place', kind: 'attraction', lat: 55.9, lng: 49.2, eventId: 3, durationMinutes: 90 },
      ],
    }],
  }, {
    findEvent: (id) => events.find((event) => event.id === id),
    hydrateEvent: (event) => event,
  });

  assert.deepEqual(plan.options[0].events.map((event) => event.id), [1, 3]);
  assert.deepEqual(plan.options[0].places.map((place) => place.id), ['osm-safe']);
  assert.equal(plan.options[0].places[0].durationMinutes, 90);
  assert.equal(plan.options[0].removedOverlappingEventCount, 1);
});

test('plan persistence retains manual stop category and OSM source', () => {
  const plan = sanitizeTouristPlan({
    ...validPlan,
    options: [{
      events: [{ id: 1 }],
      places: [],
      customStops: [{
        id: 'custom-nominatim-hotel-1',
        name: 'Гостиница',
        kindLabel: 'Отель',
        source: 'OpenStreetMap',
        address: 'Казань, Кремлёвская улица',
        lat: 55.8,
        lng: 49.1,
        durationMinutes: 60,
      }],
      stopOrder: ['event:1', 'custom:custom-nominatim-hotel-1'],
    }],
  }, database);

  assert.equal(plan.options[0].customStops[0].kind, 'custom');
  assert.equal(plan.options[0].customStops[0].kindLabel, 'Отель');
  assert.equal(plan.options[0].customStops[0].source, 'OpenStreetMap');
  assert.deepEqual(plan.options[0].stopOrder, ['event:1', 'custom:custom-nominatim-hotel-1']);
});

test('plan persistence rejects unknown event IDs and malformed plans', () => {
  assert.throws(() => sanitizeTouristPlan({ ...validPlan, options: [{ events: [{ id: 999 }] }] }, database), /недоступно/);
  assert.throws(() => sanitizeTouristPlan({ ...validPlan, date: 'tomorrow' }, database), /город и дату/);
});
