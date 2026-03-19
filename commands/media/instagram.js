/**
 * Instagram Downloader - Download Instagram photos/videos/reels
 * Ladybug Bot Mini V2
 */

const { igdl } = require('ruhend-scraper');
const axios = require('axios');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Remove exact URL duplicates
function extractUniqueMedia(mediaData) {
  const seenUrls = new Set();
  return mediaData.filter(media => {
    if (!media?.url || seenUrls.has(media.url)) return false;
    seenUrls.add(media.url);
    return true;
  });
}

module.exports = {
  name: 'instagram',
  aliases: ['ig', 'insta', 'igdl', 'reels'],
  category: 'media',
  description: 'Download Instagram photos/videos/reels',
  usage: '.instagram <Instagram URL>',

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
          text: '❌ Please provide an Instagram link.\n\nExample: .instagram https://www.instagram.com/p/xxxxx'
        }, { quoted: msg });
      }

      // Validate Instagram URL
      const instagramPatterns = [
        /https?:\/\/(?:www\.)?instagram\.com\//,
        /https?:\/\/(?:www\.)?instagr\.am\//,
        /https?:\/\/(?:www\.)?instagram\.com\/p\//,
        /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
        /https?:\/\/(?:www\.)?instagram\.com\/tv\//
      ];

      if (!instagramPatterns.some(p => p.test(text))) {
        return await sock.sendMessage(chatId, {
          text: '❌ That is not a valid Instagram link. Please provide a valid Instagram post, reel, or video URL.'
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '📥', key: msg.key } });

      let mediaData = null;

      // Method 1: ruhend-scraper igdl
      try {
        const downloadData = await igdl(text);
        if (downloadData?.data?.length > 0) {
          mediaData = downloadData.data;
        }
      } catch (e) {
        console.error('[Instagram] ruhend-scraper igdl failed:', e.message);
      }

      // Method 2: Siputzx API fallback
      if (!mediaData) {
        try {
          const res = await axios.get(`https://api.siputzx.my.id/api/d/ig?url=${encodeURIComponent(text)}`, {
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (res.data?.data?.length > 0) {
            mediaData = res.data.data.map(item => ({ url: item.url || item, type: item.type }));
          }
        } catch (e) {
          console.error('[Instagram] Siputzx API failed:', e.message);
        }
      }

      // Method 3: Vreden API fallback
      if (!mediaData) {
        try {
          const res = await axios.get(`https://api.vreden.my.id/api/igdl?url=${encodeURIComponent(text)}`, {
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (res.data?.result?.length > 0) {
            mediaData = res.data.result.map(item => ({ url: item.url, type: item.type }));
          }
        } catch (e) {
          console.error('[Instagram] Vreden API failed:', e.message);
        }
      }

      if (!mediaData || mediaData.length === 0) {
        return await sock.sendMessage(chatId, {
          text: '❌ No media found at that link. The post might be private or the link is invalid.'
        }, { quoted: msg });
      }

      const uniqueMedia = extractUniqueMedia(mediaData).slice(0, 20);

      if (uniqueMedia.length === 0) {
        return await sock.sendMessage(chatId, {
          text: '❌ No valid media found to download. This might be a private post.'
        }, { quoted: msg });
      }

      const captionText = `*🐞 LADYBUG BOT MINI V2*\n\n📥 Downloaded via Instagram`;

      for (let i = 0; i < uniqueMedia.length; i++) {
        try {
          const media = uniqueMedia[i];
          const mediaUrl = media.url;
          const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) ||
            media.type === 'video' ||
            text.includes('/reel/') ||
            text.includes('/tv/');

          if (isVideo) {
            await sock.sendMessage(chatId, {
              video: { url: mediaUrl },
              mimetype: 'video/mp4',
              caption: captionText
            }, { quoted: msg });
          } else {
            await sock.sendMessage(chatId, {
              image: { url: mediaUrl },
              caption: captionText
            }, { quoted: msg });
          }

          // Small delay between items to avoid rate limiting
          if (i < uniqueMedia.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (mediaError) {
          console.error(`[Instagram] Error sending media item ${i + 1}:`, mediaError.message);
        }
      }

    } catch (error) {
      console.error('[Instagram] Command error:', error);
      await sock.sendMessage(extra?.from || msg.key.remoteJid, {
        text: '❌ An error occurred while processing your request. Please try again.'
      }, { quoted: msg });
    }
  }
};
