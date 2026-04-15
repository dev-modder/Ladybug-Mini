/**
 * Coinflip Command - Flip a coin (or multiple coins)
 * Ladybug Bot V5 | by Dev-Ntando
 */

'use strict';

module.exports = {
  name: 'coinflip',
  aliases: ['coin', 'flip', 'toss'],
  category: 'fun',
  description: 'Flip a coin. Optionally flip multiple coins.',
  usage: '.coinflip [number 1-10]',

  async execute(sock, msg, args, extra) {
    try {
      let count = 1;

      if (args[0]) {
        const n = parseInt(args[0], 10);
        if (isNaN(n) || n < 1 || n > 10) {
          return extra.reply('❌ Please provide a number between 1 and 10.\nExample: .coinflip 5');
        }
        count = n;
      }

      if (count === 1) {
        const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
        const icon   = result === 'HEADS' ? '🪙' : '🌑';
        return extra.reply(
          `🪙 *Coin Flip*\n\n` +
          `${icon} *${result}!*`
        );
      }

      const results = [];
      let heads = 0;
      let tails = 0;

      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.5) {
          results.push('H');
          heads++;
        } else {
          results.push('T');
          tails++;
        }
      }

      const display = results.map(r => r === 'H' ? '🪙 H' : '🌑 T').join('  ');

      await extra.reply(
        `🪙 *Coin Flip × ${count}*\n\n` +
        `${display}\n\n` +
        `📊 *Results:* ${heads} Heads, ${tails} Tails`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
