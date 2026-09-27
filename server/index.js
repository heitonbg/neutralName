// server/index.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import eventsRouter from './routes/events.js';
import reportsRouter from './routes/reports.js';
import moderationRouter from './routes/moderation.js';
import uploadRouter from './routes/upload.js';
import citiesRouter from './routes/cities.js';
import usersRouter from './routes/users.js';
import bootstrapRouter from './routes/bootstrap.js';
import touristRouter from './routes/tourist.js';
import { uploadDir } from './utils/uploadStorage.js';
import { getBotStatus, startBot } from './bot.js';
import { startReminderWorker } from './reminders.js';
import db from './db/sqliteDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:5173';
const BOT_USERNAME = process.env.BOT_USERNAME || 't280_hakaton_max_bot';

// ============================================
// CORS
// ============================================
const allowedOrigins = ['https://webtomax.vercel.app'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLocal =
        /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
      const isTunnel =
        /\.tuna\.am$/.test(origin) ||
        /\.ngrok-free\.app$/.test(origin) ||
        /\.ngrok\.io$/.test(origin);
      const isVercel = /\.vercel\.app$/.test(origin);
      const isAmvera = /\.amvera\.io$/.test(origin);

      if (isLocal || isTunnel || isVercel || isAmvera || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        console.warn('🚫 CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

// ============================================
// Middleware
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(uploadDir));

// ============================================
// Health-check
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: getBotStatus(),
    eventsCount: db.events.length,
    usersCount: Object.keys(db.users).length,
    seeded: db.seeded === true,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// API-роуты
// ============================================
app.use('/api/bootstrap', bootstrapRouter);
app.use('/api/tourist', touristRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/users', usersRouter);

// ============================================
// 404
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// ============================================
// Error handler
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ============================================
// Start
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 API-сервер:      http://localhost:${PORT}`);
  console.log(`📅 Событий в БД:    ${db.events.length}`);
  console.log(`👥 Пользователей:   ${Object.keys(db.users).length}`);
  console.log(`🌱 Засеяно seed'ом: ${db.seeded ? 'да' : 'нет'}`);
  console.log('═══════════════════════════════════════════');
  console.log('');

  startBot({
    token: BOT_TOKEN,
    webAppUrl: WEB_APP_URL,
    username: BOT_USERNAME,
  });

  // ★ Воркер напоминаний за час до события
  startReminderWorker();
});