/**
 * Song Downloader - Download audio from YouTube
 * Ladybug Bot Mini V2
 */

const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const APIs = require('../../utils/api');
const { toAudio } = require('../../utils/converter');

module.exports = {
  name: 'song',
  aliases: ['play', 'music', 'yta'],
  category: 'media',
  description: 'Download audio from YouTube',
  usage: '.song <song name or YouTube URL>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;
      const text = args.join(' ').trim();

      if (!text) {
        return await sock.sendMessage(chatId, {
          text: '❌ Please provide a song name or YouTube link.\n\nExample: .song Shape of You'
        }, { quoted: msg });
      }

      let video;

      if (text.includes('youtube.com') || text.includes('youtu.be')) {
        video = { url: text, title: 'YouTube Audio', thumbnail: null, timestamp: 'N/A' };
      } else {
        const search = await yts(text);
        if (!search?.videos?.length) {
          return await sock.sendMessage(chatId, {
            text: '❌ No results found for that query. Try a different search term.'
          }, { quoted: msg });
        }
        video = search.videos[0];
      }

      // Notify user
      const notifMsg = {
        caption: `🎵 Downloading: *${video.title || 'Unknown'}*\n⏱️ Duration: ${video.timestamp || 'N/A'}\n\n_Please wait..._`
      };
      if (video.thumbnail) {
        notifMsg.image = { url: video.thumbnail };
      }

      if (video.thumbnail) {
        await sock.sendMessage(chatId, notifMsg, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: `🎵 Downloading: *${video.title || 'Unknown'}*\n⏱️ Duration: ${video.timestamp || 'N/A'}\n\n_Please wait..._` }, { quoted: msg });
      }

      // Ordered API fallback chain
      const apiMethods = [
        { name: 'EliteProTech', fn: () => APIs.getEliteProTechDownloadByUrl(video.url) },
        { name: 'Yupra',        fn: () => APIs.getYupraDownloadByUrl(video.url) },
        { name: 'Okatsu',       fn: () => APIs.getOkatsuDownloadByUrl(video.url) },
        { name: 'Izumi',        fn: () => APIs.getIzumiDownloadByUrl(video.url) }
      ];

      let audioData = null;
      let audioBuffer = null;
      let downloadSuccess = false;

      for (const api of apiMethods) {
        try {
          audioData = await api.fn();
          const audioUrl = audioData?.download || audioData?.dl || audioData?.url;

          if (!audioUrl) {
            console.log(`[Song] ${api.name} returned no download URL, trying next...`);
            continue;
          }

          // Try arraybuffer first
          try {
            const res = await axios.get(audioUrl, {
              responseType: 'arraybuffer',
              timeout: 90000,
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              decompress: true,
              validateStatus: s => s >= 200 && s < 400,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'identity'
              }
            });
            audioBuffer = Buffer.from(res.data);
            if (audioBuffer?.length > 0) {
              downloadSuccess = true;
              break;
            }
          } catch (downloadErr) {
            const statusCode = downloadErr.response?.status;
            if (statusCode === 451) {
              console.log(`[Song] ${api.name} blocked (451), trying next...`);
              continue;
            }

            // Try stream as fallback
            try {
              const res = await axios.get(audioUrl, {
                responseType: 'stream',
                timeout: 90000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                validateStatus: s => s >= 200 && s < 400,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': '*/*',
                  'Accept-Encoding': 'identity'
                }
              });
              const chunks = [];
              await new Promise((resolve, reject) => {
                res.data.on('data', c => chunks.push(c));
                res.data.on('end', resolve);
                res.data.on('error', reject);
              });
              audioBuffer = Buffer.concat(chunks);
              if (audioBuffer?.length > 0) {
                downloadSuccess = true;
                break;
              }
            } catch (streamErr) {
              if (streamErr.response?.status === 451) {
                console.log(`[Song] ${api.name} stream also blocked (451), trying next...`);
              } else {
                console.log(`[Song] ${api.name} stream failed:`, streamErr.message);
              }
            }
          }
        } catch (apiErr) {
          console.log(`[Song] ${api.name} API call failed:`, apiErr.message);
        }
      }

      if (!downloadSuccess || !audioBuffer?.length) {
        throw new Error('All download sources failed. The content may be unavailable or blocked in your region.');
      }

      // Detect audio format by magic bytes
      const header = audioBuffer.slice(0, 12);
      const hex = header.toString('hex');
      const ascii48 = audioBuffer.toString('ascii', 4, 8);

      let mimetype = 'audio/mpeg';
      let ext = 'mp3';

      if (ascii48 === 'ftyp' || (hex.startsWith('000000') && audioBuffer.slice(4, 8).toString('ascii') === 'ftyp')) {
        mimetype = 'audio/mp4'; ext = 'm4a';
      } else if (audioBuffer.toString('ascii', 0, 3) === 'ID3' || (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
        mimetype = 'audio/mpeg'; ext = 'mp3';
      } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
        mimetype = 'audio/ogg; codecs=opus'; ext = 'ogg';
      } else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
        mimetype = 'audio/wav'; ext = 'wav';
      } else {
        // Default to M4A
        mimetype = 'audio/mp4'; ext = 'm4a';
      }

      // Convert to MP3 if not already
      let finalBuffer = audioBuffer;
      let finalMimetype = 'audio/mpeg';
      let finalExt = 'mp3';

      if (ext !== 'mp3') {
        try {
          finalBuffer = await toAudio(audioBuffer, ext);
          if (!finalBuffer?.length) throw new Error('Conversion returned empty buffer');
        } catch (convErr) {
          throw new Error(`Failed to convert ${ext.toUpperCase()} to MP3: ${convErr.message}`);
        }
      }

      const safeName = (audioData?.title || video?.title || 'song').replace(/[^\w\s-]/g, '');

      await sock.sendMessage(chatId, {
        audio: finalBuffer,
        mimetype: finalMimetype,
        fileName: `${safeName}.${finalExt}`,
        ptt: false
      }, { quoted: msg });

      // Cleanup old temp files
      try {
        const tempDir = path.join(__dirname, '../../temp');
        if (fs.existsSync(tempDir)) {
          const now = Date.now();
          fs.readdirSync(tempDir).forEach(file => {
            const filePath = path.join(tempDir, file);
            try {
              const stats = fs.statSync(filePath);
              if (now - stats.mtimeMs > 10000 && /^\d+\.(mp3|m4a)$/.test(file)) {
                fs.unlinkSync(filePath);
              }
            } catch { /* ignore */ }
          });
        }
      } catch { /* ignore cleanup errors */ }

    } catch (err) {
      console.error('[Song] Error:', err);
      const chatId = extra?.from || msg.key.remoteJid;

      let errMsg = '❌ Failed to download song.';
      if (err.message?.includes('blocked') || err.response?.status === 451 || err.status === 451) {
        errMsg = '❌ Download blocked (451). This content may be restricted in your region.';
      } else if (err.message?.includes('All download sources failed')) {
        errMsg = '❌ All download sources failed. The content may be unavailable or blocked.';
      }

      await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg });
    }
  }
};
