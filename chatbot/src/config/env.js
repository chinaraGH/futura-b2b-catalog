'use strict';

require('dotenv').config();

const REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'GEMINI_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'VK_GROUP_TOKEN',
  'VK_GROUP_ID',
];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[config] Отсутствует обязательная переменная: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,

  // Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID || null,

  // VK
  // Примечание: в .env VK_GROUP_TOKEN содержит токен (длинная строка),
  // VK_GROUP_ID — числовой ID группы (club241575674 → 241575674)
  VK_GROUP_TOKEN: process.env.VK_GROUP_TOKEN,
  VK_GROUP_ID: process.env.VK_GROUP_ID
    ? process.env.VK_GROUP_ID.replace('club', '')
    : null,

  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
};
