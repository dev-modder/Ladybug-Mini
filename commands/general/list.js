/**
 * List Command — V(5) Nusantara Design
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  ✦ Android → gifted-btns interactive category buttons
 *  ✦ iOS     → clean plain-text list (no buttons)
 *  ✦ Indonesian language greetings & labels
 *  ✦ Version: V(5)
 */

'use strict';

const config  = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { sendButtons }  = require('gifted-btns');
const fs   = require('fs');
const path = require('path');

// ── Platform detection ───────────────────────
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

// ── V(5) Category buttons ────────────────────
const BUTTONS = [
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
  {
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({
      display_text: '📺 YouTube',
      url: (config.social && config.social.youtube) || `https://wa.me/${(config.newsletterJid || '120363161518@newsletter').split('@')[0]}`,
    }),
  },
];

module.exports = {
  name:        'list',
  aliases:     [],
  description: 'Tampilkan semua perintah beserta deskripsi',
  usage:       '.list',
  category:    'general',

  async execute(sock, msg, args, extra) {
    try {
      const prefix   = config.prefix;
      const commands = loadCommands();
      const platform = detectPlatform(msg);
      const greeting = getGreeting();
      const categories = {};

      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          const category = (cmd.category || 'lainnya').toLowerCase();
          if (!categories[category]) categories[category] = [];
          categories[category].push({
            label: cmd.description || '',
            names: [cmd.name].concat(cmd.aliases || []),
          });
        }
      });

      // ── Build plain-text list ─────────────────
      let menu = `🐞 *LADYBUG BOT MINI  V(5)*\n`;
      menu    += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      menu    += `🌙 *${greeting}!* Berikut daftar perintah:\n`;
      menu    += `⚡ Awalan: *${prefix}*\n`;
      menu    += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const orderedCats = Object.keys(categories).sort();
      for (const cat of orderedCats) {
        menu += `*📂 ${cat.toUpperCase()}*\n`;
        for (const entry of categories[cat]) {
          const cmdList = entry.names.map(n => `${prefix}${n}`).join(', ');
          const label   = entry.label || '';
          menu += label
            ? `• \`${cmdList}\` — ${label}\n`
            : `• ${cmdList}\n`;
        }
        menu += '\n';
      }
      menu  = menu.trimEnd();
      menu += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      menu += `🔥 _Didukung oleh Mr Ntando Ofc_`;

      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      const hasImage  = fs.existsSync(imagePath);

      if (platform === 'ios') {
        // iOS: image + caption if available, else plain text
        if (hasImage) {
          await sock.sendMessage(
            extra.from,
            {
              image:    fs.readFileSync(imagePath),
              caption:  menu,
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
            },
            { quoted: msg }
          );
        } else {
          await sock.sendMessage(
            extra.from,
            { text: menu, mentions: [extra.sender] },
            { quoted: msg }
          );
        }
      } else {
        // Android: image header first (if available), then category buttons
        if (hasImage) {
          await sock.sendMessage(
            extra.from,
            {
              image:    fs.readFileSync(imagePath),
              caption:  `🐞 *Ladybug Bot Mini  V(5)*\n🌙 _${greeting}, berikut daftar lengkap perintah!_`,
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
            },
            { quoted: msg }
          );
        }

        // Interactive buttons — falls back to plain text on failure
        try {
          await sendButtons(sock, extra.from, {
            title:   '',
            text:    menu,
            footer:  `> *Didukung oleh ${config.botName}  V(5)*`,
            buttons: BUTTONS,
          }, { quoted: hasImage ? undefined : msg });
        } catch (btnErr) {
          console.warn('[List V5] Tombol gagal, beralih ke teks:', btnErr.message);
          await sock.sendMessage(
            extra.from,
            { text: menu, mentions: [extra.sender] },
            { quoted: msg }
          );
        }
      }

    } catch (err) {
      console.error('[List V5] Error:', err);
      await extra.reply('❌ Gagal memuat daftar perintah. Silakan coba lagi.');
    }
  }
};
