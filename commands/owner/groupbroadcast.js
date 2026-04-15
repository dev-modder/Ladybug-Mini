/**
 * GroupBroadcast Command - Broadcast a message to selected/all groups (owner only)
 * Ladybug V5.2
 *
 * Usage:
 *   .gbroadcast <message>             — send to ALL groups
 *   .gbroadcast -s <JID> | <message>  — send to specific group by JID
 *   .gbroadcast list                  — list groups with their index
 *   .gbroadcast -n <1,3,5> | <msg>   — send to groups by index number
 */

'use strict';

module.exports = {
  name: 'gbroadcast',
  aliases: ['groupbroadcast', 'gbcast', 'sendgroups'],
  category: 'owner',
  description: 'Broadcast a message to all or selected groups',
  usage: '.gbroadcast <message> | .gbroadcast list | .gbroadcast -n <1,2> | <msg>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          '📢 *Group Broadcast*\n\n' +
          'Usage:\n' +
          '.gbroadcast <message>           — all groups\n' +
          '.gbroadcast list                — list groups\n' +
          '.gbroadcast -n 1,3 | <msg>      — specific groups by index\n' +
          '.gbroadcast -s <JID> | <msg>    — specific group by JID'
        );
      }

      const groups = Object.values(await sock.groupFetchAllParticipating())
        .sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));

      const sub = args[0]?.toLowerCase();

      // List mode
      if (sub === 'list') {
        if (!groups.length) return extra.reply('📭 Bot is not in any groups.');
        const lines = groups.map((g, i) => `${i + 1}. *${g.subject || 'Unnamed'}* (${g.participants?.length || 0} members)`);
        return extra.reply(`🏘️ *Groups (${groups.length})*\n\n${lines.join('\n')}`);
      }

      let targets = groups;
      let message = args.join(' ');

      // Specific by index
      if (sub === '-n') {
        const full = args.slice(1).join(' ');
        const parts = full.split('|');
        if (parts.length < 2) return extra.reply('❌ Usage: .gbroadcast -n 1,3 | <message>');
        const nums = parts[0].split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n));
        targets = nums.map(i => groups[i]).filter(Boolean);
        message = parts.slice(1).join('|').trim();
        if (!targets.length) return extra.reply('❌ No valid group indices. Use .gbroadcast list to see numbers.');
      }

      // Specific by JID
      else if (sub === '-s') {
        const full = args.slice(1).join(' ');
        const parts = full.split('|');
        if (parts.length < 2) return extra.reply('❌ Usage: .gbroadcast -s <JID> | <message>');
        const jid = parts[0].trim();
        targets = groups.filter(g => g.id === jid || g.id.startsWith(jid));
        message = parts.slice(1).join('|').trim();
        if (!targets.length) return extra.reply(`❌ No group found with JID: ${jid}`);
      }

      if (!message.trim()) return extra.reply('❌ Message cannot be empty.');

      await extra.reply(`📡 Broadcasting to ${targets.length} group(s)...`);

      let sent = 0, failed = 0;
      for (const g of targets) {
        try {
          await sock.sendMessage(g.id, { text: message });
          sent++;
          await new Promise(r => setTimeout(r, 600)); // Avoid spam detection
        } catch (e) {
          console.log(`[gbroadcast] Failed for ${g.id}: ${e.message}`);
          failed++;
        }
      }

      await extra.reply(
        `✅ *Group Broadcast Complete*\n\n` +
        `📤 Sent: ${sent}/${targets.length} groups\n` +
        (failed > 0 ? `❌ Failed: ${failed} groups\n` : '')
      );
    } catch (error) {
      console.error('[gbroadcast] Error:', error);
      await extra.reply(`❌ Broadcast failed: ${error.message}`);
    }
  },
};
