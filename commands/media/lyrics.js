/**
 * Lyrics Finder
 * Ladybug Bot Mini V2
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lirik'],
  category: 'media',
  description: 'Get lyrics of a song',
  usage: '.lyrics <song name>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;

      if (!args.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Please provide a song name!\n\nExample: ${config.prefix}lyrics Despacito`
        }, { quoted: msg });
      }

      const query = args.join(' ');
      let lyricsData = null;

      // API 1: Vreden
      try {
        const res = await axios.get(`https://api.vreden.my.id/api/lyrics?query=${encodeURIComponent(query)}`, {
          timeout: 15000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (res.data?.result) {
          lyricsData = {
            title:     res.data.result.title,
            artist:    res.data.result.artist,
            lyrics:    res.data.result.lyrics,
            thumbnail: res.data.result.thumbnail || null
          };
        }
      } catch (e) {
        console.log('[Lyrics] Vreden API failed, trying next...');
      }

      // API 2: Siputzx
      if (!lyricsData) {
        try {
          const res = await axios.get(`https://api.siputzx.my.id/api/s/lyrics?query=${encodeURIComponent(query)}`, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (res.data?.status && res.data?.data) {
            lyricsData = {
              title:     res.data.data.title,
              artist:    res.data.data.artist,
              lyrics:    res.data.data.lyrics,
              thumbnail: res.data.data.image || null
            };
          }
        } catch (e) {
          console.log('[Lyrics] Siputzx API failed, trying next...');
        }
      }

      // API 3: lyrics.ovh
      if (!lyricsData) {
        try {
          // lyrics.ovh: needs "artist - song" format, try splitting on " - " or just artist/title guess
          const parts = query.split(' - ');
          const artist = parts.length > 1 ? parts[0].trim() : 'Unknown';
          const title  = parts.length > 1 ? parts.slice(1).join(' - ').trim() : query;
          const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
            timeout: 15000
          });
          if (res.data?.lyrics) {
            lyricsData = {
              title,
              artist,
              lyrics:    res.data.lyrics,
              thumbnail: null
            };
          }
        } catch (e) {
          console.log('[Lyrics] lyrics.ovh API failed.');
        }
      }

      if (!lyricsData) {
        return await sock.sendMessage(chatId, {
          text: `❌ Could not find lyrics for "*${query}*". Try a more specific search (e.g. Artist - Song Title).`
        }, { quoted: msg });
      }

      // Truncate if too long
      let lyrics = lyricsData.lyrics || '';
      const wasTruncated = lyrics.length > 4000;
      if (wasTruncated) {
        lyrics = lyrics.substring(0, 4000) + '\n\n_...Lyrics too long, showing first part only._';
      }

      const caption =
        `🎵 *${lyricsData.title || query}*\n` +
        `👤 *Artist:* ${lyricsData.artist || 'Unknown'}\n\n` +
        `📝 *Lyrics:*\n${lyrics}\n\n` +
        `_🐞 Ladybug Bot Mini V2_`;

      if (lyricsData.thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: lyricsData.thumbnail },
          caption
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
      }

    } catch (error) {
      console.error('[Lyrics] Command error:', error);
      const chatId = extra?.from || msg.key.remoteJid;
      await sock.sendMessage(chatId, {
        text: '❌ An error occurred while fetching lyrics. Please try again later.'
      }, { quoted: msg });
    }
  }
};
