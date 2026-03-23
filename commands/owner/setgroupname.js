/**
 * SetGroupName Command - Change a group's subject/name (owner only)
 * Ladybug V5
 *
 * Must be used inside a group. Bot must be admin.
 *
 * Usage:
 *   .setgroupname <new name>
 *   .setgroupname (reply to message — uses quoted text as name)
 */

module.exports = {
  name: 'setgroupname',
  aliases: ['setgname', 'groupname', 'changegname', 'setsubject'],
  category: 'owner',
  description: 'Change the group name/subject (must be used in a group)',
  usage: '.setgroupname <new name>',
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

      let name = '';

      // Quoted message text
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quoted) {
        name = (
          quoted.conversation ||
          quoted.extendedTextMessage?.text ||
          ''
        ).trim();
      }

      if (!name) {
        name = args.join(' ').trim();
      }

      if (!name) {
        const meta = await sock.groupMetadata(chatId);
        return extra.reply(
          `📛 *Group Name*\n\n` +
          `Current: *${meta.subject || '(unknown)'}*\n\n` +
          `Usage: .setgroupname <new name>\n` +
          `Or reply to a message with .setgroupname`
        );
      }

      if (name.length > 100) {
        return extra.reply(`❌ Name too long (${name.length}/100 characters).`);
      }

      await sock.groupUpdateSubject(chatId, name);
      await extra.reply(`✅ Group name changed to: *${name}*`);

    } catch (error) {
      console.error('[setgroupname] Error:', error);
      if (error.message?.includes('not-authorized') || error.message?.includes('403')) {
        return extra.reply('❌ Bot must be an admin to change the group name!');
      }
      await extra.reply(`❌ Failed to update group name: ${error.message}`);
    }
  },
};
