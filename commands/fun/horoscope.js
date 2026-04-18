/**
 * Horoscope Command - Get daily horoscope for your zodiac sign
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'horoscope',
  aliases: ['zodiac', 'horo'],
  category: 'fun',
  description: 'Get your daily horoscope',
  usage: '.horoscope <zodiac sign>',

  async execute(sock, msg, args, extra) {
    try {
      const sign = args[0]?.toLowerCase();
      const validSigns = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];

      if (!sign || !validSigns.includes(sign)) {
        return extra.reply(
          `♈ *Horoscope — Daily Reading*\n\n` +
          `Please provide a valid zodiac sign:\n\n` +
          `♈ Aries  ♉ Taurus  ♊ Gemini\n` +
          `♋ Cancer  ♌ Leo  ♍ Virgo\n` +
          `♎ Libra  ♏ Scorpio  ♐ Sagittarius\n` +
          `♑ Capricorn  ♒ Aquarius  ♓ Pisces\n\n` +
          `Usage: *.horoscope aries*`
        );
      }

      await extra.reply(`🔮 _Fetching your horoscope..._`);

      const res = await fetch(`https://aztro.sameerkumar.website/?sign=${sign}&day=today`, { method: 'POST' });
      if (!res.ok) throw new Error('Horoscope service unavailable');
      const data = await res.json();

      const signEmoji = {
        aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
        leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
        sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
      };

      await extra.reply(
        `${signEmoji[sign] || '🔮'} *Daily Horoscope — ${sign.charAt(0).toUpperCase() + sign.slice(1)}*\n\n` +
        `📅 *Date:* ${data.current_date}\n` +
        `💫 *Description:*\n${data.description}\n\n` +
        `❤️ *Compatibility:* ${data.compatibility}\n` +
        `🍀 *Lucky Number:* ${data.lucky_number}\n` +
        `🎨 *Lucky Color:* ${data.color}\n` +
        `😊 *Mood:* ${data.mood}\n\n` +
        `> 🐞 Powered by Ladybug Bot`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
