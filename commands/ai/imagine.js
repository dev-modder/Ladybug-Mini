/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  Imagine — AI Image Generation v3 (Ladybug Bot)     ║
 * ║  Multi-provider: Pollinations → Stable Diffusion    ║
 * ║  .imagine <prompt> [--style <style>] [--ratio 16:9] ║
 * ╚══════════════════════════════════════════════════════╝
 */

'use strict';

const axios = require('axios');

const STYLES = {
  realistic:  'photorealistic, 8k, hyperdetailed, cinematic lighting',
  anime:      'anime art style, vibrant colors, detailed, studio quality',
  digital:    'digital art, concept art, artstation trending, detailed',
  oil:        'oil painting, classical art style, detailed brushwork',
  watercolor: 'watercolor painting, soft edges, artistic, beautiful',
  cyberpunk:  'cyberpunk style, neon lights, futuristic city, blade runner aesthetic',
  fantasy:    'fantasy art, magical, epic, highly detailed, d&d style',
  cartoon:    'cartoon style, vibrant, clean lines, disney pixar style',
  sketch:     'pencil sketch, detailed linework, artistic',
  portrait:   'portrait photography, professional lighting, sharp focus',
};

async function generateWithPollinations(prompt, width = 1024, height = 1024) {
  const seed = Math.floor(Math.random() * 999999);
  const url  = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;
  const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 35000 });
  if (!r.data || r.data.byteLength < 1000) throw new Error('Empty image');
  return Buffer.from(r.data);
}

async function generateWithSD(prompt) {
  const r = await axios.get(
    `https://api.siputzx.my.id/api/ai/stablediffusion?prompt=${encodeURIComponent(prompt)}`,
    { responseType: 'arraybuffer', timeout: 35000 }
  );
  if (!r.data || r.data.byteLength < 1000) throw new Error('Empty image');
  return Buffer.from(r.data);
}

module.exports = {
  name: 'imagine',
  aliases: ['img', 'generate', 'draw', 'paint', 'art', 'create'],
  category: 'ai',
  description: 'Generate AI images from text prompts with style control',
  usage: '.imagine <prompt> [--style realistic|anime|digital|oil|watercolor|cyberpunk|fantasy|cartoon|sketch|portrait] [--wide|--tall|--square]',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🎨 *AI Image Generator v3*\n\n` +
          `Create stunning AI art from any description!\n\n` +
          `*Usage:* .imagine <your prompt>\n\n` +
          `*Styles:*\n` +
          Object.keys(STYLES).map(s => `  • ${s}`).join('\n') +
          `\n\n*Aspect Ratios:*\n` +
          `  • --wide (16:9)\n  • --tall (9:16)\n  • --square (1:1, default)\n\n` +
          `*Examples:*\n` +
          `  .imagine a dragon flying over a sunset --style fantasy\n` +
          `  .imagine african savanna at golden hour --style realistic --wide\n\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }

      // Parse flags
      let style = null, wide = false, tall = false;
      const cleanArgs = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--style' && args[i+1]) { style = args[++i].toLowerCase(); }
        else if (args[i] === '--wide')  { wide = true; }
        else if (args[i] === '--tall')  { tall = true; }
        else if (args[i] === '--square') {}
        else { cleanArgs.push(args[i]); }
      }

      let prompt = cleanArgs.join(' ').trim();
      if (!prompt) return extra.reply('❌ Please provide a prompt!');

      // Apply style enhancement
      const styleTag = style && STYLES[style] ? STYLES[style] : null;
      if (styleTag) prompt = `${prompt}, ${styleTag}`;

      // Determine dimensions
      let width = 1024, height = 1024;
      if (wide) { width = 1344; height = 768; }
      if (tall) { width = 768;  height = 1344; }

      await extra.reply(`🎨 *Generating your image...*\n\n📝 Prompt: _${cleanArgs.join(' ').slice(0, 100)}_${style ? `\n🎭 Style: ${style}` : ''}\n\n⏳ Please wait...`);
      await sock.sendPresenceUpdate('composing', extra.from);

      let imgBuffer;
      try { imgBuffer = await generateWithPollinations(prompt, width, height); }
      catch(_) {
        try { imgBuffer = await generateWithSD(prompt); }
        catch(e) { throw new Error('All image providers failed. Try a different prompt.'); }
      }

      await sock.sendMessage(extra.from, {
        image: imgBuffer,
        caption:
          `🎨 *AI Generated Image*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📝 *Prompt:* ${cleanArgs.join(' ').slice(0, 200)}\n` +
          (style ? `🎭 *Style:* ${style}\n` : '') +
          `📐 *Size:* ${width}×${height}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `> _Ladybug Bot Mini v3_`,
      }, { quoted: msg });

    } catch (error) {
      console.error('[imagine] Error:', error.message);
      await extra.reply(`❌ ${error.message}`);
    }
  }
};
