/**
 * Pinterest Downloader Command
 */

const axios = require('axios');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pindl', 'pins'],
  category: 'media',
  description: 'Download Pinterest images/videos',
  usage: '.pinterest <pinterest URL>',
  
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
        return extra.reply('Please provide a Pinterest link.');
      }
      
      // Extract URL from command
      const url = text.split(' ').slice(1).join(' ').trim();
      
      if (!url) {
        return extra.reply('Please provide a Pinterest link.\n\nExample: .pinterest https://pin.it/xxxxx');
      }
      
      // Check for Pinterest URL
      const pinterestPatterns = [
        /https?:\/\/(?:www\.)?pinterest\.com\/pin\//,
        /https?:\/\/pin\.it\//,
        /https?:\/\/(?:www\.)?pinterest\.[a-z]+\//
      ];
      
      const isValidUrl = pinterestPatterns.some(pattern => pattern.test(url));
      
      if (!isValidUrl) {
        return extra.reply('That is not a valid Pinterest link. Please provide a valid Pinterest URL.');
      }
      
      await sock.sendMessage(extra.from, {
        react: { text: '📥', key: msg.key }
      });
      
      let mediaUrl = null;
      let mediaType = 'image';
      
      // API 1: Siputzx
      try {
        const response = await axios.get(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`, {
          timeout: 30000
        });
        
        if (response.data && response.data.status && response.data.data) {
          mediaUrl = response.data.data.url || response.data.data.image;
          mediaType = response.data.data.type || 'image';
        }
      } catch (e) {
        console.log('Siputzx Pinterest API failed, trying next...');
      }
      
      // API 2: Vreden
      if (!mediaUrl) {
        try {
          const response = await axios.get(`https://api.vreden.my.id/api/pinterest?url=${encodeURIComponent(url)}`, {
            timeout: 30000
          });
          
          if (response.data && response.data.result) {
            mediaUrl = response.data.result.url || response.data.result.image;
            mediaType = response.data.result.type || 'image';
          }
        } catch (e) {
          console.log('Vreden Pinterest API failed');
        }
      }
      
      if (mediaUrl) {
        const caption = `*DOWNLOADED BY ${config.botName.toUpperCase()}*\n\n_Pinterest Media_`;
        
        if (mediaType === 'video') {
          await sock.sendMessage(extra.from, {
            video: { url: mediaUrl },
            mimetype: 'video/mp4',
            caption: caption
          }, { quoted: msg });
        } else {
          await sock.sendMessage(extra.from, {
            image: { url: mediaUrl },
            caption: caption
          }, { quoted: msg });
        }
        
        return;
      }
      
      await extra.reply('❌ Failed to download from Pinterest. Please try a different link.');
      
    } catch (error) {
      console.error('Pinterest command error:', error);
      await extra.reply('❌ An error occurred while downloading from Pinterest.');
    }
  }
};