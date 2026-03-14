/**
 * Wikipedia Command - Search Wikipedia
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'wiki',
  aliases: ['wikipedia', 'wikisearch'],
  category: 'general',
  description: 'Search Wikipedia for information',
  usage: '.wiki <search term>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('❌ Please provide a search term!\n\nExample: .wiki JavaScript');
      }
      
      const query = args.join(' ');
      
      await extra.reply('🔍 Searching Wikipedia...');
      
      // Try Siputzx API first
      try {
        const response = await axios.get(`https://api.siputzx.my.id/api/s/wikipedia?query=${encodeURIComponent(query)}`, {
          timeout: 15000
        });
        
        if (response.data && response.data.status && response.data.data) {
          const wiki = response.data.data;
          
          let message = `📚 *WIKIPEDIA*\n\n`;
          message += `📌 *Title:* ${wiki.title || query}\n\n`;
          message += `📝 *Content:*\n${wiki.content || wiki.desc || 'No content available.'}\n\n`;
          
          if (wiki.url || wiki.link) {
            message += `🔗 *Read more:* ${wiki.url || wiki.link}\n\n`;
          }
          
          message += `_Fetched by ${config.botName}_`;
          
          return await extra.reply(message);
        }
      } catch (e) {
        console.log('Siputzx wiki API failed, trying next...');
      }
      
      // Fallback: Wikipedia official API
      try {
        const searchResponse = await axios.get(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`,
          { timeout: 10000 }
        );
        
        if (searchResponse.data.query.search.length === 0) {
          return extra.reply('❌ No results found on Wikipedia.');
        }
        
        const pageTitle = searchResponse.data.query.search[0].title;
        
        const contentResponse = await axios.get(
          `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json`,
          { timeout: 10000 }
        );
        
        const pages = contentResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId].extract;
        
        if (extract) {
          let message = `📚 *WIKIPEDIA*\n\n`;
          message += `📌 *Title:* ${pageTitle}\n\n`;
          message += `📝 *Content:*\n${extract.substring(0, 1500)}${extract.length > 1500 ? '...' : ''}\n\n`;
          message += `🔗 *Read more:* https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}\n\n`;
          message += `_Fetched by ${config.botName}_`;
          
          return await extra.reply(message);
        }
      } catch (e) {
        console.log('Wikipedia API failed');
      }
      
      await extra.reply('❌ Could not fetch Wikipedia article. Please try a different search term.');
      
    } catch (error) {
      console.error('Wiki command error:', error);
      await extra.reply('❌ Failed to search Wikipedia. Please try again later.');
    }
  }
};