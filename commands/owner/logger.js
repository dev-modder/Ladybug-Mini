/**
 * Logger Command - Toggle message logging to file (owner only)
 * Ladybug V5
 *
 * When enabled, all incoming messages are appended to logs/messages.log
 *
 * Usage:
 *   .logger on          — enable logging
 *   .logger off         — disable logging
 *   .logger view        — view last 20 log lines
 *   .logger clear       — clear the log file
 *   .logger             — show status
 */

const fs   = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/messages.log');

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

module.exports = {
  name: 'logger',
  aliases: ['log', 'msglog', 'togglelog'],
  category: 'owner',
  description: 'Toggle message logging to file',
  usage: '.logger on|off|view|clear',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const config     = require('../../config');
      const configPath = path.join(__dirname, '../../config.js');
      const sub        = args[0]?.toLowerCase();

      // View logs
      if (sub === 'view') {
        ensureLogDir();
        if (!fs.existsSync(LOG_FILE)) {
          return extra.reply('📄 Log file is empty or does not exist yet.');
        }
        const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
        const last  = lines.slice(-20).join('\n');
        return extra.reply(
          `📄 *Last ${Math.min(20, lines.length)} log entries:*\n\n` +
          `\`\`\`\n${last || '(empty)'}\n\`\`\``
        );
      }

      // Clear logs
      if (sub === 'clear') {
        ensureLogDir();
        fs.writeFileSync(LOG_FILE, '', 'utf8');
        return extra.reply('🗑️ Log file cleared.');
      }

      // Toggle on/off
      if (sub === 'on' || sub === 'off') {
        const enabled      = sub === 'on';
        let configContent  = fs.readFileSync(configPath, 'utf8');

        if (configContent.includes('logger:')) {
          configContent = configContent.replace(
            /logger:\s*(true|false)/,
            `logger: ${enabled}`
          );
        } else {
          configContent = configContent.replace(
            /(module\.exports\s*=\s*\{)/,
            `$1\n  logger: ${enabled},`
          );
        }

        fs.writeFileSync(configPath, configContent, 'utf8');
        delete require.cache[require.resolve('../../config')];

        ensureLogDir();
        return extra.reply(
          enabled
            ? `✅ Message logging *enabled*.\nLogs → \`logs/messages.log\``
            : `❌ Message logging *disabled*.`
        );
      }

      // Status
      const status   = config.logger ? '🟢 ON' : '🔴 OFF';
      let logSize    = '0 B';
      if (fs.existsSync(LOG_FILE)) {
        const bytes = fs.statSync(LOG_FILE).size;
        logSize = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
      }

      await extra.reply(
        `📝 *Logger Status*\n\n` +
        `Status:   *${status}*\n` +
        `Log File: \`logs/messages.log\`\n` +
        `Log Size: ${logSize}\n\n` +
        `Commands:\n` +
        `  .logger on      — enable\n` +
        `  .logger off     — disable\n` +
        `  .logger view    — view last 20 lines\n` +
        `  .logger clear   — clear log`
      );

    } catch (error) {
      console.error('[logger] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
