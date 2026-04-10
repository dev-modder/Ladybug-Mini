/**
 * SetAutoReply Command - Set a custom auto-reply for when the bot is in maintenance / offline mode (owner only)
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Saves a custom reply message to config.js.
 * The message handler should use config.autoReplyMsg when maintenance mode is on.
 *
 * Usage:
 *   .setautoreply <message>     — set custom auto-reply
 *   .setautoreply off           — disable custom auto-reply
 *   .setautoreply               — show current auto-reply
 */

'use strict';

const fs   = require('fs');
const path = require('path');

module.exports = {
  name: 'setautoreply',
  aliases: ['autoreply', 'autoreplymsg', 'setreply'],
  category: 'owner',
  description: 'Set a custom auto-reply message for maintenance mode',
  usage: '.setautoreply <message>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const config     = require('../../config');
      const configPath = path.join(__dirname, '../../config.js');

      // Show current
      if (!args.length) {
        const current = config.autoReplyMsg || 'Not set';
        const enabled = !!config.autoReplyMsg;
        return extra.reply(
          `💬 *Auto-Reply Message*\n\n` +
          `Status: *${enabled ? '🟢 Set' : '🔴 Not set'}*\n` +
          `Message: _${current}_\n\n` +
          `Usage:\n` +
          `  .setautoreply <message>  — set message\n` +
          `  .setautoreply off        — disable`
        );
      }

      let content = fs.readFileSync(configPath, 'utf8');

      if (args[0].toLowerCase() === 'off') {
        // Remove autoReplyMsg
        content = content.replace(/\n?\s*autoReplyMsg:\s*'[^']*',?/, '');
        fs.writeFileSync(configPath, content, 'utf8');
        delete require.cache[require.resolve('../../config')];
        return extra.reply('🔴 *Auto-reply disabled.*\nThe default maintenance message will be used.');
      }

      const message = args.join(' ').trim();
      if (message.length > 500) {
        return extra.reply('❌ Auto-reply message cannot exceed 500 characters.');
      }

      const escaped = message.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      if (content.includes('autoReplyMsg:')) {
        content = content.replace(/autoReplyMsg:\s*'[^']*'/, `autoReplyMsg: '${escaped}'`);
      } else {
        content = content.replace(
          /(module\.exports\s*=\s*\{)/,
          `$1\n  autoReplyMsg: '${escaped}',`
        );
      }

      fs.writeFileSync(configPath, content, 'utf8');
      delete require.cache[require.resolve('../../config')];

      await extra.reply(
        `✅ *Auto-Reply Set*\n\n` +
        `📝 Message:\n_${message}_\n\n` +
        `_This will be sent when maintenance mode is active._`
      );

    } catch (error) {
      console.error('[setautoreply] Error:', error);
      await extra.reply(`❌ Failed to set auto-reply: ${error.message}`);
    }
  },
};
