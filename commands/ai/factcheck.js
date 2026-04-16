/**
 * FactCheck v3 — Ladybug Bot Mini
 * .factcheck <claim>
 */
'use strict';
const APIs = require('../../utils/api');
module.exports = {
  name: 'factcheck',
  aliases: ['fact', 'isittrue', 'verify', 'checkit'],
  category: 'ai',
  description: 'AI fact-checks any claim with reasoning and verdict',
  usage: '.factcheck <claim>',
  async execute(sock, msg, args, extra) {
    try {
      let claim = args.join(' ').trim();
      if (!claim) {
        const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        claim = (q?.conversation || q?.extendedTextMessage?.text || '').trim();
      }
      if (!claim) return extra.reply('🔍 *FactCheck v3*\n\nUsage: .factcheck <claim>\nOr reply to a message.\n\nExample: .factcheck The Great Wall of China is visible from space\n\n> _Ladybug Bot Mini v3_');
      await extra.reply(`🔍 Fact-checking: _${claim.slice(0,100)}_...`);
      await sock.sendPresenceUpdate('composing', extra.from);
      const prompt = `Fact-check this claim: "${claim}"\n\nRespond with:\n🔍 Claim: [restate the claim]\n✅/❌/⚠️ Verdict: [TRUE / FALSE / MISLEADING / UNVERIFIABLE]\n📖 Explanation: [clear explanation with reasoning, 2-4 sentences]\n📚 Context: [any important background info]\n\nBe accurate, neutral, and cite reasoning clearly.`;
      const result = await APIs.chatAI(prompt, 'You are a rigorous fact-checker. Be honest, cite reasoning, and clearly distinguish fact from opinion.');
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`${result}\n━━━━━━━━━━━━━━━━━━━━\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
