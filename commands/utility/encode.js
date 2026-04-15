/**
 * Encode/Decode Command - Base64, URL, Binary, Morse code
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Usage:
 *   .encode base64 hello world
 *   .decode base64 aGVsbG8gd29ybGQ=
 *   .encode url https://example.com/path?q=hello world
 *   .encode binary hello
 *   .encode morse hello
 */

'use strict';

// ── Morse Code ──────────────────────────────────────────────────────────────
const MORSE_MAP = {
  'a': '.-',   'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.',
  'f': '..-.', 'g': '--.',  'h': '....', 'i': '..',  'j': '.---',
  'k': '-.-',  'l': '.-..', 'm': '--',   'n': '-.',  'o': '---',
  'p': '.--.', 'q': '--.-', 'r': '.-.',  's': '...', 't': '-',
  'u': '..-',  'v': '...-', 'w': '.--',  'x': '-..-','y': '-.--',
  'z': '--..',
  '0': '-----','1': '.----','2': '..---','3': '...--','4': '....-',
  '5': '.....','6': '-....','7': '--...','8': '---..','9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
  ' ': '/',
};

const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

function textToMorse(text) {
  return text.toLowerCase().split('').map(c => MORSE_MAP[c] || '?').join(' ');
}

function morseToText(morse) {
  return morse.split(' ').map(code => REVERSE_MORSE[code] || '?').join('');
}

function textToBinary(text) {
  return text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

function binaryToText(bin) {
  return bin.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
}

module.exports = {
  name: 'encode',
  aliases: ['decode', 'b64', 'base64', 'binary', 'morse'],
  category: 'utility',
  description: 'Encode or decode text: base64, URL, binary, morse',
  usage: '.encode <type> <text> | .decode <type> <text>',

  async execute(sock, msg, args, extra) {
    try {
      // Determine operation from the raw message text or first arg
      const rawText = (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ''
      ).trim();
      const cmdName = rawText.split(/\s+/)[0].replace(/^\./, '').toLowerCase();

      const isDecoding = cmdName === 'decode' || (args[0] || '').toLowerCase() === 'decode';

      if (!args.length || (args.length === 1 && isDecoding)) {
        return extra.reply(
          `🔠 *Encode / Decode*\n\n` +
          `*Encoding:*\n` +
          `  .encode base64 hello world\n` +
          `  .encode url https://site.com/path?q=hello world\n` +
          `  .encode binary hello\n` +
          `  .encode morse hello\n\n` +
          `*Decoding:*\n` +
          `  .decode base64 aGVsbG8gd29ybGQ=\n` +
          `  .decode url hello%20world\n` +
          `  .decode binary 01101000 01100101 01101100 01101100 01101111\n` +
          `  .decode morse .... . .-.. .-.. ---`
        );
      }

      let type  = args[0].toLowerCase();
      let text  = args.slice(1).join(' ');

      // If command itself is 'decode', shift args
      if (type === 'decode' && text) {
        type = args[1].toLowerCase();
        text = args.slice(2).join(' ');
      }

      // Detect operation: encode vs decode
      let operation = 'encode';
      if (cmdName === 'decode' || type === 'decode') {
        operation = 'decode';
        if (type === 'decode') { type = args[1] ? args[1].toLowerCase() : ''; text = args.slice(2).join(' '); }
      }

      if (!text.trim()) {
        return extra.reply('❌ Please provide text to encode/decode.');
      }

      let result;
      let typeName;

      if (type === 'base64' || type === 'b64') {
        typeName = 'Base64';
        if (operation === 'encode') {
          result = Buffer.from(text, 'utf8').toString('base64');
        } else {
          try {
            result = Buffer.from(text, 'base64').toString('utf8');
          } catch {
            return extra.reply('❌ Invalid Base64 input.');
          }
        }
      } else if (type === 'url') {
        typeName = 'URL';
        if (operation === 'encode') {
          result = encodeURIComponent(text);
        } else {
          try {
            result = decodeURIComponent(text);
          } catch {
            return extra.reply('❌ Invalid URL-encoded input.');
          }
        }
      } else if (type === 'binary' || type === 'bin') {
        typeName = 'Binary';
        if (operation === 'encode') {
          result = textToBinary(text);
        } else {
          if (!/^[01\s]+$/.test(text)) return extra.reply('❌ Binary input must only contain 0s and 1s.');
          result = binaryToText(text);
        }
      } else if (type === 'morse') {
        typeName = 'Morse Code';
        if (operation === 'encode') {
          result = textToMorse(text);
        } else {
          result = morseToText(text);
        }
      } else {
        return extra.reply(
          `❌ Unknown type "${type}".\n` +
          `Supported: base64, url, binary, morse`
        );
      }

      const icon = operation === 'encode' ? '🔒' : '🔓';
      await extra.reply(
        `${icon} *${operation === 'encode' ? 'Encoded' : 'Decoded'} — ${typeName}*\n\n` +
        `📥 *Input:*\n${text.length > 100 ? text.slice(0, 100) + '...' : text}\n\n` +
        `📤 *Output:*\n${result}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
