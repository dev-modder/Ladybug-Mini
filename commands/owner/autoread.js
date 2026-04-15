/**
 * AutoRead Command - Toggle auto-read all incoming messages (owner only)
 * Ladybug V5
 *
 * Usage: .autoread on|off|status
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
  name: 'autoread',
  aliases: ['readall', 'autoreadmsg'],
  category: 'owner',
  description: 'Toggle auto-read all incoming messages (shows blue ticks)',
  usage: '.autoread on|off|status',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const cfg = readConfig();
      const sub = args[0]?.toLowerCase();

      if (!sub || sub === 'status') {
        const state = cfg.autoRead ? '✅ ON' : '❌ OFF';
        return extra.reply(`📖 *Auto-Read* is currently ${state}`);
      }

      if (sub === 'on') {
        writeConfigKey('autoRead', true);
        return extra.reply('✅ Auto-read *enabled*. Bot will mark all messages as read.');
      }

      if (sub === 'off') {
        writeConfigKey('autoRead', false);
        return extra.reply('❌ Auto-read *disabled*.');
      }

      return extra.reply('❌ Usage: .autoread on|off|status');
    } catch (error) {
      console.error('[autoread] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
