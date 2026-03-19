/**
 * Facebook Downloader - Download Facebook videos
 * Ladybug Bot Mini V2
 */

const axios = require('axios');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Try to load @bochilteam/scraper-facebook gracefully
let facebookdl = null;
try {
  facebookdl = require('@bochilteam/scraper-facebook').facebookdl;
} catch (e) {
  console.warn('[Facebook] @bochilteam/scraper-facebook not installed, will use API fallback only.');
}

module.exports = {
  name: 'facebook',
  aliases: ['fb', 'fbdl', 'facebookdl'],
  category: 'media',
  description: 'Download Facebook videos',
  usage: '.facebook <Facebook URL>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;

      // Prevent duplicate processing
      if (processedMessages.has(msg.key.id)) return;
      processedMessages.add(msg.key.id);
      setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

      const text = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        args.join(' ');

      if (!text) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide a Facebook video link.\n\nExample: .facebook https://www.facebook.com/watch?v=xxxxx'
        }, { quoted: msg });
      }

      // Extract URL (strip command word)
      const url = text.split(' ').slice(1).join(' ').trim() || args.join(' ').trim();

      if (!url) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide a Facebook video link.\n\nExample: .facebook https://www.facebook.com/watch?v=xxxxx'
        }, { quoted: msg });
      }

      // Validate Facebook URL
      const facebookPatterns = [
        /https?:\/\/(?:www\.|m\.)?facebook\.com\//,
        /https?:\/\/(?:www\.|m\.)?fb\.com\//,
        /https?:\/\/fb\.watch\//,
        /https?:\/\/(?:www\.)?facebook\.com\/watch/,
        /https?:\/\/(?:www\.)?facebook\.com\/.*\/videos\//
      ];

      if (!facebookPatterns.some(p => p.test(url))) {
        return await sock.sendMessage(chatId, {
          text: '❌ That is not a valid Facebook link. Please provide a valid Facebook video URL.'
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '🔄', key: msg.key } });

      let videoUrl = null;
      let caption = `*🐞 LADYBUG BOT MINI V2*\n\n📥 Downloaded via Facebook`;

      // Method 1: @bochilteam/scraper-facebook
      if (facebookdl) {
        try {
          const data = await facebookdl(url);
          if (data?.video?.length > 0) {
            const videoOption = data.video[0];
            if (videoOption?.download) {
              const videoData = await videoOption.download();
              if (typeof videoData === 'string') {
                videoUrl = videoData;
              } else if (Buffer.isBuffer(videoData)) {
                // Send buffer directly
                const parts = [];
                if (data.duration) parts.push(`⏱️ Duration: ${data.duration}`);
                if (videoOption.quality) parts.push(`📹 Quality: ${videoOption.quality}`);
                if (parts.length) caption += '\n' + parts.join('\n');

                await sock.sendMessage(chatId, {
                  video: videoData,
                  mimetype: 'video/mp4',
                  caption
                }, { quoted: msg });
                return;
              } else if (videoData?.url) {
                videoUrl = videoData.url;
              } else if (videoData?.data) {
                const videoBuffer = Buffer.from(videoData.data);
                await sock.sendMessage(chatId, {
                  video: videoBuffer,
                  mimetype: 'video/mp4',
                  caption
                }, { quoted: msg });
                return;
              }

              if (videoUrl) {
                const parts = [];
                if (data.duration) parts.push(`⏱️ Duration: ${data.duration}`);
                if (videoOption.quality) parts.push(`📹 Quality: ${videoOption.quality}`);
                if (parts.length) caption += '\n' + parts.join('\n');
              }
            }
          }
        } catch (e) {
          console.error('[Facebook] bochilteam scraper failed:', e.message);
        }
      }

      // Method 2: Fallback via getvideobot / savefrom-style API
      if (!videoUrl) {
        try {
          const res = await axios.get(`https://api.siputzx.my.id/api/d/fb?url=${encodeURIComponent(url)}`, {
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const d = res.data?.data;
          if (d) {
            videoUrl = d.hd || d.sd || d.url || null;
          }
        } catch (e) {
          console.error('[Facebook] Siputzx API fallback failed:', e.message);
        }
      }

      // Method 3: Another fallback
      if (!videoUrl) {
        try {
          const res = await axios.get(`https://api.vreden.my.id/api/fbdl?url=${encodeURIComponent(url)}`, {
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const d = res.data?.result;
          if (d) {
            videoUrl = d.hd || d.sd || d.url || null;
          }
        } catch (e) {
          console.error('[Facebook] Vreden API fallback failed:', e.message);
        }
      }

      if (!videoUrl) {
        return await sock.sendMessage(chatId, {
          text: '❌ Failed to download Facebook video. The video may be private or unavailable. Try a different link.'
        }, { quoted: msg });
      }

      // Send via buffer first, fallback to URL
      try {
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: 90000,
          maxContentLength: 100 * 1024 * 1024,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.facebook.com/'
          }
        });
        const videoBuffer = Buffer.from(videoResponse.data);
        await sock.sendMessage(chatId, {
          video: videoBuffer,
          mimetype: 'video/mp4',
          caption
        }, { quoted: msg });
      } catch (e) {
        console.error('[Facebook] Buffer send failed, falling back to URL:', e.message);
        await sock.sendMessage(chatId, {
          video: { url: videoUrl },
          mimetype: 'video/mp4',
          caption
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('[Facebook] Command error:', error);
      await sock.sendMessage(extra?.from || msg.key.remoteJid, {
        text: '❌ An error occurred while processing your request. Please try again later.'
      }, { quoted: msg });
    }
  }
};
