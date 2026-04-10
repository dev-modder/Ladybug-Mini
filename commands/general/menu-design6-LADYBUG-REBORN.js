/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║    MENU COMMAND  —  DESIGN #6  "LADYBUG REBORN"          ║
 * ║    Ladybug Bot Mini | by Dev-Ntando                      ║
 * ║                                                          ║
 * ║  ✦ Brand-new visual identity — red/black crimson theme   ║
 * ║  ✦ Full-width box headers with dot-border styling        ║
 * ║  ✦ Numbered command list in clean rows (no cramped cols) ║
 * ║  ✦ Category badges with command count                    ║
 * ║  ✦ Dynamic greeting (EN) + live stats                    ║
 * ║  ✦ Auto-detect iOS vs Android → plain-text fallback      ║
 * ║  ✦ gifted-btns interactive list + quick-reply buttons    ║
 * ║  ✦ Loading message that auto-deletes                     ║
 * ║  ✦ Newsletter forward tag                                ║
 * ║  ✦ Version: REBORN V1                                    ║
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

const config              = require('../../config');
const { loadCommands }    = require('../../utils/commandLoader');
const { sendButtons, sendList } = require('gifted-btns');
const fs                  = require('fs');
const path                = require('path');

// ─────────────────────────────────────────────────────────────
//  PLATFORM DETECTION
// ─────────────────────────────────────────────────────────────
function detectPlatform(msg) {
  try {
    const keyId = msg?.key?.id || '';
    if (/^[A-F0-9]{16}$/.test(keyId)) return 'ios';
    if (msg?.message?.interactiveResponseMessage) return 'android';
    return 'android';
  } catch {
    return 'android';
  }
}

// ─────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────
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

function getNow() {
  return new Date().toLocaleString('en-US', {
    timeZone: config.timezone || 'Africa/Harare',
    hour12:   true,
    weekday:  'short',
    month:    'short',
    day:      'numeric',
    year:     'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
  });
}

function getRam() {
  const mb = process.memoryUsage().heapUsed / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function getGreeting() {
  const h = parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: config.timezone || 'Africa/Harare',
      hour: '2-digit',
      hour12: false,
    }),
    10
  );
  if (h >= 4  && h < 12) return { word: 'Good Morning',   icon: '🌅' };
  if (h >= 12 && h < 17) return { word: 'Good Afternoon', icon: '☀️'  };
  if (h >= 17 && h < 21) return { word: 'Good Evening',   icon: '🌆' };
  return                          { word: 'Good Night',    icon: '🌙' };
}

// ─────────────────────────────────────────────────────────────
//  CATEGORY META
// ─────────────────────────────────────────────────────────────
const CAT = {
  general:     { icon: '🏠', label: 'GENERAL'          },
  ai:          { icon: '🤖', label: 'AI & AUTOCHAT'    },
  admin:       { icon: '🛡️', label: 'ADMIN TOOLS'      },
  owner:       { icon: '👑', label: 'OWNER ONLY'       },
  media:       { icon: '🎵', label: 'MEDIA & DL'       },
  fun:         { icon: '🎮', label: 'FUN & GAMES'      },
  anime:       { icon: '🌸', label: 'ANIME'            },
  utility:     { icon: '🔧', label: 'UTILITY'          },
  textmaker:   { icon: '✏️', label: 'TEXT MAKER'       },
  sticker:     { icon: '🎨', label: 'STICKER TOOLS'   },
};

const ORDER = ['general', 'ai', 'media', 'fun', 'anime', 'admin', 'owner', 'utility', 'textmaker'];

// ─────────────────────────────────────────────────────────────
//  COMMAND GROUPING
// ─────────────────────────────────────────────────────────────
function groupByCategory(commands) {
  const cats = {};
  for (const [, cmd] of commands) {
    if (!cmd.name) continue;
    const key = (cmd.category || 'general').toLowerCase();
    if (!cats[key]) cats[key] = [];
    // Avoid duplicate entries (aliases re-register same cmd)
    if (!cats[key].find(c => c.name === cmd.name)) {
      cats[key].push(cmd);
    }
  }
  return cats;
}

// ─────────────────────────────────────────────────────────────
//  SECTION BUILDER  — clean numbered list, 1 per row
// ─────────────────────────────────────────────────────────────
function buildSection(catKey, cmds) {
  if (!cmds || cmds.length === 0) return '';

  const meta  = CAT[catKey] || { icon: '📂', label: catKey.toUpperCase() };
  const P     = config.prefix || '.';
  const count = cmds.length;

  // Top banner for this category
  let block = '';
  block += `\n`;
  block += `┌─「 ${meta.icon} *${meta.label}* 」── ${count} cmd ─\n`;

  cmds.forEach((cmd, i) => {
    const num     = String(i + 1).padStart(2, '0');
    const aliases = cmd.aliases && cmd.aliases.length
      ? `  _(${cmd.aliases.slice(0, 2).map(a => `${P}${a}`).join(', ')})_`
      : '';
    const desc    = cmd.description
      ? `  » _${cmd.description.length > 42 ? cmd.description.substring(0, 42) + '…' : cmd.description}_`
      : '';

    block += `│ ${num}. *${P}${cmd.name}*${aliases}\n`;
    if (desc) block += `│     ${desc}\n`;
  });

  block += `└${'─'.repeat(40)}\n`;
  return block;
}

// ─────────────────────────────────────────────────────────────
//  LOADING MESSAGE
// ─────────────────────────────────────────────────────────────
function buildLoadingMsg(name) {
  return (
    `┌─────────────────────────────┐\n` +
    `│   🐞  *LADYBUG REBORN*       │\n` +
    `│   ⏳  Loading your menu...   │\n` +
    `├─────────────────────────────┤\n` +
    `│                             │\n` +
    `│  👤  Hey *${name}*!\n` +
    `│                             │\n` +
    `│  🔄  Fetching commands...\n` +
    `│  📡  Syncing categories...\n` +
    `│  🎨  Rendering design...\n` +
    `│  ✅  Almost ready...\n` +
    `│                             │\n` +
    `└─────────────────────────────┘\n` +
    `\n_⚡ Powered by LadybugNodes_`
  );
}

// ─────────────────────────────────────────────────────────────
//  PLAIN-TEXT FULL MENU  (iOS + fallback)
// ─────────────────────────────────────────────────────────────
function buildMenuText(commands, categories, sender) {
  const ownerName  = Array.isArray(config.ownerName)
    ? config.ownerName[0]
    : (config.ownerName || 'Dev-Ntando');
  const uptime     = formatUptime(Math.floor(process.uptime()));
  const now        = getNow();
  const ram        = getRam();
  const totalCmds  = [...new Set([...commands.values()])].length;
  const greeting   = getGreeting();
  const P          = config.prefix || '.';
  const botName    = config.botName || 'Ladybug Bot V5';
  const totalCats  = Object.keys(categories).length;
  const name       = sender ? `@${sender}` : 'User';

  let t = '';

  // ══════════ HERO HEADER ══════════
  t += `\n`;
  t += `╔═══════════════════════════════════╗\n`;
  t += `║                                   ║\n`;
  t += `║   🐞  *L A D Y B U G   B O T*  🐞 ║\n`;
  t += `║     ✦  *REBORN  EDITION  V1*  ✦   ║\n`;
  t += `║                                   ║\n`;
  t += `╠═══════════════════════════════════╣\n`;
  t += `║                                   ║\n`;
  t += `║  ${greeting.icon}  *${greeting.word}, ${name}!*\n`;
  t += `║  💬  Welcome to ${botName}\n`;
  t += `║  🌍  Your 24/7 WhatsApp assistant\n`;
  t += `║                                   ║\n`;
  t += `║  🗓️  ${now}\n`;
  t += `║                                   ║\n`;
  t += `╚═══════════════════════════════════╝\n`;

  // ══════════ STATS BAR ══════════
  t += `\n`;
  t += `┌──────「 ⚡ *SYSTEM STATUS* 」──────┐\n`;
  t += `│  ⏱️  Uptime    ➜  *${uptime}*\n`;
  t += `│  💾  Memory    ➜  *${ram}*\n`;
  t += `│  📦  Commands  ➜  *${totalCmds} total*\n`;
  t += `│  📂  Categories➜  *${totalCats}*\n`;
  t += `│  ⌨️  Prefix     ➜  *${P}*\n`;
  t += `│  👑  Owner     ➜  *${ownerName}*\n`;
  t += `│  🟢  Status    ➜  *Online & Active*\n`;
  t += `└────────────────────────────────────┘\n`;

  // ══════════ COMMAND SECTIONS ══════════
  t += `\n`;
  t += `╔═══════════════════════════════════╗\n`;
  t += `║   📋  *COMMAND DIRECTORY*          ║\n`;
  t += `╚═══════════════════════════════════╝\n`;

  const printed = new Set();
  for (const key of ORDER) {
    if (categories[key] && !printed.has(key)) {
      t += buildSection(key, categories[key]);
      printed.add(key);
    }
  }
  // Catch any categories not in ORDER
  for (const [key, cmds] of Object.entries(categories)) {
    if (!printed.has(key)) {
      t += buildSection(key, cmds);
    }
  }

  // ══════════ QUICK TIPS ══════════
  t += `\n`;
  t += `┌──────「 💡 *QUICK TIPS* 」──────────┐\n`;
  t += `│  ${P}help [cmd]          →  command info\n`;
  t += `│  ${P}ping               →  check bot speed\n`;
  t += `│  ${P}uptime             →  system stats\n`;
  t += `│  ${P}ai [question]      →  ask the AI\n`;
  t += `│  ${P}autochat on        →  AI auto-reply\n`;
  t += `│  ${P}autostatusview on  →  view statuses\n`;
  t += `│  ${P}aigenmusic [topic] →  AI song lyrics\n`;
  t += `└────────────────────────────────────┘\n`;

  // ══════════ FOOTER ══════════
  t += `\n`;
  t += `╔═══════════════════════════════════╗\n`;
  t += `║                                   ║\n`;
  t += `║  🔥  *Built by Dev-Ntando*         ║\n`;
  t += `║  🇿🇼  *Made with ❤️ in Zimbabwe*    ║\n`;
  t += `║  🐞  *Ladybug Reborn — Stay Up!*   ║\n`;
  t += `║                                   ║\n`;
  t += `╚═══════════════════════════════════╝`;

  return t;
}

// ─────────────────────────────────────────────────────────────
//  INTERACTIVE LIST SECTIONS  (Android gifted-btns)
// ─────────────────────────────────────────────────────────────
function buildListSections(categories) {
  const sections = [];
  const P = config.prefix || '.';

  const allKeys = [
    ...ORDER,
    ...Object.keys(categories).filter(k => !ORDER.includes(k)),
  ];

  for (const key of allKeys) {
    const cmds = categories[key];
    if (!cmds || cmds.length === 0) continue;

    const meta = CAT[key] || { icon: '📂', label: key.toUpperCase() };
    const rows = cmds.slice(0, 10).map(cmd => ({
      title:       `${P}${cmd.name}`,
      description: cmd.description
        ? cmd.description.substring(0, 60)
        : `Use ${P}${cmd.name}`,
      rowId: `cmd_${cmd.name}`,
    }));

    sections.push({
      title: `${meta.icon}  ${meta.label}  (${cmds.length})`,
      rows,
    });
  }

  return sections;
}

// ─────────────────────────────────────────────────────────────
//  HEADER TEXT FOR INTERACTIVE MENU
// ─────────────────────────────────────────────────────────────
function buildHeaderText(commands, sender) {
  const totalCmds = [...new Set([...commands.values()])].length;
  const uptime    = formatUptime(Math.floor(process.uptime()));
  const ram       = getRam();
  const greeting  = getGreeting();
  const P         = config.prefix || '.';
  const name      = sender ? `@${sender}` : 'User';

  return (
    `${greeting.icon}  *${greeting.word}, ${name}!*\n\n` +
    `🐞 *Ladybug Bot — Reborn Edition V1*\n\n` +
    `⏱️  Uptime: *${uptime}*\n` +
    `💾  Memory: *${ram}*\n` +
    `📦  Commands: *${totalCmds}*\n` +
    `⌨️  Prefix: *${P}*\n\n` +
    `👇 *Pick a category from the list below:*`
  );
}

// ─────────────────────────────────────────────────────────────
//  QUICK-REPLY BUTTONS  (Android)
// ─────────────────────────────────────────────────────────────
const QUICK_BTNS = [
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🏠 General',   id: 'cat_general' }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🤖 AI Chat',   id: 'cat_ai'      }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎵 Media',     id: 'cat_media'   }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎮 Fun',       id: 'cat_fun'     }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🛡️ Admin',     id: 'cat_admin'   }) },
  {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
      display_text: '🐞 Bot Channel',
      url: (config.newsletterJid
        ? `https://whatsapp.com/channel/${config.newsletterJid.replace('@newsletter', '')}`
        : 'https://whatsapp.com'),
      merchant_url: '',
    }),
  },
];

// ─────────────────────────────────────────────────────────────
//  PLAIN SEND  (iOS / no gifted-btns)
// ─────────────────────────────────────────────────────────────
async function sendPlainMenu(sock, msg, extra, commands, categories, sender) {
  const menuText = buildMenuText(commands, categories, sender);
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');

  if (fs.existsSync(imagePath)) {
    await sock.sendMessage(
      extra.from,
      {
        image:    fs.readFileSync(imagePath),
        caption:  menuText,
        mentions: [extra.sender],
        contextInfo: {
          forwardingScore: 1,
          isForwarded:     true,
          forwardedNewsletterMessageInfo: {
            newsletterJid:   config.newsletterJid   || '120363161518@newsletter',
            newsletterName:  config.botName         || 'LadybugBot',
            serverMessageId: -1,
          },
        },
      },
      { quoted: msg }
    );
  } else {
    await sock.sendMessage(
      extra.from,
      {
        text:     menuText,
        mentions: [extra.sender],
      },
      { quoted: msg }
    );
  }
}

// ─────────────────────────────────────────────────────────────
//  ANDROID INTERACTIVE SEND
// ─────────────────────────────────────────────────────────────
async function sendAndroidMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
  const hasImage  = fs.existsSync(imagePath);
  const sections  = buildListSections(categories);
  const headerTxt = buildHeaderText(commands, sender);
  const greeting  = getGreeting();

  try {
    // Step 1 — image caption header
    if (hasImage) {
      await sock.sendMessage(
        extra.from,
        {
          image:   fs.readFileSync(imagePath),
          caption:
            `🐞 *LADYBUG BOT — REBORN EDITION V1*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `${greeting.icon}  _${greeting.word}! Welcome back._\n\n` +
            `🤖  AI Chat  •  Song DL  •  Stickers  •  & more!\n\n` +
            `> 🔥 Built with ❤️ by Dev-Ntando`,
          mentions: [extra.sender],
          contextInfo: {
            forwardingScore: 1,
            isForwarded:     true,
            forwardedNewsletterMessageInfo: {
              newsletterJid:   config.newsletterJid   || '120363161518@newsletter',
              newsletterName:  config.botName         || 'LadybugBot',
              serverMessageId: -1,
            },
          },
        },
        { quoted: msg }
      );
    }

    // Step 2 — interactive command list
    await sendList(sock, extra.from, {
      title:      '🐞 Ladybug Bot — Reborn V1',
      text:       headerTxt,
      footer:     `> 🔥 Powered by ${config.botName || 'LadybugBot'}  ·  Built with ❤️`,
      buttonText: '📋 Browse Commands',
      sections,
      mentions:   [extra.sender],
    }, { quoted: hasImage ? undefined : msg });

    // Step 3 — quick-reply shortcut buttons
    const P = config.prefix || '.';
    await sendButtons(sock, extra.from, {
      title:  '',
      text:
        `⚡ *Quick Shortcuts*\n\n` +
        `Tap a button to jump to a category,\nor use these power commands:\n\n` +
        `🤖 *AI Commands:*\n` +
        `  • *${P}ai* [question]       →  ask anything\n` +
        `  • *${P}autochat on*         →  AI auto-reply\n` +
        `  • *${P}aigenmusic* [topic]  →  AI song lyrics\n` +
        `  • *${P}story* [prompt]      →  AI short story\n` +
        `  • *${P}poem* [topic]        →  AI poem\n` +
        `  • *${P}debate* [topic]      →  AI debate\n\n` +
        `⚙️ *General:*\n` +
        `  • *${P}ping*                →  check speed\n` +
        `  • *${P}uptime*              →  system stats\n` +
        `  • *${P}help* [cmd]          →  command info\n` +
        `  • *${P}autostatusview on*   →  view statuses`,
      footer: `> *Ladybug Bot Reborn V1*  ·  Built with ❤️`,
      buttons: QUICK_BTNS,
    }, { quoted: undefined });

  } catch (err) {
    console.warn('[Menu Reborn] Interactive send failed, falling back to plain text:', err.message);
    await sendPlainMenu(sock, msg, extra, commands, categories, sender);
  }
}

// ─────────────────────────────────────────────────────────────
//  MODULE EXPORT
// ─────────────────────────────────────────────────────────────
module.exports = {
  name:        'menu',
  aliases:     ['help', 'start', 'commands', 'cmd', 'list'],
  category:    'general',
  description: 'Show the full command menu — Ladybug Reborn Edition',
  usage:       '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const sender   = extra.sender?.split('@')[0] || 'User';
      const platform = detectPlatform(msg);

      // ── Loading message → auto-delete ──────────────────
      let loadingMsg = null;
      try {
        const sentLoading = await sock.sendMessage(
          extra.from,
          {
            text:     buildLoadingMsg(sender),
            mentions: [extra.sender],
          },
          { quoted: msg }
        );
        loadingMsg = sentLoading?.key;
      } catch (_) {}

      // ── Load all commands ──────────────────────────────
      const commands   = loadCommands();
      const categories = groupByCategory(commands);

      // ── Send the menu ──────────────────────────────────
      if (platform === 'ios') {
        await sendPlainMenu(sock, msg, extra, commands, categories, sender);
      } else {
        await sendAndroidMenu(sock, msg, extra, commands, categories, sender);
      }

      // ── Delete loading message ─────────────────────────
      if (loadingMsg) {
        try {
          await sock.sendMessage(extra.from, { delete: loadingMsg });
        } catch (_) {}
      }

    } catch (error) {
      console.error('[Menu Reborn] Fatal error:', error);
      await extra.reply(`❌ Menu failed to load: ${error.message}\n\nTry *.help* for a basic command list.`);
    }
  },
};
