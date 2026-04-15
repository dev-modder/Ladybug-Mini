/**
 * SetWelcomeMsg Command - Set a custom global welcome message template (owner only)
 * Ladybug V5
 *
 * Placeholders: {name}, {group}, {count}
 *
 * Usage: .setwelcomemsg <message>
 *        .setwelcomemsg reset
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../../config.js');

function writeStringKey(key, value) {
  let c = fs.readFileSync(CONFIG_PATH, 'utf8');
  const v = "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (c.includes(key + ':')) {
    c = c.replace(new RegExp(key + ":\\s*'[^']*'"), key + ': ' + v);
  } else {
    c = c.replace(/(module\.exports\s*=\s*\{)/, '$1\n  ' + key + ': ' + v + ',');
  }
  fs.writeFileSync(CONFIG_PATH, c, 'utf8');
  delete require.cache[require.resolve('../../config.js')];
}

const DEFAULT_WELCOME = '👋 Welcome {name} to {group}!\nWe now have {count} members.';

module.exports = {
  name: 'setwelcomemsg',
  aliases: ['welcometemplate', 'customwelcome'],
  category: 'owner',
  description: 'Set a custom global welcome message template',
  usage: '.setwelcomemsg <message> | .setwelcomemsg reset',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        const cfg = require('../../config');
        return extra.reply(
          `🎉 *Welcome Message Template*\n\n` +
          `Current:\n${cfg.globalWelcomeMsg || DEFAULT_WELCOME}\n\n` +
          `Placeholders: {name}, {group}, {count}\n` +
          `Usage: .setwelcomemsg <text>\n.setwelcomemsg reset`
        );
      }

      if (args[0].toLowerCase() === 'reset') {
        writeStringKey('globalWelcomeMsg', DEFAULT_WELCOME);
        return extra.reply(`✅ Welcome message reset to default.`);
      }

      const template = args.join(' ');
      writeStringKey('globalWelcomeMsg', template);
      await extra.reply(`✅ *Welcome message updated!*\n\n${template}`);
    } catch (error) {
      console.error('[setwelcomemsg] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
