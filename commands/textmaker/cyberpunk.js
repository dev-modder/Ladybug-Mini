/**
 * Cyberpunk Text Maker Command
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'cyberpunk',
  aliases: ['cyber', 'cpunk'],
  category: 'textmaker',
  description: 'Generate cyberpunk styled text image',
  usage: '.cyberpunk <text>',

  async execute(sock, msg, args, extra) {
    try {
      const text = args.join(' ').trim();
      if (!text) return extra.reply('✏️ Please provide text.\n\nUsage: *.cyberpunk <your text>*');

      await extra.reply('🎨 _Generating cyberpunk text image..._');

      const url = `https://api.textpro.me/cyberpunk?text=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('TextPro API unavailable');
      const buffer = Buffer.from(await res.arrayBuffer());

      await sock.sendMessage(
        extra.from,
        { image: buffer, caption: `🔮 *Cyberpunk Text*\n\n_${text}_\n\n> 🐞 Powered by Ladybug Bot` },
        { quoted: msg }
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
