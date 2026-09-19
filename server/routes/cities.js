import express from 'express';

const router = express.Router();

// ============================================
// Кэш поиска городов
// ============================================
const searchCache = new Map(); // query → { data, ts }
const CACHE_TTL = 60 * 60 * 1000; // 1 час
const MAX_CACHE_SIZE = 500;

function getCached(key) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
  searchCache.set(key, { data, ts: Date.now() });
}

// ============================================
// DaData — города СНГ
// ============================================
async function searchWithDaData(query) {
  const token = process.env.DADATA_TOKEN;
  if (!token) return [];

  try {
    const response = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({
          query,
          count: 10,
          from_bound: { value: 'city' },
          to_bound: { value: 'city' },
          locations: [
            { country: 'Россия' },
            { country: 'Казахстан' },
            { country: 'Беларусь' },
            { country: 'Украина' },
            { country: 'Узбекистан' },
            { country: 'Кыргызстан' },
            { country: 'Таджикистан' },
            { country: 'Армения' },
            { country: 'Азербайджан' },
            { country: 'Молдова' }
          ]
        })
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.suggestions || [])
      .filter((s) => s.data?.geo_lat && s.data?.geo_lon)
      .map((s) => ({
        name: s.value,
        lat: parseFloat(s.data.geo_lat),
        lng: parseFloat(s.data.geo_lon),
        country: s.data.country || '',
        source: 'dadata'
      }));
  } catch (e) {
    console.warn('DaData error:', e.message);
    return [];
  }
}

// ============================================
// Nominatim — резерв
// ============================================
async function searchWithNominatim(query) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '10');
    url.searchParams.set('featuretype', 'settlement');
    url.searchParams.set('accept-language', 'ru');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MAX-Events-Hackathon/1.0',
        Accept: 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data
      .filter((item) => item.lat && item.lon)
      .map((item) => ({
        name:
          item.display_name?.split(',').slice(0, 2).join(',').trim() ||
          item.name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        country: item.address?.country || '',
        source: 'nominatim'
      }));
  } catch (e) {
    console.warn('Nominatim error:', e.message);
    return [];
  }
}

// ============================================
// GET /api/cities/search?q=мос
// ============================================
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ cities: [], sources: [] });
  }

  const query = q.trim().toLowerCase();
  const cached = getCached(query);
  if (cached) return res.json(cached);

  const sources = [];
  const [dadataResults, nominatimResults] = await Promise.all([
    searchWithDaData(q.trim()),
    searchWithNominatim(q.trim())
  ]);

  if (dadataResults.length) sources.push('dadata');
  if (nominatimResults.length) sources.push('nominatim');

  const merged = [...dadataResults];
  const existingNames = new Set(dadataResults.map((c) => c.name.toLowerCase()));

  for (const city of nominatimResults) {
    const key = city.name.toLowerCase();
    if (!existingNames.has(key)) {
      merged.push(city);
      existingNames.add(key);
    }
  }

  const result = { cities: merged.slice(0, 15), sources };
  setCache(query, result);
  res.json(result);
});

// ============================================
// GET /api/cities/reverse?lat=...&lng=...
// ============================================
router.get('/reverse', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat и lng обязательны' });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return res.status(400).json({ error: 'Некорректные координаты' });
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(latNum));
    url.searchParams.set('lon', String(lngNum));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'ru');
    url.searchParams.set('zoom', '14');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MAX-Events-Hackathon/1.0',
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Nominatim error' });
    }

    const data = await response.json();
    const addr = data.address || {};

    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || '';
    const district =
      addr.suburb || addr.city_district || addr.county || addr.district || '';
    const street = addr.road || '';
    const houseNumber = addr.house_number || '';
    const country = addr.country || '';

    const streetFull = [street, houseNumber].filter(Boolean).join(', ');

    res.json({
      city,
      district,
      street: streetFull,
      country,
      displayName: data.display_name || '',
      lat: latNum,
      lng: lngNum
    });
  } catch (e) {
    console.error('Reverse geocoding error:', e);
    res.status(500).json({ error: 'Не удалось определить адрес' });
  }
});

export default router;