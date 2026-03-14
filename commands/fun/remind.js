/**
 * Reminder Command - Set reminders
 */

const config = require('../../config');

// Store active reminders
const reminders = new Map();

module.exports = {
  name: 'remind',
  aliases: ['reminder', 'remindme', 'timer'],
  category: 'utility',
  description: 'Set a reminder',
  usage: '.remind <time> <message>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length < 2) {
        return extra.reply('❌ Please provide time and message!\n\n' +
          'Usage: .remind <time> <message>\n\n' +
          'Time formats:\n' +
          '• 10s = 10 seconds\n' +
          '• 5m = 5 minutes\n' +
          '• 2h = 2 hours\n' +
          '• 1d = 1 day\n\n' +
          'Examples:\n' +
          '• .remind 30m Check the oven\n' +
          '• .remind 2h Meeting with team\n' +
          '• .remind 1d Birthday reminder');
      }
      
      const timeStr = args[0].toLowerCase();
      const message = args.slice(1).join(' ');
      
      // Parse time
      const timeMatch = timeStr.match(/^(\d+)(s|m|h|d)$/);
      
      if (!timeMatch) {
        return extra.reply('❌ Invalid time format!\n\n' +
          'Use:\n' +
          '• s = seconds\n' +
          '• m = minutes\n' +
          '• h = hours\n' +
          '• d = days\n\n' +
          'Example: .remind 30m Check the oven');
      }
      
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2];
      
      let ms;
      let unitName;
      
      switch (unit) {
        case 's':
          ms = value * 1000;
          unitName = value === 1 ? 'second' : 'seconds';
          break;
        case 'm':
          ms = value * 60 * 1000;
          unitName = value === 1 ? 'minute' : 'minutes';
          break;
        case 'h':
          ms = value * 60 * 60 * 1000;
          unitName = value === 1 ? 'hour' : 'hours';
          break;
        case 'd':
          ms = value * 24 * 60 * 60 * 1000;
          unitName = value === 1 ? 'day' : 'days';
          break;
      }
      
      // Max reminder time: 7 days
      const maxTime = 7 * 24 * 60 * 60 * 1000;
      
      if (ms > maxTime) {
        return extra.reply('❌ Reminder time cannot exceed 7 days.');
      }
      
      // Min reminder time: 10 seconds
      if (ms < 10000) {
        return extra.reply('❌ Minimum reminder time is 10 seconds.');
      }
      
      const reminderId = Date.now().toString();
      const reminderTime = new Date(Date.now() + ms);
      
      // Store reminder
      reminders.set(reminderId, {
        chatId: extra.from,
        userId: extra.sender,
        message: message,
        time: reminderTime
      });
      
      // Set the timeout
      setTimeout(async () => {
        try {
          await sock.sendMessage(extra.from, {
            text: `⏰ *REMINDER*\n\n` +
                  `📝 ${message}\n\n` +
                  `@${extra.sender.split('@')[0]} You asked me to remind you!`,
            mentions: [extra.sender]
          });
          
          reminders.delete(reminderId);
        } catch (e) {
          console.error('Reminder error:', e);
        }
      }, ms);
      
      await extra.reply(`✅ *Reminder Set!*\n\n` +
        `📝 Message: ${message}\n` +
        `⏱️ Time: ${value} ${unitName}\n` +
        `🕐 Reminder at: ${reminderTime.toLocaleString()}\n\n` +
        `_I'll remind you when the time comes!_`);
      
    } catch (error) {
      console.error('Remind command error:', error);
      await extra.reply('❌ Failed to set reminder. Please try again.');
    }
  }
};