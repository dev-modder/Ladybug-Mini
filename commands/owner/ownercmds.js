/**
 * OwnerCmds Command - List all owner-only commands (owner only)
 * Ladybug V5
 *
 * Usage: .ownercmds
 */

const config = require('../../config');

module.exports = {
  name: 'ownercmds',
  aliases: ['ownercommands', 'ownermenu', 'ocmds'],
  category: 'owner',
  description: 'List all owner-only commands',
  usage: '.ownercmds',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menuText =
        `🐞 *Ladybug V5 — Owner Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `⚙️ *Bot Settings*\n` +
        `  ${p}setbotname <name>      — Change bot name\n` +
        `  ${p}setbio <text>          — Change bot bio/about\n` +
        `  ${p}setprefix <char>       — Change command prefix\n` +
        `  ${p}setbotpp               — Set bot profile picture (reply to image)\n` +
        `  ${p}setmenuimage           — Set menu image (reply to image)\n\n` +

        `📰 *Newsletter / Channel*\n` +
        `  ${p}newsletter <link>      — Get channel info from link\n` +
        `  ${p}setnewsletter <JID>    — Set newsletter JID for menus\n\n` +

        `👤 *User Management*\n` +
        `  ${p}block @user|number     — Block a user\n` +
        `  ${p}unblock @user|number   — Unblock a user\n\n` +

        `📢 *Broadcast*\n` +
        `  ${p}broadcast <msg>        — Send to all chats\n` +
        `  ${p}broadcast -g <msg>     — Groups only\n` +
        `  ${p}broadcast -p <msg>     — Private chats only\n\n` +

        `🔒 *Protection*\n` +
        `  ${p}anticall on/off        — Toggle call rejection\n\n` +

        `🤖 *Bot Management*\n` +
        `  ${p}ownerinfo              — Show bot/owner config\n` +
        `  ${p}update                 — Pull latest update from Git\n` +
        `  ${p}update -r              — Update + auto-restart\n` +
        `  ${p}restart                — Restart the bot\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Version: Ladybug V5_`;

      await extra.reply(menuText);

    } catch (error) {
      console.error('[ownercmds] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
