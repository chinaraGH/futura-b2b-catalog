'use strict';

const supabase = require('../db/supabase');
const { chat, embedText } = require('./gemini');
const { getHistory, saveMessage } = require('./memory');
const { searchProducts, formatRagContext } = require('./rag');
const { reserveProduct } = require('./reserve');
const { notifyManager } = require('./alert');

// Ключевые слова для определения сценариев
const CLAIM_KEYWORDS = /брак|дефект|трещин|отслоен|рекламац|жалоб|некачественн|повреждён|поврежден/i;
const RESERVE_CONFIRM = /подтверждаю|заказываю|резервируй|бронируй|беру|оформи|закажи/i;

// Парсинг SKU и количества из подтверждения заказа
// Ожидаем паттерн: "SKU: FUT-HPL-001, 50 шт." или "артикул FUT-001 20 штук"
const SKU_QTY_RE = /(?:sku[:\s]+)?([A-Z][\w-]{3,})[,\s]+(\d+)\s*шт/i;

/**
 * Центральная функция обработки входящего сообщения.
 * Вызывается из всех адаптеров.
 *
 * @param {object} params
 * @param {string} params.sessionId   уникальный идентификатор диалога
 * @param {string} params.platform    'web' | 'telegram' | 'vk'
 * @param {string} params.externalId  user ID в платформе (или sessionId для web)
 * @param {string} params.text        текст сообщения пользователя
 * @param {string} [params.startParam] параметр ?start= (например 'box_scan')
 * @returns {Promise<string>}  текст ответа бота
 */
async function processMessage({ sessionId, platform, externalId, text, startParam }) {
  // ── 1. Поиск или создание клиента (вместо upsert для обхода ошибки constraints) ──
  let clientId = null;
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('platform', platform)
    .eq('external_id', externalId)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        platform,
        external_id: externalId,
        qr_source: startParam || null,
      })
      .select('id')
      .maybeSingle();

    if (clientError) {
      // 23505 - duplicate key value violates unique constraint
      if (clientError.code === '23505' || clientError.message.includes('duplicate key')) {
        const { data: fallbackClient } = await supabase
          .from('clients')
          .select('id')
          .eq('platform', platform)
          .eq('external_id', externalId)
          .maybeSingle();
        clientId = fallbackClient?.id || null;
      } else {
        console.error('[pipeline] insert client error:', clientError.message);
      }
    } else {
      clientId = newClient?.id || null;
    }
  }

  // ── 2. Загрузка истории диалога ──────────────────────────────────────────
  const history = await getHistory(sessionId);

  // ── 3. Векторный поиск релевантных продуктов ─────────────────────────────
  let ragContext = '';
  try {
    const embedding = await embedText(text);
    const products = await searchProducts(embedding, 5);
    ragContext = formatRagContext(products);
  } catch (err) {
    console.error('[pipeline] RAG error:', err.message);
  }

  // ── 4. Генерация ответа Gemini ───────────────────────────────────────────
  let reply = '';
  try {
    reply = await chat(history, text, ragContext);
  } catch (err) {
    console.error('[pipeline] Gemini error:', err.message);
    reply = 'Временные технические трудности. Попробуйте повторить запрос через минуту.';

    // Оповещаем менеджера об ошибке API (чтобы человек мог перехватить диалог)
    const alertText =
      `🚨 <b>Ошибка API Gemini (Бот недоступен)</b>\n` +
      `Платформа: ${platform}\n` +
      `Пользователь (external_id): ${externalId}\n` +
      `Ошибка: <code>${err.message.substring(0, 200)}</code>`;
    await notifyManager(alertText);
  }

  // ── 5. Проверка на агрессию (на основе ответа LLM) ───────────────────────
  let isAggressive = false;
  if (reply.includes('[ESCALATE]')) {
    isAggressive = true;
    reply = reply.replace('[ESCALATE]', '').trim();
  }

  // ── 6. Сохранение сообщений ──────────────────────────────────────────────
  await saveMessage(sessionId, 'user', text, platform);
  await saveMessage(sessionId, 'model', reply, platform);

  // ── 7. Сценарий 3: Рекламация или Агрессия ───────────────────────────────
  const isClaim = CLAIM_KEYWORDS.test(text);

  if (isClaim || isAggressive) {
    if (isClaim) {
      const { error: reviewError } = await supabase.from('reviews').insert({
        session_id: sessionId,
        defect_desc: text,
      });
      if (reviewError) {
        console.error('[pipeline] review insert error:', reviewError.message);
      }
    }

    const alertText =
      `⚠️ <b>${isClaim ? 'Новая рекламация' : 'Агрессивный клиент (Нужен человек)'}</b>\n` +
      `Платформа: ${platform}\n` +
      `Сессия: ${sessionId}\n` +
      `Сообщение: ${text}`;

    await notifyManager(alertText);
  }

  // ── 7. Сценарий 2: Резервирование ───────────────────────────────────────
  if (RESERVE_CONFIRM.test(text)) {
    const match = SKU_QTY_RE.exec(text);
    if (match) {
      const sku = match[1].toUpperCase();
      const qty = parseInt(match[2], 10);
      const result = await reserveProduct(sku, qty, clientId);

      if (result?.success) {
        reply += `\n\n✅ Зарезервировано: ${sku}, ${qty} шт. Остаток: ${result.remaining} шт.`;
      } else if (result?.error) {
        reply += `\n\n⚠️ Резерв не выполнен: ${result.error}. Доступно: ${result.available ?? '?'} шт.`;
      }
    }
  }

  return reply;
}

module.exports = { processMessage };
