/**
 * Fact Command - Get a random interesting fact
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'fact',
  aliases: ['randomfact', 'funfact', 'rf'],
  category: 'general',
  description: 'Get a random interesting fact',
  usage: '.fact',

  async execute(sock, msg, args, extra) {
    try {
      let fact = null;

      try {
        const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
        if (res.ok) {
          const data = await res.json();
          fact = data.text;
        }
      } catch (_) {}

      if (!fact) {
        const fallbacks = [
          'Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.',
          'A group of flamingos is called a "flamboyance".',
          'Octopuses have three hearts, nine brains, and blue blood.',
          'The shortest war in history was between Britain and Zanzibar in 1896 — it lasted 38 minutes.',
          'Bananas are berries, but strawberries are not.',
          'The human nose can detect over 1 trillion different scents.',
          'A day on Venus is longer than a year on Venus.',
          'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.',
          'Sharks are older than trees — they\'ve existed for about 450 million years.',
          'You can\'t hum while holding your nose closed.',
        ];
        fact = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      await extra.reply(
        `💡 *Random Fact*\n\n` +
        `📖 ${fact}\n\n` +
        `> 🐞 Powered by Ladybug Bot`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
