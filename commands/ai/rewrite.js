/**
 * Rewrite Command - AI rewrites text in a different style (Ladybug V5)
 *
 * Usage: .rewrite <text>
 *        .rewrite <style> | <text>
 *
 * Styles: formal, casual, funny, professional, simple, poetic, persuasive
 */

'use strict';

const axios = require('axios');

async function callAI(prompt) {
  const endpoints = [
    `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/chatgpt?query=${encodeURIComponent(prompt)}`,
    `https://widipe.com/openai?text=${encodeURIComponent(prompt)}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await axios.get(url, { timeout: 15000 });
      const d = r.data;
      const ans = d?.msg || d?.result || d?.data?.text || d?.response;
      if (ans && ans.trim().length > 5) return ans.trim();
    } catch (_) {}
  }
  throw new Error('AI unavailable right now.');
}

const STYLES = ['formal', 'casual', 'funny', 'professional', 'simple', 'poetic', 'persuasive', 'sarcastic', 'academic'];

module.exports = {
  name: 'rewrite',
  aliases: ['rephrase', 'paraphrase', 'reword'],
  category: 'ai',
  description: 'Rewrite text in a different style using AI',
  usage: '.rewrite <text> | .rewrite <style> | <text>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `✍️ *Rewrite Command*\n\n` +
          `Usage:\n.rewrite <text>\n.rewrite <style> | <text>\n\n` +
          `Styles: ${STYLES.join(', ')}\n\n` +
          `Example: .rewrite formal | hey can u help me pls`
        );
      }

      const full = args.join(' ');
      let style = 'professional';
      let text  = full;

      if (full.includes('|')) {
        const parts = full.split('|');
        const possibleStyle = parts[0].trim().toLowerCase();
        if (STYLES.includes(possibleStyle)) {
          style = possibleStyle;
          text  = parts.slice(1).join('|').trim();
        }
      }

      if (!text) return extra.reply('❌ Please provide text to rewrite.');

      await sock.sendPresenceUpdate('composing', extra.from);

      const prompt = `Rewrite the following text in a *${style}* style. Only output the rewritten text, nothing else.\n\nOriginal:\n${text}`;
      const result = await callAI(prompt);

      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(
        `✍️ *Rewritten (${style})*\n\n` +
        `*Original:*\n${text}\n\n` +
        `*Rewritten:*\n${result}`
      );
    } catch (error) {
      console.error('[rewrite] Error:', error);
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
