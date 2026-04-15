/**
 * SetReactMoji Command - Set the emoji used for auto-react (owner only)
 * Ladybug V5
 *
 * Usage: .setreactmoji <emoji>
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../../config.js');

function writeConfigKey(key, value) {
  let c = fs.readFileSync(CONFIG_PATH, 'utf8');
  const v = "'" + value.replace(/'/g, "\\'") + "'";
  if (c.includes(key + ':')) {
    c = c.replace(new RegExp(key + ":\\s*'[^']*'"), key + ': ' + v);
  } else {
    c = c.replace(/(module\.exports\s*=\s*\{)/, '$1\n  ' + key + ': ' + v + ',');
  }
  fs.writeFileSync(CONFIG_PATH, c, 'utf8');
  delete require.cache[require.resolve('../../config.js')];
}

module.exports = {
  name: 'setreactmoji',
  aliases: ['reactemoji', 'autoreactemoji'],
  category: 'owner',
  description: 'Set the emoji used for auto-react feature',
  usage: '.setreactmoji <emoji>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        const cfg = require('../../config');
        return extra.reply(
          `😀 *Auto-React Emoji*\n\n` +
          `Current: ${cfg.autoReactEmoji || '🐞'}\n\n` +
          `Usage: .setreactmoji <emoji>\nExample: .setreactmoji ❤️`
        );
      }

      const emoji = args[0].trim();
      writeConfigKey('autoReactEmoji', emoji);
      await extra.reply(`✅ Auto-react emoji set to: ${emoji}`);
    } catch (error) {
      console.error('[setreactmoji] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
