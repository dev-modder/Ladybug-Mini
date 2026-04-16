/**
 * ╔══════════════════════════════════════════════════╗
 * ║  Translate v3 — Ladybug Bot Mini                 ║
 * ║  Multi-endpoint with 35+ language support        ║
 * ║  .translate <lang> <text> | reply to msg         ║
 * ╚══════════════════════════════════════════════════╝
 */

'use strict';

const axios = require('axios');
const APIs  = require('../../utils/api');

const LANGS = APIs.LANG_CODES || {
  english:'en', french:'fr', spanish:'es', arabic:'ar', chinese:'zh', german:'de',
  hindi:'hi', portuguese:'pt', russian:'ru', japanese:'ja', korean:'ko',
  swahili:'sw', shona:'sn', zulu:'zu', ndebele:'nd', afrikaans:'af',
  dutch:'nl', italian:'it', turkish:'tr', malay:'ms', indonesian:'id',
  thai:'th', vietnamese:'vi', urdu:'ur', persian:'fa', polish:'pl',
  sotho:'st', xhosa:'xh', yoruba:'yo', igbo:'ig', hausa:'ha', somali:'so',
  amharic:'am', tamil:'ta', romanian:'ro', ukrainian:'uk',
};

// Flag emojis for common languages
const FLAGS = {
  en:'🇬🇧', fr:'🇫🇷', es:'🇪🇸', ar:'🇸🇦', zh:'🇨🇳', de:'🇩🇪', hi:'🇮🇳',
  pt:'🇵🇹', ru:'🇷🇺', ja:'🇯🇵', ko:'🇰🇷', sw:'🇰🇪', sn:'🇿🇼', zu:'🇿🇦',
  af:'🇿🇦', nl:'🇳🇱', it:'🇮🇹', tr:'🇹🇷', ms:'🇲🇾', id:'🇮🇩',
};

async function doTranslate(text, to, from = 'auto') {
  // Method 1: siputzx
  try {
    const r = await axios.get(
      `https://api.siputzx.my.id/api/tools/translate?text=${encodeURIComponent(text)}&to=${to}`,
      { timeout: 12000 }
    );
    const t = r.data?.data?.translatedText;
    if (t) return { text: t, detectedLang: r.data?.data?.sourceLanguage };
  } catch(_) {}

  // Method 2: Google Translate (unofficial)
  try {
    const r = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`,
      { timeout: 12000 }
    );
    const trans = r.data?.[0]?.map(x => x?.[0]).filter(Boolean).join('');
    const det   = r.data?.[2];
    if (trans) return { text: trans, detectedLang: det };
  } catch(_) {}

  // Method 3: MyMemory
  try {
    const r = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
      { timeout: 12000 }
    );
    const t = r.data?.responseData?.translatedText;
    if (t && !t.toLowerCase().includes('quota')) return { text: t };
  } catch(_) {}

  throw new Error('Translation failed. All providers unavailable.');
}

module.exports = {
  name: 'translate',
  aliases: ['tr', 'trans', 'tl', 'tlang'],
  category: 'ai',
  description: 'Translate text to any language with 35+ language support',
  usage: '.translate <language> <text>   OR   reply to message with .translate <language>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        const list = Object.keys(LANGS).slice(0, 20).join(', ') + '...';
        return extra.reply(
          `🌐 *Translate v3*\n\n` +
          `*Usage:*\n` +
          `  .translate french Hello how are you?\n` +
          `  .translate shona I love Zimbabwe\n` +
          `  .translate en Bonjour (reply to msg)\n\n` +
          `*Supported Languages:*\n${list}\n\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }

      // Resolve target language
      const langInput = args[0].toLowerCase();
      let toLang = LANGS[langInput] || (Object.values(LANGS).includes(langInput) ? langInput : null);
      if (!toLang && langInput.length === 2) toLang = langInput; // raw code

      if (!toLang) {
        return extra.reply(
          `❌ Unknown language: *${args[0]}*\n\n` +
          `Try: english, french, spanish, arabic, shona, swahili, zulu, hindi, chinese...\n\n` +
          `Or use a 2-letter code like: en, fr, es, ar, sn, sw, zu`
        );
      }

      // Get text from args or quoted message
      let text = args.slice(1).join(' ').trim();
      if (!text) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        text = (
          quoted?.conversation ||
          quoted?.extendedTextMessage?.text ||
          quoted?.imageMessage?.caption || ''
        ).trim();
      }

      if (!text) return extra.reply('❌ Please provide text to translate, or reply to a message.');
      if (text.length > 3000) return extra.reply('❌ Text too long. Max 3000 characters.');

      await extra.reply('🌐 Translating...');

      const result    = await doTranslate(text, toLang);
      const langName  = Object.keys(LANGS).find(k => LANGS[k] === toLang) || toLang;
      const flag      = FLAGS[toLang] || '🌐';

      await extra.reply(
        `${flag} *Translation*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📤 *Original:*\n${text.slice(0, 300)}\n\n` +
        `📥 *${langName.charAt(0).toUpperCase() + langName.slice(1)}:*\n${result.text}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        (result.detectedLang ? `🔍 Detected: ${result.detectedLang}\n` : '') +
        `> _Ladybug Bot Mini v3_`
      );

    } catch (error) {
      console.error('[translate] Error:', error.message);
      await extra.reply(`❌ ${error.message}`);
    }
  }
};
