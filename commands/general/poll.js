/**
 * Poll Command - Create a simple text-based poll in a group
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Usage: .poll <question> | <option1> | <option2> [| option3 ...]
 * Max 10 options. Options are separated by |
 * Users react with the listed emoji to vote.
 */

'use strict';

const VOTE_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

module.exports = {
  name: 'poll',
  aliases: ['vote', 'survey', 'pilihan'],
  category: 'general',
  description: 'Create a poll in a group chat',
  usage: '.poll <question> | <option1> | <option2> ...',
  groupOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const fullText = args.join(' ').trim();

      if (!fullText || !fullText.includes('|')) {
        return extra.reply(
          `📊 *Poll*\n\n` +
          `Usage: .poll <question> | <option1> | <option2>\n\n` +
          `Example:\n` +
          `.poll Best color? | Red | Blue | Green\n\n` +
          `_Separate question and options with |_\n` +
          `_Max 10 options_`
        );
      }

      const parts = fullText.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length < 3) {
        return extra.reply('❌ Please provide a question and at least 2 options.\n\nExample: .poll Best color? | Red | Blue');
      }

      const question = parts[0];
      const options  = parts.slice(1, 11); // max 10

      if (options.length > 10) {
        return extra.reply('❌ Maximum 10 options allowed.');
      }

      const senderName = msg.pushName || extra.sender?.split('@')[0] || 'Someone';

      let pollText =
        `╔══════════════════════╗\n` +
        `║  📊  *GROUP POLL*       ║\n` +
        `╚══════════════════════╝\n\n` +
        `❓ *${question}*\n\n` +
        `━━━━━ Options ━━━━━\n`;

      options.forEach((opt, i) => {
        pollText += `${VOTE_EMOJIS[i]}  ${opt}\n`;
      });

      pollText +=
        `\n━━━━━━━━━━━━━━━━━━\n` +
        `React with the emoji to cast your vote!\n` +
        `📌 _Poll created by ${senderName}_`;

      await extra.reply(pollText);

    } catch (error) {
      console.error('[poll] Error:', error);
      await extra.reply(`❌ Failed to create poll: ${error.message}`);
    }
  },
};
