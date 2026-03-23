/**
 * Imagine2 Command - AI Image Generation via Pollinations.ai (free, no key)
 * Ladybug V5
 *
 * Uses pollinations.ai — completely free, no API key required.
 * Supports model selection: flux (default), turbo, gptimage
 *
 * Usage:
 *   .imagine2 <prompt>
 *   .imagine2 <prompt> --model turbo
 *   .imagine2 <prompt> --wide       (landscape 1920×1080)
 *   .imagine2 <prompt> --tall       (portrait 768×1344)
 *
 * Examples:
 *   .imagine2 a dragon flying over Tokyo at night
 *   .imagine2 anime girl in a cyberpunk city --model turbo
 */

const axios = require('axios');

const MODELS = {
  flux:     'flux',
  turbo:    'flux-schnell',
  realism:  'flux-realism',
  anime:    'flux-anime',
  pro:      'flux-pro',
};

module.exports = {
  name: 'imagine2',
  aliases: ['txt2img', 'aiart', 'pollinations', 'gen', 'draw'],
  category: 'ai',
  description: 'Generate AI images from text using Pollinations.ai (free)',
  usage: '.imagine2 <prompt> [--model flux|turbo|realism|anime|pro] [--wide|--tall]',

  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(
          `🎨 *AI Image Generator (Pollinations)*\n\n` +
          `Usage:\n` +
          `  .imagine2 <prompt>\n` +
          `  .imagine2 <prompt> --model turbo\n` +
          `  .imagine2 <prompt> --wide   (landscape)\n` +
          `  .imagine2 <prompt> --tall   (portrait)\n\n` +
          `Models: flux (default), turbo, realism, anime, pro\n\n` +
          `Example:\n` +
          `  .imagine2 a cyberpunk city at night --model anime`
        );
      }

      // Parse flags
      let modelKey   = 'flux';
      let width      = 1024;
      let height     = 1024;
      let promptArgs = [...args];

      if (promptArgs.includes('--wide')) {
        width  = 1920; height = 1080;
        promptArgs = promptArgs.filter(a => a !== '--wide');
      } else if (promptArgs.includes('--tall')) {
        width  = 768; height = 1344;
        promptArgs = promptArgs.filter(a => a !== '--tall');
      }

      const modelIdx = promptArgs.indexOf('--model');
      if (modelIdx !== -1 && promptArgs[modelIdx + 1]) {
        modelKey = promptArgs[modelIdx + 1].toLowerCase();
        promptArgs.splice(modelIdx, 2);
      }

      const model  = MODELS[modelKey] || MODELS.flux;
      const prompt = promptArgs.join(' ').trim();

      if (!prompt) return extra.reply('❌ Please provide a prompt!');

      await extra.reply(`🎨 Generating: _${prompt}_\nModel: *${modelKey}* | ${width}×${height}`);

      const seed     = Math.floor(Math.random() * 999999);
      const imageUrl =
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
        `?model=${model}&width=${width}&height=${height}&seed=${seed}&nologo=true`;

      // Download the generated image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      const imageBuffer = Buffer.from(response.data);

      if (!imageBuffer || imageBuffer.length < 1000) {
        throw new Error('Invalid image received from API');
      }

      await sock.sendMessage(extra.from, {
        image: imageBuffer,
        caption:
          `🎨 *AI Generated Image*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📝 *Prompt:* ${prompt}\n` +
          `🤖 *Model:* ${modelKey}\n` +
          `📐 *Size:* ${width}×${height}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_Powered by Pollinations.ai_`,
      }, { quoted: msg });

    } catch (error) {
      console.error('[imagine2] Error:', error);
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return extra.reply('❌ Image generation timed out. Try a simpler prompt or --model turbo.');
      }
      await extra.reply(`❌ Failed to generate image: ${error.message}`);
    }
  },
};
