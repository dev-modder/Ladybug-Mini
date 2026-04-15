/**
 * Purge Command - Delete a specific number of recent messages (owner only)
 * Ladybug V5
 *
 * Note: WhatsApp only allows deleting messages sent by the bot itself.
 * This deletes the bot's own recent messages in the current chat.
 *
 * Usage: .purge <count>
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const DATA_DIR  = path.join(__dirname, '../../data');
const LOG_PATH  = path.join(DATA_DIR, 'sent_messages.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadLog() {
  try { return fs.existsSync(LOG_PATH) ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')) : {}; }
  catch (_) { return {}; }
}

module.exports = {
  name: 'purge',
  aliases: ['deletelast', 'cleanbotmsgs'],
  category: 'owner',
  description: "Delete the bot's own recent messages in this chat",
  usage: '.purge <count>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const count = parseInt(args[0]) || 5;
      if (count < 1 || count > 50) {
        return extra.reply('❌ Count must be between 1 and 50.');
      }

      const log = loadLog();
      const chatLog = (log[extra.from] || []).slice(-count);

      if (!chatLog.length) {
        return extra.reply('⚠️ No logged bot messages found for this chat.');
      }

      let deleted = 0;
      for (const msgId of chatLog.reverse()) {
        try {
          await sock.sendMessage(extra.from, { delete: { remoteJid: extra.from, fromMe: true, id: msgId } });
          deleted++;
          await new Promise(r => setTimeout(r, 300));
        } catch (_) {}
      }

      // Remove deleted from log
      if (log[extra.from]) {
        log[extra.from] = log[extra.from].filter(id => !chatLog.includes(id));
        fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
      }

      await extra.reply(`🧹 Deleted ${deleted} bot message(s).`);
    } catch (error) {
      console.error('[purge] Error:', error);
      await extra.reply(`❌ Purge failed: ${error.message}`);
    }
  },
};
