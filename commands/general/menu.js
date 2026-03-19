/**
 * Menu Command — CRIMSON EMPIRE Design
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  ✦ Auto-detects iOS vs Android and sends the right format
 *  ✦ Android  → gifted-btns interactive buttons + list sections
 *  ✦ iOS      → clean formatted plain-text (buttons not supported)
 *  ✦ Loading message → deleted after menu posts
 *  ✦ Live uptime, RAM, date & time (CAT / Africa/Harare)
 *  ✦ Per-category command count
 *  ✦ Two-column command layout
 *  ✦ Newsletter forward tag
 *  ✦ Image + caption OR plain text fallback
 */

'use strict';

const config  = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { sendButtons, sendList } = require('gifted-btns');
const fs      = require('fs');
const path    = require('path');

// ══════════════════════════════════════════════
//  PLATFORM DETECTION
//  WhatsApp embeds device info in message.verifiedBizName
//  or we can read the agent string from message context.
//  Most reliable: check msg.message keys for interactiveMessage
//  support. If the sender's device is iOS, Baileys reports
//  it via the key.id prefix pattern or via userAgent.
//  Safest approach: try interactive, catch & fallback to text.
// ══════════════════════════════════════════════

/**
 * Returns 'ios' | 'android' | 'unknown'
 * Reads the optional platform hint Baileys attaches to the
 * message context (available in newer Baileys versions).
 */
function detectPlatform(msg) {
  try {
    // Baileys >= 6.x attaches device info here
    const agent =
      msg?.message?.extendedTextMessage?.contextInfo?.externalAdReply?.mediaType ||
      msg?.verifiedBizName ||
      '';

    // Key ID prefix: iOS uses a 16-char hex key, Android uses
    // alphanumeric. Not 100% reliable — use the try/catch strategy.
    const keyId = msg?.key?.id || '';

    // Check for explicit iOS indicators in key or context
    if (/^[A-F0-9]{16}$/.test(keyId)) return 'ios';

    // If message has no interactiveResponseMessage support hint → iOS
    if (msg?.message?.interactiveResponseMessage) return 'android';

    // Default: assume Android (interactive will be tried first)
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
//  TEXT SECTION BUILDER  (used by both platforms)
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
//  PLAIN-TEXT MENU BUILDER  (iOS + fallback)
// ══════════════════════════════════════════════
function buildMenuText(commands, categories, sender) {
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
  txt += `\n━━━━━━〘 📋 *COMMAND MENU* 〙━━━━━━\n\n`;

  // ── COMMAND SECTIONS ────────────────────────
  for (const key of ORDER) {
    txt += buildSection(key, categories[key]);
  }
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
//  INTERACTIVE LIST SECTIONS BUILDER  (Android)
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
//  HEADER TEXT (short — for interactive messages)
// ══════════════════════════════════════════════
function buildHeaderText(commands, sender) {
  const uptime    = formatUptime(Math.floor(process.uptime()));
  const ram       = getRam();
  const totalCmds = commands.size;
  const ownerName = Array.isArray(config.ownerName)
    ? config.ownerName[0]
    : config.ownerName;

  return (
    `🐞 *LADYBUG BOT MINI*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *User:*    @${sender}\n` +
    `⏱️  *Uptime:*  ${uptime}\n` +
    `💾 *RAM:*    ${ram}\n` +
    `📦 *Cmds:*   ${totalCmds} total\n` +
    `⚡ *Prefix:* ${config.prefix}\n` +
    `👑 *Owner:*  ${ownerName}\n` +
    `🌐 *Host:*   LadybugNodes\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_Tap a category below to browse commands_`
  );
}

// ══════════════════════════════════════════════
//  SEND HELPERS
// ══════════════════════════════════════════════

const BUTTONS = [
  {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
      display_text: '📺 YouTube',
      url: (config.social && config.social.youtube) || 'http://youtube.com/@mr_ntando_ofc'
    })
  },
  {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
      display_text: '💻 GitHub',
      url: (config.social && config.social.github) || 'https://github.com/mrntandodev'
    })
  },
  {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
      display_text: '📢 Channel',
      url: `https://whatsapp.com/channel/${(config.newsletterJid || '120363161518@newsletter').split('@')[0]}`
    })
  }
];

/**
 * Send interactive list + buttons  (Android)
 * Falls back to plain text if gifted-btns throws.
 */
async function sendAndroidMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
  const hasImage  = fs.existsSync(imagePath);
  const sections  = buildListSections(categories);
  const headerTxt = buildHeaderText(commands, sender);

  try {
    // Send image header first (if available)
    if (hasImage) {
      await sock.sendMessage(extra.from, {
        image:    fs.readFileSync(imagePath),
        caption:  `🐞 *Ladybug Bot Mini* — by Dev-Ntando\n_Loading interactive menu..._`,
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

    // Send interactive list (command browser)
    await sendList(sock, extra.from, {
      title:       '🐞 Ladybug Bot Mini',
      text:        headerTxt,
      footer:      `> 🔥 Powered by ${config.botName}`,
      buttonText:  '📋 Browse Commands',
      sections,
      mentions:    [extra.sender],
    }, { quoted: hasImage ? undefined : msg });

    // Send buttons row
    await sendButtons(sock, extra.from, {
      title:  '',
      text:   `💡 *${config.prefix}help [cmd]*  →  command details\n📡 *${config.prefix}ping*  →  check bot speed`,
      footer: `> *Ladybug Bot Mini* · LadybugNodes`,
      buttons: BUTTONS,
    }, { quoted: undefined });

  } catch (err) {
    // Interactive failed (e.g. old Baileys, ban-risk env) → fall back
    console.warn('[Menu] Interactive send failed, falling back to text:', err.message);
    await sendPlainMenu(sock, msg, extra, commands, categories, sender);
  }
}

/**
 * Send plain formatted text  (iOS + fallback)
 */
async function sendPlainMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
  const hasImage  = fs.existsSync(imagePath);
  const menuText  = buildMenuText(commands, categories, sender);

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
}

// ══════════════════════════════════════════════
//  MODULE
// ══════════════════════════════════════════════
module.exports = {
  name:        'menu',
  aliases:     ['help', 'commands', 'cmds', 'start'],
  category:    'general',
  description: 'Show all available commands',
  usage:       '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const sender   = extra.sender.split('@')[0];
      const platform = detectPlatform(msg);

      // ── 1. Send loading message ──────────────
      const loadingKey = await sock.sendMessage(
        extra.from,
        {
          text:     buildLoadingMsg(sender),
          mentions: [extra.sender],
        },
        { quoted: msg }
      );

      // ── 2. Build command map ─────────────────
      const commands   = loadCommands();
      const categories = {};
      commands.forEach((cmd, name) => {
        if (cmd.name !== name) return; // skip aliases
        const cat = (cmd.category || 'general').toLowerCase();
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd);
      });

      // Short delay so loading message is visible
      await new Promise(r => setTimeout(r, 1800));

      // ── 3. Send platform-appropriate menu ────
      if (platform === 'ios') {
        // iOS: plain text only — no interactive messages supported
        await sendPlainMenu(sock, msg, extra, commands, categories, sender);
      } else {
        // Android: interactive list + buttons (falls back to text on error)
        await sendAndroidMenu(sock, msg, extra, commands, categories, sender);
      }

      // ── 4. Delete loading message ────────────
      try {
        await sock.sendMessage(extra.from, { delete: loadingKey.key });
      } catch (_) {}

    } catch (error) {
      console.error('[Menu] Error:', error);
      await extra.reply(`❌ Failed to load menu: ${error.message}`);
    }
  },
};
