/**
 * SetLang Command - Set the bot's default response language (owner only)
 * Ladybug V5
 *
 * Usage: .setlang <language>
 * Example: .setlang English | .setlang Shona | .setlang Zulu
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../../config.js');

function writeStringKey(key, value) {
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

const SUPPORTED = ['English', 'Shona', 'Ndebele', 'Zulu', 'Xhosa', 'Afrikaans', 'French', 'Portuguese', 'Swahili', 'Arabic'];

module.exports = {
  name: 'setlang',
  aliases: ['language', 'botlang', 'setlanguage'],
  category: 'owner',
  description: 'Set the default language for AI responses',
  usage: '.setlang <language>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        const cfg = require('../../config');
        return extra.reply(
          `🌍 *Bot Language*\n\n` +
          `Current: *${cfg.botLanguage || 'English'}*\n\n` +
          `Supported:\n${SUPPORTED.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\n` +
          `Usage: .setlang <language>`
        );
      }

      const lang = args.join(' ').trim();
      writeStringKey('botLanguage', lang);
      await extra.reply(`✅ Bot language set to *${lang}*.\n\nAI responses will now be in ${lang}.`);
    } catch (error) {
      console.error('[setlang] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
