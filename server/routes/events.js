// server/routes/events.js
import express from 'express';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import db from '../db/sqliteDatabase.js';
import { moderateContent, validateAddress } from '../utils/moderation.js';
import { notifyUser } from '../bot.js';
import { scheduleEventReminder, cancelEventReminder } from '../reminders.js';
import { uploadDir } from '../utils/uploadStorage.js';
import { collectUnusedEventUploadFilenames } from '../utils/eventImages.js';

const router = express.Router();

// Хелпер: событие завершилось?
function isEventPast(event) {
  const raw = String(event?.date || '').trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T,\s]+(\d{1,2}):(\d{2}))?/);
  if (!m) return false;

  const start = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4] || 0),
    Number(m[5] || 0)
  );
  if (Number.isNaN(start.getTime())) return false;

  let durationMs = 2 * 60 * 60 * 1000;
  const durStr = String(event.duration || '').trim();
  if (/^\d+$/.test(durStr)) {
    durationMs = Number(durStr) * 60 * 1000;
  } else if (durStr) {
    const h = Number(durStr.match(/(\d+)\s*ч/)?.[1] || 0);
    const mm = Number(durStr.match(/(\d+)\s*мин/)?.[1] || 0);
    const total = (h * 60 + mm) * 60 * 1000;
    if (total > 0) durationMs = total;
  }

  return Date.now() >= start.getTime() + durationMs;
}

// ★ Хелпер: нормализует картинки события.
//   Сервер не подставляет дефолт — он только оставляет то, что реально
//   пришло с клиента. UI сам выберет картинку по категории, если поля нет.
function resolveEventImages(body, fallbackImage) {
  const images = Array.isArray(body.images)
    ? body.images.filter((src) => typeof src === 'string' && src.trim())
    : [];

  const single = typeof body.image === 'string' && body.image.trim()
    ? body.image.trim()
    : null;

  const first = images[0] || single || fallbackImage || null;

  return {
    images,
    image: first,
  };
}

// GET /api/events?city=...&category=...&price=...
router.get('/', (req, res) => {
  const { category, price, city } = req.query;
  let result = [...db.events];
  if (city) result = result.filter((e) => (e.city || 'Казань') === city);
  if (category) result = result.filter((e) => e.category === category);
  if (price) result = result.filter((e) => e.price === price);
  res.json(db.hydrateEvents(result));
});

// GET /api/events/joined?userId=123 — текущие участия
router.get('/joined', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ eventIds: [] });
  const eventIds = [];
  for (const [eventId, users] of db.joinedUsers.entries()) {
    if (users.has(String(userId))) eventIds.push(Number(eventId));
  }
  res.json({ eventIds });
});

// GET /api/events/participated?userId=123 — все, кто когда-либо участвовал
router.get('/participated', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ eventIds: [] });
  const eventIds = [];
  for (const [eventId, users] of db.participatedUsers.entries()) {
    if (users.has(String(userId))) eventIds.push(Number(eventId));
  }
  res.json({ eventIds });
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  const event = db.findEvent(parseInt(req.params.id, 10));
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(db.hydrateEvent(event));
});

// GET /api/events/:id/participants
router.get('/:id/participants', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ participants: db.getParticipants(eventId) });
});

// POST /api/events
router.post('/', (req, res) => {
  const {
    title,
    description,
    address,
    format,
    city,
    duration,
    organizerId,
    organizerProfile,
  } = req.body;

  if (!organizerId) return res.status(400).json({ error: 'organizerId required' });

  const titleCheck = moderateContent(title);
  if (!titleCheck.isClean) return res.status(400).json({ error: titleCheck.reason });

  const descCheck = moderateContent(description || '');
  if (!descCheck.isClean) return res.status(400).json({ error: descCheck.reason });

  if (format !== 'Онлайн') {
    const addrCheck = validateAddress(address || '');
    if (!addrCheck.isClean) return res.status(400).json({ error: addrCheck.reason });
  }

  const { images, image } = resolveEventImages(req.body);

  const newEvent = {
    ...req.body,
    id: Date.now(),
    duration: typeof duration === 'string' ? duration.trim() : '',
    images,
    image,
    participants: 1,
    city: city || 'Казань',
    organizerId: String(organizerId),
    createdAt: new Date().toISOString(),
  };
  delete newEvent.organizer;
  delete newEvent.organizerProfile;
  delete newEvent.participantIds;

  db.addEvent(newEvent);

  if (organizerProfile && typeof organizerProfile === 'object') {
    db.upsertUser(String(organizerId), organizerProfile);
  }

  if (db.isNotificationsEnabled(organizerId)) {
    notifyUser(organizerId, `🎉 Ваше событие «${newEvent.title}» опубликовано!`);
  }

  res.status(201).json(db.hydrateEvent(newEvent));
});

// PUT /api/events/:id
router.put('/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { userId, title, description, address, format, duration } = req.body;
  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (!userId || String(event.organizerId) !== String(userId)) {
    return res.status(403).json({ error: 'Редактировать может только организатор' });
  }

  if (isEventPast(event)) {
    return res.status(400).json({ error: 'Завершённое событие нельзя редактировать' });
  }

  if (title) {
    const c = moderateContent(title);
    if (!c.isClean) return res.status(400).json({ error: c.reason });
  }
  if (description) {
    const c = moderateContent(description);
    if (!c.isClean) return res.status(400).json({ error: c.reason });
  }
  if (format !== 'Онлайн' && address) {
    const c = validateAddress(address);
    if (!c.isClean) return res.status(400).json({ error: c.reason });
  }

  // ★ Если images пришёл — нормализуем; иначе оставляем текущее событие как есть.
  const hasImagesPatch = Array.isArray(req.body.images) || typeof req.body.image === 'string';
  const { images, image } = hasImagesPatch
    ? resolveEventImages(req.body, event.image)
    : { images: event.images, image: event.image };

  const patch = {
    ...req.body,
    id: eventId,
    duration: typeof duration === 'string' ? duration.trim() : event.duration,
    images,
    image,
    updatedAt: new Date().toISOString(),
  };
  delete patch.organizer;
  delete patch.organizerId;
  delete patch.organizerProfile;
  delete patch.participantIds;

  const updated = db.updateEvent(eventId, patch);
  for (const participantId of db.joinedUsers.get(eventId) || []) {
    cancelEventReminder(eventId, participantId);
    scheduleEventReminder(updated, participantId);
  }
  res.json(db.hydrateEvent(updated));
});

// POST /api/events/:id/join
router.post('/:id/join', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { userId, userProfile } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (String(event.organizerId) === String(userId)) {
    return res.status(400).json({ error: 'Организатор не может записаться на своё событие' });
  }
  if (db.isUserJoined(eventId, userId)) {
    return res.status(400).json({ error: 'Вы уже участвуете' });
  }
  if (event.maxParticipants && event.participants >= event.maxParticipants) {
    return res.status(400).json({ error: 'Мест больше нет' });
  }

  db.addJoin(eventId, userId);
  event.participants = (event.participants || 0) + 1;
  db.updateEvent(eventId, event);

  if (userProfile && typeof userProfile === 'object') {
    db.upsertUser(String(userId), userProfile);
  }

  scheduleEventReminder(event, userId);

  const organizer = db.findUser(event.organizerId);
  if (
    organizer &&
    String(organizer.id) !== String(userId) &&
    db.isNotificationsEnabled(organizer.id)
  ) {
    notifyUser(organizer.id, `👥 Новый участник на «${event.title}»!`);
  }

  res.json({ success: true, participants: event.participants });
});

// POST /api/events/:id/leave
router.post('/:id/leave', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (!db.isUserJoined(eventId, userId)) {
    return res.status(400).json({ error: 'Вы не участвуете' });
  }

  // ★ Если событие ещё не завершено, пользователь отказывается — значит
  //   он не участвовал. Удаляем и из joins, и из participated_users.
  db.removeJoin(eventId, userId);
  if (!isEventPast(event)) {
    db.removeParticipant(eventId, userId);
  }

  event.participants = Math.max(0, (event.participants || 1) - 1);
  db.updateEvent(eventId, event);

  cancelEventReminder(eventId, userId);

  res.json({ success: true, participants: event.participants });
});

// DELETE /api/events/:id?userId=123
router.delete('/:id', async (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const userId = req.query.userId;

  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (!userId || String(event.organizerId) !== String(userId)) {
    return res.status(403).json({ error: 'Только организатор может удалить событие' });
  }

  const unusedUploads = collectUnusedEventUploadFilenames(event, db.events);
  db.removeEvent(eventId);

  await Promise.all(unusedUploads.map(async (filename) => {
    try {
      await unlink(path.join(uploadDir, filename));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Не удалось удалить фото события ${eventId}:`, error.message);
      }
    }
  }));

  res.status(204).end();
});

// ============ REVIEWS ============

router.get('/:id/reviews', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // Отзывы видны только у завершённых событий, но это не ошибка
  if (!isEventPast(event)) {
    return res.json([]);
  }

  const reviews = db.reviews.filter((r) => r.eventId === eventId);
  res.json(reviews);
});

router.post('/:id/reviews', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { userId, userName, rating, text, organizerRating } = req.body;

  if (!userId || !rating || !text) {
    return res.status(400).json({ error: 'userId, rating и text обязательны' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Оценка от 1 до 5' });
  }

  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (!isEventPast(event)) {
    return res.status(403).json({ error: 'Отзыв можно оставить только после завершения события' });
  }

  if (String(event.organizerId) === String(userId)) {
    return res.status(403).json({ error: 'Организатор не может оставить отзыв о своём событии' });
  }

  if (!db.wasUserParticipant(eventId, userId)) {
    return res.status(403).json({ error: 'Отзыв может оставить только участник события' });
  }

  const existing = db.reviews.find(
    (r) => r.eventId === eventId && String(r.userId) === String(userId)
  );
  if (existing) {
    return res.status(400).json({ error: 'Вы уже оставили отзыв' });
  }

  const safeOrganizerRating =
    Number.isInteger(organizerRating) && organizerRating >= 1 && organizerRating <= 5
      ? organizerRating
      : Number.isInteger(rating) && rating >= 1 && rating <= 5
        ? rating
        : null;

  const review = {
    id: Date.now(),
    eventId,
    eventOrganizerId: event.organizerId ? String(event.organizerId) : null,
    userId,
    userName: userName || 'Гость',
    rating,
    organizerRating: safeOrganizerRating,
    text: String(text).slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  db.addReview(review);

  const eventReviews = db.reviews.filter((r) => r.eventId === eventId);
  const avg = eventReviews.reduce((s, r) => s + r.rating, 0) / eventReviews.length;
  event.rating = Math.round(avg * 10) / 10;
  event.reviewsCount = eventReviews.length;
  db.updateEvent(eventId, event);

  res.status(201).json(review);
});

export default router;