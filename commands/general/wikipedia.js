/**
 * Wikipedia Command - Search Wikipedia for a quick summary
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Fetches the first paragraph(s) from Wikipedia's REST API
 * Usage: .wiki <topic>
 */

'use strict';

const axios = require('axios');

module.exports = {
  name: 'wiki',
  aliases: ['wikipedia', 'wikisearch', 'ensiklopedia'],
  category: 'general',
  description: 'Search Wikipedia for a quick summary',
  usage: '.wiki <topic>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `📚 *Wikipedia*\n\n` +
          `Usage: .wiki <topic>\n` +
          `Example: .wiki Albert Einstein\n` +
          `Example: .wiki Black holes`
        );
      }

      const query = args.join(' ').trim();
      await extra.reply(`📚 Searching Wikipedia for *"${query}"*...`);

      // Step 1: Search for the best article title
      const searchRes = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`,
        { timeout: 8000 }
      );

      const titles = searchRes.data[1];
      const urls   = searchRes.data[3];

      if (!titles || titles.length === 0) {
        return extra.reply(`❌ No Wikipedia article found for *"${query}"*.\n\nTry rephrasing your search.`);
      }

      const title = titles[0];
      const url   = urls[0];

      // Step 2: Fetch the article extract
      const extractRes = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(title)}&format=json`,
        { timeout: 8000 }
      );

      const pages   = extractRes.data.query.pages;
      const page    = Object.values(pages)[0];
      let extract   = page?.extract?.trim() || '';

      if (!extract) {
        return extra.reply(`❌ Could not retrieve content for *"${title}"*.`);
      }

      // Trim to 1000 chars and stop at a sentence boundary
      if (extract.length > 1000) {
        extract = extract.substring(0, 1000);
        const lastDot = extract.lastIndexOf('.');
        if (lastDot > 500) extract = extract.substring(0, lastDot + 1);
        extract += ' ...';
      }

      await extra.reply(
        `📚 *Wikipedia*\n\n` +
        `📌 *${title}*\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `${extract}\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `🔗 *Read more:* ${url}`
      );

    } catch (error) {
      console.error('[wiki] Error:', error);
      await extra.reply(`❌ Wikipedia search failed: ${error.message}`);
    }
  },
};
