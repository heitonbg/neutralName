// server/routes/friends.js
import express from 'express';
import db from '../db/sqliteDatabase.js';
import { notifyUser } from '../bot.js';
import { requireMaxUser } from '../utils/maxInitData.js';

const router = express.Router();

/**
 * GET /api/friends (requires MAX Authorization)
 */
router.get('/', requireMaxUser, (req, res) => {
  const userId = req.maxUser.id;
  res.json({
    friends: db.listFriends(userId),
    incoming: db.listIncomingFriendRequests(userId),
    outgoing: db.listOutgoingFriendRequests(userId),
  });
});

/**
 * GET /api/friends/status?otherId=2 (requires MAX Authorization)
 */
router.get('/status', requireMaxUser, (req, res) => {
  const userId = req.maxUser.id;
  const otherId = req.query.otherId != null ? String(req.query.otherId) : '';
  if (!otherId) return res.status(400).json({ error: 'otherId обязателен' });
  res.json({ status: db.getFriendshipStatus(userId, otherId) });
});

/**
 * POST /api/friends/request  { toId } (requires MAX Authorization)
 *
 * Идемпотентен: если заявка уже висит (outgoing), возвращаем 200 с тем же статусом.
 * Фронт от этого только выигрывает — не нужно ловить 400 для UI-состояния.
 */
router.post('/request', requireMaxUser, (req, res) => {
  const fromId = req.maxUser.id;
  const toId = req.body?.toId != null ? String(req.body.toId) : '';
  if (!toId) return res.status(400).json({ error: 'toId обязателен' });
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
 * POST /api/friends/accept  { fromId } (requires MAX Authorization)
 */
router.post('/accept', requireMaxUser, (req, res) => {
  const userId = req.maxUser.id;
  const fromId = req.body?.fromId != null ? String(req.body.fromId) : '';
  if (!fromId) return res.status(400).json({ error: 'fromId обязателен' });

  const status = db.getFriendshipStatus(userId, fromId);
  if (status !== 'incoming') {
    return res.status(400).json({ error: 'Входящей заявки нет' });
  }

  db.acceptFriendRequest(fromId, userId);
  notifyUser(fromId, `🤝 ${db.findUser(userId)?.name || 'Пользователь'} принял вашу заявку в друзья.`).catch(() => {});
  res.json({ status: 'friends' });
});

/**
 * POST /api/friends/decline  { fromId } (requires MAX Authorization)
 *
 * Работает и для входящих (отклонить), и для исходящих (отменить).
 * Идемпотентен: если связи нет — 200 с status: 'none'.
 */
router.post('/decline', requireMaxUser, (req, res) => {
  const userId = req.maxUser.id;
  const fromId = req.body?.fromId != null ? String(req.body.fromId) : '';
  if (!fromId) return res.status(400).json({ error: 'fromId обязателен' });

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
router.delete('/:friendId', requireMaxUser, (req, res) => {
  const userId = req.maxUser.id;
  const friendId = req.params.friendId != null ? String(req.params.friendId) : '';
  if (!friendId) return res.status(400).json({ error: 'friendId обязателен' });

  db.removeFriend(userId, friendId);
  res.json({ status: 'none' });
});

export default router;