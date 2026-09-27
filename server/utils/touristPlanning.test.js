import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPlanCandidates,
  createPlanSummary,
  normalizeRouteEvents,
  parseModelPlan,
  validateGeneratedOptions,
  validateGeneratedPlan,
} from './touristPlanning.js';

const now = new Date(2026, 8, 26, 8, 0);
const events = [
  {
    id: 1,
    title: 'Музей',
    city: 'Казань',
    date: '2026-09-26, 10:00',
    startAt: new Date(2026, 8, 26, 10, 0).toISOString(),
    duration: '1 ч',
    price: 'Бесплатно',
    participants: 2,
    maxParticipants: 10,
    address: 'Кремль',
    lat: 55.8,
    lng: 49.1,
  },
  {
    id: 2,
    title: 'Прогулка',
    city: 'Казань',
    date: '2026-09-26, 10:30',
    startAt: new Date(2026, 8, 26, 10, 30).toISOString(),
    duration: '1 ч',
    participants: 1,
    maxParticipants: 10,
    address: 'Набережная',
  },
  {
    id: 3,
    title: 'Полная встреча',
    city: 'Казань',
    date: '2026-09-26, 13:00',
    startAt: new Date(2026, 8, 26, 13, 0).toISOString(),
    participants: 10,
    maxParticipants: 10,
  },
  {
    id: 4,
    title: 'Другое место',
    city: 'Москва',
    date: '2026-09-26, 14:00',
    startAt: new Date(2026, 8, 26, 14, 0).toISOString(),
  },
  {
    id: 5,
    title: 'Экскурсия на другом берегу',
    city: 'Казань',
    date: '2026-09-26, 11:10',
    startAt: new Date(2026, 8, 26, 11, 10).toISOString(),
    duration: '1 ч',
    participants: 1,
    maxParticipants: 10,
    lat: 55.9,
    lng: 49.2,
  },
  {
    id: 6,
    title: 'Кино',
    city: 'Казань',
    date: '2026-09-27, 12:00',
    startAt: new Date(2026, 8, 27, 12, 0).toISOString(),
    duration: '2 ч',
    price: 'Бесплатно',
    participants: 2,
    maxParticipants: 10,
    lat: 55.79,
    lng: 49.12,
  },
  {
    id: 7,
    title: 'Платная экскурсия',
    city: 'Казань',
    date: '2026-09-26, 15:00',
    startAt: new Date(2026, 8, 26, 15, 0).toISOString(),
    price: 'Платно',
    participants: 2,
    maxParticipants: 10,
    lat: 55.79,
    lng: 49.12,
  },
];

test('plan candidates are limited to the selected city and date and exclude full/online events', () => {
  const candidates = buildPlanCandidates(events, { city: 'Казань', date: '2026-09-26', now });

  assert.deepEqual(candidates.map((event) => event.id), [1, 2, 5, 7]);
});

test('generated plan leaves time to travel between distant events', () => {
  const candidates = buildPlanCandidates(events, { city: 'Казань', date: '2026-09-26', now });
  const plan = validateGeneratedPlan({ eventIds: [1, 5] }, candidates);

  assert.deepEqual(plan.events.map((event) => event.id), [1]);
});

test('candidate search spans trip days and applies free-budget and center-radius filters', () => {
  const candidates = buildPlanCandidates(events, {
    city: 'Казань',
    date: '2026-09-26',
    days: 2,
    budget: 'free',
    maxDistanceKm: 3,
    center: { lat: 55.8, lng: 49.1 },
    now,
  });

  assert.deepEqual(candidates.map((event) => event.id), [1, 6]);
});

test('two generated options must contain distinct valid itineraries', () => {
  const candidates = buildPlanCandidates(events, { city: 'Казань', date: '2026-09-26', now });
  const options = validateGeneratedOptions({
    options: [
      { title: 'Культура', eventIds: [1] },
      { title: 'Активно', eventIds: [2] },
    ],
  }, candidates);

  assert.deepEqual(options.map((option) => option.events[0].id), [1, 2]);
  assert.throws(() => validateGeneratedOptions({
    options: [{ eventIds: [1] }, { eventIds: [1] }],
  }, candidates), /два разных маршрута/);
});

test('generated plan rejects unknown event IDs and overlapping events', () => {
  const candidates = buildPlanCandidates(events, { city: 'Казань', date: '2026-09-26', now });
  const plan = validateGeneratedPlan({ summary: 'Прогулка', eventIds: [2, 999, 1] }, candidates);

  assert.deepEqual(plan.events.map((event) => event.id), [1]);
  assert.equal('summary' in plan, false);
});

test('route normalization sorts events and removes conflicts in persisted plans', () => {
  const normalized = normalizeRouteEvents([
    { id: 2, date: '2026-09-26', startAt: new Date(2026, 8, 26, 13, 30).toISOString(), durationMinutes: 60 },
    { id: 1, date: '2026-09-26', startAt: new Date(2026, 8, 26, 12, 0).toISOString(), durationMinutes: 180 },
    { id: 3, date: '2026-09-26', startAt: new Date(2026, 8, 26, 16, 0).toISOString(), durationMinutes: 60 },
  ]);

  assert.deepEqual(normalized.map((event) => event.id), [1, 3]);
});

test('model JSON parser accepts a fenced response', () => {
  assert.deepEqual(parseModelPlan('```json\n{"summary":"План","eventIds":[1]}\n```'), {
    summary: 'План',
    eventIds: [1],
  });
});

test('plan summary names and counts exactly the events returned to the client', () => {
  assert.equal(
    createPlanSummary([{ title: 'Йога' }, { title: 'Джаз' }]),
    'Вариант маршрута: 2 события. «Йога» → «Джаз»'
  );
});
