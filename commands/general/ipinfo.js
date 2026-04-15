/**
 * IP Info Command - Lookup information about an IP address or domain
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Uses ip-api.com (free, no key needed, 45 req/min)
 * Usage: .ipinfo <ip or domain>
 */

'use strict';

const axios = require('axios');

module.exports = {
  name: 'ipinfo',
  aliases: ['ip', 'iplookup', 'geoip', 'whoip'],
  category: 'general',
  description: 'Get location and info about an IP address or domain',
  usage: '.ipinfo <ip or domain>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🌐 *IP Info*\n\n` +
          `Usage: .ipinfo <ip or domain>\n\n` +
          `Examples:\n` +
          `  .ipinfo 8.8.8.8\n` +
          `  .ipinfo google.com`
        );
      }

      const target = args[0].trim().toLowerCase()
        .replace(/^https?:\/\//i, '').split('/')[0];

      await extra.reply(`🔍 Looking up *${target}*...`);

      const res = await axios.get(
        `http://ip-api.com/json/${encodeURIComponent(target)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
        { timeout: 8000 }
      );

      const d = res.data;

      if (d.status !== 'success') {
        return extra.reply(`❌ Lookup failed: ${d.message || 'Unknown error'}\n\nMake sure you entered a valid IP or domain.`);
      }

      await extra.reply(
        `🌐 *IP Information*\n\n` +
        `🔢 *IP:* \`${d.query}\`\n` +
        `🏳️ *Country:* ${d.country} (${d.countryCode})\n` +
        `🏙️ *Region:* ${d.regionName}\n` +
        `📍 *City:* ${d.city}\n` +
        `📮 *ZIP:* ${d.zip || 'N/A'}\n` +
        `🗺️ *Coordinates:* ${d.lat}, ${d.lon}\n` +
        `🕐 *Timezone:* ${d.timezone}\n` +
        `🌐 *ISP:* ${d.isp}\n` +
        `🏢 *Organization:* ${d.org || 'N/A'}\n` +
        `📡 *AS:* ${d.as || 'N/A'}\n\n` +
        `🗺️ https://maps.google.com/?q=${d.lat},${d.lon}`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
