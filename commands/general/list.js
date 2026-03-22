/**
 * ╔══════════════════════════════════════════════════════╗
 * ║         LIST COMMAND  —  LADYBUG BOT MINI V5         ║
 * ║              by Dev-Ntando  |  Made with ❤️           ║
 * ║                                                      ║
 * ║  ✦ Full redesign — clean category button layout      ║
 * ║  ✦ Android → gifted-btns interactive category buttons║
 * ║  ✦ iOS     → rich plain-text list                    ║
 * ║  ✦ AutoChat AI category added                        ║
 * ║  ✦ English greetings                                 ║
 * ║  ✦ Version: V5                                       ║
 * ╚══════════════════════════════════════════════════════╝
 */

'use strict';

const config           = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { sendButtons }  = require('gifted-btns');
const fs               = require('fs');
const path             = require('path');

// ── Platform detection ───────────────────────────────────────
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

// ── English greeting ─────────────────────────────────────────
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

// ── Category meta ─────────────────────────────────────────────
const CAT = {
  general:     { icon: '🏠', label: 'General'              },
  ai:          { icon: '🤖', label: 'AI & AutoChat'         },
  group:       { icon: '👥', label: 'Group Management'      },
  admin:       { icon: '🛡️', label: 'Admin Tools'           },
  owner:       { icon: '👑', label: 'Owner Only'            },
  media:       { icon: '🎵', label: 'Media & Downloads'     },
  fun:         { icon: '🎮', label: 'Fun & Games'           },
  utility:     { icon: '🔧', label: 'Utility Tools'         },
  anime:       { icon: '🌸', label: 'Anime'                 },
  textmaker:   { icon: '✏️', label: 'Text Maker'            },
  statustools: { icon: '👁️', label: 'Status View & Like'   },
};

const ORDER = [
  'general','ai','media','fun','utility',
  'group','admin','owner','anime','textmaker','statustools'
];

// ── V5 category shortcut buttons ──────────────────────────────
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
      url: (config.social && config.social.youtube) || 'https://youtube.com',
    }),
  },
];

// ── Build plain-text list ─────────────────────────────────────
function buildPlainList(categories, prefix, greeting) {
  let menu = `🐞 *LADYBUG BOT MINI  V5*\n`;
  menu    += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  menu    += `☀️  *${greeting}!* Here are all commands:\n`;
  menu    += `⚡ Prefix: *${prefix}*\n`;
  menu    += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const renderKey = [...ORDER, ...Object.keys(categories).filter(k => !ORDER.includes(k))];

  for (const key of renderKey) {
    const cmds = categories[key];
    if (!cmds?.length) continue;
    const { icon, label } = CAT[key] ?? { icon: '◌', label: key.toUpperCase() };

    menu += `${icon} *${label}*\n`;
    for (const entry of cmds) {
      const cmdList = [entry.name, ...(entry.aliases || [])].map(n => `${prefix}${n}`).join(', ');
      const desc    = entry.description || '';
      menu += desc
        ? `  • \`${cmdList}\` — ${desc}\n`
        : `  • ${cmdList}\n`;
    }
    menu += '\n';
  }

  menu  = menu.trimEnd();
  menu += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `🤖 *AutoChat AI:* ${prefix}autochat on/off\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `🔥 _Powered by Dev-Ntando  ·  Made with ❤️_`;

  return menu;
}

// ══════════════════════════════════════════════
//  MODULE EXPORT
// ══════════════════════════════════════════════
module.exports = {
  name:        'list',
  aliases:     ['cmds', 'commandlist', 'allcmds'],
  category:    'general',
  description: 'Browse all commands by category',
  usage:       '.list',

  async execute(sock, msg, args, extra) {
    try {
      const chatId   = extra?.from || msg.key.remoteJid;
      const platform = detectPlatform(msg);
      const prefix   = config.prefix || '.';
      const greeting = getGreeting();

      // Load & categorise commands
      const commands   = loadCommands();
      const categories = {};

      for (const [, cmd] of commands) {
        const cat = cmd.category || 'general';
        if (!categories[cat]) categories[cat] = [];
        if (!categories[cat].find(c => c.name === cmd.name)) {
          categories[cat].push(cmd);
        }
      }

      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      const hasImage  = fs.existsSync(imagePath);
      const menu      = buildPlainList(categories, prefix, greeting);

      if (platform === 'ios') {
        // iOS: image + caption if available, else plain text
        if (hasImage) {
          await sock.sendMessage(chatId, {
            image:    fs.readFileSync(imagePath),
            caption:  menu,
            mentions: [extra?.sender],
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
          await sock.sendMessage(chatId, {
            text:     menu,
            mentions: [extra?.sender],
          }, { quoted: msg });
        }

      } else {
        // Android: image header first, then interactive buttons
        if (hasImage) {
          await sock.sendMessage(chatId, {
            image:    fs.readFileSync(imagePath),
            caption:
              `🐞 *LADYBUG BOT MINI  V5*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `☀️  _${greeting}! Here's the full command list._\n\n` +
              `> Made with ❤️ by Dev-Ntando`,
            mentions: [extra?.sender],
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

        // Interactive buttons with full list
        try {
          await sendButtons(sock, chatId, {
            title:   '',
            text:    menu,
            footer:  `> *Ladybug Bot Mini V5*  ·  Made with ❤️`,
            buttons: BUTTONS,
          }, { quoted: hasImage ? undefined : msg });
        } catch (btnErr) {
          console.warn('[List V5] Buttons failed, falling back to text:', btnErr.message);
          await sock.sendMessage(chatId, {
            text:     menu,
            mentions: [extra?.sender],
          }, { quoted: msg });
        }
      }

    } catch (err) {
      console.error('[List V5] Error:', err);
      await extra.reply('❌ Failed to load command list. Please try again.\n\n> Made with ❤️ by Ladybug Bot Mini V5');
    }
  },
};
