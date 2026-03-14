/**
 * 8Ball Command - Magic 8-ball answers
 */

const config = require('../../config');

const answers = [
  // Positive
  "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
  "Yes.", "Signs point to yes.",
  // Neutral
  "Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
  "Cannot predict now.", "Concentrate and ask again.",
  // Negative
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful."
];

module.exports = {
  name: '8ball',
  aliases: ['eightball', 'magicball', 'askball'],
  category: 'fun',
  description: 'Ask the magic 8-ball a question',
  usage: '.8ball <question>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('🎱 Please ask a question!\n\nExample: .8ball Will I be rich?');
      }
      
      const question = args.join(' ');
      const answer = answers[Math.floor(Math.random() * answers.length)];
      
      // Determine if answer is positive, neutral, or negative
      const positiveAnswers = ["It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
        "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.", "Yes.", "Signs point to yes."];
      const neutralAnswers = ["Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
        "Cannot predict now.", "Concentrate and ask again."];
      
      let emoji = '🎱';
      if (positiveAnswers.includes(answer)) {
        emoji = '✅';
      } else if (neutralAnswers.includes(answer)) {
        emoji = '🤔';
      } else {
        emoji = '❌';
      }
      
      const message = `🎱 *MAGIC 8-BALL*\n\n` +
                     `❓ Question: ${question}\n\n` +
                     `${emoji} *Answer:* ${answer}\n\n` +
                     `_Asked by ${config.botName}_`;
      
      await extra.reply(message);
      
    } catch (error) {
      console.error('8ball command error:', error);
      await extra.reply('❌ Failed to get answer. Please try again.');
    }
  }
};