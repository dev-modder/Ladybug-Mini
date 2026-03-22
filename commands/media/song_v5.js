/**
 * Song Downloader - Download audio from YouTube
 * Ladybug Bot Mini V5
 * Made with ❤️
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
  description: 'Download audio from YouTube as audio or document',
  usage: '.song <song name or YouTube URL>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
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

      // ── Step 1: Ask user for format choice ───────────────────────────────
      const choiceMsg = await sock.sendMessage(chatId, {
        text: [
          `🎵 Found: *${video.title || 'Unknown'}*`,
          `⏱️ Duration: ${video.timestamp || 'N/A'}`,
          '',
          'How would you like to receive this song?',
          '',
          '1️⃣  *Audio* — playable voice/audio message',
          '2️⃣  *Document* — MP3 file (downloadable)',
          '',
          '_Reply with *1* or *2* within 30 seconds..._',
          '',
          '> Made with ❤️ by Ladybug Bot Mini V5'
        ].join('\n')
      }, { quoted: msg });

      // ── Step 2: Wait for user reply ───────────────────────────────────────
      let userChoice = null;

      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 30000);

        const handler = (upsert) => {
          try {
            const incoming = upsert?.messages?.[0];
            if (!incoming) return;

            const incomingChat = incoming.key.remoteJid;
            const incomingSender = incoming.key.participant || incoming.key.remoteJid;
            const body = incoming.message?.conversation
              || incoming.message?.extendedTextMessage?.text
              || '';

            // Must be same chat, same sender, and a valid reply
            if (incomingChat !== chatId) return;
            if (incomingSender !== sender) return;

            const trimmed = body.trim();
            if (trimmed === '1' || trimmed.toLowerCase() === 'audio') {
              userChoice = 'audio';
              clearTimeout(timeout);
              sock.ev.off('messages.upsert', handler);
              resolve();
            } else if (trimmed === '2' || trimmed.toLowerCase() === 'document' || trimmed.toLowerCase() === 'doc') {
              userChoice = 'document';
              clearTimeout(timeout);
              sock.ev.off('messages.upsert', handler);
              resolve();
            }
          } catch { /* ignore parse errors */ }
        };

        sock.ev.on('messages.upsert', handler);
      });

      // ── Step 3: Handle timeout ────────────────────────────────────────────
      if (!userChoice) {
        return await sock.sendMessage(chatId, {
          text: '⏰ No response received. Defaulting to *Audio* format. Run the command again to choose manually.'
        }, { quoted: msg });
        // Default to audio on timeout
        // (uncomment line below & remove return above to silently default)
        // userChoice = 'audio';
      }

      // ── Step 4: Notify downloading ────────────────────────────────────────
      const notifText = `⬇️ Downloading as *${userChoice === 'audio' ? '🎧 Audio' : '📄 Document'}*...\n🎵 *${video.title || 'Unknown'}*\n⏱️ Duration: ${video.timestamp || 'N/A'}\n\n_Please wait..._`;

      if (video.thumbnail) {
        await sock.sendMessage(chatId, {
          image: { url: video.thumbnail },
          caption: notifText
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: notifText }, { quoted: msg });
      }

      // ── Step 5: API fallback chain ────────────────────────────────────────
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
            console.log(`[Song V5] ${api.name} returned no download URL, trying next...`);
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
              console.log(`[Song V5] ${api.name} blocked (451), trying next...`);
              continue;
            }

            // Fallback to stream
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
                console.log(`[Song V5] ${api.name} stream also blocked (451), trying next...`);
              } else {
                console.log(`[Song V5] ${api.name} stream failed:`, streamErr.message);
              }
            }
          }
        } catch (apiErr) {
          console.log(`[Song V5] ${api.name} API call failed:`, apiErr.message);
        }
      }

      if (!downloadSuccess || !audioBuffer?.length) {
        throw new Error('All download sources failed. The content may be unavailable or blocked in your region.');
      }

      // ── Step 6: Detect audio format by magic bytes ────────────────────────
      const header = audioBuffer.slice(0, 12);
      const hex = header.toString('hex');
      const ascii48 = audioBuffer.toString('ascii', 4, 8);

      let ext = 'mp3';

      if (ascii48 === 'ftyp' || (hex.startsWith('000000') && audioBuffer.slice(4, 8).toString('ascii') === 'ftyp')) {
        ext = 'm4a';
      } else if (audioBuffer.toString('ascii', 0, 3) === 'ID3' || (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
        ext = 'mp3';
      } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
        ext = 'ogg';
      } else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
        ext = 'wav';
      } else {
        ext = 'm4a';
      }

      // ── Step 7: Convert to MP3 if needed ─────────────────────────────────
      let finalBuffer = audioBuffer;

      if (ext !== 'mp3') {
        try {
          finalBuffer = await toAudio(audioBuffer, ext);
          if (!finalBuffer?.length) throw new Error('Conversion returned empty buffer');
        } catch (convErr) {
          throw new Error(`Failed to convert ${ext.toUpperCase()} to MP3: ${convErr.message}`);
        }
      }

      const safeName = (audioData?.title || video?.title || 'song').replace(/[^\w\s-]/g, '').trim();

      // ── Step 8: Send based on user choice ─────────────────────────────────
      if (userChoice === 'document') {
        await sock.sendMessage(chatId, {
          document: finalBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${safeName}.mp3`
        }, { quoted: msg });
      } else {
        // audio (default)
        await sock.sendMessage(chatId, {
          audio: finalBuffer,
          mimetype: 'audio/mpeg',
          fileName: `${safeName}.mp3`,
          ptt: false
        }, { quoted: msg });
      }

      // Confirmation footer
      await sock.sendMessage(chatId, {
        text: `✅ Done! Sent as *${userChoice === 'document' ? '📄 Document' : '🎧 Audio'}*\n\n> Made with ❤️ by Ladybug Bot Mini V5`
      }, { quoted: msg });

      // ── Step 9: Cleanup old temp files ───────────────────────────────────
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
      console.error('[Song V5] Error:', err);
      const chatId = extra?.from || msg.key.remoteJid;

      let errMsg = '❌ Failed to download song.';
      if (err.message?.includes('blocked') || err.response?.status === 451 || err.status === 451) {
        errMsg = '❌ Download blocked (451). This content may be restricted in your region.';
      } else if (err.message?.includes('All download sources failed')) {
        errMsg = '❌ All download sources failed. The content may be unavailable or blocked.';
      } else if (err.message?.includes('convert')) {
        errMsg = `❌ Audio conversion failed: ${err.message}`;
      }

      await sock.sendMessage(chatId, {
        text: `${errMsg}\n\n> Made with ❤️ by Ladybug Bot Mini V5`
      }, { quoted: msg });
    }
  }
};
