/**
 * Confess Command - Send an anonymous confession to the group (Ladybug V5.2)
 *
 * The sender's identity is hidden — only the group sees the confession.
 * The bot owner can reveal the sender with .confessreveal <id>
 *
 * Usage:
 *   .confess <message>           — send anonymous confession to group
 *   .confessreveal <id>          — (owner only) reveal who sent it
 *   .confessoff / .confess off   — (admin) disable confessions in this group
 *   .confess on                  — (admin) re-enable confessions
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR    = path.join(process.cwd(), 'data');
const LOG_PATH    = path.join(DATA_DIR, 'confessions.json');
const CONFIG_PATH = path.join(process.cwd(), 'config.js');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let confessCounter = 1;

function loadLog() {
  try { return fs.existsSync(LOG_PATH) ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')) : { entries: [], disabledGroups: [] }; }
  catch (_) { return { entries: [], disabledGroups: [] }; }
}
function saveLog(d) { fs.writeFileSync(LOG_PATH, JSON.stringify(d, null, 2), 'utf8'); }

function isOwner(jid) {
  try {
    delete require.cache[require.resolve(CONFIG_PATH)];
    const cfg = require(CONFIG_PATH);
    const owners = Array.isArray(cfg.ownerNumber) ? cfg.ownerNumber : [cfg.ownerNumber];
    const num = jid.split('@')[0];
    return owners.some(o => String(o) === num);
  } catch (_) { return false; }
}

module.exports = {
  name: 'confess',
  aliases: ['anonymous', 'anon', 'confession'],
  category: 'fun',
  description: 'Send an anonymous confession to the group (identity hidden)',
  usage: '.confess <message>',

  async execute(sock, msg, args, extra) {
    try {
      const senderJid  = msg.key.participant || msg.key.remoteJid;
      const chatId     = extra.from;
      const isGroup    = chatId.endsWith('@g.us');
      const data       = loadLog();
      const sub        = args[0]?.toLowerCase();

      // ── Admin: toggle off/on ───────────────────────────────────────────
      if (sub === 'off' || extra.command === 'confessoff') {
        if (!isGroup) return extra.reply('⚠️ This command is for groups only.');
        if (!data.disabledGroups.includes(chatId)) {
          data.disabledGroups.push(chatId);
          saveLog(data);
        }
        return extra.reply('🔒 Anonymous confessions have been *disabled* in this group.');
      }

      if (sub === 'on') {
        if (!isGroup) return extra.reply('⚠️ This command is for groups only.');
        data.disabledGroups = data.disabledGroups.filter(g => g !== chatId);
        saveLog(data);
        return extra.reply('✅ Anonymous confessions are now *enabled* in this group.');
      }

      // ── Owner: reveal sender ───────────────────────────────────────────
      if (sub === 'reveal' || extra.command === 'confessreveal') {
        if (!isOwner(senderJid)) return extra.reply('❌ Only the bot owner can reveal confession senders.');
        const id = args[1];
        if (!id) return extra.reply('❌ Usage: .confess reveal <confession_id>');
        const entry = data.entries.find(e => e.id === id);
        if (!entry) return extra.reply(`⚠️ No confession found with ID *${id}*.`);
        return extra.reply(
          `🔍 *Confession Reveal*\n\n` +
          `🆔 ID: ${entry.id}\n` +
          `👤 Sender: @${entry.sender.split('@')[0]}\n` +
          `📝 Message: ${entry.text}\n` +
          `📅 Sent: ${new Date(entry.sentAt).toLocaleString()}`
        );
      }

      // ── Send confession ────────────────────────────────────────────────
      if (!isGroup) {
        return extra.reply(
          '⚠️ Confessions are for groups only.\n\n' +
          'Go to a group and type: .confess <your message>'
        );
      }

      if (data.disabledGroups.includes(chatId)) {
        return extra.reply('🔒 Anonymous confessions have been disabled in this group.');
      }

      if (!args.length || (args.length === 1 && ['on', 'off', 'reveal'].includes(sub))) {
        return extra.reply(
          `🤫 *Anonymous Confession*\n\n` +
          `Usage: .confess <your message>\n\n` +
          `Your identity will be completely hidden.\n` +
          `_Only the bot owner can see who sent it._`
        );
      }

      const text = args.join(' ').trim();
      if (text.length < 3)  return extra.reply('❌ Confession is too short.');
      if (text.length > 500) return extra.reply('❌ Confession is too long (max 500 characters).');

      // Generate ID
      const id = `C${Date.now().toString(36).toUpperCase()}`;

      // Log secretly (owner can reveal)
      data.entries.push({ id, sender: senderJid, text, sentAt: Date.now(), groupId: chatId });
      // Keep only last 500 entries
      if (data.entries.length > 500) data.entries = data.entries.slice(-500);
      saveLog(data);

      // Delete the sender's command message (so group doesn't see their name)
      try {
        await sock.sendMessage(chatId, { delete: msg.key });
      } catch (_) {}

      // Post to group anonymously
      await sock.sendMessage(chatId, {
        text:
          `🤫 *Anonymous Confession* [${id}]\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `_"${text}"_\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `_React to show support 💙_`,
      });

      // Quietly confirm to sender via DM
      const dmJid = senderJid.replace(/:\d+@/, '@');
      try {
        await sock.sendMessage(dmJid, {
          text:
            `✅ *Your confession was posted anonymously!*\n\n` +
            `🆔 ID: ${id}\n` +
            `📝 "${text}"\n\n` +
            `_Nobody knows it was you. 🤫_`,
        });
      } catch (_) {}

    } catch (error) {
      console.error('[confess] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
