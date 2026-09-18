import express from 'express';
import db from '../db/database.js';
import { moderateContent, validateAddress } from '../utils/moderation.js';
import { notifyUser } from '../bot.js';

const router = express.Router();

// GET /api/events
router.get('/', (req, res) => {
  const { category, price, lat, lng, radius } = req.query;
  let result = [...db.events];

  if (category) result = result.filter((e) => e.category === category);
  if (price) result = result.filter((e) => e.price === price);

  if (lat && lng && radius) {
    result = result.filter((e) => {
      if (!e.lat || !e.lng) return false;
      const d = haversine(parseFloat(lat), parseFloat(lng), e.lat, e.lng);
      return d <= parseFloat(radius);
    });
  }

  res.json(result);
});

// POST /api/events
router.post('/', (req, res) => {
  const { title, description, address, format } = req.body;

  const titleCheck = moderateContent(title);
  if (!titleCheck.isClean) {
    return res.status(400).json({ error: titleCheck.reason });
  }

  const descCheck = moderateContent(description || '');
  if (!descCheck.isClean) {
    return res.status(400).json({ error: descCheck.reason });
  }

  if (format !== 'Онлайн') {
    const addrCheck = validateAddress(address || '');
    if (!addrCheck.isClean) {
      return res.status(400).json({ error: addrCheck.reason });
    }
  }

  const newEvent = {
    id: Date.now(),
    ...req.body,
    participants: 1,
    createdAt: new Date().toISOString()
  };

  db.addEvent(newEvent);

  if (newEvent.organizer?.userId) {
    notifyUser(
      newEvent.organizer.userId,
      `🎉 Ваше событие «${newEvent.title}» опубликовано!`
    );
  }

  res.status(201).json(newEvent);
});

// POST /api/events/:id/join
router.post('/:id/join', (req, res) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId required' });

  const event = db.findEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (db.isUserJoined(eventId, userId)) {
    return res.status(400).json({ error: 'Already joined' });
  }

  if (event.maxParticipants && event.participants >= event.maxParticipants) {
    return res.status(400).json({ error: 'Event is full' });
  }

  db.addJoin(eventId, userId);
  event.participants += 1;

  if (event.organizer?.userId && event.organizer.userId !== userId) {
    notifyUser(
      event.organizer.userId,
      `👥 Новый участник на «${event.title}»!`
    );
  }

  res.json({ success: true, participants: event.participants });
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default router;