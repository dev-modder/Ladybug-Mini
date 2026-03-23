/**
 * Summarize Command - Summarize any text using AI
 * Ladybug V5
 *
 * Usage:
 *   .summarize <long text>
 *   .summarize (reply to a message)
 *   .summarize <url>   — summarize a webpage
 */

const axios = require('axios');
const APIs  = require('../../utils/api');

module.exports = {
  name: 'summarize',
  aliases: ['sum', 'tldr', 'summary', 'shorten'],
  category: 'ai',
  description: 'Summarize long text or a webpage using AI',
  usage: '.summarize <text | url>  OR  reply to a message',

  async execute(sock, msg, args, extra) {
    try {
      // Get content from args or quoted message
      let content = args.join(' ').trim();

      if (!content) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        content = (
          quoted?.conversation ||
          quoted?.extendedTextMessage?.text ||
          quoted?.imageMessage?.caption ||
          ''
        ).trim();
      }

      if (!content) {
        return extra.reply(
          `📝 *Summarize*\n\n` +
          `Usage:\n` +
          `  .summarize <text>\n` +
          `  .summarize <url>\n` +
          `  Reply to a message with .summarize\n\n` +
          `I'll give you a concise TL;DR.`
        );
      }

      await extra.reply('📝 Summarizing...');

      // If it's a URL, fetch the page text first
      let textToSummarize = content;
      const isUrl = /^https?:\/\//i.test(content);

      if (isUrl) {
        try {
          const pageRes = await axios.get(content, {
            timeout: 12000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          // Strip HTML tags
          const html = pageRes.data;
          textToSummarize = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim()
            .slice(0, 4000);
        } catch (fetchErr) {
          return extra.reply(`❌ Could not fetch the URL: ${fetchErr.message}`);
        }
      }

      if (textToSummarize.length < 50) {
        return extra.reply('❌ Text is too short to summarize!');
      }

      const prompt =
        `Please summarize the following text in a concise, clear way. ` +
        `Use bullet points for key takeaways if the text is long. ` +
        `Keep the summary under 200 words.\n\nText:\n${textToSummarize.slice(0, 4000)}`;

      const response = await APIs.chatAI(prompt);
      const summary = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        response?.data?.response ||
        (typeof response === 'string' ? response : null) ||
        'Could not generate summary.'
      ).trim();

      await extra.reply(
        `📝 *Summary*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${summary}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Original: ${textToSummarize.length} chars → Summarized_`
      );

    } catch (error) {
      console.error('[summarize] Error:', error);
      await extra.reply(`❌ Summarization failed: ${error.message}`);
    }
  },
};
