/**
 * Menu Command — DARK THRONE Design
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Features:
 *  • Rich Unicode art borders
 *  • Live uptime, date & time (CAT)
 *  • Animated-feel section separators
 *  • Command count per category
 *  • Newsletter forward tag
 *  • Image or text fallback
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Format process uptime into compact string */
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || !parts.length) parts.push(`${s}s`);
  return parts.join(' ');
}

/** Get current time string in CAT (Africa/Harare) */
function getTime() {
  return new Date().toLocaleString('en-ZA', {
    timeZone: config.timezone || 'Africa/Harare',
    hour12: false,
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  });
}

/** Category display config — icon + pretty label */
const CATEGORY_MAP = {
  general:   { icon: '🌐', label: 'GENERAL'    },
  ai:        { icon: '🧠', label: 'ARTIFICIAL INTELLIGENCE' },
  group:     { icon: '👥', label: 'GROUP'      },
  admin:     { icon: '🛡️', label: 'ADMIN'      },
  owner:     { icon: '👑', label: 'OWNER'      },
  media:     { icon: '🎬', label: 'MEDIA'      },
  fun:       { icon: '🎲', label: 'FUN'        },
  utility:   { icon: '🔧', label: 'UTILITY'    },
  anime:     { icon: '⛩️', label: 'ANIME'      },
  textmaker: { icon: '✏️', label: 'TEXT MAKER' },
};

// ─────────────────────────────────────────────
// Section builder
// ─────────────────────────────────────────────
function buildSection(key, cmds) {
  if (!cmds || cmds.length === 0) return '';

  const meta  = CATEGORY_MAP[key] || { icon: '📁', label: key.toUpperCase() };
  const names = cmds.map(c => `${config.prefix}${c.name}`);

  // Two columns, padded
  const COL = 18;
  const rows = [];
  for (let i = 0; i < names.length; i += 2) {
    const left  = names[i].padEnd(COL);
    const right = names[i + 1] || '';
    rows.push(`  ┃  ${left}${right}`);
  }

  let out = '';
  out += `\n  ╔══〔 ${meta.icon} *${meta.label}* (${cmds.length}) 〕\n`;
  out += rows.join('\n') + '\n';
  out += `  ╚${'━'.repeat(34)}\n`;
  return out;
}

// ─────────────────────────────────────────────
// Module
// ─────────────────────────────────────────────
module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'cmds', 'list'],
  category: 'general',
  description: 'Show all available commands',
  usage: '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const commands = loadCommands();

      // ── Group by category (skip aliases) ──
      const categories = {};
      commands.forEach((cmd, name) => {
        if (cmd.name !== name) return;
        if (!categories[cmd.category]) categories[cmd.category] = [];
        categories[cmd.category].push(cmd);
      });

      // ── Meta ──
      const ownerNames   = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || 'Bot Owner';
      const totalCmds    = [...commands.values()].filter((c, _, arr) => c.name === arr.find(x => x === c)?.name || true).size || commands.size;
      const uptime       = formatUptime(Math.floor(process.uptime()));
      const now          = getTime();
      const sender       = extra.sender.split('@')[0];

      // ══════════════════════════════════════════
      //  HEADER — DARK THRONE
      // ══════════════════════════════════════════
      let menu = '';

      menu +=
`╔═══════════════════════════════════╗
║  🐞  *${config.botName.toUpperCase()}*
╠═══════════════════════════════════╣
║  🙋  Hey @${sender}!
║  🕐  ${now}
║  ⏱️  Uptime : *${uptime}*
║  ⚡  Prefix : *${config.prefix}*
║  📦  Cmds   : *${commands.size}*
║  👑  Owner  : *${displayOwner}*
║  🌐  Host   : *LadybugNodes*
╚═══════════════════════════════════╝
`;

      // ══════════════════════════════════════════
      //  SECTIONS (in preferred order)
      // ══════════════════════════════════════════
      const ORDER = ['general','ai','group','admin','owner','media','fun','utility','anime','textmaker'];

      for (const key of ORDER) {
        menu += buildSection(key, categories[key]);
      }

      // Any extra category not in ORDER
      for (const [key, cmds] of Object.entries(categories)) {
        if (!ORDER.includes(key)) menu += buildSection(key, cmds);
      }

      // ══════════════════════════════════════════
      //  FOOTER
      // ══════════════════════════════════════════
      menu +=
`
╔═══════════════════════════════════╗
║  💡  *${config.prefix}help [cmd]* — command details
║  🔥  Powered by *Mr Ntando Ofc*
║  🇿🇼  *Made with ❤️ in Zimbabwe*
╚═══════════════════════════════════╝`;

      // ══════════════════════════════════════════
      //  SEND — image with caption, or text
      // ══════════════════════════════════════════
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      const hasImage  = fs.existsSync(imagePath);

      const messagePayload = hasImage
        ? {
            image:   fs.readFileSync(imagePath),
            caption: menu,
            mentions: [extra.sender],
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid:   config.newsletterJid || '120363161518@newsletter',
                newsletterName:  config.botName,
                serverMessageId: -1,
              },
            },
          }
        : {
            text:     menu,
            mentions: [extra.sender],
          };

      await sock.sendMessage(extra.from, messagePayload, { quoted: msg });

    } catch (error) {
      console.error('Menu command error:', error);
      await extra.reply(`❌ Failed to load menu: ${error.message}`);
    }
  },
};
