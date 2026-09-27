import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeTouristPlan } from './touristPlanData.js';

const database = {
  findEvent: (id) => id === 1 ? { id: 1, title: 'Встреча', organizerId: 'owner' } : null,
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
  assert.equal(plan.selectedOptionId, 'route-1');
});

test('plan persistence rejects unknown event IDs and malformed plans', () => {
  assert.throws(() => sanitizeTouristPlan({ ...validPlan, options: [{ events: [{ id: 999 }] }] }, database), /недоступно/);
  assert.throws(() => sanitizeTouristPlan({ ...validPlan, date: 'tomorrow' }, database), /город и дату/);
});
