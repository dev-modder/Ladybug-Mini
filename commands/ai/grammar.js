/**
 * Grammar Command - AI grammar checker and corrector
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'grammar',
  aliases: ['grammarcheck', 'fixgrammar', 'gc'],
  category: 'ai',
  description: 'Check and correct grammar in a text or quoted message',
  usage: '.grammar <text> or reply to a message',

  async execute(sock, msg, args, extra) {
    try {
      let text = args.join(' ').trim();

      // Fall back to quoted message
      if (!text) {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const quoted = ctx?.quotedMessage;
        if (quoted?.conversation) text = quoted.conversation;
        else if (quoted?.extendedTextMessage?.text) text = quoted.extendedTextMessage.text;
      }

      if (!text) {
        return extra.reply(
          '📝 Please provide text or reply to a message.\n\nUsage: *.grammar <text>*'
        );
      }

      await extra.reply('📝 _Checking grammar, please wait..._');

      const apiUrl = `https://api.languagetool.org/v2/check`;
      const params = new URLSearchParams({ text, language: 'en-US' });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const data = await response.json();
      const matches = data.matches || [];

      if (matches.length === 0) {
        return extra.reply(`✅ *No grammar errors found!*\n\n📝 Your text looks great:\n_${text}_`);
      }

      let corrected = text;
      let offset = 0;
      const issues = [];

      for (const m of matches) {
        const replacement = m.replacements?.[0]?.value;
        if (replacement) {
          const start = m.offset + offset;
          const end = start + m.length;
          corrected = corrected.slice(0, start) + replacement + corrected.slice(end);
          offset += replacement.length - m.length;
        }
        issues.push(`• ${m.message}`);
      }

      await extra.reply(
        `📝 *Grammar Check Result*\n\n` +
        `❌ *Original:*\n_${text}_\n\n` +
        `✅ *Corrected:*\n_${corrected}_\n\n` +
        `⚠️ *Issues Found (${matches.length}):*\n${issues.slice(0, 5).join('\n')}`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
