/**
 * AntiBOT Command - Kick/ban other bots from groups (owner only)
 * Ladybug V5
 *
 * Detects other bots by common bot number patterns and kicks them.
 *
 * Usage: .antibot on|off|status|scan
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../../config.js');

function readConfig() {
  delete require.cache[require.resolve('../../config.js')];
  return require('../../config.js');
}
function writeBool(key, value) {
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

// Known bot number patterns / country codes commonly used by bots
const BOT_PATTERNS = [
  /^1415/, /^1650/, /^14155/,  // common Twilio/Meta bot numbers
];

function looksLikeBot(jid, name) {
  const num = jid.split('@')[0];
  if (BOT_PATTERNS.some(p => p.test(num))) return true;
  const lower = (name || '').toLowerCase();
  const botKeywords = ['bot', 'robot', 'auto', 'assistant', 'ai ', ' ai', 'helper'];
  return botKeywords.some(k => lower.includes(k));
}

module.exports = {
  name: 'antibot',
  aliases: ['botdetect', 'nobot'],
  category: 'owner',
  description: 'Auto-kick other bots from groups',
  usage: '.antibot on|off|status|scan',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const cfg = readConfig();
      const sub = args[0]?.toLowerCase();

      if (!sub || sub === 'status') {
        const state = cfg.antiBotMode ? '✅ ON' : '❌ OFF';
        return extra.reply(`🤖 *Anti-Bot Mode* is currently ${state}`);
      }

      if (sub === 'on') {
        writeBool('antiBotMode', true);
        return extra.reply('✅ *Anti-Bot Mode ON*\nOther bots will be kicked from groups automatically.');
      }

      if (sub === 'off') {
        writeBool('antiBotMode', false);
        return extra.reply('❌ *Anti-Bot Mode OFF*');
      }

      if (sub === 'scan') {
        if (!extra.from.endsWith('@g.us')) return extra.reply('⚠️ Run this in a group.');
        const meta = await sock.groupMetadata(extra.from);
        const botJid = sock.user?.id?.replace(/:\d+/, '') + '@s.whatsapp.net';
        const suspects = meta.participants.filter(p => {
          if (p.id === botJid) return false;
          if (p.admin) return false;
          return looksLikeBot(p.id, p.name || '');
        });

        if (!suspects.length) return extra.reply('✅ No bot suspects found in this group.');

        const list = suspects.map(p => `• @${p.id.split('@')[0]}`).join('\n');
        return await sock.sendMessage(
          extra.from,
          { text: `🔍 *Bot Suspects Found (${suspects.length})*\n\n${list}\n\nUse *.kick @user* to remove them.`, mentions: suspects.map(p => p.id) },
          { quoted: msg }
        );
      }

      return extra.reply('❌ Usage: .antibot on|off|status|scan');
    } catch (error) {
      console.error('[antibot] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
