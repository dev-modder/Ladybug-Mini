/**
 * Pinterest Downloader & Search
 * Ladybug Bot V5
 *
 * .pinterest <URL>        — download a Pinterest image or video
 * .pins <search query>    — search Pinterest and get top images
 */

const axios  = require('axios');
const config = require('../../config');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

function isPinterestUrl(url) {
  return /https?:\/\/(?:www\.)?pinterest\.[a-z.]+\/pin\//i.test(url) ||
         /https?:\/\/pin\.it\//i.test(url);
}

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pins', 'pindl', 'pinterestdl'],
  category: 'media',
  description: 'Download Pinterest media or search Pinterest images',
  usage: '.pinterest <PIN URL>  |  .pins <search query>',

  async execute(sock, msg, args, extra) {
    const chatId  = extra?.from || msg.key.remoteJid;
    const cmdUsed = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '')
      .trim().split(' ')[0].replace(config.prefix, '').toLowerCase();
    const isSearch = cmdUsed === 'pins';

    try {
      if (!args.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Please provide a Pinterest URL or search query.\n\nExamples:\n• ${config.prefix}pinterest https://pin.it/xxxxx\n• ${config.prefix}pins aesthetic wallpaper`
        }, { quoted: msg });
      }

      const input = args.join(' ').trim();

      // ── SEARCH MODE ──────────────────────────────────────────────────────
      if (isSearch || !isPinterestUrl(input)) {
        await sock.sendMessage(chatId, { react: { text: '🔍', key: msg.key } });

        let imageUrls = [];

        // Siputzx Pinterest search
        try {
          const res = await axios.get(
            `https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(input)}`,
            { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          imageUrls = (res.data?.data || [])
            .map(i => i?.url || i?.image || (typeof i === 'string' ? i : null))
            .filter(Boolean);
        } catch (e) { console.log('[Pinterest] Siputzx search failed:', e.message); }

        // Vreden Pinterest search fallback
        if (!imageUrls.length) {
          try {
            const res = await axios.get(
              `https://api.vreden.my.id/api/pinterest?query=${encodeURIComponent(input)}`,
              { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
            imageUrls = (res.data?.result || []).map(i => i?.url).filter(Boolean);
          } catch (e) { console.log('[Pinterest] Vreden search failed:', e.message); }
        }

        if (!imageUrls.length) {
          return await sock.sendMessage(chatId, {
            text: `❌ No Pinterest results found for *"${input}"*.\n\nTry a different search term.`
          }, { quoted: msg });
        }

        const toSend = imageUrls.slice(0, 5);
        await sock.sendMessage(chatId, {
          text: `📌 Found *${imageUrls.length}* results — sending top ${toSend.length}:\n\n_"${input}"_`
        }, { quoted: msg });

        let sent = 0;
        for (const url of toSend) {
          try {
            await sock.sendMessage(chatId, {
              image: { url },
              caption: sent === 0 ? `📌 *${input}*\n${BOT_TAG}` : undefined
            }, sent === 0 ? { quoted: msg } : {});
            sent++;
          } catch (e) { console.error('[Pinterest] Send failed:', e.message); }
        }
        return;
      }

      // ── DOWNLOAD MODE ─────────────────────────────────────────────────────
      await sock.sendMessage(chatId, { react: { text: '📥', key: msg.key } });

      let mediaUrl = null;
      let isVideo  = false;

      // Siputzx Pinterest DL
      try {
        const res = await axios.get(
          `https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(input)}`,
          { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const d = res.data?.data;
        mediaUrl = d?.video || d?.url || d?.image || null;
        isVideo  = !!(d?.video);
      } catch (e) { console.log('[Pinterest DL] Siputzx failed:', e.message); }

      // Vreden DL fallback
      if (!mediaUrl) {
        try {
          const res = await axios.get(
            `https://api.vreden.my.id/api/pintdl?url=${encodeURIComponent(input)}`,
            { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          mediaUrl = res.data?.result?.url || res.data?.result?.video || null;
          isVideo  = /\.mp4/i.test(mediaUrl || '');
        } catch (e) { console.log('[Pinterest DL] Vreden failed:', e.message); }
      }

      if (!mediaUrl) {
        return await sock.sendMessage(chatId, {
          text: '❌ Could not download this Pinterest media. The pin may be private or unavailable.'
        }, { quoted: msg });
      }

      const caption = `📌 Pinterest Download\n${BOT_TAG}`;

      if (isVideo) {
        await sock.sendMessage(chatId, {
          video: { url: mediaUrl },
          mimetype: 'video/mp4',
          caption
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, {
          image: { url: mediaUrl },
          caption
        }, { quoted: msg });
      }

    } catch (err) {
      console.error('[Pinterest] Error:', err);
      await sock.sendMessage(chatId, {
        text: '❌ An error occurred. Please try again.'
      }, { quoted: msg });
    }
  }
};
