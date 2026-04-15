/**
 * SetStatusText Command - Update bot's WhatsApp status/about text (owner only)
 * Ladybug V5
 *
 * Usage: .setstatustext <text>
 */

'use strict';

module.exports = {
  name: 'setstatustext',
  aliases: ['setstatus', 'botstatus'],
  category: 'owner',
  description: 'Update the bot WhatsApp status/about text',
  usage: '.setstatustext <text>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('❌ Usage: .setstatustext <text>\n\nExample: .setstatustext 🐞 Ladybug Bot – Online 24/7');
      }
      const statusText = args.join(' ');
      await sock.updateProfileStatus(statusText);
      await extra.reply(`✅ *Bot status updated!*\n\n📝 ${statusText}`);
    } catch (error) {
      console.error('[setstatustext] Error:', error);
      await extra.reply(`❌ Failed to update status: ${error.message}`);
    }
  },
};
