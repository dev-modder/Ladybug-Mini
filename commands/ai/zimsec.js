/**
 * ZIMSEC Helper Command
 * Ladybug Bot Mini V5 | by Dev-Ntando (Ntandoyenkosi Chisaya, Zimbabwe)
 *
 * Dedicated ZIMSEC curriculum assistant.
 * - Past paper questions and model answers
 * - Syllabus topic breakdowns
 * - Marking scheme guidance
 * - Grade boundary information
 * - Subject-specific study tips
 * - O-Level and A-Level support
 *
 * Usage:
 *   .zimsec <subject> <topic>            — explain a ZIMSEC topic
 *   .zimsec pastpaper <subject> <year>   — generate past paper style questions
 *   .zimsec syllabus <subject>           — list key syllabus topics
 *   .zimsec tips <subject>               — exam tips for a subject
 *   .zimsec grade                        — explain grading system
 *   .zimsec subjects                     — list all ZIMSEC subjects
 *
 * Aliases: zim, zimsecai, ozlevel, alevel
 */

'use strict';

const axios = require('axios');

// ─── ZIMSEC Subject Database ──────────────────────────────────────────────────
const SUBJECTS = {
  // O-Level
  'english language': { code: '1122', level: 'O-Level', alias: ['english', 'eng'] },
  'mathematics': { code: '4004', level: 'O-Level', alias: ['maths', 'math'] },
  'combined science': { code: '5006', level: 'O-Level', alias: ['science', 'sci'] },
  'physics': { code: '5054', level: 'O-Level', alias: ['phy'] },
  'chemistry': { code: '5070', level: 'O-Level', alias: ['chem'] },
  'biology': { code: '5090', level: 'O-Level', alias: ['bio'] },
  'history': { code: '2190', level: 'O-Level', alias: ['hist'] },
  'geography': { code: '2217', level: 'O-Level', alias: ['geo', 'geog'] },
  'accounts': { code: '7110', level: 'O-Level', alias: ['accounting', 'acc'] },
  'commerce': { code: '7100', level: 'O-Level', alias: ['com', 'business studies'] },
  'shona': { code: '3170', level: 'O-Level', alias: [] },
  'ndebele': { code: '3158', level: 'O-Level', alias: [] },
  'literature in english': { code: '2010', level: 'O-Level', alias: ['literature', 'lit'] },
  'computer science': { code: '2210', level: 'O-Level', alias: ['computer', 'ict', 'cs'] },
  'agriculture': { code: '5038', level: 'O-Level', alias: ['agri', 'farming'] },
  'art & design': { code: '6090', level: 'O-Level', alias: ['art', 'art and design'] },
  // A-Level
  'advanced mathematics': { code: '9709', level: 'A-Level', alias: ['a level maths', 'further maths'] },
  'advanced physics': { code: '9702', level: 'A-Level', alias: ['a level physics'] },
  'advanced chemistry': { code: '9701', level: 'A-Level', alias: ['a level chemistry'] },
  'advanced biology': { code: '9700', level: 'A-Level', alias: ['a level biology'] },
  'advanced economics': { code: '9708', level: 'A-Level', alias: ['economics', 'econ'] },
  'advanced history': { code: '9489', level: 'A-Level', alias: ['a level history'] },
  'advanced geography': { code: '9696', level: 'A-Level', alias: ['a level geography'] },
  'advanced accounts': { code: '9706', level: 'A-Level', alias: ['advanced accounting'] },
};

function findSubject(query) {
  const q = query.toLowerCase().trim();
  for (const [name, data] of Object.entries(SUBJECTS)) {
    if (q === name || data.alias.includes(q) || name.includes(q) || q.includes(name.split(' ')[0])) {
      return { name, ...data };
    }
  }
  return null;
}

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
  return '❌ AI is temporarily unavailable. Try again!';
}

// ─── Module export ────────────────────────────────────────────────────────────
module.exports = {
  name: 'zimsec',
  aliases: ['zim', 'zimsecai', 'olevel', 'alevel'],
  category: 'ai',
  description: 'ZIMSEC curriculum helper — topics, past papers, syllabus, exam tips',
  usage: '.zimsec <subject> <topic> | pastpaper <subject> | syllabus <subject> | tips <subject> | grade | subjects',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;
    const sub    = (args[0] || '').toLowerCase();

    // ── List subjects ──────────────────────────────────────────────────────────
    if (!sub || sub === 'subjects' || sub === 'list') {
      const oLevelList = Object.entries(SUBJECTS)
        .filter(([, d]) => d.level === 'O-Level')
        .map(([n, d]) => '  • ' + n.charAt(0).toUpperCase() + n.slice(1) + ' (' + d.code + ')')
        .join('\n');
      const aLevelList = Object.entries(SUBJECTS)
        .filter(([, d]) => d.level === 'A-Level')
        .map(([n, d]) => '  • ' + n.charAt(0).toUpperCase() + n.slice(1) + ' (' + d.code + ')')
        .join('\n');
      return extra.reply(
        '📚 *ZIMSEC Subjects*\n\n' +
        '🎓 *O-Level Subjects:*\n' + oLevelList + '\n\n' +
        '🏆 *A-Level Subjects:*\n' + aLevelList + '\n\n' +
        'Usage examples:\n' +
        '  .zimsec maths algebra\n' +
        '  .zimsec pastpaper chemistry\n' +
        '  .zimsec syllabus biology\n' +
        '  .zimsec tips english\n\n' +
        '> _Ladybug ZIMSEC AI — Dev-Ntando 🇿🇼_'
      );
    }

    // ── Grading system ─────────────────────────────────────────────────────────
    if (sub === 'grade' || sub === 'grades' || sub === 'grading') {
      return extra.reply(
        '📊 *ZIMSEC Grading System*\n\n' +
        '🎓 *O-Level Grades:*\n' +
        '  A — 75-100% (Distinction)\n' +
        '  B — 60-74% (Merit)\n' +
        '  C — 50-59% (Pass)\n' +
        '  D — 40-49% (Below Average)\n' +
        '  E — 30-39% (Fail)\n' +
        '  U — Below 30% (Ungraded)\n\n' +
        '🏆 *A-Level Grades:*\n' +
        '  A* — 90-100%\n' +
        '  A  — 80-89%\n' +
        '  B  — 70-79%\n' +
        '  C  — 60-69%\n' +
        '  D  — 50-59%\n' +
        '  E  — 40-49%\n' +
        '  U  — Below 40%\n\n' +
        '📋 *University Entry Requirements:*\n' +
        '  5 O-Levels with C or better (including English & Maths)\n' +
        '  2 A-Level passes for degree entry\n' +
        '  3 A-Level passes for competitive programs\n\n' +
        '> _Ladybug ZIMSEC AI — Dev-Ntando 🇿🇼_'
      );
    }

    // ── Past paper questions ───────────────────────────────────────────────────
    if (sub === 'pastpaper' || sub === 'past' || sub === 'pp') {
      const subjectQuery = args.slice(1, -1).join(' ') || args.slice(1).join(' ');
      const year = args[args.length - 1]?.match(/\d{4}/) ? args[args.length - 1] : '2023';
      const subjInfo = findSubject(subjectQuery.replace(/\d{4}/g, '').trim());
      const subjName = subjInfo ? subjInfo.name : (subjectQuery || 'Mathematics');

      await sock.sendPresenceUpdate('composing', chatId);
      await extra.reply('📝 Generating ZIMSEC-style past paper for *' + subjName + '*...');

      const prompt =
        'Generate 5 ZIMSEC-style exam questions for ' + subjName + ' at ' + (subjInfo?.level || 'O-Level') + ' level, similar to ' + year + ' past paper style.\n\n' +
        'Format each question like a real ZIMSEC exam:\n' +
        'Q1. [question with marks in brackets e.g. [3 marks]]\n' +
        '   (a) [part a]\n' +
        '   (b) [part b]\n\n' +
        'After all questions, provide MODEL ANSWERS with full working.\n' +
        'Include marking scheme notes. Use Zimbabwe context in word problems.';

      const result = await callAI(prompt);
      return extra.reply(
        '📝 *ZIMSEC-Style Questions: ' + subjName.toUpperCase() + '*\n\n' + result +
        '\n\n> _Ladybug ZIMSEC AI — Dev-Ntando 🇿🇼_'
      );
    }

    // ── Syllabus breakdown ─────────────────────────────────────────────────────
    if (sub === 'syllabus' || sub === 'topics') {
      const subjectQuery = args.slice(1).join(' ');
      const subjInfo = findSubject(subjectQuery);
      const subjName = subjInfo ? subjInfo.name : (subjectQuery || 'Mathematics');

      await sock.sendPresenceUpdate('composing', chatId);
      const prompt =
        'List all key topics in the ZIMSEC ' + (subjInfo?.level || 'O-Level') + ' ' + subjName + ' syllabus.\n\n' +
        'Format:\n' +
        '📘 ZIMSEC ' + (subjInfo?.level || 'O-Level') + ' ' + subjName.toUpperCase() + ' SYLLABUS\n\n' +
        'For each topic:\n' +
        '🔹 Topic Name\n' +
        '   - Key concepts to know\n' +
        '   - Likely exam questions\n' +
        '   - Mark allocation (if known)\n\n' +
        'Also include: ⭐ Most important topics, 💡 Common exam mistakes, 📅 Study time recommendation.';

      const result = await callAI(prompt);
      return extra.reply(result);
    }

    // ── Exam tips ──────────────────────────────────────────────────────────────
    if (sub === 'tips' || sub === 'advice') {
      const subjectQuery = args.slice(1).join(' ');
      const subjInfo = findSubject(subjectQuery);
      const subjName = subjInfo ? subjInfo.name : (subjectQuery || 'all subjects');

      await sock.sendPresenceUpdate('composing', chatId);
      const prompt =
        'Give 10 practical ZIMSEC exam tips specifically for ' + subjName + ' at ' + (subjInfo?.level || 'O-Level') + ' level.\n\n' +
        'Include:\n' +
        '- Time management in the exam\n' +
        '- What examiners look for\n' +
        '- Common mistakes to avoid\n' +
        '- How to structure answers\n' +
        '- Last minute revision tips\n' +
        '- How to handle questions you are unsure about\n\n' +
        'Make tips specific to ZIMSEC marking criteria.';

      const result = await callAI(prompt);
      return extra.reply(
        '💡 *ZIMSEC ' + subjName.toUpperCase() + ' Exam Tips*\n\n' + result +
        '\n\n> _Ladybug ZIMSEC AI — Dev-Ntando 🇿🇼_'
      );
    }

    // ── General subject topic question ─────────────────────────────────────────
    const subjectQuery = sub;
    const topicQuery   = args.slice(1).join(' ').trim();
    const subjInfo     = findSubject(subjectQuery);
    const subjName     = subjInfo ? subjInfo.name : subjectQuery;

    if (!topicQuery) {
      return extra.reply(
        '📚 *ZIMSEC AI Helper*\n\n' +
        'Usage:\n' +
        '  .zimsec <subject> <topic>\n' +
        '  .zimsec pastpaper <subject>\n' +
        '  .zimsec syllabus <subject>\n' +
        '  .zimsec tips <subject>\n' +
        '  .zimsec grade\n' +
        '  .zimsec subjects\n\n' +
        'Examples:\n' +
        '  .zimsec maths quadratic equations\n' +
        '  .zimsec chemistry electrolysis\n' +
        '  .zimsec english argumentative essay\n' +
        '  .zimsec pastpaper physics\n\n' +
        '> _Ladybug ZIMSEC AI — Dev-Ntando 🇿🇼_'
      );
    }

    await sock.sendPresenceUpdate('composing', chatId);
    const prompt =
      'You are a ZIMSEC ' + (subjInfo?.level || 'O-Level') + ' ' + subjName + ' tutor.\n\n' +
      'Explain "' + topicQuery + '" for a ZIMSEC student.\n\n' +
      'Include:\n' +
      '📖 Clear explanation with definitions\n' +
      '📐 Examples with full working (for science/maths)\n' +
      '🌍 Zimbabwe-based real-life examples\n' +
      '📝 How this is tested in ZIMSEC exams\n' +
      '⭐ Key points to memorize\n' +
      '⚠️ Common mistakes students make\n' +
      '💡 Quick memory trick if applicable';

    const result = await callAI(prompt);
    return extra.reply(result);
  },
};
