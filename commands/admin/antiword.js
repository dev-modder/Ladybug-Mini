/**
 * Antiword Command - Block specific words/phrases in a group
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Uses the database's built-in word filter (wordfilter.json).
 * The handler (handleWordFilter) already enforces it automatically.
 *
 * Usage:
 *   .antiword on|off            → toggle word filter for this group
 *   .antiword add <word>        → add a word to the group blocklist
 *   .antiword remove <word>     → remove a word from the blocklist
 *   .antiword list              → show all blocked words
 *   .antiword clear             → remove ALL words for this group
 *   .antiword action delete|kick|warn → set enforcement action
 */

'use strict';

const database = require('../../database');

module.exports = {
  name: 'antiword',
  aliases: ['wordfilter', 'banword', 'blockword', 'filtword'],
  category: 'admin',
  description: 'Block specific words in the group. Messages with banned words are auto-deleted.',
  usage: '.antiword on|off|add|remove|list|clear|action',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: true,

  async execute(sock, msg, args, extra) {
    try {
      const jid = extra.from;

      if (!args[0]) {
        const settings = database.getGroupSettings(jid);
        const enabled  = settings.wordfilter ? '✅ ON' : '❌ OFF';
        const action   = settings.wordfilterAction || 'delete';
        const words    = database.getWordFilterList(jid);
        return extra.reply(
          '🔤 *Word Filter Status*\n\n' +
          `Status: *${enabled}*\n` +
          `Action: *${action}*\n` +
          `Blocked words: *${words.length}*\n\n` +
          'Usage:\n' +
          '  .antiword on|off\n' +
          '  .antiword add <word or phrase>\n' +
          '  .antiword remove <word>\n' +
          '  .antiword list\n' +
          '  .antiword clear\n' +
          '  .antiword action delete|kick|warn'
        );
      }

      const sub = args[0].toLowerCase();

      // ── Toggle ───────────────────────────────────────────────
      if (sub === 'on' || sub === 'enable') {
        database.updateGroupSettings(jid, { wordfilter: true });
        return extra.reply('✅ *Word filter is now ON.*\nMessages with banned words will be deleted automatically.');
      }

      if (sub === 'off' || sub === 'disable') {
        database.updateGroupSettings(jid, { wordfilter: false });
        return extra.reply('❌ *Word filter is now OFF.*');
      }

      // ── Add a word ───────────────────────────────────────────
      if (sub === 'add') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) return extra.reply('❌ Please provide a word to ban.\nExample: .antiword add spam');

        const existing = database.getWordFilterList(jid);
        if (existing.includes(word)) {
          return extra.reply(`⚠️ *"${word}"* is already in the blocked list.`);
        }

        database.addBannedWord(word, jid);
        // Auto-enable the filter when a word is added
        database.updateGroupSettings(jid, { wordfilter: true });

        const updated = database.getWordFilterList(jid);
        return extra.reply(
          `✅ *"${word}"* added to blocked words.\n` +
          `Total: ${updated.length} word(s)\n` +
          'Word filter is *ON*.'
        );
      }

      // ── Remove a word ────────────────────────────────────────
      if (sub === 'remove' || sub === 'del') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) return extra.reply('❌ Please provide the word to remove.\nExample: .antiword remove spam');

        const existing = database.getWordFilterList(jid);
        if (!existing.includes(word)) {
          return extra.reply(`⚠️ *"${word}"* is not in the blocked list.`);
        }

        database.removeBannedWord(word, jid);
        const updated = database.getWordFilterList(jid);
        return extra.reply(
          `✅ *"${word}"* removed from blocked words.\n` +
          `Remaining: ${updated.length} word(s)`
        );
      }

      // ── List words ───────────────────────────────────────────
      if (sub === 'list' || sub === 'show') {
        const words = database.getWordFilterList(jid);
        if (!words.length) {
          return extra.reply('📋 No banned words set for this group.\nUse .antiword add <word> to add some.');
        }
        const list = words.map((w, i) => `${i + 1}. ${w}`).join('\n');
        return extra.reply(`📋 *Banned Words (${words.length}):*\n\n${list}`);
      }

      // ── Clear all words ──────────────────────────────────────
      if (sub === 'clear' || sub === 'reset') {
        const words = database.getWordFilterList(jid);
        if (!words.length) return extra.reply('ℹ️ No banned words to clear.');
        for (const word of [...words]) {
          database.removeBannedWord(word, jid);
        }
        return extra.reply(`🗑️ All ${words.length} banned word(s) cleared.`);
      }

      // ── Set action ───────────────────────────────────────────
      if (sub === 'action' || sub === 'set') {
        const action = (args[1] || '').toLowerCase();
        if (!['delete', 'kick', 'warn'].includes(action)) {
          return extra.reply(
            '❌ Invalid action.\n\n' +
            'Options:\n' +
            '  *delete* — silently delete the message\n' +
            '  *kick*   — remove the user from the group\n' +
            '  *warn*   — warn the user (auto-kick at 3 warns)'
          );
        }
        database.updateGroupSettings(jid, { wordfilterAction: action });
        return extra.reply(`✅ Word filter action set to *${action}*.`);
      }

      return extra.reply('❌ Unknown subcommand.\n\nUse: on, off, add, remove, list, clear, action');

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
