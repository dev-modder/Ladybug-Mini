/**
 * AI Auto-Reply Command (Owner Only)
 * Ladybug Bot Mini V5 | by Dev-Ntando (Ntandoyenkosi Chisaya, Zimbabwe)
 *
 * Enhanced with:
 *  - School project assistant mode (ZIMSEC / Cambridge / IB / CAPS)
 *  - Age & grade level detection and adaptive responses
 *  - Image analysis via OCR + AI (send photo of exam paper - AI solves it)
 *  - PDF / document acknowledgement & guidance
 *  - Homework help, essay writing, maths solving (step-by-step)
 *  - Per-user conversation memory with grade level persistence
 *  - Multi-curriculum support
 *
 * Commands:
 *   .aiautoreply on / off / status
 *   .aiautoreply school on / off
 *   .aiautoreply setlevel <level>        e.g. Grade 7, O-Level, A-Level
 *   .aiautoreply setcurriculum <name>    ZIMSEC / Cambridge / IB / Other
 *   .aiautoreply setprompt <text>
 *   .aiautoreply clearprompt
 *   .aiautoreply memory on / off
 *   .aiautoreply clearall
 *
 * Aliases: aar, aireply, smartreply, dmreply
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const axios = require('axios');

let downloadMediaMessage;
try { ({ downloadMediaMessage } = require('@whiskeysockets/baileys')); } catch (_) {}

const CONFIG_PATH = path.join(__dirname, '../../config.js');
const DATA_DIR    = path.join(__dirname, '../../data');
const MEMORY_PATH = path.join(DATA_DIR, 'aiautoreply_memory.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Config helpers ────────────────────────────────────────────────────────────
function readConfig() {
  delete require.cache[require.resolve('../../config.js')];
  return require('../../config.js');
}
function writeConfig(key, value) {
  let c = fs.readFileSync(CONFIG_PATH, 'utf8');
  const v = typeof value === 'string'
    ? "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
    : String(value);
  if (c.includes(key + ':')) {
    if (typeof value === 'string') c = c.replace(new RegExp(key + ":\\s*'[^']*'"), key + ': ' + v);
    else c = c.replace(new RegExp(key + ':\\s*(true|false|\\d+)'), key + ': ' + v);
  } else {
    c = c.replace(/(module\.exports\s*=\s*\{)/, '$1\n  ' + key + ': ' + v + ',');
  }
  fs.writeFileSync(CONFIG_PATH, c, 'utf8');
  delete require.cache[require.resolve('../../config.js')];
}

// ─── Memory helpers ────────────────────────────────────────────────────────────
function readMemory() {
  try { return fs.existsSync(MEMORY_PATH) ? JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8')) : {}; }
  catch (_) { return {}; }
}
function saveMemory(data) { fs.writeFileSync(MEMORY_PATH, JSON.stringify(data, null, 2), 'utf8'); }
function getUserMemory(jid) {
  const mem = readMemory();
  if (!mem[jid]) mem[jid] = { history: [], gradeLevel: null, curriculum: null };
  return { mem, userMem: mem[jid] };
}
function trimHistory(h, max = 15) { return h.length > max ? h.slice(h.length - max) : h; }

// ─── AI call with fallback ─────────────────────────────────────────────────────
async function callAI(prompt) {
  const endpoints = [
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
  for (const fn of endpoints) {
    try {
      const res = await fn();
      if (res && String(res).length > 2) return String(res).trim();
    } catch (_) {}
  }
  return 'I am unable to respond right now. Please try again in a moment.';
}

// ─── Image analysis: OCR text extraction + AI reasoning ───────────────────────
async function analyzeImage(buf, userPrompt) {
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
    ? (userPrompt ? userPrompt + '\n\n' : '') + 'Image text:\n"' + ocrText + '"\n\nPlease analyze and respond helpfully.'
    : (userPrompt || 'Analyze this image. Read any text, answer any questions, describe what you see.');
  return callAI(prompt);
}

// ─── Grade level detector ──────────────────────────────────────────────────────
const LEVELS = [
  { re: /\b(ecd|grade\s*[1-7]|primary|junior primary)\b/i,                label: 'Primary (Grade 1-7)'   },
  { re: /\b(form\s*[1-4]|o[-\s]?level|ordinary level|jssc|zimsec o)\b/i,  label: 'O-Level (Form 1-4)'    },
  { re: /\b(form\s*[5-6]|a[-\s]?level|advanced level|zimsec a)\b/i,       label: 'A-Level (Form 5-6)'    },
  { re: /\b(university|college|degree|bachelor|diploma|hnd|tertiary)\b/i,  label: 'University/Tertiary'   },
];
function detectLevel(text) { for (const l of LEVELS) if (l.re.test(text)) return l; return null; }

// ─── Build school-mode AI prompt ──────────────────────────────────────────────
function buildSchoolPrompt(cfg, userMem, history, userMessage, name) {
  const cur   = userMem.curriculum || cfg.aiAutoReplyCurriculum || 'ZIMSEC';
  const level = userMem.gradeLevel  || cfg.aiAutoReplyLevel      || 'O-Level';
  const sys   =
    'You are Ladybug, a brilliant, patient and friendly academic tutor created by ' +
    'Ntandoyenkosi Chisaya (Dev-Ntando) from Zimbabwe. ' +
    'You specialize in the ' + cur + ' curriculum. Student level: ' + level + '.\n' +
    'RULES:\n' +
    '- Match language to student level. Primary=simple; O-Level=clear with examples; A-Level=structured\n' +
    '- Always show full working steps for maths and science\n' +
    '- Use Zimbabwe examples (ZWL, local geography, local names)\n' +
    '- Follow ZIMSEC essay format: intro / body / conclusion\n' +
    '- Be encouraging and motivating — they can pass!\n' +
    '- For exam questions: solve step-by-step\n' +
    '- Keep responses focused and practical\n';
  const hist = trimHistory(history, 10)
    .map(h => (h.role === 'user' ? (name || 'Student') : 'Ladybug') + ': ' + h.content)
    .join('\n');
  return sys + '\n' + hist + '\nStudent: ' + userMessage + '\nLadybug:';
}

// ─── Build general-mode AI prompt ─────────────────────────────────────────────
function buildGeneralPrompt(cfg, history, userMessage, name) {
  const sys = cfg.aiAutoReplyPrompt ||
    'You are Ladybug, a friendly, witty WhatsApp assistant created by ' +
    'Ntandoyenkosi Chisaya (Dev-Ntando) from Zimbabwe. ' +
    'Chat casually, use occasional emojis, respond in the same language as the user, keep replies concise.';
  const hist = trimHistory(history, 15)
    .map(h => (h.role === 'user' ? (name || 'User') : 'Ladybug') + ': ' + h.content)
    .join('\n');
  return sys + '\n' + hist + '\nUser: ' + userMessage + '\nLadybug:';
}

// ─── DM handler (export for message handler integration) ──────────────────────
async function handleIncomingDM(sock, msg) {
  const cfg = readConfig();
  if (!cfg.aiAutoReply) return;

  const chatId    = msg.key.remoteJid;
  if (chatId.endsWith('@g.us')) return;

  const senderJid  = msg.key.participant || chatId;
  const senderName = msg.pushName || senderJid.split('@')[0] || 'User';
  const isSchool   = cfg.aiAutoReplySchool === true;
  const memoryOn   = cfg.aiAutoReplyMemory !== false;

  const { mem, userMem } = getUserMemory(senderJid);
  const history = memoryOn ? userMem.history : [];

  const rawText = msg.message?.conversation
    || msg.message?.extendedTextMessage?.text
    || msg.message?.imageMessage?.caption
    || msg.message?.videoMessage?.caption
    || msg.message?.documentMessage?.caption || '';

  // Auto-detect curriculum
  if (memoryOn && rawText) {
    if (/zimsec/i.test(rawText) && !userMem.curriculum) userMem.curriculum = 'ZIMSEC';
    else if (/cambridge/i.test(rawText) && !userMem.curriculum) userMem.curriculum = 'Cambridge';
    else if (/\bib\b|international baccalaureate/i.test(rawText) && !userMem.curriculum) userMem.curriculum = 'IB';
  }

  let replyText = '';
  const imgMsg = msg.message?.imageMessage;
  const docMsg = msg.message?.documentMessage;

  // ── Image ──
  if (imgMsg && downloadMediaMessage) {
    try {
      await sock.sendPresenceUpdate('composing', chatId);
      const buf = await downloadMediaMessage(msg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
      const cap = (imgMsg.caption || '').trim();
      const lvl = userMem.gradeLevel || cfg.aiAutoReplyLevel || 'O-Level';
      const prompt = isSchool
        ? (cap
            ? 'This is a school image from a ' + lvl + ' student (' + senderName + '). Caption: "' + cap + '". Identify all questions/problems in the image text and provide step-by-step solutions for ' + lvl + ' level.'
            : 'Analyze this school image for a ' + lvl + ' student. Solve any exam questions, homework or problems shown, step by step.')
        : (cap || 'Analyze this image. Read any text. If there are questions, answer them. If it is a document, summarize it.');
      replyText = await analyzeImage(buf, prompt);
      if (memoryOn) {
        userMem.history = trimHistory([...history,
          { role: 'user', content: '[Image' + (cap ? ': ' + cap : '') + ']' },
          { role: 'assistant', content: replyText.slice(0, 400) }]);
        mem[senderJid] = userMem; saveMemory(mem);
      }
    } catch (_) {
      replyText = 'Could not analyze the image. Please make sure it is clear and try again.';
    }

  // ── Document / PDF ──
  } else if (docMsg) {
    const fileName = docMsg.fileName || 'document';
    const cap = (docMsg.caption || '').trim();
    const lvl = userMem.gradeLevel || cfg.aiAutoReplyLevel || 'O-Level';
    await sock.sendPresenceUpdate('composing', chatId);
    const prompt = isSchool
      ? 'A ' + lvl + ' student sent a document: "' + fileName + '"' + (cap ? ' with note: "' + cap + '"' : '') + '. Warmly acknowledge it. Tell them what you can help with and ask what specific help they need.'
      : 'Someone sent "' + fileName + '"' + (cap ? ' (' + cap + ')' : '') + '. Acknowledge it and offer to help with its contents.';
    replyText = await callAI(prompt);
    if (memoryOn) {
      userMem.history = trimHistory([...history,
        { role: 'user', content: '[Document: ' + fileName + ']' },
        { role: 'assistant', content: replyText.slice(0, 400) }]);
      mem[senderJid] = userMem; saveMemory(mem);
    }

  // ── Text ──
  } else if (rawText) {
    const det = detectLevel(rawText);
    if (det && memoryOn && !userMem.gradeLevel) userMem.gradeLevel = det.label;

    await sock.sendPresenceUpdate('composing', chatId);
    let prompt;

    if (isSchool && !userMem.gradeLevel && history.length === 0 && !det) {
      replyText =
        '👋 *Hello ' + senderName + '!* I am *Ladybug* — your AI school tutor! 📚🇿🇼\n\n' +
        'To give you the *best* help, please tell me:\n\n' +
        '1️⃣ *What level are you?*\n' +
        '   (Grade 1-7 / Form 1-4 / O-Level / A-Level / University)\n\n' +
        '2️⃣ *What curriculum?*\n' +
        '   (ZIMSEC / Cambridge / IB / Other)\n\n' +
        'I can help with:\n' +
        '📝 Homework & assignments\n' +
        '📐 Maths — step by step\n' +
        '🔬 Science explanations\n' +
        '✍️ Essays (ZIMSEC format)\n' +
        '📷 Exam paper photos — just send the image!\n' +
        '📄 PDFs & documents\n' +
        '🗓️ Study plans\n\n' +
        '> _Powered by Ladybug Bot Mini V5 — Dev-Ntando 🇿🇼_';
    } else {
      prompt = isSchool
        ? buildSchoolPrompt(cfg, userMem, history, rawText, senderName)
        : buildGeneralPrompt(cfg, history, rawText, senderName);
      replyText = await callAI(prompt);
    }

    if (memoryOn && prompt) {
      userMem.history = trimHistory([...history,
        { role: 'user', content: rawText },
        { role: 'assistant', content: replyText.slice(0, 400) }]);
      mem[senderJid] = userMem; saveMemory(mem);
    }
  }

  if (replyText) {
    await sock.sendPresenceUpdate('paused', chatId);
    await sock.sendMessage(chatId, { text: replyText }, { quoted: msg });
  }
}

// ─── Command module export ─────────────────────────────────────────────────────
module.exports = {
  name: 'aiautoreply',
  aliases: ['aar', 'aireply', 'smartreply', 'dmreply'],
  category: 'owner',
  description: 'Global AI DM auto-reply — school mode, image analysis, ZIMSEC tutor, memory & more',
  usage: '.aiautoreply on | off | status | school on/off | setlevel | setcurriculum | setprompt | clearprompt | memory on/off | clearall',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,
  handleIncomingDM,

  async execute(sock, msg, args, extra) {
    try {
      const cfg  = readConfig();
      const sub  = (args[0] || '').toLowerCase();
      const sub2 = (args[1] || '').toLowerCase();

      if (!sub || sub === 'status') {
        const mem = readMemory();
        return extra.reply(
          '🤖 *AI Auto-Reply — Status*\n\n' +
          '• State:          *' + (cfg.aiAutoReply ? '🟢 ON' : '🔴 OFF') + '*\n' +
          '• School Mode:    *' + (cfg.aiAutoReplySchool ? '🎓 ON' : '❌ OFF') + '*\n' +
          '• Curriculum:     *' + (cfg.aiAutoReplyCurriculum || 'ZIMSEC (default)') + '*\n' +
          '• Default Level:  *' + (cfg.aiAutoReplyLevel || 'Not set') + '*\n' +
          '• Memory:         *' + (cfg.aiAutoReplyMemory !== false ? '🧠 ON' : '❌ OFF') + '*\n' +
          '• Users in Memory:*' + Object.keys(mem).length + '*\n' +
          '• Custom Prompt:  *' + (cfg.aiAutoReplyPrompt ? '✏️ Set' : '📄 Default') + '*\n\n' +
          '📋 *Commands:*\n' +
          '  .aar on / off\n' +
          '  .aar school on / off\n' +
          '  .aar setlevel <level>\n' +
          '  .aar setcurriculum <name>\n' +
          '  .aar setprompt <text>\n' +
          '  .aar clearprompt\n' +
          '  .aar memory on / off\n' +
          '  .aar clearall\n\n' +
          '> _Made with ❤️ by Dev-Ntando 🇿🇼_'
        );
      }

      if (sub === 'on' || sub === 'enable') {
        writeConfig('aiAutoReply', true);
        return extra.reply('🟢 *AI Auto-Reply Enabled!*\n\nReplying to all DMs with AI.\n💡 Try school mode: *.aar school on*\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
      }

      if (sub === 'off' || sub === 'disable') {
        writeConfig('aiAutoReply', false);
        return extra.reply('🔴 *AI Auto-Reply Disabled.*\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
      }

      if (sub === 'school') {
        if (sub2 === 'on' || sub2 === 'enable') {
          writeConfig('aiAutoReplySchool', true);
          return extra.reply(
            '🎓 *School Mode ON!*\n\n' +
            'AI is now a ZIMSEC academic tutor.\n\n' +
            '*Features active:*\n' +
            '  📷 Send exam paper photo → AI solves it\n' +
            '  📄 Send PDF → AI guides you through it\n' +
            '  📐 Maths step-by-step\n' +
            '  ✍️ ZIMSEC essay format\n' +
            '  🧠 Remembers each student level\n' +
            '  🌍 Uses Zimbabwean examples\n' +
            '  📚 ZIMSEC, Cambridge, IB, CAPS support\n\n' +
            'Set level: *.aar setlevel O-Level*\n' +
            'Set curriculum: *.aar setcurriculum ZIMSEC*\n\n' +
            '> _Made with ❤️ by Dev-Ntando 🇿🇼_'
          );
        }
        if (sub2 === 'off' || sub2 === 'disable') {
          writeConfig('aiAutoReplySchool', false);
          return extra.reply('🔴 *School Mode OFF.* Back to general mode.\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
        }
        return extra.reply('❓ Usage: *.aar school on* or *.aar school off*');
      }

      if (sub === 'setlevel') {
        const level = args.slice(1).join(' ').trim();
        if (!level) return extra.reply('❓ Usage: *.aar setlevel <level>*\nExamples: Grade 7, O-Level, A-Level, University');
        writeConfig('aiAutoReplyLevel', level);
        return extra.reply('✅ *Default Level Set:* ' + level + '\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
      }

      if (sub === 'setcurriculum' || sub === 'curriculum') {
        const cur = args.slice(1).join(' ').trim();
        if (!cur) return extra.reply('❓ Usage: *.aar setcurriculum <name>*\nOptions: ZIMSEC, Cambridge, IB, CAPS, Other');
        writeConfig('aiAutoReplyCurriculum', cur);
        return extra.reply('✅ *Curriculum Set:* ' + cur + '\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
      }

      if (sub === 'memory') {
        if (sub2 === 'on') { writeConfig('aiAutoReplyMemory', true); return extra.reply('🧠 *Memory ON!* AI remembers each user.'); }
        if (sub2 === 'off') { writeConfig('aiAutoReplyMemory', false); return extra.reply('🔕 *Memory OFF.* Fresh start each message.'); }
        return extra.reply('❓ Usage: *.aar memory on* or *.aar memory off*');
      }

      if (sub === 'clearall' || sub === 'clearmemory') {
        saveMemory({});
        return extra.reply('🧹 *All user memories cleared!*');
      }

      if (sub === 'setprompt') {
        const p = args.slice(1).join(' ').trim();
        if (!p) return extra.reply('❌ Provide a prompt.\nExample: .aar setprompt You are Ladybug, a helpful Zimbabwean assistant.');
        if (p.length > 800) return extra.reply('❌ Prompt too long (max 800 chars).');
        writeConfig('aiAutoReplyPrompt', p);
        return extra.reply('✏️ *Prompt Set!*\n_"' + p + '"_\n\nUse *.aar clearprompt* to reset.\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
      }

      if (sub === 'clearprompt' || sub === 'resetprompt') {
        let c = fs.readFileSync(CONFIG_PATH, 'utf8');
        c = c.replace(/\n?\s*aiAutoReplyPrompt:\s*'[^']*',?/, '');
        fs.writeFileSync(CONFIG_PATH, c, 'utf8');
        delete require.cache[require.resolve('../../config.js')];
        return extra.reply('🔄 *Prompt Reset!* Using default Ladybug personality.\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
      }

      return extra.reply(
        '❓ Unknown: *' + sub + '*\n\n' +
        'Options: on, off, status, school on/off, setlevel, setcurriculum,\n         setprompt, clearprompt, memory on/off, clearall'
      );
    } catch (e) {
      console.error('[aiautoreply]', e);
      await extra.reply('❌ Error: ' + e.message);
    }
  },
};
