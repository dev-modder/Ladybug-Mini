/**
 * PinMsg Command - Pin a message or announce important info
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'pinmsg',
  aliases: ['pin', 'announce'],
  category: 'admin',
  description: 'Pin/announce a message to the group',
  usage: '.pinmsg <message>',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const text = args.join(' ').trim();
      if (!text) return extra.reply('📌 Please provide a message to pin.\n\nUsage: *.pinmsg <message>*');

      const P = config.prefix || '.';
      const announcement =
        `📌 *PINNED ANNOUNCEMENT*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${text}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_📢 From: Group Admin_`;

      await sock.sendMessage(extra.from, { text: announcement }, { quoted: msg });
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
