/**
 * GetJID Command - Get the WhatsApp JID of a user, group, or newsletter (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .getjid                — show JID of current chat
 *   .getjid @mention       — show JID of mentioned user
 *   .getjid (reply to msg) — show JID of quoted message sender
 *   .getjid <phone number> — convert phone number to JID
 */

module.exports = {
  name: 'getjid',
  aliases: ['jid', 'chatid', 'userid'],
  category: 'owner',
  description: 'Get the JID of a user, group, or current chat',
  usage: '.getjid [@mention | reply | number]',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const results = [];

      // Current chat JID
      const chatJid = extra.from;
      results.push(`💬 *Current Chat JID:*\n\`${chatJid}\``);

      // Sender JID
      const senderJid = msg.key?.participant || msg.key?.remoteJid;
      if (senderJid && senderJid !== chatJid) {
        results.push(`👤 *Sender JID:*\n\`${senderJid}\``);
      }

      // Mentioned users
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentions && mentions.length > 0) {
        const mentionList = mentions.map((j) => `\`${j}\``).join('\n');
        results.push(`📌 *Mentioned JID(s):*\n${mentionList}`);
      }

      // Quoted message sender
      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      if (ctx?.quotedMessage && ctx?.participant) {
        results.push(`↩️ *Quoted Sender JID:*\n\`${ctx.participant}\``);
      }

      // Phone number argument
      if (args[0]) {
        const num = args[0].replace(/\D/g, '');
        if (num.length >= 7) {
          results.push(`📞 *Number → JID:*\n\`${num}@s.whatsapp.net\``);
        }
      }

      // Bot JID
      const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      results.push(`🤖 *Bot JID:*\n\`${botJid}\``);

      await extra.reply(
        `🆔 *JID Lookup — Ladybug V5*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
        results.join('\n\n') +
        `\n\n━━━━━━━━━━━━━━━━━━━━`
      );

    } catch (error) {
      console.error('[getjid] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
