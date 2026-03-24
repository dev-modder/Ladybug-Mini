/**
 * Lyrics Finder
 * Ladybug Bot V5
 *
 * API chain: Vreden → Siputzx → lyrics.ovh → Genius (lyricsovh fallback)
 */

const axios  = require('axios');
const config = require('../../config');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lirik', 'song-lyrics'],
  category: 'media',
  description: 'Get lyrics of a song',
  usage: '.lyrics <song name>  or  .lyrics Artist - Song',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
      if (!args.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Please provide a song name!\n\nExamples:\n• ${config.prefix}lyrics Despacito\n• ${config.prefix}lyrics Justin Bieber - Love Yourself`
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '🎵', key: msg.key } });

      const query = args.join(' ');
      let lyricsData = null;

      // API 1: Vreden
      try {
        const res = await axios.get(
          `https://api.vreden.my.id/api/lyrics?query=${encodeURIComponent(query)}`,
          { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        if (res.data?.result?.lyrics) {
          lyricsData = {
            title:     res.data.result.title,
            artist:    res.data.result.artist,
            lyrics:    res.data.result.lyrics,
            thumbnail: res.data.result.thumbnail || null
          };
        }
      } catch (e) { console.log('[Lyrics] Vreden failed'); }

      // API 2: Siputzx
      if (!lyricsData) {
        try {
          const res = await axios.get(
            `https://api.siputzx.my.id/api/s/lyrics?query=${encodeURIComponent(query)}`,
            { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (res.data?.status && res.data?.data?.lyrics) {
            lyricsData = {
              title:     res.data.data.title,
              artist:    res.data.data.artist,
              lyrics:    res.data.data.lyrics,
              thumbnail: res.data.data.image || null
            };
          }
        } catch (e) { console.log('[Lyrics] Siputzx failed'); }
      }

      // API 3: lyrics.ovh
      if (!lyricsData) {
        try {
          const parts  = query.split(' - ');
          const artist = parts.length > 1 ? parts[0].trim() : 'Unknown';
          const title  = parts.length > 1 ? parts.slice(1).join(' - ').trim() : query;
          const res = await axios.get(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
            { timeout: 15000 }
          );
          if (res.data?.lyrics) {
            lyricsData = { title, artist, lyrics: res.data.lyrics, thumbnail: null };
          }
        } catch (e) { console.log('[Lyrics] lyrics.ovh failed'); }
      }

      // API 4: Genius (unofficial search)
      if (!lyricsData) {
        try {
          const res = await axios.get(
            `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
            {
              timeout: 15000,
              headers: {
                'Authorization': `Bearer ${config.apiKeys?.genius || 'access_token_here'}`,
                'User-Agent': 'Mozilla/5.0'
              }
            }
          );
          const hit = res.data?.response?.hits?.[0]?.result;
          if (hit) {
            lyricsData = {
              title:     hit.title,
              artist:    hit.primary_artist?.name || 'Unknown',
              lyrics:    `🔗 Full lyrics: ${hit.url}\n\n_(Genius direct lyrics require a paid API key — showing link instead)_`,
              thumbnail: hit.song_art_image_thumbnail_url || null
            };
          }
        } catch (e) { console.log('[Lyrics] Genius failed'); }
      }

      if (!lyricsData) {
        return await sock.sendMessage(chatId, {
          text: `❌ Could not find lyrics for "*${query}*".\n\nTip: Try format *Artist - Song Title* for better results.`
        }, { quoted: msg });
      }

      // Truncate if too long for WhatsApp
      let lyricsText = lyricsData.lyrics || '';
      const truncated = lyricsText.length > 4000;
      if (truncated) lyricsText = lyricsText.substring(0, 4000) + '\n\n_...Lyrics too long — showing first portion only._';

      const header =
        `🎵 *${lyricsData.title || 'Unknown Title'}*\n` +
        `👤 *${lyricsData.artist || 'Unknown Artist'}*\n` +
        `${'─'.repeat(35)}\n\n`;

      const footer = `\n\n${'─'.repeat(35)}\n${BOT_TAG}`;
      const fullText = header + lyricsText + footer;

      if (lyricsData.thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: lyricsData.thumbnail },
          caption: fullText
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: fullText }, { quoted: msg });
      }

    } catch (error) {
      console.error('[Lyrics] Error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ An error occurred while fetching lyrics. Please try again.'
      }, { quoted: msg });
    }
  }
};
