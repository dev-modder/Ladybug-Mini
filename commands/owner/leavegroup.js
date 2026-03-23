/**
 * LeaveGroup Command - Make the bot leave a group (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .leavegroup              — leave the current group
 *   .leavegroup <group JID>  — leave a specific group by JID
 *   .leavegroup list         — list all groups the bot is in
 */

module.exports = {
  name: 'leavegroup',
  aliases: ['leave', 'leaveall'],
  category: 'owner',
  description: 'Make the bot leave a group',
  usage: '.leavegroup [group JID | list]',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      // List all groups
      if (args[0]?.toLowerCase() === 'list') {
        const groups = await sock.groupFetchAllParticipating();
        const groupList = Object.values(groups);

        if (groupList.length === 0) {
          return extra.reply('🤷 The bot is not in any groups.');
        }

        let text = `📋 *Groups (${groupList.length} total)*\n━━━━━━━━━━━━━━━━━━━━\n`;
        groupList.slice(0, 30).forEach((g, i) => {
          text += `${i + 1}. *${g.subject || 'Unnamed'}*\n   \`${g.id}\`\n`;
        });
        if (groupList.length > 30) text += `\n...and ${groupList.length - 30} more.`;
        text += `\n━━━━━━━━━━━━━━━━━━━━`;

        return extra.reply(text);
      }

      // Determine which group to leave
      let targetJid = extra.from;

      if (args[0]) {
        targetJid = args[0].trim();
        if (!targetJid.endsWith('@g.us')) {
          targetJid += '@g.us';
        }
      }

      if (!targetJid.endsWith('@g.us')) {
        return extra.reply(
          '❌ This command must be used in a group, or you must provide a group JID.\n\n' +
          'Use `.leavegroup list` to see all groups.'
        );
      }

      // Get group name for confirmation
      let groupName = targetJid;
      try {
        const meta = await sock.groupMetadata(targetJid);
        groupName = meta.subject || targetJid;
      } catch (_) {}

      await extra.reply(`👋 Leaving group: *${groupName}*...`);
      await sock.groupLeave(targetJid);

    } catch (error) {
      console.error('[leavegroup] Error:', error);
      await extra.reply(`❌ Failed to leave group: ${error.message}`);
    }
  },
};
