/**
 * Block Command - Block a user (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .block @user           — block a tagged contact
 *   .block (reply to msg)  — block the sender of the quoted message
 *   .block 2638xxxxxxxx    — block by phone number (no + or spaces)
 */

module.exports = {
  name: 'block',
  aliases: ['blockuser'],
  category: 'owner',
  description: 'Block a user from contacting the bot',
  usage: '.block @mention | reply to msg | phone number',
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
          `⛔ *Block User*\n\n` +
          `Usage:\n` +
          `  • .block @mention\n` +
          `  • Reply to a message with .block\n` +
          `  • .block <phone number>  (e.g. .block 2638xxxxxxxx)`
        );
      }

      // Prevent self-block
      const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      if (targetJid === botJid) {
        return extra.reply('❌ Cannot block myself!');
      }

      await sock.updateBlockStatus(targetJid, 'block');
      await extra.reply(`✅ Successfully blocked \`${targetJid.split('@')[0]}\`.`);

    } catch (error) {
      console.error('[block] Error:', error);
      await extra.reply(`❌ Failed to block user: ${error.message}`);
    }
  },
};
