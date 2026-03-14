/**
 * TinyURL Command - Shorten URL using TinyURL
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'tinyurl',
  aliases: ['tiny', 'short'],
  category: 'utility',
  description: 'Shorten URL using TinyURL',
  usage: '.tinyurl <url>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('❌ Please provide a URL to shorten!\n\nExample: .tinyurl https://example.com');
      }
      
      let url = args[0];
      
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Validate URL
      try {
        new URL(url);
      } catch {
        return extra.reply('❌ Invalid URL! Please provide a valid URL.');
      }
      
      await extra.reply('🔗 Shortening URL...');
      
      const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
        timeout: 10000
      });
      
      if (response.data && response.data.startsWith('http')) {
        const message = `🔗 *URL SHORTENED*\n\n` +
                       `📝 Original:\n${url}\n\n` +
                       `✅ Shortened:\n${response.data}\n\n` +
                       `_Processed by ${config.botName}_`;
        
        return await extra.reply(message);
      }
      
      await extra.reply('❌ Failed to shorten URL. Please try again.');
      
    } catch (error) {
      console.error('TinyURL command error:', error);
      await extra.reply('❌ Failed to shorten URL. Please try again later.');
    }
  }
};