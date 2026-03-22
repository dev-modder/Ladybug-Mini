/**
 * ╔══════════════════════════════════════════════════════╗
 * ║         MENU COMMAND  —  LADYBUG BOT MINI V5         ║
 * ║              by Dev-Ntando  |  Made with ❤️           ║
 * ║                                                      ║
 * ║  ✦ Full redesign — sleek dark-luxury aesthetic       ║
 * ║  ✦ Auto-detects iOS vs Android                       ║
 * ║  ✦ Android → gifted-btns interactive list + buttons  ║
 * ║  ✦ iOS     → rich plain-text (buttons unsupported)   ║
 * ║  ✦ AutoChat AI category added                        ║
 * ║  ✦ Live uptime, RAM, date & time (Africa/Harare)     ║
 * ║  ✦ Two-column command layout                         ║
 * ║  ✦ Newsletter forward tag                            ║
 * ║  ✦ Loading message auto-deleted after menu posts     ║
 * ║  ✦ English greetings                                 ║
 * ║  ✦ Version: V5                                       ║
 * ╚══════════════════════════════════════════════════════╝
 */

'use strict';

const config              = require('../../config');
const { loadCommands }    = require('../../utils/commandLoader');
const { sendButtons, sendList } = require('gifted-btns');
const fs                  = require('fs');
const path                = require('path');

// ══════════════════════════════════════════════
//  PLATFORM DETECTION
// ══════════════════════════════════════════════
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

// ══════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════
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
  return new Date().toLocaleString('en-ZW', {
    timeZone: config.timezone || 'Africa/Harare',
    hour12:   true,
    weekday:  'long',
    year:     'numeric',
    month:    'long',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
  });
}

function getRam() {
  const mb = process.memoryUsage().heapUsed / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function getGreeting() {
  const hour = parseInt(
    new Date().toLocaleString('en-ZW', {
      timeZone: config.timezone || 'Africa/Harare',
      hour: '2-digit',
      hour12: false,
    }),
    10
  );
  if (hour >= 4  && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

// ══════════════════════════════════════════════
//  CATEGORY META  (updated + AI autochat added)
// ══════════════════════════════════════════════
const CAT = {
  general:     { icon: '🏠', label: 'GENERAL'              },
  ai:          { icon: '🤖', label: 'AI & AUTOCHAT'         },
  group:       { icon: '👥', label: 'GROUP MANAGEMENT'      },
  admin:       { icon: '🛡️', label: 'ADMIN TOOLS'           },
  owner:       { icon: '👑', label: 'OWNER ONLY'            },
  media:       { icon: '🎵', label: 'MEDIA & DOWNLOADS'     },
  fun:         { icon: '🎮', label: 'FUN & GAMES'           },
  utility:     { icon: '🔧', label: 'UTILITY TOOLS'         },
  anime:       { icon: '🌸', label: 'ANIME'                 },
  textmaker:   { icon: '✏️', label: 'TEXT MAKER'            },
  statustools: { icon: '👁️', label: 'STATUS VIEW & LIKE'   },
};

const ORDER = [
  'general','ai','media','fun','utility',
  'group','admin','owner','anime','textmaker','statustools'
];

// ══════════════════════════════════════════════
//  LOADING MESSAGE
// ══════════════════════════════════════════════
function buildLoadingMsg(sender) {
  return (
    `┌─────────────────────────────┐\n` +
    `│   ⏳  *LOADING MENU...*      │\n` +
    `├─────────────────────────────┤\n` +
    `│                             │\n` +
    `│  👤  Hey @${sender}!\n` +
    `│                             │\n` +
    `│  🔄  Fetching commands...\n` +
    `│  📡  Connecting server...\n` +
    `│  🧠  Sorting categories...\n` +
    `│  🎨  Rendering layout...\n` +
    `│  🤖  Warming up AutoChat AI...\n` +
    `│  ✅  Almost ready...\n` +
    `│                             │\n` +
    `└─────────────────────────────┘\n` +
    `\n_⚡ Powered by Ladybug Bot Mini V5_`
  );
}

// ══════════════════════════════════════════════
//  TWO-COLUMN COMMAND SECTION BUILDER
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
    rows.push(`  │  ${L}${R}`);
  }

  return [
    `  ┌──〔 ${icon} *${label}*  ·  ${cmds.length} cmd 〕`,
    ...rows,
    `  └${'─'.repeat(38)}`,
    ''
  ].join('\n');
}

// ══════════════════════════════════════════════
//  FULL PLAIN-TEXT MENU  (iOS + fallback)
// ══════════════════════════════════════════════
function buildMenuText(commands, categories, sender) {
  const ownerName = Array.isArray(config.ownerName)
    ? config.ownerName[0]
    : config.ownerName;

  const uptime    = formatUptime(Math.floor(process.uptime()));
  const now       = getNow();
  const ram       = getRam();
  const totalCmds = commands.size;
  const greeting  = getGreeting();

  let txt = '';

  // ── HEADER ──────────────────────────────────
  txt += `\n`;
  txt += `╔══════════════════════════════════════════╗\n`;
  txt += `║                                          ║\n`;
  txt += `║  🐞  *L A D Y B U G   B O T   M I N I*  ║\n`;
  txt += `║  ✦ ✦ ✦ ✦ ✦  *V 5*  ✦ ✦ ✦ ✦ ✦           ║\n`;
  txt += `║                                          ║\n`;
  txt += `╠══════════════════════════════════════════╣\n`;
  txt += `║                                          ║\n`;
  txt += `║  ☀️  *${greeting}, @${sender}!*\n`;
  txt += `║  💬  Welcome to Ladybug Bot Mini V5\n`;
  txt += `║  🤖  Your AI-powered WhatsApp assistant!\n`;
  txt += `║                                          ║\n`;
  txt += `║  🗓️  ${now}\n`;
  txt += `║                                          ║\n`;
  txt += `╠═══〔 ⚙️  *SYSTEM STATUS* 〕═══════════════╣\n`;
  txt += `║                                          ║\n`;
  txt += `║  ⏱️   Uptime     »  *${uptime}*\n`;
  txt += `║  💾   Memory     »  *${ram}*\n`;
  txt += `║  📦   Commands   »  *${totalCmds} total*\n`;
  txt += `║  ⚡   Prefix     »  *${config.prefix}*\n`;
  txt += `║  👑   Owner      »  *${ownerName}*\n`;
  txt += `║  🌐   Host       »  *LadybugNodes*\n`;
  txt += `║  🟢   Status     »  *Online & Active*\n`;
  txt += `║  🔖   Version    »  *V5*\n`;
  txt += `║                                          ║\n`;
  txt += `╠═══〔 🤖  *AUTOCHAT AI* 〕════════════════╣\n`;
  txt += `║                                          ║\n`;
  txt += `║  🧠  Human-like AI auto-reply is here!  ║\n`;
  txt += `║                                          ║\n`;
  txt += `║  ⚡ *${config.prefix}autochat on*   →  Enable AI chat\n`;
  txt += `║  🔕 *${config.prefix}autochat off*  →  Disable AI chat\n`;
  txt += `║  🧹 *${config.prefix}autochat reset*→  Clear memory\n`;
  txt += `║  📊 *${config.prefix}autochat status*→ Check state\n`;
  txt += `║                                          ║\n`;
  txt += `╚══════════════════════════════════════════╝\n`;

  // ── COMMAND SECTIONS ────────────────────────
  txt += `\n━━━━━━〔 📋 *COMMAND LIST* 〕━━━━━━\n\n`;

  for (const key of ORDER) {
    txt += buildSection(key, categories[key]);
  }
  for (const [key, cmds] of Object.entries(categories)) {
    if (!ORDER.includes(key)) txt += buildSection(key, cmds);
  }

  // ── FOOTER ──────────────────────────────────
  txt += `╔══════════════════════════════════════════╗\n`;
  txt += `║                                          ║\n`;
  txt += `║  💡  *${config.prefix}help [cmd]*           →  command info\n`;
  txt += `║  📌  *${config.prefix}uptime*               →  bot stats\n`;
  txt += `║  📡  *${config.prefix}ping*                 →  check speed\n`;
  txt += `║  👁️  *${config.prefix}autostatusview on*    →  auto-view status\n`;
  txt += `║  ❤️   *${config.prefix}autostatuslike on*   →  auto-like status\n`;
  txt += `║  🤖  *${config.prefix}autochat on*          →  enable AI chat\n`;
  txt += `║                                          ║\n`;
  txt += `╠══════════════════════════════════════════╣\n`;
  txt += `║                                          ║\n`;
  txt += `║  🔥  *Built by Dev-Ntando*               ║\n`;
  txt += `║  🇿🇼  *Made with ❤️  in Zimbabwe*          ║\n`;
  txt += `║  🐞  *Ladybug Bot Mini V5 — Stay on Top* ║\n`;
  txt += `║                                          ║\n`;
  txt += `╚══════════════════════════════════════════╝`;

  return txt;
}

// ══════════════════════════════════════════════
//  INTERACTIVE LIST SECTIONS  (Android)
// ══════════════════════════════════════════════
function buildListSections(categories) {
  const sections = [];
  const renderKey = [...ORDER, ...Object.keys(categories).filter(k => !ORDER.includes(k))];

  for (const key of renderKey) {
    const cmds = categories[key];
    if (!cmds?.length) continue;
    const { icon, label } = CAT[key] ?? { icon: '◌', label: key.toUpperCase() };

    sections.push({
      title: `${icon} ${label}`,
      rows: cmds.map(cmd => ({
        title:       `${config.prefix}${cmd.name}`,
        description: cmd.description || '',
        id:          `cmd_${cmd.name}`,
      })),
    });
  }

  return sections;
}

// ══════════════════════════════════════════════
//  SHORT HEADER TEXT  (interactive messages)
// ══════════════════════════════════════════════
function buildHeaderText(commands, sender) {
  const uptime    = formatUptime(Math.floor(process.uptime()));
  const ram       = getRam();
  const totalCmds = commands.size;
  const ownerName = Array.isArray(config.ownerName)
    ? config.ownerName[0]
    : config.ownerName;
  const greeting  = getGreeting();

  return (
    `🐞 *LADYBUG BOT MINI  V5*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `☀️  *${greeting}, @${sender}!*\n` +
    `💬 Welcome to Ladybug Bot Mini V5.\n` +
    `🤖 Your AI-powered WhatsApp assistant!\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱️  *Uptime:*    ${uptime}\n` +
    `💾 *Memory:*    ${ram}\n` +
    `📦 *Commands:*  ${totalCmds} total\n` +
    `⚡ *Prefix:*    ${config.prefix}\n` +
    `👑 *Owner:*     ${ownerName}\n` +
    `🌐 *Host:*      LadybugNodes\n` +
    `🔖 *Version:*   V5\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🤖 *AutoChat AI:*  ${config.prefix}autochat on/off\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_Tap a category below to browse commands_ 👇`
  );
}

// ══════════════════════════════════════════════
//  ANDROID INTERACTIVE SEND
// ══════════════════════════════════════════════
const BUTTONS = [
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🏠 General',    id: 'cat_general'     }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎵 Media',      id: 'cat_media'       }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🤖 AI Chat',    id: 'cat_ai'          }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎮 Fun',        id: 'cat_fun'         }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👁️ Status',     id: 'cat_statustools' }) },
  {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
      display_text: '📺 YouTube',
      url: (config.social && config.social.youtube) || `https://youtube.com`,
    }),
  },
];

async function sendPlainMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
  const hasImage  = fs.existsSync(imagePath);
  const menuText  = buildMenuText(commands, categories, sender);

  if (hasImage) {
    await sock.sendMessage(extra.from, {
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
    }, { quoted: msg });
  } else {
    await sock.sendMessage(extra.from, {
      text:     menuText,
      mentions: [extra.sender],
    }, { quoted: msg });
  }
}

async function sendAndroidMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
  const hasImage  = fs.existsSync(imagePath);
  const sections  = buildListSections(categories);
  const headerTxt = buildHeaderText(commands, sender);
  const greeting  = getGreeting();

  try {
    // Step 1 — image header
    if (hasImage) {
      await sock.sendMessage(extra.from, {
        image:    fs.readFileSync(imagePath),
        caption:
          `🐞 *LADYBUG BOT MINI  V5*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `☀️  _${greeting}, welcome!_\n` +
          `🤖  AutoChat AI • Song Downloader • & more!\n\n` +
          `> Made with ❤️ by Dev-Ntando`,
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
      }, { quoted: msg });
    }

    // Step 2 — interactive command list
    await sendList(sock, extra.from, {
      title:      '🐞 Ladybug Bot Mini  V5',
      text:       headerTxt,
      footer:     `> 🔥 Powered by ${config.botName}  ·  Made with ❤️`,
      buttonText: '📋 Browse Commands',
      sections,
      mentions:   [extra.sender],
    }, { quoted: hasImage ? undefined : msg });

    // Step 3 — category shortcut buttons
    await sendButtons(sock, extra.from, {
      title:  '',
      text:
        `⚡ *Quick Category Shortcuts*\n` +
        `Tap a button to jump to a category:\n\n` +
        `🏠 *General*  ·  🎵 *Media*  ·  🤖 *AI Chat*\n` +
        `🎮 *Fun*  ·  👁️ *Status Tools*\n\n` +
        `🤖 *AutoChat AI (New!)*\n` +
        `  • *${config.prefix}autochat on*    →  enable AI chat\n` +
        `  • *${config.prefix}autochat off*   →  disable AI chat\n` +
        `  • *${config.prefix}autochat reset* →  clear memory\n\n` +
        `💡 *${config.prefix}help [cmd]*     →  command info\n` +
        `📡 *${config.prefix}ping*           →  check speed\n` +
        `👁️ *${config.prefix}autostatusview on*  →  auto-view\n` +
        `❤️  *${config.prefix}autostatuslike on*  →  auto-like`,
      footer: `> *Ladybug Bot Mini V5*  ·  Made with ❤️`,
      buttons: BUTTONS,
    }, { quoted: undefined });

  } catch (err) {
    console.warn('[Menu V5] Interactive send failed, falling back to text:', err.message);
    await sendPlainMenu(sock, msg, extra, commands, categories, sender);
  }
}

// ══════════════════════════════════════════════
//  MODULE EXPORT
// ══════════════════════════════════════════════
module.exports = {
  name:        'menu',
  aliases:     ['help', 'start', 'commands', 'cmd'],
  category:    'general',
  description: 'Show the Ladybug Bot Mini V5 command menu',
  usage:       '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const chatId   = extra?.from || msg.key.remoteJid;
      const sender   = (extra?.sender || msg.key.participant || msg.key.remoteJid || '').split('@')[0];
      const platform = detectPlatform(msg);

      // Loading message
      let loadingMsgKey = null;
      try {
        const loadingMsg = await sock.sendMessage(chatId, {
          text:     buildLoadingMsg(sender),
          mentions: [extra?.sender || msg.key.remoteJid],
        }, { quoted: msg });
        loadingMsgKey = loadingMsg?.key;
      } catch { /* non-critical */ }

      // Load commands
      const commands   = loadCommands();
      const categories = {};

      for (const [, cmd] of commands) {
        const cat = cmd.category || 'general';
        if (!categories[cat]) categories[cat] = [];
        // Avoid duplicates from aliases
        if (!categories[cat].find(c => c.name === cmd.name)) {
          categories[cat].push(cmd);
        }
      }

      // Small delay so loading message is visible
      await new Promise(r => setTimeout(r, 800));

      // Delete loading message
      if (loadingMsgKey) {
        try {
          await sock.sendMessage(chatId, { delete: loadingMsgKey });
        } catch { /* ignore if can't delete */ }
      }

      // Send menu based on platform
      if (platform === 'ios') {
        await sendPlainMenu(sock, msg, extra, commands, categories, sender);
      } else {
        await sendAndroidMenu(sock, msg, extra, commands, categories, sender);
      }

    } catch (err) {
      console.error('[Menu V5] Error:', err);
      await sock.sendMessage(
        extra?.from || msg.key.remoteJid,
        { text: '❌ Failed to load menu. Please try again.\n\n> Made with ❤️ by Ladybug Bot Mini V5' },
        { quoted: msg }
      );
    }
  },
};
