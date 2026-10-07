import { createHmac } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMaxAuthMiddleware, verifyMaxInitData } from './maxInitData.js';

const token = 'test-bot-token';

function createSignedInitData({ id = '12345', authDate = Math.floor(Date.now() / 1000) } = {}) {
  const values = new URLSearchParams({
    auth_date: String(authDate),
    user: JSON.stringify({ id: Number(id), first_name: 'Test' }),
  });
  const dataCheckString = [...values.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(token).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  values.set('hash', hash);
  return values.toString();
}

test('verifyMaxInitData returns the identity from a valid signature', () => {
  const initData = createSignedInitData();

  assert.deepEqual(verifyMaxInitData(initData, token)?.id, '12345');
});

test('verifyMaxInitData rejects a modified identity', () => {
  const initData = createSignedInitData().replace('12345', '99999');

  assert.equal(verifyMaxInitData(initData, token), null);
});

test('verifyMaxInitData rejects expired signed data', () => {
  const initData = createSignedInitData({ authDate: Math.floor(Date.now() / 1000) - 7200 });

  assert.equal(verifyMaxInitData(initData, token), null);
});

test('requireMaxUser rejects missing authorization and attaches verified identity', async () => {
  const previousToken = process.env.BOT_TOKEN;
  process.env.BOT_TOKEN = token;
  const middleware = createMaxAuthMiddleware();
  const initData = createSignedInitData();
  try {
    const missingResponse = {
      statusCode: 0,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(value) {
        this.payload = value;
        return this;
      },
    };
    let nextCalled = false;
    middleware(
      { get: () => '' },
      missingResponse,
      () => {
        nextCalled = true;
      }
    );
    assert.equal(missingResponse.statusCode, 401);
    assert.equal(nextCalled, false);

    const req = { get: () => `tma ${initData}` };
    middleware(req, missingResponse, () => {
      nextCalled = true;
    });
    assert.equal(req.maxUser.id, '12345');
    assert.equal(nextCalled, true);
  } finally {
    if (previousToken === undefined) delete process.env.BOT_TOKEN;
    else process.env.BOT_TOKEN = previousToken;
  }
});
