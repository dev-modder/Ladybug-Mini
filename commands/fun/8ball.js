/**
 * 8ball Command - Ask the magic 8 ball a question
 * Ladybug Bot V5 | by Dev-Ntando
 */

'use strict';

module.exports = {
  name: '8ball',
  aliases: ['magic8', 'eightball', '8b'],
  category: 'fun',
  description: 'Ask the magic 8 ball any yes/no question',
  usage: '.8ball <question>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🎱 *Magic 8 Ball*\n\n` +
          `You need to ask a question!\n` +
          `Usage: .8ball Will I be rich?`
        );
      }

      const question = args.join(' ');

      const responses = [
        // Positive
        { text: 'It is certain.', type: '🟢' },
        { text: 'It is decidedly so.', type: '🟢' },
        { text: 'Without a doubt.', type: '🟢' },
        { text: 'Yes, definitely!', type: '🟢' },
        { text: 'You may rely on it.', type: '🟢' },
        { text: 'As I see it, yes.', type: '🟢' },
        { text: 'Most likely.', type: '🟢' },
        { text: 'Outlook good.', type: '🟢' },
        { text: 'Yes.', type: '🟢' },
        { text: 'Signs point to yes.', type: '🟢' },
        // Neutral
        { text: 'Reply hazy, try again.', type: '🟡' },
        { text: 'Ask again later.', type: '🟡' },
        { text: 'Better not tell you now.', type: '🟡' },
        { text: 'Cannot predict now.', type: '🟡' },
        { text: 'Concentrate and ask again.', type: '🟡' },
        // Negative
        { text: "Don't count on it.", type: '🔴' },
        { text: 'My reply is no.', type: '🔴' },
        { text: 'My sources say no.', type: '🔴' },
        { text: 'Outlook not so good.', type: '🔴' },
        { text: 'Very doubtful.', type: '🔴' },
      ];

      const pick = responses[Math.floor(Math.random() * responses.length)];

      await extra.reply(
        `🎱 *Magic 8 Ball*\n\n` +
        `❓ *Question:* ${question}\n\n` +
        `${pick.type} *Answer:* ${pick.text}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
