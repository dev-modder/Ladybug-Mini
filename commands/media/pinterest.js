/**
 * Pinterest Command - Download image from a Pinterest URL
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'pinterest',
  aliases: ['pindl', 'pin'],
  category: 'media',
  description: 'Download image/video from a Pinterest URL',
  usage: '.pinterest <Pinterest URL>',

  async execute(sock, msg, args, extra) {
    try {
      const url = args[0]?.trim();

      if (!url || !url.match(/pinterest\.com|pin\.it/i)) {
        return extra.reply(
          '📌 *Pinterest Downloader*\n\n' +
          'Usage: *.pinterest <Pinterest URL>*\n\n' +
          'Example:\n' +
          '  .pinterest https://www.pinterest.com/pin/123456\n' +
          '  .pinterest https://pin.it/XXXXXX'
        );
      }

      await extra.reply('⬇️ _Downloading from Pinterest..._');

      // Try Cobalt API
      const res = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url, vQuality: '1080' }),
      });

      if (!res.ok) throw new Error('Download service unavailable');
      const data = await res.json();

      if (data.status === 'stream' || data.status === 'redirect') {
        const mediaRes = await fetch(data.url);
        if (!mediaRes.ok) throw new Error('Failed to download media');
        const buffer = Buffer.from(await mediaRes.arrayBuffer());
        const contentType = mediaRes.headers.get('content-type') || '';

        if (contentType.startsWith('video')) {
          await sock.sendMessage(extra.from, { video: buffer, caption: '📌 Downloaded via Ladybug Bot' }, { quoted: msg });
        } else {
          await sock.sendMessage(extra.from, { image: buffer, caption: '📌 Downloaded via Ladybug Bot' }, { quoted: msg });
        }
      } else {
        throw new Error(data.text || 'Could not extract media');
      }
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
