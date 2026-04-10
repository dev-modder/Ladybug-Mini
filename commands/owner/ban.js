/**
 * Ban Command - Prevent a user from using the bot (owner only)
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Stores banned JIDs in config.js bannedUsers array.
 * The message handler should check this list before processing commands.
 *
 * Usage:
 *   .ban @mention       — ban a user
 *   .unban @mention     — unban a user
 *   .banlist            — list all banned users
 */

'use strict';

const fs   = require('fs');
const path = require('path');

function loadConfig() {
  return require('../../config');
}

function getBannedList(config) {
  return Array.isArray(config.bannedUsers) ? config.bannedUsers : [];
}

function saveToConfig(key, value) {
  const configPath = path.join(__dirname, '../../config.js');
  let content = fs.readFileSync(configPath, 'utf8');

  const jsonValue = JSON.stringify(value);

  if (content.includes(`${key}:`)) {
    // Replace existing array
    content = content.replace(
      new RegExp(`${key}:\\s*\\[[^\\]]*\\]`),
      `${key}: ${jsonValue}`
    );
  } else {
    // Insert before closing }
    content = content.replace(
      /(module\.exports\s*=\s*\{)/,
      `$1\n  ${key}: ${jsonValue},`
    );
  }

  fs.writeFileSync(configPath, content, 'utf8');
  // Clear require cache so next load picks it up
  delete require.cache[require.resolve('../../config')];
}

module.exports = {
  name: 'ban',
  aliases: ['botban', 'blacklist'],
  category: 'owner',
  description: 'Ban a user from using the bot',
  usage: '.ban @mention',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const config = loadConfig();

      // ── banlist sub-command ──────────────────────────────
      if (args[0]?.toLowerCase() === 'list' || extra.command === 'banlist') {
        const banned = getBannedList(config);
        if (banned.length === 0) {
          return extra.reply('✅ No users are currently banned.');
        }
        const list = banned.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n');
        return await sock.sendMessage(
          extra.from,
          {
            text: `🚫 *Banned Users (${banned.length})*\n\n${list}`,
            mentions: banned,
          },
          { quoted: msg }
        );
      }

      // ── Resolve target JID ───────────────────────────────
      let targetJid =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.extendedTextMessage?.contextInfo?.participant ||
        null;

      if (!targetJid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetJid = `${num}@s.whatsapp.net`;
      }

      if (!targetJid) {
        return extra.reply(
          `🚫 *Ban User*\n\n` +
          `Usage: .ban @mention or reply to a message\n` +
          `.banlist — view all banned users\n` +
          `.unban @mention — remove ban`
        );
      }

      // Don't ban the owner
      const ownerJids = Array.isArray(config.ownerNumber)
        ? config.ownerNumber.map(n => `${n}@s.whatsapp.net`)
        : [`${config.ownerNumber}@s.whatsapp.net`];

      if (ownerJids.includes(targetJid)) {
        return extra.reply('❌ You cannot ban the bot owner.');
      }

      const banned = getBannedList(config);
      if (banned.includes(targetJid)) {
        return await sock.sendMessage(
          extra.from,
          { text: `⚠️ @${targetJid.split('@')[0]} is already banned.`, mentions: [targetJid] },
          { quoted: msg }
        );
      }

      banned.push(targetJid);
      saveToConfig('bannedUsers', banned);

      await sock.sendMessage(
        extra.from,
        {
          text: `🚫 *User Banned*\n\n@${targetJid.split('@')[0]} has been banned from using the bot.\nUse *.unban* to reverse this.`,
          mentions: [targetJid],
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error('[ban] Error:', error);
      await extra.reply(`❌ Ban failed: ${error.message}`);
    }
  },
};
