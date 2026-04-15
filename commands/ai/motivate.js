/**
 * Motivate Command - AI generates personalized motivational messages (Ladybug V5)
 *
 * Usage: .motivate
 *        .motivate <situation/feeling>
 */

'use strict';

const axios = require('axios');

const FALLBACKS = [
  "🌟 Every expert was once a beginner. Keep going — your progress matters more than your pace.",
  "💪 You've survived 100% of your bad days so far. Today is no different. You've got this.",
  "🚀 The only limit is the one you set in your mind. Push past it — one step at a time.",
  "🔥 Difficult roads often lead to beautiful destinations. Stay the course.",
  "🌈 Your struggle today is your strength tomorrow. Don't stop now.",
  "⭐ You are capable of amazing things. Believe it. Act on it. Prove it.",
  "🏆 Success isn't about being perfect — it's about never giving up. Keep pushing.",
];

async function callAI(prompt) {
  const endpoints = [
    `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/chatgpt?query=${encodeURIComponent(prompt)}`,
    `https://widipe.com/openai?text=${encodeURIComponent(prompt)}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await axios.get(url, { timeout: 12000 });
      const d = r.data;
      const ans = d?.msg || d?.result || d?.data?.text || d?.response;
      if (ans && ans.trim().length > 10) return ans.trim();
    } catch (_) {}
  }
  return null;
}

module.exports = {
  name: 'motivate',
  aliases: ['motivation', 'inspire', 'hype', 'cheer'],
  category: 'ai',
  description: 'Get a personalized AI motivational message',
  usage: '.motivate [situation or feeling]',

  async execute(sock, msg, args, extra) {
    try {
      const senderName = msg.pushName || 'Champion';
      const situation  = args.join(' ').trim();

      await sock.sendPresenceUpdate('composing', extra.from);

      let prompt;
      if (situation) {
        prompt = `Write a powerful, personal, and uplifting motivational message for someone named ${senderName} who is going through this situation: "${situation}". Be genuine, warm, and empowering. Include 1-2 relevant emojis. Keep it under 120 words.`;
      } else {
        prompt = `Write a short, punchy, and genuinely inspiring motivational message for ${senderName}. Make it personal and energetic. Include 1-2 emojis. Keep it under 100 words.`;
      }

      const result = await callAI(prompt);
      await sock.sendPresenceUpdate('paused', extra.from);

      const message = result || FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      await extra.reply(`✨ *For you, ${senderName}*\n\n${message}`);
    } catch (error) {
      console.error('[motivate] Error:', error);
      const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      await extra.reply(`✨ ${fallback}`);
    }
  },
};
