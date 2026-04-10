/**
 * Timezone Command - Show current time in any timezone or city
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Usage: .time <timezone or city>
 * Example: .time Tokyo | .time New York | .time Africa/Harare
 */

'use strict';

// Common city → IANA timezone mapping (covers most popular requests)
const CITY_MAP = {
  'new york': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'toronto': 'America/Toronto',
  'london': 'Europe/London',
  'paris': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'amsterdam': 'Europe/Amsterdam',
  'dubai': 'Asia/Dubai',
  'riyadh': 'Asia/Riyadh',
  'moscow': 'Europe/Moscow',
  'istanbul': 'Europe/Istanbul',
  'tokyo': 'Asia/Tokyo',
  'seoul': 'Asia/Seoul',
  'beijing': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  'singapore': 'Asia/Singapore',
  'jakarta': 'Asia/Jakarta',
  'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'karachi': 'Asia/Karachi',
  'dhaka': 'Asia/Dhaka',
  'bangkok': 'Asia/Bangkok',
  'ho chi minh': 'Asia/Ho_Chi_Minh',
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'auckland': 'Pacific/Auckland',
  'cairo': 'Africa/Cairo',
  'nairobi': 'Africa/Nairobi',
  'johannesburg': 'Africa/Johannesburg',
  'lagos': 'Africa/Lagos',
  'harare': 'Africa/Harare',
  'accra': 'Africa/Accra',
  'casablanca': 'Africa/Casablanca',
  'sao paulo': 'America/Sao_Paulo',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  'mexico city': 'America/Mexico_City',
  'lima': 'America/Lima',
  'bogota': 'America/Bogota',
};

function resolveTimezone(input) {
  const lower = input.toLowerCase().trim();
  if (CITY_MAP[lower]) return CITY_MAP[lower];

  // Try as-is (user may have typed Africa/Harare etc.)
  try {
    Intl.DateTimeFormat(undefined, { timeZone: input });
    return input;
  } catch (_) {}

  // Try title-case fix
  const titled = input.replace(/\b\w/g, c => c.toUpperCase());
  try {
    Intl.DateTimeFormat(undefined, { timeZone: titled });
    return titled;
  } catch (_) {}

  return null;
}

module.exports = {
  name: 'time',
  aliases: ['timezone', 'tz', 'clock', 'waktu'],
  category: 'general',
  description: 'Show current time in any timezone or city',
  usage: '.time <city or timezone>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🕐 *Time / Timezone*\n\n` +
          `Usage: .time <city or timezone>\n\n` +
          `Examples:\n` +
          `  .time Tokyo\n` +
          `  .time New York\n` +
          `  .time Africa/Harare\n` +
          `  .time London\n` +
          `  .time Dubai`
        );
      }

      const input = args.join(' ').trim();
      const tz    = resolveTimezone(input);

      if (!tz) {
        return extra.reply(
          `❌ Timezone/city *"${input}"* not recognised.\n\n` +
          `Try using a standard timezone like:\n` +
          `  Asia/Tokyo, Europe/London, America/New_York`
        );
      }

      const now = new Date();

      const timeStr = now.toLocaleString('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const dateStr = now.toLocaleString('en-US', {
        timeZone: tz,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // UTC offset
      const offsetMin = -new Date().toLocaleString('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
        .split('GMT')[1]?.replace(/:/g, '') * 1 || 0;

      await extra.reply(
        `🕐 *World Time*\n\n` +
        `📍 *Location:* ${input}\n` +
        `🌐 *Timezone:* \`${tz}\`\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `🕰️ *Time:* ${timeStr}\n` +
        `📅 *Date:* ${dateStr}`
      );

    } catch (error) {
      console.error('[time] Error:', error);
      await extra.reply(`❌ Failed to get time: ${error.message}`);
    }
  },
};
