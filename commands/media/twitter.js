/**
 * Twitter/X Command - Download Twitter/X videos
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'twitter',
  aliases: ['twdl', 'xdl', 'twitterdl'],
  category: 'media',
  description: 'Download video/GIF from a Twitter/X post URL',
  usage: '.twitter <tweet URL>',

  async execute(sock, msg, args, extra) {
    try {
      const url = args[0]?.trim();

      if (!url || !url.match(/twitter\.com|x\.com/i)) {
        return extra.reply(
          '🐦 *Twitter/X Video Downloader*\n\n' +
          'Usage: *.twitter <tweet URL>*\n\n' +
          'Example:\n' +
          '  .twitter https://twitter.com/user/status/123456\n' +
          '  .twitter https://x.com/user/status/123456'
        );
      }

      await extra.reply('⬇️ _Downloading Twitter video..._');

      // Use Cobalt API for Twitter downloads
      const res = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url, vQuality: '720' }),
      });

      if (!res.ok) throw new Error('Download service unavailable');
      const data = await res.json();

      if (data.status === 'stream' || data.status === 'redirect') {
        const videoRes = await fetch(data.url);
        if (!videoRes.ok) throw new Error('Failed to download video');
        const buffer = Buffer.from(await videoRes.arrayBuffer());

        await sock.sendMessage(
          extra.from,
          { video: buffer, caption: '🐦 Downloaded via Ladybug Bot' },
          { quoted: msg }
        );
      } else if (data.status === 'picker') {
        let replyText = `🐦 *Twitter Media Found*\n\nMultiple files available:\n`;
        data.picker.forEach((p, i) => { replyText += `${i + 1}. ${p.url}\n`; });
        await extra.reply(replyText);
      } else {
        throw new Error(data.text || 'Could not extract video');
      }
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
