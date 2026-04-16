/**
 * SchoolAI v3 — Ladybug Bot Mini
 * .school <question>  — helps with homework, ZIMSEC, Cambridge, etc.
 */
'use strict';
const APIs = require('../../utils/api');
module.exports = {
  name: 'school',
  aliases: ['schoolai', 'homework', 'hw', 'zimsec', 'cambridge', 'study'],
  category: 'ai',
  description: 'AI homework helper: maths, science, history, English and more',
  usage: '.school <question or topic>',
  async execute(sock, msg, args, extra) {
    try {
      const question = args.join(' ').trim();
      if (!question) return extra.reply('🎓 *School AI v3*\n\nUsage: .school <question>\n\nExamples:\n  .school explain photosynthesis\n  .school solve: 3x + 5 = 20\n  .school write an essay about climate change\n  .school ZIMSEC history: causes of WW1\n\n> _Ladybug Bot Mini v3_');
      await extra.reply(`🎓 *Solving:* ${question.slice(0, 80)}...`);
      await sock.sendPresenceUpdate('composing', extra.from);
      const prompt = `You are a helpful tutor for students, especially those studying ZIMSEC, Cambridge O-Level and A-Level, and general school subjects.\n\nAnswer this student's question clearly and thoroughly:\n"${question}"\n\nIf it's a maths problem, show full working. If it's an essay question, provide a structured answer. If it's a concept, explain clearly with examples. Use student-friendly language.`;
      const result = await APIs.chatAI(prompt, 'You are an expert tutor for school students. Be thorough, clear, and educational.');
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`🎓 *Answer*\n━━━━━━━━━━━━━━━━━━━━\n${result}\n━━━━━━━━━━━━━━━━━━━━\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
