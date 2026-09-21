'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { processMessage } = require('../services/pipeline');

const router = Router();

/**
 * POST /api/chat
 *
 * Body: {
 *   sessionId?: string,   // если не задан — генерируется новый
 *   text: string,
 *   startParam?: string   // например 'box_scan' при переходе с QR
 * }
 *
 * Response: { sessionId, reply }
 */
router.post('/chat', async (req, res) => {
  const { text, startParam } = req.body;
  const sessionId = req.body.sessionId || uuidv4();

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Поле text обязательно' });
  }

  try {
    const reply = await processMessage({
      sessionId,
      platform: 'web',
      externalId: sessionId,
      text: text.trim(),
      startParam: startParam || null,
    });

    res.json({ sessionId, reply });
  } catch (err) {
    console.error('[web adapter] error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
