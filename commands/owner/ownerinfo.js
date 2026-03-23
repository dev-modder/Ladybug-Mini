/**
 * OwnerInfo Command - Display bot owner info (owner only)
 * Ladybug V5
 *
 * Usage: .ownerinfo
 */

const config = require('../../config');

module.exports = {
  name: 'ownerinfo',
  aliases: ['owner', 'botowner', 'myinfo'],
  category: 'owner',
  description: 'Display owner information and bot configuration summary',
  usage: '.ownerinfo',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const botJid   = sock.user?.id?.split(':')[0] + '@s.whatsapp.net' || 'N/A';
      const botName  = config.botName  || 'Ladybug';
      const prefix   = config.prefix   || '.';
      const version  = config.version  || 'V5';
      const ownerNum = Array.isArray(config.ownerNumber)
        ? config.ownerNumber.join(', ')
        : (config.ownerNumber || 'N/A');

      let bio = 'N/A';
      try {
        const status = await sock.fetchStatus(botJid);
        bio = status?.status || 'N/A';
      } catch (_) {}

      const infoText =
        `👤 *Owner Info — ${botName} ${version}*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🤖 *Bot Name:*    ${botName}\n` +
        `🆔 *Bot Number:*  ${botJid.split('@')[0]}\n` +
        `📌 *Prefix:*      ${prefix}\n` +
        `🔢 *Version:*     ${version}\n` +
        `📞 *Owner(s):*    ${ownerNum}\n` +
        `📝 *Bio:*         ${bio}\n` +
        `📰 *Newsletter:*  ${config.newsletterJid || 'Not set'}\n` +
        `🔊 *Anti-Call:*   ${config.anticall ? 'Enabled ✅' : 'Disabled ❌'}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;

      await extra.reply(infoText);

    } catch (error) {
      console.error('[ownerinfo] Error:', error);
      await extra.reply(`❌ Error fetching owner info: ${error.message}`);
    }
  },
};
