/**
 * Compliment Command - AI-generated compliments
 * Ladybug V5
 *
 * Usage:
 *   .compliment <name | @mention | me>
 */

const APIs = require('../../utils/api');

module.exports = {
  name: 'compliment',
  aliases: ['complement', 'praise', 'hype'],
  category: 'ai',
  description: 'Get an AI-generated compliment for someone',
  usage: '.compliment <name | @mention | me>',

  async execute(sock, msg, args, extra) {
    try {
      let target = args.join(' ').trim();

      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentions?.[0]) {
        const num = mentions[0].split('@')[0];
        try {
          const contact = await sock.onWhatsApp(mentions[0]);
          target = contact?.[0]?.notify || num;
        } catch (_) {
          target = num;
        }
      }

      if (!target) {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        if (ctx?.participant) target = ctx.participant.split('@')[0];
      }

      const senderName = msg.pushName || extra.sender?.split('@')[0] || 'you';
      if (!target || target.toLowerCase() === 'me') target = senderName;

      if (!target) {
        return extra.reply(
          `💐 *Compliment*\n\n` +
          `Usage:\n` +
          `  .compliment me\n` +
          `  .compliment <name>\n` +
          `  .compliment @mention`
        );
      }

      await extra.reply(`💐 Crafting a compliment for *${target}*...`);

      const prompt =
        `Give me one genuine, warm, and uplifting compliment for someone named "${target}". ` +
        `Keep it under 3 sentences. Make it feel personal and heartfelt, not generic. ` +
        `Do not add any introduction — deliver the compliment directly.`;

      const response = await APIs.chatAI(prompt);
      const compliment = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        (typeof response === 'string' ? response : null) ||
        `${target}, your energy is absolutely infectious — the world is better with you in it! 🌟`
      ).trim();

      await extra.reply(`💐 *Compliment for ${target}:*\n\n${compliment}`);

    } catch (error) {
      console.error('[compliment] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
