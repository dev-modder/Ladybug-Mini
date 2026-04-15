/**
 * KickAll Command - Kick all non-admin members from a group (owner only)
 * Ladybug V5
 *
 * Usage: .kickall [confirm]
 */

'use strict';

module.exports = {
  name: 'kickall',
  aliases: ['removeall', 'cleargroup'],
  category: 'owner',
  description: 'Kick all non-admin members from the current group',
  usage: '.kickall confirm',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: true,
  botAdminOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      if (args[0]?.toLowerCase() !== 'confirm') {
        return extra.reply(
          '⚠️ *KickAll Warning*\n\n' +
          'This will remove ALL non-admin members from this group.\n\n' +
          'Type *.kickall confirm* to proceed.'
        );
      }

      const groupMeta = await sock.groupMetadata(extra.from);
      const botJid = sock.user?.id?.replace(/:\d+/, '') + '@s.whatsapp.net';
      const ownerJids = Array.isArray(require('../../config').ownerNumber)
        ? require('../../config').ownerNumber.map(n => `${n}@s.whatsapp.net`)
        : [`${require('../../config').ownerNumber}@s.whatsapp.net`];

      const toKick = groupMeta.participants.filter(p => {
        if (p.admin) return false;
        if (p.id === botJid) return false;
        if (ownerJids.includes(p.id)) return false;
        return true;
      }).map(p => p.id);

      if (!toKick.length) {
        return extra.reply('✅ No non-admin members to kick.');
      }

      await extra.reply(`🔄 Kicking ${toKick.length} members...`);

      let kicked = 0;
      for (const jid of toKick) {
        try {
          await sock.groupParticipantsUpdate(extra.from, [jid], 'remove');
          kicked++;
          await new Promise(r => setTimeout(r, 500));
        } catch (_) {}
      }

      await extra.reply(`✅ *KickAll Complete*\n\n👢 Kicked: ${kicked}/${toKick.length} members`);
    } catch (error) {
      console.error('[kickall] Error:', error);
      await extra.reply(`❌ KickAll failed: ${error.message}`);
    }
  },
};
