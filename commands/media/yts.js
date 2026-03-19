/**
 * YouTube Search Command
 * Ladybug Bot Mini V2
 *
 * Usage: .yts <search query>
 * Returns top 5 YouTube video results with title, duration, views, and URL.
 */

const yts = require('yt-search');

module.exports = {
  name: 'yts',
  aliases: ['ytsearch', 'youtubesearch', 'searchyt'],
  category: 'media',
  description: 'Search YouTube for videos',
  usage: '.yts <search query>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;
      const query = args.join(' ').trim();

      if (!query) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide a search query.\n\nExample: .yts Shape of You Ed Sheeran'
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '🔍', key: msg.key } });

      const search = await yts(query);

      if (!search?.videos?.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ No results found for: *${query}*\n\nTry a different search term.`
        }, { quoted: msg });
      }

      // Show top 5 results
      const results = search.videos.slice(0, 5);

      const lines = results.map((v, i) => {
        const views = formatViews(v.views);
        return (
          `*${i + 1}. ${v.title}*\n` +
          `   👤 ${v.author?.name || 'Unknown'}\n` +
          `   ⏱️ ${v.timestamp || 'N/A'}  •  👁️ ${views}\n` +
          `   🔗 ${v.url}`
        );
      });

      const resultText =
        `🔍 *YouTube Search: "${query}"*\n` +
        `📋 Top ${results.length} results:\n\n` +
        lines.join('\n\n') +
        `\n\n_🐞 Ladybug Bot Mini V2_\n` +
        `_Use .song or .video + URL to download_`;

      await sock.sendMessage(chatId, { text: resultText }, { quoted: msg });

    } catch (error) {
      console.error('[yts] Command error:', error);
      const chatId = extra?.from || msg.key.remoteJid;
      await sock.sendMessage(chatId, {
        text: '❌ An error occurred while searching YouTube. Please try again later.'
      }, { quoted: msg });
    }
  }
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatViews(views) {
  if (!views || isNaN(views)) return 'N/A';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000)     return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000)         return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
}
