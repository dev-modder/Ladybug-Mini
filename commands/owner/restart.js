/**
 * Restart Command - Restart the bot process (owner only)
 * Ladybug V5
 *
 * Sends a confirmation message then exits the process.
 * Your process manager (PM2, nodemon, systemd) must restart it automatically.
 */

module.exports = {
  name: 'restart',
  aliases: ['reboot', 'reloadbot'],
  category: 'owner',
  description: 'Restart the bot process',
  usage: '.restart',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      await extra.reply(
        `🔄 *Restarting Ladybug V5...*\n\n` +
        `The bot will be back online in a few seconds.\n` +
        `Make sure PM2 or your process manager is running!`
      );

      // Give the message a moment to send before exiting
      setTimeout(() => {
        console.log('[restart] Restart triggered by owner.');
        process.exit(0);
      }, 1500);

    } catch (error) {
      console.error('[restart] Error:', error);
      await extra.reply(`❌ Failed to restart: ${error.message}`);
    }
  },
};
