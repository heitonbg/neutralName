import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import eventsRouter from './routes/events.js';
import reportsRouter from './routes/reports.js';
import moderationRouter from './routes/moderation.js';
import { startBot } from './bot.js';

const app = express();
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:5173';

// ============================================
// CORS
// ============================================
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      /\.vercel\.app$/,
      /\.amvera\.io$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));

// ============================================
// Health-check
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: BOT_TOKEN ? 'configured' : 'disabled',
    webAppUrl: WEB_APP_URL,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API
// ============================================
app.use('/api/events', eventsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/moderation', moderationRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 API-сервер:      http://localhost:${PORT}`);
  console.log(`🔗 Web App URL:     ${WEB_APP_URL}`);
  console.log(`🌐 CORS:            localhost:5173`);
  console.log('═══════════════════════════════════════════');
  console.log('');

  // Бот запускается в том же процессе
  startBot({
    token: BOT_TOKEN,
    webAppUrl: WEB_APP_URL
  });
});