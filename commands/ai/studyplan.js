/**
 * StudyPlan v3 — Ladybug Bot Mini
 * .studyplan <subject> [--weeks <n>] [--level beginner|intermediate|advanced]
 */
'use strict';
const APIs = require('../../utils/api');
module.exports = {
  name: 'studyplan',
  aliases: ['study', 'learnplan', 'curriculum', 'syllabus'],
  category: 'ai',
  description: 'Generate a structured study plan for any subject',
  usage: '.studyplan <subject> [--weeks <n>] [--level beginner|intermediate|advanced]',
  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) return extra.reply('📅 *StudyPlan v3*\n\nUsage: .studyplan <subject>\n\nOptions:\n  --weeks <n>    — plan duration (1-12)\n  --level beginner|intermediate|advanced\n\nExamples:\n  .studyplan JavaScript --weeks 4 --level beginner\n  .studyplan A-Level Mathematics --weeks 8 --level advanced\n\n> _Ladybug Bot Mini v3_');
      let weeks = 4, level = 'beginner';
      const cleanArgs = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--weeks' && args[i+1]) { weeks = Math.min(12, Math.max(1, parseInt(args[++i]) || 4)); }
        else if (args[i] === '--level' && args[i+1]) { level = args[++i].toLowerCase(); }
        else { cleanArgs.push(args[i]); }
      }
      const subject = cleanArgs.join(' ').trim();
      if (!subject) return extra.reply('❌ Please provide a subject.');
      await extra.reply(`📅 Creating *${weeks}-week* study plan for *${subject}* (${level} level)...`);
      await sock.sendPresenceUpdate('composing', extra.from);
      const prompt = `Create a structured ${weeks}-week study plan for a ${level}-level student studying "${subject}".\n\nFormat:\n📅 *${subject} — ${weeks}-Week Plan (${level})*\n\nFor each week provide:\n• Week N: [Theme]\n  - Topics: [list]\n  - Goals: [1-2 goals]\n  - Resources: [book/website/tool]\n  - Practice: [exercise type]\n\nEnd with: Tips for success and recommended resources.\n\nBe specific and realistic.`;
      const result = await APIs.chatAI(prompt, 'You are an expert educator and curriculum designer. Create practical, achievable study plans.');
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`${result}\n\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
