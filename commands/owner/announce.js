/**
 * Announce Command - Send a formatted announcement to all groups (owner only)
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Unlike broadcast (which sends plain text), announce sends a styled
 * announcement card. Optionally pin it in groups where bot is admin.
 *
 * Usage:
 *   .announce <title> | <message>
 *   .announce <message>   — uses "📢 ANNOUNCEMENT" as default title
 */

'use strict';

const config  = require('../../config');

const DELAY_MS = 1500;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function buildCard(title, body, botName, date) {
  return (
    `╔══════════════════════════╗\n` +
    `║  📢  *${title.toUpperCase()}*\n` +
    `╚══════════════════════════╝\n\n` +
    `${body}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🤖 *${botName}*  •  ${date}`
  );
}

module.exports = {
  name: 'announce',
  aliases: ['announcement', 'annc', 'pengumuman'],
  category: 'owner',
  description: 'Send a styled announcement to all groups',
  usage: '.announce <title> | <message>  OR  .announce <message>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `📢 *Announce*\n\n` +
          `Usage:\n` +
          `  .announce <message>\n` +
          `  .announce <title> | <message>\n\n` +
          `Example:\n` +
          `  .announce Bot Update | We have added 10 new commands! Check .menu`
        );
      }

      const fullText = args.join(' ').trim();
      let title, body;

      if (fullText.includes('|')) {
        const parts = fullText.split('|');
        title = parts[0].trim();
        body  = parts.slice(1).join('|').trim();
      } else {
        title = '📢 ANNOUNCEMENT';
        body  = fullText;
      }

      if (!body) return extra.reply('❌ Please provide a message to announce.');

      const botName = config.botName || 'LadybugBot';
      const date    = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const card = buildCard(title, body, botName, date);

      // Fetch all groups
      const groups    = await sock.groupFetchAllParticipating();
      const groupJids = Object.keys(groups);

      if (groupJids.length === 0) {
        return extra.reply('⚠️ Bot is not in any groups.');
      }

      // Send preview first
      await extra.reply(
        `📢 *Announce Preview*\n\n${card}\n\n` +
        `_Sending to ${groupJids.length} group(s)..._`
      );

      let sent = 0;
      let failed = 0;

      for (const jid of groupJids) {
        try {
          await sock.sendMessage(jid, { text: card });
          sent++;
          await sleep(DELAY_MS);
        } catch (err) {
          console.error(`[announce] Failed to send to ${jid}:`, err.message);
          failed++;
        }
      }

      await extra.reply(
        `✅ *Announcement Sent!*\n\n` +
        `📤 Delivered: ${sent} group(s)\n` +
        `❌ Failed: ${failed} group(s)`
      );

    } catch (error) {
      console.error('[announce] Error:', error);
      await extra.reply(`❌ Announce failed: ${error.message}`);
    }
  },
};
