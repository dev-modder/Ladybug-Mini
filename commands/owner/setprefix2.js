/**
 * GlobalPrefix Command - Set global prefix for all chats
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');
const database = require('../../database');

module.exports = {
  name: 'globalprefix',
  aliases: ['gprefix', 'setglobalprefix'],
  category: 'owner',
  description: 'Set a custom prefix for all chats globally',
  usage: '.globalprefix <prefix>',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const newPrefix = args[0];

      if (!newPrefix) {
        const current = database.get('globalPrefix') || config.prefix || '.';
        return extra.reply(
          `⌨️ *Global Prefix Settings*\n\n` +
          `Current prefix: *${current}*\n\n` +
          `Usage: *.globalprefix <new prefix>*\n` +
          `Example: *.globalprefix !*\n\n` +
          `_Note: This changes the prefix for ALL chats._`
        );
      }

      if (newPrefix.length > 3) {
        return extra.reply('❌ Prefix must be 1-3 characters long.');
      }

      database.set('globalPrefix', newPrefix);
      await extra.reply(
        `✅ *Global prefix updated!*\n\n` +
        `⌨️ New prefix: *${newPrefix}*\n\n` +
        `_All commands now use: *${newPrefix}menu*, *${newPrefix}ping*, etc._\n\n` +
        `⚠️ Restart the bot to fully apply this change.`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
