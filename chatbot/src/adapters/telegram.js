'use strict';

const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_BOT_TOKEN } = require('../config/env');
const { processMessage } = require('../services/pipeline');

let bot = null;

function formatTelegramHTML(text) {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/^#+\s*(.*)$/gm, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

/**
 * Запускает Telegram long polling.
 * Индикатор набора текста отправляется перед генерацией ответа.
 */
function startTelegramBot() {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || chatId);
    const text = msg.text || msg.caption || '';

    if (!text.trim()) return;

    // Определяем start-параметр (переход с QR через deep link /start box_scan)
    let startParam = null;
    if (msg.text?.startsWith('/start ')) {
      startParam = msg.text.split(' ')[1] || null;
    }

    // Индикатор набора текста
    try {
      await bot.sendChatAction(chatId, 'typing');
    } catch (_) { }

    try {
      const sessionId = `telegram:${userId}`;

      const reply = await processMessage({
        sessionId,
        platform: 'telegram',
        externalId: userId,
        text: text.trim(),
        startParam,
      });

      try {
        const htmlReply = formatTelegramHTML(reply);
        await bot.sendMessage(chatId, htmlReply, { parse_mode: 'HTML' });
      } catch (sendErr) {
        console.warn('[telegram] Failed to send message with HTML, falling back to plain text:', sendErr.message);
        await bot.sendMessage(chatId, reply);
      }
    } catch (err) {
      console.error('[telegram] Unhandled message error:', err.message || err);
      try {
        await bot.sendMessage(chatId, 'Произошла ошибка при обработке сообщения.');
      } catch (_) { }
    }
  });

  let lastErrorTime = 0;
  bot.on('polling_error', (err) => {
    const now = Date.now();
    if (now - lastErrorTime > 5000) {
      console.error('[telegram] polling error:', err.code || '', err.message);
      lastErrorTime = now;
    }
  });

  console.log('[telegram] Long polling запущен');
}

module.exports = { startTelegramBot };
