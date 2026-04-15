/**
 * BlockList Command - View all blocked contacts (owner only)
 * Ladybug V5
 *
 * Usage: .blocklist
 */

'use strict';

module.exports = {
  name: 'blocklist',
  aliases: ['blocked', 'viewblocked'],
  category: 'owner',
  description: 'View all numbers currently blocked by the bot',
  usage: '.blocklist',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const blocked = await sock.fetchBlocklist();

      if (!blocked || blocked.length === 0) {
        return extra.reply('✅ No contacts are currently blocked.');
      }

      const lines = blocked.map((jid, i) => `${i + 1}. +${jid.split('@')[0]}`);

      await extra.reply(
        `🚫 *Blocked Contacts (${blocked.length})*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        lines.join('\n') +
        `\n\nUse *.unblock <number>* to unblock.`
      );
    } catch (error) {
      console.error('[blocklist] Error:', error);
      await extra.reply(`❌ Failed to fetch block list: ${error.message}`);
    }
  },
};
