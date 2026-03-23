/**
 * Unblock Command - Unblock a user (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .unblock @user           — unblock a tagged contact
 *   .unblock (reply to msg)  — unblock the sender of the quoted message
 *   .unblock 2638xxxxxxxx    — unblock by phone number
 */

module.exports = {
  name: 'unblock',
  aliases: ['unblockuser'],
  category: 'owner',
  description: 'Unblock a previously blocked user',
  usage: '.unblock @mention | reply to msg | phone number',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      let targetJid = null;

      // 1. Tagged mention
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentions && mentions.length > 0) {
        targetJid = mentions[0];
      }

      // 2. Quoted message sender
      if (!targetJid) {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        if (ctx?.quotedMessage && ctx?.participant) {
          targetJid = ctx.participant;
        }
      }

      // 3. Phone number argument
      if (!targetJid && args[0]) {
        const num = args[0].replace(/\D/g, '');
        if (num.length >= 7) {
          targetJid = `${num}@s.whatsapp.net`;
        }
      }

      if (!targetJid) {
        return extra.reply(
          `✅ *Unblock User*\n\n` +
          `Usage:\n` +
          `  • .unblock @mention\n` +
          `  • Reply to a message with .unblock\n` +
          `  • .unblock <phone number>  (e.g. .unblock 2638xxxxxxxx)`
        );
      }

      await sock.updateBlockStatus(targetJid, 'unblock');
      await extra.reply(`✅ Successfully unblocked \`${targetJid.split('@')[0]}\`.`);

    } catch (error) {
      console.error('[unblock] Error:', error);
      await extra.reply(`❌ Failed to unblock user: ${error.message}`);
    }
  },
};
