/**
 * Eval Command - Execute JavaScript code directly (owner only)
 * Ladybug V5
 *
 * ⚠️  DANGEROUS — Only expose to trusted owner numbers.
 *     Executes arbitrary JS in the bot's Node.js process.
 *
 * Usage:
 *   .eval <javascript code>
 *
 * Examples:
 *   .eval 2 + 2
 *   .eval config.botName
 *   .eval Object.keys(sock)
 */

module.exports = {
  name: 'eval',
  aliases: ['exec', 'run', '>>'],
  category: 'owner',
  description: '⚠️ Execute JavaScript code in the bot process',
  usage: '.eval <js code>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    const code = args.join(' ').trim();

    if (!code) {
      return extra.reply(
        `💻 *Eval — JS Executor*\n\n` +
        `Usage: .eval <javascript code>\n\n` +
        `Examples:\n` +
        `  .eval 2 + 2\n` +
        `  .eval config.prefix\n` +
        `  .eval Object.keys(sock).slice(0, 10).join(', ')\n\n` +
        `⚠️ Executes real JS. Be careful.`
      );
    }

    let result;
    const start = Date.now();

    try {
      // Make common objects available in eval scope
      const config = require('../../config'); // eslint-disable-line no-unused-vars
      result = await eval(code); // eslint-disable-line no-eval

      if (typeof result === 'object' && result !== null) {
        result = JSON.stringify(result, null, 2);
      }
    } catch (err) {
      result = `❌ Error: ${err.message}`;
    }

    const elapsed = Date.now() - start;

    await extra.reply(
      `💻 *Eval Result*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📥 *Input:*\n\`\`\`\n${code}\n\`\`\`\n\n` +
      `📤 *Output:*\n\`\`\`\n${String(result).slice(0, 3000)}\n\`\`\`\n\n` +
      `⏱️ ${elapsed}ms`
    );
  },
};
