/**
 * Rainbow Text Maker Command
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'rainbow',
  aliases: ['multicolor', 'rb'],
  category: 'textmaker',
  description: 'Generate rainbow colored text image',
  usage: '.rainbow <text>',

  async execute(sock, msg, args, extra) {
    try {
      const text = args.join(' ').trim();
      if (!text) return extra.reply('✏️ Please provide text.\n\nUsage: *.rainbow <your text>*');

      await extra.reply('🌈 _Generating rainbow text image..._');

      const url = `https://api.textpro.me/rainbow?text=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('TextPro API unavailable');
      const buffer = Buffer.from(await res.arrayBuffer());

      await sock.sendMessage(
        extra.from,
        { image: buffer, caption: `🌈 *Rainbow Text*\n\n_${text}_\n\n> 🐞 Powered by Ladybug Bot` },
        { quoted: msg }
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
