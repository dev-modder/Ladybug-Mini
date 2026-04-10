/**
 * Advice Command - Get AI life advice on any situation
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Usage: .advice <your situation or question>
 * .advice I keep procrastinating on my goals
 * .advice how do I talk to my crush
 */

'use strict';

const APIs = require('../../utils/api');

module.exports = {
  name: 'advice',
  aliases: ['aiadvice', 'counsel', 'help me', 'askadvice', 'nasihat'],
  category: 'ai',
  description: 'Get thoughtful AI life advice on any situation',
  usage: '.advice <your situation>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `💡 *AI Life Advice*\n\n` +
          `Usage: .advice <your situation>\n\n` +
          `Examples:\n` +
          `  .advice I always give up when things get hard\n` +
          `  .advice how do I handle a toxic friend\n` +
          `  .advice I feel lost about my career\n\n` +
          `_I give real, practical advice — no fluff._`
        );
      }

      const situation = args.join(' ').trim();
      await extra.reply(`💡 Thinking about your situation...`);

      const aiPrompt =
        `You are a wise, empathetic life advisor. Someone has come to you with this situation:\n` +
        `"${situation}"\n\n` +
        `Give them honest, practical, and compassionate advice in 3-5 short paragraphs. ` +
        `Be direct but kind. Avoid generic platitudes. Give actionable steps where possible. ` +
        `End with one powerful motivating sentence. Do not use bullet points — write in flowing paragraphs.`;

      const response = await APIs.chatAI(aiPrompt);
      const adviceText = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        (typeof response === 'string' ? response : null) ||
        'Could not generate advice right now. Try again!'
      ).trim();

      const senderName = msg.pushName || extra.sender?.split('@')[0] || 'you';

      await extra.reply(
        `╔══════════════════════╗\n` +
        `║  💡  *AI LIFE ADVICE*  ║\n` +
        `╚══════════════════════╝\n\n` +
        `👤 *Hey ${senderName},*\n` +
        `📝 *Situation:* _${situation}_\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${adviceText}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_🤖 AI advice. Not a substitute for professional help._`
      );

    } catch (error) {
      console.error('[advice] Error:', error);
      await extra.reply(`❌ Advice generation failed: ${error.message}`);
    }
  },
};
