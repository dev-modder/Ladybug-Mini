/**
 * Image Search Command
 * Ladybug Bot V5
 *
 * Usage: .img <search query>
 * Searches Google Images (via scraper APIs) and sends the top result.
 * Optional: .img <query> -n 3  to get up to 3 images.
 *
 * API chain: Siputzx Google Images → BingImages fallback → DuckDuckGo
 */

const axios  = require('axios');
const config = require('../../config');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

module.exports = {
  name: 'img',
  aliases: ['image', 'imgsearch', 'gsearch', 'gimage', 'gimgs'],
  category: 'media',
  description: 'Search and send images from Google/Bing',
  usage: '.img <search query>  |  .img <query> -n 3',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
      if (!args.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Please provide a search query!\n\nExamples:\n• ${config.prefix}img cute cats\n• ${config.prefix}img sunset beach -n 3`
        }, { quoted: msg });
      }

      // Parse -n flag for multiple images
      let count = 1;
      let queryArgs = [...args];
      const nIdx = queryArgs.findIndex(a => a === '-n');
      if (nIdx !== -1) {
        count = Math.min(parseInt(queryArgs[nIdx + 1]) || 1, 5);
        queryArgs.splice(nIdx, 2);
      }
      const query = queryArgs.join(' ').trim();

      await sock.sendMessage(chatId, { react: { text: '🔍', key: msg.key } });

      let imageUrls = [];

      // API 1: Siputzx Google Images
      try {
        const res = await axios.get(
          `https://api.siputzx.my.id/api/s/googlegambar?query=${encodeURIComponent(query)}`,
          { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const data = res.data?.data || res.data?.result || [];
        imageUrls = data
          .map(i => i?.image || i?.url || i?.original || (typeof i === 'string' ? i : null))
          .filter(Boolean);
      } catch (e) { console.log('[img] Siputzx failed:', e.message); }

      // API 2: Vreden Google image search
      if (!imageUrls.length) {
        try {
          const res = await axios.get(
            `https://api.vreden.my.id/api/google-image?query=${encodeURIComponent(query)}`,
            { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          const data = res.data?.result || [];
          imageUrls = data.map(i => i?.url || i?.image).filter(Boolean);
        } catch (e) { console.log('[img] Vreden failed:', e.message); }
      }

      // API 3: DuckDuckGo images (unofficial)
      if (!imageUrls.length) {
        try {
          // Step 1: Get vqd token
          const tokenRes = await axios.get(
            `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
            { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          const vqd = tokenRes.data?.match(/vqd=["']?([^"'&\s]+)/)?.[1] || '';
          if (vqd) {
            const imgRes = await axios.get(
              `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,&p=1`,
              {
                timeout: 15000,
                headers: {
                  'User-Agent': 'Mozilla/5.0',
                  'Referer': 'https://duckduckgo.com/'
                }
              }
            );
            imageUrls = (imgRes.data?.results || []).map(r => r?.image).filter(Boolean);
          }
        } catch (e) { console.log('[img] DuckDuckGo failed:', e.message); }
      }

      if (!imageUrls.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ No images found for *"${query}"*.\n\nTry a different search term.`
        }, { quoted: msg });
      }

      const toSend = imageUrls.slice(0, count);

      if (toSend.length > 1) {
        await sock.sendMessage(chatId, {
          text: `🖼️ Sending *${toSend.length}* images for: *"${query}"*`
        }, { quoted: msg });
      }

      let sentCount = 0;
      for (const imgUrl of toSend) {
        try {
          const caption = sentCount === 0
            ? `🔍 *${query}*\n\n${BOT_TAG}`
            : undefined;
          await sock.sendMessage(chatId, {
            image: { url: imgUrl },
            caption
          }, { quoted: sentCount === 0 ? msg : undefined });
          sentCount++;
        } catch (e) {
          console.error('[img] Failed to send image:', e.message);
          // Try next image on failure
        }
      }

      if (sentCount === 0) {
        await sock.sendMessage(chatId, {
          text: `❌ Found images but could not send them. The servers may be blocking downloads. Try again.`
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('[img] Error:', error);
      await sock.sendMessage(chatId, {
        text: '❌ An error occurred while searching for images. Please try again.'
      }, { quoted: msg });
    }
  }
};
