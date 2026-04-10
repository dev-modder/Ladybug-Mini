/**
 * Slowmode Command - Limit how often users can trigger bot commands (owner only)
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Sets a global cooldown (in seconds) between command uses per user.
 * The message handler reads config.slowmode and enforces it.
 *
 * Usage:
 *   .slowmode 10        — set 10-second cooldown per user
 *   .slowmode 0         — disable slowmode
 *   .slowmode           — check current setting
 */

'use strict';

const fs   = require('fs');
const path = require('path');

module.exports = {
  name: 'slowmode',
  aliases: ['cooldown', 'ratelimit', 'throttle'],
  category: 'owner',
  description: 'Set a per-user command cooldown in seconds',
  usage: '.slowmode <seconds | 0 to disable>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const config     = require('../../config');
      const configPath = path.join(__dirname, '../../config.js');

      // Show current status
      if (!args[0]) {
        const current = config.slowmode || 0;
        const status  = current > 0 ? `🔴 Active — ${current}s cooldown per user` : '🟢 Disabled';
        return extra.reply(
          `⏱️ *Slowmode*\n\n` +
          `Status: *${status}*\n\n` +
          `Usage:\n` +
          `  .slowmode <seconds>  — enable\n` +
          `  .slowmode 0          — disable`
        );
      }

      const seconds = parseInt(args[0], 10);
      if (isNaN(seconds) || seconds < 0) {
        return extra.reply('❌ Please provide a valid number of seconds. Use 0 to disable.');
      }

      if (seconds > 3600) {
        return extra.reply('❌ Maximum slowmode is 3600 seconds (1 hour).');
      }

      // Write to config
      let content = fs.readFileSync(configPath, 'utf8');
      if (content.includes('slowmode:')) {
        content = content.replace(/slowmode:\s*\d+/, `slowmode: ${seconds}`);
      } else {
        content = content.replace(
          /(module\.exports\s*=\s*\{)/,
          `$1\n  slowmode: ${seconds},`
        );
      }
      fs.writeFileSync(configPath, content, 'utf8');
      delete require.cache[require.resolve('../../config')];

      if (seconds === 0) {
        await extra.reply('🟢 *Slowmode disabled.*\n\nUsers can now trigger commands without cooldown.');
      } else {
        await extra.reply(
          `🔴 *Slowmode enabled*\n\n` +
          `Users must wait *${seconds} second${seconds !== 1 ? 's' : ''}* between commands.\n` +
          `Owners and admins bypass this limit.`
        );
      }

    } catch (error) {
      console.error('[slowmode] Error:', error);
      await extra.reply(`❌ Slowmode update failed: ${error.message}`);
    }
  },
};
