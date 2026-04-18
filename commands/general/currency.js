/**
 * Currency Command - Convert currencies using exchange rates
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'currency',
  aliases: ['convert', 'fx'],
  category: 'general',
  description: 'Convert currency — e.g. .currency 100 USD ZAR',
  usage: '.currency <amount> <from> <to>',

  async execute(sock, msg, args, extra) {
    try {
      if (args.length < 3) {
        return extra.reply(
          '💱 *Currency Converter*\n\n' +
          'Usage: *.currency <amount> <from> <to>*\n\n' +
          'Examples:\n' +
          '  .currency 100 USD ZAR\n' +
          '  .currency 50 EUR GBP\n' +
          '  .currency 1000 ZWL USD'
        );
      }

      const amount = parseFloat(args[0]);
      const from = args[1].toUpperCase();
      const to = args[2].toUpperCase();

      if (isNaN(amount) || amount <= 0) {
        return extra.reply('❌ Invalid amount. Please provide a valid number.');
      }

      await extra.reply(`💱 _Converting ${amount} ${from} to ${to}..._`);

      const res = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
      if (!res.ok) throw new Error(`Invalid currency or service unavailable`);
      const data = await res.json();

      if (!data.rates || !data.rates[to]) {
        return extra.reply(`❌ Could not convert *${from}* to *${to}*. Please check currency codes.`);
      }

      const result = data.rates[to];

      await extra.reply(
        `💱 *Currency Conversion*\n\n` +
        `💵 *${amount} ${from}*\n` +
        `↓\n` +
        `💰 *${result.toLocaleString()} ${to}*\n\n` +
        `📅 Rate date: ${data.date}\n` +
        `🏦 Source: Frankfurter (ECB data)\n\n` +
        `> 🐞 Powered by Ladybug Bot`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
