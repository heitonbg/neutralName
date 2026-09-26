import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEventStart, processDueReminders } from './reminderProcessing.js';

test('event start uses the browser-provided absolute timestamp', () => {
  const start = parseEventStart({
    date: '2026-09-27, 19:00',
    startAt: '2026-09-27T16:00:00.000Z',
  });

  assert.equal(start.toISOString(), '2026-09-27T16:00:00.000Z');
});

test('legacy event dates still parse as local date and time', () => {
  const expected = new Date(2026, 8, 27, 19, 0);

  assert.equal(parseEventStart({ date: '2026-09-27, 19:00' }).getTime(), expected.getTime());
});

test('failed reminder delivery stays pending and succeeds on a later retry', async () => {
  const markedSent = new Set();
  const database = {
    getDueReminders: () => markedSent.has('15:user') ? [] : [{ eventId: 15, userId: 'user' }],
    findEvent: () => ({ title: 'Встреча' }),
    isNotificationsEnabled: () => true,
    markReminderSent: (eventId, userId) => markedSent.add(`${eventId}:${userId}`),
  };

  await processDueReminders(database, async () => false);
  assert.equal(markedSent.size, 0);

  let deliveredMessage;
  await processDueReminders(database, async (userId, text) => {
    deliveredMessage = { userId, text };
    return true;
  });

  assert.deepEqual(deliveredMessage, { userId: 'user', text: '⏰ Через час: «Встреча»' });
  assert.equal(markedSent.has('15:user'), true);
});