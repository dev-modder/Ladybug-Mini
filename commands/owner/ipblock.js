/**
 * IPBlock Command - Block a number from all bot access
 * Ladybug Bot Mini | by Dev-Ntando
 */

const database = require('../../database');

module.exports = {
  name: 'ipblock',
  aliases: ['hardban', 'blacklist'],
  category: 'owner',
  description: 'Permanently blacklist a number from all bot access',
  usage: '.ipblock <number> [reason]',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      if (!args[0]) {
        return extra.reply(
          '🚫 *IPBlock — Permanent Blacklist*\n\n' +
          'Usage: *.ipblock <number> [reason]*\n\n' +
          'Examples:\n' +
          '  .ipblock 263712345678 Spammer\n' +
          '  .ipblock list\n' +
          '  .ipblock remove 263712345678'
        );
      }

      const blacklist = database.get('blacklist') || {};

      if (args[0] === 'list') {
        const entries = Object.keys(blacklist);
        if (!entries.length) return extra.reply('✅ No numbers are blacklisted.');
        const list = entries.map((n, i) => `${i + 1}. ${n} — ${blacklist[n].reason || 'No reason'}`).join('\n');
        return extra.reply(`🚫 *Blacklist (${entries.length})*\n\n${list}`);
      }

      if (args[0] === 'remove' && args[1]) {
        const num = args[1].replace(/[^0-9]/g, '');
        const jid = `${num}@s.whatsapp.net`;
        delete blacklist[jid];
        database.set('blacklist', blacklist);
        return extra.reply(`✅ *Removed from blacklist:* ${num}`);
      }

      const num = args[0].replace(/[^0-9]/g, '');
      const jid = `${num}@s.whatsapp.net`;
      const reason = args.slice(1).join(' ') || 'No reason provided';

      blacklist[jid] = { reason, date: new Date().toISOString(), by: extra.sender };
      database.set('blacklist', blacklist);

      await extra.reply(
        `🚫 *Number Blacklisted*\n\n` +
        `📱 Number: ${num}\n` +
        `📝 Reason: ${reason}\n\n` +
        `_They are now permanently blocked from the bot._`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
