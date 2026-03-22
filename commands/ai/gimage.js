/**
 * Google Image Search Command
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'gimage',
  aliases: ['googleimage', 'image', 'imgsearch'],
  category: 'general',
  description: 'Search for images on Google',
  usage: '.gimage <search query>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('❌ Please provide a search query!\n\nExample: .gimage cute cats');
      }
      
      const query = args.join(' ');
      
      await sock.sendMessage(extra.from, {
        react: { text: '🔍', key: msg.key }
      });
      
      let images = null;
      
      // API 1: Siputzx
      try {
        const response = await axios.get(`https://api.siputzx.my.id/api/s/gimage?query=${encodeURIComponent(query)}`, {
          timeout: 15000
        });
        
        if (response.data && response.data.status && response.data.data) {
          images = response.data.data;
        }
      } catch (e) {
        console.log('Siputzx gimage API failed, trying next...');
      }
      
      // API 2: Vreden
      if (!images) {
        try {
          const response = await axios.get(`https://api.vreden.my.id/api/googleimage?query=${encodeURIComponent(query)}`, {
            timeout: 15000
          });
          
          if (response.data && response.data.result) {
            images = response.data.result;
          }
        } catch (e) {
          console.log('Vreden gimage API failed');
        }
      }
      
      if (!images || images.length === 0) {
        return extra.reply(`❌ No images found for "${query}"`);
      }
      
      // Pick a random image from results
      const randomImage = images[Math.floor(Math.random() * images.length)];
      const imageUrl = randomImage.url || randomImage.thumbnail || randomImage;
      
      await sock.sendMessage(extra.from, {
        image: { url: imageUrl },
        caption: `🔍 *Google Image Search*\n\n` +
                 `📝 Query: ${query}\n` +
                 `📊 Found: ${images.length} images\n\n` +
                 `_Search by ${config.botName}_`
      }, { quoted: msg });
      
    } catch (error) {
      console.error('GImage command error:', error);
      await extra.reply('❌ Failed to search for images. Please try again later.');
    }
  }
};