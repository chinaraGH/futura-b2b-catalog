'use strict';

const { VK } = require('vk-io');
const { VK_GROUP_TOKEN, VK_GROUP_ID } = require('../config/env');
const { processMessage } = require('../services/pipeline');

/**
 * Запускает VK Long Poll в фоновом режиме (не блокирует Event Loop).
 * Индикатор печати — метод messages.setActivity.
 */
async function startVkWorker() {
  if (!VK_GROUP_TOKEN || !VK_GROUP_ID) {
    console.warn('[vk] VK_GROUP_TOKEN или VK_GROUP_ID не заданы — воркер не запущен.');
    return;
  }

  const vk = new VK({
    token: VK_GROUP_TOKEN,
    // group_id нужен для getLongPollServer
    groupId: parseInt(VK_GROUP_ID, 10) || undefined,
  });

  const { updates } = vk;

  updates.on('message_new', async (context) => {
    if (context.isOutbox) return;
    const text = context.text || '';
    if (!text.trim()) return;

    const userId = String(context.senderId);
    const sessionId = `vk:${userId}`;

    // Сначала отмечаем как прочитанное
    try {
      await vk.api.messages.markAsRead({
        peer_id: context.peerId,
        group_id: parseInt(VK_GROUP_ID, 10),
      });
    } catch (_) { }

    // Индикатор набора текста
    try {
      await vk.api.messages.setActivity({
        user_id: parseInt(userId, 10),
        type: 'typing',
        group_id: parseInt(VK_GROUP_ID, 10),
      });
    } catch (_) { }

    const reply = await processMessage({
      sessionId,
      platform: 'vk',
      externalId: userId,
      text: text.trim(),
      startParam: null,
    });

    await context.send(reply);
  });

  updates.on('error', (err) => {
    console.error('[vk] Updates error:', err.message);
  });

  try {
    await updates.startPolling();
    console.log('[vk] Long Poll запущен');
  } catch (err) {
    console.error('[vk] Не удалось запустить Long Poll:', err.message);
  }
}

module.exports = { startVkWorker };
