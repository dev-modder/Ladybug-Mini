/**
 * AnimeSearch Command - Search for anime info using Jikan API
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'animesearch',
  aliases: ['anime', 'animeinfo', 'asearch'],
  category: 'anime',
  description: 'Search for anime information by title',
  usage: '.animesearch <anime title>',

  async execute(sock, msg, args, extra) {
    try {
      const query = args.join(' ').trim();
      if (!query) return extra.reply('🔍 Please provide an anime title.\n\nUsage: *.animesearch <title>*');

      await extra.reply('🔍 _Searching for anime info..._');

      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      const anime = data.data?.[0];
      if (!anime) return extra.reply(`❌ No results found for: *${query}*`);

      const info =
        `🌸 *Anime Info*\n\n` +
        `📺 *Title:* ${anime.title}\n` +
        `🇯🇵 *Japanese:* ${anime.title_japanese || 'N/A'}\n` +
        `⭐ *Score:* ${anime.score || 'N/A'} / 10\n` +
        `📊 *Rank:* #${anime.rank || 'N/A'}\n` +
        `🎬 *Type:* ${anime.type || 'N/A'}\n` +
        `📅 *Status:* ${anime.status || 'N/A'}\n` +
        `📆 *Aired:* ${anime.aired?.string || 'N/A'}\n` +
        `🎞️ *Episodes:* ${anime.episodes || 'N/A'}\n` +
        `⏱️ *Duration:* ${anime.duration || 'N/A'}\n` +
        `🏷️ *Genres:* ${anime.genres?.map(g => g.name).join(', ') || 'N/A'}\n\n` +
        `📝 *Synopsis:*\n${(anime.synopsis || 'N/A').slice(0, 400)}${anime.synopsis?.length > 400 ? '...' : ''}\n\n` +
        `> 🐞 Data from MyAnimeList`;

      if (anime.images?.jpg?.image_url) {
        const imgRes = await fetch(anime.images.jpg.image_url);
        const imgBuf = Buffer.from(await imgRes.arrayBuffer());
        await sock.sendMessage(extra.from, { image: imgBuf, caption: info }, { quoted: msg });
      } else {
        await extra.reply(info);
      }
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
