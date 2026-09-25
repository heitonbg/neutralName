import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { randomUUID } from 'node:crypto';
import { uploadDir } from '../utils/uploadStorage.js';

// Создаём папку, если её нет
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    }[file.mimetype];
    const unique = `${randomUUID()}${ext}`;
    cb(null, unique);
  }
});

// Фильтр: только изображения
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только PNG, JPG, WEBP, GIF'));
    }
  }
});

const router = express.Router();

/**
 * POST /api/upload
 * Multipart form-data с полем "photos" (до 5 файлов)
 * Возвращает массив URL
 */
router.post('/', upload.array('photos', 5), (req, res) => {
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: 'Файлы не переданы' });
  }

  const urls = req.files.map((file) => `/uploads/${file.filename}`);
  res.json({ urls });
});

/**
 * GET /api/upload/list — список всех загруженных файлов (для отладки)
 */
router.get('/list', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  res.json({ files });
});

export default router;