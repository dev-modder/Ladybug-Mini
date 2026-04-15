/**
 * VCard Command - Send a contact card for any number (Ladybug V5.2)
 *
 * Generates a proper WhatsApp contact card (vCard) that the recipient
 * can tap to save directly to their phonebook.
 *
 * Usage:
 *   .vcard <number> <name>
 *   .vcard 263771234567 John Doe
 *   .vcard me                  — send your own contact card
 *   .vcard @mention            — send mentioned user's card (reply to their msg)
 */

'use strict';

function buildVCard(number, name) {
  // Clean number — digits only, strip leading 0
  const clean = number.replace(/[^0-9]/g, '').replace(/^0+/, '');
  const displayName = name || `+${clean}`;

  return (
    `BEGIN:VCARD\n` +
    `VERSION:3.0\n` +
    `FN:${displayName}\n` +
    `ORG:;\n` +
    `TEL;type=CELL;type=VOICE;waid=${clean}:+${clean}\n` +
    `END:VCARD`
  );
}

module.exports = {
  name: 'vcard',
  aliases: ['contact', 'contactcard', 'sendcontact', 'addcontact'],
  category: 'general',
  description: 'Send a WhatsApp contact card for any number',
  usage: '.vcard <number> <name>  |  .vcard me  |  .vcard @mention',

  async execute(sock, msg, args, extra) {
    try {
      const chatId     = extra.from;
      const senderJid  = msg.key.participant || msg.key.remoteJid;
      const sub        = args[0]?.toLowerCase();

      // ── .vcard me ─────────────────────────────────────────────────────
      if (sub === 'me') {
        const myNum  = senderJid.split('@')[0];
        const myName = msg.pushName || `+${myNum}`;
        const vcard  = buildVCard(myNum, myName);

        return await sock.sendMessage(chatId, {
          contacts: {
            displayName: myName,
            contacts: [{ vcard }],
          },
        }, { quoted: msg });
      }

      // ── .vcard @mention or reply ──────────────────────────────────────
      const mentionedJid =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.extendedTextMessage?.contextInfo?.participant || null;

      if (!args.length || (args.length === 1 && mentionedJid)) {
        if (mentionedJid) {
          const num  = mentionedJid.split('@')[0];
          const name = args[1] || `+${num}`;
          const vc   = buildVCard(num, name);
          return await sock.sendMessage(chatId, {
            contacts: { displayName: name, contacts: [{ vcard: vc }] },
          }, { quoted: msg });
        }
        return extra.reply(
          `📇 *VCard / Contact Card*\n\n` +
          `Usage:\n` +
          `• .vcard <number> <name>\n` +
          `• .vcard 263771234567 John Doe\n` +
          `• .vcard me — your own card\n` +
          `• Reply to someone's message + .vcard`
        );
      }

      // ── .vcard <number> <name> ────────────────────────────────────────
      const rawNum = args[0].replace(/[^0-9]/g, '');
      if (rawNum.length < 7) {
        return extra.reply('❌ Invalid number. Example: .vcard 263771234567 John Doe');
      }

      const name   = args.slice(1).join(' ').trim() || `+${rawNum}`;
      const vcard  = buildVCard(rawNum, name);

      await sock.sendMessage(chatId, {
        contacts: {
          displayName: name,
          contacts: [{ vcard }],
        },
      }, { quoted: msg });

    } catch (error) {
      console.error('[vcard] Error:', error);
      await extra.reply(`❌ Error sending contact card: ${error.message}`);
    }
  },
};
