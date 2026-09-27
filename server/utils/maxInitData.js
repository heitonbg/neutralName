import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyMaxInitData(initData, botToken, {
  now = Date.now(),
  maxAgeSeconds = 60 * 60,
  onFailure,
} = {}) {
  const reject = (reason) => {
    onFailure?.(reason);
    return null;
  };
  if (!botToken) return reject('bot_token_missing');
  if (typeof initData !== 'string' || !initData || initData.length > 8192) return reject('init_data_missing_or_invalid');

  const entries = [];
  const keys = new Set();
  try {
    for (const part of initData.split('&')) {
      const separator = part.indexOf('=');
      if (separator <= 0) return reject('malformed_parameter');
      const key = decodeURIComponent(part.slice(0, separator));
      const value = decodeURIComponent(part.slice(separator + 1));
      if (!key || keys.has(key)) return reject('duplicate_or_empty_parameter');
      keys.add(key);
      entries.push([key, value]);
    }
  } catch {
    return reject('parameter_decode_failed');
  }

  const hashes = entries.filter(([key]) => key === 'hash');
  const authDates = entries.filter(([key]) => key === 'auth_date');
  const userEntries = entries.filter(([key]) => key === 'user');
  if (hashes.length !== 1 || authDates.length !== 1 || userEntries.length !== 1) return reject('required_parameter_missing');

  const providedHash = hashes[0][1];
  if (!/^[a-f0-9]{64}$/i.test(providedHash)) return reject('hash_format_invalid');

  const authDate = Number(authDates[0][1]);
  const nowSeconds = Math.floor(now / 1000);
  if (!Number.isInteger(authDate) || authDate > nowSeconds + 60 || nowSeconds - authDate > maxAgeSeconds) {
    return reject('auth_date_expired_or_invalid');
  }

  const dataCheckString = entries
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const expectedHash = Buffer.from(providedHash, 'hex');
  if (expectedHash.length !== calculatedHash.length || !timingSafeEqual(expectedHash, calculatedHash)) {
    return reject('signature_mismatch');
  }

  try {
    const user = JSON.parse(userEntries[0][1]);
    if (!user || !Number.isSafeInteger(Number(user.id)) || Number(user.id) <= 0) return reject('user_invalid');
    return { ...user, id: String(user.id), authDate };
  } catch {
    return reject('user_parse_failed');
  }
}

// Фабрика вместо одного жёстко заданного middleware: разным роутам нужен
// разный "срок годности" initData. Дефолт 1 час унаследован от конвенции
// Telegram Mini Apps, но сценарии вроде туристического планировщика держат
// мини-апп открытым часами (пользователь гуляет по городу), поэтому им
// нужно окно пошире — см. createMaxAuthMiddleware({ maxAgeSeconds }).
export function createMaxAuthMiddleware({ maxAgeSeconds = 60 * 60 } = {}) {
  return function requireMaxUser(req, res, next) {
    const authorization = String(req.get('authorization') || '');
    const match = authorization.match(/^tma\s+(.+)$/i);
    if (!match) {
      console.warn('MAX tourist auth rejected: init_data_header_missing');
      return res.status(401).json({
        error: 'Подтвердите вход через MAX и повторите попытку.',
        code: 'MAX_AUTH_HEADER_MISSING',
      });
    }
    let reason = 'init_data_invalid';
    const user = verifyMaxInitData(match[1], process.env.BOT_TOKEN, {
      maxAgeSeconds,
      onFailure: (failureReason) => {
        reason = failureReason;
        console.warn('MAX tourist auth rejected:', failureReason);
      },
    });
    if (!user) {
      return res.status(401).json({
        error: 'Подтвердите вход через MAX и повторите попытку.',
        code: `MAX_AUTH_${reason.toUpperCase()}`,
      });
    }
    req.maxUser = user;
    next();
  };
}

export const requireMaxUser = createMaxAuthMiddleware();
