'use strict';

/**
 * Скрипт импорта products_data.json → Supabase.products
 *
 * Реальная схема таблицы products (выявлена тестом):
 *   id, sku, category, name, specifications (jsonb),
 *   price, stock_quantity, reserved_quantity, related_skus (text[]), embedding (vector)
 *
 * Запуск: node scripts/import_products.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Утилиты ──────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPrice(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Ценообразование по категории ──────────────────────────────────────────────

const PRICE_MAP = {
  '01 — Corrugated Metals':    { min: 1200, max: 4500 },
  '02 — Expanded Metals':      { min: 1800, max: 6200 },
  '03 — Wire Mesh':            { min: 2200, max: 9800 },
  '04 — Perforated Metals':    { min: 1600, max: 5800 },
  '05 — Composite ACM':        { min: 2400, max: 7200 },
  '06 — Phenolic HPL':         { min: 3200, max: 9600 },
  '07 — Fixings & Subsystems': { min: 180,  max: 2800 },
};

// SKU крепежа из раздела 07 для допродаж
const FASTENER_SKUS = [
  'MAT-45','MAT-46','MAT-47','MAT-48','MAT-49','MAT-50',
  'MAT-51','MAT-52','MAT-53','MAT-54','MAT-55','MAT-56',
  'MAT-57','MAT-58','MAT-59','MAT-60','MAT-61','MAT-62',
];

function getRelatedSkus(category) {
  if (category === '07 — Fixings & Subsystems') return [];
  const shuffled = [...FASTENER_SKUS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, randInt(2, 3));
}

// ── Генерация эмбеддинга ──────────────────────────────────────────────────────
// Правильный вызов для @google/genai v1+:
//   model: 'gemini-embedding-001'  (text-embedding-004 не работает через v1beta)
//   contents: строка (не массив)
//   ответ: response.embeddings[0].values

async function embedText(text) {
  const response = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
  });
  // gemini-embedding-001 возвращает 3072 dims (MRL).
  // Обрезаем до 768 — первые N измерений в MRL полностью валидны.
  return response.embeddings[0].values.slice(0, 768);
}

// ── Формирование текста для эмбеддинга ───────────────────────────────────────

function buildEmbedText(item) {
  const specs = item['описание/спецификации'] || {};
  const specLines = Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
  return `${item['раздел']} | ${item['наименование']} (${item['артикул']}). ${specLines}`.slice(0, 2000);
}

// ── Основной импорт ───────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Проверка таблицы products ===');
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  console.log(`Записей в таблице сейчас: ${count ?? 0}`);
  console.log('Реальные колонки: id, sku, category, name, specifications, price, stock_quantity, reserved_quantity, related_skus, embedding\n');

  // Читаем JSON
  const jsonPath = path.join(__dirname, '../products_data.json');
  const rawItems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Дедупликация по артикулу
  const seen = new Set();
  const items = rawItems.filter((item) => {
    const sku = item['артикул'];
    if (seen.has(sku)) {
      console.warn(`[skip dup] ${sku}`);
      return false;
    }
    seen.add(sku);
    return true;
  });
  console.log(`Уникальных в JSON: ${items.length}`);

  // Пропускаем уже загруженные SKU
  const { data: existing } = await supabase.from('products').select('sku');
  const existingSkus = new Set((existing || []).map((r) => r.sku));
  const toInsert = items.filter((item) => !existingSkus.has(item['артикул']));
  console.log(`Новых для вставки: ${toInsert.length} (уже есть: ${items.length - toInsert.length})\n`);

  if (toInsert.length === 0) {
    console.log('Все товары уже импортированы.');
    return;
  }

  // Батчевый импорт
  const BATCH = 5;
  let inserted = 0;
  let embedErrors = 0;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const records = [];

    for (const item of batch) {
      const sku = item['артикул'];
      const category = item['раздел'];
      const priceRange = PRICE_MAP[category] || { min: 1000, max: 5000 };
      const embedText_str = buildEmbedText(item);

      // Генерация эмбеддинга
      let embedding = null;
      try {
        embedding = await embedText(embedText_str);
        process.stdout.write(`  [embed ✓] ${sku}\n`);
      } catch (err) {
        embedErrors++;
        process.stdout.write(`  [embed ✗] ${sku}: ${err.message.slice(0, 80)}\n`);
        // Повтор через 3 сек
        await sleep(3000);
        try {
          embedding = await embedText(embedText_str);
          process.stdout.write(`  [embed retry ✓] ${sku}\n`);
        } catch (_) {
          process.stdout.write(`  [embed skip] ${sku} — вставим без вектора\n`);
        }
      }

      const isFixing = category === '07 — Fixings & Subsystems';
      const stock = isFixing ? randInt(500, 5000) : randInt(20, 500);
      const reserved = Math.floor(stock * randInt(0, 30) / 100);

      records.push({
        sku,
        name: item['наименование'],
        category,
        specifications: item['описание/спецификации'] || {},
        price: randPrice(priceRange.min, priceRange.max),
        stock_quantity: stock,
        reserved_quantity: reserved,
        related_skus: getRelatedSkus(category),
        embedding,
      });

      await sleep(400); // пауза между запросами к Gemini
    }

    // Вставка батча
    const { error: insertError } = await supabase.from('products').insert(records);

    if (insertError) {
      console.error(`  [insert ERROR] batch ${Math.floor(i / BATCH) + 1}: ${insertError.message}`);
    } else {
      inserted += records.length;
      console.log(`  ✅ Вставлено: ${inserted}/${toInsert.length}`);
    }

    if (i + BATCH < toInsert.length) await sleep(800);
  }

  console.log('\n=== Импорт завершён ===');
  console.log(`Вставлено: ${inserted}/${toInsert.length}`);
  console.log(`Ошибок эмбеддинга: ${embedErrors}`);

  // Финальный подсчёт
  const { count: finalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  console.log(`Итого в таблице: ${finalCount} записей`);
}

main().catch((err) => {
  console.error('Критическая ошибка:', err.message);
  process.exit(1);
});
