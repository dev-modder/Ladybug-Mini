/**
 * CmdStats Command - Show most used commands statistics
 * Ladybug Bot Mini | by Dev-Ntando
 */

const database = require('../../database');

module.exports = {
  name: 'cmdstats',
  aliases: ['commandstats', 'topcommands', 'cs'],
  category: 'owner',
  description: 'Show statistics of most used bot commands',
  usage: '.cmdstats [top <n>]',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const cmdLog = database.get('cmdUsage') || {};
      const entries = Object.entries(cmdLog);

      if (!entries.length) {
        return extra.reply(
          `📊 *Command Statistics*\n\n` +
          `No command usage data collected yet.\n\n` +
          `_Commands will be tracked automatically once the bot starts processing them._`
        );
      }

      const limit = parseInt(args[1]) || 15;
      const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, limit);

      const total = entries.reduce((sum, [, count]) => sum + count, 0);
      const rows = sorted.map(([cmd, count], i) => {
        const bar = '█'.repeat(Math.min(10, Math.round((count / sorted[0][1]) * 10)));
        return `${String(i + 1).padStart(2)}. .${cmd.padEnd(16)} ${bar} ${count}`;
      }).join('\n');

      await extra.reply(
        `📊 *Command Usage Statistics*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📦 Total commands tracked: *${entries.length}*\n` +
        `🔢 Total executions: *${total}*\n\n` +
        `🏆 *Top ${sorted.length} Commands:*\n` +
        `\`\`\`\n${rows}\n\`\`\`\n\n` +
        `_Use *.cmdstats top 20* for more_`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
