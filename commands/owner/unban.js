/**
 * Unban Command - Remove a user from the bot ban list (owner only)
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Usage: .unban @mention
 */

'use strict';

const fs   = require('fs');
const path = require('path');

function saveToConfig(key, value) {
  const configPath = path.join(__dirname, '../../config.js');
  let content = fs.readFileSync(configPath, 'utf8');
  const jsonValue = JSON.stringify(value);
  if (content.includes(`${key}:`)) {
    content = content.replace(
      new RegExp(`${key}:\\s*\\[[^\\]]*\\]`),
      `${key}: ${jsonValue}`
    );
  } else {
    content = content.replace(
      /(module\.exports\s*=\s*\{)/,
      `$1\n  ${key}: ${jsonValue},`
    );
  }
  fs.writeFileSync(configPath, content, 'utf8');
  delete require.cache[require.resolve('../../config')];
}

module.exports = {
  name: 'unban',
  aliases: ['botunban', 'unblacklist'],
  category: 'owner',
  description: 'Remove a user from the bot ban list',
  usage: '.unban @mention',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const config = require('../../config');

      // Resolve target JID
      let targetJid =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.extendedTextMessage?.contextInfo?.participant ||
        null;

      if (!targetJid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetJid = `${num}@s.whatsapp.net`;
      }

      if (!targetJid) {
        return extra.reply('Usage: .unban @mention or reply to a message');
      }

      const banned = Array.isArray(config.bannedUsers) ? [...config.bannedUsers] : [];

      if (!banned.includes(targetJid)) {
        return await sock.sendMessage(
          extra.from,
          { text: `⚠️ @${targetJid.split('@')[0]} is not in the ban list.`, mentions: [targetJid] },
          { quoted: msg }
        );
      }

      const updated = banned.filter(jid => jid !== targetJid);
      saveToConfig('bannedUsers', updated);

      await sock.sendMessage(
        extra.from,
        {
          text: `✅ *User Unbanned*\n\n@${targetJid.split('@')[0]} can now use the bot again.`,
          mentions: [targetJid],
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error('[unban] Error:', error);
      await extra.reply(`❌ Unban failed: ${error.message}`);
    }
  },
};
