/**
 * ForwardMsg Command - Forward a quoted/replied message to another chat (owner only)
 * Ladybug V5
 *
 * Usage: Reply to a message then: .forward <number|groupJID>
 */

'use strict';

module.exports = {
  name: 'forward',
  aliases: ['fwd', 'forwardmsg', 'sendto'],
  category: 'owner',
  description: 'Forward a quoted message to another chat or number',
  usage: '.forward <number|JID>  (reply to the message you want to forward)',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('❌ Usage: .forward <number|JID>\nReply to the message you want to forward.');
      }

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) {
        return extra.reply('❌ Please *reply* to the message you want to forward.');
      }

      const dest = args[0].trim();
      let destJid;
      if (dest.includes('@')) {
        destJid = dest;
      } else {
        const num = dest.replace(/[^0-9]/g, '');
        destJid = `${num}@s.whatsapp.net`;
      }

      // Build forwarded message
      const fwdContent = { forward: msg };
      // Fallback: send quoted content directly
      const text = quoted.conversation || quoted.extendedTextMessage?.text || quoted.imageMessage?.caption || '';

      if (text) {
        await sock.sendMessage(destJid, { text: `📨 *Forwarded:*\n\n${text}` });
      } else {
        // Try to forward the actual message
        await sock.sendMessage(destJid, { forward: { key: msg.message?.extendedTextMessage?.contextInfo, message: quoted } });
      }

      await extra.reply(`✅ Message forwarded to *${dest}*.`);
    } catch (error) {
      console.error('[forward] Error:', error);
      await extra.reply(`❌ Forward failed: ${error.message}`);
    }
  },
};
