/**
 * Roulette Command - Russian roulette game
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'roulette',
  aliases: ['russianroulette', 'rr'],
  category: 'fun',
  description: 'Play Russian roulette — spin the chamber and pull the trigger!',
  usage: '.roulette',

  async execute(sock, msg, args, extra) {
    try {
      const chambers = 6;
      const bullet = Math.floor(Math.random() * chambers) + 1;
      const shot = Math.floor(Math.random() * chambers) + 1;
      const survived = bullet !== shot;

      if (survived) {
        await extra.reply(
          `🔫 *Russian Roulette*\n\n` +
          `🎰 Spinning the chamber...\n` +
          `💥 *CLICK!*\n\n` +
          `😅 *You survived!* Lucky you...\n` +
          `The bullet was in chamber *${bullet}*, you fired chamber *${shot}*.\n\n` +
          `_Life goes on... for now. 😏_`
        );
      } else {
        await extra.reply(
          `🔫 *Russian Roulette*\n\n` +
          `🎰 Spinning the chamber...\n` +
          `💥 *BANG!*\n\n` +
          `💀 *You're dead!* The bullet was in chamber *${bullet}* and you fired it!\n\n` +
          `_Better luck in your next life. 😂_`
        );
      }
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
