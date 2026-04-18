/**
 * Base64 Command - Encode or decode Base64 text
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'base64',
  aliases: ['b64', 'base64encode', 'base64decode'],
  category: 'utility',
  description: 'Encode or decode Base64 text',
  usage: '.base64 encode <text> | .base64 decode <text>',

  async execute(sock, msg, args, extra) {
    try {
      const action = args[0]?.toLowerCase();
      const text = args.slice(1).join(' ').trim();

      if (!action || !text || !['encode', 'decode'].includes(action)) {
        return extra.reply(
          '🔐 *Base64 Tool*\n\n' +
          'Usage:\n' +
          '  *.base64 encode <text>* — Convert text to Base64\n' +
          '  *.base64 decode <text>* — Decode Base64 to text\n\n' +
          'Examples:\n' +
          '  .base64 encode Hello World\n' +
          '  .base64 decode SGVsbG8gV29ybGQ='
        );
      }

      if (action === 'encode') {
        const encoded = Buffer.from(text).toString('base64');
        await extra.reply(
          `🔒 *Base64 Encoded*\n\n` +
          `📝 Input: _${text.slice(0, 100)}_\n\n` +
          `🔐 Output:\n\`\`\`${encoded}\`\`\``
        );
      } else {
        const decoded = Buffer.from(text, 'base64').toString('utf-8');
        await extra.reply(
          `🔓 *Base64 Decoded*\n\n` +
          `🔐 Input: _${text.slice(0, 100)}_\n\n` +
          `📝 Output:\n\`\`\`${decoded}\`\`\``
        );
      }
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
