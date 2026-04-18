/**
 * Galaxy Text Maker Command
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'galaxy',
  aliases: ['space', 'cosmos'],
  category: 'textmaker',
  description: 'Generate galaxy/space styled text image',
  usage: '.galaxy <text>',

  async execute(sock, msg, args, extra) {
    try {
      const text = args.join(' ').trim();
      if (!text) return extra.reply('✏️ Please provide text.\n\nUsage: *.galaxy <your text>*');

      await extra.reply('🌌 _Generating galaxy text image..._');

      const url = `https://api.textpro.me/galaxy?text=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('TextPro API unavailable');
      const buffer = Buffer.from(await res.arrayBuffer());

      await sock.sendMessage(
        extra.from,
        { image: buffer, caption: `🌌 *Galaxy Text*\n\n_${text}_\n\n> 🐞 Powered by Ladybug Bot` },
        { quoted: msg }
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
