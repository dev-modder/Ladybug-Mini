/**
 * MuteAll Command - Mute all non-admin members in the group
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'muteall',
  aliases: ['silenceall'],
  category: 'admin',
  description: 'Restrict all non-admin members from sending messages',
  usage: '.muteall',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;
      await sock.groupSettingUpdate(chatId, 'announcement');
      await extra.reply('🔇 *Group muted!* Only admins can send messages now.');
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
