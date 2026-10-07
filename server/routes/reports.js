import express from 'express';
import db from '../db/sqliteDatabase.js';
import { requireMaxUser } from '../utils/maxInitData.js';

const router = express.Router();

router.post('/', requireMaxUser, (req, res) => {
  const { eventId, reason, comment } = req.body;

  if (!eventId || !reason) {
    return res.status(400).json({ error: 'eventId and reason required' });
  }

  const report = {
    id: Date.now(),
    eventId,
    reason,
    reporterId: req.maxUser.id,
    comment: comment || '',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  db.addReport(report);
  console.log('📩 Жалоба:', report);

  res.status(201).json({ success: true, reportId: report.id });
});

export default router;