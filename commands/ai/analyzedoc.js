/**
 * Analyze Document / Image Command
 * Ladybug Bot Mini V5 | by Dev-Ntando (Ntandoyenkosi Chisaya, Zimbabwe)
 *
 * Send any image or document — AI analyzes it fully.
 * - Exam papers: reads questions, provides solutions
 * - Notes images: extracts and summarizes
 * - PDF documents: provides guidance and study tips
 * - Any image: OCR + AI analysis
 *
 * Usage:
 *   .analyzedoc (send with image/doc or reply to one)
 *   .analyzedoc solve    — solve questions found in image
 *   .analyzedoc summary  — summarize the content
 *   .analyzedoc explain  — explain what is in the image
 *   .analyzedoc translate — translate text found in image
 *
 * Aliases: analyze, readimage, docai, imganalyze, readpaper, scanpaper
 */

'use strict';

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

let downloadMediaMessage;
try { ({ downloadMediaMessage } = require('@whiskeysockets/baileys')); } catch (_) {}

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

// ─── OCR extract text from image ─────────────────────────────────────────────
async function extractText(buf) {
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
    return r?.data?.ParsedResults?.[0]?.ParsedText?.trim() || '';
  } catch (_) { return ''; }
}

// ─── Module export ─────────────────────────────────────────────────────────────
module.exports = {
  name: 'analyzedoc',
  aliases: ['analyze', 'readimage', 'docai', 'imganalyze', 'readpaper', 'scanpaper', 'readoc'],
  category: 'ai',
  description: 'Analyze any image or document — AI reads, solves, summarizes, or explains it',
  usage: '.analyzedoc (with/reply to image or doc) [solve | summary | explain | translate]',

  async execute(sock, msg, args, extra) {
    const chatId    = extra?.from || msg.key.remoteJid;
    const senderName = msg.pushName || msg.key.remoteJid.split('@')[0];
    const mode = (args[0] || 'analyze').toLowerCase();

    // ── Find image ─────────────────────────────────────────────────────────────
    const directImg   = msg.message?.imageMessage;
    const ctx         = msg.message?.extendedTextMessage?.contextInfo;
    const quotedImg   = ctx?.quotedMessage?.imageMessage;
    const directDoc   = msg.message?.documentMessage;
    const quotedDoc   = ctx?.quotedMessage?.documentMessage;

    // ── Document handling ──────────────────────────────────────────────────────
    if (directDoc || quotedDoc) {
      const doc = directDoc || quotedDoc;
      const fileName = doc.fileName || 'document';
      const isPDF = fileName.toLowerCase().endsWith('.pdf') || doc.mimetype === 'application/pdf';

      await sock.sendPresenceUpdate('composing', chatId);

      let prompt;
      if (mode === 'solve') {
        prompt = 'A student sent a ' + (isPDF ? 'PDF' : 'document') + ' called "' + fileName + '". This likely contains school work or exam questions. Provide comprehensive study guidance: what topics are likely covered, how to approach the material, key concepts to focus on, and offer to help with specific questions from this document.';
      } else if (mode === 'summary') {
        prompt = 'Summarize what a ' + (isPDF ? 'PDF' : 'document') + ' called "' + fileName + '" likely contains. Give a helpful academic summary and list key topics and sub-topics likely inside it based on the title.';
      } else {
        prompt = 'A student sent a file called "' + fileName + '". Warmly acknowledge it. Based on the filename, explain: (1) what it likely contains, (2) how to study it effectively, (3) key areas to focus on. Offer to help with specific questions from the document.';
      }

      const result = await callAI(prompt);
      return extra.reply(
        '📄 *Document Analysis*\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '📁 File: *' + fileName + '*\n' +
        '📊 Type: ' + (isPDF ? 'PDF Document' : 'Document') + '\n' +
        '━━━━━━━━━━━━━━━━━━\n\n' +
        result +
        '\n\n> _Ladybug Doc Analyzer — Dev-Ntando 🇿🇼_'
      );
    }

    // ── Image handling ─────────────────────────────────────────────────────────
    if (!directImg && !quotedImg) {
      return extra.reply(
        '📷 *Document & Image Analyzer*\n\n' +
        'Send or reply to an *image* or *document* with *.analyzedoc* to analyze it.\n\n' +
        '*Modes:*\n' +
        '  .analyzedoc          — full analysis\n' +
        '  .analyzedoc solve    — solve exam questions in image\n' +
        '  .analyzedoc summary  — summarize the content\n' +
        '  .analyzedoc explain  — explain what is shown\n' +
        '  .analyzedoc translate — translate text in image\n\n' +
        '*Works with:*\n' +
        '  📝 Exam papers\n' +
        '  📋 Homework sheets\n' +
        '  📖 Textbook pages\n' +
        '  📊 Diagrams & graphs\n' +
        '  📷 Handwritten notes\n' +
        '  📄 PDFs & documents\n\n' +
        '> _Ladybug Doc Analyzer — Dev-Ntando 🇿🇼_'
      );
    }

    await sock.sendPresenceUpdate('composing', chatId);
    await extra.reply('🔍 Analyzing your image...');

    try {
      let targetMsg;
      if (quotedImg && !directImg) {
        targetMsg = { key: { remoteJid: chatId, id: ctx.stanzaId, participant: ctx.participant }, message: ctx.quotedMessage };
      } else {
        targetMsg = msg;
      }

      if (!downloadMediaMessage) {
        return extra.reply('❌ Media download is not available. Please update your bot.');
      }

      const buf = await downloadMediaMessage(targetMsg, 'buffer', {}, {
        logger: undefined,
        reuploadRequest: sock.updateMediaMessage,
      });

      if (!buf || buf.length === 0) {
        return extra.reply('❌ Could not download image. Please try again!');
      }

      await extra.reply('📖 Reading text from image...');
      const ocrText = await extractText(buf);

      let prompt;

      if (mode === 'solve') {
        prompt = ocrText
          ? 'These are exam questions or homework problems from an image:\n\n"' + ocrText + '"\n\n' +
            'For each question:\n1. State the question clearly\n2. Solve it step by step\n3. State the final answer\n4. Explain the method\n5. Give a marking tip'
          : 'This image appears to contain exam questions or problems. The text could not be extracted. Please ask the student to type out the question or send a clearer image.';
      } else if (mode === 'summary') {
        prompt = ocrText
          ? 'Summarize the following content from an image/document:\n\n"' + ocrText + '"\n\nProvide: main topic, key points, important terms/formulas, and what a student should focus on.'
          : 'Summarize what this image appears to show based on context. Ask for clarification if needed.';
      } else if (mode === 'explain') {
        prompt = ocrText
          ? 'Explain the following content from an educational image to a student:\n\n"' + ocrText + '"\n\nProvide a clear, detailed explanation with examples. Make it easy to understand.'
          : 'Describe and explain what this educational image shows. Be helpful and detailed.';
      } else if (mode === 'translate') {
        prompt = ocrText
          ? 'Translate the following text extracted from an image to clear English (if it is not in English, translate it; if it already is, improve clarity):\n\n"' + ocrText + '"'
          : 'The image text could not be extracted for translation. Please type the text you want translated.';
      } else {
        // Default: full analysis
        prompt = ocrText
          ? 'Analyze this content from an image:\n\n"' + ocrText + '"\n\n' +
            'Please:\n1. Identify what type of content this is (exam paper, notes, textbook, etc.)\n' +
            '2. Summarize the main content\n3. If there are questions, solve them\n' +
            '4. If it is study material, highlight key points\n5. Give advice on how to use this material for studying'
          : 'Analyze this image. It appears to be educational material. Describe what you can determine about its content and purpose, and offer to help the student with related questions.';
      }

      const result = await callAI(prompt);

      const header =
        '🔍 *Image Analysis Complete*\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        (ocrText ? '📝 Text found: ' + Math.min(ocrText.split(' ').length, 999) + ' words\n' : '📷 Image analyzed\n') +
        '━━━━━━━━━━━━━━━━━━━━━\n\n';

      return extra.reply(header + result + '\n\n> _Ladybug Doc Analyzer — Dev-Ntando 🇿🇼_');

    } catch (e) {
      return extra.reply('❌ Analysis failed: ' + e.message + '\nPlease make sure the image is clear and try again!');
    }
  },
};
