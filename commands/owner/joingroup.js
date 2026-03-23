/**
 * JoinGroup Command - Make the bot join a group via invite link (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .joingroup <invite link>
 *   .joingroup <invite code>   (just the code after chat.whatsapp.com/...)
 *
 * Example:
 *   .joingroup https://chat.whatsapp.com/AbCdEfGhIjKl
 *   .joingroup AbCdEfGhIjKl
 */

function extractGroupCode(link) {
  const clean = link.trim().split('?')[0].split('#')[0];

  // Try URL parser
  try {
    const url = new URL(clean);
    const parts = url.pathname.split('/').filter(Boolean);
    const code = parts[parts.length - 1];
    if (code && code.length > 5) return code;
  } catch (_) {}

  // Regex fallback
  const match = clean.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i);
  if (match?.[1]) return match[1];

  // Raw code
  if (/^[A-Za-z0-9]{10,}$/.test(clean)) return clean;
  return null;
}

module.exports = {
  name: 'joingroup',
  aliases: ['join', 'joinchat'],
  category: 'owner',
  description: 'Make the bot join a group via invite link',
  usage: '.joingroup <invite link or code>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const input = args.join(' ').trim();

      if (!input) {
        return extra.reply(
          `🔗 *Join Group*\n\n` +
          `Usage: .joingroup <invite link>\n\n` +
          `Example:\n` +
          `.joingroup https://chat.whatsapp.com/AbCdEfGhIjKl\n` +
          `Or just the code:\n` +
          `.joingroup AbCdEfGhIjKl`
        );
      }

      const code = extractGroupCode(input);
      if (!code) {
        return extra.reply(
          `❌ Could not extract invite code from:\n\`${input}\`\n\n` +
          `Provide a valid WhatsApp group invite link.\n` +
          `Example: https://chat.whatsapp.com/AbCdEfGhIjKl`
        );
      }

      // Get group info before joining
      let groupName = 'Unknown';
      try {
        const info = await sock.groupGetInviteInfo(code);
        groupName = info?.subject || 'Unknown';
      } catch (_) {}

      await extra.reply(`🔄 Joining group: *${groupName}*...`);

      const result = await sock.groupAcceptInvite(code);

      await extra.reply(
        `✅ Successfully joined group!\n\n` +
        `📛 *Name:* ${groupName}\n` +
        `🆔 *JID:* \`${result}\``
      );

    } catch (error) {
      console.error('[joingroup] Error:', error);

      if (error.message?.toLowerCase().includes('forbidden')) {
        return extra.reply('❌ Invite link is invalid, expired, or revoked.');
      }
      if (error.message?.toLowerCase().includes('already')) {
        return extra.reply('❌ Bot is already a member of that group.');
      }
      await extra.reply(`❌ Failed to join group: ${error.message}`);
    }
  },
};
