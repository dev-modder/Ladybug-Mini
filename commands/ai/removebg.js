/**
 * RemoveBG Command - Remove image background using free AI API
 * Ladybug V5
 *
 * Uses remove.bg free tier (50 previews/month) OR the free
 * photoroom/erase.bg fallback via siputzx free API.
 *
 * Usage:
 *   .removebg  (reply to an image or sticker)
 *
 * Optional config: set REMOVEBG_API_KEY in your .env or config for full resolution.
 */

const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

module.exports = {
  name: 'removebg',
  aliases: ['rmbg', 'nobg', 'bgremove', 'cutout'],
  category: 'ai',
  description: 'Remove the background from an image using AI',
  usage: '.removebg  (reply to an image)',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;
      const ctx    = msg.message?.extendedTextMessage?.contextInfo;

      if (!ctx?.quotedMessage) {
        return extra.reply(
          `✂️ *Background Remover*\n\n` +
          `Reply to an *image* or *sticker* with .removebg\n\n` +
          `The AI will automatically remove the background and return a transparent PNG.`
        );
      }

      const quoted  = ctx.quotedMessage;
      const isImage = !!quoted.imageMessage;
      const isSticker = !!quoted.stickerMessage;

      if (!isImage && !isSticker) {
        return extra.reply('❌ Please reply to an *image* or *sticker*!');
      }

      await extra.reply('✂️ Removing background... this may take a few seconds.');

      const targetMsg = {
        key: { remoteJid: chatId, id: ctx.stanzaId, participant: ctx.participant },
        message: quoted,
      };

      // Download
      const mediaBuffer = await downloadMediaMessage(
        targetMsg, 'buffer', {},
        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
      );

      if (!mediaBuffer || mediaBuffer.length === 0) {
        return extra.reply('❌ Failed to download image. Please try again.');
      }

      // Convert webp → jpg for API
      let imageBuffer = mediaBuffer;
      try {
        const meta = await sharp(mediaBuffer).metadata();
        if (meta.format === 'webp' || isSticker) {
          imageBuffer = await sharp(mediaBuffer).jpeg({ quality: 95 }).toBuffer();
        }
      } catch (_) {}

      // Try remove.bg API (free tier — 50 calls/month preview, no key = 0.25MP preview)
      let resultBuffer = null;
      const config = (() => { try { return require('../../config'); } catch (_) { return {}; } })();
      const apiKey = config.removeBgApiKey || process.env.REMOVEBG_API_KEY || '';

      // Method 1: remove.bg
      try {
        const form = new FormData();
        form.append('image_file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        form.append('size', apiKey ? 'full' : 'preview');

        const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
          headers: {
            ...form.getHeaders(),
            ...(apiKey ? { 'X-Api-Key': apiKey } : { 'X-Api-Key': 'GokZze5TS6iNRXEm8dTk3fqN' }),
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        });

        if (res.data && res.data.byteLength > 1000) {
          resultBuffer = Buffer.from(res.data);
        }
      } catch (e) {
        console.warn('[removebg] remove.bg failed, trying fallback...', e.message);
      }

      // Method 2: siputzx free API fallback
      if (!resultBuffer) {
        try {
          const form2 = new FormData();
          form2.append('file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

          const res2 = await axios.post('https://api.siputzx.my.id/api/tools/removebg', form2, {
            headers: form2.getHeaders(),
            responseType: 'arraybuffer',
            timeout: 30000,
          });

          if (res2.data && res2.data.byteLength > 1000) {
            resultBuffer = Buffer.from(res2.data);
          }
        } catch (e2) {
          console.warn('[removebg] siputzx fallback failed:', e2.message);
        }
      }

      if (!resultBuffer) {
        return extra.reply(
          `❌ Background removal failed.\n\n` +
          `Both APIs are unavailable right now. Please try again later.\n` +
          `For unlimited use, add a remove.bg API key to your config.`
        );
      }

      await sock.sendMessage(chatId, {
        image: resultBuffer,
        caption:
          `✂️ *Background Removed!*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          (apiKey ? `✅ Full resolution\n` : `ℹ️ Preview quality (0.25MP)\nSet \`removeBgApiKey\` in config for full res\n`) +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_Powered by remove.bg AI_`,
      }, { quoted: msg });

    } catch (error) {
      console.error('[removebg] Error:', error);
      await extra.reply(`❌ Failed: ${error.message}`);
    }
  },
};
