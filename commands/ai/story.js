/**
 * Story Command - Generate a short AI story based on a prompt
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Usage:
 *   .story <prompt>
 *   .story a lost robot looking for its owner
 *   .story <genre> | <prompt>   e.g.  .story horror | alone in the house
 */

'use strict';

const APIs = require('../../utils/api');

const GENRES = ['adventure', 'horror', 'romance', 'comedy', 'sci-fi', 'fantasy', 'mystery', 'thriller'];

module.exports = {
  name: 'story',
  aliases: ['aistory', 'shortstory', 'genscene', 'cerita'],
  category: 'ai',
  description: 'Generate a short AI-written story from a prompt',
  usage: '.story <prompt>  OR  .story <genre> | <prompt>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `📖 *AI Story Generator*\n\n` +
          `Usage: .story <prompt>\n` +
          `       .story <genre> | <prompt>\n\n` +
          `Genres: ${GENRES.join(', ')}\n\n` +
          `Examples:\n` +
          `  .story a boy who finds a magic map\n` +
          `  .story horror | waking up in an empty city`
        );
      }

      const fullText = args.join(' ').trim();
      let genre  = null;
      let prompt = fullText;

      if (fullText.includes('|')) {
        const parts = fullText.split('|');
        const possibleGenre = parts[0].trim().toLowerCase();
        if (GENRES.includes(possibleGenre) || possibleGenre.length < 20) {
          genre  = parts[0].trim();
          prompt = parts.slice(1).join('|').trim();
        }
      }

      await extra.reply(`📖 Writing your story${genre ? ` (${genre})` : ''}...`);

      const genreStr = genre
        ? `Genre: ${genre}. `
        : `Pick a fitting genre. `;

      const aiPrompt =
        `You are a creative storyteller. ${genreStr}` +
        `Write a short, engaging story (200-300 words) based on this prompt: "${prompt}". ` +
        `Structure it with a clear beginning, middle, and end. ` +
        `Give the story a creative title. ` +
        `Format:\nTitle: [title]\n\n[story text]`;

      const response = await APIs.chatAI(aiPrompt);
      const story = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        (typeof response === 'string' ? response : null) ||
        'Could not generate story right now. Try again!'
      ).trim();

      const senderName = msg.pushName || extra.sender?.split('@')[0] || 'you';

      await extra.reply(
        `╔══════════════════════╗\n` +
        `║  📖  *AI STORY TIME*   ║\n` +
        `╚══════════════════════╝\n\n` +
        `✍️ *Prompt:* ${prompt}\n` +
        `${genre ? `🎭 *Genre:* ${genre}\n` : ''}` +
        `👤 *By request of:* ${senderName}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${story}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_🤖 AI-generated story. Use .story <prompt> for another one!_`
      );

    } catch (error) {
      console.error('[story] Error:', error);
      await extra.reply(`❌ Story generation failed: ${error.message}`);
    }
  },
};
