const yts = require('yt-search');

module.exports = {
  name: 'yts',
  aliases: ['ytsearch', 'youtube'],
  category: 'media',
  description: 'Search YouTube videos',
  usage: '.yts <query>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          '❌ Please provide a search query.\nExample: .yts ladybug bot'
        );
      }

      const query = args.join(' ');
      const results = await yts(query);

      if (!results || !results.videos || results.videos.length === 0) {
        return extra.reply(`❌ No results found for: *${query}*`);
      }

      // Limit to top 5 results
      const topResults = results.videos.slice(0, 5);

      let replyText = `╭━━━『 *YouTube Search* 』━━━╮\n\n`;
      replyText += `🔎 Results for: *${query}*\n\n`;

      topResults.forEach((video, index) => {
        replyText += `🎬 ${index + 1}. *${video.title}*\n`;
        replyText += `📺 Channel: ${video.author.name}\n`;
        replyText += `⏱️ Duration: ${video.timestamp}\n`;
        replyText += `🔗 Link: ${video.url}\n\n`;
      });

      replyText += `╰━━━━━━━━━━━━━━━━━\n`;
      replyText += `🌐 Powered by LadybugInc.Zone.ID`;

      await sock.sendMessage(
        extra.from,
        {
          text: replyText,
          mentions: [extra.sender],
        },
        { quoted: msg }
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
