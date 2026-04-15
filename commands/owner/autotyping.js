/**
 * AutoTyping Command - Toggle auto-typing indicator (owner only)
 * Ladybug V5
 *
 * When enabled, the bot shows "typing..." before every response.
 *
 * Usage: .autotyping on|off|status
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
  name: 'autotyping',
  aliases: ['typing', 'autotyping'],
  category: 'owner',
  description: 'Toggle auto-typing indicator before bot responses',
  usage: '.autotyping on|off|status',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const cfg = readConfig();
      const sub = args[0]?.toLowerCase();

      if (!sub || sub === 'status') {
        const state = cfg.autoTyping !== false ? '✅ ON' : '❌ OFF';
        return extra.reply(`⌨️ *Auto-Typing* is currently ${state}`);
      }

      if (sub === 'on') {
        writeConfigKey('autoTyping', true);
        return extra.reply('✅ Auto-typing *enabled*. Bot will show typing... before responses.');
      }

      if (sub === 'off') {
        writeConfigKey('autoTyping', false);
        return extra.reply('❌ Auto-typing *disabled*.');
      }

      return extra.reply('❌ Usage: .autotyping on|off|status');
    } catch (error) {
      console.error('[autotyping] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
