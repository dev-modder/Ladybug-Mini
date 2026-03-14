/**
 * Pick Command - Pick random option from list
 */

const config = require('../../config');

module.exports = {
  name: 'pick',
  aliases: ['choose', 'random', 'select'],
  category: 'fun',
  description: 'Pick a random option from a list',
  usage: '.pick option1 | option2 | option3',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply('❌ Please provide options to choose from!\n\n' +
          'Example: .pick Pizza | Burger | Sushi | Tacos');
      }
      
      const input = args.join(' ');
      
      // Split by | or , or space
      let options = input.includes('|') 
        ? input.split('|').map(o => o.trim())
        : input.includes(',') 
          ? input.split(',').map(o => o.trim())
          : args;
      
      // Filter out empty options
      options = options.filter(o => o.length > 0);
      
      if (options.length < 2) {
        return extra.reply('❌ Please provide at least 2 options!\n\n' +
          'Separate options with | or , or space\n' +
          'Example: .pick Pizza | Burger | Sushi');
      }
      
      const picked = options[Math.floor(Math.random() * options.length)];
      const index = options.indexOf(picked) + 1;
      
      const message = `🤔 *RANDOM PICK*\n\n` +
                     `📋 Options:\n${options.map((o, i) => `   ${i + 1}. ${o}`).join('\n')}\n\n` +
                     `✨ I pick: **${picked}** (Option ${index})\n\n` +
                     `_Picked by ${config.botName}_`;
      
      await extra.reply(message);
      
    } catch (error) {
      console.error('Pick command error:', error);
      await extra.reply('❌ Failed to pick. Please try again.');
    }
  }
};