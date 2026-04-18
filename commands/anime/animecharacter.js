/**
 * AnimeCharacter Command - Search for an anime character
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'animecharacter',
  aliases: ['character', 'achar', 'charinfo'],
  category: 'anime',
  description: 'Search for info on an anime character',
  usage: '.animecharacter <character name>',

  async execute(sock, msg, args, extra) {
    try {
      const query = args.join(' ').trim();
      if (!query) return extra.reply('🔍 Please provide a character name.\n\nUsage: *.animecharacter <name>*');

      await extra.reply('🔍 _Searching character info..._');

      const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      const char = data.data?.[0];
      if (!char) return extra.reply(`❌ No character found for: *${query}*`);

      const animeList = char.anime?.slice(0, 3).map(a => a.anime?.title).filter(Boolean).join(', ') || 'N/A';
      const mangaList = char.manga?.slice(0, 3).map(m => m.manga?.title).filter(Boolean).join(', ') || 'N/A';
      const nicknames = char.nicknames?.slice(0, 3).join(', ') || 'None';
      const about = char.about ? char.about.slice(0, 300) + (char.about.length > 300 ? '...' : '') : 'N/A';

      const info =
        `🌸 *Anime Character Info*\n\n` +
        `👤 *Name:* ${char.name}\n` +
        `🇯🇵 *Japanese:* ${char.name_kanji || 'N/A'}\n` +
        `⭐ *Favorites:* ${char.favorites?.toLocaleString() || 'N/A'}\n` +
        `🎭 *Nicknames:* ${nicknames}\n` +
        `📺 *Anime:* ${animeList}\n` +
        `📖 *Manga:* ${mangaList}\n\n` +
        `📝 *About:*\n${about}\n\n` +
        `🔗 ${char.url || ''}\n\n` +
        `> 🐞 Data from MyAnimeList`;

      if (char.images?.jpg?.image_url) {
        const imgRes = await fetch(char.images.jpg.image_url);
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
