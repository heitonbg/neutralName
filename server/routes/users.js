// server/routes/users.js
import express from 'express';
import db from '../db/sqliteDatabase.js';

const router = express.Router();

function getOrganizerStats(userId) {
  const organizedEvents = db.events.filter(
    (event) => String(event.organizerId ?? event.organizer?.id ?? '') === String(userId)
  );
  const eventIds = new Set(organizedEvents.map((event) => String(event.id)));
  const ratings = db.reviews
    .filter((review) => eventIds.has(String(review.eventId)))
    .map((review) => review.organizerRating)
    .filter((rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5);
  const average = ratings.length
    ? Math.round(
        (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10
      ) / 10
    : null;

  return {
    organizerRating: average,
    organizerRatingCount: ratings.length,
    organizedEventsCount: organizedEvents.length,
    reviewsWrittenCount: db.reviews.filter(
      (review) => String(review.userId) === String(userId)
    ).length,
  };
}

/**
 * GET /api/users/search?q=...&userId=...
 *
 * Поиск пользователей по имени или ID. Возвращает обогащённый результат:
 * для каждого найденного пользователя указывает статус дружбы с viewerId:
 *   friendshipStatus: 'accepted' | 'pending' | null
 *   requestedByMe:    true — если заявку отправил viewerId,
 *                     false — если заявка пришла от найденного пользователя
 *
 * ⚠️ Важно: этот роут должен идти ДО `/:id`, иначе Express воспримет
 * "search" как значение параметра `:id`.
 */
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().slice(0, 80);
  const viewerId = String(req.query.userId || '');

  if (q.length < 2) return res.json({ users: [] });

  const friendIds = viewerId ? db.friendIdsFor(viewerId) : new Set();

  const incomingIds = viewerId
    ? new Set(db.listIncomingFriendRequests(viewerId).map((r) => String(r.user?.id)))
    : new Set();
  const outgoingIds = viewerId
    ? new Set(db.listOutgoingFriendRequests(viewerId).map((r) => String(r.user?.id)))
    : new Set();

  const users = Object.values(db.users)
    .filter((u) => u && String(u.id) !== viewerId)
    .filter((u) => {
      const name = String(u.name || '').toLowerCase();
      const id = String(u.id || '');
      return name.includes(q) || id.includes(q);
    })
    .slice(0, 30)
    .map((u) => {
      const id = String(u.id);
      let friendshipStatus = null;
      let requestedByMe = false;

      if (friendIds.has(id)) {
        friendshipStatus = 'accepted';
      } else if (outgoingIds.has(id)) {
        friendshipStatus = 'pending';
        requestedByMe = true;
      } else if (incomingIds.has(id)) {
        friendshipStatus = 'pending';
        requestedByMe = false;
      }

      return {
        id,
        name: u.name || 'Пользователь',
        photo_url: u.photo_url || null,
        city: u.city || null,
        age: u.age ?? null,
        about: u.about || null,
        maxLink: u.maxLink || '',
        friendshipStatus,
        requestedByMe,
      };
    });

  res.json({ users });
});

/**
 * GET /api/users/:id
 * Возвращает профиль пользователя.
 */
router.get('/:id', (req, res) => {
  const user = db.findUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ...user, ...getOrganizerStats(req.params.id) });
});

/**
 * PATCH /api/users/:id
 * Обновляет профиль. Принимает name, photo_url, age, city, about, maxLink, theme, notificationsEnabled.
 */
router.patch('/:id', (req, res) => {
  const { name, photo_url, age, city, about, maxLink, theme, notificationsEnabled } = req.body;

  const patch = {};
  if (typeof name === 'string') patch.name = name.trim().slice(0, 100);
  if (typeof photo_url === 'string' || photo_url === null) patch.photo_url = photo_url;

  if (age === null || age === '') {
    patch.age = null;
  } else {
    const num = Number(age);
    if (Number.isInteger(num) && num >= 14 && num <= 120) patch.age = num;
  }

  if (typeof city === 'string') patch.city = city.trim().slice(0, 80);
  if (theme === 'dark' || theme === 'light') patch.theme = theme;
  if (typeof about === 'string') patch.about = about.trim().slice(0, 500);
  if (typeof maxLink === 'string') {
    const match = maxLink.match(/https:\/\/max\.ru\/u\/([A-Za-z0-9_-]+)/i);
    if (maxLink.trim() && !match) {
      return res.status(400).json({ error: 'Некорректная ссылка на профиль MAX' });
    }
    patch.maxLink = match ? `https://max.ru/u/${match[1]}` : '';
  }

  // ★ Уведомления
  if (typeof notificationsEnabled === 'boolean') {
    patch.notificationsEnabled = notificationsEnabled;

    // ★ Если пользователь отключил уведомления — снимаем все запланированные напоминания
    if (notificationsEnabled === false) {
      db.clearAllUserReminders(String(req.params.id));
    }
  }

  const updated = db.upsertUser(req.params.id, patch);
  res.json(updated);
});

export default router;