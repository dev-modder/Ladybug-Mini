/**
 * Translate Command - AI-powered language translation
 * Ladybug V5
 *
 * Uses MyMemory free translation API (no key needed, 5k words/day free).
 *
 * Usage:
 *   .translate <lang> <text>
 *   .translate <lang> (reply to a message)
 *   .translate list  — show popular language codes
 *
 * Examples:
 *   .translate fr Hello, how are you?
 *   .translate es (reply to any message)
 *   .translate zh Good morning
 */

const axios = require('axios');

const LANG_MAP = {
  af: 'Afrikaans', sq: 'Albanian', ar: 'Arabic', az: 'Azerbaijani',
  bn: 'Bengali', bs: 'Bosnian', bg: 'Bulgarian', ca: 'Catalan',
  zh: 'Chinese', hr: 'Croatian', cs: 'Czech', da: 'Danish',
  nl: 'Dutch', en: 'English', eo: 'Esperanto', et: 'Estonian',
  fi: 'Finnish', fr: 'French', de: 'German', el: 'Greek',
  gu: 'Gujarati', ht: 'Haitian Creole', he: 'Hebrew', hi: 'Hindi',
  hu: 'Hungarian', id: 'Indonesian', it: 'Italian', ja: 'Japanese',
  kn: 'Kannada', ko: 'Korean', lv: 'Latvian', lt: 'Lithuanian',
  ms: 'Malay', ml: 'Malayalam', mr: 'Marathi', ne: 'Nepali',
  no: 'Norwegian', pl: 'Polish', pt: 'Portuguese', ro: 'Romanian',
  ru: 'Russian', sr: 'Serbian', sk: 'Slovak', sl: 'Slovenian',
  es: 'Spanish', sw: 'Swahili', sv: 'Swedish', tl: 'Filipino',
  ta: 'Tamil', te: 'Telugu', th: 'Thai', tr: 'Turkish',
  uk: 'Ukrainian', ur: 'Urdu', vi: 'Vietnamese', cy: 'Welsh',
  xh: 'Xhosa', yi: 'Yiddish', yo: 'Yoruba', zu: 'Zulu',
};

module.exports = {
  name: 'translate',
  aliases: ['tr', 'tl', 'trans'],
  category: 'ai',
  description: 'Translate text to any language using AI',
  usage: '.translate <lang code> <text>  OR  reply to a message',

  async execute(sock, msg, args, extra) {
    try {
      // Show language list
      if (args[0]?.toLowerCase() === 'list') {
        const lines = Object.entries(LANG_MAP)
          .map(([code, name]) => `  \`${code}\` — ${name}`)
          .join('\n');
        return extra.reply(
          `🌍 *Language Codes*\n━━━━━━━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━━━━━━━`
        );
      }

      if (args.length === 0) {
        return extra.reply(
          `🌍 *Translate*\n\n` +
          `Usage:\n` +
          `  .translate <lang> <text>\n` +
          `  .translate <lang> (reply to message)\n\n` +
          `Examples:\n` +
          `  .translate fr Hello world\n` +
          `  .translate es (reply to a message)\n\n` +
          `Type *.translate list* for all language codes.`
        );
      }

      const targetLang = args[0].toLowerCase();

      if (!LANG_MAP[targetLang]) {
        return extra.reply(
          `❌ Unknown language code: \`${targetLang}\`\n\nType *.translate list* to see all supported codes.`
        );
      }

      // Get text from args or quoted message
      let text = args.slice(1).join(' ').trim();
      if (!text) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        text = (
          quoted?.conversation ||
          quoted?.extendedTextMessage?.text ||
          quoted?.imageMessage?.caption ||
          ''
        ).trim();
      }

      if (!text) {
        return extra.reply(`❌ Please provide text to translate, or reply to a message.`);
      }

      // Call MyMemory API (free, no key needed)
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: { q: text, langpair: `auto|${targetLang}` },
        timeout: 15000,
      });

      const data = response.data;
      if (!data?.responseData?.translatedText) {
        throw new Error('No translation returned');
      }

      const translated = data.responseData.translatedText;
      const detectedLang = data.responseData.detectedLanguage || 'auto';
      const quality = Math.round((data.responseData.match || 0) * 100);

      await extra.reply(
        `🌍 *Translation*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔤 From: \`${detectedLang}\`\n` +
        `🌐 To: \`${targetLang}\` (${LANG_MAP[targetLang]})\n` +
        `📊 Confidence: ${quality}%\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📥 *Original:*\n${text}\n\n` +
        `📤 *Translated:*\n${translated}`
      );

    } catch (error) {
      console.error('[translate] Error:', error);
      await extra.reply(`❌ Translation failed: ${error.message}`);
    }
  },
};
