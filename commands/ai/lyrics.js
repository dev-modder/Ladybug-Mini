/**
 * Lyrics Command - Search for song lyrics
 * Ladybug V5
 *
 * Uses the free lyrics.ovh API (no key required).
 *
 * Usage:
 *   .lyrics <artist> - <song title>
 *   .lyrics <song title>   (searches by title only)
 *
 * Examples:
 *   .lyrics Eminem - Lose Yourself
 *   .lyrics Bohemian Rhapsody
 */

const axios = require('axios');

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'songlyrics', 'getlyrics'],
  category: 'ai',
  description: 'Search for song lyrics',
  usage: '.lyrics <artist> - <song>  OR  .lyrics <song title>',

  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(
          `🎵 *Lyrics Search*\n\n` +
          `Usage:\n` +
          `  .lyrics <artist> - <song title>\n` +
          `  .lyrics <song title>\n\n` +
          `Examples:\n` +
          `  .lyrics Eminem - Lose Yourself\n` +
          `  .lyrics Bohemian Rhapsody`
        );
      }

      const query = args.join(' ');
      let artist = '';
      let title  = '';

      if (query.includes(' - ')) {
        [artist, ...rest] = query.split(' - ');
        title = rest.join(' - ');
      } else {
        title = query;
        artist = '';
      }

      await extra.reply(`🎵 Searching lyrics for *${query}*...`);

      let lyrics     = null;
      let songArtist = artist;
      let songTitle  = title;

      // Method 1: lyrics.ovh (fast, free, no key)
      if (artist && title) {
        try {
          const res = await axios.get(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
            { timeout: 12000 }
          );
          if (res.data?.lyrics) {
            lyrics = res.data.lyrics.trim();
          }
        } catch (_) {}
      }

      // Method 2: search endpoint (for title-only queries)
      if (!lyrics) {
        try {
          const searchRes = await axios.get(
            `https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`,
            { timeout: 12000 }
          );
          const hit = searchRes.data?.data?.[0];
          if (hit) {
            songArtist = hit.artist?.name || artist;
            songTitle  = hit.title || title;
            const lyricRes = await axios.get(
              `https://api.lyrics.ovh/v1/${encodeURIComponent(songArtist)}/${encodeURIComponent(songTitle)}`,
              { timeout: 12000 }
            );
            if (lyricRes.data?.lyrics) {
              lyrics = lyricRes.data.lyrics.trim();
            }
          }
        } catch (_) {}
      }

      if (!lyrics) {
        return extra.reply(
          `❌ Lyrics not found for *${query}*\n\n` +
          `Try using the format: .lyrics Artist - Song Title`
        );
      }

      // WhatsApp message limit is ~65k chars; trim long lyrics
      const maxLen   = 3500;
      const trimmed  = lyrics.length > maxLen;
      const display  = trimmed ? lyrics.slice(0, maxLen) + '\n\n_...lyrics truncated_' : lyrics;

      const header =
        `🎵 *${songTitle}*\n` +
        `👤 ${songArtist || 'Unknown Artist'}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Split into chunks if still long
      const fullText = header + display;
      const chunkSize = 4000;

      if (fullText.length <= chunkSize) {
        await extra.reply(fullText);
      } else {
        const chunks = [];
        let remaining = fullText;
        while (remaining.length > 0) {
          chunks.push(remaining.slice(0, chunkSize));
          remaining = remaining.slice(chunkSize);
        }
        for (let i = 0; i < chunks.length; i++) {
          await sock.sendMessage(extra.from, {
            text: i === 0 ? chunks[i] : `_(Part ${i + 1})_\n\n${chunks[i]}`,
          }, { quoted: i === 0 ? msg : undefined });
          await new Promise(r => setTimeout(r, 500));
        }
      }

    } catch (error) {
      console.error('[lyrics] Error:', error);
      await extra.reply(`❌ Lyrics search failed: ${error.message}`);
    }
  },
};
