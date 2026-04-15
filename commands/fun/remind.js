/**
 * Remind Command - Personal reminder timer for any user
 * Ladybug V5.2
 *
 * Anyone can set a personal reminder. The bot DMs them when time is up.
 *
 * Usage:
 *   .remind <time> <message>
 *   .remind 30m Call mum
 *   .remind 2h Meeting with boss
 *   .remind 1d Submit assignment
 *   .remind list        — view your active reminders
 *   .remind cancel <id> — cancel a reminder
 *
 * Time formats: 30s / 5m / 2h / 1d
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(process.cwd(), 'data');
const REM_PATH   = path.join(DATA_DIR, 'reminders.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

if (!global._remTimers) global._remTimers = {};

// ── Persistence helpers ────────────────────────────────────────────────────────
function loadAll() {
  try { return fs.existsSync(REM_PATH) ? JSON.parse(fs.readFileSync(REM_PATH, 'utf8')) : []; }
  catch (_) { return []; }
}
function saveAll(list) { fs.writeFileSync(REM_PATH, JSON.stringify(list, null, 2), 'utf8'); }

// ── Parse human time string ────────────────────────────────────────────────────
function parseTime(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return n * ms;
}

function fmtMs(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.round(s/60)}m`;
  if (s < 86400) return `${Math.round(s/3600)}h`;
  return `${Math.round(s/86400)}d`;
}

// ── Schedule one reminder ──────────────────────────────────────────────────────
function scheduleReminder(sock, entry) {
  const delay = entry.fireAt - Date.now();
  if (delay <= 0) return fireReminder(sock, entry);

  const timer = setTimeout(() => fireReminder(sock, entry), delay);
  global._remTimers[entry.id] = timer;
}

async function fireReminder(sock, entry) {
  try {
    await sock.sendMessage(entry.jid, {
      text:
        `⏰ *Reminder!*\n\n` +
        `📝 ${entry.text}\n\n` +
        `_Set ${new Date(entry.createdAt).toLocaleString()}_`,
    });
  } catch (e) {
    console.error('[remind] Fire error:', e.message);
  }
  // Remove from storage
  const list = loadAll().filter(r => r.id !== entry.id);
  saveAll(list);
  delete global._remTimers[entry.id];
}

// ── Re-hydrate reminders on module load ───────────────────────────────────────
// (called from handler after sock is ready)
module.exports.rehydrate = function(sock) {
  const list = loadAll();
  for (const entry of list) {
    if (!global._remTimers[entry.id]) scheduleReminder(sock, entry);
  }
};

// ── Command export ─────────────────────────────────────────────────────────────
module.exports = {
  name: 'remind',
  aliases: ['reminder', 'remindme', 'timer'],
  category: 'fun',
  description: 'Set a personal reminder — bot will DM you when time is up',
  usage: '.remind <time> <message>  (e.g. .remind 30m Call mum)',

  async execute(sock, msg, args, extra) {
    try {
      const senderJid  = msg.key.participant || msg.key.remoteJid;
      const senderName = msg.pushName || senderJid.split('@')[0];
      const dmJid      = senderJid.replace(/:\d+@/, '@'); // normalise

      if (!args.length) {
        return extra.reply(
          `⏰ *Reminder*\n\n` +
          `Usage: .remind <time> <message>\n\n` +
          `Examples:\n` +
          `• .remind 30m Call mum\n` +
          `• .remind 2h Meeting with boss\n` +
          `• .remind 1d Submit assignment\n\n` +
          `Other:\n` +
          `• .remind list\n` +
          `• .remind cancel <id>`
        );
      }

      const sub = args[0]?.toLowerCase();

      // ── List ──────────────────────────────────────────────────────────────
      if (sub === 'list') {
        const mine = loadAll().filter(r => r.jid === dmJid);
        if (!mine.length) return extra.reply('📭 You have no active reminders.\nSet one with .remind <time> <message>');
        const lines = mine.map((r, i) => {
          const remaining = Math.max(0, r.fireAt - Date.now());
          return `${i + 1}. [${r.id}] in *${fmtMs(remaining)}* — ${r.text}`;
        });
        return extra.reply(`⏰ *Your Reminders (${mine.length})*\n\n${lines.join('\n')}`);
      }

      // ── Cancel ────────────────────────────────────────────────────────────
      if (sub === 'cancel') {
        const id = args[1];
        if (!id) return extra.reply('❌ Usage: .remind cancel <id>');
        const list = loadAll();
        const idx = list.findIndex(r => r.id === id && r.jid === dmJid);
        if (idx === -1) return extra.reply(`⚠️ No reminder found with ID *${id}*.`);
        list.splice(idx, 1);
        saveAll(list);
        if (global._remTimers[id]) { clearTimeout(global._remTimers[id]); delete global._remTimers[id]; }
        return extra.reply(`✅ Reminder *${id}* cancelled.`);
      }

      // ── Set new reminder ──────────────────────────────────────────────────
      const timeStr = args[0];
      const ms = parseTime(timeStr);
      if (!ms) {
        return extra.reply(
          `❌ Invalid time format.\n\n` +
          `Use: *30s* (seconds), *5m* (minutes), *2h* (hours), *1d* (days)\n\n` +
          `Example: .remind 30m Call mum`
        );
      }
      if (ms < 5000)  return extra.reply('❌ Minimum reminder time is 5 seconds.');
      if (ms > 7 * 86400000) return extra.reply('❌ Maximum reminder time is 7 days.');

      const text = args.slice(1).join(' ').trim();
      if (!text) return extra.reply('❌ Please include a reminder message.\nExample: .remind 30m Call mum');

      // Limit per user
      const mine = loadAll().filter(r => r.jid === dmJid);
      if (mine.length >= 10) return extra.reply('⚠️ You already have 10 active reminders. Cancel some first.');

      const id    = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const entry = { id, jid: dmJid, text, createdAt: Date.now(), fireAt: Date.now() + ms };

      const list = loadAll();
      list.push(entry);
      saveAll(list);
      scheduleReminder(sock, entry);

      await extra.reply(
        `✅ *Reminder Set!*\n\n` +
        `📝 ${text}\n` +
        `⏱️ Fires in: *${fmtMs(ms)}*\n` +
        `🆔 ID: ${id}\n\n` +
        `_I'll DM you when it's time${extra.from.endsWith('@g.us') ? ' (check your DMs)' : ''}!_`
      );
    } catch (error) {
      console.error('[remind] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },

  rehydrate: function(sock) {
    const list = loadAll();
    for (const entry of list) {
      if (!global._remTimers[entry.id]) scheduleReminder(sock, entry);
    }
  },
};
