/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║   AutoChat AI v4 — Ladybug Bot Mini                                    ║
 * ║   All-in-One: Chat · Image Generation · Image Analysis · OCR · Voice   ║
 * ║   By Dev-Ntando                                                         ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Commands:                                                              ║
 * ║   .autochat on              — enable in this chat                      ║
 * ║   .autochat off             — disable                                  ║
 * ║   .autochat reset           — clear memory                             ║
 * ║   .autochat status          — show state & stats                       ║
 * ║   .autochat persona <name>  — switch AI personality                    ║
 * ║   .autochat delay <ms>      — set reply delay (300-8000ms)             ║
 * ║   .autochat imggen on|off   — toggle auto image generation             ║
 * ║   .autochat analyze on|off  — toggle auto image analysis               ║
 * ║   .autochat ocr on|off      — toggle auto OCR on images                ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Auto-features (when enabled):                                         ║
 * ║   · Text => AI chat reply with memory & persona                        ║
 * ║   · "draw/generate/create image of X" => generates & sends image       ║
 * ║   · Image received => AI describes/analyzes it                         ║
 * ║   · Image with text => OCR extracts + AI comments                      ║
 * ║   · Sticker/audio received => natural acknowledgement                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const axios                    = require('axios');
const FormData                 = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const APIs                     = require('../../utils/api');

// ─────────────────────────────────────────────────────────────────────────────
//  PERSONAS
// ─────────────────────────────────────────────────────────────────────────────
const PERSONAS = {
  friendly: {
    name: 'Friendly Ladybug',
    prompt: `You are Ladybug, a warm, friendly, and helpful WhatsApp assistant by Dev-Ntando.
You chat like a real human friend — casual, encouraging, and fun. Keep replies short and natural.
Use emojis occasionally. Never say you are an AI unless directly asked.
Respond in the same language the user speaks. If someone is rude, stay calm and politely redirect.`,
  },
  professional: {
    name: 'Pro Ladybug',
    prompt: `You are Ladybug, a professional and knowledgeable WhatsApp assistant by Dev-Ntando.
You give accurate, concise, well-structured answers. Use formal but approachable language.
No unnecessary emojis. Be direct and helpful. Correct misinformation politely.`,
  },
  savage: {
    name: 'Savage Ladybug',
    prompt: `You are Ladybug, a witty, sharp, and slightly savage WhatsApp assistant by Dev-Ntando.
You are funny, sarcastic (but never mean-spirited), and keep people entertained.
You roast gently, joke constantly, and always make people laugh. Keep it fun and harmless.`,
  },
  tutor: {
    name: 'Tutor Ladybug',
    prompt: `You are Ladybug, an educational AI tutor by Dev-Ntando.
You explain things step by step, use examples, and check understanding.
You are patient, encouraging, and cover school/university topics well.
Always make complex topics easy to understand.`,
  },
  therapist: {
    name: 'Support Ladybug',
    prompt: `You are Ladybug, an empathetic and supportive listener by Dev-Ntando.
You listen carefully, validate feelings, offer thoughtful perspective, and encourage.
Never diagnose or prescribe. Suggest professional help for serious issues.
Be warm, gentle, and non-judgmental always.`,
  },
  creative: {
    name: 'Creative Ladybug',
    prompt: `You are Ladybug, a wildly creative and imaginative WhatsApp assistant by Dev-Ntando.
You think outside the box, suggest bold ideas, write vivid stories, craft unique poems,
and love brainstorming. You are enthusiastic, artsy, and inspiring.`,
  },
  coder: {
    name: 'Dev Ladybug',
    prompt: `You are Ladybug, a senior software developer and coding mentor by Dev-Ntando.
You write clean, efficient, well-commented code. You debug patiently, explain concepts clearly,
and choose the best tool for every job. You support all major languages and frameworks.`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  IMAGE GENERATION TRIGGER PATTERNS
// ─────────────────────────────────────────────────────────────────────────────
const IMAGE_GEN_TRIGGERS = [
  /\b(generate|create|draw|make|paint|render|design|imagine|produce)\b.{0,30}\b(image|picture|photo|art|pic|illustration|artwork|painting|drawing|portrait)\b/i,
  /\b(image|picture|photo|art|pic|illustration)\b.{0,30}\b(of|showing|depicting|with|featuring)\b/i,
  /^(draw|paint|generate|create|make|render)\s+/i,
  /\b(send me|show me|give me)\b.{0,20}\b(image|picture|photo|pic)\b/i,
  /\b(visualize|visualise)\b/i,
];

// ─────────────────────────────────────────────────────────────────────────────
//  OCR LANGUAGE MAP
// ─────────────────────────────────────────────────────────────────────────────
const LANG_MAP = {
  en: 'eng', ar: 'ara', fr: 'fre', de: 'ger', es: 'spa',
  pt: 'por', ru: 'rus', it: 'ita', ja: 'jpn', ko: 'kor',
  zh: 'chs', hi: 'hin', tr: 'tur', uk: 'ukr', pl: 'pol',
  nl: 'dut', sv: 'swe', da: 'dan', fi: 'fin', el: 'gre',
};

// ─────────────────────────────────────────────────────────────────────────────
//  SESSION STORE
// ─────────────────────────────────────────────────────────────────────────────
const sessions = new Map();

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      enabled:        false,
      history:        [],
      persona:        'friendly',
      delayMs:        1500,
      msgCount:       0,
      imgGenEnabled:  true,
      analyzeEnabled: true,
      ocrEnabled:     true,
      stats: {
        textReplies:     0,
        imagesGenerated: 0,
        imagesAnalyzed:  0,
        ocrRuns:         0,
      },
    });
  }
  return sessions.get(chatId);
}

function trimHistory(h, max = 40) {
  return h.length > max ? h.slice(h.length - max) : h;
}

function buildPrompt(persona, history, userMsg) {
  const sys   = PERSONAS[persona]?.prompt || PERSONAS.friendly.prompt;
  const lines = [sys, ''];
  for (const h of history) {
    lines.push((h.role === 'user' ? 'User' : 'Ladybug') + ': ' + h.content);
  }
  lines.push('User: ' + userMsg, 'Ladybug:');
  return lines.join('\n');
}

const typingDelay = (text, base = 1200) =>
  new Promise(r => setTimeout(r, Math.min(base + text.length * 18, 5500)));

// ─────────────────────────────────────────────────────────────────────────────
//  IMAGE GENERATION (multi-provider)
// ─────────────────────────────────────────────────────────────────────────────
async function generateImage(prompt) {
  const providers = [
    async () => {
      const seed = Math.floor(Math.random() * 999999);
      const url  = 'https://image.pollinations.ai/prompt/' +
                   encodeURIComponent(prompt) +
                   '?width=1024&height=1024&seed=' + seed + '&nologo=true&enhance=true';
      const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 35000 });
      if (r.data && r.data.byteLength > 1000) return Buffer.from(r.data);
      throw new Error('Empty');
    },
    async () => {
      const r = await axios.get(
        'https://api.siputzx.my.id/api/ai/stablediffusion?prompt=' + encodeURIComponent(prompt),
        { responseType: 'arraybuffer', timeout: 35000 }
      );
      if (r.data && r.data.byteLength > 1000) return Buffer.from(r.data);
      throw new Error('Empty');
    },
    async () => {
      const r = await axios.get(
        'https://nime-api.vercel.app/api/txt2img?prompt=' + encodeURIComponent(prompt),
        { timeout: 30000 }
      );
      const imgUrl = r.data && (r.data.result || r.data.url || r.data.image);
      if (!imgUrl) throw new Error('No URL');
      const img = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 25000 });
      return Buffer.from(img.data);
    },
    async () => {
      const seed = Math.floor(Math.random() * 99999);
      const url  = 'https://image.pollinations.ai/prompt/' +
                   encodeURIComponent(prompt + ' high quality detailed') +
                   '?model=flux&width=1024&height=1024&seed=' + seed + '&nologo=true';
      const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 40000 });
      if (r.data && r.data.byteLength > 1000) return Buffer.from(r.data);
      throw new Error('Empty');
    },
  ];
  for (const fn of providers) {
    try { return await fn(); } catch (_) {}
  }
  throw new Error('All image generation providers failed. Please try again.');
}

// ─────────────────────────────────────────────────────────────────────────────
//  IMAGE ANALYSIS (vision API, multi-provider)
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeImage(imageBuffer, userQuestion) {
  const base64 = imageBuffer.toString('base64');
  const prompt = userQuestion && userQuestion.length > 3
    ? 'The user asks: "' + userQuestion + '". Analyze this image and answer thoroughly.'
    : 'Describe this image in detail. What do you see? Include objects, people, colors, mood, setting, and interesting details. Be natural and conversational.';

  // Provider 1 — Pollinations vision (OpenAI-compatible)
  try {
    const r = await axios.post(
      'https://text.pollinations.ai/',
      {
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + base64 } },
          ],
        }],
        model: 'openai',
      },
      { timeout: 30000 }
    );
    const ans = typeof r.data === 'string'
      ? r.data
      : (r.data && r.data.choices && r.data.choices[0] && r.data.choices[0].message && r.data.choices[0].message.content);
    if (ans && ans.trim().length > 5) return ans.trim();
  } catch (_) {}

  // Provider 2 — BK9 Vision
  try {
    const r = await axios.get(
      'https://bk9.fun/ai/vision?url=data:image/jpeg;base64,' +
      encodeURIComponent(base64) + '&q=' + encodeURIComponent(prompt),
      { timeout: 25000 }
    );
    const ans = r.data && (r.data.BK9 || r.data.result || r.data.response);
    if (ans && ans.trim().length > 5) return ans.trim();
  } catch (_) {}

  // Provider 3 — siputzx vision
  try {
    const fd = new FormData();
    fd.append('image', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
    fd.append('prompt', prompt);
    const r = await axios.post(
      'https://api.siputzx.my.id/api/ai/vision',
      fd,
      { headers: fd.getHeaders(), timeout: 25000 }
    );
    const ans = r.data && (r.data.data || r.data.result || r.data.response);
    if (ans && ans.trim().length > 5) return ans.trim();
  } catch (_) {}

  // Fallback — text-only polite response
  return await APIs.chatAI(
    'I received an image but my vision is unavailable right now. ' +
    'Respond naturally and ask the user to describe what is in the image.'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  OCR — extract text from image via ocr.space
// ─────────────────────────────────────────────────────────────────────────────
async function extractTextOCR(imageBuffer, lang) {
  const ocrLang = LANG_MAP[lang] || lang || 'eng';
  const fd = new FormData();
  fd.append('base64Image', 'data:image/jpeg;base64,' + imageBuffer.toString('base64'));
  fd.append('language',          ocrLang);
  fd.append('isOverlayRequired', 'false');
  fd.append('detectOrientation', 'true');
  fd.append('scale',             'true');
  fd.append('OCREngine',         '2');

  const r = await axios.post('https://api.ocr.space/parse/image', fd, {
    headers: { ...fd.getHeaders(), apikey: 'helloworld' },
    timeout: 20000,
  });

  const text = r.data &&
               r.data.ParsedResults &&
               r.data.ParsedResults[0] &&
               r.data.ParsedResults[0].ParsedText &&
               r.data.ParsedResults[0].ParsedText.trim();
  if (!text || text.length < 3) throw new Error('No text in image');
  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function isImageGenRequest(text) {
  return IMAGE_GEN_TRIGGERS.some(re => re.test(text));
}

function extractImagePrompt(text) {
  return text
    .replace(/\b(please|can you|could you|pls|plz)\b/gi, '')
    .replace(/\b(generate|create|draw|make|paint|render|design|imagine|produce|visualize|visualise)\b/gi, '')
    .replace(/\ban?\s+(image|picture|photo|art|pic|illustration|artwork|painting|drawing|portrait)\b/gi, '')
    .replace(/\bthe\s+(image|picture|photo|art|pic)\b/gi, '')
    .replace(/\b(of|showing|depicting|with|featuring)\b/gi, '')
    .replace(/\b(send me|show me|give me|a|an)\b/gi, '')
    .replace(/[.!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function downloadMedia(sock, msg) {
  try {
    return await downloadMediaMessage(
      msg, 'buffer', {},
      { logger: undefined, reuploadRequest: sock.updateMediaMessage }
    );
  } catch (_) { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNAL BRANCH: TEXT
// ─────────────────────────────────────────────────────────────────────────────
async function _handleText(sock, msg, session, chatId, text) {
  // Route: image generation?
  if (session.imgGenEnabled && isImageGenRequest(text)) {
    const imgPrompt = extractImagePrompt(text);
    if (imgPrompt.length > 2) {
      try {
        await sock.sendPresenceUpdate('composing', chatId);
        await sock.sendMessage(chatId,
          { text: '_Generating image: "' + imgPrompt + '"..._' },
          { quoted: msg }
        );
        const buf = await generateImage(imgPrompt);
        session.stats.imagesGenerated++;
        await sock.sendPresenceUpdate('paused', chatId);
        await sock.sendMessage(chatId, {
          image:    buf,
          caption:  '*' + imgPrompt + '*\n\n_Generated by Ladybug AI v4_',
          mimetype: 'image/jpeg',
        });
        session.history.push({ role: 'user',    content: text });
        session.history.push({ role: 'ladybug', content: '[Generated image: ' + imgPrompt + ']' });
        session.history  = trimHistory(session.history);
        session.msgCount++;
        return true;
      } catch (e) {
        console.error('[AutoChat v4] imggen failed:', e.message);
        // Fall through to text chat
      }
    }
  }

  // Route: standard chat
  await sock.sendPresenceUpdate('composing', chatId);
  const prompt = buildPrompt(session.persona, trimHistory(session.history), text);
  await typingDelay(text, session.delayMs);
  await sock.sendPresenceUpdate('paused', chatId);

  const answer = await APIs.chatAI(prompt, PERSONAS[session.persona] && PERSONAS[session.persona].prompt);
  if (!answer || !answer.length) return false;

  session.history.push({ role: 'user',    content: text   });
  session.history.push({ role: 'ladybug', content: answer });
  session.history  = trimHistory(session.history);
  session.msgCount++;
  session.stats.textReplies++;

  await sock.sendMessage(chatId, { text: answer }, { quoted: msg });
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNAL BRANCH: IMAGE / STICKER
// ─────────────────────────────────────────────────────────────────────────────
async function _handleImage(sock, msg, session, chatId, caption, isSticker) {
  if (!session.analyzeEnabled && !session.ocrEnabled) return false;

  const buf = await downloadMedia(sock, msg);
  if (!buf || buf.byteLength < 500) return false;

  await sock.sendPresenceUpdate('composing', chatId);

  const label = isSticker ? 'sticker' : 'image';
  let ocrText = null;

  // Try OCR
  if (session.ocrEnabled) {
    try { ocrText = await extractTextOCR(buf, 'eng'); } catch (_) {}
  }

  let response = '';

  if (ocrText && ocrText.length > 10 && session.ocrEnabled) {
    session.stats.ocrRuns++;
    const comment = await APIs.chatAI(
      'I extracted text from an image in chat:\n\n"' + ocrText + '"\n\n' +
      (caption ? 'They also wrote: "' + caption + '"\n\n' : '') +
      'Respond naturally — comment on it, answer questions inside it, or engage conversationally. Keep it short.',
      PERSONAS[session.persona] && PERSONAS[session.persona].prompt
    );
    response = '*Text found in ' + label + ':*\n' +
               '------------------------------\n' +
               ocrText + '\n' +
               '------------------------------\n\n' +
               comment;
  } else if (session.analyzeEnabled) {
    session.stats.imagesAnalyzed++;
    const desc = await analyzeImage(buf, caption || '');
    response = desc;
  }

  if (!response) return false;

  await sock.sendPresenceUpdate('paused', chatId);

  const memNote = ocrText
    ? '[User sent image with text: "' + ocrText.substring(0, 80) + '"]'
    : '[User sent ' + label + (caption ? ': "' + caption + '"' : '') + ']';

  session.history.push({ role: 'user',    content: memNote   });
  session.history.push({ role: 'ladybug', content: response  });
  session.history  = trimHistory(session.history);
  session.msgCount++;

  await sock.sendMessage(chatId, { text: response }, { quoted: msg });
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNAL BRANCH: AUDIO / PTT
// ─────────────────────────────────────────────────────────────────────────────
async function _handleAudio(sock, msg, session, chatId) {
  await sock.sendPresenceUpdate('composing', chatId);
  const reply = await APIs.chatAI(
    'The user sent a voice note. Respond naturally — say you received it, engage as if you heard something interesting, ' +
    'and gently ask them to also type their message so you can help better.',
    PERSONAS[session.persona] && PERSONAS[session.persona].prompt
  );
  await typingDelay(reply, session.delayMs);
  await sock.sendPresenceUpdate('paused', chatId);
  await sock.sendMessage(chatId, { text: reply }, { quoted: msg });
  session.msgCount++;
  session.stats.textReplies++;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODULE EXPORT
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  name:        'autochat',
  aliases:     ['autoreply', 'aichat', 'ladybugai', 'autoai', 'ac'],
  category:    'ai',
  description: 'All-in-One AI: chat, image generation, image analysis & OCR',
  usage:       '.autochat on|off|reset|status|persona <name>|delay <ms>|imggen on|off|analyze on|off|ocr on|off',

  // ─── .autochat command ─────────────────────────────────────────────────────
  async execute(sock, msg, args, extra) {
    const chatId  = (extra && extra.from) || msg.key.remoteJid;
    const session = getSession(chatId);
    const sub     = ((args[0] || '')).toLowerCase();
    const val     = args.slice(1).join(' ').trim();

    switch (sub) {

      case 'on':
      case 'enable': {
        session.enabled = true;
        const p = PERSONAS[session.persona] || PERSONAS.friendly;
        return extra.reply(
          '*AutoChat AI v4 — Enabled!* \n\n' +
          'I will now reply to every message in this chat.\n\n' +
          'Persona:   *' + p.name + '*\n' +
          'Delay:     *' + session.delayMs + 'ms*\n' +
          'Memory:    *' + session.history.length + ' messages*\n' +
          'Img Gen:   *' + (session.imgGenEnabled  ? 'ON' : 'OFF') + '*\n' +
          'Analyze:   *' + (session.analyzeEnabled ? 'ON' : 'OFF') + '*\n' +
          'OCR:       *' + (session.ocrEnabled     ? 'ON' : 'OFF') + '*\n\n' +
          'Quick commands:\n' +
          '  .autochat off / reset / status\n' +
          '  .autochat persona friendly|professional|savage|tutor|therapist|creative|coder\n' +
          '  .autochat imggen off  .autochat analyze off  .autochat ocr off\n\n' +
          '> _Ladybug Bot Mini v4 — All-in-One AutoChat_'
        );
      }

      case 'off':
      case 'disable': {
        session.enabled = false;
        const s = session.stats;
        return extra.reply(
          '*AutoChat AI disabled.*\n\n' +
          'Session stats:\n' +
          '  Text replies:    ' + s.textReplies + '\n' +
          '  Images generated: ' + s.imagesGenerated + '\n' +
          '  Images analyzed:  ' + s.imagesAnalyzed + '\n' +
          '  OCR runs:         ' + s.ocrRuns + '\n\n' +
          'Run *.autochat on* to re-enable.\n\n' +
          '> _Ladybug Bot Mini v4_'
        );
      }

      case 'reset':
      case 'clear': {
        session.history  = [];
        session.msgCount = 0;
        Object.keys(session.stats).forEach(function(k) { session.stats[k] = 0; });
        return extra.reply(
          '*Memory & stats cleared!*\n\n' +
          'Fresh start — all context wiped. \n\n' +
          '> _Ladybug Bot Mini v4_'
        );
      }

      case 'status': {
        const p = (PERSONAS[session.persona] && PERSONAS[session.persona].name) || 'Friendly Ladybug';
        const s = session.stats;
        return extra.reply(
          '*AutoChat v4 — Status*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'State:       ' + (session.enabled ? 'Enabled' : 'Disabled') + '\n' +
          'Persona:     ' + p + '\n' +
          'Memory:      ' + session.history.length + ' messages\n' +
          'Delay:       ' + session.delayMs + 'ms\n' +
          'Total msgs:  ' + session.msgCount + '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Img Gen:     ' + (session.imgGenEnabled  ? 'ON' : 'OFF') + '\n' +
          'Analyze:     ' + (session.analyzeEnabled ? 'ON' : 'OFF') + '\n' +
          'OCR:         ' + (session.ocrEnabled     ? 'ON' : 'OFF') + '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Session Stats:\n' +
          '  Text replies:    ' + s.textReplies + '\n' +
          '  Images generated: ' + s.imagesGenerated + '\n' +
          '  Images analyzed:  ' + s.imagesAnalyzed + '\n' +
          '  OCR runs:         ' + s.ocrRuns + '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '> _Ladybug Bot Mini v4_'
        );
      }

      case 'persona':
      case 'mode': {
        const key = val.toLowerCase();
        if (!PERSONAS[key]) {
          return extra.reply(
            '*Unknown persona: ' + val + '*\n\nAvailable:\n' +
            Object.entries(PERSONAS).map(function(e) { return '  ' + e[0] + ' — ' + e[1].name; }).join('\n')
          );
        }
        session.persona = key;
        session.history = [];
        return extra.reply(
          '*Persona: ' + PERSONAS[key].name + '*\n\n' +
          'Memory cleared for a clean switch.\n\n' +
          '> _Ladybug Bot Mini v4_'
        );
      }

      case 'delay': {
        const ms = parseInt(val, 10);
        if (isNaN(ms) || ms < 300 || ms > 8000) {
          return extra.reply('Delay must be between 300ms and 8000ms.\nExample: .autochat delay 2000');
        }
        session.delayMs = ms;
        return extra.reply('Reply delay set to *' + ms + 'ms*');
      }

      case 'imggen':
      case 'imagegen': {
        const t = val.toLowerCase();
        if (t !== 'on' && t !== 'off') {
          return extra.reply('Usage: .autochat imggen on|off\nCurrent: *' + (session.imgGenEnabled ? 'ON' : 'OFF') + '*');
        }
        session.imgGenEnabled = t === 'on';
        return extra.reply('Auto image generation *' + t.toUpperCase() + '*');
      }

      case 'analyze':
      case 'vision': {
        const t = val.toLowerCase();
        if (t !== 'on' && t !== 'off') {
          return extra.reply('Usage: .autochat analyze on|off\nCurrent: *' + (session.analyzeEnabled ? 'ON' : 'OFF') + '*');
        }
        session.analyzeEnabled = t === 'on';
        return extra.reply('Auto image analysis *' + t.toUpperCase() + '*');
      }

      case 'ocr': {
        const t = val.toLowerCase();
        if (t !== 'on' && t !== 'off') {
          return extra.reply('Usage: .autochat ocr on|off\nCurrent: *' + (session.ocrEnabled ? 'ON' : 'OFF') + '*');
        }
        session.ocrEnabled = t === 'on';
        return extra.reply('Auto OCR *' + t.toUpperCase() + '*');
      }

      default: {
        return extra.reply(
          '*AutoChat AI v4 — All-in-One*\n\n' +
          '*Toggle:*\n' +
          '  .autochat on / off\n\n' +
          '*Control:*\n' +
          '  .autochat status          — stats\n' +
          '  .autochat reset           — clear memory\n' +
          '  .autochat persona <name>  — personality\n' +
          '  .autochat delay <ms>      — reply speed\n' +
          '  .autochat imggen on|off   — image generation\n' +
          '  .autochat analyze on|off  — image analysis\n' +
          '  .autochat ocr on|off      — text extraction\n\n' +
          '*Personas:*\n' +
          Object.entries(PERSONAS).map(function(e) { return '  ' + e[0] + ' — ' + e[1].name; }).join('\n') +
          '\n\n*What I can do automatically:*\n' +
          '  Say "draw me a sunset" => generates image\n' +
          '  Send a photo => AI describes it\n' +
          '  Send image with text => OCR extracts it\n' +
          '  Any text => context-aware AI reply\n' +
          '  Voice note => natural acknowledgement\n\n' +
          '> _Ladybug Bot Mini v4_'
        );
      }
    }
  },

  /**
   * handleIncoming — call this in your message-upsert handler for EVERY message.
   *
   * Example (in handler.js):
   *   const autochat = require('./commands/ai/autochat');
   *   if (await autochat.handleIncoming(sock, msg, extra)) return;
   *
   * Returns true if autochat handled the message, false otherwise.
   */
  async handleIncoming(sock, msg, extra) {
    try {
      const chatId  = (extra && extra.from) || msg.key.remoteJid;
      const session = getSession(chatId);

      if (!session.enabled) return false;

      const rawMsg     = msg.message || {};
      const isImage    = !!rawMsg.imageMessage;
      const isSticker  = !!rawMsg.stickerMessage;
      const isAudio    = !!(rawMsg.audioMessage || rawMsg.pttMessage);
      const isDocument = !!rawMsg.documentMessage;

      const textBody = (
        rawMsg.conversation                   ||
        (rawMsg.extendedTextMessage && rawMsg.extendedTextMessage.text) ||
        (rawMsg.imageMessage  && rawMsg.imageMessage.caption)  ||
        (rawMsg.videoMessage  && rawMsg.videoMessage.caption)  ||
        ''
      ).trim();

      // Skip prefix commands
      const prefix = (function() {
        try { return require('../../config').prefix || '.'; } catch (_) { return '.'; }
      })();
      if (textBody && (textBody[0] === prefix || textBody[0] === '!' || textBody[0] === '/')) return false;

      // Skip very short text (not media)
      if (!isImage && !isSticker && !isAudio && !isDocument && textBody.length < 2) return false;

      if (isImage || isSticker)   return await _handleImage(sock, msg, session, chatId, textBody, isSticker);
      if (isAudio)                return await _handleAudio(sock, msg, session, chatId);
      if (isDocument) {
        const fname = (rawMsg.documentMessage && rawMsg.documentMessage.fileName) || 'file';
        const reply = await APIs.chatAI(
          'The user sent a document named "' + fname + '". Acknowledge it naturally and offer to help.',
          PERSONAS[session.persona] && PERSONAS[session.persona].prompt
        );
        await sock.sendMessage(chatId, { text: reply }, { quoted: msg });
        session.msgCount++;
        return true;
      }
      if (textBody.length > 0) return await _handleText(sock, msg, session, chatId, textBody);

      return false;

    } catch (err) {
      console.error('[AutoChat v4] Error:', err.message);
      return false;
    }
  },

  // Expose for external use
  sessions,
  PERSONAS,
};
