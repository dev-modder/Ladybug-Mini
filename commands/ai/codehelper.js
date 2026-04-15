/**
 * CodeHelper Command - AI coding assistant (Ladybug V5)
 *
 * Usage: .code <question or code snippet>
 *        .code fix | <broken code>
 *        .code review | <code>
 *        .code explain | <code>
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
      const r = await axios.get(url, { timeout: 20000 });
      const d = r.data;
      const ans = d?.msg || d?.result || d?.data?.text || d?.response;
      if (ans && ans.trim().length > 5) return ans.trim();
    } catch (_) {}
  }
  throw new Error('AI coding assistant unavailable right now.');
}

module.exports = {
  name: 'code',
  aliases: ['codehelp', 'codeai', 'devhelp', 'debug'],
  category: 'ai',
  description: 'AI coding assistant — write, fix, review, or explain code',
  usage: '.code <question> | .code fix | <code> | .code review | <code> | .code explain | <code>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          '💻 *Code Helper*\n\n' +
          'Usage:\n' +
          '.code <coding question>\n' +
          '.code fix | <broken code>\n' +
          '.code review | <code>\n' +
          '.code explain | <code>\n\n' +
          'Example: .code fix | console.log("Hello" + name'
        );
      }

      const full = args.join(' ');
      let mode = 'help';
      let content = full;

      if (full.includes('|')) {
        const parts = full.split('|');
        const sub = parts[0].trim().toLowerCase();
        if (['fix', 'review', 'explain'].includes(sub)) {
          mode    = sub;
          content = parts.slice(1).join('|').trim();
        }
      }

      await sock.sendPresenceUpdate('composing', extra.from);

      let prompt;
      if (mode === 'fix') {
        prompt = `Fix this code and explain what was wrong:\n\n${content}\n\nProvide the fixed code and a brief explanation of the bug(s).`;
      } else if (mode === 'review') {
        prompt = `Review this code and provide:\n1. What it does\n2. Any bugs or issues\n3. Improvement suggestions\n\nCode:\n${content}`;
      } else if (mode === 'explain') {
        prompt = `Explain what this code does step by step in simple terms:\n\n${content}`;
      } else {
        prompt = `You are an expert programmer. Answer this coding question clearly with code examples:\n\n${content}`;
      }

      const result = await callAI(prompt);
      await sock.sendPresenceUpdate('paused', extra.from);

      const modeEmoji = { help: '💡', fix: '🔧', review: '🔍', explain: '📖' };
      await extra.reply(`${modeEmoji[mode] || '💻'} *Code ${mode.charAt(0).toUpperCase() + mode.slice(1)}*\n\n${result}`);
    } catch (error) {
      console.error('[code] Error:', error);
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
