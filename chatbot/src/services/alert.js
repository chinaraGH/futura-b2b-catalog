'use strict';

const { ADMIN_CHAT_ID, TELEGRAM_BOT_TOKEN } = require('../config/env');

/**
 * Отправляет текстовое уведомление менеджеру через Telegram Bot API.
 * Использует прямой HTTP-запрос (fetch), чтобы не создавать
 * циклическую зависимость с telegram-адаптером.
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
async function notifyManager(text) {
  if (!ADMIN_CHAT_ID) {
    console.warn('[alert] ADMIN_CHAT_ID не задан — уведомление не отправлено.');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[alert] Telegram API error:', body);
    }
  } catch (err) {
    console.error('[alert] notifyManager failed:', err.message);
  }
}

module.exports = { notifyManager };
