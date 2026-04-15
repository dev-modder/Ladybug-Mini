/**
 * Dice Command - Roll one or more dice with custom sides
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Usage:
 *   .dice          → roll 1d6
 *   .dice 3        → roll 3d6
 *   .dice 2d20     → roll 2 twenty-sided dice
 *   .dice 1d100    → roll percentile
 */

'use strict';

module.exports = {
  name: 'dice',
  aliases: ['roll', 'rolldice', 'd6', 'diceroll'],
  category: 'general',
  description: 'Roll one or more dice. Supports NdS notation (e.g. 2d20)',
  usage: '.dice [NdS | count]',

  async execute(sock, msg, args, extra) {
    try {
      let count = 1;
      let sides = 6;

      if (args[0]) {
        const input = args[0].toLowerCase();

        // NdS notation
        if (input.includes('d')) {
          const parts = input.split('d');
          const n = parseInt(parts[0], 10) || 1;
          const s = parseInt(parts[1], 10) || 6;

          if (n < 1 || n > 20)  return extra.reply('❌ Number of dice must be 1–20.');
          if (s < 2 || s > 1000) return extra.reply('❌ Number of sides must be 2–1000.');

          count = n;
          sides = s;
        } else {
          const n = parseInt(input, 10);
          if (isNaN(n) || n < 1 || n > 20) {
            return extra.reply('❌ Please provide a number 1–20, or use NdS notation (e.g. 2d20).');
          }
          count = n;
        }
      }

      const rolls = [];
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }

      const total = rolls.reduce((a, b) => a + b, 0);

      let text = `🎲 *Dice Roll* (${count}d${sides})\n\n`;

      if (count === 1) {
        text += `Result: *${rolls[0]}*`;
      } else {
        text += `Rolls: ${rolls.map(r => `[${r}]`).join(' ')}\n`;
        text += `Total: *${total}*`;
        if (total === count * sides) text += ' 🔥 *(Max roll!)*';
        if (total === count)          text += ' 😬 *(Min roll!)*';
      }

      await extra.reply(text);

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
