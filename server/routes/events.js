import express from 'express';
import db from '../db/database.js';
import { moderateContent, validateAddress } from '../utils/moderation.js';
import { notifyUser } from '../bot.js';

const router = express.Router();

// GET /api/events?city=Казань&category=...&price=...
router.get('/', (req, res) => {
  const { category, price, city } = req.query;
  let result = [...db.events];
  if (city) result = result.filter((e) => (e.city || 'Казань') === city);
  if (category) result = result.filter((e) => e.category === category);
  if (price) result = result.filter((e) => e.price === price);
  res.json(result);
});

// GET /api/events/joined?userId=123
router.get('/joined', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ eventIds: [] });
  const eventIds = [];
  for (const [eventId, users] of db.joinedUsers.entries()) {
    if (users.has(String(userId))) eventIds.push(Number(eventId));
  }
  res.json({ eventIds });
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  const event = db.findEvent(parseInt(req.params.id, 10));
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// POST /api/events
router.post('/', (req, res) => {
  const {
    title, description, address, format, city,
    duration, images
  } = req.body;

  const titleCheck = moderateContent(title);
  if (!titleCheck.isClean) return res.status(400).json({ error: titleCheck.reason });

  const descCheck = moderateContent(description || '');
  if (!descCheck.isClean) return res.status(400).json({ error: descCheck.reason });

  if (format !== 'Онлайн') {
    const addrCheck = validateAddress(address || '');
    if (!addrCheck.isClean) return res.status(400).json({ error: addrCheck.reason });
  }

  const newEvent = {
    ...req.body,
    id: Date.now(),
    // ★ Продолжительность: строка вида "1 ч 30 мин", "45 мин" или пусто
    duration: typeof duration === 'string' ? duration.trim() : '',
    images: Array.isArray(images) ? images : [],
    image: Array.isArray(images) && images[0]
      ? images[0]
      : req.body.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
    participants: 1,
    city: city || 'Казань',
    createdAt: new Date().toISOString()
  };

  db.addEvent(newEvent);

  if (newEvent.organizer?.userId) {
    notifyUser(newEvent.organizer.userId, `🎉 Ваше событие «${newEvent.title}» опубликовано!`);
  }

  res.status(201).json(newEvent);
});

// PUT /api/events/:id
router.put('/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { userId, title, description, address, format, images, duration } = req.body;
  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const ownerId = event.organizer?.id;
  if (!ownerId || String(ownerId) !== String(userId)) {
    return res.status(403).json({ error: 'Редактировать может только организатор' });
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

  const updated = {
    ...event,
    ...req.body,
    id: eventId,
    // ★ Продолжительность нормализуем
    duration: typeof duration === 'string' ? duration.trim() : event.duration,
    images: Array.isArray(images) ? images : event.images,
    image: Array.isArray(images) && images[0] ? images[0] : event.image,
    updatedAt: new Date().toISOString()
  };
  db.updateEvent(eventId, updated);
  res.json(updated);
});

// POST /api/events/:id/join
router.post('/:id/join', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (String(event.organizer?.id) === String(userId)) {
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

  if (event.organizer?.userId && String(event.organizer.userId) !== String(userId)) {
    notifyUser(event.organizer.userId, `👥 Новый участник на «${event.title}»!`);
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

  db.removeJoin(eventId, userId);
  event.participants = Math.max(0, (event.participants || 1) - 1);
  db.updateEvent(eventId, event);

  res.json({ success: true, participants: event.participants });
});

// DELETE /api/events/:id?userId=123
router.delete('/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const userId = req.query.userId || req.body?.userId;

  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const ownerId = event.organizer?.id;
  if (!ownerId || String(ownerId) !== String(userId)) {
    return res.status(403).json({ error: 'Только организатор может удалить событие' });
  }

  db.removeEvent(eventId);
  db.joinedUsers.delete(eventId);
  db.reviews = db.reviews.filter((r) => r.eventId !== eventId);
  db.save();
  res.status(204).end();
});

// ============ REVIEWS ============

router.get('/:id/reviews', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const reviews = db.reviews.filter((r) => r.eventId === eventId);
  res.json(reviews);
});

router.post('/:id/reviews', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { userId, userName, rating, text } = req.body;

  if (!userId || !rating || !text) {
    return res.status(400).json({ error: 'userId, rating и text обязательны' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Оценка от 1 до 5' });
  }

  const existing = db.reviews.find(
    (r) => r.eventId === eventId && String(r.userId) === String(userId)
  );
  if (existing) {
    return res.status(400).json({ error: 'Вы уже оставили отзыв' });
  }

  const review = {
    id: Date.now(),
    eventId,
    userId,
    userName: userName || 'Гость',
    rating,
    text: String(text).slice(0, 500),
    createdAt: new Date().toISOString()
  };

  db.addReview(review);

  const event = db.findEvent(eventId);
  if (event) {
    const eventReviews = db.reviews.filter((r) => r.eventId === eventId);
    const avg = eventReviews.reduce((s, r) => s + r.rating, 0) / eventReviews.length;
    event.rating = Math.round(avg * 10) / 10;
    event.reviewsCount = eventReviews.length;
    db.updateEvent(eventId, event);
  }

  res.status(201).json(review);
});

export default router;