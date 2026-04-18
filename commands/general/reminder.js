/**
 * Reminder Command - Set a personal reminder (alias wrapper with better UI)
 * Ladybug Bot Mini | by Dev-Ntando
 */

const reminders = new Map();

module.exports = {
  name: 'reminder',
  aliases: ['setreminder', 'remindme'],
  category: 'general',
  description: 'Set a reminder — bot will ping you after the specified time',
  usage: '.reminder <minutes> <message>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args[0] || isNaN(parseInt(args[0]))) {
        return extra.reply(
          '⏰ *Reminder Command*\n\n' +
          'Usage: *.reminder <minutes> <message>*\n\n' +
          'Examples:\n' +
          '  .reminder 5 Check the oven!\n' +
          '  .reminder 30 Reply to that email\n' +
          '  .reminder 60 Take a break\n\n' +
          '_Max: 1440 minutes (24 hours)_'
        );
      }

      const minutes = Math.min(parseInt(args[0]), 1440);
      const message = args.slice(1).join(' ').trim() || 'Your reminder!';
      const ms = minutes * 60 * 1000;
      const sender = extra.sender;
      const from = extra.from;

      await extra.reply(
        `⏰ *Reminder Set!*\n\n` +
        `📝 Message: _${message}_\n` +
        `⏱️ Time: *${minutes} minute${minutes !== 1 ? 's' : ''}*\n\n` +
        `_I'll ping you when time is up!_ ✅`
      );

      setTimeout(async () => {
        try {
          await sock.sendMessage(from, {
            text:
              `⏰ *REMINDER* ⏰\n\n` +
              `👤 @${sender.split('@')[0]}\n\n` +
              `📝 ${message}\n\n` +
              `_Set ${minutes} minute${minutes !== 1 ? 's' : ''} ago._`,
            mentions: [sender],
          });
        } catch (_) {}
      }, ms);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
