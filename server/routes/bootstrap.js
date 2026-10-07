// server/routes/bootstrap.js
import express from 'express';
import db from '../db/sqliteDatabase.js';
import { requireMaxUser } from '../utils/maxInitData.js';

const router = express.Router();

/**
 * GET /api/bootstrap (requires MAX Authorization)
 *
 * Единый запрос при старте приложения. Возвращает:
 *  - user: профиль (если есть)
 *  - joinedIds: текущие участия (кнопка «Отказаться», «Мои события → Участвую»)
 *  - participatedIds: все, где пользователь когда-либо участвовал (для отзывов)
 *  - createdIds: события, которые он организовал
 */
router.get('/', requireMaxUser, (req, res) => {
  const userId = req.maxUser.id;

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