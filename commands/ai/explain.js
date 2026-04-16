/**
 * Explain v3 — Ladybug Bot Mini
 * .explain <topic> [--eli5] [--expert] [--analogy]
 */
'use strict';
const APIs = require('../../utils/api');
module.exports = {
  name: 'explain',
  aliases: ['what', 'howdoes', 'breakdown', 'eli5'],
  category: 'ai',
  description: 'Explain any topic simply, with ELI5, expert, or analogy mode',
  usage: '.explain <topic> [--eli5] [--expert] [--analogy]',
  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('📚 *Explain v3*\n\nUsage: .explain <topic>\n\nFlags:\n  --eli5    — explain like I\'m 5\n  --expert  — deep technical explanation\n  --analogy — use a real-world analogy\n\nExamples:\n  .explain quantum entanglement --eli5\n  .explain blockchain --analogy\n\n> _Ladybug Bot Mini v3_');
      }
      let mode = 'clear and simple';
      const cleanArgs = [];
      for (const a of args) {
        if (a === '--eli5')    { mode = 'as if explaining to a 5-year-old with no technical knowledge'; }
        else if (a === '--expert')  { mode = 'at an expert technical level with all relevant details'; }
        else if (a === '--analogy') { mode = 'using a single real-world analogy that makes the concept crystal clear'; }
        else { cleanArgs.push(a); }
      }
      const topic = cleanArgs.join(' ').trim();
      if (!topic) return extra.reply('❌ Provide a topic to explain.');
      await extra.reply(`📚 Explaining: *${topic}*...`);
      await sock.sendPresenceUpdate('composing', extra.from);
      const prompt = `Explain "${topic}" ${mode}. Be accurate, engaging, and under 250 words. Use examples where helpful.`;
      const result = await APIs.chatAI(prompt, 'You are an expert teacher who makes complex ideas easy to understand.');
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`📚 *${topic}*\n━━━━━━━━━━━━━━━━━━━━\n${result}\n━━━━━━━━━━━━━━━━━━━━\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
