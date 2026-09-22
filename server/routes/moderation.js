import express from 'express';
import { moderateContent } from '../utils/moderation.js';

const router = express.Router();

/**
 * POST /api/moderation/check
 * Тело: { text: "строка для проверки" }
 * Ответ: { isClean: boolean, reason?: string }
 */
router.post('/check', (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ isClean: true });

  const result = moderateContent(text);
  res.json(result);
});

export default router;