/**
 * GhostMode Command - Toggle invisible/ghost mode (owner only)
 * Ladybug V5
 *
 * When ON: bot processes commands but doesn't show online/typing presence.
 * Disables auto-typing, presence updates, and read receipts.
 *
 * Usage: .ghostmode on|off|status
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../../config.js');

function readConfig() {
  delete require.cache[require.resolve('../../config.js')];
  return require('../../config.js');
}
function writeConfigKey(key, value) {
  let c = fs.readFileSync(CONFIG_PATH, 'utf8');
  const v = String(value);
  if (c.includes(key + ':')) {
    c = c.replace(new RegExp(key + ':\\s*(true|false)'), key + ': ' + v);
  } else {
    c = c.replace(/(module\.exports\s*=\s*\{)/, '$1\n  ' + key + ': ' + v + ',');
  }
  fs.writeFileSync(CONFIG_PATH, c, 'utf8');
  delete require.cache[require.resolve('../../config.js')];
}

module.exports = {
  name: 'ghostmode',
  aliases: ['ghost', 'invisible', 'stealth'],
  category: 'owner',
  description: 'Toggle ghost mode — bot works silently with no presence updates',
  usage: '.ghostmode on|off|status',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const cfg = readConfig();
      const sub = args[0]?.toLowerCase();

      if (!sub || sub === 'status') {
        const state = cfg.ghostMode ? '👻 ON (invisible)' : '❌ OFF (visible)';
        return extra.reply(`👻 *Ghost Mode* is currently ${state}`);
      }

      if (sub === 'on') {
        writeConfigKey('ghostMode', true);
        // Disable presence
        try { await sock.sendPresenceUpdate('unavailable'); } catch (_) {}
        return extra.reply(
          '👻 *Ghost Mode ON*\n\n' +
          'The bot is now invisible:\n' +
          '• No typing indicator\n' +
          '• No online status\n' +
          '• No read receipts\n' +
          '• Commands still work normally'
        );
      }

      if (sub === 'off') {
        writeConfigKey('ghostMode', false);
        try { await sock.sendPresenceUpdate('available'); } catch (_) {}
        return extra.reply('✅ *Ghost Mode OFF* — Bot is visible again.');
      }

      return extra.reply('❌ Usage: .ghostmode on|off|status');
    } catch (error) {
      console.error('[ghostmode] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
