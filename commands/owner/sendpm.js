/**
 * SendPM Command - Send a private message to any number (owner only)
 * Ladybug V5
 *
 * Usage: .sendpm <number> | <message>
 */

'use strict';

module.exports = {
  name: 'sendpm',
  aliases: ['dm', 'pmuser'],
  category: 'owner',
  description: 'Send a private message to any number',
  usage: '.sendpm <number> | <message>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const full = args.join(' ');
      const parts = full.split('|');
      if (parts.length < 2) {
        return extra.reply(
          '❌ Usage: .sendpm <number> | <message>\n\n' +
          'Example: .sendpm 263771234567 | Hello there!'
        );
      }

      const number = parts[0].trim().replace(/[^0-9]/g, '');
      const message = parts.slice(1).join('|').trim();

      if (!number || !message) {
        return extra.reply('❌ Both number and message are required.');
      }

      const jid = `${number}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: message });
      await extra.reply(`✅ Message sent to *+${number}*`);
    } catch (error) {
      console.error('[sendpm] Error:', error);
      await extra.reply(`❌ Failed to send message: ${error.message}`);
    }
  },
};
