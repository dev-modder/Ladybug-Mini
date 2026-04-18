/**
 * Dashboard Command - Full bot + system stats dashboard
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');
const os = require('os');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const p = [];
  if (d) p.push(`${d}d`);
  if (h) p.push(`${h}h`);
  if (m) p.push(`${m}m`);
  p.push(`${s}s`);
  return p.join(' ');
}

module.exports = {
  name: 'dashboard',
  aliases: ['dash', 'botstats', 'botinfo'],
  category: 'owner',
  description: 'Full bot + system stats dashboard',
  usage: '.dashboard',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const mem = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const cpuModel = os.cpus()[0]?.model || 'Unknown';
      const nodeVer = process.version;
      const platform = os.platform();
      const arch = os.arch();
      const uptime = formatUptime(Math.floor(process.uptime()));
      const sysUptime = formatUptime(os.uptime());
      const P = config.prefix || '.';
      const botName = config.botName || 'Ladybug Bot Mini';

      const dashboard =
        `🐞 *${botName} — Dashboard*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `🤖 *Bot Status*\n` +
        `  ⏱️ Bot Uptime:     ${uptime}\n` +
        `  ⚙️ Node.js:        ${nodeVer}\n` +
        `  🟢 Status:         Online & Active\n` +
        `  ⌨️ Prefix:         ${P}\n\n` +

        `💻 *System Info*\n` +
        `  🖥️ Platform:       ${platform} (${arch})\n` +
        `  🧮 CPU:            ${cpuModel.slice(0, 35)}\n` +
        `  ⏱️ System Uptime:  ${sysUptime}\n\n` +

        `💾 *Memory Usage*\n` +
        `  📦 Heap Used:      ${formatBytes(mem.heapUsed)}\n` +
        `  📦 Heap Total:     ${formatBytes(mem.heapTotal)}\n` +
        `  🖥️ RSS:            ${formatBytes(mem.rss)}\n` +
        `  🖥️ System RAM:     ${formatBytes(usedMem)} / ${formatBytes(totalMem)}\n` +
        `  🆓 Free RAM:       ${formatBytes(freeMem)}\n\n` +

        `👑 *Owner Info*\n` +
        `  Name: ${Array.isArray(config.ownerName) ? config.ownerName[0] : config.ownerName}\n` +
        `  Number: ${Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber}\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Built by Dev-Ntando 🇿🇼 | Ladybug Bot Mini_`;

      await extra.reply(dashboard);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
