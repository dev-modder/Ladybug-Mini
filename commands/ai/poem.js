/**
 * Poem Command - Generate an AI poem
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Usage:
 *   .poem <topic>
 *   .poem <style> | <topic>   e.g. .poem haiku | cherry blossoms
 */

'use strict';

const APIs = require('../../utils/api');

const STYLES = ['haiku', 'sonnet', 'free verse', 'limerick', 'ballad', 'ode', 'acrostic', 'rhyming couplets'];

module.exports = {
  name: 'poem',
  aliases: ['aipoem', 'poetry', 'syair', 'puisi'],
  category: 'ai',
  description: 'Generate an AI poem about any topic',
  usage: '.poem <topic>  OR  .poem <style> | <topic>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🖊️ *AI Poem Generator*\n\n` +
          `Usage: .poem <topic>\n` +
          `       .poem <style> | <topic>\n\n` +
          `Styles: ${STYLES.join(', ')}\n\n` +
          `Examples:\n` +
          `  .poem the ocean at midnight\n` +
          `  .poem haiku | autumn leaves\n` +
          `  .poem limerick | my lazy cat`
        );
      }

      const fullText = args.join(' ').trim();
      let style = 'free verse';
      let topic = fullText;

      if (fullText.includes('|')) {
        const parts = fullText.split('|');
        const possibleStyle = parts[0].trim().toLowerCase();
        if (STYLES.some(s => possibleStyle.includes(s)) || possibleStyle.length < 25) {
          style = parts[0].trim();
          topic = parts.slice(1).join('|').trim();
        }
      }

      await extra.reply(`🖊️ Writing a *${style}* poem about *"${topic}"*...`);

      const aiPrompt =
        `You are a gifted poet. Write a beautiful ${style} poem about: "${topic}". ` +
        `Give it a creative title. Use vivid imagery and emotion. ` +
        `Format:\nTitle: [poem title]\n\n[poem lines]`;

      const response = await APIs.chatAI(aiPrompt);
      const poem = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        (typeof response === 'string' ? response : null) ||
        'Could not generate poem right now. Try again!'
      ).trim();

      const senderName = msg.pushName || extra.sender?.split('@')[0] || 'you';

      await extra.reply(
        `╔══════════════════════╗\n` +
        `║  🖊️  *AI POEM*          ║\n` +
        `╚══════════════════════╝\n\n` +
        `📌 *Topic:* ${topic}\n` +
        `🎭 *Style:* ${style}\n` +
        `👤 *For:* ${senderName}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${poem}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_🤖 AI-generated poem | Use .poem <topic> for another_`
      );

    } catch (error) {
      console.error('[poem] Error:', error);
      await extra.reply(`❌ Poem generation failed: ${error.message}`);
    }
  },
};
