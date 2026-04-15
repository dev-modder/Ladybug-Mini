/**
 * Countdown Command - Time until a future date
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Usage:
 *   .countdown 2025-12-25                   → days until Christmas
 *   .countdown 2025-12-25 Christmas
 */

'use strict';

const config = require('../../config');
const TZ = config.timezone || 'Africa/Harare';

module.exports = {
  name: 'countdown',
  aliases: ['countdownto', 'daysuntil', 'daystill', 'timeuntil'],
  category: 'general',
  description: 'Count down to a future date',
  usage: '.countdown <YYYY-MM-DD> [event name]',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `⏳ *Countdown*\n\n` +
          `Usage: .countdown <YYYY-MM-DD> [event name]\n\n` +
          `Examples:\n` +
          `  .countdown 2025-12-25 Christmas\n` +
          `  .countdown 2025-01-01 New Year\n` +
          `  .countdown 2025-06-16 Youth Day`
        );
      }

      const dateStr = args[0];
      const event   = args.slice(1).join(' ') || 'Event';

      const target = new Date(dateStr + 'T00:00:00');
      if (isNaN(target.getTime())) {
        return extra.reply('❌ Invalid date. Use format: YYYY-MM-DD\nExample: .countdown 2025-12-25 Christmas');
      }

      const now  = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff < 0) {
        const pastDays = Math.floor(Math.abs(diff) / 86400000);
        return extra.reply(
          `⏳ *Countdown: ${event}*\n\n` +
          `📅 Date: ${dateStr}\n\n` +
          `✅ This date has already passed (${pastDays} day${pastDays > 1 ? 's' : ''} ago).`
        );
      }

      const days    = Math.floor(diff / 86400000);
      const hours   = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);

      const bar = (() => {
        // Show a visual "progress" — assume a 365-day max range
        const max = 365;
        const pct = Math.max(0, Math.min(100, (1 - days / max) * 100));
        const filled = Math.round(pct / 10);
        return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${pct.toFixed(0)}%`;
      })();

      await extra.reply(
        `⏳ *Countdown: ${event}*\n\n` +
        `📅 Target: ${target.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TZ })}\n\n` +
        `⏱️ *${days}d ${hours}h ${minutes}m*\n\n` +
        `Progress: [${bar}]`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
