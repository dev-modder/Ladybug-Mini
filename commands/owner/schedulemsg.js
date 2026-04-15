/**
 * ScheduleMsg Command - Schedule a message to be sent later (owner only)
 * Ladybug V5
 *
 * Usage: .schedulemsg <minutes> | <message>
 *        .schedulemsg list
 *        .schedulemsg cancel <id>
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const DATA_DIR  = path.join(__dirname, '../../data');
const SCHED_PATH = path.join(DATA_DIR, 'scheduled_messages.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadScheduled() {
  try { return fs.existsSync(SCHED_PATH) ? JSON.parse(fs.readFileSync(SCHED_PATH, 'utf8')) : []; }
  catch (_) { return []; }
}
function saveScheduled(list) { fs.writeFileSync(SCHED_PATH, JSON.stringify(list, null, 2), 'utf8'); }

// In-memory timer map
if (!global._schedTimers) global._schedTimers = {};

function scheduleOne(sock, entry) {
  const delay = entry.sendAt - Date.now();
  if (delay <= 0) return;
  const timer = setTimeout(async () => {
    try {
      await sock.sendMessage(entry.chatId, { text: entry.message });
    } catch (_) {}
    // Remove from list
    const list = loadScheduled().filter(e => e.id !== entry.id);
    saveScheduled(list);
    delete global._schedTimers[entry.id];
  }, delay);
  global._schedTimers[entry.id] = timer;
}

module.exports = {
  name: 'schedulemsg',
  aliases: ['schedule', 'sched', 'timedmsg'],
  category: 'owner',
  description: 'Schedule a message to be sent after N minutes',
  usage: '.schedulemsg <minutes> | <message>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const sub = args[0]?.toLowerCase();

      if (sub === 'list') {
        const list = loadScheduled();
        if (!list.length) return extra.reply('📭 No scheduled messages.');
        const lines = list.map((e, i) => {
          const inMs = e.sendAt - Date.now();
          const inMin = Math.max(0, Math.round(inMs / 60000));
          return `${i + 1}. [${e.id}] in ${inMin}m — ${e.message.slice(0, 40)}...`;
        });
        return extra.reply(`⏰ *Scheduled Messages*\n\n${lines.join('\n')}`);
      }

      if (sub === 'cancel') {
        const id = args[1];
        if (!id) return extra.reply('❌ Usage: .schedulemsg cancel <id>');
        const list = loadScheduled();
        const idx = list.findIndex(e => e.id === id);
        if (idx === -1) return extra.reply(`⚠️ No scheduled message with ID ${id}`);
        list.splice(idx, 1);
        saveScheduled(list);
        if (global._schedTimers[id]) { clearTimeout(global._schedTimers[id]); delete global._schedTimers[id]; }
        return extra.reply(`✅ Scheduled message *${id}* cancelled.`);
      }

      const full = args.join(' ');
      const parts = full.split('|');
      if (parts.length < 2) {
        return extra.reply('❌ Usage: .schedulemsg <minutes> | <message>\nExample: .schedulemsg 10 | Hello everyone!');
      }

      const minutes = parseInt(parts[0].trim());
      const message = parts.slice(1).join('|').trim();

      if (isNaN(minutes) || minutes < 1) return extra.reply('❌ Minutes must be a positive number.');
      if (!message) return extra.reply('❌ Message cannot be empty.');

      const id = Date.now().toString(36);
      const entry = { id, chatId: extra.from, message, sendAt: Date.now() + minutes * 60000, createdAt: Date.now() };
      const list = loadScheduled();
      list.push(entry);
      saveScheduled(list);
      scheduleOne(sock, entry);

      await extra.reply(`⏰ *Message Scheduled!*\n\n🆔 ID: ${id}\n⏱️ Sends in: ${minutes} minute(s)\n📝 Message: ${message}`);
    } catch (error) {
      console.error('[schedulemsg] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
