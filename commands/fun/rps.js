/**
 * Rock Paper Scissors Command
 * Ladybug Bot V5 | by Dev-Ntando
 */

'use strict';

module.exports = {
  name: 'rps',
  aliases: ['rockpaperscissors', 'rock', 'paper', 'scissors'],
  category: 'fun',
  description: 'Play Rock Paper Scissors against the bot',
  usage: '.rps <rock|paper|scissors>',

  async execute(sock, msg, args, extra) {
    try {
      const choices = ['rock', 'paper', 'scissors'];
      const icons   = { rock: '🪨', paper: '📄', scissors: '✂️' };

      if (!args[0] || !choices.includes(args[0].toLowerCase())) {
        return extra.reply(
          `✂️ *Rock Paper Scissors*\n\n` +
          `Usage: .rps <rock|paper|scissors>\n\n` +
          `Example: .rps rock`
        );
      }

      const player = args[0].toLowerCase();
      const bot    = choices[Math.floor(Math.random() * choices.length)];

      let result;
      if (player === bot) {
        result = "It's a *TIE!* 🤝";
      } else if (
        (player === 'rock'     && bot === 'scissors') ||
        (player === 'paper'    && bot === 'rock')     ||
        (player === 'scissors' && bot === 'paper')
      ) {
        result = '*You WIN!* 🎉';
      } else {
        result = '*Bot WINS!* 🤖';
      }

      await extra.reply(
        `✂️ *Rock Paper Scissors*\n\n` +
        `👤 *You:*  ${icons[player]} ${player.toUpperCase()}\n` +
        `🤖 *Bot:*  ${icons[bot]} ${bot.toUpperCase()}\n\n` +
        `${result}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
