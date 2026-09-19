// Прокси к KudaGo API — публичный API без ключа
// Документация: https://docs.kudago.com/api/

const KUDAGO_API = 'https://kudago.com/public-api/v1.4';

/**
 * Маппинг категорий KudaGo → наши категории
 */
const CATEGORY_MAP = {
  sport: 'Спорт',
  sport_events: 'Спорт',
  theater: 'Культура',
  exhibition: 'Культура',
  cinema: 'Кино',
  movie: 'Кино',
  concert: 'Музыка',
  festival: 'Музыка',
  party: 'Музыка',
  entertainment: 'Прогулка',
  tour: 'Прогулка',
  quest: 'Прогулка',
  education: 'Культура',
  lecture: 'Культура',
  workshop: 'Другое',
  games: 'Настольные игры',
  board_games: 'Настольные игры'
};

function mapCategory(categories = []) {
  for (const cat of categories) {
    if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat];
  }
  return 'Другое';
}

/**
 * Форматирование даты KudaGo → «Сегодня, 19:00» / «Завтра, 20:00» / «5 мая, 14:00»
 */
function formatDate(unixTimestamp) {
  if (!unixTimestamp) return 'Дата уточняется';
  const date = new Date(unixTimestamp * 1000);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.round((eventDay - today) / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (diffDays === 0) return `Сегодня, ${time}`;
  if (diffDays === 1) return `Завтра, ${time}`;
  if (diffDays === -1) return `Вчера, ${time}`;

  const day = date.getDate();
  const month = date.toLocaleString('ru-RU', { month: 'long' });
  return `${day} ${month}, ${time}`;
}

/**
 * Продолжительность в человекочитаемом виде
 */
function formatDuration(event) {
  if (event.is_endless) return 'Постоянно';

  const dates = event.dates || [];
  const first = dates[0];
  if (!first || !first.start || !first.end) return '';

  const diffSec = first.end - first.start;
  if (diffSec <= 0) return '';
  const hours = Math.round(diffSec / 3600);
  if (hours < 1) {
    const minutes = Math.round(diffSec / 60);
    return `${minutes} мин`;
  }
  if (hours === 1) return '1 час';
  if (hours < 5) return `${hours} часа`;
  return `${hours} часов`;
}

/**
 * Нормализация события KudaGo в формат нашего приложения
 */
export function normalizeKudaGoEvent(raw) {
  const dates = raw.dates || [];
  const first = dates[0] || {};
  const place = raw.place || {};
  const coords = place.coords || {};

  const image =
    raw.images?.[0]?.image ||
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80';

  return {
    id: `kudago-${raw.id}`,
    kudagoId: raw.id,
    title: raw.title || 'Событие',
    description: (raw.description || '').slice(0, 280) || 'Описание уточняется',
    category: mapCategory(raw.categories),
    price: raw.is_free ? 'Бесплатно' : 'Платно',
    date: formatDate(first.start),
    duration: formatDuration(raw),
    eventTime: first.start ? new Date(first.start * 1000).toISOString() : null,
    distance: '',
    participants: 0,
    maxParticipants: 100,
    rating: raw.favorites_count > 0 ? 4.5 : 0,
    reviewsCount: raw.comments_count || 0,
    image,
    images: (raw.images || []).slice(0, 5).map((i) => i.image),
    lat: coords.lat || null,
    lng: coords.lon || null,
    district: place.title || '',
    address: place.address || '',
    source: 'kudago',
    organizer: {
      id: 'kudago',
      name: place.title || 'KudaGo',
      avatar: '🎭'
    }
  };
}

/**
 * Запрос событий у KudaGo
 * @param {string} citySlug — 'msk', 'spb', 'kzn', ...
 * @param {object} opts — { pageSize, actualSince }
 */
export async function fetchKudaGoEvents(citySlug, opts = {}) {
  const { pageSize = 50, actualSince } = opts;

  const params = new URLSearchParams({
    location: citySlug,
    page_size: String(pageSize),
    fields: 'id,title,description,images,dates,place,price,categories,is_free,favorites_count,comments_count',
    expand: 'place,dates',
    order_by: '-publication_date'
  });

  if (actualSince) {
    params.set('actual_since', String(actualSince));
  } else {
    params.set('actual_since', String(Math.floor(Date.now() / 1000)));
  }

  const url = `${KUDAGO_API}/events/?${params.toString()}`;
  console.log('📡 KudaGo fetch:', url);

  const res = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`KudaGo API error: ${res.status}`);
  }

  const data = await res.json();
  const results = data.results || [];

  return results.map(normalizeKudaGoEvent);
}