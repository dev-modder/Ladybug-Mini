/**
 * Instagram Story Downloader
 */

const axios = require('axios');
const config = require('../../config');

module.exports = {
  name: 'igstory',
  aliases: ['igs', 'story', 'igstories'],
  category: 'media',
  description: 'Download Instagram stories from a user',
  usage: '.igstory <username>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('❌ Please provide an Instagram username!\n\nExample: .igstory cristiano');
      }
      
      const username = args[0].replace('@', '');
      
      await sock.sendMessage(extra.from, {
        react: { text: '📥', key: msg.key }
      });
      
      let stories = null;
      
      // API 1: Siputzx
      try {
        const response = await axios.get(`https://api.siputzx.my.id/api/d/igstory?username=${encodeURIComponent(username)}`, {
          timeout: 30000
        });
        
        if (response.data && response.data.status && response.data.data) {
          stories = response.data.data;
        }
      } catch (e) {
        console.log('Siputzx IG story API failed, trying next...');
      }
      
      // API 2: Vreden
      if (!stories) {
        try {
          const response = await axios.get(`https://api.vreden.my.id/api/igstory?query=${encodeURIComponent(username)}`, {
            timeout: 30000
          });
          
          if (response.data && response.data.result) {
            stories = response.data.result;
          }
        } catch (e) {
          console.log('Vreden IG story API failed');
        }
      }
      
      if (!stories || (Array.isArray(stories) && stories.length === 0)) {
        return extra.reply(`❌ No stories found for @${username}\n\nThe user may not have any active stories or their account is private.`);
      }
      
      // Send stories
      let sent = 0;
      const maxStories = 10; // Limit to 10 stories
      
      for (let i = 0; i < Math.min(stories.length, maxStories); i++) {
        try {
          const story = stories[i];
          const mediaUrl = story.url || story.download;
          const isVideo = story.type === 'video' || mediaUrl.includes('.mp4');
          
          if (isVideo) {
            await sock.sendMessage(extra.from, {
              video: { url: mediaUrl },
              mimetype: 'video/mp4',
              caption: `📸 Story ${i + 1}/${Math.min(stories.length, maxStories)}\n\n_Downloaded by ${config.botName}_`
            }, { quoted: msg });
          } else {
            await sock.sendMessage(extra.from, {
              image: { url: mediaUrl },
              caption: `📸 Story ${i + 1}/${Math.min(stories.length, maxStories)}\n\n_Downloaded by ${config.botName}_`
            }, { quoted: msg });
          }
          
          sent++;
          
          // Small delay between sends
          if (i < Math.min(stories.length, maxStories) - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (e) {
          console.error(`Error sending story ${i + 1}:`, e);
        }
      }
      
      if (sent === 0) {
        return extra.reply('❌ Failed to download stories. Please try again.');
      }
      
      await extra.reply(`✅ Downloaded ${sent} stories from @${username}`);
      
    } catch (error) {
      console.error('IG Story command error:', error);
      await extra.reply('❌ Failed to fetch Instagram stories. Please try again later.');
    }
  }
};