/**
 * GeneralCmds Command - List all general commands
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'generalcmds',
  aliases: ['gcmds', 'generalmenu'],
  category: 'general',
  description: 'Show all general commands',
  usage: '.generalcmds',

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menu =
        `🏠 *Ladybug Mini — General Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `📋 *Menu & Info*\n` +
        `  ${p}menu              — Full bot command menu\n` +
        `  ${p}list              — Category list menu\n` +
        `  ${p}ping              — Check bot speed/latency\n` +
        `  ${p}uptime            — Bot uptime & system stats\n` +
        `  ${p}owner             — Show bot owner info\n\n` +

        `🔧 *Tools*\n` +
        `  ${p}sticker           — Convert image to sticker\n` +
        `  ${p}take              — Convert to sticker with pack name\n` +
        `  ${p}toimage           — Convert sticker to image\n` +
        `  ${p}crop              — Crop an image\n` +
        `  ${p}qr <text>         — Generate QR code\n` +
        `  ${p}simage            — Search for an image\n` +
        `  ${p}calculator        — Advanced calculator\n` +
        `  ${p}dice              — Roll a dice\n` +
        `  ${p}color <hex>       — Show color preview\n\n` +

        `🌍 *Information*\n` +
        `  ${p}weather <city>    — Current weather\n` +
        `  ${p}wikipedia <topic> — Wikipedia search\n` +
        `  ${p}news [topic]      — Latest news headlines\n` +
        `  ${p}currency <n> <from> <to> — Currency convert\n` +
        `  ${p}ipinfo <ip>       — IP address info\n` +
        `  ${p}timezone <city>   — Timezone lookup\n` +
        `  ${p}shorturl <url>    — Shorten a URL\n\n` +

        `👤 *Profile & Group*\n` +
        `  ${p}getpp @user       — Get profile picture\n` +
        `  ${p}vcard @user       — Get contact vCard\n` +
        `  ${p}groupinfo         — Group information\n` +
        `  ${p}groupstats        — Group activity stats\n` +
        `  ${p}groupreport       — Generate group report\n` +
        `  ${p}myactivity        — Your activity stats\n` +
        `  ${p}listmembers       — List group members\n\n` +

        `🌐 *Web*\n` +
        `  ${p}github <user>     — GitHub profile info\n` +
        `  ${p}ssweb <url>       — Screenshot a website\n` +
        `  ${p}attp <text>       — Animated text sticker\n\n` +

        `⏰ *Scheduling*\n` +
        `  ${p}reminder <min> <msg> — Set a reminder\n` +
        `  ${p}countdown <event> — Start a countdown\n` +
        `  ${p}poll <q> | <opts> — Create a group poll\n` +
        `  ${p}viewonce          — View once message tool\n\n` +

        `🔄 *Status*\n` +
        `  ${p}autostatus on/off — Auto-view statuses\n` +
        `  ${p}autostatusview on/off — Status view toggle\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Ladybug Bot Mini_`;

      await extra.reply(menu);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
