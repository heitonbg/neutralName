import express from 'express';
import db from '../db/database.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { eventId, reason, reporterId, comment } = req.body;

  if (!eventId || !reason) {
    return res.status(400).json({ error: 'eventId and reason required' });
  }

  const report = {
    id: Date.now(),
    eventId,
    reason,
    reporterId: reporterId || 'anonymous',
    comment: comment || '',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  db.addReport(report);
  console.log('📩 Жалоба:', report);

  res.status(201).json({ success: true, reportId: report.id });
});

export default router;