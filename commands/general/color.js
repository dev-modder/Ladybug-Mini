/**
 * Color Command - Get color info from hex/rgb/name
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Usage:
 *   .color #FF5733
 *   .color rgb(255, 87, 51)
 *   .color red
 *   .color random
 */

'use strict';

const axios = require('axios');

// Common color name to hex map for local lookups
const COLOR_NAMES = {
  red: '#FF0000', green: '#008000', blue: '#0000FF', yellow: '#FFFF00',
  orange: '#FFA500', purple: '#800080', pink: '#FFC0CB', black: '#000000',
  white: '#FFFFFF', grey: '#808080', gray: '#808080', cyan: '#00FFFF',
  magenta: '#FF00FF', lime: '#00FF00', maroon: '#800000', navy: '#000080',
  olive: '#808000', teal: '#008080', silver: '#C0C0C0', gold: '#FFD700',
  coral: '#FF7F50', salmon: '#FA8072', crimson: '#DC143C', indigo: '#4B0082',
  violet: '#EE82EE', turquoise: '#40E0D0', brown: '#A52A2A', tan: '#D2B48C',
  beige: '#F5F5DC', mint: '#98FF98', lavender: '#E6E6FA', peach: '#FFCBA4',
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function luminance({ r, g, b }) {
  const v = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

function isBright(hex) {
  return luminance(hexToRgb(hex)) > 0.179;
}

function randomHex() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
}

module.exports = {
  name: 'color',
  aliases: ['colour', 'hex', 'colorinfo', 'rgb'],
  category: 'general',
  description: 'Get detailed info about a color (hex, rgb, hsl)',
  usage: '.color <#hex | rgb(r,g,b) | name | random>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🎨 *Color Info*\n\n` +
          `Usage:\n` +
          `  .color #FF5733\n` +
          `  .color rgb(255, 87, 51)\n` +
          `  .color red\n` +
          `  .color random`
        );
      }

      let input = args.join(' ').trim().toLowerCase();
      let hex;

      // Random color
      if (input === 'random') {
        hex = randomHex();
      }
      // RGB notation
      else if (input.startsWith('rgb')) {
        const match = input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (!match) return extra.reply('❌ Invalid RGB format. Example: rgb(255, 87, 51)');
        const [, r, g, b] = match.map(Number);
        if ([r, g, b].some(v => v < 0 || v > 255)) return extra.reply('❌ RGB values must be 0–255.');
        hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
      }
      // Hex notation
      else if (input.startsWith('#') || /^[0-9a-f]{3,6}$/i.test(input)) {
        hex = (input.startsWith('#') ? input : '#' + input).toUpperCase();
        if (hex.length === 4) {
          // Expand shorthand #RGB → #RRGGBB
          hex = '#' + [...hex.slice(1)].map(c => c + c).join('');
        }
        if (!/^#[0-9A-F]{6}$/.test(hex)) return extra.reply('❌ Invalid hex color. Example: #FF5733');
      }
      // Color name
      else {
        const named = COLOR_NAMES[input];
        if (!named) return extra.reply(`❌ Unknown color name "${input}". Try a hex like #FF5733 or a basic name like red, blue.`);
        hex = named.toUpperCase();
      }

      const { r, g, b } = hexToRgb(hex);
      const hsl   = hexToHsl(hex);
      const bright = isBright(hex);
      const swatch = bright ? '⬜' : '⬛';

      await extra.reply(
        `🎨 *Color Info*\n\n` +
        `${swatch} *Hex:* \`${hex}\`\n` +
        `🔴🟢🔵 *RGB:* \`rgb(${r}, ${g}, ${b})\`\n` +
        `🌈 *HSL:* \`hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)\`\n\n` +
        `💡 *Appearance:* ${bright ? 'Light color' : 'Dark color'}\n` +
        `🔗 *Preview:* https://www.colorhexa.com/${hex.slice(1)}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
