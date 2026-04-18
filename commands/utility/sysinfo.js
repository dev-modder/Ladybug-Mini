/**
 * SysInfo Command - Show system and bot info
 * Ladybug Bot Mini | by Dev-Ntando
 */

const os = require('os');

module.exports = {
  name: 'sysinfo',
  aliases: ['systeminfo', 'serverinfo'],
  category: 'utility',
  description: 'Display bot host system information',
  usage: '.sysinfo',

  async execute(sock, msg, args, extra) {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const platform = os.platform();
      const arch = os.arch();
      const hostname = os.hostname();
      const cpus = os.cpus();
      const nodeVersion = process.version;

      function formatBytes(b) {
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
        return `${(b / 1024 / 1024).toFixed(1)} MB`;
      }

      function formatUptime(sec) {
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
      }

      const info =
        `💻 *System Information*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🖥️ *Host:* ${hostname}\n` +
        `🔧 *OS:* ${platform} (${arch})\n` +
        `⚙️ *CPU:* ${cpus[0]?.model?.slice(0, 40) || 'Unknown'}\n` +
        `🧮 *CPU Cores:* ${cpus.length}\n` +
        `⏱️ *System Uptime:* ${formatUptime(os.uptime())}\n\n` +
        `💾 *Memory*\n` +
        `  Total: ${formatBytes(totalMem)}\n` +
        `  Used:  ${formatBytes(usedMem)}\n` +
        `  Free:  ${formatBytes(freeMem)}\n\n` +
        `🤖 *Bot Runtime*\n` +
        `  Node.js: ${nodeVersion}\n` +
        `  Uptime: ${formatUptime(process.uptime())}\n` +
        `  Heap: ${formatBytes(process.memoryUsage().heapUsed)}\n\n` +
        `> 🐞 Powered by Ladybug Bot`;

      await extra.reply(info);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
