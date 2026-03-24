/**
 * YouTube Search Command
 * Ladybug Bot V5
 *
 * Usage: .yts <search query>
 * Returns top 5 results. Sends thumbnail of the #1 result.
 */

const yts = require('yt-search');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

function formatViews(views) {
  if (!views || isNaN(views)) return 'N/A';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000)     return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000)         return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
}

module.exports = {
  name: 'yts',
  aliases: ['ytsearch', 'youtubesearch', 'searchyt'],
  category: 'media',
  description: 'Search YouTube for videos',
  usage: '.yts <search query>',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
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

      const results = search.videos.slice(0, 5);
      const top     = results[0];

      const lines = results.map((v, i) => {
        const views = formatViews(v.views);
        const mark  = i === 0 ? '🥇' : `${i + 1}.`;
        return (
          `${mark} *${v.title}*\n` +
          `   👤 ${v.author?.name || 'Unknown'}\n` +
          `   ⏱️ ${v.timestamp || 'N/A'}  •  👁️ ${views}\n` +
          `   🔗 ${v.url}`
        );
      });

      const resultText =
        `🔍 *YouTube: "${query}"*\n` +
        `📋 Top ${results.length} results:\n\n` +
        lines.join('\n\n') +
        `\n\n_Use .song or .video + URL to download_\n${BOT_TAG}`;

      // Send thumbnail of top result + full list
      if (top?.thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: top.thumbnail },
          caption: resultText
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: resultText }, { quoted: msg });
      }

    } catch (error) {
      console.error('[yts] Error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ An error occurred while searching YouTube. Please try again.'
      }, { quoted: msg });
    }
  }
};
