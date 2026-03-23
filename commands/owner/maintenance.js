/**
 * Maintenance Command - Toggle maintenance mode (owner only)
 * Ladybug V5
 *
 * When maintenance mode is ON, the bot ignores all commands from non-owners
 * and optionally auto-replies with a maintenance message.
 *
 * This sets/reads config.maintenance (boolean) and config.maintenanceMsg (string).
 *
 * Usage:
 *   .maintenance on
 *   .maintenance off
 *   .maintenance on <custom message>
 *   .maintenance         — show current status
 */

const fs   = require('fs');
const path = require('path');

module.exports = {
  name: 'maintenance',
  aliases: ['maintmode', 'maint'],
  category: 'owner',
  description: 'Toggle bot maintenance mode — ignores non-owner commands while active',
  usage: '.maintenance on|off [custom message]',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const config     = require('../../config');
      const configPath = path.join(__dirname, '../../config.js');

      if (!args[0]) {
        const status = config.maintenance ? '🔴 ON' : '🟢 OFF';
        return extra.reply(
          `🔧 *Maintenance Mode*\n\n` +
          `Status: *${status}*\n` +
          `Message: _${config.maintenanceMsg || 'Bot is under maintenance. Please wait.'}_ \n\n` +
          `Usage:\n` +
          `  .maintenance on\n` +
          `  .maintenance off\n` +
          `  .maintenance on <custom message>`
        );
      }

      const option = args[0].toLowerCase();
      if (!['on', 'off'].includes(option)) {
        return extra.reply('Usage: .maintenance on|off [custom message]');
      }

      const enabled = option === 'on';
      const customMsg = args.slice(1).join(' ').trim();

      let configContent = fs.readFileSync(configPath, 'utf8');

      // Update / insert maintenance flag
      if (configContent.includes('maintenance:')) {
        configContent = configContent.replace(
          /maintenance:\s*(true|false)/,
          `maintenance: ${enabled}`
        );
      } else {
        configContent = configContent.replace(
          /(module\.exports\s*=\s*\{)/,
          `$1\n  maintenance: ${enabled},`
        );
      }

      // Update / insert maintenanceMsg
      if (customMsg) {
        const escapedMsg = customMsg.replace(/'/g, "\\'");
        if (configContent.includes('maintenanceMsg:')) {
          configContent = configContent.replace(
            /maintenanceMsg:\s*'[^']*'/,
            `maintenanceMsg: '${escapedMsg}'`
          );
        } else {
          configContent = configContent.replace(
            /(module\.exports\s*=\s*\{)/,
            `$1\n  maintenanceMsg: '${escapedMsg}',`
          );
        }
      }

      fs.writeFileSync(configPath, configContent, 'utf8');
      delete require.cache[require.resolve('../../config')];

      const msg2 = customMsg || config.maintenanceMsg || 'Bot is under maintenance. Please wait.';

      await extra.reply(
        enabled
          ? `🔴 *Maintenance mode ENABLED*\n\nUsers will see:\n_${msg2}_`
          : `🟢 *Maintenance mode DISABLED*\n\nBot is back online for everyone.`
      );

    } catch (error) {
      console.error('[maintenance] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
