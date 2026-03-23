/**
 * SetBio Command - Change bot's WhatsApp status/bio (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .setbio <new bio text>
 *   .setbio  (no args — shows current bio)
 */

module.exports = {
  name: 'setbio',
  aliases: ['setstatus', 'botstatus', 'setabout'],
  category: 'owner',
  description: "Change the bot's WhatsApp about/bio",
  usage: '.setbio <text>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      // Get bio text from args OR quoted message
      let bio = '';

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quoted) {
        bio = (
          quoted.conversation ||
          quoted.extendedTextMessage?.text ||
          quoted.imageMessage?.caption ||
          quoted.videoMessage?.caption ||
          ''
        ).trim();
      }

      if (!bio) {
        bio = args.join(' ').trim();
      }

      if (!bio) {
        // Show current bio
        let currentBio = 'N/A';
        try {
          const status = await sock.fetchStatus(sock.user.id);
          currentBio = status?.status || 'N/A';
        } catch (_) {}

        return extra.reply(
          `📝 *Bot Bio/About*\n\n` +
          `Current: _${currentBio}_\n\n` +
          `Usage: .setbio <new bio text>\n` +
          `Max: 139 characters`
        );
      }

      if (bio.length > 139) {
        return extra.reply(`❌ Bio is too long (${bio.length}/139 characters).`);
      }

      await sock.updateProfileStatus(bio);
      await extra.reply(`✅ Bot bio updated!\n\n_${bio}_`);

    } catch (error) {
      console.error('[setbio] Error:', error);
      await extra.reply(`❌ Failed to update bio: ${error.message}`);
    }
  },
};
