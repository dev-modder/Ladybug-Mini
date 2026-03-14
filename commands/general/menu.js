/**
 * Menu Command - Display all available commands
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
      
      // Group commands by category
      commands.forEach((cmd, name) => {
        if (cmd.name === name) { // Only count main command names, not aliases
          if (!categories[cmd.category]) {
            categories[cmd.category] = [];
          }
          categories[cmd.category].push(cmd);
        }
      });
      
      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || config.ownerName || 'Bot Owner';
      
      let menuText = `╭▰▱▰▱彡「*${config.botName}* 」彡▰▱▰▱\n\n`;
      menuText += `👋│ Hello @${extra.sender.split('@')[0]}!\n\n`;
      menuText += `⚡│ Prefix: ${config.prefix}\n`;
      menuText += `📦│ Total Commands: ${commands.size}\n`;
      menuText += `👑│ Owner: ${displayOwner}\n\n`;
      menuText += `👑│ Host: Ladybug-Hos✨t\n\n`;
      
      // General Commands
      if (categories.general) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 🧭 GENERAL COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.general.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // AI Commands
      if (categories.ai) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 🤖 AI COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.ai.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Group Commands
      if (categories.group) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 🔵 GROUP COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.group.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Admin Commands
      if (categories.admin) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 🛡️ ADMIN COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.admin.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Owner Commands
      if (categories.owner) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 👑 OWNER COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.owner.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Media Commands
      if (categories.media) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 🎞️ MEDIA COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.media.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Fun Commands
      if (categories.fun) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 🎭 FUN COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.fun.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Utility Commands
      if (categories.utility) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 🔧 UTILITY COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.utility.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }

       // Anime Commands
       if (categories.anime) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        menuText += `│ 👾 ANIME COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.anime.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }

       // Textmaker Commands
       if (categories.utility) {
        menuText += `╭▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰彡\n`;
        menuText += `│ 🖋️ TEXTMAKER COMMAND\n`;
        menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n`;
        categories.textmaker.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      menuText += `╰▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱▰▱彡\n\n`;
      menuText += `💡 Type ${config.prefix}help <command> for more info\n`;
      menuText += `🌟 Dev : Mr Ntando Ofc\n`;
      menuText += `🟢 made with 💙 by Mr Ntando Ofc\n`;
      
      // Send menu with image
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      
      if (fs.existsSync(imagePath)) {
        // Send image with newsletter forwarding context
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
