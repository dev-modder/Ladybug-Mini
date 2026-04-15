/**
 * Number Guess Game Command
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Start: .guess start [max]
 * Guess: .guess <number>
 * Stop:  .guess stop
 */

'use strict';

// Map of active games: jid → { target, attempts, max }
const activeGames = new Map();

module.exports = {
  name: 'guess',
  aliases: ['numguess', 'numberguess', 'guessnum'],
  category: 'fun',
  description: 'Play a number guessing game',
  usage: '.guess start [max] | .guess <number> | .guess stop',

  async execute(sock, msg, args, extra) {
    try {
      const jid = extra.from;
      const sub = (args[0] || '').toLowerCase();

      // ── Start ─────────────────────────────────────────────
      if (sub === 'start' || sub === 'new') {
        let max = 100;
        if (args[1]) {
          const n = parseInt(args[1], 10);
          if (!isNaN(n) && n >= 10 && n <= 1000) max = n;
        }
        const target = Math.floor(Math.random() * max) + 1;
        activeGames.set(jid, { target, attempts: 0, max });
        return extra.reply(
          `🎮 *Number Guess Game Started!*\n\n` +
          `I'm thinking of a number between *1* and *${max}*.\n` +
          `Type *.guess <number>* to make a guess!\n\n` +
          `_Type_ *.guess stop* _to end the game._`
        );
      }

      // ── Stop ──────────────────────────────────────────────
      if (sub === 'stop' || sub === 'quit' || sub === 'end') {
        if (!activeGames.has(jid)) {
          return extra.reply('❌ No game running. Start one with .guess start');
        }
        const game = activeGames.get(jid);
        activeGames.delete(jid);
        return extra.reply(`🛑 Game stopped! The number was *${game.target}*.`);
      }

      // ── Handle plain .guess (no args) ─────────────────────
      if (!args[0]) {
        if (activeGames.has(jid)) {
          const g = activeGames.get(jid);
          return extra.reply(`🎮 Game in progress (1–${g.max}). Type .guess <number> to guess!`);
        }
        return extra.reply(
          `🎮 *Number Guess Game*\n\n` +
          `• *.guess start* — start with range 1–100\n` +
          `• *.guess start 50* — custom range 1–50\n` +
          `• *.guess <number>* — make a guess\n` +
          `• *.guess stop* — end the game`
        );
      }

      // ── Make a guess ──────────────────────────────────────
      if (!activeGames.has(jid)) {
        return extra.reply('❌ No game running! Start one with .guess start');
      }

      const n = parseInt(args[0], 10);
      if (isNaN(n)) {
        return extra.reply('❌ That\'s not a valid number!');
      }

      const game = activeGames.get(jid);
      game.attempts++;

      if (n < 1 || n > game.max) {
        return extra.reply(`⚠️ Please guess between 1 and ${game.max}.`);
      }

      if (n === game.target) {
        activeGames.delete(jid);
        const rating =
          game.attempts <= 5  ? '🏆 Amazing! Perfect score!' :
          game.attempts <= 10 ? '⭐ Great job!'              :
          game.attempts <= 20 ? '👍 Not bad!'               :
                                 '😅 You got there!';
        return extra.reply(
          `🎉 *Correct! The number was ${game.target}!*\n\n` +
          `You guessed it in *${game.attempts} attempt${game.attempts > 1 ? 's' : ''}*.\n${rating}`
        );
      }

      const hint = n < game.target ? '📈 Too low! Go higher.' : '📉 Too high! Go lower.';
      await extra.reply(`${hint}\n\n_Attempts so far: ${game.attempts}_`);

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
