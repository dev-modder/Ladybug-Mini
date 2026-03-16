/**
 * Menu Command — CRIMSON EMPIRE Design
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  ✦ Loading message sent first, then deleted after menu posts
 *  ✦ Live uptime, RAM, date & time (CAT / Africa/Harare)
 *  ✦ Animated-style Unicode border art
 *  ✦ Per-category command count
 *  ✦ Two-column command layout
 *  ✦ Newsletter forward tag
 *  ✦ Image + caption OR plain text fallback
 */

'use strict';

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs   = require('fs');
const path = require('path');

// ══════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════

/** Process uptime → "2d 4h 30m 12s" */
function formatUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const p = [];
  if (d) p.push(`${d}d`);
  if (h) p.push(`${h}h`);
  if (m) p.push(`${m}m`);
  if (s || !p.length) p.push(`${s}s`);
  return p.join(' ');
}

/** Current date-time in CAT */
function getNow() {
  return new Date().toLocaleString('en-ZA', {
    timeZone: config.timezone || 'Africa/Harare',
    hour12:   false,
    weekday:  'long',
    year:     'numeric',
    month:    'long',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
  });
}

/** RAM used by the Node process */
function getRam() {
  const mb = process.memoryUsage().heapUsed / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

// ══════════════════════════════════════════════
//  CATEGORY META
// ══════════════════════════════════════════════
const CAT = {
  general:   { icon: '❖', label: 'GENERAL'           },
  ai:        { icon: '◈', label: 'AI & INTELLIGENCE'  },
  group:     { icon: '◉', label: 'GROUP MANAGEMENT'   },
  admin:     { icon: '◆', label: 'ADMIN TOOLS'        },
  owner:     { icon: '♛', label: 'OWNER ONLY'         },
  media:     { icon: '◎', label: 'MEDIA & DOWNLOAD'   },
  fun:       { icon: '◇', label: 'FUN & GAMES'        },
  utility:   { icon: '◑', label: 'UTILITY TOOLS'      },
  anime:     { icon: '◐', label: 'ANIME'              },
  textmaker: { icon: '▣', label: 'TEXT MAKER'         },
};

const ORDER = [
  'general','ai','media','fun','utility',
  'group','admin','owner','anime','textmaker'
];

// ══════════════════════════════════════════════
//  SECTION BUILDER
// ══════════════════════════════════════════════
function buildSection(key, cmds) {
  if (!cmds?.length) return '';
  const { icon, label } = CAT[key] ?? { icon: '◌', label: key.toUpperCase() };
  const names = cmds.map(c => `${config.prefix}${c.name}`);

  const COL  = 20;
  const rows = [];
  for (let i = 0; i < names.length; i += 2) {
    const L = names[i].padEnd(COL);
    const R = names[i + 1] ?? '';
    rows.push(`  ║  ${L}${R}`);
  }

  return [
    `  ╔══〘 ${icon} *${label}*  ·  ${cmds.length} cmds 〙`,
    ...rows,
    `  ╚${'═'.repeat(38)}`,
    ''
  ].join('\n');
}

// ══════════════════════════════════════════════
//  LOADING MESSAGE
// ══════════════════════════════════════════════
function buildLoadingMsg(sender) {
  return (
    `╔══════════════════════════════╗\n` +
    `║   ⏳  *LOADING YOUR MENU*   ║\n` +
    `╠══════════════════════════════╣\n` +
    `║                              ║\n` +
    `║  👤  Hey @${sender}!\n` +
    `║                              ║\n` +
    `║  🔄  Fetching commands...\n` +
    `║  📡  Connecting to host...\n` +
    `║  🧠  Building sections...\n` +
    `║  🎨  Rendering layout...\n` +
    `║  ✅  Almost ready...\n` +
    `║                              ║\n` +
    `╚══════════════════════════════╝\n` +
    `\n_⚡ Powered by LadybugNodes_`
  );
}

// ══════════════════════════════════════════════
//  MAIN MENU TEXT BUILDER
// ══════════════════════════════════════════════
function buildMenu(commands, categories, sender) {
  const ownerName = Array.isArray(config.ownerName)
    ? config.ownerName[0]
    : config.ownerName;

  const uptime    = formatUptime(Math.floor(process.uptime()));
  const now       = getNow();
  const ram       = getRam();
  const totalCmds = commands.size;

  let txt = '';

  // ── HEADER ──────────────────────────────────
  txt += `\n`;
  txt += `╔══════════════════════════════════════════╗\n`;
  txt += `║                                          ║\n`;
  txt += `║    🐞  *L A D Y B U G   B O T*   🐞     ║\n`;
  txt += `║          ✦ ✦  *M I N I*  ✦ ✦            ║\n`;
  txt += `║                                          ║\n`;
  txt += `╠══════════════════════════════════════════╣\n`;
  txt += `║                                          ║\n`;
  txt += `║  👤  *@${sender}*\n`;
  txt += `║  🗓️  ${now}\n`;
  txt += `║                                          ║\n`;
  txt += `╠═════〘 ⚙️  *SYSTEM STATUS* 〙═════════════╣\n`;
  txt += `║                                          ║\n`;
  txt += `║  ⏱️   Uptime   »  *${uptime}*\n`;
  txt += `║  💾   Memory   »  *${ram}*\n`;
  txt += `║  📦   Commands »  *${totalCmds} total*\n`;
  txt += `║  ⚡   Prefix   »  *${config.prefix}*\n`;
  txt += `║  👑   Owner    »  *${ownerName}*\n`;
  txt += `║  🌐   Host     »  *LadybugNodes*\n`;
  txt += `║  🟢   Status   »  *Online & Active*\n`;
  txt += `║                                          ║\n`;
  txt += `╚══════════════════════════════════════════╝\n`;

  // ── SECTION DIVIDER ─────────────────────────
  txt += `\n`;
  txt += `━━━━━━〘 📋 *COMMAND MENU* 〙━━━━━━\n`;
  txt += `\n`;

  // ── COMMAND SECTIONS ────────────────────────
  for (const key of ORDER) {
    txt += buildSection(key, categories[key]);
  }
  // Render any custom/unlisted category
  for (const [key, cmds] of Object.entries(categories)) {
    if (!ORDER.includes(key)) txt += buildSection(key, cmds);
  }

  // ── FOOTER ──────────────────────────────────
  txt += `╔══════════════════════════════════════════╗\n`;
  txt += `║                                          ║\n`;
  txt += `║  💡  *${config.prefix}help [cmd]*  →  command info\n`;
  txt += `║  📌  *${config.prefix}uptime*     →  system stats\n`;
  txt += `║  📡  *${config.prefix}alive*      →  ping bot\n`;
  txt += `║                                          ║\n`;
  txt += `╠══════════════════════════════════════════╣\n`;
  txt += `║  🔥  *Powered by Mr Ntando Ofc*          ║\n`;
  txt += `║  🇿🇼  *Made with ❤️  in Zimbabwe*          ║\n`;
  txt += `║  🐞  *Ladybug Bot Mini — Stay Winning*   ║\n`;
  txt += `║                                          ║\n`;
  txt += `╚══════════════════════════════════════════╝`;

  return txt;
}

// ══════════════════════════════════════════════
//  MODULE
// ══════════════════════════════════════════════
module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'cmds', 'list', 'start'],
  category: 'general',
  description: 'Show all available commands',
  usage: '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const sender = extra.sender.split('@')[0];

      // ── 1. Send loading message ──────────────
      const loadingKey = await sock.sendMessage(
        extra.from,
        {
          text:     buildLoadingMsg(sender),
          mentions: [extra.sender],
        },
        { quoted: msg }
      );

      // ── 2. Build menu while "loading" shows ──
      const commands   = loadCommands();
      const categories = {};
      commands.forEach((cmd, name) => {
        if (cmd.name !== name) return;
        if (!categories[cmd.category]) categories[cmd.category] = [];
        categories[cmd.category].push(cmd);
      });

      // Small delay so loading message is visible
      await new Promise(r => setTimeout(r, 1800));

      // ── 3. Build the menu text ───────────────
      const menuText = buildMenu(commands, categories, sender);

      // ── 4. Send the full menu ────────────────
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      const hasImage  = fs.existsSync(imagePath);

      const payload = hasImage
        ? {
            image:    fs.readFileSync(imagePath),
            caption:  menuText,
            mentions: [extra.sender],
            contextInfo: {
              forwardingScore: 1,
              isForwarded:     true,
              forwardedNewsletterMessageInfo: {
                newsletterJid:   config.newsletterJid || '120363161518@newsletter',
                newsletterName:  config.botName,
                serverMessageId: -1,
              },
            },
          }
        : {
            text:     menuText,
            mentions: [extra.sender],
          };

      await sock.sendMessage(extra.from, payload, { quoted: msg });

      // ── 5. Delete loading message ────────────
      // Silently ignored if Baileys build doesn't support delete
      try {
        await sock.sendMessage(extra.from, { delete: loadingKey.key });
      } catch (_) {}

    } catch (error) {
      console.error('[Menu] Error:', error);
      await extra.reply(`❌ Failed to load menu: ${error.message}`);
    }
  },
};
