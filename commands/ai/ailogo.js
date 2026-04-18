/**
 * AILogo Command - Generate a text logo/brand image using AI
 * Ladybug Bot Mini | by Dev-Ntando
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
  name: 'ailogo',
  aliases: ['genlogo', 'logoai'],
  category: 'ai',
  description: 'Generate an AI logo/brand image from your brand name',
  usage: '.ailogo <brand name> [style]',

  async execute(sock, msg, args, extra) {
    try {
      const text = args.join(' ').trim();
      if (!text) return extra.reply('🎨 Please provide a brand name.\n\nUsage: *.ailogo <brand name> [style]*\n\nStyles: modern, minimal, retro, neon, bold');

      await extra.reply('🎨 _Generating your logo, please wait..._');

      const prompt = `Professional logo design for brand "${text}", clean modern style, white background, high quality`;
      const encoded = encodeURIComponent(prompt);
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux`;

      const tmpFile = path.join(os.tmpdir(), `ailogo_${Date.now()}.jpg`);

      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tmpFile);
        https.get(url, (res) => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      });

      await sock.sendMessage(
        extra.from,
        {
          image: fs.readFileSync(tmpFile),
          caption: `🎨 *AI Logo Generated*\n\n🏷️ Brand: *${text}*\n\n> 🐞 Powered by Ladybug Bot`,
        },
        { quoted: msg }
      );

      fs.unlink(tmpFile, () => {});
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
