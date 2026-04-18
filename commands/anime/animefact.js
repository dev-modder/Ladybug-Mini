/**
 * AnimeFact Command - Get a random anime fact
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'animefact',
  aliases: ['afact', 'af'],
  category: 'anime',
  description: 'Get a random interesting anime fact',
  usage: '.animefact',

  async execute(sock, msg, args, extra) {
    try {
      const facts = [
        'Dragon Ball Z\'s Goku was based on the classic Chinese character Sun Wukong (the Monkey King).',
        'One Piece has been running for over 25 years and is the best-selling manga of all time with over 500 million copies.',
        'The word "anime" is simply the Japanese pronunciation of the English word "animation".',
        'Naruto\'s creator, Masashi Kishimoto, named the character after a Japanese fish cake topping called narutomaki.',
        'Attack on Titan was rejected by publishers multiple times before finally getting serialized.',
        'Fullmetal Alchemist: Brotherhood is often ranked as the #1 anime of all time on MyAnimeList.',
        'The iconic Pokémon Pikachu was originally going to be a tiger-like creature.',
        'The Studio Ghibli museum in Japan has a life-size Catbus room that only children are allowed to enter.',
        'My Hero Academia\'s author, Kohei Horikoshi, was inspired by Marvel and DC comics to create his series.',
        'Sailor Moon helped launch the magical girl genre and is one of the most influential anime globally.',
        'The longest-running anime is Sazae-san, which has aired since 1969 in Japan.',
        'Demon Slayer: Mugen Train became the highest-grossing anime film of all time at its release.',
        'The word "otaku" in Japan originally had a negative meaning, referring to people with obsessive hobbies.',
        'Death Note\'s creators wanted the original ending to be different — Light was meant to survive.',
        'The "Naruto run" (running with arms behind) became a viral internet trend in 2019.',
      ];

      const fact = facts[Math.floor(Math.random() * facts.length)];

      await extra.reply(
        `🌸 *Anime Fact*\n\n` +
        `💡 ${fact}\n\n` +
        `> 🐞 Powered by Ladybug Bot`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
