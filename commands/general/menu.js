/**
 * Menu Command - Galaxy Pulse Design (Design 08)
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  category: 'general',
  description: 'Show all available commands',
  usage: '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const commands = loadCommands();
      const categories = {};

      // Group commands by category (skip aliases)
      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          if (!categories[cmd.category]) {
            categories[cmd.category] = [];
          }
          categories[cmd.category].push(cmd);
        }
      });

      const ownerNames = Array.isArray(config.ownerName)
        ? config.ownerName
        : [config.ownerName];
      const displayOwner = ownerNames[0] || config.ownerName || 'Bot Owner';

      // ─────────────────────────────────────────
      //  GALAXY PULSE — section builder
      // ─────────────────────────────────────────
      const buildSection = (label, key) => {
        if (!categories[key] || categories[key].length === 0) return '';

        const cmds = categories[key].map(cmd => `${config.prefix}${cmd.name}`);

        // Pair commands into rows of 2
        const rows = [];
        for (let i = 0; i < cmds.length; i += 2) {
          const left  = cmds[i].padEnd(20);
          const right = cmds[i + 1] ? cmds[i + 1] : '';
          rows.push(`*-*  ${left}${right}`);
        }

        let section = `\n*-*-*-*-*-*-*-*-*-*-*-*\n`;
        section    += ` ◇  "${label}"\n`;
        section    += `*-*-*-*-*-*-*-*-*-*-*-*\n`;
        rows.forEach(row => {
          section += `${row}\n`;
        });
        return section;
      };

      // ─────────────────────────────────────────
      //  HEADER
      // ─────────────────────────────────────────
      let menuText = ``;
      menuText += `*-*-*-*-*-*-*-*-*-*-*-*\n`;
      menuText += `    * ${config.botName} *\n`;
      menuText += `*-*-*-*-*-*-*-*-*-*-*-*\n\n`;
      menuText += ` Hello @${extra.sender.split('@')[0]}\n\n`;
      menuText += ` Prefix  : ${config.prefix}\n`;
      menuText += ` Commands: ${commands.size}\n`;
      menuText += ` Host    : ${displayOwner}\n`;

      // ─────────────────────────────────────────
      //  SECTIONS
      // ─────────────────────────────────────────
      menuText += buildSection('GENERAL',   'general');
      menuText += buildSection('AI',        'ai');
      menuText += buildSection('GROUP',     'group');
      menuText += buildSection('ADMIN',     'admin');
      menuText += buildSection('OWNER',     'owner');
      menuText += buildSection('MEDIA',     'media');
      menuText += buildSection('FUN',       'fun');
      menuText += buildSection('UTILITY',   'utility');
      menuText += buildSection('ANIME',     'anime');
      menuText += buildSection('TEXTMAKER', 'textmaker');

      // ─────────────────────────────────────────
      //  FOOTER
      // ─────────────────────────────────────────
      menuText += `\n*-*-*-*-*-*-*-*-*-*-*-*\n`;
      menuText += ` ${config.prefix}help [cmd] for details\n`;
      menuText += ` Made in Zimbabwe\n`;
      menuText += `*-*-*-*-*-*-*-*-*-*-*-*`;

      // ─────────────────────────────────────────
      //  SEND (image if exists, else text)
      // ─────────────────────────────────────────
      const fs   = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');

      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);

        await sock.sendMessage(
          extra.from,
          {
            image: imageBuffer,
            caption: menuText,
            mentions: [extra.sender],
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid:   config.newsletterJid || '120363161513685998@newsletter',
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
          {
            text:     menuText,
            mentions: [extra.sender],
          },
          { quoted: msg }
        );
      }

    } catch (error) {
      await extra.reply(`Error: ${error.message}`);
    }
  },
};
