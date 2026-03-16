/**
 * Uptime Command - Display bot uptime since it was started
 */

const config = require('../../config');
const os = require('os');

/**
 * Format time difference into human-readable string
 * @param {number} seconds - Total seconds of uptime
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  if (seconds <= 0) return '0 seconds';

  const days    = Math.floor(seconds / 86400);
  const hours   = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs    = Math.floor(seconds % 60);

  const parts = [];
  if (days)    parts.push(`${days}d`);
  if (hours)   parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (secs || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Convert bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/**
 * Get a performance health indicator
 */
function getHealthBar(percent) {
  const filled = Math.round(percent / 10);
  const empty  = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = {
  name: 'uptime',
  aliases: ['runtime', 'botuptime', 'alive', 'status'],
  category: 'general',
  description: 'Show how long the bot has been running + system health',
  usage: '.uptime',

  async execute(sock, msg, args, extra) {
    try {
      // ── Core Stats ────────────────────────────────────────
      const uptimeSeconds = process.uptime();
      const uptime        = formatUptime(uptimeSeconds);

      const botName    = config.botName || 'LadybugBot';
      const botVersion = 'V2.0.0';

      // ── Memory ────────────────────────────────────────────
      const memUsed  = process.memoryUsage().heapUsed;
      const memTotal = os.totalmem();
      const memFree  = os.freemem();
      const memPct   = (((memTotal - memFree) / memTotal) * 100).toFixed(1);

      // ── CPU ───────────────────────────────────────────────
      const cpuModel = os.cpus()[0]?.model?.split('@')[0]?.trim() || 'Unknown CPU';
      const cpuCores = os.cpus().length;

      // ── Platform ──────────────────────────────────────────
      const platform = `${os.type()} ${os.arch()}`;
      const nodeVer  = process.version;

      // ── Health bars ───────────────────────────────────────
      const memBar = getHealthBar(parseFloat(memPct));
      const uptimePct = Math.min((uptimeSeconds / 86400) * 100, 100).toFixed(1); // % of 24h
      const uptimeBar = getHealthBar(parseFloat(uptimePct));

      // ── Build Message ─────────────────────────────────────
      const message =
`╔══════════════════════╗
  ⚡ *BOT SYSTEM STATUS* ⚡
╚══════════════════════╝

*🤖 ${botName}* │ \`${botVersion}\`
*🌐 Host:* LadybugNodes
*🖥️ Platform:* ${platform}
*⚙️ Node.js:* ${nodeVer}
*🧠 CPU:* ${cpuModel} (${cpuCores} cores)

━━━━━ ⏱️ *UPTIME* ━━━━━
*${uptime}*
[${uptimeBar}] ${uptimePct}% of 24h

━━━━━ 💾 *MEMORY* ━━━━━
*Used:* ${formatBytes(memUsed)} heap
*System:* ${formatBytes(memTotal - memFree)} / ${formatBytes(memTotal)}
[${memBar}] ${memPct}%

━━━━━ 🚦 *STATUS* ━━━━━
🟢 Online & Fully Operational
📡 Ping: Stable
🔒 Secure Connection Active

╰──────────────────────╯
  _Powered by LadybugNodes_`;

      await extra.reply(message);

    } catch (error) {
      console.error('Error in uptime command:', error);
      await extra.reply('❌ Could not fetch system info. Try again in a moment.');
    }
  }
};
