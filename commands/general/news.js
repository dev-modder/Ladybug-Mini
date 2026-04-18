/**
 * News Command - Get latest headlines from GNews API
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'news',
  aliases: ['headlines', 'latestnews'],
  category: 'general',
  description: 'Get the latest news headlines',
  usage: '.news [topic]',

  async execute(sock, msg, args, extra) {
    try {
      const topic = args.join(' ').trim() || 'world';
      await extra.reply(`📰 _Fetching latest news on "${topic}"..._`);

      const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&max=5&token=demo`);
      const data = await res.json();

      const articles = data.articles || [];
      if (!articles.length) {
        // Fallback to static mock
        return extra.reply(
          `📰 *Latest News — ${topic}*\n\n` +
          `⚠️ Could not fetch live news right now.\n` +
          `Try again in a moment or provide a different topic.\n\n` +
          `Usage: *.news technology*`
        );
      }

      let text = `📰 *Latest News — ${topic}*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      articles.forEach((a, i) => {
        text += `${i + 1}. *${a.title}*\n`;
        text += `   _${a.source?.name || 'Unknown'}_\n`;
        text += `   🔗 ${a.url}\n\n`;
      });
      text += `> 🐞 Powered by Ladybug Bot`;

      await extra.reply(text);
    } catch (error) {
      await extra.reply(`❌ Error fetching news: ${error.message}`);
    }
  },
};
