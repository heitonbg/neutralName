import express from 'express';
import db from '../db/sqliteDatabase.js';
import { findNearbyTouristPlaces } from '../utils/touristPlaces.js';
import { createMaxAuthMiddleware } from '../utils/maxInitData.js';
import { sanitizeTouristPlan } from '../utils/touristPlanData.js';
import {
  buildPlanCandidates,
  createPlanSummary,
  parseModelPlan,
  validateGeneratedOptions,
} from '../utils/touristPlanning.js';

// Планирование маршрута — долгая сессия (пользователь гуляет по городу
// часами), поэтому initData из MAX Bridge может "состариться" сильнее,
// чем стандартный час из конвенции Telegram Mini Apps. Даём 24 часа.
const requireMaxUser = createMaxAuthMiddleware({ maxAgeSeconds: 24 * 60 * 60 });

const router = express.Router();
const requestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 5;

router.get('/plans', requireMaxUser, (req, res) => {
  res.json({ plans: db.getTouristPlans(req.maxUser.id) });
});

router.put('/plans', requireMaxUser, (req, res) => {
  try {
    const plan = sanitizeTouristPlan(req.body?.plan, db);
    res.json({ plan: db.saveTouristPlan(req.maxUser.id, plan) });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Некорректный маршрут' });
  }
});

router.delete('/plans', requireMaxUser, (req, res) => {
  const city = String(req.body?.city || '').trim().slice(0, 80);
  const date = String(req.body?.date || '');
  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Укажите город и дату удаляемого маршрута' });
  }
  db.deleteTouristPlan(req.maxUser.id, city, date);
  res.status(204).end();
});

router.post('/places', async (req, res) => {
  const eventIds = [...new Set(Array.isArray(req.body?.eventIds) ? req.body.eventIds : [])]
    .slice(0, 8)
    .map((id) => Number(id))
    .filter(Number.isSafeInteger);
  if (!eventIds.length) return res.status(400).json({ error: 'Не выбраны события маршрута' });

  const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:places`;
  const now = Date.now();
  const recentRequests = (requestLog.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  if (recentRequests.length >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Слишком много запросов поиска мест. Попробуйте позже.' });
  }
  requestLog.set(key, [...recentRequests, now]);

  const events = eventIds.map((id) => db.findEvent(id)).filter(Boolean);
  if (!events.length) return res.status(404).json({ error: 'События маршрута не найдены' });

  try {
    const places = await findNearbyTouristPlaces(events, req.body?.kind);
    res.json({ places });
  } catch (error) {
    console.warn('Tourist places lookup failed:', error.message);
    const status = error.name === 'TimeoutError' ? 504 : 502;
    res.status(status).json({ error: 'Не удалось загрузить места поблизости. Попробуйте позже.' });
  }
});

router.post('/recommendations', async (req, res) => {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey || !model) {
    return res.status(503).json({ error: 'AI-рекомендации мест не настроены на сервере' });
  }

  const eventIds = [...new Set(Array.isArray(req.body?.eventIds) ? req.body.eventIds : [])]
    .slice(0, 8)
    .map(Number)
    .filter(Number.isSafeInteger);
  if (!eventIds.length) return res.status(400).json({ error: 'Не выбраны события маршрута' });

  const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:recommendations`;
  const now = Date.now();
  const requests = (requestLog.get(key) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (requests.length >= 3) {
    return res.status(429).json({ error: 'Слишком много запросов рекомендаций. Попробуйте позже.' });
  }
  requestLog.set(key, [...requests, now]);

  const events = eventIds.map((id) => db.findEvent(id)).filter(Boolean);
  if (!events.length) return res.status(404).json({ error: 'События маршрута не найдены' });
  const kind = ['restaurants', 'attractions'].includes(req.body?.kind) ? req.body.kind : 'both';

  try {
    const candidates = await findNearbyTouristPlaces(events, kind);
    if (!candidates.length) return res.json({ places: [] });

    const response = await fetch(
      process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.WEB_APP_URL || 'https://webtomax.vercel.app',
          'X-OpenRouter-Title': 'Вместе',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'Ты городской гид. Отвечай только JSON, не выдумывай места и факты.' },
            {
              role: 'user',
              content: [
                'Выбери до 6 наиболее уместных дополнительных мест для прогулочного маршрута.',
                'Используй только кандидатов ниже. Для каждого верни его id и короткую причину рекомендации на русском.',
                'Формат: {"recommendations":[{"id":"...","reason":"..."}]}.',
                `Тип: ${kind === 'restaurants' ? 'еда' : kind === 'attractions' ? 'достопримечательности' : 'еда и достопримечательности'}.`,
                `Маршрут: ${JSON.stringify(events.map((event) => ({ title: event.title, category: event.category, address: event.address || event.district })))}`,
                `Реальные места OpenStreetMap: ${JSON.stringify(candidates.map(({ id, name, kindLabel, address, distanceKm, eventId }) => ({ id, name, kindLabel, address, distanceKm, eventId })))}`,
              ].join('\n'),
            },
          ],
        }),
        signal: AbortSignal.timeout(18_000),
      }
    );
    if (!response.ok) {
      const providerError = await response.json().catch(() => null);
      const providerMessage = String(providerError?.error?.message || '').replace(/\s+/g, ' ').slice(0, 180);
      console.warn('AI recommendations provider rejected request:', {
        status: response.status,
        model,
        message: providerMessage,
      });
      const message = response.status === 401 || response.status === 403
        ? 'AI-провайдер отклонил API-ключ. Проверь AI_API_KEY на Amvera.'
        : response.status === 402
          ? 'У AI-провайдера закончился баланс или бесплатный лимит.'
          : response.status === 404
            ? 'AI-модель не найдена. Проверь AI_MODEL на Amvera.'
            : response.status === 429
              ? 'AI-провайдер ограничил частоту запросов. Попробуй позже.'
              : `AI-провайдер временно недоступен (${response.status}).${providerMessage ? ` ${providerMessage}` : ''}`;
      return res.status(502).json({ error: message });
    }

    const result = await response.json();
    const recommendations = parseModelPlan(result.choices?.[0]?.message?.content);
    const candidatesById = new Map(candidates.map((place) => [place.id, place]));
    const places = [];
    for (const item of Array.isArray(recommendations.recommendations) ? recommendations.recommendations : []) {
      const place = candidatesById.get(String(item.id));
      if (!place || places.some((selected) => selected.id === place.id)) continue;
      places.push({ ...place, recommendationReason: String(item.reason || '').trim().slice(0, 180) });
      if (places.length === 6) break;
    }
    res.json({ places });
  } catch (error) {
    console.warn('Tourist place recommendations failed:', error.message);
    const status = error.name === 'TimeoutError' ? 504 : 502;
    const detail = error.name === 'TimeoutError'
      ? 'Запрос занял слишком много времени. Попробуй ещё раз.'
      : String(error.message || '').replace(/\s+/g, ' ').slice(0, 180);
    res.status(status).json({ error: `Не удалось получить AI-рекомендации.${detail ? ` ${detail}` : ''}` });
  }
});

router.post('/search-places', async (req, res) => {
  const query = String(req.body?.query || '').trim().slice(0, 120);
  const eventIds = [...new Set(Array.isArray(req.body?.eventIds) ? req.body.eventIds : [])]
    .slice(0, 8)
    .map(Number)
    .filter(Number.isSafeInteger);
  if (query.length < 2) return res.status(400).json({ error: 'Введи хотя бы две буквы для поиска' });
  if (!eventIds.length) return res.status(400).json({ error: 'В маршруте нет событий для определения района поиска' });

  const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:place-search`;
  const now = Date.now();
  const requests = (requestLog.get(key) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (requests.length >= 8) return res.status(429).json({ error: 'Слишком много поисковых запросов. Попробуй позже.' });
  requestLog.set(key, [...requests, now]);

  const events = eventIds.map((id) => db.findEvent(id)).filter(Boolean);
  const locatedEvents = events.filter((event) => Number.isFinite(Number(event.lat)) && Number.isFinite(Number(event.lng)));
  if (!locatedEvents.length) return res.json({ places: [] });

  const latitudes = locatedEvents.map((event) => Number(event.lat));
  const longitudes = locatedEvents.map((event) => Number(event.lng));
  const padding = 0.045;
  const viewbox = [
    Math.min(...longitudes) - padding,
    Math.max(...latitudes) + padding,
    Math.max(...longitudes) + padding,
    Math.min(...latitudes) - padding,
  ];
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', `${query}, ${events[0].city || ''}`);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('extratags', '1');
    url.searchParams.set('namedetails', '1');
    url.searchParams.set('limit', '10');
    url.searchParams.set('bounded', '1');
    url.searchParams.set('viewbox', viewbox.join(','));
    url.searchParams.set('accept-language', 'ru');
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MAX-Events-Hackathon/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return res.status(502).json({ error: 'OpenStreetMap не выполнил поиск' });

    const results = await response.json();
    const places = results
      .filter((item) => item.lat && item.lon)
      .map((item) => {
        const tags = item.extratags || {};
        const kindLabel = item.type === 'hotel' || item.type === 'hostel' || tags.tourism === 'hotel'
          ? 'Отель'
          : item.class === 'highway'
            ? 'Улица или пешеходный маршрут'
            : item.class === 'tourism' || item.class === 'historic'
              ? 'Достопримечательность'
              : item.class === 'amenity' && /restaurant|cafe|bar|pub|fast_food/.test(item.type)
                ? 'Ресторан или кафе'
                : item.class === 'shop'
                  ? 'Магазин'
                  : 'Место';
        return {
          id: `nominatim-${item.osm_type}-${item.osm_id}`,
          name: item.name || item.namedetails?.name || item.display_name?.split(',')[0] || query,
          kind: 'custom',
          kindLabel,
          address: item.display_name || '',
          lat: Number(item.lat),
          lng: Number(item.lon),
          durationMinutes: 45,
          source: 'OpenStreetMap',
        };
      });
    res.json({ places });
  } catch (error) {
    const status = error.name === 'TimeoutError' ? 504 : 502;
    res.status(status).json({ error: 'Не удалось выполнить поиск в OpenStreetMap' });
  }
});

router.post('/plan', async (req, res) => {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey || !model) {
    return res.status(503).json({ error: 'AI-планировщик не настроен на сервере' });
  }

  const city = String(req.body?.city || '').trim().slice(0, 80);
  const date = String(req.body?.date || '');
  const query = String(req.body?.query || '').trim().slice(0, 500);
  const days = Math.max(1, Math.min(7, Number.parseInt(req.body?.days, 10) || 1));
  const interests = Array.isArray(req.body?.interests)
    ? [...new Set(req.body.interests.map((item) => String(item).slice(0, 50)))].slice(0, 8)
    : [];
  const budget = req.body?.budget === 'free' ? 'free' : 'any';
  const allowedRadii = new Set([1, 3, 5, 10]);
  const requestedRadius = Number(req.body?.maxDistanceKm);
  const maxDistanceKm = allowedRadii.has(requestedRadius) ? requestedRadius : null;
  const center = {
    lat: Number(req.body?.center?.lat),
    lng: Number(req.body?.center?.lng),
  };
  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Укажите город и дату начала поездки' });
  }
  if (maxDistanceKm && (!Number.isFinite(center.lat) || !Number.isFinite(center.lng))) {
    return res.status(400).json({ error: 'Для радиуса поиска нужны координаты центра города' });
  }

  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const recentRequests = (requestLog.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  if (recentRequests.length >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Слишком много запросов. Попробуйте через минуту.' });
  }
  requestLog.set(key, [...recentRequests, now]);
  if (requestLog.size > 1000) {
    for (const [ip, timestamps] of requestLog) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)) {
        requestLog.delete(ip);
      }
    }
  }

  const candidates = buildPlanCandidates(db.events, {
    city,
    date,
    days,
    budget,
    maxDistanceKm,
    center,
    now: new Date(now),
  });
  if (!candidates.length) {
    return res.status(422).json({ error: 'По этим параметрам не нашлось свободных офлайн-событий' });
  }

  const prompt = [
    'Ты составляешь два альтернативных плана поездки только из переданных событий.',
    'Не придумывай места, события, время и адреса. Не добавляй ID, которых нет в списке.',
    'Учитывай интересы, бюджет, расстояние, дату и длительность поездки. Варианты должны отличаться набором событий.',
    'Не ставь события одновременно; порядок eventIds не важен, сервер перепроверит расписание и время на переезд.',
    'Верни только JSON вида {"options":[{"title":"...","eventIds":[1,2]},{"title":"...","eventIds":[3,4]}]}.',
    `Город: ${city}`,
    `Дата начала: ${date}`,
    `Дней в поездке: ${days}`,
    `Интересы: ${interests.join(', ') || 'любые'}`,
    `Бюджет: ${budget === 'free' ? 'только бесплатные события' : 'любые категории стоимости'}`,
    `Максимальный радиус от центра: ${maxDistanceKm ? `${maxDistanceKm} км` : 'без ограничения'}`,
    `Дополнительные пожелания: ${query || 'нет'}`,
    `Доступные реальные события: ${JSON.stringify(candidates)}`,
  ].join('\n');

  try {
    const response = await fetch(
      process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.WEB_APP_URL || 'https://webtomax.vercel.app',
          'X-OpenRouter-Title': 'Вместе',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'Ты помощник туриста. Следуй ограничениям и отвечай только JSON.' },
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(25_000),
      }
    );

    if (!response.ok) {
      const providerError = await response.json().catch(() => null);
      const providerCode = String(providerError?.error?.code || '').slice(0, 80);
      const providerMessage = String(providerError?.error?.message || '').slice(0, 240);
      console.warn('AI planner provider rejected request:', {
        status: response.status,
        model,
        code: providerCode,
        message: providerMessage,
      });

      const userMessage =
        response.status === 401 || response.status === 403
          ? 'OpenRouter не принял API-ключ. Проверьте AI_API_KEY в настройках сервера.'
          : response.status === 402
            ? 'У OpenRouter недостаточно средств или кредитов для этого запроса.'
            : response.status === 404
              ? 'Модель не найдена в OpenRouter. Проверьте AI_MODEL.'
              : response.status === 429
                ? 'OpenRouter ограничил частоту запросов. Попробуйте позже.'
                : 'OpenRouter временно не выполнил запрос. Подробности доступны в логах сервера.';
      return res.status(502).json({ error: userMessage });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    const modelPlan = parseModelPlan(content);
    if (!Array.isArray(modelPlan.options) || modelPlan.options.length < 2) {
      return res.status(422).json({
        error: 'Не удалось составить два варианта. Попробуйте изменить параметры поездки.',
      });
    }
    let options;
    try {
      options = validateGeneratedOptions(modelPlan, candidates);
    } catch (error) {
      return res.status(422).json({ error: error.message });
    }
    res.json({
      options: options.map((option) => ({
        ...option,
        summary: createPlanSummary(option.events),
        events: option.events.map((event) => db.hydrateEvent(db.findEvent(event.id))),
      })),
    });
  } catch (error) {
    console.warn('AI planner error:', error.message);
    const status = error.name === 'TimeoutError' ? 504 : 502;
    res.status(status).json({ error: 'Не удалось составить план. Попробуйте ещё раз.' });
  }
});

export default router;