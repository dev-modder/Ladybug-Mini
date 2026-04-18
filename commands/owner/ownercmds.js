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
        `🆕 *New Owner Commands (v5.1)*\n\n` +

        `👤 *Presence & Visibility*\n` +
        `  ${p}setstatustext <text>       — Update bot WhatsApp status/about\n` +
        `  ${p}ghostmode on|off|status    — Invisible mode (no presence/typing)\n` +
        `  ${p}autotyping on|off          — Toggle typing indicator\n` +
        `  ${p}autoread on|off            — Auto-read all messages (blue ticks)\n\n` +

        `🏘️ *Group Tools*\n` +
        `  ${p}grouplist                  — List all groups bot is in\n` +
        `  ${p}kickall confirm            — Kick all non-admins from group\n` +
        `  ${p}spromote @user|number      — Promote user in ALL groups\n` +
        `  ${p}antibot on|off|scan        — Auto-kick other bots from groups\n\n` +

        `💬 *Messaging*\n` +
        `  ${p}sendpm <number> | <msg>    — Private message any number\n` +
        `  ${p}forward <number|JID>       — Forward quoted msg to another chat\n` +
        `  ${p}schedulemsg <min> | <msg>  — Schedule a message (later)\n` +
        `  ${p}schedulemsg list           — View scheduled messages\n` +
        `  ${p}schedulemsg cancel <id>    — Cancel a scheduled message\n` +
        `  ${p}purge <count>              — Delete bot's own recent messages\n\n` +

        `🔧 *Settings*\n` +
        `  ${p}chatlist [groups|private]  — List all active chats\n` +
        `  ${p}blocklist                  — View all blocked contacts\n` +
        `  ${p}setreactmoji <emoji>       — Set auto-react emoji\n` +
        `  ${p}togglecmd <cmd> on|off     — Enable/disable specific commands\n` +
        `  ${p}ratelimit <secs>|off       — Set per-user command cooldown\n` +
        `  ${p}setlang <language>         — Set default AI response language\n\n` +

        `🧠 *AI Settings*\n` +
        `  ${p}setaipersonality <text>    — Set AI personality/system prompt\n` +
        `  ${p}setaipersonality preset X  — Load a preset (friendly/funny/etc)\n` +
        `  ${p}clearmemory all|<number>   — Clear AI conversation memory\n` +
        `  ${p}setwelcomemsg <text>       — Set global welcome message template\n\n` +

        `📝 *Notes*\n` +
        `  ${p}note add <key> <text>      — Save a personal note\n` +
        `  ${p}note get <key>             — Retrieve a note\n` +
        `  ${p}note list                  — List all notes\n` +
        `  ${p}note del <key>             — Delete a note\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🆕 *New Owner Commands (v5.2)*\n\n` +

        `📊 *Dashboard & Stats*\n` +
        `  ${p}dashboard                  — Full bot + system stats panel\n` +
        `  ${p}cmdstats [top <n>]          — Most used commands stats\n` +
        `  ${p}botstats2                   — Bot runtime & memory stats\n\n` +

        `📡 *Group Broadcast*\n` +
        `  ${p}gbroadcast <message>        — Broadcast to ALL groups\n` +
        `  ${p}gbroadcast list             — List groups with index numbers\n` +
        `  ${p}gbroadcast -n 1,3 | <msg>   — Send to specific groups by number\n\n` +

        `💬 *Custom Replies*\n` +
        `  ${p}customreply add <kw> | <reply> — Add keyword auto-reply\n` +
        `  ${p}customreply list            — View all keyword rules\n` +
        `  ${p}customreply del <keyword>   — Remove a keyword rule\n` +
        `  ${p}customreply on|off          — Toggle custom replies\n\n` +

        `⚠️ *Warn System*\n` +
        `  ${p}warnconfig status           — View warn system settings\n` +
        `  ${p}warnconfig setmax <n>       — Set max warns before action\n` +
        `  ${p}warnconfig setaction <kick|ban|mute>\n` +
        `  ${p}warnconfig setexpiry <days> — Warn expiry (0=never)\n\n` +

        `🖼️ *Group Media*\n` +
        `  ${p}setgrouppp                  — Set group profile picture (reply to image)\n\n` +

        `🎵 *AI Shazam*\n` +
        `  ${p}shazam                      — Identify any song from audio/video\n` +
        `  _(reply to audio/voice note/video — 5-API fallback chain)_\n\n` +

        `🚫 *Blacklist*\n` +
        `  ${p}ipblock <number> [reason]   — Permanently blacklist a number\n` +
        `  ${p}ipblock list                — View all blacklisted numbers\n` +
        `  ${p}ipblock remove <number>     — Remove from blacklist\n\n` +

        `⌨️ *Prefix*\n` +
        `  ${p}globalprefix <char>         — Set global prefix for all chats\n\n` +

        `📋 *Auto React*\n` +
        `  ${p}autoreact on|off            — Toggle auto emoji reactions\n` +
        `  ${p}setreactmoji <emoji>        — Set the auto-react emoji\n\n` +

        `🤖 *AI Personality*\n` +
        `  ${p}setaipersonality <text>     — Set AI chat personality/system prompt\n` +
        `  ${p}setautoreply <text>         — Set static auto-reply message\n` +
        `  ${p}aiautoreply on|off          — Toggle AI auto-reply mode\n\n` +

        `🌐 *Localisation*\n` +
        `  ${p}setlang <code>             — Set bot response language\n\n` +

        `🔒 *Rate Limiting*\n` +
        `  ${p}ratelimit set <n>           — Set command rate limit per minute\n` +
        `  ${p}slowmode on|off             — Toggle group slow mode\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Version: Ladybug Mini V1_`;

      await extra.reply(menuText);

    } catch (error) {
      console.error('[ownercmds] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
