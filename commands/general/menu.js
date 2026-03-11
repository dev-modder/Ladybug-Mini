const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs = require('fs');
const path = require('path');

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

      // Group commands by category
      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          if (!categories[cmd.category]) {
            categories[cmd.category] = [];
          }
          categories[cmd.category].push(cmd);
        }
      });

      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || config.ownerName || 'Bot Owner';

      // Branding header
      let menuText = `╭━━━『 *${config.botName}* 』━━━╮\n`;
      menuText += `┃ ⚡ Version: 1.0.0\n`;
      menuText += `┃ 👑 Owner: ${displayOwner}\n`;
      menuText += `┃ 📦 Commands: ${commands.size}\n`;
      menuText += `┃ 🔑 Prefix: ${config.prefix}\n`;
      menuText += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      menuText += `👋 Hello @${extra.sender.split('@')[0]}!\n\n`;

      // Category labels
      const categoryLabels = {
        general: "🧭 GENERAL COMMANDS",
        ai: "🤖 AI COMMANDS",
        group: "🔵 GROUP COMMANDS",
        admin: "🛡️ ADMIN COMMANDS",
        owner: "👑 OWNER COMMANDS",
        media: "🎞️ MEDIA COMMANDS",
        fun: "🎭 FUN COMMANDS",
        utility: "🔧 UTILITY COMMANDS",
        anime: "👾 ANIME COMMANDS",
        textmaker: "🖋️ TEXTMAKER COMMANDS"
      };

      // Dynamic loop for categories
      for (const [cat, label] of Object.entries(categoryLabels)) {
        if (categories[cat]) {
          menuText += `┏━━━━━━━━━━━━━━━━━\n`;
          menuText += `┃ ${label} (${categories[cat].length})\n`;
          menuText += `┗━━━━━━━━━━━━━━━━━\n`;
          categories[cat].forEach(cmd => {
            menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
          });
          menuText += `\n`;
        }
      }

      // Footer branding
      menuText += `╰━━━━━━━━━━━━━━━━━\n`;
      menuText += `💡 Type ${config.prefix}help <command> for details\n`;
      menuText += `🌐 Powered by LadybugInc.Zone.ID\n`;

      // Send menu with image if available
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        await sock.sendMessage(extra.from, {
          image: imageBuffer,
          caption: menuText,
          mentions: [extra.sender],
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: config.newsletterJid || '120363161513685998@newsletter',
              newsletterName: config.botName,
              serverMessageId: -1
            }
          }
        }, { quoted: msg });
      } else {
        await sock.sendMessage(extra.from, {
          text: menuText,
          mentions: [extra.sender]
        }, { quoted: msg });
      }

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
