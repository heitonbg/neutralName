import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { verifyMaxInitData, createMaxAuthMiddleware } from './maxInitData.js';

const BOT_TOKEN = 'test-bot-token';
const NOW = 1_800_000_000_000;

function sign(params) {
  const dataCheckString = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return new URLSearchParams({ ...params, hash }).toString();
}

test('valid MAX launch data verifies and yields the signed user', () => {
  const initData = sign({
    auth_date: String(Math.floor(NOW / 1000) - 60),
    query_id: 'session-1',
    user: JSON.stringify({ id: 12345, first_name: 'Test' }),
  });

  assert.deepEqual(verifyMaxInitData(initData, BOT_TOKEN, { now: NOW }), {
    id: '12345',
    first_name: 'Test',
    authDate: Math.floor(NOW / 1000) - 60,
  });
});

test('MAX launch data rejects altered, duplicate and expired parameters', () => {
  const valid = sign({
    auth_date: String(Math.floor(NOW / 1000) - 60),
    user: JSON.stringify({ id: 12345 }),
  });

  assert.equal(verifyMaxInitData(`${valid}&user=%7B%22id%22%3A999%7D`, BOT_TOKEN, { now: NOW }), null);
  assert.equal(verifyMaxInitData(valid.replace('id%22%3A12345', 'id%22%3A999'), BOT_TOKEN, { now: NOW }), null);
  const expired = sign({
    auth_date: String(Math.floor(NOW / 1000) - 3601),
    user: JSON.stringify({ id: 12345 }),
  });
  assert.equal(verifyMaxInitData(expired, BOT_TOKEN, { now: NOW }), null);
});

test('createMaxAuthMiddleware respects a custom maxAgeSeconds window', () => {
  process.env.BOT_TOKEN = BOT_TOKEN;
  const initData = sign({
    // старше часа, но моложе суток — стандартный requireMaxUser (1 час) должен отклонить,
    // а middleware с окном 24 часа (как у /api/tourist/*) — принять.
    auth_date: String(Math.floor(NOW / 1000) - 2 * 60 * 60),
    user: JSON.stringify({ id: 777 }),
  });
  const req = { get: () => `tma ${initData}`, maxUser: null };
  let statusCode = null;
  let body = null;
  const res = {
    status(code) { statusCode = code; return this; },
    json(payload) { body = payload; return this; },
  };
  let nextCalled = false;

  const shortWindow = createMaxAuthMiddleware(); // дефолт: 1 час
  shortWindow(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);
  assert.match(body.code, /^MAX_AUTH_/);

  nextCalled = false;
  statusCode = null;
  const longWindow = createMaxAuthMiddleware({ maxAgeSeconds: 24 * 60 * 60 });
  const originalNow = Date.now;
  Date.now = () => NOW;
  try {
    longWindow(req, res, () => { nextCalled = true; });
  } finally {
    Date.now = originalNow;
  }
  assert.equal(nextCalled, true);
  assert.equal(req.maxUser.id, '777');
});

test('MAX signature validation follows documented decodeURIComponent handling of plus signs', () => {
  const initData = sign({
    auth_date: String(Math.floor(NOW / 1000) - 60),
    user: JSON.stringify({ id: 12345, first_name: 'Max+User' }),
  });

  assert.equal(verifyMaxInitData(initData, BOT_TOKEN, { now: NOW })?.first_name, 'Max+User');
});
