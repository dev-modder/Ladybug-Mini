/**
 * List Members Command - Show all group members with their roles
 * Ladybug Bot V5 | by Dev-Ntando
 */

'use strict';

module.exports = {
  name: 'listmembers',
  aliases: ['members', 'groupmembers', 'memberlist', 'participants'],
  category: 'admin',
  description: 'List all group members with their admin status',
  usage: '.listmembers [admins|all]',
  groupOnly: true,
  adminOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const jid  = extra.from;
      const meta = await sock.groupMetadata(jid);

      if (!meta) return extra.reply('❌ Could not fetch group info.');

      const filter = (args[0] || 'all').toLowerCase();
      const all    = meta.participants || [];

      const admins  = all.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
      const regular = all.filter(p => !p.admin);
      const superAdmins = all.filter(p => p.admin === 'superadmin');

      if (filter === 'admins') {
        if (!admins.length) return extra.reply('ℹ️ No admins found.');

        const adminLines = admins.map(p => {
          const num  = p.id.split('@')[0];
          const role = p.admin === 'superadmin' ? '👑 Owner' : '🛡️ Admin';
          return `${role} +${num}`;
        }).join('\n');

        return extra.reply(
          `🛡️ *Group Admins (${admins.length})*\n\n${adminLines}`
        );
      }

      // All members view
      const adminLines   = admins.map(p => {
        const num  = p.id.split('@')[0];
        const role = p.admin === 'superadmin' ? '👑' : '🛡️';
        return `  ${role} +${num}`;
      }).join('\n');

      const memberLines = regular.slice(0, 100).map((p, i) => {
        const num = p.id.split('@')[0];
        return `  ${(i + 1).toString().padStart(3, ' ')}. +${num}`;
      }).join('\n');

      const truncated = regular.length > 100
        ? `\n  _(and ${regular.length - 100} more...)_`
        : '';

      await extra.reply(
        `👥 *${meta.subject}*\n` +
        `Total: *${all.length}* members\n\n` +
        `🛡️ *Admins (${admins.length}):*\n${adminLines || '  None'}\n\n` +
        `👤 *Members (${regular.length}):*\n${memberLines}${truncated}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
