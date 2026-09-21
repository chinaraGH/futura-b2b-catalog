# Futura Chatbot Backend

Мультиканальный AI-бэкенд для бренда фасадных панелей **Futura**.
Консультант **Алекс** работает одновременно в трёх каналах:
веб-виджет (REST), Telegram и ВКонтакте.

---

## Стек

| Слой | Технология |
|------|-----------|
| HTTP-сервер | Node.js 18+, Express |
| AI | Google Gemini 2.0 Flash + text-embedding-004 |
| База данных | Supabase (PostgreSQL + pgvector) |
| Telegram | node-telegram-bot-api (long polling) |
| VK | vk-io (Long Poll API) |

---

## Структура

```
chatbot/
├── .env                      ← секреты (не в git)
├── .env.example              ← шаблон переменных
├── package.json
├── db/
│   └── schema.sql            ← DDL: таблицы, процедуры, pgvector
└── src/
    ├── index.js              ← точка входа
    ├── config/
    │   └── env.js            ← загрузка и валидация .env
    ├── db/
    │   └── supabase.js       ← синглтон клиента
    ├── services/
    │   ├── gemini.js         ← chat() + embedText()
    │   ├── memory.js         ← история диалога (6 сообщений)
    │   ├── rag.js            ← векторный поиск продуктов
    │   ├── reserve.js        ← атомарный резерв через RPC
    │   ├── alert.js          ← алерты менеджеру в Telegram
    │   └── pipeline.js       ← центральная логика обработки
    └── adapters/
        ├── web.js            ← POST /api/chat
        ├── telegram.js       ← Telegram long polling
        └── vk.js             ← VK Long Poll воркер
```

---

## Быстрый старт

### 1. Переменные окружения

Создайте `.env` в папке `chatbot/` (или дополните существующий):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

GEMINI_API_KEY=your-gemini-api-key

TELEGRAM_BOT_TOKEN=your-telegram-bot-token
ADMIN_CHAT_ID=500576750        # ← Telegram chat_id менеджера

VK_GROUP_TOKEN=vk1.a.xxxx...  # длинный токен группы
VK_GROUP_ID=241575674          # числовой ID группы (без "club")

PORT=3000
```

> ⚠️ **Важно**: в текущем `.env` значения `VK_GROUP_TOKEN` и `VK_GROUP_ID` переставлены местами.
> `VK_GROUP_TOKEN` должен содержать длинный токен `vk1.a.…`, а `VK_GROUP_ID` — числовой ID.

### 2. Миграция базы данных

Откройте **Supabase → SQL Editor** и выполните:

```
db/schema.sql
```

Это создаст таблицы `clients`, `interactions`, `products`, `reviews`,
хранимую процедуру `reserve_product` и функцию `match_products` (pgvector).

### 3. Установка и запуск

```bash
cd chatbot
npm install
npm start
```

---

## REST API веб-виджета

### `POST /api/chat`

```json
// Запрос
{
  "sessionId": "user-session-uuid",   // опционально, генерируется если не задан
  "text": "Есть ли HPL-панели 8 мм?",
  "startParam": "box_scan"            // опционально — параметр QR-перехода
}

// Ответ
{
  "sessionId": "user-session-uuid",
  "reply": "Да, HPL 8 мм есть в наличии..."
}
```

### `GET /health`

```json
{ "status": "ok" }
```

---

## Сценарии Алекса

| Сценарий | Триггер | Действие |
|----------|---------|---------|
| **Инфо/FAQ** | Технические вопросы | Ответ по базе знаний (RAG) |
| **Продажи** | "подтверждаю SKU-001 50 шт." | Резерв через `reserve_product` |
| **Рекламация** | "брак", "дефект", "рекламация" | Запись в `reviews` + алерт менеджеру |

---

## Векторный поиск (RAG)

1. Запрос пользователя → эмбеддинг (`text-embedding-004`, 768 dim)
2. pgvector поиск по cosine similarity (`match_products`)
3. Топ-5 товаров формируются в текстовый контекст промпта

Для заполнения таблицы `products` эмбеддингами используйте отдельный скрипт
или API Supabase с предварительной генерацией векторов.

---

## Резервирование

Формат подтверждения, который понимает бот:

> «Подтверждаю заказ: FUT-HPL-001, 50 шт.»

Бот автоматически вызовет `reserve_product(sku, qty, client_id)`.
