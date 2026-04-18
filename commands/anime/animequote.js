/**
 * AnimeQuote Command - Get a random anime quote
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'animequote',
  aliases: ['aquote', 'aq'],
  category: 'anime',
  description: 'Get a random famous anime quote',
  usage: '.animequote',

  async execute(sock, msg, args, extra) {
    try {
      const quotes = [
        { quote: 'Whatever you lose, you'll find it again. But what you throw away you'll never get back.', character: 'Kenshin Himura', anime: 'Rurouni Kenshin' },
        { quote: 'I want to be the very best, like no one ever was.', character: 'Ash Ketchum', anime: 'Pokémon' },
        { quote: 'Believing in yourself is your magic.', character: 'Fairy Tail', anime: 'Fairy Tail' },
        { quote: 'If you don\'t take risks, you can\'t create a future.', character: 'Monkey D. Luffy', anime: 'One Piece' },
        { quote: 'A lesson without pain is meaningless. That\'s because no one can gain without sacrificing something.', character: 'Edward Elric', anime: 'Fullmetal Alchemist' },
        { quote: 'People\'s lives don\'t end when they die. It ends when they lose faith.', character: 'Itachi Uchiha', anime: 'Naruto' },
        { quote: 'The world isn\'t perfect. But it\'s there for us, doing the best it can.', character: 'Roy Mustang', anime: 'Fullmetal Alchemist' },
        { quote: 'Hard work is worthless for those that don\'t believe in themselves.', character: 'Naruto Uzumaki', anime: 'Naruto' },
        { quote: 'Fear is not evil. It tells you what your weakness is.', character: 'Gildarts Clive', anime: 'Fairy Tail' },
        { quote: 'No matter how hard or impossible it is, never lose sight of your goal.', character: 'Monkey D. Luffy', anime: 'One Piece' },
        { quote: 'If you can\'t find a reason to fight, then you shouldn\'t be fighting.', character: 'Akame', anime: 'Akame ga Kill' },
        { quote: 'The only ones who should kill are those who are prepared to be killed.', character: 'Lelouch Lamperouge', anime: 'Code Geass' },
        { quote: 'Even if I\'m worthless and carry demon blood... I just... don\'t want to lose to him!', character: 'Inuyasha', anime: 'Inuyasha' },
        { quote: 'Do not go gentle into that good night. Rage, rage against the dying of the light.', character: 'Guts', anime: 'Berserk' },
        { quote: 'I\'ll never give up, never go back on my word — that is my nindo, my ninja way!', character: 'Naruto Uzumaki', anime: 'Naruto' },
      ];

      const q = quotes[Math.floor(Math.random() * quotes.length)];

      await extra.reply(
        `🌸 *Anime Quote*\n\n` +
        `❝ _${q.quote}_ ❞\n\n` +
        `— *${q.character}*\n` +
        `📺 _${q.anime}_`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
