/**
 * YouTube Video Downloader
 * Ladybug Bot V5
 *
 * Usage: .video <YouTube URL or search query>
 * Also handles YouTube Shorts.
 * Multi-API fallback chain for reliability.
 */

const yts  = require('yt-search');
const axios = require('axios');
const APIs  = require('../../utils/api');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

module.exports = {
  name: 'video',
  aliases: ['ytdl', 'ytv', 'yt', 'shorts'],
  category: 'media',
  description: 'Download a YouTube video or Short',
  usage: '.video <YouTube URL or search query>',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
      const text = args.join(' ').trim();

      if (!text) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide a YouTube URL or search query.\n\nExamples:\n• .video Bohemian Rhapsody\n• .video https://youtu.be/xxxxx\n• .video https://youtube.com/shorts/xxxxx'
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '🎬', key: msg.key } });

      // ── Resolve video info ────────────────────────────────────────────────
      let video;
      const isUrl    = text.includes('youtube.com') || text.includes('youtu.be');
      const isShorts = text.includes('/shorts/');

      if (isUrl) {
        try {
          const vid = extractYouTubeId(text);
          const result = vid ? await yts({ videoId: vid }) : null;
          video = result || { url: text, title: isShorts ? 'YouTube Short' : 'YouTube Video', thumbnail: null, timestamp: 'N/A' };
        } catch {
          video = { url: text, title: 'YouTube Video', thumbnail: null, timestamp: 'N/A' };
        }
        video.url = text;
      } else {
        const search = await yts(text);
        if (!search?.videos?.length) {
          return await sock.sendMessage(chatId, {
            text: `❌ No results found for: *${text}*\n\nTry a different search term.`
          }, { quoted: msg });
        }
        video = search.videos[0];
      }

      // ── Notify user ───────────────────────────────────────────────────────
      const typeLabel = isShorts ? '⚡ YouTube Short' : '🎬 YouTube Video';
      const notifText = `${typeLabel}: *${video.title || 'Unknown'}*\n⏱️ ${video.timestamp || 'N/A'}\n\n_Downloading... please wait_`;

      if (video.thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: video.thumbnail },
          caption: notifText
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: notifText }, { quoted: msg });
      }

      // ── Multi-API fallback chain ──────────────────────────────────────────
      const apiMethods = [
        { name: 'EliteProTech', fn: () => APIs.getEliteProTechVideoByUrl(video.url) },
        { name: 'Yupra',        fn: () => APIs.getYupraVideoByUrl(video.url) },
        { name: 'Okatsu',       fn: () => APIs.getOkatsuVideoByUrl(video.url) },
        { name: 'Izumi',        fn: () => APIs.getIzumiVideoByUrl(video.url) }
      ];

      let videoUrl    = null;
      let videoBuffer = null;

      for (const api of apiMethods) {
        try {
          const data = await api.fn();
          const url  = data?.download || data?.dl || data?.url || data?.video || null;
          if (!url) { console.log(`[Video] ${api.name}: no URL`); continue; }

          try {
            const res = await axios.get(url, {
              responseType: 'arraybuffer',
              timeout: 120000,
              maxContentLength: 200 * 1024 * 1024,
              maxBodyLength: 200 * 1024 * 1024,
              validateStatus: s => s >= 200 && s < 400,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'video/mp4,video/*,*/*;q=0.9',
                'Accept-Encoding': 'identity'
              }
            });
            videoBuffer = Buffer.from(res.data);
            if (videoBuffer?.length > 0) {
              console.log(`[Video] ${api.name} OK (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
              break;
            }
          } catch (dlErr) {
            if (dlErr.response?.status === 451) { console.log(`[Video] ${api.name} blocked 451`); continue; }
            videoUrl = url;
            break;
          }
        } catch (apiErr) {
          console.log(`[Video] ${api.name} API error:`, apiErr.message);
        }
      }

      // ── Siputzx direct fallback ──────────────────────────────────────────
      if (!videoBuffer && !videoUrl) {
        try {
          const res = await axios.get(
            `https://api.siputzx.my.id/api/d/yt?url=${encodeURIComponent(video.url)}`,
            { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          videoUrl = res.data?.data?.video || res.data?.data?.url || null;
        } catch (e) {
          console.log('[Video] Siputzx direct failed:', e.message);
        }
      }

      if (!videoBuffer && !videoUrl) {
        return await sock.sendMessage(chatId, {
          text: '❌ Could not download this video. It may be:\n• Too long or large\n• Region-locked\n• Age-restricted\n\nTry a different video or a shorter clip.'
        }, { quoted: msg });
      }

      const caption = `${BOT_TAG}\n\n🎬 ${video.title || 'YouTube Video'}\n⏱️ ${video.timestamp || 'N/A'}`;

      if (videoBuffer) {
        await sock.sendMessage(chatId, {
          video: videoBuffer,
          mimetype: 'video/mp4',
          caption
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, {
          video: { url: videoUrl },
          mimetype: 'video/mp4',
          caption
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('[Video] Error:', error);
      let errMsg = '❌ Failed to download video.';
      if (error.response?.status === 451 || error.message?.includes('blocked'))
        errMsg = '❌ Download blocked (451). This video may be region-restricted.';
      else if (error.message?.includes('timeout'))
        errMsg = '❌ Request timed out. The video may be too large or the server is slow.';
      await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg });
    }
  }
};

function extractYouTubeId(url) {
  try {
    const p = new URL(url);
    if (p.hostname.includes('youtu.be'))    return p.pathname.slice(1);
    if (p.pathname.includes('/shorts/'))    return p.pathname.split('/shorts/')[1]?.split('?')[0] || '';
    return p.searchParams.get('v') || '';
  } catch { return ''; }
}
