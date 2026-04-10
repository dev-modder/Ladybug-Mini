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

// ─── Intent detector ──────────────────────────────────────────────────────────
// Returns a string intent key if the message matches a known action, else null.
function detectIntent(text) {
  const t = text.toLowerCase();

  // Image generation
  if (/\b(generate|create|make|draw|design|produce|give me|show me|send me)\s+(me\s+)?(a|an|some|the)?\s*(image|picture|photo|pic|art|artwork|illustration|painting|drawing|wallpaper|poster|logo)\b/i.test(text)) return 'IMAGE_GEN';
  if (/\b(image|picture|photo|pic|art|painting|drawing)\s+of\b/i.test(text)) return 'IMAGE_GEN';
  if (/\b(imagine|visualize|render|sketch)\b.{0,60}\b(image|picture|scene|art|of)\b/i.test(text)) return 'IMAGE_GEN';

  // Remove background
  if (/\b(remove|cut out|delete|strip)\s+(the\s+)?(background|bg)\b/i.test(text)) return 'REMOVEBG';

  // Song / music download
  if (/\b(play|download|send|get)\s+(me\s+)?(the\s+|a\s+)?(song|music|audio|track|mp3)\b/i.test(text)) return 'SONG';
  if (/\b(song|music)\s+(called|named|by|from|titled)\b/i.test(text)) return 'SONG';

  // YouTube search
  if (/\b(search|find|look up|youtube|yt)\b.{0,40}\b(video|song|music|youtube|yt)\b/i.test(text)) return 'YOUTUBE';
  if (/\byoutube\b.{0,60}\b(search|find|look)\b/i.test(text)) return 'YOUTUBE';

  // Translate
  if (/\b(translate|translation)\b/i.test(text)) return 'TRANSLATE';
  if (/\btranslate\s+(this|it|the|to|into)\b/i.test(text)) return 'TRANSLATE';

  // Summarize
  if (/\b(summarize|summary|tldr|tl;dr|shorten|brief|sum up)\b/i.test(text)) return 'SUMMARIZE';

  // Text to speech / voice
  if (/\b(say|speak|read|voice|tts|text.?to.?speech)\b.{0,40}\b(this|it|aloud|out loud|for me|in voice)\b/i.test(text)) return 'TTS';
  if (/\bsend\s+(a\s+)?(voice|audio)\s+(note|message|saying|of)\b/i.test(text)) return 'TTS';

  // Story
  if (/\b(write|tell|create|generate|make)\s+(me\s+)?(a|an|short)?\s*(story|tale|fiction|short story|bedtime story)\b/i.test(text)) return 'STORY';

  // Poem
  if (/\b(write|create|make|generate)\s+(me\s+)?(a|an)?\s*(poem|poetry|rhyme|verse|haiku|sonnet)\b/i.test(text)) return 'POEM';

  // Song lyrics generation
  if (/\b(write|create|make|generate)\s+(me\s+)?(a|an|some)?\s*(song|lyrics|chorus|verse|hook)\b/i.test(text)) return 'LYRICS_GEN';
  if (/\b(song lyrics?|write lyrics?)\b/i.test(text)) return 'LYRICS_GEN';

  // AI sings (voice performance)
  if (/\b(sing|perform|sing me|sing a song|ai sing)\b/i.test(text)) return 'SING';

  // Advice
  if (/\b(advice|advise|help me with|what should i do|how do i deal with|counsel)\b/i.test(text)) return 'ADVICE';

  // Roast
  if (/\b(roast me|roast (my|this)|make fun of me|clown me|burn me)\b/i.test(text)) return 'ROAST';

  // Joke
  if (/\b(tell me a joke|give me a joke|funny joke|make me laugh|joke)\b/i.test(text)) return 'JOKE';

  // Flirt / pickup line
  if (/\b(flirt|pickup line|pick.?up line|rizz me|chat me up)\b/i.test(text)) return 'FLIRT';

  // Debate
  if (/\b(debate|argue|both sides|pros and cons|for and against)\b/i.test(text)) return 'DEBATE';

  // Compliment
  if (/\b(compliment me|compliment (my|this)|hype me|say something nice)\b/i.test(text)) return 'COMPLIMENT';

  // Define / dictionary
  if (/\b(define|definition of|what does .{1,40} mean|meaning of|dictionary)\b/i.test(text)) return 'DEFINE';

  // Wikipedia / search info
  if (/\b(wikipedia|wiki|who is|what is|tell me about|explain)\s+.{2,}/i.test(text)) return 'WIKI';

  // Weather
  if (/\b(weather|temperature|forecast|climate)\b.{0,40}\b(in|at|for|today|tomorrow|now)\b/i.test(text)) return 'WEATHER';
  if (/\bweather\s+in\b/i.test(text)) return 'WEATHER';

  // Sticker from image
  if (/\b(make|create|convert|turn).{0,20}(sticker|stiker)\b/i.test(text)) return 'STICKER';

  // Shazam / identify song from audio
  if (/\b(what song is this|identify (this )?song|shazam|name this song|song name)\b/i.test(text)) return 'SHAZAM';

  return null;
}

// ─── Intent handlers ──────────────────────────────────────────────────────────
async function handleIntent(intent, rawText, sock, msg, chatId, senderName) {
  const yts = (() => { try { return require('yt-search'); } catch (_) { return null; } })();

  // Extract a clean "subject" from the message for use in API queries
  const cleanQuery = rawText
    .replace(/\b(please|can you|could you|i want|i need|i would like|give me|show me|send me|tell me|write me)\b/gi, '')
    .replace(/\b(a|an|some|the|me|for me)\b/gi, '')
    .trim();

  switch (intent) {

    // ── Song download ──────────────────────────────────────────────────────────
    case 'SONG': {
      const songQuery = cleanQuery
        .replace(/\b(play|download|song|music|audio|track|mp3|called|named|by|from|titled)\b/gi, '')
        .trim() || rawText;
      await sock.sendMessage(chatId, { text: '🎵 Searching for *' + songQuery + '*...' }, { quoted: msg });
      try {
        if (!yts) throw new Error('yt-search not available');
        const results = await yts(songQuery);
        const video = results?.videos?.find(v => v.seconds > 30 && v.seconds < 600);
        if (!video) throw new Error('No results found');

        await sock.sendMessage(chatId, { text: '📥 Found *' + video.title + '* (' + video.timestamp + '). Downloading...' }, { quoted: msg });

        const dlApis = [
          () => axios.get('https://api.siputzx.my.id/api/d/ytmp3', { params: { url: video.url }, timeout: 30000 })
            .then(r => r?.data?.data?.url || r?.data?.url),
          () => axios.get('https://api.agatz.xyz/api/ytmp3', { params: { url: video.url }, timeout: 25000 })
            .then(r => r?.data?.data || r?.data?.url),
        ];

        let audioUrl = null;
        for (const fn of dlApis) {
          try { audioUrl = await fn(); if (audioUrl) break; } catch (_) {}
        }

        if (!audioUrl) throw new Error('Download failed');

        const audioRes = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 60000 });
        const tmpFile  = require('path').join(__dirname, '../../temp', 'aar_song_' + Date.now() + '.mp3');
        require('fs').writeFileSync(tmpFile, audioRes.data);

        await sock.sendMessage(chatId, {
          audio: require('fs').readFileSync(tmpFile),
          mimetype: 'audio/mp4',
          ptt: false,
          fileName: video.title + '.mp3',
        }, { quoted: msg });

        require('fs').unlinkSync(tmpFile);
        return true;
      } catch (e) {
        await sock.sendMessage(chatId, { text: '⚠️ Could not download that song right now. Try *.song ' + songQuery + '* directly!' }, { quoted: msg });
        return true;
      }
    }

    // ── YouTube search ─────────────────────────────────────────────────────────
    case 'YOUTUBE': {
      const ytQuery = cleanQuery.replace(/\b(search|find|look up|youtube|yt|video)\b/gi, '').trim() || rawText;
      try {
        if (!yts) throw new Error('yt-search not available');
        const results = await yts(ytQuery);
        const top = (results?.videos || []).slice(0, 5);
        if (!top.length) throw new Error('No results');
        const list = top.map((v, i) => (i + 1) + '. *' + v.title + '*\n   ⏱️ ' + v.timestamp + ' | 👁️ ' + (v.views ? v.views.toLocaleString() : 'N/A') + ' views\n   🔗 ' + v.url).join('\n\n');
        await sock.sendMessage(chatId, { text: '🎬 *YouTube Results: ' + ytQuery + '*\n\n' + list }, { quoted: msg });
        return true;
      } catch (e) {
        await sock.sendMessage(chatId, { text: '⚠️ Could not search YouTube right now. Try *.yts ' + ytQuery + '*' }, { quoted: msg });
        return true;
      }
    }

    // ── Translate ──────────────────────────────────────────────────────────────
    case 'TRANSLATE': {
      // Detect target language from message
      const langMatch = rawText.match(/\b(to|into|in)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\b/i);
      const targetLang = langMatch ? langMatch[2].trim() : 'english';
      const textToTranslate = cleanQuery
        .replace(/\b(translate|translation|to|into|in)\b/gi, '')
        .replace(new RegExp(targetLang, 'gi'), '')
        .trim() || rawText;

      await sock.sendMessage(chatId, { text: '🌍 Translating to *' + targetLang + '*...' }, { quoted: msg });
      const prompt = 'Translate the following text to ' + targetLang + '. Return ONLY the translation, nothing else:\n\n"' + textToTranslate + '"';
      const result = await callAI(prompt);
      await sock.sendMessage(chatId, { text: '🌍 *Translation (' + targetLang + '):*\n\n' + result }, { quoted: msg });
      return true;
    }

    // ── Summarize ──────────────────────────────────────────────────────────────
    case 'SUMMARIZE': {
      const textToSum = cleanQuery.replace(/\b(summarize|summary|tldr|tl;dr|shorten|brief|sum up)\b/gi, '').trim();
      // Also check if replying to a message
      const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
      const content = quotedText || textToSum;
      if (!content || content.length < 20) {
        await sock.sendMessage(chatId, { text: '📝 Reply to a long message with "summarize this" and I will shorten it for you!' }, { quoted: msg });
        return true;
      }
      const result = await callAI('Summarize the following text in 3-5 bullet points. Be concise and clear:\n\n' + content);
      await sock.sendMessage(chatId, { text: '📝 *Summary:*\n\n' + result }, { quoted: msg });
      return true;
    }

    // ── TTS voice ──────────────────────────────────────────────────────────────
    case 'TTS': {
      const ttsText = cleanQuery.replace(/\b(say|speak|read|voice|tts|text.?to.?speech|send|note|message|saying|of|aloud|out loud|for me|in voice|a|an)\b/gi, '').trim() || rawText;
      await sock.sendMessage(chatId, { text: '🎙️ Converting to voice: *' + ttsText.slice(0, 60) + (ttsText.length > 60 ? '...' : '') + '*' }, { quoted: msg });
      try {
        const ttsRes = await axios.get('https://api.streamelements.com/kappa/v2/speech', {
          params: { voice: 'Brian', text: ttsText.slice(0, 500) },
          responseType: 'arraybuffer',
          timeout: 20000,
        });
        if (ttsRes.data && ttsRes.data.byteLength > 1000) {
          const tmpFile = require('path').join(__dirname, '../../temp', 'aar_tts_' + Date.now() + '.mp3');
          require('fs').writeFileSync(tmpFile, ttsRes.data);
          await sock.sendMessage(chatId, { audio: require('fs').readFileSync(tmpFile), mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
          require('fs').unlinkSync(tmpFile);
          return true;
        }
      } catch (_) {}
      await sock.sendMessage(chatId, { text: '⚠️ Voice conversion failed. Try *.tts ' + ttsText.slice(0, 80) + '*' }, { quoted: msg });
      return true;
    }

    // ── Story ──────────────────────────────────────────────────────────────────
    case 'STORY': {
      const storyTopic = cleanQuery.replace(/\b(write|tell|create|generate|make|a|an|short|story|tale|fiction|bedtime)\b/gi, '').trim() || 'an interesting adventure';
      await sock.sendMessage(chatId, { text: '📖 Writing a story about *' + storyTopic + '*...' }, { quoted: msg });
      const result = await callAI('Write a short, engaging story about: "' + storyTopic + '". Keep it under 300 words. Make it interesting with a beginning, middle, and end. Use vivid language.');
      await sock.sendMessage(chatId, { text: '📖 *Story: ' + storyTopic + '*\n\n' + result + '\n\n> _Written by Ladybug AI — Dev-Ntando 🇿🇼_' }, { quoted: msg });
      return true;
    }

    // ── Poem ───────────────────────────────────────────────────────────────────
    case 'POEM': {
      const poemTopic = cleanQuery.replace(/\b(write|create|make|generate|a|an|poem|poetry|rhyme|verse|haiku|sonnet)\b/gi, '').trim() || 'life';
      await sock.sendMessage(chatId, { text: '✍️ Writing a poem about *' + poemTopic + '*...' }, { quoted: msg });
      const result = await callAI('Write a beautiful, creative poem about: "' + poemTopic + '". Make it emotional and rhythmic. 3-4 stanzas.');
      await sock.sendMessage(chatId, { text: '✍️ *Poem: ' + poemTopic + '*\n\n' + result + '\n\n> _Written by Ladybug AI — Dev-Ntando 🇿🇼_' }, { quoted: msg });
      return true;
    }

    // ── Song lyrics generation ─────────────────────────────────────────────────
    case 'LYRICS_GEN': {
      const songTopic = cleanQuery.replace(/\b(write|create|make|generate|song|lyrics|chorus|verse|hook|a|an|some)\b/gi, '').trim() || 'life';
      await sock.sendMessage(chatId, { text: '🎵 Writing song lyrics for *' + songTopic + '*...' }, { quoted: msg });
      const result = await callAI('Write complete original song lyrics about: "' + songTopic + '". Include [VERSE 1], [CHORUS], [VERSE 2], [BRIDGE]. Make it rhyme and have good flow. Add a suggested genre and BPM at the top.');
      await sock.sendMessage(chatId, { text: '🎵 *Song Lyrics: ' + songTopic + '*\n\n' + result + '\n\n> _Written by Ladybug AI — Dev-Ntando 🇿🇼_' }, { quoted: msg });
      return true;
    }

    // ── AI sings ───────────────────────────────────────────────────────────────
    case 'SING': {
      const singTopic = cleanQuery.replace(/\b(sing|perform|a|an|song|me)\b/gi, '').trim() || 'something beautiful';
      await sock.sendMessage(chatId, { text: '🎤 Let me sing you something about *' + singTopic + '*...' }, { quoted: msg });
      // Write short singable lyrics then TTS them
      const lyrics = await callAI('Write very short, singable lyrics (max 8 lines) about: "' + singTopic + '". Focus on rhythm. No formatting tags, just the lyrics.');
      await sock.sendMessage(chatId, { text: '🎵 *' + singTopic + '*\n\n' + lyrics }, { quoted: msg });
      try {
        const singtts = 'I am singing for you now. ' + lyrics;
        const ttsRes = await axios.get('https://api.streamelements.com/kappa/v2/speech', {
          params: { voice: 'Brian', text: singtts.slice(0, 500) },
          responseType: 'arraybuffer', timeout: 20000,
        });
        if (ttsRes.data && ttsRes.data.byteLength > 1000) {
          const tmpFile = require('path').join(__dirname, '../../temp', 'aar_sing_' + Date.now() + '.mp3');
          require('fs').writeFileSync(tmpFile, ttsRes.data);
          await sock.sendMessage(chatId, { audio: require('fs').readFileSync(tmpFile), mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
          require('fs').unlinkSync(tmpFile);
        }
      } catch (_) {}
      return true;
    }

    // ── Advice ─────────────────────────────────────────────────────────────────
    case 'ADVICE': {
      const situation = cleanQuery.replace(/\b(advice|advise|help|what should i do|how do i deal with|counsel)\b/gi, '').trim() || rawText;
      const result = await callAI('Give thoughtful, practical life advice for this situation: "' + situation + '". Be empathetic, honest, and give 3 clear action steps. Keep it under 200 words.');
      await sock.sendMessage(chatId, { text: '💡 *Advice:*\n\n' + result + '\n\n> _Ladybug AI — Dev-Ntando 🇿🇼_' }, { quoted: msg });
      return true;
    }

    // ── Roast ──────────────────────────────────────────────────────────────────
    case 'ROAST': {
      const result = await callAI('Give a funny, savage but not cruel roast for ' + senderName + '. Make it clever and witty. One paragraph max.');
      await sock.sendMessage(chatId, { text: '🔥 *Roast for ' + senderName + ':*\n\n' + result }, { quoted: msg });
      return true;
    }

    // ── Joke ───────────────────────────────────────────────────────────────────
    case 'JOKE': {
      const result = await callAI('Tell me a funny, clean joke. Make it original and clever. Format: setup on one line, punchline on the next.');
      await sock.sendMessage(chatId, { text: '😂 ' + result }, { quoted: msg });
      return true;
    }

    // ── Flirt ──────────────────────────────────────────────────────────────────
    case 'FLIRT': {
      const result = await callAI('Give a smooth, original flirty pickup line or compliment for ' + senderName + '. Make it charming but not cringe. One line.');
      await sock.sendMessage(chatId, { text: '💘 ' + result }, { quoted: msg });
      return true;
    }

    // ── Debate ─────────────────────────────────────────────────────────────────
    case 'DEBATE': {
      const topic = cleanQuery.replace(/\b(debate|argue|both sides|pros and cons|for and against)\b/gi, '').trim() || rawText;
      const result = await callAI('Debate both sides of: "' + topic + '". Format:\n\n✅ FOR:\n[3 strong points]\n\n❌ AGAINST:\n[3 strong points]\n\n⚖️ VERDICT:\n[balanced conclusion in 1-2 sentences]');
      await sock.sendMessage(chatId, { text: '⚖️ *Debate: ' + topic + '*\n\n' + result }, { quoted: msg });
      return true;
    }

    // ── Compliment ─────────────────────────────────────────────────────────────
    case 'COMPLIMENT': {
      const result = await callAI('Give a genuine, uplifting compliment for ' + senderName + '. Make it heartfelt and specific. 2-3 sentences.');
      await sock.sendMessage(chatId, { text: '💐 ' + result }, { quoted: msg });
      return true;
    }

    // ── Define ─────────────────────────────────────────────────────────────────
    case 'DEFINE': {
      const word = cleanQuery.replace(/\b(define|definition of|what does|mean|meaning of|dictionary)\b/gi, '').replace(/\bthe\b/gi, '').trim() || rawText;
      const result = await callAI('Define "' + word + '". Format:\n📖 *' + word + '*\n\nDefinition: [clear definition]\n\nExample: [example sentence]\n\nSynonyms: [3 synonyms]');
      await sock.sendMessage(chatId, { text: result }, { quoted: msg });
      return true;
    }

    // ── Wikipedia / info ───────────────────────────────────────────────────────
    case 'WIKI': {
      const topic = cleanQuery.replace(/\b(wikipedia|wiki|who is|what is|tell me about|explain)\b/gi, '').trim() || rawText;
      const result = await callAI('Give a concise, accurate Wikipedia-style summary of: "' + topic + '". Include key facts, dates, and why it matters. Keep it under 250 words.');
      await sock.sendMessage(chatId, { text: '📚 *' + topic + '*\n\n' + result }, { quoted: msg });
      return true;
    }

    // ── Weather ────────────────────────────────────────────────────────────────
    case 'WEATHER': {
      const location = cleanQuery.replace(/\b(weather|temperature|forecast|climate|in|at|for|today|tomorrow|now)\b/gi, '').trim() || 'Harare Zimbabwe';
      try {
        const wRes = await axios.get('https://wttr.in/' + encodeURIComponent(location) + '?format=3', { timeout: 10000 });
        await sock.sendMessage(chatId, { text: '🌤️ *Weather: ' + location + '*\n\n' + wRes.data }, { quoted: msg });
      } catch (_) {
        const result = await callAI('What is the typical weather like in ' + location + '? Give a brief overview of temperature, climate, and current season.');
        await sock.sendMessage(chatId, { text: '🌤️ *Weather info: ' + location + '*\n\n' + result }, { quoted: msg });
      }
      return true;
    }

    default:
      return false;
  }
}

// ─── DM handler (export for message handler integration) ──────────────────────
async function handleIncomingDM(sock, msg) {
  const cfg = readConfig();
  if (!cfg.aiAutoReply) return;

  const chatId  = msg.key.remoteJid;
  const isGroup = chatId.endsWith('@g.us');

  // Block groups unless owner has enabled group mode
  if (isGroup && !cfg.aiAutoReplyGroups) return;

  const senderJid  = msg.key.participant || chatId;
  const senderName = msg.pushName || senderJid.split('@')[0] || 'User';

  // ── Group trigger logic ────────────────────────────────────────────────────
  // In groups, only reply when the bot is mentioned (@tagged) or quoted/replied to.
  // This prevents the bot from responding to every single group message.
  if (isGroup) {
    const botJid = sock.user?.id?.replace(/:\d+/, '') + '@s.whatsapp.net';
    const rawGroupText = msg.message?.conversation
      || msg.message?.extendedTextMessage?.text
      || msg.message?.imageMessage?.caption || '';

    const isMentioned = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])
      .some(j => j === botJid || j?.split('@')[0] === botJid?.split('@')[0]);
    const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.participant === botJid
      || msg.message?.extendedTextMessage?.contextInfo?.participant?.split('@')[0] === botJid?.split('@')[0];
    const isBotReplied = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage != null
      && msg.message?.extendedTextMessage?.contextInfo?.participant === botJid;

    if (!isMentioned && !isQuoted && !isBotReplied) return;
  }
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

    // ── Intent detection — route to the right capability ───────────────────
    const intent = detectIntent(rawText);

    if (intent === 'IMAGE_GEN') {
      let imgPrompt = rawText
        .replace(/\b(please|can you|could you|i want|i need|i would like|give me|show me|send me)\b/gi, '')
        .replace(/\b(generate|create|make|draw|design|produce|imagine|visualize|render|sketch)\s*(me\s*)?(a|an|some|the)?\s*/gi, '')
        .replace(/\b(image|picture|photo|pic|art|artwork|illustration|painting|drawing|wallpaper|poster|logo)\s*(of)?\s*/gi, '')
        .replace(/\s+/g, ' ').trim();
      if (!imgPrompt || imgPrompt.length < 3) imgPrompt = rawText.trim();

      await sock.sendMessage(chatId, { text: '\u{1F3A8} Generating image: *' + imgPrompt + '*...' }, { quoted: msg });

      let imgSent = false;
      const imgApis = [
        () => axios.get('https://api.siputzx.my.id/api/ai/magicstudio', { params: { prompt: imgPrompt }, responseType: 'arraybuffer', timeout: 90000 }),
        () => axios.get('https://api.siputzx.my.id/api/ai/stablediffusion', { params: { prompt: imgPrompt }, responseType: 'arraybuffer', timeout: 60000 }),
        () => axios.get('https://image.pollinations.ai/prompt/' + encodeURIComponent(imgPrompt) + '?width=800&height=800&nologo=true', { responseType: 'arraybuffer', timeout: 60000 }),
      ];
      for (const apiFn of imgApis) {
        try {
          const res = await apiFn();
          const buf = Buffer.from(res.data);
          if (buf && buf.length > 2000) {
            await sock.sendMessage(chatId, { image: buf, caption: '\u{1F3A8} *' + imgPrompt + '*\n> _Ladybug AI \u2014 Dev-Ntando_ \u{1F1FF}\u{1F1FC}' }, { quoted: msg });
            imgSent = true;
            if (memoryOn) {
              userMem.history = trimHistory([...history,
                { role: 'user', content: rawText },
                { role: 'assistant', content: '[Generated image: ' + imgPrompt + ']' }]);
              mem[senderJid] = userMem; saveMemory(mem);
            }
            break;
          }
        } catch (_) {}
      }
      if (!imgSent) await sock.sendMessage(chatId, { text: '\u26A0\uFE0F Image generation failed. Try *.imagine ' + imgPrompt + '*' }, { quoted: msg });
      return;
    }

    if (intent && intent !== 'IMAGE_GEN') {
      const handled = await handleIntent(intent, rawText, sock, msg, chatId, senderName);
      if (handled) {
        if (memoryOn) {
          userMem.history = trimHistory([...history,
            { role: 'user', content: rawText },
            { role: 'assistant', content: '[' + intent + ' action performed]' }]);
          mem[senderJid] = userMem; saveMemory(mem);
        }
        return;
      }
    }

    // ── Normal AI reply ─────────────────────────────────────────────────────
    let prompt;

    if (isSchool && !userMem.gradeLevel && history.length === 0 && !det) {
      replyText =
        '\u{1F44B} *Hello ' + senderName + '!* I am *Ladybug* \u2014 your AI school tutor! \u{1F4DA}\u{1F1FF}\u{1F1FC}\n\n' +
        'To give you the *best* help, please tell me:\n\n' +
        '1\uFE0F\u20E3 *What level are you?*\n' +
        '   (Grade 1-7 / Form 1-4 / O-Level / A-Level / University)\n\n' +
        '2\uFE0F\u20E3 *What curriculum?*\n' +
        '   (ZIMSEC / Cambridge / IB / Other)\n\n' +
        'I can help with:\n' +
        '\u{1F4DD} Homework & assignments\n' +
        '\u{1F4D0} Maths \u2014 step by step\n' +
        '\u{1F52C} Science explanations\n' +
        '\u270D\uFE0F Essays (ZIMSEC format)\n' +
        '\u{1F4F7} Exam paper photos \u2014 just send the image!\n' +
        '\u{1F4C4} PDFs & documents\n' +
        '\u{1F5D3}\uFE0F Study plans\n' +
        '\u{1F3A8} Generate images \u2014 just ask!\n\n' +
        '> _Powered by Ladybug Bot Mini V5 \u2014 Dev-Ntando_ \u{1F1FF}\u{1F1FC}';
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
          '• Groups:         *' + (cfg.aiAutoReplyGroups ? '👥 ON (mention/quote to trigger)' : '❌ DMs only') + '*\n' +
          '• School Mode:    *' + (cfg.aiAutoReplySchool ? '🎓 ON' : '❌ OFF') + '*\n' +
          '• Curriculum:     *' + (cfg.aiAutoReplyCurriculum || 'ZIMSEC (default)') + '*\n' +
          '• Default Level:  *' + (cfg.aiAutoReplyLevel || 'Not set') + '*\n' +
          '• Memory:         *' + (cfg.aiAutoReplyMemory !== false ? '🧠 ON' : '❌ OFF') + '*\n' +
          '• Users in Memory:*' + Object.keys(mem).length + '*\n' +
          '• Custom Prompt:  *' + (cfg.aiAutoReplyPrompt ? '✏️ Set' : '📄 Default') + '*\n\n' +
          '📋 *Commands:*\n' +
          '  .aar on / off\n' +
          '  .aar groups on / off\n' +
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
        return extra.reply('🟢 *AI Auto-Reply Enabled!*\n\nReplying to all DMs with AI.\n💡 Enable groups too: *.aar groups on*\n💡 Try school mode: *.aar school on*\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
      }

      if (sub === 'off' || sub === 'disable') {
        writeConfig('aiAutoReply', false);
        return extra.reply('🔴 *AI Auto-Reply Disabled.*\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
      }

      // groups on/off
      if (sub === 'groups' || sub === 'group') {
        if (sub2 === 'on' || sub2 === 'enable') {
          writeConfig('aiAutoReplyGroups', true);
          return extra.reply(
            '👥 *Group Mode ON!*\n\n' +
            'AI auto-reply is now active in *groups* too.\n\n' +
            '⚠️ *Important:* In groups, the bot only replies when:\n' +
            '  • Someone *@mentions* the bot\n' +
            '  • Someone *quotes/replies* to the bot\'s message\n\n' +
            'This prevents the bot from spamming every group message.\n\n' +
            '> _Made with ❤️ by Dev-Ntando 🇿🇼_'
          );
        }
        if (sub2 === 'off' || sub2 === 'disable') {
          writeConfig('aiAutoReplyGroups', false);
          return extra.reply('🔴 *Group Mode OFF.*\nAI auto-reply is now DMs only.\n\n> _Made with ❤️ by Dev-Ntando 🇿🇼_');
        }
        return extra.reply('❓ Usage: *.aar groups on* or *.aar groups off*');
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
        'Options: on, off, status, groups on/off, school on/off,\n         setlevel, setcurriculum, setprompt, clearprompt,\n         memory on/off, clearall'
      );
    } catch (e) {
      console.error('[aiautoreply]', e);
      await extra.reply('❌ Error: ' + e.message);
    }
  },
};
