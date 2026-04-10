/**
 * Urban Dictionary Command - Look up slang definitions
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Fetches the top definition from Urban Dictionary
 * Usage: .urban <word>
 */

'use strict';

const axios = require('axios');

module.exports = {
  name: 'urban',
  aliases: ['ud', 'slang', 'define'],
  category: 'general',
  description: 'Look up slang definitions from Urban Dictionary',
  usage: '.urban <word or phrase>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `📖 *Urban Dictionary*\n\n` +
          `Usage: .urban <word>\n` +
          `Example: .urban no cap\n` +
          `Example: .urban slay`
        );
      }

      const term = args.join(' ').trim();
      await extra.reply(`🔍 Looking up *"${term}"* on Urban Dictionary...`);

      const res = await axios.get(
        `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`,
        { timeout: 8000 }
      );

      const list = res.data?.list;
      if (!list || list.length === 0) {
        return extra.reply(`❌ No definition found for *"${term}"*.\n\nTry a different spelling or slang term.`);
      }

      const top = list[0];
      const definition = top.definition
        .replace(/\[|\]/g, '')   // Remove UD link brackets
        .substring(0, 500);      // Trim if too long

      const example = top.example
        ? top.example.replace(/\[|\]/g, '').substring(0, 300)
        : 'No example provided.';

      const thumbsUp   = top.thumbs_up || 0;
      const thumbsDown = top.thumbs_down || 0;
      const author     = top.author || 'Unknown';
      const date       = top.written_on
        ? new Date(top.written_on).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Unknown';

      const reply =
        `📖 *Urban Dictionary*\n\n` +
        `🔤 *Word:* ${top.word}\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `📝 *Definition:*\n${definition}\n\n` +
        `💬 *Example:*\n_${example}_\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `👍 ${thumbsUp}   👎 ${thumbsDown}\n` +
        `✍️ By *${author}* on ${date}`;

      await extra.reply(reply);

    } catch (error) {
      console.error('[urban] Error:', error);
      await extra.reply(`❌ Failed to fetch definition: ${error.message}`);
    }
  },
};
