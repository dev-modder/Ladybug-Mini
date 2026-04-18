/**
 * Imagine3 Command - AI image generation via Pollinations (no key required)
 * Ladybug Bot Mini | by Dev-Ntando
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
  name: 'imagine3',
  aliases: ['img3', 'gen3'],
  category: 'ai',
  description: 'Generate an AI image from a text prompt (Pollinations)',
  usage: '.imagine3 <prompt>',

  async execute(sock, msg, args, extra) {
    try {
      const prompt = args.join(' ').trim();
      if (!prompt) return extra.reply('🎨 Please provide a prompt.\n\nUsage: *.imagine3 <your prompt>*');

      await extra.reply('🎨 _Generating your image, please wait..._');

      const encoded = encodeURIComponent(prompt);
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true`;

      const tmpFile = path.join(os.tmpdir(), `imagine3_${Date.now()}.jpg`);

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
          caption: `🎨 *AI Image*\n\n📝 Prompt: _${prompt}_\n\n> 🐞 Powered by Ladybug Bot`,
        },
        { quoted: msg }
      );

      fs.unlink(tmpFile, () => {});
    } catch (error) {
      await extra.reply(`❌ Error generating image: ${error.message}`);
    }
  },
};
