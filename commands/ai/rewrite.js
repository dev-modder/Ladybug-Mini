/**
 * Rewrite v3 — Ladybug Bot Mini
 * .rewrite <text> [--tone formal|casual|professional|friendly|persuasive|funny]
 */
'use strict';
const APIs = require('../../utils/api');
const TONES = { formal:'formal and professional', casual:'casual and conversational', professional:'professional but approachable', friendly:'warm and friendly', persuasive:'persuasive and compelling', funny:'funny and entertaining', academic:'academic and scholarly', simple:'simple and easy to understand' };
module.exports = {
  name: 'rewrite',
  aliases: ['rephrase', 'paraphrase', 'improve', 'reword'],
  category: 'ai',
  description: 'Rewrite text with a different tone or style',
  usage: '.rewrite <text> [--tone formal|casual|professional|friendly|persuasive|funny|academic|simple]',
  async execute(sock, msg, args, extra) {
    try {
      let tone = 'clear and improved';
      const cleanArgs = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--tone' && args[i+1]) { const t = args[++i].toLowerCase(); tone = TONES[t] || tone; }
        else { cleanArgs.push(args[i]); }
      }
      let text = cleanArgs.join(' ').trim();
      if (!text) {
        const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        text = (q?.conversation || q?.extendedTextMessage?.text || '').trim();
      }
      if (!text) return extra.reply(`✏️ *Rewrite v3*\n\nRewrite any text with a new tone.\n\nUsage: .rewrite <text> [--tone <tone>]\n\nTones: ${Object.keys(TONES).join(', ')}\n\nExample: .rewrite I need you to come to work --tone formal\n\n> _Ladybug Bot Mini v3_`);
      if (text.length > 3000) return extra.reply('❌ Text too long. Max 3000 characters.');
      await extra.reply(`✏️ Rewriting (tone: ${tone})...`);
      await sock.sendPresenceUpdate('composing', extra.from);
      const prompt = `Rewrite the following text in a ${tone} tone. Preserve the original meaning. Only provide the rewritten version, no explanations:\n\n"${text}"`;
      const result = await APIs.chatAI(prompt);
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`✏️ *Rewritten*\n━━━━━━━━━━━━━━━━━━━━\n📤 *Original:*\n${text.slice(0,200)}\n\n📥 *Rewritten (${tone}):*\n${result}\n━━━━━━━━━━━━━━━━━━━━\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
