/**
 * Broadcast Command - Send a message to all saved chats (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .broadcast <message>        — broadcast a text message
 *   .broadcast -g <message>     — broadcast to groups only
 *   .broadcast -p <message>     — broadcast to private chats only
 *
 * ⚠️  Use responsibly. Spamming can get the bot number banned.
 */

const DELAY_MS = 1200; // delay between sends to avoid ban

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
  name: 'broadcast',
  aliases: ['bc', 'bcast'],
  category: 'owner',
  description: 'Broadcast a message to all chats',
  usage: '.broadcast [-g|-p] <message>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(
          `📢 *Broadcast*\n\n` +
          `Usage:\n` +
          `  .broadcast <message>       — all chats\n` +
          `  .broadcast -g <message>    — groups only\n` +
          `  .broadcast -p <message>    — private chats only\n\n` +
          `⚠️ Use responsibly to avoid getting banned.`
        );
      }

      let filter = 'all'; // 'all' | 'groups' | 'private'
      let textArgs = [...args];

      if (args[0] === '-g') {
        filter = 'groups';
        textArgs.shift();
      } else if (args[0] === '-p') {
        filter = 'private';
        textArgs.shift();
      }

      const text = textArgs.join(' ').trim();
      if (!text) return extra.reply('❌ Please provide a message to broadcast.');

      // Fetch all chats
      const chats = await sock.groupFetchAllParticipating();
      const groupJids = Object.keys(chats);

      // Build target list
      let targets = [];
      if (filter === 'groups' || filter === 'all') {
        targets.push(...groupJids);
      }

      // Note: getting private chats list depends on your store implementation.
      // If your bot uses a store, add store.chats here.
      // For now we broadcast to groups + the chat where command was sent (if private).
      if (filter === 'private' || filter === 'all') {
        const from = extra.from;
        if (!from.endsWith('@g.us') && !targets.includes(from)) {
          targets.push(from);
        }
      }

      if (targets.length === 0) {
        return extra.reply('❌ No target chats found to broadcast to.');
      }

      await extra.reply(
        `📢 Broadcasting to *${targets.length}* chat(s)...\nFilter: *${filter}*`
      );

      let sent = 0;
      let failed = 0;

      for (const jid of targets) {
        try {
          await sock.sendMessage(jid, { text });
          sent++;
        } catch (e) {
          console.error(`[broadcast] Failed to send to ${jid}:`, e.message);
          failed++;
        }
        await sleep(DELAY_MS);
      }

      await extra.reply(
        `✅ *Broadcast Complete*\n\n` +
        `📤 Sent: ${sent}\n` +
        `❌ Failed: ${failed}\n` +
        `📋 Total: ${targets.length}`
      );

    } catch (error) {
      console.error('[broadcast] Error:', error);
      await extra.reply(`❌ Broadcast failed: ${error.message}`);
    }
  },
};
