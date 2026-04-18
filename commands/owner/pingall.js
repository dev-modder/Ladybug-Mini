/**
 * PingAll Command - Tag all group members (owner-level mass ping)
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'pingall',
  aliases: ['massmention', 'notifyall'],
  category: 'owner',
  description: 'Send a notification ping to all members in a group (owner only)',
  usage: '.pingall [message]',
  ownerOnly: true,
  groupOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;
      const message = args.join(' ').trim() || '📢 Attention, everyone!';

      const metadata = await sock.groupMetadata(chatId);
      const participants = metadata.participants || [];
      const allJids = participants.map(p => p.id);

      if (!allJids.length) return extra.reply('❌ Could not fetch group members.');

      const mentionText = allJids.map(jid => `@${jid.split('@')[0]}`).join(' ');

      await sock.sendMessage(
        chatId,
        {
          text: `📢 *${message}*\n\n${mentionText}`,
          mentions: allJids,
        },
        { quoted: msg }
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
