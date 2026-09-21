'use strict';

const supabase = require('../db/supabase');

/**
 * Атомарное резервирование товара через хранимую процедуру.
 * @param {string} sku
 * @param {number} qty
 * @param {string} clientId  UUID клиента из таблицы clients
 * @returns {Promise<{success: boolean, error?: string, available?: number, remaining?: number}>}
 */
async function reserveProduct(sku, qty, clientId) {
  const { data, error } = await supabase.rpc('reserve_product', {
    p_sku: sku,
    p_qty: qty,
    p_client_id: clientId,
  });

  if (error) {
    console.error('[reserve] RPC error:', error.message);
    return { success: false, error: error.message };
  }

  return data;
}

module.exports = { reserveProduct };
