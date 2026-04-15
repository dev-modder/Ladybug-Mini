/**
 * Quote Command - Send an inspirational/motivational quote
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Uses quotable.io API (free, no key needed)
 * Falls back to built-in quotes if API fails
 */

'use strict';

const axios = require('axios');

const FALLBACK_QUOTES = [
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { content: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { content: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { content: "Success is not final; failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { content: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { content: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { content: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { content: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { content: "An unexamined life is not worth living.", author: "Socrates" },
  { content: "Spread love everywhere you go.", author: "Mother Teresa" },
  { content: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { content: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { content: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { content: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
  { content: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { content: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
];

module.exports = {
  name: 'quote',
  aliases: ['quotes', 'inspiration', 'inspire', 'motivate', 'qod'],
  category: 'fun',
  description: 'Get a random inspirational quote',
  usage: '.quote',

  async execute(sock, msg, args, extra) {
    try {
      let quote = null;

      try {
        const res = await axios.get('https://api.quotable.io/random?maxLength=200', { timeout: 5000 });
        if (res.data && res.data.content) {
          quote = { content: res.data.content, author: res.data.author };
        }
      } catch {
        // API failed — use fallback silently
      }

      if (!quote) {
        quote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
      }

      await extra.reply(
        `💬 *Daily Quote*\n\n` +
        `_"${quote.content}"_\n\n` +
        `— *${quote.author}*`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
