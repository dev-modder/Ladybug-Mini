/**
 * Roast Command - AI-generated roasts & compliments
 * Ladybug V5
 *
 * Uses the bot's ChatAI to generate funny, creative roasts or compliments.
 *
 * Usage:
 *   .roast <name or @mention>      — roast someone
 *   .roast me                      — roast yourself
 *   .compliment <name or @mention> — compliment someone
 */

const APIs = require('../../utils/api');

module.exports = {
  name: 'roast',
  aliases: ['roastme', 'burnme', 'clown'],
  category: 'ai',
  description: 'Get an AI-generated roast for someone',
  usage: '.roast <name | @mention | me>',

  async execute(sock, msg, args, extra) {
    try {
      // Resolve target name
      let target = args.join(' ').trim();

      // Tagged mention → use their number
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentions?.[0]) {
        const num = mentions[0].split('@')[0];
        // Try to get push name from contacts
        try {
          const contact = await sock.onWhatsApp(mentions[0]);
          target = contact?.[0]?.notify || num;
        } catch (_) {
          target = num;
        }
      }

      // Quoted message sender
      if (!target) {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        if (ctx?.participant) {
          target = ctx.participant.split('@')[0];
        }
      }

      // "me" = the sender
      const senderName = msg.pushName || extra.sender?.split('@')[0] || 'you';
      if (!target || target.toLowerCase() === 'me') {
        target = senderName;
      }

      if (!target) {
        return extra.reply(
          `🔥 *Roast*\n\n` +
          `Usage:\n` +
          `  .roast me\n` +
          `  .roast <name>\n` +
          `  .roast @mention\n\n` +
          `  .compliment me\n` +
          `  .compliment <name>`
        );
      }

      await extra.reply(`🔥 Cooking up a roast for *${target}*...`);

      const prompt =
        `Give me one savage but funny, creative roast for someone named "${target}". ` +
        `Keep it under 3 sentences. Be creative, witty, and funny — not offensive or hateful. ` +
        `Do not start with "Here's a roast" or any introduction — just deliver the roast directly.`;

      const response = await APIs.chatAI(prompt);
      const roast = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        (typeof response === 'string' ? response : null) ||
        `${target} is so boring even their search history falls asleep. 💤`
      ).trim();

      await extra.reply(`🔥 *Roast for ${target}:*\n\n${roast}`);

    } catch (error) {
      console.error('[roast] Error:', error);
      await extra.reply(`❌ Roast failed: ${error.message}`);
    }
  },
};
