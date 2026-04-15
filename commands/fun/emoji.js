/**
 * Emoji Command - Search for emojis by keyword or get random emojis
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Usage:
 *   .emoji fire
 *   .emoji love
 *   .emoji random
 */

'use strict';

const EMOJI_DATA = {
  fire:       ['🔥','🕯️','🌋','♨️','🏮'],
  love:       ['❤️','💕','💖','💗','💓','💞','💘','💝','🥰','😍'],
  happy:      ['😀','😃','😄','😁','😆','🤣','😂','🥳','😊','🎉'],
  sad:        ['😢','😭','😔','😞','😟','😿','💔','🥺','😓','😥'],
  angry:      ['😠','😡','🤬','👿','💢','😤','🔥','😾'],
  food:       ['🍕','🍔','🍟','🌮','🍜','🍣','🍦','🍩','🎂','🍫'],
  animal:     ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯'],
  nature:     ['🌸','🌺','🌻','🌼','🌷','🌿','🍃','🌊','⛰️','🌅'],
  sport:      ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸'],
  music:      ['🎵','🎶','🎸','🎹','🎺','🥁','🎷','🎻','🎤','🎧'],
  weather:    ['☀️','🌤️','⛅','🌧️','⛈️','🌩️','❄️','🌨️','🌪️','🌈'],
  tech:       ['💻','📱','⌨️','🖥️','🖱️','💾','📀','🔋','📡','🤖'],
  money:      ['💰','💵','💴','💶','💷','💸','💳','🏦','📈','🤑'],
  celebration:['🎉','🎊','🎈','🎁','🥂','🍾','🎂','🎆','🎇','✨'],
  scary:      ['👻','💀','☠️','🕷️','🕸️','🧟','🎃','🦇','👁️','🔪'],
  thinking:   ['🤔','💭','🧠','💡','❓','❔','📚','🔍','🧩','⚡'],
  star:       ['⭐','🌟','💫','✨','🌠','🌌','⚡','🌙','☀️','🌞'],
  travel:     ['✈️','🚀','🚂','🚢','🏖️','🗺️','🌍','🏔️','🗽','🌉'],
};

const ALL_EMOJIS = Object.values(EMOJI_DATA).flat();

module.exports = {
  name: 'emoji',
  aliases: ['emojis', 'findemoji', 'emoticon'],
  category: 'fun',
  description: 'Search for emojis by keyword or get random ones',
  usage: '.emoji <keyword> | .emoji random',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        const categories = Object.keys(EMOJI_DATA).join(', ');
        return extra.reply(
          `😀 *Emoji Search*\n\n` +
          `Usage: .emoji <keyword>\n` +
          `Or:    .emoji random\n\n` +
          `Categories: ${categories}`
        );
      }

      const query = args.join(' ').toLowerCase().trim();

      if (query === 'random') {
        const picks = Array.from({ length: 10 }, () =>
          ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)]
        );
        return extra.reply(`🎲 *Random Emojis:*\n\n${picks.join('  ')}`);
      }

      // Search by keyword
      const matches = EMOJI_DATA[query];
      if (matches) {
        return extra.reply(`😀 *${query}:*\n\n${matches.join('  ')}`);
      }

      // Fuzzy search: find categories that contain the query
      const fuzzy = Object.entries(EMOJI_DATA).filter(([k]) => k.includes(query) || query.includes(k));
      if (fuzzy.length) {
        const result = fuzzy.slice(0, 3).map(([k, v]) => `*${k}:* ${v.join(' ')}`).join('\n');
        return extra.reply(`😀 *Emojis for "${query}":*\n\n${result}`);
      }

      return extra.reply(
        `❌ No emojis found for *"${query}"*.\n\n` +
        `Try: ${Object.keys(EMOJI_DATA).join(', ')}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
