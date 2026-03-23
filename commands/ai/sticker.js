/**
 * Sticker Command - Convert image/video to WhatsApp sticker
 * Ladybug V5
 *
 * Reply to an image, video (short), or GIF to convert it to a sticker.
 * Optionally set a sticker pack name and author.
 *
 * Usage:
 *   .sticker                 — convert replied image to sticker
 *   .sticker <pack> | <author>   — with custom pack & author name
 *   .sticker crop            — crop to square before converting
 *
 * Requires: sharp, @whiskeysockets/baileys
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp  = require('sharp');
const config = require('../../config');

module.exports = {
  name: 'sticker',
  aliases: ['s', 'stiker', 'togif', 'makesticker'],
  category: 'ai',
  description: 'Convert image or video to WhatsApp sticker',
  usage: '.sticker  OR  .sticker <pack> | <author>  (reply to image/video)',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;

      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      if (!ctx?.quotedMessage) {
        return extra.reply(
          `🖼️ *Sticker Maker*\n\n` +
          `Reply to an *image* or short *video/GIF* with .sticker\n\n` +
          `Options:\n` +
          `  .sticker                    — default names\n` +
          `  .sticker MyPack | @MyName   — custom pack & author\n` +
          `  .sticker crop               — crop to square first`
        );
      }

      const quoted    = ctx.quotedMessage;
      const isImage   = !!quoted.imageMessage;
      const isSticker = !!quoted.stickerMessage;
      const isVideo   = !!quoted.videoMessage;

      if (!isImage && !isSticker && !isVideo) {
        return extra.reply('❌ Please reply to an *image*, *sticker*, or *short video*!');
      }

      // Parse pack / author from args
      const fullArgs = args.join(' ');
      let packName   = config.botName || 'Ladybug V5';
      let authorName = config.ownerName || 'Ladybug';
      const crop     = fullArgs.toLowerCase().includes('crop');

      if (fullArgs.includes('|')) {
        const [p, a] = fullArgs.split('|').map(s => s.replace('crop', '').trim());
        if (p) packName   = p;
        if (a) authorName = a;
      }

      await extra.reply('⚙️ Converting to sticker...');

      const targetMsg = {
        key: {
          remoteJid: chatId,
          id: ctx.stanzaId,
          participant: ctx.participant,
        },
        message: quoted,
      };

      // Download media
      const mediaBuffer = await downloadMediaMessage(
        targetMsg,
        'buffer',
        {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      );

      if (!mediaBuffer || mediaBuffer.length === 0) {
        return extra.reply('❌ Failed to download media. Please try again.');
      }

      // Handle video/GIF stickers — send directly (Baileys handles webp conversion internally)
      if (isVideo) {
        await sock.sendMessage(chatId, {
          sticker: mediaBuffer,
          packname: packName,
          author: authorName,
        }, { quoted: msg });
        return;
      }

      // Handle image / existing sticker
      let imgBuffer = mediaBuffer;

      // Convert webp sticker back to PNG first if needed
      if (isSticker) {
        try {
          imgBuffer = await sharp(mediaBuffer).png().toBuffer();
        } catch (_) {}
      }

      // Process with sharp: resize to 512x512 WebP
      let sharpInst = sharp(imgBuffer);
      if (crop) {
        sharpInst = sharpInst.resize(512, 512, { fit: 'cover', position: 'center' });
      } else {
        sharpInst = sharpInst.resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
      }

      const webpBuffer = await sharpInst.webp({ quality: 90 }).toBuffer();

      await sock.sendMessage(chatId, {
        sticker: webpBuffer,
        packname: packName,
        author:   authorName,
      }, { quoted: msg });

    } catch (error) {
      console.error('[sticker] Error:', error);
      await extra.reply(`❌ Sticker creation failed: ${error.message}`);
    }
  },
};
