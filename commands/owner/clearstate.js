/**
 * ClearState Command - Clear bot's presence / typing state (owner only)
 * Ladybug V5
 *
 * Useful when the bot gets stuck showing "typing..." or "recording..." in a chat.
 *
 * Usage:
 *   .clearstate           — clear state in current chat
 *   .clearstate all       — clear state in all active chats (best-effort)
 */

module.exports = {
  name: 'clearstate',
  aliases: ['cleartyping', 'clearpresence', 'unstuck'],
  category: 'owner',
  description: "Clear bot's typing/recording presence state",
  usage: '.clearstate [all]',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const clearAll = args[0]?.toLowerCase() === 'all';

      if (clearAll) {
        // Fetch all participating groups and clear state
        let cleared = 0;
        try {
          const groups = await sock.groupFetchAllParticipating();
          for (const jid of Object.keys(groups)) {
            try {
              await sock.sendPresenceUpdate('available', jid);
              cleared++;
            } catch (_) {}
          }
        } catch (_) {}

        // Also clear current chat
        await sock.sendPresenceUpdate('available', extra.from);
        cleared++;

        return extra.reply(`✅ Cleared presence state in *${cleared}* chat(s).`);
      }

      // Clear current chat only
      await sock.sendPresenceUpdate('available', extra.from);
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`✅ Presence state cleared in this chat.`);

    } catch (error) {
      console.error('[clearstate] Error:', error);
      await extra.reply(`❌ Error clearing state: ${error.message}`);
    }
  },
};
