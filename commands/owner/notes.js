/**
 * Notes Command - Save and retrieve owner notes (owner only)
 * Ladybug V5
 *
 * Usage: .note add <key> <text>
 *        .note get <key>
 *        .note list
 *        .note del <key>
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const DATA_DIR  = path.join(__dirname, '../../data');
const NOTES_PATH = path.join(DATA_DIR, 'owner_notes.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadNotes() {
  try { return fs.existsSync(NOTES_PATH) ? JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8')) : {}; }
  catch (_) { return {}; }
}
function saveNotes(n) { fs.writeFileSync(NOTES_PATH, JSON.stringify(n, null, 2), 'utf8'); }

module.exports = {
  name: 'note',
  aliases: ['notes', 'memo', 'savememo'],
  category: 'owner',
  description: 'Save and retrieve personal owner notes',
  usage: '.note add <key> <text> | .note get <key> | .note list | .note del <key>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const sub = args[0]?.toLowerCase();
      const notes = loadNotes();

      if (!sub || sub === 'list') {
        const keys = Object.keys(notes);
        if (!keys.length) return extra.reply('📭 No notes saved yet.\nUse .note add <key> <text>');
        const list = keys.map((k, i) => `${i + 1}. *${k}* — ${notes[k].slice(0, 50)}${notes[k].length > 50 ? '...' : ''}`);
        return extra.reply(`📝 *Your Notes (${keys.length})*\n\n${list.join('\n')}`);
      }

      if (sub === 'add') {
        if (args.length < 3) return extra.reply('❌ Usage: .note add <key> <text>');
        const key  = args[1].toLowerCase();
        const text = args.slice(2).join(' ');
        notes[key] = text;
        saveNotes(notes);
        return extra.reply(`✅ Note *${key}* saved.`);
      }

      if (sub === 'get') {
        const key = args[1]?.toLowerCase();
        if (!key) return extra.reply('❌ Usage: .note get <key>');
        if (!notes[key]) return extra.reply(`⚠️ No note found with key *${key}*.`);
        return extra.reply(`📝 *${key}*\n\n${notes[key]}`);
      }

      if (sub === 'del' || sub === 'delete' || sub === 'remove') {
        const key = args[1]?.toLowerCase();
        if (!key) return extra.reply('❌ Usage: .note del <key>');
        if (!notes[key]) return extra.reply(`⚠️ No note found with key *${key}*.`);
        delete notes[key];
        saveNotes(notes);
        return extra.reply(`🗑️ Note *${key}* deleted.`);
      }

      return extra.reply('❌ Usage: .note add|get|list|del <key> [text]');
    } catch (error) {
      console.error('[note] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
