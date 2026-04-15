/**
 * Short URL Command - Shorten a URL using TinyURL (no API key needed)
 * Ladybug Bot V5 | by Dev-Ntando
 */

'use strict';

const axios = require('axios');

module.exports = {
  name: 'shorturl',
  aliases: ['shorten', 'tinyurl', 'short', 'bitly'],
  category: 'general',
  description: 'Shorten a long URL using TinyURL',
  usage: '.shorturl <url>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🔗 *URL Shortener*\n\n` +
          `Usage: .shorturl <url>\n` +
          `Example: .shorturl https://www.google.com/search?q=ladybug+bot`
        );
      }

      let url = args[0];

      // Add https:// if missing
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        return extra.reply('❌ That doesn\'t look like a valid URL. Make sure to include http:// or https://');
      }

      await extra.reply('🔗 Shortening URL...');

      const res = await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
        { timeout: 8000, responseType: 'text' }
      );

      const shortened = res.data.trim();

      if (!shortened.startsWith('https://') && !shortened.startsWith('http://')) {
        return extra.reply('❌ Failed to shorten URL. The link may be invalid or blocked.');
      }

      await extra.reply(
        `🔗 *URL Shortened!*\n\n` +
        `📎 *Original:* ${url}\n` +
        `✂️ *Short URL:* ${shortened}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
