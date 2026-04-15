/**
 * SPromote Command - Promote someone to superadmin (owner only)
 * Ladybug V5 — promotes a user to admin in ALL groups the bot is in
 *
 * Usage: .spromote @user|number
 */

'use strict';

module.exports = {
  name: 'spromote',
  aliases: ['promoteall', 'globaladmin'],
  category: 'owner',
  description: 'Promote a user to admin in ALL groups the bot is in',
  usage: '.spromote @user|number',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      let targetJid =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.extendedTextMessage?.contextInfo?.participant || null;

      if (!targetJid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetJid = `${num}@s.whatsapp.net`;
      }

      if (!targetJid) {
        return extra.reply('❌ Usage: .spromote @mention or .spromote <number>');
      }

      await extra.reply(`🔄 Promoting @${targetJid.split('@')[0]} in all groups...`);

      const groups = Object.values(await sock.groupFetchAllParticipating());
      let promoted = 0;
      let failed   = 0;

      for (const g of groups) {
        const isMember = g.participants.some(p => p.id === targetJid);
        if (!isMember) continue;
        try {
          await sock.groupParticipantsUpdate(g.id, [targetJid], 'promote');
          promoted++;
          await new Promise(r => setTimeout(r, 400));
        } catch (_) { failed++; }
      }

      await sock.sendMessage(
        extra.from,
        {
          text: `⭐ *Global Promote Complete*\n\n@${targetJid.split('@')[0]}\n✅ Promoted: ${promoted} groups\n❌ Failed: ${failed} groups`,
          mentions: [targetJid],
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error('[spromote] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
