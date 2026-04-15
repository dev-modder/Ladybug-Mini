/**
 * Hangman Game Command
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Start: .hangman start [category]
 * Guess: .hangman <letter or full word>
 * Hint:  .hangman hint
 * Stop:  .hangman stop
 */

'use strict';

const WORDS = {
  animals:    ['elephant','dolphin','tiger','giraffe','penguin','crocodile','kangaroo','cheetah','gorilla','flamingo'],
  countries:  ['zimbabwe','australia','germany','argentina','indonesia','mozambique','portugal','malaysia','ethiopia','colombia'],
  food:       ['spaghetti','hamburger','avocado','cinnamon','chocolate','strawberry','pineapple','mushroom','blueberry','pancake'],
  tech:       ['javascript','algorithm','database','bluetooth','framework','interface','encryption','keyboard','processor','software'],
  sports:     ['basketball','volleyball','swimming','gymnastics','wrestling','skateboard','badminton','marathon','snowboard','baseball'],
  general:    ['adventure','beautiful','calendar','discover','elephant','fantastic','generous','happiness','important','jealousy'],
};

const STAGES = [
  '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```',
];

// Active games per chat: jid → { word, hint, guessed, wrong, category, misses }
const activeGames = new Map();

function buildDisplay(word, guessed) {
  return word.split('').map(c => c === ' ' ? '  ' : (guessed.has(c) ? c : '_')).join(' ');
}

module.exports = {
  name: 'hangman',
  aliases: ['hman', 'wordgame'],
  category: 'fun',
  description: 'Play Hangman! Guess the word letter by letter.',
  usage: '.hangman start [category] | .hangman <letter> | .hangman hint | .hangman stop',

  async execute(sock, msg, args, extra) {
    try {
      const jid = extra.from;
      const sub = (args[0] || '').toLowerCase();

      // ── Start ─────────────────────────────────────────────
      if (sub === 'start' || sub === 'new') {
        const cat  = args[1] ? args[1].toLowerCase() : 'general';
        const pool = WORDS[cat] || WORDS.general;
        const word = pool[Math.floor(Math.random() * pool.length)];

        activeGames.set(jid, {
          word,
          category: cat in WORDS ? cat : 'general',
          guessed:  new Set(),
          wrong:    new Set(),
          misses:   0,
        });

        const display = buildDisplay(word, new Set());
        return extra.reply(
          `🎮 *Hangman Started!*\n` +
          `Category: *${cat in WORDS ? cat : 'general'}*\n\n` +
          `${STAGES[0]}\n\n` +
          `Word: \`${display}\`\n` +
          `Letters (${word.replace(/ /g, '').length})\n\n` +
          `_Type_ *.hangman <letter>* _to guess!\n_ *.hangman hint* _for a clue.\n_ *.hangman stop* _to quit._\n\n` +
          `Categories: ${Object.keys(WORDS).join(', ')}`
        );
      }

      // ── Hint ──────────────────────────────────────────────
      if (sub === 'hint') {
        const game = activeGames.get(jid);
        if (!game) return extra.reply('❌ No game running! Start with .hangman start');
        // Reveal a random unguessed letter
        const unguessed = [...game.word.replace(/ /g, '')].filter(c => !game.guessed.has(c));
        if (!unguessed.length) return extra.reply('✅ All letters already revealed!');
        const hint = unguessed[Math.floor(Math.random() * unguessed.length)];
        game.guessed.add(hint);
        game.misses++; // Using a hint costs a miss
        activeGames.set(jid, game);

        const display = buildDisplay(game.word, game.guessed);
        const won = game.word.split('').every(c => c === ' ' || game.guessed.has(c));

        if (won) {
          activeGames.delete(jid);
          return extra.reply(`💡 Hint used. The letter was *${hint}*\n\n✅ *You completed the word: ${game.word}!*`);
        }

        return extra.reply(
          `💡 *Hint:* The letter *${hint.toUpperCase()}* is in the word!\n\n` +
          `${STAGES[Math.min(game.misses, 6)]}\n\n` +
          `Word: \`${display}\`\n` +
          `Wrong: ${[...game.wrong].join(' ') || 'none'} | Misses: ${game.misses}/6`
        );
      }

      // ── Stop ──────────────────────────────────────────────
      if (sub === 'stop' || sub === 'quit' || sub === 'end') {
        if (!activeGames.has(jid)) return extra.reply('❌ No game running!');
        const game = activeGames.get(jid);
        activeGames.delete(jid);
        return extra.reply(`🛑 Game stopped! The word was *${game.word}*.`);
      }

      // ── List categories ───────────────────────────────────
      if (sub === 'categories' || sub === 'cats') {
        return extra.reply(`📂 *Available categories:*\n${Object.keys(WORDS).join(', ')}\n\nUsage: .hangman start animals`);
      }

      // ── No args with no game ───────────────────────────────
      if (!activeGames.has(jid)) {
        return extra.reply(
          `🎮 *Hangman*\n\n` +
          `• *.hangman start* — start game\n` +
          `• *.hangman start animals* — specific category\n` +
          `• *.hangman <letter>* — guess a letter\n` +
          `• *.hangman hint* — get a hint (costs a life)\n` +
          `• *.hangman stop* — end game\n\n` +
          `Categories: ${Object.keys(WORDS).join(', ')}`
        );
      }

      // ── Make a guess ──────────────────────────────────────
      const game = activeGames.get(jid);
      let guess = sub;

      if (!guess || !/^[a-z]+$/.test(guess)) {
        return extra.reply('❌ Please guess a single letter or the full word. (letters only)');
      }

      // Full word guess
      if (guess.length > 1) {
        if (guess === game.word) {
          activeGames.delete(jid);
          return extra.reply(`🎉 *Correct! You guessed the word: ${game.word}!*`);
        }
        game.misses++;
        if (game.misses >= 6) {
          activeGames.delete(jid);
          return extra.reply(
            `❌ *Wrong word guess!*\n\n${STAGES[6]}\n\n` +
            `💀 *Game Over! The word was: ${game.word}*`
          );
        }
        activeGames.set(jid, game);
        return extra.reply(
          `❌ *Wrong!* "${guess}" is not the word.\n\n` +
          `${STAGES[game.misses]}\n` +
          `Misses: ${game.misses}/6`
        );
      }

      // Single letter guess
      const letter = guess;

      if (game.guessed.has(letter) || game.wrong.has(letter)) {
        return extra.reply(`⚠️ You already guessed *${letter.toUpperCase()}*!`);
      }

      if (game.word.includes(letter)) {
        game.guessed.add(letter);
      } else {
        game.wrong.add(letter);
        game.misses++;
      }

      activeGames.set(jid, game);
      const display = buildDisplay(game.word, game.guessed);
      const won     = game.word.split('').every(c => c === ' ' || game.guessed.has(c));

      if (won) {
        activeGames.delete(jid);
        return extra.reply(
          `🎉 *You guessed it!*\n\n` +
          `✅ The word was: *${game.word}*\n` +
          `Wrong guesses: ${game.misses}`
        );
      }

      if (game.misses >= 6) {
        activeGames.delete(jid);
        return extra.reply(
          `${STAGES[6]}\n\n` +
          `💀 *Game Over! The word was: ${game.word}*`
        );
      }

      const correct = game.word.includes(letter);
      await extra.reply(
        `${correct ? '✅ Good guess!' : `❌ *${letter.toUpperCase()}* is not in the word!`}\n\n` +
        `${STAGES[game.misses]}\n\n` +
        `Word: \`${display}\`\n` +
        `Wrong: ${[...game.wrong].join(' ') || 'none'} | Misses: ${game.misses}/6`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
