/**
 * AFK Command - Set AFK status
 */

const config = require('../../config');

// Store AFK users
const afkUsers = new Map();

module.exports = {
  name: 'afk',
  aliases: ['away', 'off'],
  category: 'general',
  description: 'Set AFK (Away From Keyboard) status',
  usage: '.afk [reason]',
  
  async execute(sock, msg, args, extra) {
    try {
      const userId = extra.sender;
      const reason = args.length > 0 ? args.join(' ') : 'No reason provided';
      const timestamp = Date.now();
      
      // Store AFK status
      afkUsers.set(userId, {
        reason: reason,
        timestamp: timestamp,
        chatId: extra.from
      });
      
      const message = `😴 *AFK MODE ACTIVATED*\n\n` +
                     `👤 User: @${userId.split('@')[0]}\n` +
                     `📝 Reason: ${reason}\n` +
                     `🕐 Time: ${new Date(timestamp).toLocaleString()}\n\n` +
                     `_I'll notify when they come back!_`;
      
      await sock.sendMessage(extra.from, {
        text: message,
        mentions: [userId]
      }, { quoted: msg });
      
      // Export AFK data for message handler
      global.afkUsers = afkUsers;
      
    } catch (error) {
      console.error('AFK command error:', error);
      await extra.reply('❌ Failed to set AFK status. Please try again.');
    }
  }
};

// Export AFK users map for checking in message handler
module.exports.afkUsers = afkUsers;