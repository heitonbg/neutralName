// server/routes/friends.js
import express from 'express';
import db from '../db/sqliteDatabase.js';
import { notifyUser } from '../bot.js';

const router = express.Router();

/**
 * GET /api/friends?userId=123
 */
router.get('/', (req, res) => {
  const userId = req.query.userId != null ? String(req.query.userId) : '';
  if (!userId) return res.status(400).json({ error: 'userId required' });

  res.json({
    friends: db.listFriends(userId),
    incoming: db.listIncomingFriendRequests(userId),
    outgoing: db.listOutgoingFriendRequests(userId),
  });
});

/**
 * GET /api/friends/status?userId=1&otherId=2
 */
router.get('/status', (req, res) => {
  const userId = req.query.userId != null ? String(req.query.userId) : '';
  const otherId = req.query.otherId != null ? String(req.query.otherId) : '';
  if (!userId || !otherId) return res.status(400).json({ error: 'userId и otherId обязательны' });
  res.json({ status: db.getFriendshipStatus(userId, otherId) });
});

/**
 * POST /api/friends/request  { fromId, toId }
 *
 * Идемпотентен: если заявка уже висит (outgoing), возвращаем 200 с тем же статусом.
 * Фронт от этого только выигрывает — не нужно ловить 400 для UI-состояния.
 */
router.post('/request', (req, res) => {
  const fromId = req.body?.fromId != null ? String(req.body.fromId) : '';
  const toId = req.body?.toId != null ? String(req.body.toId) : '';
  if (!fromId || !toId) return res.status(400).json({ error: 'fromId и toId обязательны' });
  if (fromId === toId) return res.status(400).json({ error: 'Нельзя добавить себя' });

  const existing = db.getFriendshipStatus(fromId, toId);

  if (existing === 'friends') {
    // Уже друзья — не ошибка, отдаём 200.
    return res.json({ status: 'friends' });
  }

  if (existing === 'outgoing') {
    // Заявка уже отправлена — не 400, а 200. Идемпотентно.
    return res.json({ status: 'outgoing' });
  }

  if (existing === 'incoming') {
    // Встречная заявка — сразу принимаем.
    db.acceptFriendRequest(toId, fromId);
    notifyUser(toId, `🤝 ${db.findUser(fromId)?.name || 'Пользователь'} принял вашу заявку в друзья.`).catch(() => {});
    return res.json({ status: 'friends' });
  }

  db.addFriendRequest(fromId, toId);
  notifyUser(toId, `👋 ${db.findUser(fromId)?.name || 'Пользователь'} хочет добавить вас в друзья.`).catch(() => {});
  res.json({ status: 'outgoing' });
});

/**
 * POST /api/friends/accept  { userId, fromId }
 */
router.post('/accept', (req, res) => {
  const userId = req.body?.userId != null ? String(req.body.userId) : '';
  const fromId = req.body?.fromId != null ? String(req.body.fromId) : '';
  if (!userId || !fromId) return res.status(400).json({ error: 'userId и fromId обязательны' });

  const status = db.getFriendshipStatus(userId, fromId);
  if (status !== 'incoming') {
    return res.status(400).json({ error: 'Входящей заявки нет' });
  }

  db.acceptFriendRequest(fromId, userId);
  notifyUser(fromId, `🤝 ${db.findUser(userId)?.name || 'Пользователь'} принял вашу заявку в друзья.`).catch(() => {});
  res.json({ status: 'friends' });
});

/**
 * POST /api/friends/decline  { userId, fromId }
 *
 * Работает и для входящих (отклонить), и для исходящих (отменить).
 * Идемпотентен: если связи нет — 200 с status: 'none'.
 */
router.post('/decline', (req, res) => {
  const userId = req.body?.userId != null ? String(req.body.userId) : '';
  const fromId = req.body?.fromId != null ? String(req.body.fromId) : '';
  if (!userId || !fromId) return res.status(400).json({ error: 'userId и fromId обязательны' });

  const status = db.getFriendshipStatus(userId, fromId);
  if (status === 'incoming' || status === 'outgoing') {
    db.removeFriend(userId, fromId);
    return res.json({ status: 'none' });
  }

  // Связи нет — считаем «уже отменено». Не падаем.
  res.json({ status: 'none' });
});

/**
 * DELETE /api/friends/:friendId?userId=...
 * Удаление взаимное.
 */
router.delete('/:friendId', (req, res) => {
  const userId = req.query.userId != null ? String(req.query.userId) : '';
  const friendId = req.params.friendId != null ? String(req.params.friendId) : '';
  if (!userId || !friendId) return res.status(400).json({ error: 'userId и friendId обязательны' });

  db.removeFriend(userId, friendId);
  res.json({ status: 'none' });
});

export default router;