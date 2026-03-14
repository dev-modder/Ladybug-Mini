/**
 * Math Command - Math quiz game
 */

const config = require('../../config');

// Store active games
const activeGames = new Map();

module.exports = {
  name: 'math',
  aliases: ['mathgame', 'quiz', 'mathquiz'],
  category: 'fun',
  description: 'Play a math quiz game',
  usage: '.math [difficulty]',
  
  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;
      const difficulty = args[0]?.toLowerCase() || 'medium';
      
      // Check if there's already an active game
      if (activeGames.has(chatId)) {
        return extra.reply('⚠️ There is already an active math game in this chat!\n\nAnswer the current question or wait for it to expire.');
      }
      
      // Generate question based on difficulty
      let num1, num2, operator, answer;
      
      switch (difficulty) {
        case 'easy':
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          operator = ['+', '-'][Math.floor(Math.random() * 2)];
          break;
        case 'hard':
          num1 = Math.floor(Math.random() * 100) + 1;
          num2 = Math.floor(Math.random() * 100) + 1;
          operator = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];
          break;
        case 'medium':
        default:
          num1 = Math.floor(Math.random() * 50) + 1;
          num2 = Math.floor(Math.random() * 50) + 1;
          operator = ['+', '-', '×'][Math.floor(Math.random() * 3)];
      }
      
      // Calculate answer
      switch (operator) {
        case '+':
          answer = num1 + num2;
          break;
        case '-':
          answer = num1 - num2;
          break;
        case '×':
          answer = num1 * num2;
          break;
        case '÷':
          // Make sure division results in whole number
          num1 = num2 * (Math.floor(Math.random() * 10) + 1);
          answer = num1 / num2;
          break;
      }
      
      const question = `${num1} ${operator} ${num2} = ?`;
      
      // Store the game
      activeGames.set(chatId, {
        answer: answer.toString(),
        timestamp: Date.now()
      });
      
      // Send question
      const message = `🧮 *MATH QUIZ*\n\n` +
                     `📊 Difficulty: ${difficulty.toUpperCase()}\n` +
                     `❓ Question: ${question}\n\n` +
                     `⏱️ You have 60 seconds to answer!\n` +
                     `💡 Reply with the number`;
      
      await extra.reply(message);
      
      // Set timeout for game
      setTimeout(() => {
        if (activeGames.has(chatId)) {
          const game = activeGames.get(chatId);
          activeGames.delete(chatId);
          sock.sendMessage(chatId, {
            text: `⏰ *TIME'S UP!*\n\n` +
                  `The answer was: **${game.answer}**\n\n` +
                  `_Play again with .math_`
          });
        }
      }, 60000);
      
      // Export for checking answers
      global.mathGames = activeGames;
      
    } catch (error) {
      console.error('Math command error:', error);
      await extra.reply('❌ Failed to start math game. Please try again.');
    }
  }
};

// Export games map
module.exports.activeGames = activeGames;