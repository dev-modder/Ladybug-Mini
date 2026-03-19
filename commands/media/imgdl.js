/**
 * Image Downloader - Download an image from a URL
 * Ladybug Bot Mini V2
 */

const axios = require('axios');

module.exports = {
  name: 'imgdl',
  aliases: ['imagedl', 'downloadimage'],
  category: 'media',
  description: 'Download an image from a given URL',
  usage: '.imgdl <image_url>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;

      if (!args.length) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide an image URL.\n\nExample: .imgdl https://example.com/image.jpg'
        }, { quoted: msg });
      }

      const url = args[0];

      // Basic URL validation
      if (!/^https?:\/\/.+/i.test(url)) {
        return await sock.sendMessage(chatId, {
          text: '❌ Invalid URL. Please provide a valid image link starting with http:// or https://'
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '📥', key: msg.key } });

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 20 * 1024 * 1024, // 20MB limit
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*,*/*'
        }
      });

      const imageBuffer = Buffer.from(response.data);

      // Detect image type from content-type header
      const contentType = response.headers['content-type'] || 'image/jpeg';
      if (!contentType.startsWith('image/')) {
        return await sock.sendMessage(chatId, {
          text: `❌ URL does not point to an image (got: ${contentType}). Please provide a direct image URL.`
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, {
        image: imageBuffer,
        caption: `🖼️ Image downloaded successfully!\n\n*🐞 LADYBUG BOT MINI V2*`,
        mentions: extra?.sender ? [extra.sender] : []
      }, { quoted: msg });

    } catch (error) {
      console.error('[imgdl] Error:', error.message);
      const chatId = extra?.from || msg.key.remoteJid;

      let errMsg = '❌ Error downloading image.';
      if (error.response?.status === 404) errMsg = '❌ Image not found (404). Check the URL and try again.';
      else if (error.response?.status === 403) errMsg = '❌ Access denied (403). The server blocked the request.';
      else if (error.code === 'ECONNABORTED') errMsg = '❌ Request timed out. The server took too long to respond.';

      await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg });
    }
  }
};
