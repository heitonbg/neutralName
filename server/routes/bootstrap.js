// server/routes/bootstrap.js
import express from 'express';
import db from '../db/sqliteDatabase.js';

const router = express.Router();

/**
 * GET /api/bootstrap?userId=123
 *
 * Единый запрос при старте приложения. Возвращает:
 *  - user: профиль (если есть)
 *  - joinedIds: текущие участия (кнопка «Отказаться», «Мои события → Участвую»)
 *  - participatedIds: все, где пользователь когда-либо участвовал (для отзывов)
 *  - createdIds: события, которые он организовал
 */
router.get('/', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.json({
      user: null,
      joinedIds: [],
      participatedIds: [],
      createdIds: [],
    });
  }

  const user = db.findUser(userId) || null;

  const joinedIds = [];
  for (const [eventId, users] of db.joinedUsers.entries()) {
    if (users.has(String(userId))) joinedIds.push(Number(eventId));
  }

  const participatedIds = [];
  for (const [eventId, users] of db.participatedUsers.entries()) {
    if (users.has(String(userId))) participatedIds.push(Number(eventId));
  }

  const createdIds = db.events
    .filter((e) => String(e.organizerId) === String(userId))
    .map((e) => Number(e.id));

  res.json({
    user,
    joinedIds,
    participatedIds,
    createdIds,
  });
});

export default router;