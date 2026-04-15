/**
 * SetGroupPP Command - Set a group's profile picture (owner only)
 * Ladybug V5.2
 *
 * Usage: Reply to an image then: .setgrouppp
 *        Or in a group: .setgrouppp  (sets current group's PP)
 *        Or: .setgrouppp <JID>  (sets a specific group's PP)
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

async function downloadImageBuffer(sock, msg) {
  // Check quoted image
  const context = msg.message?.extendedTextMessage?.contextInfo;
  const quoted  = context?.quotedMessage;

  const imgMsg = quoted?.imageMessage || msg.message?.imageMessage || null;
  if (!imgMsg) return null;

  const targetMsg = quoted?.imageMessage
    ? { key: { remoteJid: context.remoteJid || msg.key.remoteJid, id: context.stanzaId, fromMe: false, participant: context.participant }, message: quoted }
    : msg;

  try {
    const stream = await sock.downloadMediaMessage(targetMsg);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  } catch (_) {
    try {
      const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
      const stream2 = await downloadContentFromMessage(imgMsg, 'image');
      const c = [];
      for await (const ch of stream2) c.push(ch);
      return Buffer.concat(c);
    } catch (e2) {
      throw new Error(`Image download failed: ${e2.message}`);
    }
  }
}

module.exports = {
  name: 'setgrouppp',
  aliases: ['setgroupicon', 'grouppp', 'setgroupimage'],
  category: 'owner',
  description: "Set a group's profile picture (reply to an image)",
  usage: '.setgrouppp  (reply to an image, in a group or .setgrouppp <JID>)',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      // Determine target group JID
      let groupJid = extra.from;
      if (args[0] && args[0].includes('@g.us')) {
        groupJid = args[0].trim();
      } else if (!groupJid.endsWith('@g.us')) {
        return extra.reply(
          '❌ This command must be used in a group, or supply a group JID.\n\n' +
          'Usage: .setgrouppp  (in a group, reply to an image)'
        );
      }

      // Download the image
      const imgBuffer = await downloadImageBuffer(sock, msg).catch(() => null);

      if (!imgBuffer || imgBuffer.length < 100) {
        return extra.reply(
          '❌ *No image found.*\n\n' +
          'Please reply to an *image* message with .setgrouppp'
        );
      }

      // Set the group icon
      await sock.updateProfilePicture(groupJid, imgBuffer);
      await extra.reply(`✅ *Group profile picture updated!*`);
    } catch (error) {
      console.error('[setgrouppp] Error:', error);
      if (error.message?.includes('not-authorized') || error.message?.includes('403')) {
        return extra.reply('❌ Bot needs to be a *group admin* to change the group picture.');
      }
      await extra.reply(`❌ Failed to set group picture: ${error.message}`);
    }
  },
};
