/**
 * Meme Command - Get random memes
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'meme',
  aliases: ['memes', 'randommeme'],
  category: 'fun',
  description: 'Get a random meme',
  usage: '.meme',
  
  async execute(sock, msg, args, extra) {
    try {
      let memeData = null;
      
      // API 1: Reddit memes via public API
      try {
        const response = await axios.get('https://meme-api.com/gimme', {
          timeout: 10000
        });
        
        if (response.data) {
          memeData = {
            title: response.data.title,
            url: response.data.url,
            author: response.data.author,
            subreddit: response.data.subreddit
          };
        }
      } catch (e) {
        console.log('Meme API 1 failed, trying next...');
      }
      
      // API 2: Siputzx
      if (!memeData) {
        try {
          const response = await axios.get('https://api.siputzx.my.id/api/m/meme', {
            timeout: 10000
          });
          
          if (response.data && response.data.status && response.data.data) {
            memeData = {
              title: response.data.data.title || 'Random Meme',
              url: response.data.data.image || response.data.data.url,
              author: response.data.data.author || 'Unknown',
              subreddit: 'r/memes'
            };
          }
        } catch (e) {
          console.log('Meme API 2 failed');
        }
      }
      
      // API 3: Imgflip
      if (!memeData) {
        try {
          const response = await axios.get('https://api.imgflip.com/get_memes', {
            timeout: 10000
          });
          
          if (response.data && response.data.success) {
            const memes = response.data.data.memes;
            const randomMeme = memes[Math.floor(Math.random() * memes.length)];
            memeData = {
              title: randomMeme.name,
              url: randomMeme.url,
              author: 'Imgflip',
              subreddit: 'Imgflip'
            };
          }
        } catch (e) {
          console.log('Meme API 3 failed');
        }
      }
      
      if (memeData && memeData.url) {
        const caption = `😂 *${memeData.title}*\n\n` +
                       `👤 u/${memeData.author}\n` +
                       `📁 ${memeData.subreddit}\n\n` +
                       `_Fetched by ${config.botName}_`;
        
        await sock.sendMessage(extra.from, {
          image: { url: memeData.url },
          caption: caption
        }, { quoted: msg });
        
        return;
      }
      
      await extra.reply('❌ Could not fetch meme. Please try again.');
      
    } catch (error) {
      console.error('Meme command error:', error);
      await extra.reply('❌ Failed to fetch meme. Please try again later.');
    }
  }
};