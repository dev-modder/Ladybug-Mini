/**
 * Group Lock/Unlock Command - Restrict group to admins-only messaging
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Usage:
 *   .grouplock on|lock    → only admins can send messages
 *   .grouplock off|unlock → all members can send messages
 *   .grouplock status     → check current setting
 */

'use strict';

module.exports = {
  name: 'grouplock',
  aliases: ['lockgroup', 'lock', 'unlock', 'groupunlock'],
  category: 'admin',
  description: 'Lock the group so only admins can send messages',
  usage: '.grouplock on|off|status',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const jid = extra.from;
      const sub = (args[0] || 'status').toLowerCase();

      // Get current metadata
      const meta = await sock.groupMetadata(jid);
      if (!meta) return extra.reply('❌ Could not fetch group info.');

      const isLocked = meta.announce; // announce=true means only admins

      if (sub === 'status' || sub === 'check') {
        return extra.reply(
          `🔒 *Group Lock Status*\n\n` +
          `Status: *${isLocked ? '🔒 LOCKED (admins only)' : '🔓 UNLOCKED (all members)'}*\n\n` +
          `Use:\n  .grouplock on  → lock\n  .grouplock off → unlock`
        );
      }

      if (sub === 'on' || sub === 'lock' || sub === 'enable' || sub === '1') {
        if (isLocked) return extra.reply('ℹ️ Group is already locked.');
        await sock.groupSettingUpdate(jid, 'announcement');
        return extra.reply('🔒 *Group Locked!*\nOnly admins can send messages now.');
      }

      if (sub === 'off' || sub === 'unlock' || sub === 'disable' || sub === '0') {
        if (!isLocked) return extra.reply('ℹ️ Group is already unlocked.');
        await sock.groupSettingUpdate(jid, 'not_announcement');
        return extra.reply('🔓 *Group Unlocked!*\nAll members can send messages now.');
      }

      return extra.reply('❌ Unknown subcommand.\nUse: .grouplock on | .grouplock off | .grouplock status');

    } catch (error) {
      if (error.message?.includes('forbidden') || error.message?.includes('403')) {
        await extra.reply('❌ Bot needs admin privileges to lock/unlock the group.');
      } else {
        await extra.reply(`❌ Error: ${error.message}`);
      }
    }
  },
};
