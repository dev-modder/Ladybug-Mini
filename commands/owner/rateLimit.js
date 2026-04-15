/**
 * RateLimit Command - Set rate limiting to prevent bot spam (owner only)
 * Ladybug V5
 *
 * Usage: .ratelimit <seconds>   — set cooldown per user
 *        .ratelimit off         — disable rate limiting
 *        .ratelimit status      — view current setting
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../../config.js');

function readConfig() {
  delete require.cache[require.resolve('../../config.js')];
  return require('../../config.js');
}
function writeNumKey(key, value) {
  let c = fs.readFileSync(CONFIG_PATH, 'utf8');
  if (c.includes(key + ':')) {
    c = c.replace(new RegExp(key + ':\\s*\\d+'), key + ': ' + value);
  } else {
    c = c.replace(/(module\.exports\s*=\s*\{)/, '$1\n  ' + key + ': ' + value + ',');
  }
  fs.writeFileSync(CONFIG_PATH, c, 'utf8');
  delete require.cache[require.resolve('../../config.js')];
}

module.exports = {
  name: 'ratelimit',
  aliases: ['cooldown', 'setcooldown', 'antispam'],
  category: 'owner',
  description: 'Set a per-user command cooldown to prevent spam',
  usage: '.ratelimit <seconds> | .ratelimit off | .ratelimit status',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const cfg = readConfig();
      const sub = args[0]?.toLowerCase();

      if (!sub || sub === 'status') {
        const val = cfg.rateLimitSeconds || 0;
        return extra.reply(
          `⏱️ *Rate Limit*\n\n` +
          `Current cooldown: *${val > 0 ? val + ' seconds per user' : 'Disabled'}*\n\n` +
          `Usage: .ratelimit <seconds> | .ratelimit off`
        );
      }

      if (sub === 'off' || sub === '0') {
        writeNumKey('rateLimitSeconds', 0);
        return extra.reply('✅ Rate limiting *disabled*.');
      }

      const secs = parseInt(sub);
      if (isNaN(secs) || secs < 1 || secs > 300) {
        return extra.reply('❌ Please provide a number between 1 and 300 seconds.');
      }

      writeNumKey('rateLimitSeconds', secs);
      await extra.reply(`✅ Rate limit set to *${secs} seconds* per user.\nUsers must wait ${secs}s between commands.`);
    } catch (error) {
      console.error('[ratelimit] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
