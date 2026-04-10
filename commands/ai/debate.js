/**
 * Debate Command - Get AI to argue both sides of any topic
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Usage:
 *   .debate <topic>
 *   .debate cats vs dogs
 *   .debate is social media good or bad
 */

'use strict';

const APIs = require('../../utils/api');

module.exports = {
  name: 'debate',
  aliases: ['aidebate', 'bothsides', '2sides', 'versus', 'argue'],
  category: 'ai',
  description: 'AI argues both sides of any topic',
  usage: '.debate <topic>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `⚔️ *AI Debate*\n\n` +
          `Usage: .debate <topic>\n\n` +
          `Examples:\n` +
          `  .debate cats vs dogs\n` +
          `  .debate is social media good or bad\n` +
          `  .debate iPhone vs Android\n` +
          `  .debate school uniforms should be banned`
        );
      }

      const topic = args.join(' ').trim();
      await extra.reply(`⚔️ Preparing arguments for *"${topic}"*...`);

      const aiPrompt =
        `You are a balanced debate moderator. ` +
        `Present BOTH sides of this topic: "${topic}". ` +
        `Format your response EXACTLY like this:\n\n` +
        `✅ PRO (For):\n` +
        `[3 strong arguments supporting the topic, each as 1-2 sentences]\n\n` +
        `❌ CON (Against):\n` +
        `[3 strong arguments against the topic, each as 1-2 sentences]\n\n` +
        `⚖️ Verdict:\n` +
        `[1-2 sentence balanced conclusion]\n\n` +
        `Be fair, factual, and insightful. No biases.`;

      const response = await APIs.chatAI(aiPrompt);
      const debateText = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        (typeof response === 'string' ? response : null) ||
        'Could not generate debate right now. Try again!'
      ).trim();

      await extra.reply(
        `╔══════════════════════╗\n` +
        `║  ⚔️  *AI DEBATE*        ║\n` +
        `╚══════════════════════╝\n\n` +
        `📌 *Topic:* ${topic}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${debateText}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_🤖 Use .debate <topic> for any topic you're curious about_`
      );

    } catch (error) {
      console.error('[debate] Error:', error);
      await extra.reply(`❌ Debate generation failed: ${error.message}`);
    }
  },
};
