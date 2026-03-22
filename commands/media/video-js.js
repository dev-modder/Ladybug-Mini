/**
 * YouTube Video Downloader
 * Ladybug Bot Mini V(5)
 *
 * Usage: .video <YouTube URL or search query>
 * Downloads and sends YouTube videos as MP4.
 * Multi-API fallback chain for reliability.
 */

const yts = require('yt-search');
const axios = require('axios');
const APIs = require('../../utils/api');

module.exports = {
  name: 'video',
  aliases: ['ytdl', 'ytv', 'yt'],
  category: 'media',
  description: 'Download a YouTube video',
  usage: '.video <YouTube URL or search query>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;
      const text = args.join(' ').trim();

      if (!text) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide a YouTube URL or search query.\n\nExample: .video Bohemian Rhapsody'
        }, { quoted: msg });
      }

      // Resolve video info
      let video;

      if (text.includes('youtube.com') || text.includes('youtu.be')) {
        // Direct URL - fetch basic info via yts
        try {
          const result = await yts({ videoId: extractYouTubeId(text) });
          video = result || { url: text, title: 'YouTube Video', thumbnail: null, timestamp: 'N/A' };
        } catch {
          video = { url: text, title: 'YouTube Video', thumbnail: null, timestamp: 'N/A' };
        }
        video.url = text; // always keep the original URL
      } else {
        // Search query
        const search = await yts(text);
        if (!search?.videos?.length) {
          return await sock.sendMessage(chatId, {
            text: '❌ No YouTube results found. Try a different search term.'
          }, { quoted: msg });
        }
        video = search.videos[0];
      }

      // Notify user
      const notifText = `🎬 Downloading: *${video.title || 'Unknown'}*\n⏱️ Duration: ${video.timestamp || 'N/A'}\n\n_Please wait..._`;
      if (video.thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: video.thumbnail },
          caption: notifText
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: notifText }, { quoted: msg });
      }

      // Multi-API fallback chain for video download
      const apiMethods = [
        { name: 'EliteProTech', fn: () => APIs.getEliteProTechVideoByUrl(video.url) },
        { name: 'Yupra',        fn: () => APIs.getYupraVideoByUrl(video.url) },
        { name: 'Okatsu',       fn: () => APIs.getOkatsuVideoByUrl(video.url) },
        { name: 'Izumi',        fn: () => APIs.getIzumiVideoByUrl(video.url) }
      ];

      let videoUrl = null;
      let videoBuffer = null;

      for (const api of apiMethods) {
        try {
          const data = await api.fn();
          const url = data?.download || data?.dl || data?.url || data?.video || null;
          if (!url) {
            console.log(`[Video] ${api.name} returned no URL, trying next...`);
            continue;
          }

          // Try to download the video file
          try {
            const res = await axios.get(url, {
              responseType: 'arraybuffer',
              timeout: 120000,
              maxContentLength: 200 * 1024 * 1024, // 200 MB
              maxBodyLength: 200 * 1024 * 1024,
              validateStatus: s => s >= 200 && s < 400,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'video/mp4,video/*,*/*;q=0.9',
                'Accept-Encoding': 'identity'
              }
            });

            videoBuffer = Buffer.from(res.data);
            if (videoBuffer?.length > 0) {
              console.log(`[Video] ${api.name} succeeded (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
              break;
            }
          } catch (dlErr) {
            if (dlErr.response?.status === 451) {
              console.log(`[Video] ${api.name} blocked (451), trying next...`);
              continue;
            }
            // Keep URL for fallback send-by-url
            videoUrl = url;
            console.log(`[Video] ${api.name} buffer download failed, will try URL send: ${dlErr.message}`);
            break;
          }
        } catch (apiErr) {
          console.log(`[Video] ${api.name} API call failed:`, apiErr.message);
        }
      }

      // Fallback: try Siputzx API directly
      if (!videoBuffer && !videoUrl) {
        try {
          const res = await axios.get(`https://api.siputzx.my.id/api/d/yt?url=${encodeURIComponent(video.url)}`, {
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          videoUrl = res.data?.data?.video || res.data?.data?.url || null;
        } catch (e) {
          console.log('[Video] Siputzx direct API failed:', e.message);
        }
      }

      if (!videoBuffer && !videoUrl) {
        return await sock.sendMessage(chatId, {
          text: '❌ Failed to download this video. It may be too long, region-locked, or unavailable. Try a shorter video.'
        }, { quoted: msg });
      }

      const caption = `*🐞 LADYBUG BOT MINI V2*\n\n🎬 ${video.title || 'YouTube Video'}\n⏱️ ${video.timestamp || 'N/A'}`;

      // Send as buffer (preferred) or by URL
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
      console.error('[Video] Command error:', error);
      const chatId = extra?.from || msg.key.remoteJid;

      let errMsg = '❌ Failed to download video.';
      if (error.message?.includes('blocked') || error.response?.status === 451) {
        errMsg = '❌ Download blocked (451). This video may be region-restricted.';
      } else if (error.message?.includes('timeout')) {
        errMsg = '❌ Request timed out. The video may be too large or the server is slow.';
      }

      await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg });
    }
  }
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function extractYouTubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    return parsed.searchParams.get('v') || '';
  } catch {
    return '';
  }
}
