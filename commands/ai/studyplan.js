/**
 * Study Plan Generator Command
 * Ladybug Bot Mini V5 | by Dev-Ntando (Ntandoyenkosi Chisaya, Zimbabwe)
 *
 * AI generates a personalized study plan for any student.
 * - Tailored to ZIMSEC O-Level, A-Level, or any curriculum
 * - Generates weekly and daily timetables
 * - Subject-specific revision strategies
 * - Exam countdown plans
 * - Motivational study goals
 *
 * Usage:
 *   .studyplan <subjects> for <level>
 *   .studyplan weekly maths,english,science for O-Level
 *   .studyplan daily physics,chemistry for A-Level
 *   .studyplan exam 30 days maths,biology
 *   .studyplan revision <subject>
 *
 * Aliases: study, timetable, studytable, revision, revise, planstudy
 */

'use strict';

const axios = require('axios');

// ─── AI call ──────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  const apis = [
    async () => {
      const r = await axios.get('https://api.shizo.top/ai/gpt', {
        params: { apikey: 'shizo', query: prompt }, timeout: 25000,
      });
      return r?.data?.msg || r?.data?.response || (typeof r?.data === 'string' ? r.data : null);
    },
    async () => {
      const r = await axios.get('https://api.siputzx.my.id/api/ai/chatgpt', {
        params: { text: prompt }, timeout: 20000,
      });
      return r?.data?.data || r?.data?.msg;
    },
  ];
  for (const fn of apis) {
    try { const r = await fn(); if (r && String(r).length > 2) return String(r).trim(); } catch (_) {}
  }
  return '❌ AI is temporarily unavailable. Please try again.';
}

// ─── Module export ─────────────────────────────────────────────────────────────
module.exports = {
  name: 'studyplan',
  aliases: ['study', 'timetable', 'studytable', 'revision', 'revise', 'planstudy'],
  category: 'ai',
  description: 'AI generates a personalized study plan or timetable for ZIMSEC and other exams',
  usage: '.studyplan <subjects> | .studyplan weekly | .studyplan exam <days> | .studyplan revision <subject>',

  async execute(sock, msg, args, extra) {
    const chatId    = extra?.from || msg.key.remoteJid;
    const senderName = msg.pushName || msg.key.remoteJid.split('@')[0] || 'Student';
    const sub = (args[0] || '').toLowerCase();

    // ── No args: show help ─────────────────────────────────────────────────────
    if (!sub) {
      return extra.reply(
        '📅 *AI Study Planner*\n\n' +
        'Usage:\n\n' +
        '  *.studyplan <subjects>*\n' +
        '   e.g. .studyplan maths,english,science\n\n' +
        '  *.studyplan weekly <subjects> <level>*\n' +
        '   e.g. .studyplan weekly physics,chemistry A-Level\n\n' +
        '  *.studyplan daily <subjects>*\n' +
        '   e.g. .studyplan daily maths,biology\n\n' +
        '  *.studyplan exam <days> <subjects>*\n' +
        '   e.g. .studyplan exam 30 maths,science\n\n' +
        '  *.studyplan revision <subject>*\n' +
        '   e.g. .studyplan revision chemistry\n\n' +
        '  *.studyplan tips <subject>*\n' +
        '   e.g. .studyplan tips english\n\n' +
        '> _Ladybug Study Planner — Dev-Ntando 🇿🇼_'
      );
    }

    await sock.sendPresenceUpdate('composing', chatId);

    // ── Exam countdown plan ────────────────────────────────────────────────────
    if (sub === 'exam') {
      const days = parseInt(args[1]) || 30;
      const subjects = args.slice(2).join(' ') || 'all my subjects';
      await extra.reply('📅 Creating a *' + days + '-day exam study plan* for ' + senderName + '...');
      const prompt =
        'Create a detailed ' + days + '-day exam preparation study plan for a ZIMSEC student named ' + senderName + '.\n' +
        'Subjects: ' + subjects + '\n\n' +
        'Structure the plan as:\n' +
        '📅 WEEK-BY-WEEK BREAKDOWN:\n' +
        '- Week 1 (Days 1-7): Focus area\n' +
        '- Week 2 (Days 8-14): Focus area\n' +
        '... etc\n\n' +
        '📆 DAILY SCHEDULE TEMPLATE:\n' +
        '- Morning session (time + subject)\n' +
        '- Afternoon session\n' +
        '- Evening review\n\n' +
        '⭐ KEY STRATEGIES:\n' +
        '- Revision techniques\n' +
        '- Past paper practice schedule\n' +
        '- Rest and breaks\n\n' +
        '💪 MOTIVATION: Include 3 motivational points\n\n' +
        'Use Zimbabwe exam context. Make it practical and achievable.';
      const result = await callAI(prompt);
      return extra.reply('📅 *' + days + '-Day Exam Plan for ' + senderName + '*\n\n' + result + '\n\n> _Ladybug Study Planner — Dev-Ntando 🇿🇼_');
    }

    // ── Weekly timetable ───────────────────────────────────────────────────────
    if (sub === 'weekly' || sub === 'week') {
      const rest = args.slice(1).join(' ');
      const levelMatch = rest.match(/o[-\s]?level|a[-\s]?level|form\s*\d|grade\s*\d|university/i);
      const level = levelMatch ? levelMatch[0] : 'O-Level';
      const subjects = rest.replace(levelMatch?.[0] || '', '').trim() || 'maths, english, science';

      await extra.reply('📅 Building weekly timetable...');
      const prompt =
        'Create a comprehensive weekly study timetable for a ' + level + ' ZIMSEC student named ' + senderName + '.\n' +
        'Subjects: ' + subjects + '\n\n' +
        'Format as a clear weekly timetable:\n\n' +
        '📅 WEEKLY TIMETABLE\n\n' +
        'Monday:\n  🌅 Morning (6am-8am): [subject + topic]\n  🌞 Afternoon (2pm-5pm): [subject + topic]\n  🌙 Evening (7pm-9pm): [review]\n\n' +
        '... (all 7 days, including weekend lighter study)\n\n' +
        '⏰ RULES:\n' +
        '- 45 min study blocks with 15 min breaks\n' +
        '- Harder subjects in the morning when mind is fresh\n' +
        '- Sunday = lighter review + rest\n' +
        '- Include exercise time\n\n' +
        'Make it realistic and achievable for a Zimbabwean student.';
      const result = await callAI(prompt);
      return extra.reply(result);
    }

    // ── Daily plan ─────────────────────────────────────────────────────────────
    if (sub === 'daily' || sub === 'day') {
      const subjects = args.slice(1).join(' ') || 'maths, english, science';
      await extra.reply('📅 Creating daily study schedule...');
      const prompt =
        'Create an ideal daily study schedule for a ZIMSEC student named ' + senderName + '.\n' +
        'Subjects: ' + subjects + '\n\n' +
        'Format:\n' +
        '⏰ IDEAL STUDY DAY\n\n' +
        'Time — Activity\n' +
        '5:30am — Wake up & freshen up\n' +
        '6:00am — [Subject] for 45 mins...\n' +
        '... (full day schedule)\n\n' +
        'Include:\n' +
        '- Meals and breaks\n' +
        '- Exercise\n' +
        '- Evening review\n' +
        '- Sleep time\n' +
        '- Study techniques for each session (e.g. flashcards, past papers, mindmaps)\n\n' +
        'Make it practical for a Zimbabwean student context.';
      const result = await callAI(prompt);
      return extra.reply(result);
    }

    // ── Revision plan for one subject ──────────────────────────────────────────
    if (sub === 'revision' || sub === 'revise') {
      const subject = args.slice(1).join(' ') || 'Mathematics';
      await extra.reply('📚 Creating revision plan for *' + subject + '*...');
      const prompt =
        'Create a detailed revision plan for ZIMSEC ' + subject + ' for a student named ' + senderName + '.\n\n' +
        'Include:\n' +
        '📋 TOPIC CHECKLIST (all ZIMSEC ' + subject + ' topics)\n' +
        '  ☐ [Topic 1]\n  ☐ [Topic 2]\n  ... etc\n\n' +
        '📅 2-WEEK REVISION SCHEDULE:\n' +
        '  Week 1: Focus on weak topics\n' +
        '  Week 2: Past papers + revision\n\n' +
        '📝 REVISION TECHNIQUES:\n' +
        '  - Best methods for ' + subject + '\n' +
        '  - How to use past papers\n' +
        '  - Notes-making strategy\n\n' +
        '⭐ EXAM DAY TIPS for ' + subject + '\n\n' +
        'Make it specific to ZIMSEC ' + subject + ' curriculum.';
      const result = await callAI(prompt);
      return extra.reply(result);
    }

    // ── Study tips ─────────────────────────────────────────────────────────────
    if (sub === 'tips') {
      const subject = args.slice(1).join(' ') || 'all subjects';
      await extra.reply('💡 Getting study tips for *' + subject + '*...');
      const prompt =
        'Give 10 powerful study tips specifically for ZIMSEC ' + subject + ' for a student in Zimbabwe.\n' +
        'Include:\n' +
        '- How to study this subject effectively\n' +
        '- Memory techniques (mnemonics, etc.)\n' +
        '- How to revise for ZIMSEC exams\n' +
        '- Time management in exams\n' +
        '- Resources available in Zimbabwe for this subject\n' +
        '- Motivational tips to keep going';
      const result = await callAI(prompt);
      return extra.reply('💡 *Study Tips: ' + subject.toUpperCase() + '*\n\n' + result + '\n\n> _Ladybug Study Planner — Dev-Ntando 🇿🇼_');
    }

    // ── General: subjects listed ───────────────────────────────────────────────
    const subjects = args.join(' ') || 'all subjects';
    await extra.reply('📅 Creating study plan for *' + subjects + '*...');
    const prompt =
      'Create a practical and motivating study plan for a ZIMSEC student named ' + senderName + '.\n' +
      'Subjects: ' + subjects + '\n\n' +
      'Include:\n' +
      '📚 Subject priority order (hardest first)\n' +
      '⏰ Recommended study hours per subject per week\n' +
      '📅 Basic weekly schedule\n' +
      '📝 Best revision method for each subject\n' +
      '💡 3 key success tips\n' +
      '💪 A motivational message for a Zimbabwean student\n\n' +
      'Keep it practical, encouraging and Zimbabwe-relevant.';
    const result = await callAI(prompt);
    return extra.reply('📅 *Study Plan for ' + senderName + '*\n\n' + result + '\n\n> _Ladybug Study Planner — Dev-Ntando 🇿🇼_');
  },
};
