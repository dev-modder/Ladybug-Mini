/**
 * CustomReply Command - Set custom keyword-triggered auto-replies (owner only)
 * Ladybug V5.2
 *
 * When someone sends a message containing a keyword, the bot auto-replies.
 * Works in both DMs and groups (if AI auto-reply or similar handler is active).
 *
 * Usage:
 *   .customreply add <keyword> | <response>
 *   .customreply list
 *   .customreply del <keyword>
 *   .customreply clear
 *   .customreply on|off
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const DATA_DIR   = path.join(__dirname, '../../data');
const REPLY_PATH = path.join(DATA_DIR, 'custom_replies.json');
const CONFIG_PATH = path.join(__dirname, '../../config.js');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadReplies() {
  try { return fs.existsSync(REPLY_PATH) ? JSON.parse(fs.readFileSync(REPLY_PATH, 'utf8')) : { enabled: true, rules: {} }; }
  catch (_) { return { enabled: true, rules: {} }; }
}
function saveReplies(data) { fs.writeFileSync(REPLY_PATH, JSON.stringify(data, null, 2), 'utf8'); }

module.exports = {
  name: 'customreply',
  aliases: ['autoreplyword', 'keywordreply', 'creply', 'cr'],
  category: 'owner',
  description: 'Set custom keyword-triggered auto-replies',
  usage: '.customreply add <keyword> | <reply> | .customreply list | .customreply del <keyword>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const data = loadReplies();
      const sub  = args[0]?.toLowerCase();

      if (!sub) {
        return extra.reply(
          `💬 *Custom Keyword Replies*\n\n` +
          `Status: ${data.enabled ? '✅ ON' : '❌ OFF'}\n` +
          `Rules: ${Object.keys(data.rules).length}\n\n` +
          `Commands:\n` +
          `.customreply add <keyword> | <response>\n` +
          `.customreply list\n` +
          `.customreply del <keyword>\n` +
          `.customreply clear\n` +
          `.customreply on | off`
        );
      }

      if (sub === 'on') {
        data.enabled = true;
        saveReplies(data);
        return extra.reply('✅ Custom keyword replies *enabled*.');
      }

      if (sub === 'off') {
        data.enabled = false;
        saveReplies(data);
        return extra.reply('❌ Custom keyword replies *disabled*.');
      }

      if (sub === 'list') {
        const rules = Object.entries(data.rules);
        if (!rules.length) return extra.reply('📭 No custom replies set yet.\nUse: .customreply add <keyword> | <reply>');
        const lines = rules.map(([kw, resp], i) => `${i + 1}. *${kw}* → ${resp.slice(0, 50)}${resp.length > 50 ? '...' : ''}`);
        return extra.reply(`💬 *Custom Replies (${rules.length})*\nStatus: ${data.enabled ? '✅ ON' : '❌ OFF'}\n\n${lines.join('\n')}`);
      }

      if (sub === 'add') {
        const full = args.slice(1).join(' ');
        const parts = full.split('|');
        if (parts.length < 2) return extra.reply('❌ Usage: .customreply add <keyword> | <response>');
        const keyword  = parts[0].trim().toLowerCase();
        const response = parts.slice(1).join('|').trim();
        if (!keyword || !response) return extra.reply('❌ Both keyword and response are required.');
        data.rules[keyword] = response;
        saveReplies(data);
        return extra.reply(`✅ Custom reply added:\n*"${keyword}"* → ${response}`);
      }

      if (sub === 'del' || sub === 'delete' || sub === 'remove') {
        const keyword = args.slice(1).join(' ').trim().toLowerCase();
        if (!keyword) return extra.reply('❌ Usage: .customreply del <keyword>');
        if (!data.rules[keyword]) return extra.reply(`⚠️ No rule found for keyword: *${keyword}*`);
        delete data.rules[keyword];
        saveReplies(data);
        return extra.reply(`🗑️ Custom reply for *"${keyword}"* deleted.`);
      }

      if (sub === 'clear') {
        data.rules = {};
        saveReplies(data);
        return extra.reply('🧹 All custom replies cleared.');
      }

      return extra.reply('❌ Unknown sub-command. Use: add, list, del, clear, on, off');
    } catch (error) {
      console.error('[customreply] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },

  // ── Handler hook — call this from your message handler to process custom replies ──
  checkAndReply: function(sock, msg, chatId, text) {
    try {
      const data = loadReplies();
      if (!data.enabled) return false;
      const lower = text?.toLowerCase() || '';
      for (const [keyword, response] of Object.entries(data.rules)) {
        if (lower.includes(keyword)) {
          sock.sendMessage(chatId, { text: response }, { quoted: msg }).catch(() => {});
          return true;
        }
      }
      return false;
    } catch (_) { return false; }
  },
};
