/**
 * Define Command - Dictionary definitions
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'define',
  aliases: ['dictionary', 'def', 'meaning'],
  category: 'general',
  description: 'Get the definition of a word',
  usage: '.define <word>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('❌ Please provide a word!\n\nExample: .define ephemeral');
      }
      
      const word = args.join(' ').toLowerCase();
      
      await extra.reply('📖 Looking up definition...');
      
      // Try Free Dictionary API
      try {
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
          timeout: 10000
        });
        
        if (response.data && response.data[0]) {
          const entry = response.data[0];
          
          let message = `📖 *DICTIONARY*\n\n`;
          message += `📌 *Word:* ${entry.word}\n`;
          
          if (entry.phonetic) {
            message += `🔊 *Pronunciation:* ${entry.phonetic}\n`;
          }
          
          message += `\n`;
          
          // Add meanings
          entry.meanings.slice(0, 3).forEach((meaning, index) => {
            message += `__*${meaning.partOfSpeech}*\n`;
            
            meaning.definitions.slice(0, 2).forEach((def, i) => {
              message += `${i + 1}. ${def.definition}\n`;
              if (def.example) {
                message += `   _Example: "${def.example}"_\n`;
              }
            });
            
            if (meaning.synonyms && meaning.synonyms.length > 0) {
              message += `   🔄 Synonyms: ${meaning.synonyms.slice(0, 5).join(', ')}\n`;
            }
            
            message += `\n`;
          });
          
          message += `_Fetched by ${config.botName}_`;
          
          return await extra.reply(message);
        }
      } catch (e) {
        if (e.response && e.response.status === 404) {
          return extra.reply(`❌ Word "${word}" not found in dictionary.\n\nTry checking the spelling or use a different word.`);
        }
        console.log('Dictionary API failed, trying next...');
      }
      
      // Fallback: Siputzx API
      try {
        const response = await axios.get(`https://api.siputzx.my.id/api/s/dictionary?word=${encodeURIComponent(word)}`, {
          timeout: 10000
        });
        
        if (response.data && response.data.status && response.data.data) {
          const data = response.data.data;
          
          let message = `📖 *DICTIONARY*\n\n`;
          message += `📌 *Word:* ${data.word || word}\n\n`;
          message += `📝 *Definition:*\n${data.definition || data.meaning || 'No definition available.'}\n\n`;
          message += `_Fetched by ${config.botName}_`;
          
          return await extra.reply(message);
        }
      } catch (e) {
        console.log('Siputzx dictionary API failed');
      }
      
      await extra.reply(`❌ Could not find definition for "${word}". Please try a different word.`);
      
    } catch (error) {
      console.error('Define command error:', error);
      await extra.reply('❌ Failed to fetch definition. Please try again later.');
    }
  }
};