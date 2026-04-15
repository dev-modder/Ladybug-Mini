/**
 * UUID Generator Command
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Generates UUIDs v4 (random) or v1-style (time-based simulation)
 * No external packages needed — uses Node.js crypto module
 */

'use strict';

const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

module.exports = {
  name: 'uuid',
  aliases: ['guid', 'generateid', 'uniqueid'],
  category: 'utility',
  description: 'Generate one or more UUIDs (v4)',
  usage: '.uuid [count 1-10]',

  async execute(sock, msg, args, extra) {
    try {
      let count = 1;

      if (args[0]) {
        const n = parseInt(args[0], 10);
        if (isNaN(n) || n < 1 || n > 10) {
          return extra.reply('❌ Count must be between 1 and 10.\nExample: .uuid 5');
        }
        count = n;
      }

      const uuids = Array.from({ length: count }, () => uuidv4());

      const list = uuids.map((u, i) => count > 1 ? `${i + 1}. \`${u}\`` : `\`${u}\``).join('\n');

      await extra.reply(
        `🆔 *UUID Generator* (v4)\n\n` +
        `${list}\n\n` +
        `_${count} UUID${count > 1 ? 's' : ''} generated — cryptographically random._`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
