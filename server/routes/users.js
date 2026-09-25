import express from 'express';
import db from '../db/sqliteDatabase.js';

const router = express.Router();

/**
 * GET /api/users/:id
 * Возвращает профиль пользователя.
 */
router.get('/:id', (req, res) => {
  const user = db.findUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

/**
 * PATCH /api/users/:id
 * Обновляет профиль. Принимает name, photo_url, age, city, about, theme.
 */
router.patch('/:id', (req, res) => {
  const { name, photo_url, age, city, about, theme } = req.body;

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

  const updated = db.upsertUser(req.params.id, patch);
  res.json(updated);
});

export default router;