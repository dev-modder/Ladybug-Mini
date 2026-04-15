/**
 * Hash Command - Hash text using common algorithms
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Supports: md5, sha1, sha256, sha512, sha224, sha384
 * Usage: .hash <algorithm> <text>
 *        .hash <text>          (defaults to sha256)
 */

'use strict';

const crypto = require('crypto');

const SUPPORTED = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512'];

module.exports = {
  name: 'hash',
  aliases: ['md5', 'sha256', 'sha512', 'checksum', 'encrypt'],
  category: 'utility',
  description: 'Hash text using MD5, SHA1, SHA256, or SHA512',
  usage: '.hash <text> | .hash sha512 <text>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🔐 *Hash Generator*\n\n` +
          `Usage:\n` +
          `  .hash hello world\n` +
          `  .hash sha512 my secret text\n\n` +
          `Algorithms: ${SUPPORTED.join(', ')}\n` +
          `Default: sha256`
        );
      }

      let algorithm = 'sha256';
      let text;

      if (SUPPORTED.includes(args[0].toLowerCase())) {
        algorithm = args[0].toLowerCase();
        text = args.slice(1).join(' ');
      } else {
        text = args.join(' ');
      }

      if (!text.trim()) {
        return extra.reply('❌ Please provide text to hash after the algorithm name.');
      }

      const hash = crypto.createHash(algorithm).update(text).digest('hex');

      // Generate all common hashes at once for convenience
      const allHashes = SUPPORTED
        .map(alg => `  ${alg.padEnd(8)}: \`${crypto.createHash(alg).update(text).digest('hex').slice(0, 32)}${crypto.createHash(alg).update(text).digest('hex').length > 32 ? '...' : ''}\``)
        .join('\n');

      await extra.reply(
        `🔐 *Hash Result*\n\n` +
        `📝 *Input:* ${text.length > 50 ? text.slice(0, 50) + '...' : text}\n` +
        `🔑 *Algorithm:* ${algorithm.toUpperCase()}\n\n` +
        `\`${hash}\`\n\n` +
        `📊 *All hashes:*\n${allHashes}`
      );

    } catch (error) {
      if (error.message.includes('unknown digest')) {
        await extra.reply(`❌ Unknown algorithm. Supported: ${SUPPORTED.join(', ')}`);
      } else {
        await extra.reply(`❌ Error: ${error.message}`);
      }
    }
  },
};
