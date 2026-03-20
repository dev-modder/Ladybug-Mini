/**
 * Menu Command — ★ GALAXY NEON Design ★  V(5)
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  ✦ Space/cyberpunk aesthetic with star & neon borders
 *  ✦ Android → interactive category buttons + list
 *  ✦ iOS     → clean plain-text fallback
 *  ✦ Indonesian greetings
 *  ✦ Version: V(5)
 */

'use strict';

const config  = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { sendButtons, sendList } = require('gifted-btns');
const fs   = require('fs');
const path = require('path');

// ── Platform Detection ───────────────────────
function detectPlatform(msg) {
  try {
    const keyId = msg?.key?.id || '';
    if (/^[A-F0-9]{16}$/.test(keyId)) return 'ios';
    if (msg?.message?.interactiveResponseMessage) return 'android';
    return 'android';
  } catch { return 'android'; }
}

// ── Utilities ────────────────────────────────
function formatUptime(sec) {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600),
        m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  const p = [];
  if (d) p.push(`${d}h`); if (h) p.push(`${h}j`);
  if (m) p.push(`${m}m`); if (s || !p.length) p.push(`${s}d`);
  return p.join(' ');
}

function getNow() {
  return new Date().toLocaleString('id-ID', {
    timeZone: config.timezone || 'Africa/Harare',
    hour12: false, weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getRam() {
  return `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`;
}

function getGreeting() {
  const h = parseInt(new Date().toLocaleString('id-ID', {
    timeZone: config.timezone || 'Africa/Harare', hour: '2-digit', hour12: false,
  }), 10);
  if (h >= 4  && h < 11) return 'Selamat Pagi';
  if (h >= 11 && h < 15) return 'Selamat Siang';
  if (h >= 15 && h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// ── Category Meta ────────────────────────────
const CAT = {
  general:     { icon: '✦', label: 'UMUM'              },
  ai:          { icon: '◉', label: 'AI & KECERDASAN'   },
  group:       { icon: '⬡', label: 'MANAJEMEN GRUP'    },
  admin:       { icon: '⬢', label: 'ALAT ADMIN'        },
  owner:       { icon: '★', label: 'KHUSUS OWNER'      },
  media:       { icon: '◈', label: 'MEDIA & UNDUHAN'   },
  fun:         { icon: '✺', label: 'FUN & PERMAINAN'   },
  utility:     { icon: '⚙', label: 'ALAT UTILITAS'    },
  anime:       { icon: '✿', label: 'ANIME'             },
  textmaker:   { icon: '▰', label: 'PEMBUAT TEKS'      },
  statustools: { icon: '👁', label: 'STATUS VIEW & LIKE'},
};

const ORDER = ['general','ai','media','fun','utility','group','admin','owner','anime','textmaker','statustools'];

// ── Section Builder ───────────────────────────
function buildSection(key, cmds) {
  if (!cmds?.length) return '';
  const { icon, label } = CAT[key] ?? { icon: '✦', label: key.toUpperCase() };
  const names = cmds.map(c => `${config.prefix}${c.name}`);
  const COL = 20;
  const rows = [];
  for (let i = 0; i < names.length; i += 2) {
    rows.push(`  ┃  ${names[i].padEnd(COL)}${names[i+1] ?? ''}`);
  }
  return [
    `  ┏━━━❮ ${icon} *${label}* · ${cmds.length} cmd ❯`,
    ...rows,
    `  ┗${'━'.repeat(38)}`,
    ''
  ].join('\n');
}

// ── Loading Message ───────────────────────────
function buildLoadingMsg(sender) {
  return (
    `★═══════════════════════════════★\n` +
    `  🚀  *MEMUAT GALAKSI MENU...*\n` +
    `★═══════════════════════════════★\n` +
    `\n` +
    `  ✦  Hei @${sender}!\n` +
    `  🌌  Menghubungkan ke galaksi...\n` +
    `  💫  Mengambil perintah...\n` +
    `  🔭  Memindai kategori...\n` +
    `  ⚡  Rendering layout...\n` +
    `  ✅  Hampir siap...\n` +
    `\n` +
    `★═══════════════════════════════★\n` +
    `_🌠 Didukung oleh LadybugNodes_`
  );
}

// ── Plain-Text Menu ────────────────────────────
function buildMenuText(commands, categories, sender) {
  const ownerName = Array.isArray(config.ownerName) ? config.ownerName[0] : config.ownerName;
  const uptime = formatUptime(Math.floor(process.uptime()));
  const now = getNow(), ram = getRam();
  const totalCmds = commands.size;
  const greeting = getGreeting();

  let txt = `\n`;
  txt += `★════════════════════════════════════════★\n`;
  txt += `  🌌  *L A D Y B U G   B O T   M I N I*\n`;
  txt += `       ✦ ✦  *G A L A X Y   V(5)*  ✦ ✦\n`;
  txt += `★════════════════════════════════════════★\n`;
  txt += `\n`;
  txt += `  🌙  *${greeting}, @${sender}!*\n`;
  txt += `  💬  Selamat datang di galaksi Ladybug!\n`;
  txt += `  🚀  Bot siap membantumu menjelajah! 🌟\n`;
  txt += `\n`;
  txt += `  🗓️  ${now}\n`;
  txt += `\n`;
  txt += `★════❮ ⚙️  STATUS SISTEM ❯════════════════★\n`;
  txt += `\n`;
  txt += `  ⏱️   Uptime     »  *${uptime}*\n`;
  txt += `  💾   Memori     »  *${ram}*\n`;
  txt += `  📦   Perintah   »  *${totalCmds} total*\n`;
  txt += `  ⚡   Awalan     »  *${config.prefix}*\n`;
  txt += `  👑   Pemilik    »  *${ownerName}*\n`;
  txt += `  🌐   Host       »  *LadybugNodes*\n`;
  txt += `  🟢   Status     »  *Online & Aktif* ✅\n`;
  txt += `  🔖   Versi      »  *V(5) Galaxy Neon*\n`;
  txt += `\n`;
  txt += `★════════════════════════════════════════★\n`;
  txt += `\n`;
  txt += `✦━━━━━━❮ 📋 DAFTAR PERINTAH ❯━━━━━━✦\n\n`;

  for (const key of ORDER) txt += buildSection(key, categories[key]);
  for (const [key, cmds] of Object.entries(categories)) {
    if (!ORDER.includes(key)) txt += buildSection(key, cmds);
  }

  txt += `★════════════════════════════════════════★\n`;
  txt += `  💡  *${config.prefix}help [cmd]*         →  info perintah\n`;
  txt += `  📡  *${config.prefix}ping*               →  cek kecepatan\n`;
  txt += `  👁   *${config.prefix}autostatusview on* →  auto-lihat status\n`;
  txt += `  ❤️   *${config.prefix}autostatuslike on* →  auto-like status\n`;
  txt += `\n`;
  txt += `★════════════════════════════════════════★\n`;
  txt += `  🔥  *Dibuat oleh Mr Ntando Ofc*\n`;
  txt += `  🇿🇼  *Dibuat dengan ❤️  di Zimbabwe*\n`;
  txt += `  🌌  *Ladybug Galaxy V(5) — Tetap Bersinar*\n`;
  txt += `★════════════════════════════════════════★`;

  return txt;
}

// ── List Sections ─────────────────────────────
function buildListSections(categories) {
  const sections = [];
  const renderKey = [...ORDER, ...Object.keys(categories).filter(k => !ORDER.includes(k))];
  for (const key of renderKey) {
    const cmds = categories[key];
    if (!cmds?.length) continue;
    const { icon, label } = CAT[key] ?? { icon: '✦', label: key.toUpperCase() };
    sections.push({
      title: `${icon} ${label}`,
      rows:  cmds.map(cmd => ({
        title:       `${config.prefix}${cmd.name}`,
        description: cmd.description || '',
        id:          `cmd_${cmd.name}`,
      })),
    });
  }
  return sections;
}

// ── Header for Interactive ────────────────────
function buildHeaderText(commands, sender) {
  const greeting = getGreeting();
  return (
    `🌌 *LADYBUG GALAXY V(5)*\n` +
    `★━━━━━━━━━━━━━━━━━━━━━━━★\n` +
    `🌙 *${greeting}, @${sender}!*\n` +
    `🚀 Siap menjelajah galaksi perintah!\n` +
    `★━━━━━━━━━━━━━━━━━━━━━━━★\n` +
    `⏱️  *Uptime:*   ${formatUptime(Math.floor(process.uptime()))}\n` +
    `💾 *Memori:*   ${getRam()}\n` +
    `📦 *Perintah:* ${commands.size} total\n` +
    `⚡ *Awalan:*  ${config.prefix}\n` +
    `🌐 *Host:*    LadybugNodes\n` +
    `★━━━━━━━━━━━━━━━━━━━━━━━★\n` +
    `_Ketuk kategori di bawah 👇_`
  );
}

// ── Buttons ───────────────────────────────────
const BUTTONS = [
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✦ Umum',         id: 'cat_general'     }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '◈ Media',        id: 'cat_media'       }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '◉ AI',           id: 'cat_ai'          }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✺ Fun',          id: 'cat_fun'         }) },
  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '👁 Status Tools', id: 'cat_statustools' }) },
  { name: 'cta_url',     buttonParamsJson: JSON.stringify({ display_text: '📺 YouTube', url: (config.social?.youtube) || `https://wa.me/${(config.newsletterJid||'120363161518@newsletter').split('@')[0]}` }) },
  { name: 'cta_url',     buttonParamsJson: JSON.stringify({ display_text: '💻 GitHub',  url: (config.social?.github)   || `https://wa.me/${(config.newsletterJid||'120363161518@newsletter').split('@')[0]}` }) },
];

// ── Send Helpers ──────────────────────────────
async function sendAndroidMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
  const hasImage  = fs.existsSync(imagePath);
  const greeting  = getGreeting();

  try {
    if (hasImage) {
      await sock.sendMessage(extra.from, {
        image:   fs.readFileSync(imagePath),
        caption: `🌌 *Ladybug Galaxy V(5)* — by Dev-Ntando\n🌙 _${greeting}, selamat datang di galaksi!_ 🚀`,
        mentions: [extra.sender],
        contextInfo: { forwardingScore: 1, isForwarded: true,
          forwardedNewsletterMessageInfo: { newsletterJid: config.newsletterJid||'120363161518@newsletter', newsletterName: config.botName, serverMessageId: -1 } },
      }, { quoted: msg });
    }

    await sendList(sock, extra.from, {
      title: '🌌 Ladybug Galaxy V(5)', text: buildHeaderText(commands, sender),
      footer: `> 🌠 Didukung oleh ${config.botName}`, buttonText: '🚀 Jelajahi Perintah',
      sections: buildListSections(categories), mentions: [extra.sender],
    }, { quoted: hasImage ? undefined : msg });

    await sendButtons(sock, extra.from, {
      title: '', footer: `> *Galaxy V(5)* · LadybugNodes`,
      text:
        `🌌 *Pintasan Galaksi*\n` +
        `Ketuk bintang di bawah untuk menjelajah:\n\n` +
        `✦ *Umum* · ◈ *Media* · ◉ *AI* · ✺ *Fun* · 👁 *Status*\n\n` +
        `💡 *${config.prefix}help [cmd]*         →  info perintah\n` +
        `👁 *${config.prefix}autostatusview on*  →  auto-lihat status\n` +
        `❤️  *${config.prefix}autostatuslike on* →  auto-like status`,
      buttons: BUTTONS,
    }, { quoted: undefined });
  } catch (err) {
    console.warn('[Menu Galaxy] Fallback ke teks:', err.message);
    await sendPlainMenu(sock, msg, extra, commands, categories, sender);
  }
}

async function sendPlainMenu(sock, msg, extra, commands, categories, sender) {
  const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
  const hasImage  = fs.existsSync(imagePath);
  const menuText  = buildMenuText(commands, categories, sender);
  const payload   = hasImage
    ? { image: fs.readFileSync(imagePath), caption: menuText, mentions: [extra.sender],
        contextInfo: { forwardingScore: 1, isForwarded: true,
          forwardedNewsletterMessageInfo: { newsletterJid: config.newsletterJid||'120363161518@newsletter', newsletterName: config.botName, serverMessageId: -1 } } }
    : { text: menuText, mentions: [extra.sender] };
  await sock.sendMessage(extra.from, payload, { quoted: msg });
}

// ── Module ────────────────────────────────────
module.exports = {
  name: 'menu', aliases: ['help','start','cmds','commands'],
  description: 'Tampilkan semua perintah bot', usage: '.menu', category: 'general',

  async execute(sock, msg, args, extra) {
    try {
      const sender   = extra.sender.split('@')[0];
      const platform = detectPlatform(msg);
      const commands = loadCommands();
      const categories = {};

      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          const cat = (cmd.category || 'other').toLowerCase();
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(cmd);
        }
      });

      let loadMsg;
      try {
        loadMsg = await sock.sendMessage(extra.from,
          { text: buildLoadingMsg(sender), mentions: [extra.sender] }, { quoted: msg });
      } catch (_) {}

      await new Promise(r => setTimeout(r, 1200));
      if (loadMsg?.key) { try { await sock.sendMessage(extra.from, { delete: loadMsg.key }); } catch (_) {} }

      if (platform === 'ios') await sendPlainMenu(sock, msg, extra, commands, categories, sender);
      else                     await sendAndroidMenu(sock, msg, extra, commands, categories, sender);

    } catch (err) {
      console.error('[Menu Galaxy V5]', err);
      await extra.reply('❌ Gagal memuat menu. Coba lagi.');
    }
  },
};
