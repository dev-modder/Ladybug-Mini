/**
 * GroupList Command - List all groups the bot is in (owner only)
 * Ladybug V5
 *
 * Usage: .grouplist
 */

'use strict';

module.exports = {
  name: 'grouplist',
  aliases: ['listgroups', 'allgroups', 'mygroups'],
  category: 'owner',
  description: 'List all groups the bot is currently in',
  usage: '.grouplist',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const chats = await sock.groupFetchAllParticipating();
      const groups = Object.values(chats);

      if (!groups.length) {
        return extra.reply('📭 The bot is not in any groups.');
      }

      const sorted = groups.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
      const lines = sorted.map((g, i) => `${i + 1}. *${g.subject || 'Unnamed'}*\n   👥 ${g.participants?.length || 0} members\n   🆔 ${g.id}`);

      const text =
        `🏘️ *Bot Groups (${groups.length})*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        lines.join('\n\n');

      await extra.reply(text);
    } catch (error) {
      console.error('[grouplist] Error:', error);
      await extra.reply(`❌ Failed to fetch groups: ${error.message}`);
    }
  },
};
