/**
 * ╔══════════════════════════════════════════════════╗
 * ║  CodeHelper v3 — Ladybug Bot Mini                ║
 * ║  AI coding assistant: fix, review, explain,      ║
 * ║  generate, debug, convert, comment               ║
 * ╚══════════════════════════════════════════════════╝
 */

'use strict';

const APIs = require('../../utils/api');

const MODES = {
  fix:      'Fix all bugs in this code and explain what was wrong:',
  review:   'Review this code for best practices, performance, and security issues. Be specific:',
  explain:  'Explain this code step-by-step in simple terms a beginner would understand:',
  comment:  'Add clear, helpful inline comments to every significant line of this code:',
  optimize: 'Optimize this code for better performance and readability. Show the improved version:',
  convert:  'Convert this code to the language or framework specified. Show the full converted code:',
  generate: 'Generate clean, well-commented code for this requirement:',
  debug:    'Debug this code. Identify ALL errors, explain each one, and provide the corrected code:',
  test:     'Write comprehensive unit tests for this code using the appropriate test framework:',
};

module.exports = {
  name: 'code',
  aliases: ['codehelper', 'fix', 'debug', 'codereview', 'devai', 'dev'],
  category: 'ai',
  description: 'AI coding assistant — fix, review, explain, generate, and debug code',
  usage: '.code <mode> <code>   Modes: fix | review | explain | comment | optimize | convert | generate | debug | test',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `💻 *CodeHelper AI v3*\n\n` +
          `Your AI coding assistant.\n\n` +
          `*Modes:*\n` +
          Object.keys(MODES).map(m => `  • *.code ${m}* <code>`).join('\n') +
          `\n\n*Examples:*\n` +
          `  .code fix function add(a,b){retun a+b}\n` +
          `  .code explain for(let i=0;i<arr.length;i++){}\n` +
          `  .code generate a Node.js function that reads a JSON file\n` +
          `  .code convert <Python code> to JavaScript\n\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }

      const modeKey = args[0].toLowerCase();
      let mode  = MODES[modeKey] || null;
      let codeInput;

      if (mode) {
        codeInput = args.slice(1).join(' ').trim();
      } else {
        // No explicit mode — auto-detect intent
        mode = 'Analyse this code and provide the most helpful response (fix bugs if any, explain what it does, and suggest improvements):';
        codeInput = args.join(' ').trim();
      }

      // Try quoted message if no code provided
      if (!codeInput) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        codeInput = (quoted?.conversation || quoted?.extendedTextMessage?.text || '').trim();
      }

      if (!codeInput) return extra.reply('❌ Please provide some code or a description.');
      if (codeInput.length > 4000) return extra.reply('❌ Code too long. Max 4000 characters.');

      await extra.reply(`💻 *Analysing code...*\n⚙️ Mode: ${modeKey || 'auto'}`);
      await sock.sendPresenceUpdate('composing', extra.from);

      const prompt = `${mode}\n\n\`\`\`\n${codeInput}\n\`\`\`\n\nProvide a clear, practical response.`;
      const result = await APIs.chatAI(prompt, 'You are an expert software engineer and coding mentor. Give precise, practical, well-explained answers. Use code blocks where appropriate.');

      await sock.sendPresenceUpdate('paused', extra.from);

      await extra.reply(
        `💻 *CodeHelper AI*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${result}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `> _Ladybug Bot Mini v3_`
      );

    } catch (error) {
      console.error('[codehelper] Error:', error.message);
      await extra.reply(`❌ ${error.message}`);
    }
  }
};
