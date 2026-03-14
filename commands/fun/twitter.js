/**
 * Twitter/X Video Downloader
 */

const axios = require('axios');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

module.exports = {
  name: 'twitter',
  aliases: ['twdl', 'twitterdl', 'xdl', 'twitdl'],
  category: 'media',
  description: 'Download Twitter/X videos',
  usage: '.twitter <Twitter URL>',
  
  async execute(sock, msg, args, extra) {
    try {
      // Check if message has already been processed
      if (processedMessages.has(msg.key.id)) {
        return;
      }
      
      processedMessages.add(msg.key.id);
      
      // Clean up old message IDs after 5 minutes
      setTimeout(() => {
        processedMessages.delete(msg.key.id);
      }, 5 * 60 * 1000);
      
      const text = msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text ||
                   args.join(' ');
      
      if (!text) {
        return extra.reply('Please provide a Twitter/X link for the video.');
      }
      
      // Extract URL from command
      const url = text.split(' ').slice(1).join(' ').trim();
      
      if (!url) {
        return extra.reply('Please provide a Twitter/X link for the video.');
      }
      
      // Check for Twitter/X URL formats
      const twitterPatterns = [
        /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\//,
        /https?:\/\/(?:www\.)?twitter\.com\/\w+\/status\//,
        /https?:\/\/(?:www\.)?x\.com\/\w+\/status\//
      ];
      
      const isValidUrl = twitterPatterns.some(pattern => pattern.test(url));
      
      if (!isValidUrl) {
        return extra.reply('That is not a valid Twitter/X link. Please provide a valid Twitter/X video link.');
      }
      
      await sock.sendMessage(extra.from, {
        react: { text: '🔄', key: msg.key }
      });
      
      // Try multiple APIs
      let videoUrl = null;
      let videoData = null;
      
      // API 1: Siputzx
      try {
        const response = await axios.get(`https://api.siputzx.my.id/api/d/twvideo?url=${encodeURIComponent(url)}`, {
          timeout: 30000
        });
        
        if (response.data && response.data.status && response.data.data) {
          videoData = response.data.data;
          videoUrl = videoData.url || videoData.video || (videoData.medias && videoData.medias[0]?.url);
        }
      } catch (e) {
        console.log('Siputzx Twitter API failed, trying next...');
      }
      
      // API 2: Vreden
      if (!videoUrl) {
        try {
          const response = await axios.get(`https://api.vreden.my.id/api/twitter?url=${encodeURIComponent(url)}`, {
            timeout: 30000
          });
          
          if (response.data && response.data.result) {
            videoData = response.data.result;
            videoUrl = videoData.video || videoData.url || (videoData.medias && videoData.medias[0]?.url);
          }
        } catch (e) {
          console.log('Vreden Twitter API failed');
        }
      }
      
      // API 3:_Mantra (fallback)
      if (!videoUrl) {
        try {
          const response = await axios.get(`https://api.mantrax.my.id/api/twitter?url=${encodeURIComponent(url)}`, {
            timeout: 30000
          });
          
          if (response.data && response.data.data) {
            videoData = response.data.data;
            videoUrl = videoData.url || videoData.video;
          }
        } catch (e) {
          console.log('Mantra Twitter API failed');
        }
      }
      
      if (videoUrl) {
        const caption = `*DOWNLOADED BY ${config.botName.toUpperCase()}*\n\n` +
                       (videoData.title ? `📝 Title: ${videoData.title}\n` : '') +
                       (videoData.author ? `👤 Author: ${videoData.author}\n` : '');
        
        await sock.sendMessage(extra.from, {
          video: { url: videoUrl },
          mimetype: 'video/mp4',
          caption: caption
        }, { quoted: msg });
        
        return;
      }
      
      await extra.reply('❌ Failed to download Twitter video. Please try a different link.');
      
    } catch (error) {
      console.error('Twitter command error:', error);
      await extra.reply('❌ An error occurred while downloading the Twitter video.');
    }
  }
};