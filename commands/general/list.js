/**
 * List Command — Cross-Platform
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  ✦ Android → gifted-btns interactive buttons
 *  ✦ iOS     → clean plain-text list (no buttons)
 */

'use strict';

const config  = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { sendButtons }  = require('gifted-btns');

// ── Platform detection (same logic as menu.js) ──
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

module.exports = {
  name:        'list',
  aliases:     [],
  description: 'List all commands with descriptions',
  usage:       '.list',
  category:    'general',

  async execute(sock, msg, args, extra) {
    try {
      const prefix   = config.prefix;
      const commands = loadCommands();
      const platform = detectPlatform(msg);
      const categories = {};

      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          const category = (cmd.category || 'other').toLowerCase();
          if (!categories[category]) categories[category] = [];
          categories[category].push({
            label: cmd.description || '',
            names: [cmd.name].concat(cmd.aliases || []),
          });
        }
      });

      // ── Build plain text list ──────────────────
      let menu = `*${config.botName} — Commands List*\n`;
      menu    += `Prefix: *${prefix}*\n\n`;

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
      menu = menu.trimEnd();

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

      if (platform === 'ios') {
        // iOS: send plain text only
        await sock.sendMessage(
          extra.from,
          { text: menu, mentions: [extra.sender] },
          { quoted: msg }
        );
      } else {
        // Android: send with interactive buttons (falls back to plain text)
        try {
          await sendButtons(sock, extra.from, {
            title:   '',
            text:    menu,
            footer:  `> *Powered by ${config.botName}*`,
            buttons: BUTTONS,
          }, { quoted: msg });
        } catch (btnErr) {
          console.warn('[List] Buttons failed, falling back to text:', btnErr.message);
          await sock.sendMessage(
            extra.from,
            { text: menu, mentions: [extra.sender] },
            { quoted: msg }
          );
        }
      }

    } catch (err) {
      console.error('list.js error:', err);
      await extra.reply('❌ Failed to load commands list.');
    }
  }
};
