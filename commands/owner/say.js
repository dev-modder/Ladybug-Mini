/**
 * Say Command - Make the bot send a message to any chat (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .say <message>                     — send to current chat
 *   .say <JID> | <message>             — send to specific JID
 *   .say <phone number> | <message>    — send to a phone number
 *
 * Examples:
 *   .say Hello everyone!
 *   .say 2638xxxxxxxx | Hey, how are you?
 *   .say 120363xxx@g.us | Group announcement
 */

module.exports = {
  name: 'say',
  aliases: ['send', 'sendmsg', 'botmsg'],
  category: 'owner',
  description: 'Make the bot send a message to any chat',
  usage: '.say [JID|number |] <message>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(
          `📤 *Say / Send Message*\n\n` +
          `Usage:\n` +
          `  .say <message>                    — current chat\n` +
          `  .say <number> | <message>         — to a phone number\n` +
          `  .say <JID> | <message>            — to a specific JID\n\n` +
          `Examples:\n` +
          `  .say Hello!\n` +
          `  .say 2638xxxxxxxx | Hi there\n` +
          `  .say 120363xxx@g.us | Announcement`
        );
      }

      const fullText = args.join(' ');
      let targetJid  = extra.from;
      let text       = fullText;

      // Check for "target | message" pattern
      if (fullText.includes('|')) {
        const [targetPart, ...msgParts] = fullText.split('|');
        const rawTarget = targetPart.trim();
        const rawMsg    = msgParts.join('|').trim();

        if (rawTarget && rawMsg) {
          text = rawMsg;

          if (rawTarget.includes('@')) {
            // Already a JID
            targetJid = rawTarget;
          } else {
            // Phone number → JID
            const num = rawTarget.replace(/\D/g, '');
            targetJid = num.length >= 7 ? `${num}@s.whatsapp.net` : extra.from;
          }
        }
      }

      if (!text) return extra.reply('❌ Please provide a message to send.');

      await sock.sendMessage(targetJid, { text });

      // Confirm if sending to a different chat
      if (targetJid !== extra.from) {
        await extra.reply(`✅ Message sent to \`${targetJid.split('@')[0]}\`.`);
      }

    } catch (error) {
      console.error('[say] Error:', error);
      await extra.reply(`❌ Failed to send message: ${error.message}`);
    }
  },
};
