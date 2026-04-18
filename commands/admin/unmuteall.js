/**
 * UnmuteAll Command - Allow all members to send messages
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'unmuteall',
  aliases: ['openall'],
  category: 'admin',
  description: 'Allow all members to send messages (lift group mute)',
  usage: '.unmuteall',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;
      await sock.groupSettingUpdate(chatId, 'not_announcement');
      await extra.reply('🔊 *Group unmuted!* All members can send messages now.');
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
