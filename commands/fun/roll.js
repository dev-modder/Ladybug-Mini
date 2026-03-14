/**
 * Roll Command - Roll dice
 */

const config = require('../../config');

module.exports = {
  name: 'roll',
  aliases: ['dice', 'rolldice'],
  category: 'fun',
  description: 'Roll one or more dice',
  usage: '.roll [dice notation]',
  
  async execute(sock, msg, args, extra) {
    try {
      let diceCount = 1;
      let diceSides = 6;
      let modifier = 0;
      
      if (args.length > 0) {
        // Parse dice notation (e.g., 2d6, 1d20, 3d10+5)
        const notation = args[0].toLowerCase();
        const match = notation.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
        
        if (match) {
          diceCount = match[1] ? parseInt(match[1]) : 1;
          diceSides = parseInt(match[2]);
          modifier = match[3] ? parseInt(match[3]) : 0;
          
          // Limit dice count and sides
          diceCount = Math.min(Math.max(diceCount, 1), 20);
          diceSides = Math.min(Math.max(diceSides, 2), 1000);
          modifier = Math.max(Math.min(modifier, 1000), -1000);
        } else if (!isNaN(parseInt(notation))) {
          // Just a number = number of 6-sided dice
          diceCount = Math.min(Math.max(parseInt(notation), 1), 20);
        }
      }
      
      // Roll the dice
      const rolls = [];
      let total = 0;
      
      for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(roll);
        total += roll;
      }
      
      total += modifier;
      
      // Build response
      let message = `🎲 *DICE ROLL*\n\n`;
      message += `📋 Rolling: ${diceCount}d${diceSides}`;
      if (modifier !== 0) {
        message += modifier > 0 ? `+${modifier}` : modifier;
      }
      message += `\n\n`;
      
      if (diceCount === 1) {
        message += `🎲 Result: **${total}**`;
      } else {
        message += `🎲 Rolls: [${rolls.join(', ')}]\n`;
        if (modifier !== 0) {
          message += `📊 Base: ${rolls.reduce((a, b) => a + b, 0)}\n`;
          message += `📝 Modifier: ${modifier > 0 ? '+' : ''}${modifier}\n`;
        }
        message += `✨ Total: **${total}**`;
      }
      
      message += `\n\n_Rolled by ${config.botName}_`;
      
      await extra.reply(message);
      
    } catch (error) {
      console.error('Roll command error:', error);
      await extra.reply('❌ Failed to roll dice. Please try again.');
    }
  }
};