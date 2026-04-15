/**
 * FactCheck Command - AI fact-checks a statement (Ladybug V5)
 *
 * Usage: .factcheck <statement>
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
  throw new Error('AI unavailable right now.');
}

module.exports = {
  name: 'factcheck',
  aliases: ['fact', 'checkfact', 'verify'],
  category: 'ai',
  description: 'AI fact-checks a statement and gives a verdict',
  usage: '.factcheck <statement>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('🔍 Usage: .factcheck <statement>\n\nExample: .factcheck The Great Wall of China is visible from space');
      }

      const statement = args.join(' ');
      await sock.sendPresenceUpdate('composing', extra.from);

      const prompt =
        `Fact-check this statement: "${statement}"\n\n` +
        `Respond in this exact format:\n` +
        `VERDICT: [TRUE / FALSE / PARTIALLY TRUE / UNVERIFIED]\n` +
        `EXPLANATION: [2-4 sentence explanation with context]\n` +
        `CONFIDENCE: [High / Medium / Low]\n\n` +
        `Be accurate and neutral. If unsure, say Unverified.`;

      const result = await callAI(prompt);
      await sock.sendPresenceUpdate('paused', extra.from);

      await extra.reply(`🔍 *Fact Check*\n\n📌 *Statement:* ${statement}\n\n${result}\n\n_⚠️ AI fact-checks may have errors. Verify important claims independently._`);
    } catch (error) {
      console.error('[factcheck] Error:', error);
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
