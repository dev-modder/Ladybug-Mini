/**
 * Stats Command - Show bot runtime statistics (owner only)
 * Ladybug V5
 *
 * Usage: .stats
 */

const os = require('os');

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

module.exports = {
  name: 'stats',
  aliases: ['botstats', 'status', 'ping'],
  category: 'owner',
  description: 'Show bot runtime statistics and system info',
  usage: '.stats',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const config = require('../../config');

      // Timing
      const start    = Date.now();
      const uptime   = formatUptime(process.uptime());
      const nodeVer  = process.version;

      // Memory
      const memUsed  = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem  = os.freemem();
      const usedMem  = totalMem - freeMem;

      // CPU
      const cpus     = os.cpus();
      const cpuModel = cpus[0]?.model?.trim() || 'Unknown';
      const cpuCount = cpus.length;

      // Groups count
      let groupCount = 0;
      try {
        const groups = await sock.groupFetchAllParticipating();
        groupCount = Object.keys(groups).length;
      } catch (_) {}

      const latency = Date.now() - start;

      const text =
        `📊 *Ladybug V5 — Bot Stats*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🤖 *Bot Info*\n` +
        `  Name:      ${config.botName || 'Ladybug'}\n` +
        `  Version:   V5\n` +
        `  Prefix:    ${config.prefix || '.'}\n` +
        `  Groups:    ${groupCount}\n\n` +
        `⚡ *Performance*\n` +
        `  Uptime:    ${uptime}\n` +
        `  Latency:   ${latency}ms\n` +
        `  Node.js:   ${nodeVer}\n\n` +
        `💾 *Memory*\n` +
        `  Heap Used: ${formatBytes(memUsed.heapUsed)}\n` +
        `  RSS:       ${formatBytes(memUsed.rss)}\n` +
        `  System:    ${formatBytes(usedMem)} / ${formatBytes(totalMem)}\n\n` +
        `🖥️ *System*\n` +
        `  Platform:  ${os.platform()} (${os.arch()})\n` +
        `  CPU:       ${cpuModel} ×${cpuCount}\n` +
        `  Hostname:  ${os.hostname()}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━`;

      await extra.reply(text);

    } catch (error) {
      console.error('[stats] Error:', error);
      await extra.reply(`❌ Error fetching stats: ${error.message}`);
    }
  },
};
