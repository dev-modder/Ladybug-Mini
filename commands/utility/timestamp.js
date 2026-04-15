/**
 * Timestamp Command - Convert between Unix timestamps and human dates
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Usage:
 *   .timestamp              → current timestamp
 *   .timestamp 1700000000   → convert Unix to date
 *   .timestamp 2024-01-15   → convert date to Unix
 *   .timestamp now          → current in multiple formats
 */

'use strict';

const config = require('../../config');

const TZ = config.timezone || 'Africa/Harare';

function formatDate(date, timezone) {
  const opts = {
    timeZone: timezone,
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
    weekday: 'long',
  };
  return new Intl.DateTimeFormat('en-US', opts).format(date);
}

function formatISO(date) {
  return date.toISOString();
}

function relativeTime(ms) {
  const diff = Date.now() - ms;
  const abs  = Math.abs(diff);
  const past = diff > 0;

  const units = [
    [31536000000, 'year'],
    [2592000000,  'month'],
    [604800000,   'week'],
    [86400000,    'day'],
    [3600000,     'hour'],
    [60000,       'minute'],
    [1000,        'second'],
  ];

  for (const [ms_, label] of units) {
    const n = Math.floor(abs / ms_);
    if (n >= 1) {
      return past
        ? `${n} ${label}${n > 1 ? 's' : ''} ago`
        : `in ${n} ${label}${n > 1 ? 's' : ''}`;
    }
  }
  return 'just now';
}

module.exports = {
  name: 'timestamp',
  aliases: ['ts', 'unixtime', 'epoch', 'time2unix', 'unix2time'],
  category: 'utility',
  description: 'Convert between Unix timestamps and human-readable dates',
  usage: '.timestamp | .timestamp <unix> | .timestamp <YYYY-MM-DD>',

  async execute(sock, msg, args, extra) {
    try {
      const now = Date.now();

      // No args — show current timestamp
      if (!args.length || args[0].toLowerCase() === 'now') {
        const unixSec = Math.floor(now / 1000);
        const date    = new Date(now);
        return extra.reply(
          `⏱️ *Current Timestamp*\n\n` +
          `🔢 *Unix (seconds):*  \`${unixSec}\`\n` +
          `🔢 *Unix (ms):*       \`${now}\`\n\n` +
          `📅 *Local (${TZ}):*\n${formatDate(date, TZ)}\n\n` +
          `🌍 *UTC/ISO 8601:*\n${formatISO(date)}`
        );
      }

      const input = args.join(' ').trim();

      // Parse Unix timestamp (seconds or ms)
      if (/^\d{9,13}$/.test(input)) {
        const ts = input.length <= 10
          ? parseInt(input, 10) * 1000
          : parseInt(input, 10);
        const date = new Date(ts);
        if (isNaN(date.getTime())) return extra.reply('❌ Invalid timestamp.');
        return extra.reply(
          `⏱️ *Timestamp → Date*\n\n` +
          `🔢 *Unix (s):* \`${Math.floor(ts / 1000)}\`\n` +
          `🔢 *Unix (ms):* \`${ts}\`\n\n` +
          `📅 *Local (${TZ}):*\n${formatDate(date, TZ)}\n\n` +
          `🌍 *ISO 8601:* ${formatISO(date)}\n` +
          `🕐 *Relative:* ${relativeTime(ts)}`
        );
      }

      // Parse human date
      const date = new Date(input);
      if (isNaN(date.getTime())) {
        return extra.reply(
          `❌ Could not parse "${input}".\n\n` +
          `Try:\n` +
          `  .timestamp 1700000000\n` +
          `  .timestamp 2024-01-15\n` +
          `  .timestamp 2024-01-15T12:00:00Z`
        );
      }

      const ts = date.getTime();
      await extra.reply(
        `⏱️ *Date → Timestamp*\n\n` +
        `📅 *Input:* ${input}\n\n` +
        `🔢 *Unix (seconds):* \`${Math.floor(ts / 1000)}\`\n` +
        `🔢 *Unix (ms):*      \`${ts}\`\n\n` +
        `📅 *Local (${TZ}):*\n${formatDate(date, TZ)}\n\n` +
        `🌍 *ISO 8601:* ${formatISO(date)}\n` +
        `🕐 *Relative:* ${relativeTime(ts)}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
