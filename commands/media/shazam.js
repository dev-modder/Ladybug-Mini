/**
 * Shazam - Song Recognition from Audio/Video
 * Ladybug Bot V5
 *
 * Usage: .shazam (reply to an audio/video/voice note message)
 * Identifies the song playing in the audio using the AudD music recognition API.
 * Multi-API fallback chain for reliability.
 */

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const crypto = require('crypto');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

// ── Temp helpers ──────────────────────────────────────────────────────────────
function getTmp() {
  const dir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function rmFile(f) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }

// ── Download quoted media buffer ──────────────────────────────────────────────
async function downloadQuotedMedia(sock, msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return null;

  const audioMsg  = quoted.audioMessage || quoted.videoMessage ||
                    quoted.documentMessage || null;
  if (!audioMsg) return null;

  const stream = await sock.downloadMediaMessage({ message: quoted });
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ── API 1: AudD ───────────────────────────────────────────────────────────────
async function recognizeWithAudD(audioBuffer, apiToken) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', audioBuffer, {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg'
  });
  if (apiToken) form.append('api_token', apiToken);
  form.append('return', 'spotify,deezer,apple_music');

  const res = await axios.post('https://api.audd.io/', form, {
    headers: form.getHeaders(),
    timeout: 30000
  });
  return res.data;
}

// ── API 2: ACRCloud (free endpoint) ──────────────────────────────────────────
async function recognizeWithACR(audioBuffer) {
  const FormData = require('form-data');
  // Slice first 20s worth (helps with smaller uploads)
  const sample = audioBuffer.slice(0, Math.min(audioBuffer.length, 512 * 1024));
  const form = new FormData();
  form.append('sample', sample, {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg'
  });
  form.append('sample_bytes', sample.length.toString());

  const res = await axios.post('https://identify-eu-west-1.acrcloud.com/v1/identify', form, {
    headers: form.getHeaders(),
    timeout: 25000
  });
  return res.data;
}

// ── API 3: Siputzx shazam endpoint ───────────────────────────────────────────
async function recognizeWithSiputzx(audioUrl) {
  const res = await axios.get(
    `https://api.siputzx.my.id/api/m/shazam?url=${encodeURIComponent(audioUrl)}`,
    { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  return res.data;
}

// ── Format result ─────────────────────────────────────────────────────────────
function buildResultText(info) {
  const {
    title, artist, album, release_date,
    spotify, apple_music, deezer
  } = info;

  let text =
    `🎵 *Song Identified!*\n\n` +
    `🎤 *Title:* ${title || 'Unknown'}\n` +
    `👤 *Artist:* ${artist || 'Unknown'}\n`;

  if (album)        text += `💿 *Album:* ${album}\n`;
  if (release_date) text += `📅 *Released:* ${release_date}\n`;

  const links = [];
  if (spotify?.external_urls?.spotify)
    links.push(`🟢 [Spotify](${spotify.external_urls.spotify})`);
  if (apple_music?.url)
    links.push(`🍎 [Apple Music](${apple_music.url})`);
  if (deezer?.link)
    links.push(`💜 [Deezer](${deezer.link})`);

  if (links.length) text += `\n🔗 *Listen On:*\n${links.join('\n')}\n`;

  text += `\n${BOT_TAG}`;
  return text;
}

// ── Main export ───────────────────────────────────────────────────────────────
module.exports = {
  name: 'shazam',
  aliases: ['recognize', 'identify', 'songrec', 'whatsong'],
  category: 'media',
  description: 'Identify a song from an audio/video message',
  usage: '.shazam (reply to an audio or video message)',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
      // ── Check for quoted message ─────────────────────────────────────────
      const context = msg.message?.extendedTextMessage?.contextInfo;
      if (!context?.quotedMessage) {
        return await sock.sendMessage(chatId, {
          text:
            `🎵 *Shazam – Song Recognition*\n\n` +
            `Reply to an *audio*, *voice note*, or *video* message with *.shazam* to identify the song.\n\n` +
            `Example:\n• Reply to any audio message → *.shazam*\n\n${BOT_TAG}`
        }, { quoted: msg });
      }

      const quoted = context.quotedMessage;
      const hasMedia =
        quoted.audioMessage || quoted.videoMessage ||
        quoted.documentMessage || quoted.stickerMessage;

      if (!hasMedia) {
        return await sock.sendMessage(chatId, {
          text: `❌ Please reply to an *audio* or *video* message.\n\n${BOT_TAG}`
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '🎵', key: msg.key } });

      await sock.sendMessage(chatId, {
        text: `🔍 _Listening... identifying song. Please wait._`
      }, { quoted: msg });

      // ── Download the media ───────────────────────────────────────────────
      let audioBuffer;
      try {
        audioBuffer = await downloadQuotedMedia(sock, msg);
      } catch (e) {
        console.error('[Shazam] Media download failed:', e.message);
      }

      if (!audioBuffer || !audioBuffer.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Could not download the audio. Please try again.\n\n${BOT_TAG}`
        }, { quoted: msg });
      }

      // Save to temp file for fallback URL-based APIs
      const tmpDir  = getTmp();
      const tmpFile = path.join(tmpDir, `shazam_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.mp3`);
      fs.writeFileSync(tmpFile, audioBuffer);

      // ── Recognition chain ────────────────────────────────────────────────
      let result = null;

      // Method 1: AudD
      try {
        const auddData = await recognizeWithAudD(audioBuffer, process.env.AUDD_API_TOKEN || 'f0d1de702bfabeb577c85407827ee0f4');
        if (auddData?.status === 'success' && auddData?.result) {
          result = {
            title:        auddData.result.title,
            artist:       auddData.result.artist,
            album:        auddData.result.album,
            release_date: auddData.result.release_date,
            spotify:      auddData.result.spotify,
            apple_music:  auddData.result.apple_music,
            deezer:       auddData.result.deezer
          };
        }
      } catch (e) { console.log('[Shazam] AudD failed:', e.message); }

      // Method 2: ACRCloud public identify
      if (!result) {
        try {
          const acrData = await recognizeWithACR(audioBuffer);
          if (acrData?.status?.code === 0 && acrData?.metadata?.music?.[0]) {
            const m = acrData.metadata.music[0];
            result = {
              title:        m.title,
              artist:       m.artists?.map(a => a.name).join(', '),
              album:        m.album?.name,
              release_date: m.release_date
            };
          }
        } catch (e) { console.log('[Shazam] ACRCloud failed:', e.message); }
      }

      // Method 3: Siputzx shazam endpoint (URL-based fallback)
      if (!result) {
        try {
          // Upload the buffer to a temp host first
          const uploadForm = new (require('form-data'))();
          uploadForm.append('file', audioBuffer, {
            filename: 'audio.mp3',
            contentType: 'audio/mpeg'
          });
          const uploadRes = await axios.post('https://tmpfiles.org/api/v1/upload', uploadForm, {
            headers: uploadForm.getHeaders(),
            timeout: 20000
          });
          const audioUrl = uploadRes.data?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
          if (audioUrl) {
            const siputData = await recognizeWithSiputzx(audioUrl);
            if (siputData?.status && siputData?.result) {
              const r = siputData.result;
              result = {
                title:  r.title || r.track,
                artist: r.artist || r.subtitle
              };
            }
          }
        } catch (e) { console.log('[Shazam] Siputzx failed:', e.message); }
      }

      rmFile(tmpFile);

      // ── Send result ──────────────────────────────────────────────────────
      if (!result || !result.title) {
        return await sock.sendMessage(chatId, {
          text:
            `❌ *Song not recognized.*\n\n` +
            `Tips:\n` +
            `• Make sure the audio is clear and contains music\n` +
            `• Try a longer clip (at least 10 seconds)\n` +
            `• Avoid heavy background noise\n\n${BOT_TAG}`
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, {
        text: buildResultText(result)
      }, { quoted: msg });

    } catch (error) {
      console.error('[Shazam] Unexpected error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ An unexpected error occurred. Please try again.\n\n${BOT_TAG}`
      }, { quoted: msg });
    }
  }
};
