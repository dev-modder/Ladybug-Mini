/**
 * AdminCmds Command - Show all admin commands
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'admincmds',
  aliases: ['adminmenu', 'acmds'],
  category: 'admin',
  description: 'List all admin commands',
  usage: '.admincmds',
  groupOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menu =
        `🛡️ *Ladybug Mini — Admin Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `👥 *Member Management*\n` +
        `  ${p}kick @user         — Remove a member\n` +
        `  ${p}promote @user      — Promote to admin\n` +
        `  ${p}demote @user       — Demote from admin\n` +
        `  ${p}warn @user [reason]— Warn a member\n` +
        `  ${p}resetwarn @user    — Reset member warnings\n` +
        `  ${p}listmembers        — List all group members\n\n` +

        `🔒 *Group Control*\n` +
        `  ${p}mute               — Mute a specific member\n` +
        `  ${p}unmute             — Unmute a member\n` +
        `  ${p}muteall            — Restrict all members (admins only)\n` +
        `  ${p}unmuteall          — Lift group mute restriction\n` +
        `  ${p}grouplock on/off   — Lock/unlock group settings\n` +
        `  ${p}grouplink          — Get/reset group invite link\n\n` +

        `🚫 *Protection*\n` +
        `  ${p}antilink on/off    — Block links in group\n` +
        `  ${p}antitag on/off     — Block tagall/hidetag abuse\n` +
        `  ${p}antigroupmention on/off — Block @everyone mentions\n` +
        `  ${p}antiword on/off    — Block specific words\n\n` +

        `📢 *Announcements*\n` +
        `  ${p}tagall [msg]       — Tag all members\n` +
        `  ${p}hidetag [msg]      — Tag all (hidden)\n` +
        `  ${p}pinmsg <text>      — Pin/announce a message\n` +
        `  ${p}setrules [text]    — Set or view group rules\n\n` +

        `🎉 *Welcome & Goodbye*\n` +
        `  ${p}welcome on/off     — Toggle welcome messages\n` +
        `  ${p}goodbye on/off     — Toggle goodbye messages\n` +
        `  ${p}setwelcome <text>  — Set welcome message\n` +
        `  ${p}setgoodbye <text>  — Set goodbye message\n\n` +

        `🧹 *Cleanup*\n` +
        `  ${p}delete             — Delete a replied message\n` +
        `  ${p}clean <n>          — Delete last N bot messages\n` +
        `  ${p}autosticker on/off — Auto-convert images to stickers\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Ladybug Bot Mini_`;

      await extra.reply(menu);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
