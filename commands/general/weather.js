/**
 * Weather Command - Get current weather for any city
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Uses wttr.in (no API key required)
 * Usage: .weather <city>
 */

'use strict';

const axios = require('axios');

module.exports = {
  name: 'weather',
  aliases: ['cuaca', 'forecast', 'wtr'],
  category: 'general',
  description: 'Get current weather for any city',
  usage: '.weather <city>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🌤️ *Weather*\n\n` +
          `Usage: .weather <city>\n` +
          `Example: .weather London\n` +
          `Example: .weather New York`
        );
      }

      const city = args.join(' ').trim();
      await extra.reply(`🌍 Fetching weather for *${city}*...`);

      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
      const res = await axios.get(url, { timeout: 10000 });
      const data = res.data;

      const current = data.current_condition[0];
      const area    = data.nearest_area[0];

      const cityName    = area.areaName[0]?.value || city;
      const country     = area.country[0]?.value || '';
      const tempC       = current.temp_C;
      const tempF       = current.temp_F;
      const feelsLikeC  = current.FeelsLikeC;
      const humidity    = current.humidity;
      const windKmph    = current.windspeedKmph;
      const windDir     = current.winddir16Point;
      const visibility  = current.visibility;
      const description = current.weatherDesc[0]?.value || 'Unknown';
      const uvIndex     = current.uvIndex;
      const cloudCover  = current.cloudcover;
      const pressure    = current.pressure;

      // Pick weather emoji
      const descLower = description.toLowerCase();
      let emoji = '🌤️';
      if (descLower.includes('sunny') || descLower.includes('clear'))   emoji = '☀️';
      else if (descLower.includes('rain') || descLower.includes('drizzle')) emoji = '🌧️';
      else if (descLower.includes('snow'))   emoji = '❄️';
      else if (descLower.includes('thunder')) emoji = '⛈️';
      else if (descLower.includes('fog') || descLower.includes('mist')) emoji = '🌫️';
      else if (descLower.includes('cloud') || descLower.includes('overcast')) emoji = '☁️';
      else if (descLower.includes('wind')) emoji = '💨';

      const reply =
        `╔══════════════════════╗\n` +
        `║  ${emoji}  *WEATHER REPORT*  ${emoji}  ║\n` +
        `╚══════════════════════╝\n\n` +
        `📍 *Location:* ${cityName}, ${country}\n` +
        `🌡️ *Temperature:* ${tempC}°C / ${tempF}°F\n` +
        `🤔 *Feels Like:* ${feelsLikeC}°C\n` +
        `🌥️ *Condition:* ${description}\n\n` +
        `━━━━━ 📊 *Details* ━━━━━\n` +
        `💧 *Humidity:* ${humidity}%\n` +
        `💨 *Wind:* ${windKmph} km/h ${windDir}\n` +
        `👁️ *Visibility:* ${visibility} km\n` +
        `🌫️ *Cloud Cover:* ${cloudCover}%\n` +
        `⏱️ *Pressure:* ${pressure} hPa\n` +
        `☀️ *UV Index:* ${uvIndex}\n\n` +
        `_Powered by wttr.in_`;

      await extra.reply(reply);

    } catch (error) {
      console.error('[weather] Error:', error);
      if (error.response?.status === 404 || error.response?.status === 400) {
        return extra.reply(`❌ City *"${args.join(' ')}"* not found. Try a different spelling.`);
      }
      await extra.reply(`❌ Weather fetch failed: ${error.message}`);
    }
  },
};
