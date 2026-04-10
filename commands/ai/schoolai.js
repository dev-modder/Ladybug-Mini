/**
 * School AI Tutor Command
 * Ladybug Bot Mini V5 | by Dev-Ntando (Ntandoyenkosi Chisaya, Zimbabwe)
 *
 * A dedicated school assistant for students.
 * - Ask any homework or exam question
 * - Send a photo of an exam paper — AI reads and solves it
 * - Get essay plans in ZIMSEC format
 * - Step-by-step maths solutions
 * - Subject summaries and explanations
 * - Works for ZIMSEC, Cambridge, IB, CAPS and more
 *
 * Usage:
 *   .schoolai <question>
 *   .schoolai (reply to image) — analyze exam paper image
 *   .schoolai essay <topic> — write essay plan
 *   .schoolai math <problem> — solve maths step by step
 *   .schoolai explain <topic> — explain a topic simply
 *   .schoolai level <your level> — set your grade level
 *
 * Aliases: tutor, homework, school, studyai, learnai
 */

'use strict';

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

let downloadMediaMessage;
try { ({ downloadMediaMessage } = require('@whiskeysockets/baileys')); } catch (_) {}

const DATA_DIR    = path.join(__dirname, '../../data');
const SESSION_FILE = path.join(DATA_DIR, 'schoolai_sessions.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Session helpers ──────────────────────────────────────────────────────────
function readSessions() {
  try { return fs.existsSync(SESSION_FILE) ? JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) : {}; }
  catch (_) { return {}; }
}
function saveSessions(d) { fs.writeFileSync(SESSION_FILE, JSON.stringify(d, null, 2), 'utf8'); }
function getSession(jid) {
  const s = readSessions();
  if (!s[jid]) s[jid] = { level: 'O-Level', curriculum: 'ZIMSEC', history: [] };
  return { sessions: s, session: s[jid] };
}
function trimHistory(h, max = 12) { return h.length > max ? h.slice(h.length - max) : h; }

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
  return '❌ AI is temporarily unavailable. Try again in a moment.';
}

// ─── Image OCR + AI ───────────────────────────────────────────────────────────
async function analyzeExamImage(buf, level, curriculum) {
  let ocrText = '';
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('base64Image', 'data:image/jpeg;base64,' + buf.toString('base64'));
    form.append('language', 'eng');
    form.append('isOverlayRequired', 'false');
    form.append('detectOrientation', 'true');
    form.append('scale', 'true');
    form.append('OCREngine', '2');
    const r = await axios.post('https://api.ocr.space/parse/image', form, {
      headers: form.getHeaders(), timeout: 30000,
    });
    ocrText = r?.data?.ParsedResults?.[0]?.ParsedText?.trim() || '';
  } catch (_) {}

  const prompt = ocrText
    ? 'You are a ' + curriculum + ' academic tutor for a ' + level + ' student. The student sent a photo of an exam question or homework.\n\n' +
      'Image text:\n"' + ocrText + '"\n\n' +
      'Please:\n1. Identify each question clearly\n2. Solve/answer each one step by step\n3. Explain the method used\n4. Give marking tips if it is an exam question\n5. Use ' + curriculum + ' format and examples'
    : 'You are a ' + curriculum + ' academic tutor for a ' + level + ' student who sent a school image. ' +
      'The image content could not be read. Ask the student to: (1) make sure the image is clear, (2) type out the question if possible, or (3) describe what they need help with.';

  return callAI(prompt);
}

// ─── Build tutor prompt ───────────────────────────────────────────────────────
function buildTutorPrompt(session, history, userMessage) {
  const sys =
    'You are Ladybug, a patient and brilliant academic tutor created by Dev-Ntando from Zimbabwe. ' +
    'Student level: ' + session.level + '. Curriculum: ' + session.curriculum + '.\n' +
    'RULES:\n' +
    '- Adapt language complexity to the student level\n' +
    '- For maths/science: ALWAYS show full working steps\n' +
    '- Use Zimbabwe examples where relevant\n' +
    '- For essays: use ZIMSEC/Cambridge format\n' +
    '- Be encouraging — every student can succeed\n' +
    '- If the question is unclear, ask for clarification\n' +
    '- Keep responses structured and clear\n';
  const hist = trimHistory(history, 10)
    .map(h => (h.role === 'user' ? 'Student' : 'Ladybug') + ': ' + h.content)
    .join('\n');
  return sys + '\n' + hist + '\nStudent: ' + userMessage + '\nLadybug:';
}

// ─── Module export ────────────────────────────────────────────────────────────
module.exports = {
  name: 'schoolai',
  aliases: ['tutor', 'homework', 'school', 'studyai', 'learnai', 'ask'],
  category: 'ai',
  description: 'AI school tutor — homework help, exam solving, essays, maths step-by-step',
  usage: '.schoolai <question> | .schoolai essay <topic> | .schoolai math <problem> | .schoolai explain <topic> | .schoolai level <level>',

  async execute(sock, msg, args, extra) {
    const chatId    = extra?.from || msg.key.remoteJid;
    const senderJid = msg.key.participant || chatId;
    const name      = msg.pushName || senderJid.split('@')[0] || 'Student';

    const { sessions, session } = getSession(senderJid);
    const sub = (args[0] || '').toLowerCase();

    // ── Set level ──────────────────────────────────────────────────────────────
    if (sub === 'level' || sub === 'setlevel') {
      const level = args.slice(1).join(' ').trim();
      if (!level) return extra.reply('❓ Usage: *.schoolai level O-Level*\nExamples: Grade 7, Form 2, O-Level, A-Level, University');
      session.level = level;
      sessions[senderJid] = session;
      saveSessions(sessions);
      return extra.reply('✅ *Level set to:* ' + level + '\n\nI will now explain things at *' + level + '* standard.\n\n> _Ladybug Tutor 🇿🇼_');
    }

    // ── Set curriculum ─────────────────────────────────────────────────────────
    if (sub === 'curriculum' || sub === 'setcurriculum') {
      const cur = args.slice(1).join(' ').trim();
      if (!cur) return extra.reply('❓ Usage: *.schoolai curriculum ZIMSEC*\nOptions: ZIMSEC, Cambridge, IB, CAPS, Other');
      session.curriculum = cur;
      sessions[senderJid] = session;
      saveSessions(sessions);
      return extra.reply('✅ *Curriculum set to:* ' + cur + '\n\n> _Ladybug Tutor 🇿🇼_');
    }

    // ── Reset ──────────────────────────────────────────────────────────────────
    if (sub === 'reset' || sub === 'clear') {
      session.history = [];
      sessions[senderJid] = session;
      saveSessions(sessions);
      return extra.reply('🧹 *Session cleared!* Fresh start.\n\n> _Ladybug Tutor 🇿🇼_');
    }

    // ── Status ─────────────────────────────────────────────────────────────────
    if (sub === 'status' || sub === 'info') {
      return extra.reply(
        '📚 *Your Tutor Settings*\n\n' +
        '👤 Name: ' + name + '\n' +
        '🎓 Level: *' + session.level + '*\n' +
        '📘 Curriculum: *' + session.curriculum + '*\n' +
        '💬 Messages in memory: *' + session.history.length + '*\n\n' +
        'Commands:\n' +
        '  .schoolai level O-Level\n' +
        '  .schoolai curriculum ZIMSEC\n' +
        '  .schoolai reset\n\n' +
        '> _Ladybug Tutor 🇿🇼_'
      );
    }

    // ── Image analysis (reply to image) ────────────────────────────────────────
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const quotedImg = ctx?.quotedMessage?.imageMessage;
    const directImg = msg.message?.imageMessage;

    if ((quotedImg || directImg) && downloadMediaMessage) {
      await sock.sendPresenceUpdate('composing', chatId);
      await extra.reply('🔍 Analyzing your exam/homework image...');
      try {
        const targetMsg = quotedImg
          ? { key: { remoteJid: chatId, id: ctx.stanzaId, participant: ctx.participant }, message: ctx.quotedMessage }
          : msg;
        const buf = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
        const result = await analyzeExamImage(buf, session.level, session.curriculum);

        if (session.history.length >= 0) {
          session.history = trimHistory([...session.history,
            { role: 'user', content: '[Exam image analysis]' },
            { role: 'assistant', content: result.slice(0, 400) }]);
          sessions[senderJid] = session;
          saveSessions(sessions);
        }

        return extra.reply(result);
      } catch (e) {
        return extra.reply('❌ Could not analyze image: ' + e.message + '\nPlease make sure the image is clear!');
      }
    }

    // ── Essay mode ─────────────────────────────────────────────────────────────
    if (sub === 'essay') {
      const topic = args.slice(1).join(' ').trim();
      if (!topic) return extra.reply('❓ Usage: *.schoolai essay <topic>*\nExample: .schoolai essay The importance of education in Zimbabwe');
      await sock.sendPresenceUpdate('composing', chatId);
      const prompt =
        'Write a complete ' + session.curriculum + ' standard essay plan AND a full model essay for a ' + session.level + ' student.\n\n' +
        'Essay topic: "' + topic + '"\n\n' +
        'Format:\n' +
        '📝 ESSAY PLAN:\n' +
        '• Introduction: [what to include]\n' +
        '• Body paragraph 1: [main point + evidence]\n' +
        '• Body paragraph 2: [main point + evidence]\n' +
        '• Body paragraph 3: [main point + evidence]\n' +
        '• Conclusion: [what to include]\n\n' +
        '📄 MODEL ESSAY:\n' +
        '[Full essay — paragraphs, no bullet points]\n\n' +
        'Use Zimbabwe context where relevant. Follow ' + session.curriculum + ' marking criteria.';
      await extra.reply('✍️ Writing essay for: *' + topic + '*...');
      const result = await callAI(prompt);
      return extra.reply(result);
    }

    // ── Maths mode ─────────────────────────────────────────────────────────────
    if (sub === 'math' || sub === 'maths' || sub === 'solve') {
      const problem = args.slice(1).join(' ').trim();
      if (!problem) return extra.reply('❓ Usage: *.schoolai math <problem>*\nExample: .schoolai math Solve 2x + 5 = 13');
      await sock.sendPresenceUpdate('composing', chatId);
      const prompt =
        'You are a maths teacher. Solve this problem for a ' + session.level + ' student following the ' + session.curriculum + ' curriculum.\n\n' +
        'Problem: ' + problem + '\n\n' +
        'Format:\n' +
        '🔢 PROBLEM: [restate the problem]\n' +
        '📝 METHOD: [explain what method to use and why]\n' +
        '✏️ WORKING:\n' +
        'Step 1: ...\n' +
        'Step 2: ...\n' +
        '(continue for all steps)\n' +
        '✅ ANSWER: [final answer with units if needed]\n' +
        '💡 TIP: [a tip to remember this method]\n\n' +
        'Show every single step. Do not skip steps.';
      await extra.reply('🔢 Solving: *' + problem + '*...');
      const result = await callAI(prompt);
      return extra.reply(result);
    }

    // ── Explain mode ───────────────────────────────────────────────────────────
    if (sub === 'explain' || sub === 'what') {
      const topic = args.slice(1).join(' ').trim();
      if (!topic) return extra.reply('❓ Usage: *.schoolai explain <topic>*\nExample: .schoolai explain photosynthesis');
      await sock.sendPresenceUpdate('composing', chatId);
      const prompt =
        'Explain "' + topic + '" to a ' + session.level + ' student in the ' + session.curriculum + ' curriculum.\n\n' +
        'Format:\n' +
        '📖 TOPIC: ' + topic + '\n' +
        '🔑 DEFINITION: [simple clear definition]\n' +
        '📚 EXPLANATION: [detailed explanation at their level]\n' +
        '🌍 EXAMPLE: [real-life Zimbabwe example]\n' +
        '⚠️ COMMON MISTAKES: [mistakes students make]\n' +
        '📝 EXAM TIP: [how this is typically tested in ' + session.curriculum + ']\n\n' +
        'Use simple language appropriate for ' + session.level + ' level.';
      await extra.reply('📚 Explaining: *' + topic + '*...');
      const result = await callAI(prompt);
      return extra.reply(result);
    }

    // ── Summary mode ───────────────────────────────────────────────────────────
    if (sub === 'summary' || sub === 'summarize') {
      const topic = args.slice(1).join(' ').trim();
      if (!topic) return extra.reply('❓ Usage: *.schoolai summary <topic>*\nExample: .schoolai summary World War 2');
      await sock.sendPresenceUpdate('composing', chatId);
      const prompt =
        'Create a concise study summary of "' + topic + '" for a ' + session.level + ' student in ' + session.curriculum + '.\n\n' +
        'Include: key points, important dates/names/formulas, likely exam questions, and a quick revision checklist.\n' +
        'Keep it exam-focused and easy to memorize.';
      await extra.reply('📋 Creating summary for: *' + topic + '*...');
      const result = await callAI(prompt);
      return extra.reply(result);
    }

    // ── General question ───────────────────────────────────────────────────────
    const question = args.join(' ').trim();
    if (!question) {
      return extra.reply(
        '📚 *Ladybug School AI Tutor*\n\n' +
        'Hi ' + name + '! I can help with:\n\n' +
        '❓ Ask anything: *.schoolai <question>*\n' +
        '📷 Exam paper: reply to image with *.schoolai*\n' +
        '✍️ Essay: *.schoolai essay <topic>*\n' +
        '🔢 Maths: *.schoolai math <problem>*\n' +
        '📖 Explain: *.schoolai explain <topic>*\n' +
        '📋 Summary: *.schoolai summary <topic>*\n' +
        '🎓 Set level: *.schoolai level O-Level*\n' +
        '📘 Set curriculum: *.schoolai curriculum ZIMSEC*\n\n' +
        'Current settings: *' + session.level + '* | *' + session.curriculum + '*\n\n' +
        '> _Ladybug Tutor by Dev-Ntando 🇿🇼_'
      );
    }

    await sock.sendPresenceUpdate('composing', chatId);
    const prompt = buildTutorPrompt(session, session.history, question);
    const result = await callAI(prompt);

    session.history = trimHistory([...session.history,
      { role: 'user', content: question },
      { role: 'assistant', content: result.slice(0, 400) }]);
    sessions[senderJid] = session;
    saveSessions(sessions);

    return extra.reply(result);
  },
};
