import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Создаём папку, если её нет
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
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
  const files = fs.readdirSync(UPLOAD_DIR);
  res.json({ files });
});

export default router;