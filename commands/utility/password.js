/**
 * Password Generator Command
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Usage:
 *   .password          → 16-char secure password
 *   .password 24       → 24-char password
 *   .password 12 pin   → 12-digit PIN
 *   .password 20 words → passphrase (4 random words)
 */

'use strict';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS    = '0123456789';
const SYMBOLS   = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const WORDLIST = [
  'apple','bridge','castle','dragon','eagle','forest','garden','harbor',
  'island','jungle','knight','lemon','mango','nebula','ocean','palace',
  'quartz','river','sunset','thunder','umbrella','valley','winter','yellow',
  'zebra','anchor','branch','candle','diamond','ember','falcon','glacier',
  'harvest','ignite','jasmine','kernel','lantern','marble','noodle','orange',
  'pepper','quirky','rocket','silver','turtle','unique','violet','walnut',
  'xenon','yoga','zephyr','acorn','blossom','crystal','dagger','eclipse',
  'feather','goblin','hollow','inferno','jewel','kingdom','labyrinth','mystic',
  'nomad','obsidian','phantom','quantum','radiant','sapphire','tornado','umber',
  'vortex','warrior','xylophone','yarrow','zenith','atlas','beacon','cipher',
];

function randomChar(chars) {
  return chars[Math.floor(Math.random() * chars.length)];
}

function generatePassword(length) {
  const all = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;
  // Guarantee at least one of each character class
  let pass = [
    randomChar(UPPERCASE),
    randomChar(LOWERCASE),
    randomChar(DIGITS),
    randomChar(SYMBOLS),
  ];
  for (let i = pass.length; i < length; i++) {
    pass.push(randomChar(all));
  }
  // Fisher-Yates shuffle
  for (let i = pass.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pass[i], pass[j]] = [pass[j], pass[i]];
  }
  return pass.join('');
}

function generatePin(length) {
  return Array.from({ length }, () => randomChar(DIGITS)).join('');
}

function generatePassphrase(wordCount) {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORDLIST[Math.floor(Math.random() * WORDLIST.length)]);
  }
  return words.join('-');
}

function strengthLabel(pass) {
  let score = 0;
  if (/[a-z]/.test(pass))  score++;
  if (/[A-Z]/.test(pass))  score++;
  if (/[0-9]/.test(pass))  score++;
  if (/[^a-zA-Z0-9]/.test(pass)) score++;
  if (pass.length >= 16)   score++;
  if (pass.length >= 24)   score++;
  if (score <= 2) return '🔴 Weak';
  if (score <= 4) return '🟡 Moderate';
  return '🟢 Strong';
}

module.exports = {
  name: 'password',
  aliases: ['genpass', 'passgen', 'passwd', 'pw'],
  category: 'utility',
  description: 'Generate a secure password, PIN, or passphrase',
  usage: '.password [length] [pin|words]',

  async execute(sock, msg, args, extra) {
    try {
      const mode   = (args[1] || '').toLowerCase();
      let   length = parseInt(args[0], 10) || 16;

      if (isNaN(length) || length < 4)  length = 16;
      if (length > 128)                 length = 128;

      if (mode === 'pin') {
        if (length < 4 || length > 20) length = 6;
        const pin = generatePin(length);
        return extra.reply(
          `🔑 *PIN Generator*\n\n` +
          `\`${pin}\`\n\n` +
          `📏 Length: ${pin.length} digits\n` +
          `⚠️ _Store this safely. Don't share it._`
        );
      }

      if (mode === 'words' || mode === 'passphrase') {
        let wordCount = parseInt(args[0], 10) || 4;
        if (wordCount < 3)  wordCount = 3;
        if (wordCount > 10) wordCount = 10;
        const phrase = generatePassphrase(wordCount);
        return extra.reply(
          `🔑 *Passphrase Generator*\n\n` +
          `\`${phrase}\`\n\n` +
          `📏 ${wordCount} words | ${phrase.length} chars\n` +
          `💪 Strength: 🟢 Strong (memorable)\n` +
          `⚠️ _Store this safely. Don't share it._`
        );
      }

      // Default: secure password
      const pass = generatePassword(length);
      const strength = strengthLabel(pass);

      await extra.reply(
        `🔑 *Password Generator*\n\n` +
        `\`${pass}\`\n\n` +
        `📏 Length: ${length} chars\n` +
        `💪 Strength: ${strength}\n\n` +
        `_Includes uppercase, lowercase, digits & symbols._\n` +
        `⚠️ _Never share your password with anyone._`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
