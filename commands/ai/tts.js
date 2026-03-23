/**
 * TTS Command - Text to Speech
 * Ladybug V5
 *
 * Converts text to a voice note using the free Google TTS API.
 * Supports 50+ languages.
 *
 * Usage:
 *   .tts <text>            — speak in auto-detected language
 *   .tts <lang> | <text>   — speak in specific language
 *   .tts list              — show language codes
 *
 * Examples:
 *   .tts Hello, how are you?
 *   .tts es | Hola, ¿cómo estás?
 *   .tts fr | Bonjour tout le monde
 */

const axios = require('axios');

const LANGS = {
  af: 'Afrikaans', ar: 'Arabic',   bn: 'Bengali',  bs: 'Bosnian',
  ca: 'Catalan',   cs: 'Czech',    cy: 'Welsh',    da: 'Danish',
  de: 'German',    el: 'Greek',    en: 'English',  eo: 'Esperanto',
  es: 'Spanish',   et: 'Estonian', fi: 'Finnish',  fr: 'French',
  gu: 'Gujarati',  hi: 'Hindi',    hr: 'Croatian', hu: 'Hungarian',
  hy: 'Armenian',  id: 'Indonesian',is: 'Icelandic',it: 'Italian',
  ja: 'Japanese',  ka: 'Georgian', km: 'Khmer',    kn: 'Kannada',
  ko: 'Korean',    la: 'Latin',    lv: 'Latvian',  mk: 'Macedonian',
  ml: 'Malayalam', mr: 'Marathi',  ms: 'Malay',    my: 'Myanmar',
  ne: 'Nepali',    nl: 'Dutch',    no: 'Norwegian',pl: 'Polish',
  pt: 'Portuguese',ro: 'Romanian', ru: 'Russian',  si: 'Sinhala',
  sk: 'Slovak',    sq: 'Albanian', sr: 'Serbian',  su: 'Sundanese',
  sv: 'Swedish',   sw: 'Swahili',  ta: 'Tamil',    te: 'Telugu',
  th: 'Thai',      tl: 'Filipino', tr: 'Turkish',  uk: 'Ukrainian',
  ur: 'Urdu',      vi: 'Vietnamese',zh: 'Chinese',  zu: 'Zulu',
};

module.exports = {
  name: 'tts',
  aliases: ['voice', 'speak', 'texttospeech', 'say2'],
  category: 'ai',
  description: 'Convert text to a voice message using Google TTS',
  usage: '.tts <text>  OR  .tts <lang> | <text>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args[0] || args[0].toLowerCase() === 'list') {
        const list = Object.entries(LANGS)
          .map(([code, name]) => `\`${code}\` ${name}`)
          .join('  |  ');
        return extra.reply(
          `🔊 *Text to Speech — Language Codes*\n━━━━━━━━━━━━━━━━━━━━\n${list}\n━━━━━━━━━━━━━━━━━━━━`
        );
      }

      let lang = 'en';
      let text = args.join(' ').trim();

      // Check for "lang | text" pattern
      if (text.includes('|')) {
        const [langPart, ...textParts] = text.split('|');
        const possibleLang = langPart.trim().toLowerCase();
        if (LANGS[possibleLang]) {
          lang = possibleLang;
          text = textParts.join('|').trim();
        }
      }

      // Also get text from quoted message if no explicit text
      if (!text) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        text = (
          quoted?.conversation ||
          quoted?.extendedTextMessage?.text ||
          ''
        ).trim();
      }

      if (!text) {
        return extra.reply(`❌ Please provide text to speak.\n\nUsage: .tts <text>\n.tts es | Hola mundo`);
      }

      if (text.length > 200) {
        return extra.reply(`❌ Text is too long (${text.length}/200 chars). Please shorten it.`);
      }

      // Google TTS URL (free, no key needed — same as what Google Translate uses)
      const ttsUrl =
        `https://translate.google.com/translate_tts?ie=UTF-8` +
        `&q=${encodeURIComponent(text)}` +
        `&tl=${lang}` +
        `&client=tw-ob`;

      const res = await axios.get(ttsUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
          'Referer': 'https://translate.google.com/',
        },
      });

      const audioBuffer = Buffer.from(res.data);

      if (!audioBuffer || audioBuffer.length < 100) {
        throw new Error('Empty audio received');
      }

      // Send as voice note (PTT = push to talk)
      await sock.sendMessage(extra.from, {
        audio: audioBuffer,
        mimetype: 'audio/mp4',
        ptt: true,
      }, { quoted: msg });

    } catch (error) {
      console.error('[tts] Error:', error);
      if (error.response?.status === 429) {
        return extra.reply('❌ Rate limit hit. Please try again in a moment.');
      }
      await extra.reply(`❌ TTS failed: ${error.message}`);
    }
  },
};
