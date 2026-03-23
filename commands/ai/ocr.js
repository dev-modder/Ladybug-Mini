/**
 * OCR Command - Extract text from images (Optical Character Recognition)
 * Ladybug V5
 *
 * Uses the free OCR.space API (25k requests/month free).
 * No key needed for basic use; config.ocrApiKey for higher limits.
 *
 * Usage:
 *   .ocr  (reply to an image)
 *   .ocr <lang>  (reply to an image, e.g. .ocr ara for Arabic)
 *
 * Supported language codes: eng, ara, bul, chs (Chinese Simplified), cht (Traditional),
 *   hrv, cze, dan, dut, fin, fre, ger, gre, hun, kor, ita, jpn, pol, por, rus, slv, spa, swe, tur, ukr, hin
 */

const axios    = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp    = require('sharp');

const LANG_MAP = {
  en: 'eng', ar: 'ara', bg: 'bul', 'zh-cn': 'chs', 'zh-tw': 'cht',
  hr: 'hrv', cs: 'cze', da: 'dan', nl: 'dut', fi: 'fin',
  fr: 'fre', de: 'ger', el: 'gre', hu: 'hun', ko: 'kor',
  it: 'ita', ja: 'jpn', pl: 'pol', pt: 'por', ru: 'rus',
  sl: 'slv', es: 'spa', sv: 'swe', tr: 'tur', uk: 'ukr', hi: 'hin',
};

module.exports = {
  name: 'ocr',
  aliases: ['readtext', 'extracttext', 'readimage', 'imgtotext'],
  category: 'ai',
  description: 'Extract text from an image using OCR AI',
  usage: '.ocr  (reply to image)  OR  .ocr <lang code>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;
      const ctx    = msg.message?.extendedTextMessage?.contextInfo;

      if (!ctx?.quotedMessage) {
        return extra.reply(
          `🔍 *OCR — Image to Text*\n\n` +
          `Reply to an *image* with .ocr to extract all text from it.\n\n` +
          `Language (optional): .ocr <lang>\n` +
          `  en, ar, fr, de, es, ja, ko, zh-cn, ru, hi, pt...\n\n` +
          `Example:\n` +
          `  .ocr\n` +
          `  .ocr ar   (Arabic text)`
        );
      }

      const quoted  = ctx.quotedMessage;
      const isImage = !!quoted.imageMessage;
      if (!isImage) {
        return extra.reply('❌ Please reply to an *image*!');
      }

      // Language
      const rawLang = args[0]?.toLowerCase() || 'en';
      const ocrLang = LANG_MAP[rawLang] || rawLang;

      await extra.reply(`🔍 Extracting text... (language: ${ocrLang})`);

      const targetMsg = {
        key: { remoteJid: chatId, id: ctx.stanzaId, participant: ctx.participant },
        message: quoted,
      };

      const mediaBuffer = await downloadMediaMessage(
        targetMsg, 'buffer', {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      );

      if (!mediaBuffer || mediaBuffer.length === 0) {
        return extra.reply('❌ Failed to download image.');
      }

      // Resize to max 5MB (OCR.space limit)
      let imgBuffer = mediaBuffer;
      try {
        const meta = await sharp(mediaBuffer).metadata();
        if (mediaBuffer.length > 4 * 1024 * 1024 || meta.width > 3000 || meta.height > 3000) {
          imgBuffer = await sharp(mediaBuffer)
            .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toBuffer();
        }
      } catch (_) {}

      const config   = (() => { try { return require('../../config'); } catch (_) { return {}; } })();
      const apiKey   = config.ocrApiKey || process.env.OCR_API_KEY || 'helloworld'; // 'helloworld' = free demo key

      const form = new FormData();
      form.append('base64Image', `data:image/jpeg;base64,${imgBuffer.toString('base64')}`);
      form.append('language', ocrLang);
      form.append('isOverlayRequired', 'false');
      form.append('detectOrientation', 'true');
      form.append('scale', 'true');
      form.append('OCREngine', '2'); // Engine 2 = better accuracy

      const res = await axios.post('https://api.ocr.space/parse/image', form, {
        headers: { ...form.getHeaders(), apikey: apiKey },
        timeout: 30000,
      });

      const data       = res.data;
      const parsedText = data?.ParsedResults?.[0]?.ParsedText?.trim();

      if (!parsedText) {
        return extra.reply(
          `❌ No text found in the image.\n\n` +
          `Tips:\n` +
          `• Make sure the image is clear and well-lit\n` +
          `• Try specifying the language: .ocr ar (Arabic), .ocr fr (French)\n` +
          `• Text should be horizontal and readable`
        );
      }

      const orientation = data?.ParsedResults?.[0]?.TextOrientation || '';
      const confidence  = data?.ParsedResults?.[0]?.TextConfidence || '';

      await extra.reply(
        `🔍 *Extracted Text*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${parsedText}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 Confidence: ${confidence ? Math.round(confidence) + '%' : 'N/A'}\n` +
        `🔤 Language: ${ocrLang}` +
        (orientation ? `\n↩️ Orientation: ${orientation}` : '')
      );

    } catch (error) {
      console.error('[ocr] Error:', error);
      await extra.reply(`❌ OCR failed: ${error.message}`);
    }
  },
};
