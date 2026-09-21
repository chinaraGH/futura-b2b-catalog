'use strict';

// Загружаем конфиг первым — проверит .env и завершится с ошибкой,
// если обязательная переменная отсутствует.
const config = require('./config/env');

const express = require('express');
const cors = require('cors');

const webRouter = require('./adapters/web');
const { startTelegramBot } = require('./adapters/telegram');
const { startVkWorker } = require('./adapters/vk');

// ── Express ──────────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health-check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// REST API для веб-виджета
app.use('/api', webRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

// ── Старт ────────────────────────────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`[server] HTTP сервер запущен на порту ${config.PORT}`);
});

// Telegram — запускаем асинхронно, не блокируем старт
startTelegramBot();

// VK — фоновый воркер
startVkWorker().catch((err) => {
  console.error('[index] VK worker failed to start:', err.message);
});
