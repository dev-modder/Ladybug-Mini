/**
 * BotStats2 Command - Detailed bot performance dashboard (owner only)
 * Ladybug V5.2
 *
 * Shows: uptime, memory, CPU, groups, chats, commands run, OS info
 *
 * Usage: .dashboard
 */

'use strict';

const os   = require('os');
const path = require('path');
const fs   = require('fs');

const DATA_DIR   = path.join(__dirname, '../../data');
const STATS_PATH = path.join(DATA_DIR, 'cmd_stats.json');

function loadCmdStats() {
  try { return fs.existsSync(STATS_PATH) ? JSON.parse(fs.readFileSync(STATS_PATH, 'utf8')) : {}; }
  catch (_) { return {}; }
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function fmtUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

module.exports = {
  name: 'dashboard',
  aliases: ['botstats2', 'botdash', 'system', 'sysinfo'],
  category: 'owner',
  description: 'Full bot performance and system dashboard',
  usage: '.dashboard',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const mem     = process.memoryUsage();
      const totMem  = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totMem - freeMem;
      const uptime  = process.uptime();
      const cpus    = os.cpus();
      const loadAvg = os.loadavg();

      // Count groups
      let groupCount = 0;
      try {
        const groups = await sock.groupFetchAllParticipating();
        groupCount = Object.keys(groups).length;
      } catch (_) {}

      // Command stats
      const cmdStats = loadCmdStats();
      const totalCmds = Object.values(cmdStats).reduce((a, b) => a + b, 0);
      const topCmds = Object.entries(cmdStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cmd, count]) => `  ${cmd}: ${count}x`)
        .join('\n');

      const cfg = (() => { try { delete require.cache[require.resolve('../../config')]; return require('../../config'); } catch (_) { return {}; } })();

      const text =
        `🐞 *Ladybug Dashboard*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `⏱️ *Uptime:* ${fmtUptime(uptime)}\n` +
        `🤖 *Bot Name:* ${cfg.botName || 'Ladybug V5'}\n` +
        `📌 *Prefix:* ${cfg.prefix || '.'}\n` +
        `🌍 *Mode:* ${cfg.mode || 'public'}\n` +
        `🏘️ *Groups:* ${groupCount}\n\n` +

        `💾 *Memory*\n` +
        `  Process: ${fmtBytes(mem.rss)} used\n` +
        `  Heap: ${fmtBytes(mem.heapUsed)} / ${fmtBytes(mem.heapTotal)}\n` +
        `  System: ${fmtBytes(usedMem)} / ${fmtBytes(totMem)}\n\n` +

        `🖥️ *System*\n` +
        `  OS: ${os.type()} ${os.release()}\n` +
        `  CPU: ${cpus[0]?.model || 'Unknown'} (${cpus.length} cores)\n` +
        `  Load: ${loadAvg.map(l => l.toFixed(2)).join(' | ')}\n` +
        `  Node: ${process.version}\n\n` +

        (totalCmds > 0
          ? `📊 *Commands Run:* ${totalCmds} total\n*Top 5:*\n${topCmds}\n\n`
          : '') +

        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Last updated: ${new Date().toLocaleString()}_`;

      await extra.reply(text);
    } catch (error) {
      console.error('[dashboard] Error:', error);
      await extra.reply(`❌ Dashboard error: ${error.message}`);
    }
  },
};
