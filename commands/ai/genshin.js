/**
 * Genshin Impact Character Info
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'genshin',
  aliases: ['gi', 'genshinimpact'],
  category: 'general',
  description: 'Get Genshin Impact character information',
  usage: '.genshin <character name>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('❌ Please provide a character name!\n\nExample: .genshin Hu Tao');
      }
      
      const character = args.join(' ');
      
      await extra.reply('🎮 Fetching character info...');
      
      try {
        const response = await axios.get(`https://api.siputzx.my.id/api/s/genshin?q=${encodeURIComponent(character)}`, {
          timeout: 15000
        });
        
        if (response.data && response.data.status && response.data.data) {
          const data = response.data.data;
          
          let message = `🎮 *GENSHIN IMPACT CHARACTER*\n\n`;
          message += `👤 *Name:* ${data.name || character}\n`;
          message += `⭐ *Rarity:* ${data.rarity || 'Unknown'} ⭐\n`;
          message += `🔮 *Element:* ${data.element || data.vision || 'Unknown'}\n`;
          message += `🗡️ *Weapon:* ${data.weapon || data.weapontype || 'Unknown'}\n`;
          message += `🌐 *Region:* ${data.region || data.nation || 'Unknown'}\n`;
          
          if (data.description || data.desc) {
            message += `\n📝 *Description:*\n${(data.description || data.desc).substring(0, 500)}...\n`;
          }
          
          if (data.url || data.image) {
            const imageUrl = data.url || data.image;
            
            await sock.sendMessage(extra.from, {
              image: { url: imageUrl },
              caption: message + `\n\n_Fetched by ${config.botName}_`
            }, { quoted: msg });
            
            return;
          }
          
          message += `\n\n_Fetched by ${config.botName}_`;
          return await extra.reply(message);
        }
      } catch (e) {
        console.log('Siputzx Genshin API failed');
      }
      
      await extra.reply(`❌ Character "${character}" not found.\n\nPlease check the spelling and try again.`);
      
    } catch (error) {
      console.error('Genshin command error:', error);
      await extra.reply('❌ Failed to fetch character info. Please try again later.');
    }
  }
};