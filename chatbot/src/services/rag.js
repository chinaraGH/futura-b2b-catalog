'use strict';

const supabase = require('../db/supabase');

/**
 * Векторный поиск релевантных продуктов.
 * @param {number[]} queryEmbedding  вектор запроса (768 dim)
 * @param {number}   limit           макс. кол-во результатов
 * @returns {Promise<Array>}
 */
async function searchProducts(queryEmbedding, limit = 5) {
  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: queryEmbedding,
    match_count: limit,
  });

  if (error) {
    console.error('[rag] searchProducts error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Форматирует результаты RAG в читаемую строку для промпта.
 * Реальная схема: category, name, sku, specifications (jsonb),
 *                 price, stock_quantity, reserved_quantity, related_skus
 * @param {Array} products
 * @returns {string}
 */
function formatRagContext(products) {
  if (!products.length) return '';

  return products
    .map((p) => {
      const avail = (p.stock_quantity ?? 0) - (p.reserved_quantity ?? 0);
      const related = p.related_skus?.length ? `Крепёж/аксессуары: ${p.related_skus.join(', ')}` : '';

      // specifications — jsonb-объект, форматируем в строку
      let specsStr = '';
      if (p.specifications && typeof p.specifications === 'object') {
        specsStr = Object.entries(p.specifications)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
      }

      return [
        `SKU: ${p.sku} | ${p.name} [${p.category}]`,
        `Цена: ${p.price ? p.price + ' руб./м²' : 'по запросу'} | Доступно: ${avail} шт.`,
        specsStr,
        related,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n---\n\n');
}

module.exports = { searchProducts, formatRagContext };
