/**
 * Newsletter Command - Get newsletter/channel info from a WhatsApp channel link
 * Ladybug V5 — Owner Only
 */

/**
 * Extract invite code from a WhatsApp channel link
 * Supports:
 *   https://whatsapp.com/channel/0029VaAbCdEfGhIJkL
 *   https://wa.me/channel/0029VaAbCdEfGhIJkL
 *   0029VaAbCdEfGhIJkL  (raw code)
 */
function getChannelInviteCode(link) {
  try {
    let clean = link.trim().split('?')[0].split('#')[0];

    // Try URL parser first
    try {
      const url = new URL(clean);
      const parts = url.pathname.split('/').filter(Boolean);
      const code = parts[parts.length - 1];
      if (code && code.length > 5) return code;
    } catch (_) {}

    // Regex fallback
    const patterns = [
      /(?:whatsapp\.com|wa\.me)\/channel\/([A-Za-z0-9]+)/i,
      /\/channel\/([A-Za-z0-9]+)/i,
      /channel\/([A-Za-z0-9]+)/i,
    ];
    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match?.[1]) return match[1];
    }

    // Raw code fallback
    if (/^[A-Za-z0-9]{10,}$/.test(clean)) return clean;
    return null;
  } catch (error) {
    console.error('[newsletter] Error extracting invite code:', error);
    return null;
  }
}

module.exports = {
  name: 'newsletter',
  aliases: ['channel', 'channelinfo', 'nl', 'getnl'],
  category: 'owner',
  description: 'Get newsletter/channel info from a WhatsApp channel link',
  usage: '.newsletter <channel link or invite code>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;

      // Accept link from args or full message text (after command name)
      const rawText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      // Strip command name to get the link portion
      const link = (
        rawText.replace(/^\.(newsletter|nl|channel|channelinfo|getnl)\s*/i, '').trim() ||
        args.join(' ').trim()
      );

      if (!link) {
        return extra.reply(
          `📰 *Newsletter Lookup*\n\n` +
          `Usage: .newsletter <channel link>\n\n` +
          `Example:\n` +
          `.newsletter https://whatsapp.com/channel/0029VaAbCdEfGhIJkL\n\n` +
          `Or just the invite code:\n` +
          `.newsletter 0029VaAbCdEfGhIJkL`
        );
      }

      const inviteCode = getChannelInviteCode(link);

      if (!inviteCode) {
        return extra.reply(
          `❌ Could not extract an invite code from:\n\`${link}\`\n\n` +
          `Please provide a valid WhatsApp channel link.\n` +
          `Example: https://whatsapp.com/channel/0029VaAbCdEfGhIJkL`
        );
      }

      // Fetch newsletter metadata
      let meta;
      try {
        meta = await sock.newsletterMetadata('invite', inviteCode);
      } catch (fetchErr) {
        console.error('[newsletter] fetchErr:', fetchErr);
        if (fetchErr.message?.toLowerCase().includes('not-found') || fetchErr.output?.statusCode === 404) {
          return extra.reply('❌ Newsletter not found! The channel may be private, deleted, or the link is invalid.');
        }
        return extra.reply(`❌ Failed to fetch newsletter info:\n${fetchErr.message}`);
      }

      if (!meta) {
        return extra.reply('❌ No data returned for that channel. It may not exist or be private.');
      }

      // ── Build Info Text ──────────────────────────────────────────────────────
      const name = meta.name || meta.subject || 'Unknown';
      const jid  = meta.id   || 'N/A';
      const desc = meta.description || meta.desc || '';
      const subs = meta.subscriberCount !== undefined
        ? Number(meta.subscriberCount).toLocaleString()
        : 'N/A';
      const created = meta.creationTime
        ? new Date(meta.creationTime * 1000).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          })
        : 'N/A';
      const inviteLink = meta.invite
        ? `https://whatsapp.com/channel/${meta.invite}`
        : `https://whatsapp.com/channel/${inviteCode}`;
      const state = meta.state || meta.verification || '';

      let infoText =
        `📰 *Newsletter Info*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📛 *Name:* ${name}\n` +
        `🆔 *JID:* \`${jid}\`\n` +
        `👥 *Subscribers:* ${subs}\n` +
        `📅 *Created:* ${created}\n` +
        `🔗 *Link:* ${inviteLink}\n`;

      if (state) infoText += `✅ *Status:* ${state}\n`;
      if (desc)  infoText += `\n📝 *Description:*\n${desc}\n`;

      infoText += `━━━━━━━━━━━━━━━━━━━━\n`;

      // Send with thumbnail if available
      const imageUrl = meta.picture || meta.image || meta.profilePictureUrl || null;

      if (imageUrl) {
        await sock.sendMessage(chatId, {
          image: { url: imageUrl },
          caption: infoText,
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: infoText }, { quoted: msg });
      }

    } catch (error) {
      console.error('[newsletter] Unexpected error:', error);
      await extra.reply(`❌ An unexpected error occurred:\n${error.message}`);
    }
  },
};
