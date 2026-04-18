/**
 * YTMP4 Command - Download YouTube video as MP4
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'ytmp4',
  aliases: ['ytv', 'youtubemp4', 'ytvideo'],
  category: 'media',
  description: 'Download a YouTube video as MP4',
  usage: '.ytmp4 <YouTube URL>',

  async execute(sock, msg, args, extra) {
    try {
      const url = args[0]?.trim();

      if (!url || !url.match(/youtube\.com|youtu\.be/i)) {
        return extra.reply(
          '📹 *YouTube Video Downloader*\n\n' +
          'Usage: *.ytmp4 <YouTube URL>*\n\n' +
          'Example:\n' +
          '  .ytmp4 https://www.youtube.com/watch?v=...\n' +
          '  .ytmp4 https://youtu.be/...'
        );
      }

      await extra.reply('⬇️ _Downloading YouTube video (720p)..._\n\n_Note: Large videos may take a moment._');

      const res = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url, vQuality: '720', vCodec: 'h264' }),
      });

      if (!res.ok) throw new Error('Download service unavailable');
      const data = await res.json();

      if (data.status === 'stream' || data.status === 'redirect') {
        const videoRes = await fetch(data.url);
        if (!videoRes.ok) throw new Error('Failed to fetch video');

        const contentLength = videoRes.headers.get('content-length');
        const sizeMB = contentLength ? (parseInt(contentLength) / (1024 * 1024)).toFixed(1) : 'unknown';

        if (contentLength && parseInt(contentLength) > 64 * 1024 * 1024) {
          return extra.reply(
            `❌ *Video Too Large*\n\n` +
            `File size: ${sizeMB} MB (max 64 MB)\n\n` +
            `Try a shorter video or use *.ytmp3* for audio only.`
          );
        }

        const buffer = Buffer.from(await videoRes.arrayBuffer());
        await sock.sendMessage(
          extra.from,
          { video: buffer, caption: `📹 Downloaded via Ladybug Bot\n\n🔗 ${url}` },
          { quoted: msg }
        );
      } else {
        throw new Error(data.text || 'Could not extract video');
      }
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
