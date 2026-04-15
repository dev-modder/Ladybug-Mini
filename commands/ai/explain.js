/**
 * Explain Command - AI explains any topic simply (Ladybug V5)
 *
 * Usage: .explain <topic> [for <level>]
 * Example: .explain photosynthesis for grade 5
 * Example: .explain quantum computing for beginners
 */

'use strict';

const axios = require('axios');

async function callAI(prompt) {
  const endpoints = [
    `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/chatgpt?query=${encodeURIComponent(prompt)}`,
    `https://widipe.com/openai?text=${encodeURIComponent(prompt)}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await axios.get(url, { timeout: 15000 });
      const d = r.data;
      const ans = d?.msg || d?.result || d?.data?.text || d?.response;
      if (ans && ans.trim().length > 5) return ans.trim();
    } catch (_) {}
  }
  throw new Error('AI unavailable right now. Try again shortly.');
}

module.exports = {
  name: 'explain',
  aliases: ['eli5', 'simplify', 'breakdown'],
  category: 'ai',
  description: 'AI explains any topic simply and clearly',
  usage: '.explain <topic> [for <audience>]',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('💡 Usage: .explain <topic>\n\nExamples:\n.explain gravity\n.explain photosynthesis for grade 5\n.explain blockchain for beginners');
      }

      const input = args.join(' ');
      let topic = input;
      let audience = 'a general audience';

      if (input.toLowerCase().includes(' for ')) {
        const parts = input.split(/ for /i);
        topic = parts[0].trim();
        audience = parts.slice(1).join(' for ').trim();
      }

      await sock.sendPresenceUpdate('composing', extra.from);

      const prompt = `Explain "${topic}" clearly and simply for ${audience}. Use:\n- A plain-language intro (1-2 sentences)\n- 3-5 key points\n- A simple real-world analogy or example\n- A one-sentence summary at the end\nKeep it under 300 words. Format nicely with emoji bullets.`;

      const answer = await callAI(prompt);
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`💡 *Explaining: ${topic}*\n_(for ${audience})_\n\n${answer}`);
    } catch (error) {
      console.error('[explain] Error:', error);
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
