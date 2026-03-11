const axios = require('axios');

module.exports = {
  name: 'imgdl',
  aliases: ['imagedl', 'downloadimage'],
  category: 'media',
  description: 'Download an image from a given URL',
  usage: '.imgdl <image_url>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('❌ Please provide an image URL.\nExample: .imgdl https://example.com/image.jpg');
      }

      const url = args[0];

      // Fetch image as buffer
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');

      await sock.sendMessage(
        extra.from,
        {
          image: imageBuffer,
          caption: `🖼️ Image downloaded successfully!\n🌐 Powered by LadybugInc.Zone.ID`,
          mentions: [extra.sender],
        },
        { quoted: msg }
      );
    } catch (error) {
      await extra.reply(`❌ Error downloading image: ${error.message}`);
    }
  },
};
