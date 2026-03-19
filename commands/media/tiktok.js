/**
 * TikTok Downloader - Download TikTok videos
 * Ladybug Bot Mini V2
 */

const { ttdl } = require('ruhend-scraper');
const axios = require('axios');
const APIs = require('../../utils/api');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

module.exports = {
  name: 'tiktok',
  aliases: ['tt', 'ttdl', 'tiktokdl'],
  category: 'media',
  description: 'Download TikTok videos',
  usage: '.tiktok <TikTok URL>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;

      // Check if message has already been processed
      if (processedMessages.has(msg.key.id)) return;
      processedMessages.add(msg.key.id);

      // Clean up old message IDs after 5 minutes
      setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

      const text = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        args.join(' ');

      if (!text) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide a TikTok link.\n\nExample: .tiktok https://vm.tiktok.com/xxxxx'
        }, { quoted: msg });
      }

      // Extract URL from args (strip command prefix)
      const url = text.split(' ').slice(1).join(' ').trim() || args.join(' ').trim();

      if (!url) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide a TikTok link.\n\nExample: .tiktok https://vm.tiktok.com/xxxxx'
        }, { quoted: msg });
      }

      // Validate TikTok URL formats
      const tiktokPatterns = [
        /https?:\/\/(?:www\.)?tiktok\.com\//,
        /https?:\/\/(?:vm\.)?tiktok\.com\//,
        /https?:\/\/(?:vt\.)?tiktok\.com\//,
        /https?:\/\/(?:www\.)?tiktok\.com\/@/,
        /https?:\/\/(?:www\.)?tiktok\.com\/t\//
      ];

      if (!tiktokPatterns.some(p => p.test(url))) {
        return await sock.sendMessage(chatId, {
          text: '❌ That is not a valid TikTok link. Please provide a valid TikTok video URL.'
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '🔄', key: msg.key } });

      let videoUrl = null;
      let title = null;

      // Method 1: Siputzx API
      try {
        const result = await APIs.getTikTokDownload(url);
        videoUrl = result?.videoUrl || null;
        title = result?.title || null;
      } catch (e) {
        console.error('[TikTok] Siputzx API failed:', e.message);
      }

      // Method 2: ttdl (ruhend-scraper)
      if (!videoUrl) {
        try {
          const downloadData = await ttdl(url);
          if (downloadData?.data?.length > 0) {
            for (const media of downloadData.data.slice(0, 20)) {
              const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(media.url) || media.type === 'video';
              if (isVideo) {
                await sock.sendMessage(chatId, {
                  video: { url: media.url },
                  mimetype: 'video/mp4',
                  caption: `*🐞 LADYBUG BOT MINI V2*\n\n📥 Downloaded via TikTok`
                }, { quoted: msg });
              } else {
                await sock.sendMessage(chatId, {
                  image: { url: media.url },
                  caption: `*🐞 LADYBUG BOT MINI V2*\n\n📥 Downloaded via TikTok`
                }, { quoted: msg });
              }
            }
            return;
          }
        } catch (e) {
          console.error('[TikTok] ttdl fallback failed:', e.message);
        }
      }

      // Method 3: SnapTik fallback API
      if (!videoUrl) {
        try {
          const snapRes = await axios.get(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (snapRes.data?.token) {
            videoUrl = `https://tikmate.app/download/${snapRes.data.token}/${snapRes.data.id}.mp4`;
            title = snapRes.data?.desc || null;
          }
        } catch (e) {
          console.error('[TikTok] SnapTik fallback failed:', e.message);
        }
      }

      if (!videoUrl) {
        return await sock.sendMessage(chatId, {
          text: '❌ Failed to download TikTok video. All methods failed. Try a different link or try again later.'
        }, { quoted: msg });
      }

      // Download video as buffer
      try {
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: 90000,
          maxContentLength: 100 * 1024 * 1024,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.tiktok.com/'
          }
        });

        const videoBuffer = Buffer.from(videoResponse.data);
        if (!videoBuffer.length) throw new Error('Empty video buffer');

        const caption = title
          ? `*🐞 LADYBUG BOT MINI V2*\n\n📝 ${title}`
          : `*🐞 LADYBUG BOT MINI V2*\n\n📥 Downloaded via TikTok`;

        await sock.sendMessage(chatId, {
          video: videoBuffer,
          mimetype: 'video/mp4',
          caption
        }, { quoted: msg });

      } catch (downloadError) {
        console.error('[TikTok] Buffer download failed, trying URL method:', downloadError.message);
        // Fallback: send via URL directly
        const caption = title
          ? `*🐞 LADYBUG BOT MINI V2*\n\n📝 ${title}`
          : `*🐞 LADYBUG BOT MINI V2*\n\n📥 Downloaded via TikTok`;

        await sock.sendMessage(chatId, {
          video: { url: videoUrl },
          mimetype: 'video/mp4',
          caption
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('[TikTok] Command error:', error);
      await sock.sendMessage(extra?.from || msg.key.remoteJid, {
        text: '❌ An error occurred while processing your request. Please try again later.'
      }, { quoted: msg });
    }
  }
};
