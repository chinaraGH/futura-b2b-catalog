'use strict';

const supabase = require('../db/supabase');

const HISTORY_LIMIT = 6; // последних сообщений

/**
 * Загружает последние N сообщений диалога из БД.
 * Возвращает в формате Gemini: [{role, parts:[{text}]}]
 * @param {string} sessionId
 * @returns {Promise<Array>}
 */
async function getHistory(sessionId) {
  const { data, error } = await supabase
    .from('interactions')
    .select('role, message_text')
    .eq('session_id', sessionId)
    .order('session_date', { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error('[memory] getHistory error:', error.message);
    return [];
  }

  // Переворачиваем — хроно-порядок для Gemini
  return (data || []).reverse().map((row) => ({
    role: row.role,
    parts: [{ text: row.message_text }],
  }));
}

/**
 * Сохраняет одно сообщение в interactions.
 * @param {string} sessionId
 * @param {'user'|'model'} role
 * @param {string} text
 */
async function saveMessage(sessionId, role, text, platform) {
  const { error } = await supabase.from('interactions').insert({
    session_id: sessionId,
    role,
    message_text: text,
    platform: platform || 'web',
  });

  if (error) {
    console.error('[memory] saveMessage error:', error.message);
  }
}

module.exports = { getHistory, saveMessage };
