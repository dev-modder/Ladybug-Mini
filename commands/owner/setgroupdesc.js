/**
 * SetGroupDesc Command - Change group description (owner only)
 * Ladybug V5
 *
 * Must be used inside a group. Bot must be admin.
 *
 * Usage:
 *   .setgroupdesc <new description>
 *   .setgroupdesc (reply to message — uses that text)
 *   .setgroupdesc clear           — clears the group description
 */

module.exports = {
  name: 'setgroupdesc',
  aliases: ['setdesc', 'groupdesc', 'changedesc'],
  category: 'owner',
  description: 'Change the group description (must be used in a group)',
  usage: '.setgroupdesc <text> | reply | clear',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: true,
  botAdminOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;

      if (!chatId.endsWith('@g.us')) {
        return extra.reply('❌ This command can only be used inside a group!');
      }

      let desc = '';

      // Quoted message
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quoted) {
        desc = (
          quoted.conversation ||
          quoted.extendedTextMessage?.text ||
          quoted.imageMessage?.caption ||
          ''
        ).trim();
      }

      if (!desc) {
        desc = args.join(' ').trim();
      }

      // Clear description
      if (desc.toLowerCase() === 'clear') {
        await sock.groupUpdateDescription(chatId, '');
        return extra.reply('✅ Group description cleared.');
      }

      if (!desc) {
        const meta = await sock.groupMetadata(chatId);
        return extra.reply(
          `📝 *Group Description*\n\n` +
          `Current:\n_${meta.desc || '(empty)'}_ \n\n` +
          `Usage:\n` +
          `  .setgroupdesc <new text>\n` +
          `  .setgroupdesc clear\n` +
          `  Or reply to a message with .setgroupdesc`
        );
      }

      await sock.groupUpdateDescription(chatId, desc);
      await extra.reply(`✅ Group description updated!\n\n_${desc}_`);

    } catch (error) {
      console.error('[setgroupdesc] Error:', error);
      if (error.message?.includes('not-authorized') || error.message?.includes('403')) {
        return extra.reply('❌ Bot must be an admin to change the group description!');
      }
      await extra.reply(`❌ Failed to update description: ${error.message}`);
    }
  },
};
