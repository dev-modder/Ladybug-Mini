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
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `⚙️ *Bot Settings*\n` +
        `  ${p}setbotname <name>         — Change bot name\n` +
        `  ${p}setbio <text>             — Change bot bio/about\n` +
        `  ${p}setprefix <char>          — Change command prefix\n` +
        `  ${p}setbotpp                  — Set bot profile picture\n` +
        `  ${p}setmenuimage              — Set menu image\n\n` +

        `👥 *Owner Management*\n` +
        `  ${p}addowner @user|number     — Add a bot owner\n` +
        `  ${p}removeowner @user|number  — Remove a bot owner\n` +
        `  ${p}addowner list             — List all owners\n` +
        `  ${p}ownerinfo                 — Show bot/owner config\n\n` +

        `📰 *Newsletter / Channel*\n` +
        `  ${p}newsletter <link>         — Get channel info from link\n` +
        `  ${p}setnewsletter <JID>       — Set newsletter JID for menus\n\n` +

        `👤 *User Management*\n` +
        `  ${p}block @user|number        — Block a user\n` +
        `  ${p}unblock @user|number      — Unblock a user\n\n` +

        `📢 *Messaging*\n` +
        `  ${p}broadcast <msg>           — Broadcast to all chats\n` +
        `  ${p}broadcast -g <msg>        — Groups only\n` +
        `  ${p}broadcast -p <msg>        — Private chats only\n` +
        `  ${p}say <message>             — Make bot send a message\n` +
        `  ${p}say <JID|number> | <msg>  — Send to specific chat\n\n` +

        `🏘️ *Group Management*\n` +
        `  ${p}joingroup <invite link>   — Join a group via invite\n` +
        `  ${p}leavegroup                — Leave current group\n` +
        `  ${p}leavegroup <JID>          — Leave specific group\n` +
        `  ${p}leavegroup list           — List all groups\n` +
        `  ${p}setgroupname <name>       — Change group name\n` +
        `  ${p}setgroupdesc <text>       — Change group description\n\n` +

        `🔒 *Protection*\n` +
        `  ${p}anticall on/off           — Toggle call rejection\n` +
        `  ${p}maintenance on/off [msg]  — Toggle maintenance mode\n\n` +

        `🛠️ *Debug & Tools*\n` +
        `  ${p}stats                     — Bot runtime stats\n` +
        `  ${p}getjid [@|reply|number]   — Get JID of any chat/user\n` +
        `  ${p}clearstate [all]          — Clear stuck typing state\n` +
        `  ${p}logger on|off|view|clear  — Toggle message logging\n` +
        `  ${p}eval <js code>            — Execute JavaScript ⚠️\n\n` +

        `🤖 *Bot Management*\n` +
        `  ${p}update                    — Pull latest update from Git\n` +
        `  ${p}update -r                 — Update + auto-restart\n` +
        `  ${p}restart                   — Restart the bot\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Version: Ladybug V5_`;

      await extra.reply(menuText);

    } catch (error) {
      console.error('[ownercmds] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
