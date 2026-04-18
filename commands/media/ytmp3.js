/**
 * YTMP3 Command - Download YouTube video as MP3 audio
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'ytmp3',
  aliases: ['yta', 'youtubemp3', 'ytaudio'],
  category: 'media',
  description: 'Download a YouTube video as MP3 audio',
  usage: '.ytmp3 <YouTube URL or search query>',

  async execute(sock, msg, args, extra) {
    try {
      const query = args.join(' ').trim();
      if (!query) return extra.reply('🎵 Please provide a YouTube URL or search term.\n\nUsage: *.ytmp3 <URL or search>*');

      await extra.reply('⬇️ _Processing your audio download..._');

      // Use y2mate/cobalt-compatible public endpoint
      const encoded = encodeURIComponent(query);
      const apiUrl = `https://api.cobalt.tools/api/json`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          url: query.startsWith('http') ? query : `https://www.youtube.com/results?search_query=${encoded}`,
          vCodec: 'h264',
          vQuality: '720',
          aFormat: 'mp3',
          isAudioOnly: true,
        }),
      });

      if (!res.ok) throw new Error('Download service unavailable');
      const data = await res.json();

      if (data.status === 'stream' || data.status === 'redirect') {
        const audioRes = await fetch(data.url);
        if (!audioRes.ok) throw new Error('Failed to download audio');
        const buffer = Buffer.from(await audioRes.arrayBuffer());

        await sock.sendMessage(
          extra.from,
          {
            audio: buffer,
            mimetype: 'audio/mpeg',
            ptt: false,
          },
          { quoted: msg }
        );
      } else {
        throw new Error(data.text || 'Unknown error from download service');
      }
    } catch (error) {
      await extra.reply(
        `❌ *YouTube MP3 Download Failed*\n\n` +
        `Reason: ${error.message}\n\n` +
        `_Try providing a direct YouTube URL:_\n` +
        `*.ytmp3 https://youtube.com/watch?v=...*`
      );
    }
  },
};
