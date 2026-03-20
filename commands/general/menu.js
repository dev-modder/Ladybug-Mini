/**
 * Menu Command — NUSANTARA EMPIRE Design  V(5)
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  ✦ Auto-detects iOS vs Android and sends the right format
 *  ✦ Android  → gifted-btns interactive category BUTTONS + list sections
 *  ✦ iOS      → clean formatted plain-text (buttons not supported)
 *  ✦ Loading message → deleted after menu posts
 *  ✦ Live uptime, RAM, date & time (CAT / Africa/Harare)
 *  ✦ Per-category command count
 *  ✦ Two-column command layout
 *  ✦ Newsletter forward tag
 *  ✦ Image + caption OR plain text fallback
 *  ✦ Greeting in Indonesian language
 *  ✦ Version: V(5)
 */

'use strict';

const config  = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { sendButtons, sendList } = require('gifted-btns');
const fs      = require('fs');
const path    = require('path');

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
  if (d) p.push(`${d}h`);
  if (h) p.push(`${h}j`);
  if (m) p.push(`${m}m`);
  if (s || !p.length) p.push(`${s}d`);
  return p.join(' ');
}

function getNow() {
  return new Date().toLocaleString('id-ID', {
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

/** Indonesian time-based greeting */
function getGreeting() {
  const hour = new Date().toLocaleString('id-ID', {
    timeZone: config.timezone || 'Africa/Harare',
    hour: '2-digit',
    hour12: false,
  });
  const h = parseInt(hour, 10);
  if (h >= 4  && h < 11) return 'Selamat Pagi';
  if (h >= 11 && h < 15) return 'Selamat Siang';
  if (h >= 15 && h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// ══════════════════════════════════════════════
//  CATEGORY META
// ══════════════════════════════════════════════
const CAT = {
  general:   { icon: '❖', label: 'UMUM'               },
  ai:        { icon: '◈', label: 'AI & KECERDASAN'     },
  group:     { icon: '◉', label: 'MANAJEMEN GRUP'      },
  admin:     { icon: '◆', label: 'ALAT ADMIN'          },
  owner:     { icon: '♛', label: 'KHUSUS OWNER'        },
  media:     { icon: '◎', label: 'MEDIA & UNDUHAN'     },
  fun:       { icon: '◇', label: 'FUN & PERMAINAN'     },
  utility:   { icon: '◑', label: 'ALAT UTILITAS'       },
  anime:     { icon: '◐', label: 'ANIME'               },
  textmaker: { icon: '▣', label: 'PEMBUAT TEKS'        },
};

const ORDER = [
  'general','ai','media','fun','utility',
  'group','admin','owner','anime','textmaker'
];

// ══════════════════════════════════════════════
//  TEXT SECTION BUILDER
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
    `  ╔══〘 ${icon} *${label}*  ·  ${cmds.length} cmd 〙`,
    ...rows,
    `  ╚${'═'.repeat(38)}`,
    ''
  ].join('\n');
}

// ══════════════════════════════════════════════
//  LOADING MESSAGE  (Indonesian)
// ══════════════════════════════════════════════
function buildLoadingMsg(sender) {
  return (
    `╔══════════════════════════════╗\n` +
    `║   ⏳  *MEMUAT MENU...*       ║\n` +
    `╠══════════════════════════════╣\n` +
    `║                              ║\n` +
    `║  👤  Hei @${sender}!\n` +
    `║                              ║\n` +
    `║  🔄  Mengambil perintah...\n` +
    `║  📡  Menghubungkan server...\n` +
    `║  🧠  Menyusun kategori...\n` +
    `║  🎨  Merender tampilan...\n` +
    `║  ✅  Hampir selesai...\n` +
    `║                              ║\n` +
    `╚══════════════════════════════╝\n` +
    `\n_⚡ Didukung oleh LadybugNodes_`
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
  const greeting  = getGreeting();

  let txt = '';

  // ── HEADER ──────────────────────────────────
  txt += `\n`;
  txt += `╔══════════════════════════════════════════╗\n`;
  txt += `║                                          ║\n`;
  txt += `║    🐞  *L A D Y B U G   B O T*   🐞     ║\n`;
  txt += `║          ✦ ✦  *M I N I  V(5)*  ✦ ✦      ║\n`;
  txt += `║                                          ║\n`;
  txt += `╠══════════════════════════════════════════╣\n`;
  txt += `║                                          ║\n`;
  txt += `║  🌙  *${greeting}, @${sender}!*\n`;
  txt += `║  💬  Selamat datang di Ladybug Bot Mini\n`;
  txt += `║  🤖  Bot siap melayani kamu 24/7!\n`;
  txt += `║                                          ║\n`;
  txt += `║  🗓️  ${now}\n`;
  txt += `║                                          ║\n`;
  txt += `╠═════〘 ⚙️  *STATUS SISTEM* 〙══════════════╣\n`;
  txt += `║                                          ║\n`;
  txt += `║  ⏱️   Uptime    »  *${uptime}*\n`;
  txt += `║  💾   Memori    »  *${ram}*\n`;
  txt += `║  📦   Perintah  »  *${totalCmds} total*\n`;
  txt += `║  ⚡   Awalan    »  *${config.prefix}*\n`;
  txt += `║  👑   Pemilik   »  *${ownerName}*\n`;
  txt += `║  🌐   Host      »  *LadybugNodes*\n`;
  txt += `║  🟢   Status    »  *Online & Aktif*\n`;
  txt += `║  🔖   Versi     »  *V(5)*\n`;
  txt += `║                                          ║\n`;
  txt += `╚══════════════════════════════════════════╝\n`;

  // ── SECTION DIVIDER ─────────────────────────
  txt += `\n━━━━━━〘 📋 *DAFTAR PERINTAH* 〙━━━━━━\n\n`;

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
  txt += `║  💡  *${config.prefix}help [cmd]*  →  info perintah\n`;
  txt += `║  📌  *${config.prefix}uptime*     →  statistik bot\n`;
  txt += `║  📡  *${config.prefix}ping*       →  cek kecepatan\n`;
  txt += `║                                          ║\n`;
  txt += `╠══════════════════════════════════════════╣\n`;
  txt += `║  🔥  *Dibuat oleh Mr Ntando Ofc*         ║\n`;
  txt += `║  🇿🇼  *Dibuat dengan ❤️  di Zimbabwe*      ║\n`;
  txt += `║  🐞  *Ladybug Bot Mini V(5) — Tetap Juara*║\n`;
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
//  HEADER TEXT  (short — for interactive messages)
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
    `🐞 *LADYBUG BOT MINI  V(5)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🌙 *${greeting}, @${sender}!*\n` +
    `💬 Selamat datang di Ladybug Bot Mini.\n` +
    `🤖 Bot siap melayani kamu 24/7!\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱️  *Uptime:*    ${uptime}\n` +
    `💾 *Memori:*    ${ram}\n` +
    `📦 *Perintah:*  ${totalCmds} total\n` +
    `⚡ *Awalan:*   ${config.prefix}\n` +
    `👑 *Pemilik:*  ${ownerName}\n` +
    `🌐 *Host:*     LadybugNodes\n` +
    `🔖 *Versi:*    V(5)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_Ketuk kategori di bawah untuk melihat perintah_ 👇`
  );
}

// ══════════════════════════════════════════════
//  INTERACTIVE BUTTONS — V(5) DESIGN
//  Category shortcut buttons + social links
// ══════════════════════════════════════════════
const BUTTONS = [
  // Quick-reply category buttons
  {
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: '❖ Umum',
      id:           'cat_general',
    }),
  },
  {
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: '◎ Media',
      id:           'cat_media',
    }),
  },
  {
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: '◈ AI',
      id:           'cat_ai',
    }),
  },
  {
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: '◇ Fun',
      id:           'cat_fun',
    }),
  },
  // Social link button
  {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
      display_text: '📺 YouTube',
      url: (config.social && config.social.youtube) || `https://wa.me/${(config.newsletterJid || '120363161518@newsletter').split('@')[0]}`,
    }),
  },
  {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
      display_text: '💻 GitHub',
      url: (config.social && config.social.github) || `https://wa.me/${(config.newsletterJid || '120363161518@newsletter').split('@')[0]}`,
    }),
  },
];

// ══════════════════════════════════════════════
//  SEND HELPERS
// ══════════════════════════════════════════════

/**
 * Send interactive list + category buttons  (Android)
 * Falls back to plain text if gifted-btns throws.
 */
async function sendAndroidMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
  const hasImage  = fs.existsSync(imagePath);
  const sections  = buildListSections(categories);
  const headerTxt = buildHeaderText(commands, sender);
  const greeting  = getGreeting();

  try {
    // Send image header first (if available)
    if (hasImage) {
      await sock.sendMessage(extra.from, {
        image:    fs.readFileSync(imagePath),
        caption:  `🐞 *Ladybug Bot Mini  V(5)* — by Dev-Ntando\n🌙 _${greeting}, selamat datang!_`,
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
      title:       '🐞 Ladybug Bot Mini  V(5)',
      text:        headerTxt,
      footer:      `> 🔥 Didukung oleh ${config.botName}`,
      buttonText:  '📋 Lihat Perintah',
      sections,
      mentions:    [extra.sender],
    }, { quoted: hasImage ? undefined : msg });

    // Send category shortcut buttons row
    await sendButtons(sock, extra.from, {
      title:   '',
      text:
        `⚡ *Pintasan Kategori*\n` +
        `Ketuk tombol di bawah untuk langsung ke kategori:\n\n` +
        `❖ *Umum*   ·   ◎ *Media*   ·   ◈ *AI*   ·   ◇ *Fun*\n\n` +
        `💡 *${config.prefix}help [perintah]*  →  info perintah\n` +
        `📡 *${config.prefix}ping*              →  cek kecepatan bot`,
      footer:  `> *Ladybug Bot Mini V(5)* · LadybugNodes`,
      buttons: BUTTONS,
    }, { quoted: undefined });

  } catch (err) {
    console.warn('[Menu V5] Pengiriman interaktif gagal, beralih ke teks:', err.message);
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
//  EXECUTE
// ══════════════════════════════════════════════
module.exports = {
  name:        'menu',
  aliases:     ['help', 'start', 'cmds', 'commands'],
  description: 'Tampilkan semua perintah bot',
  usage:       '.menu',
  category:    'general',

  async execute(sock, msg, args, extra) {
    try {
      const sender   = extra.sender.split('@')[0];
      const platform = detectPlatform(msg);
      const commands = loadCommands();

      // ── Categorise commands ───────────────────
      const categories = {};
      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          const cat = (cmd.category || 'other').toLowerCase();
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(cmd);
        }
      });

      // ── Send loading message ──────────────────
      let loadMsg;
      try {
        loadMsg = await sock.sendMessage(
          extra.from,
          { text: buildLoadingMsg(sender), mentions: [extra.sender] },
          { quoted: msg }
        );
      } catch (_) { /* non-fatal */ }

      // ── Small delay for UX ────────────────────
      await new Promise(r => setTimeout(r, 1200));

      // ── Delete loading message ────────────────
      if (loadMsg?.key) {
        try {
          await sock.sendMessage(extra.from, { delete: loadMsg.key });
        } catch (_) { /* non-fatal */ }
      }

      // ── Send menu ─────────────────────────────
      if (platform === 'ios') {
        await sendPlainMenu(sock, msg, extra, commands, categories, sender);
      } else {
        await sendAndroidMenu(sock, msg, extra, commands, categories, sender);
      }

    } catch (err) {
      console.error('[Menu V5] Error:', err);
      await extra.reply('❌ Gagal memuat menu. Silakan coba lagi.');
    }
  },
};
