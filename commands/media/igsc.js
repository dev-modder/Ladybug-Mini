/**
 * Instagram to Sticker Cropped Command
 * igsc - Convert Instagram media to cropped square sticker
 * Ladybug Bot Mini V2
 *
 * Shares the same core logic as igs.js — only difference is crop=true.
 * All shared helpers are defined here for self-contained operation.
 */

const { igdl } = require('ruhend-scraper');
const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');
const config = require('../../config');
const { getTempDir, deleteTempFile } = require('../../utils/tempManager');

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractInstagramUrl(proxyUrl) {
  try {
    const urlObj = new URL(proxyUrl);
    const token = urlObj.searchParams.get('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64'
    ).toString());
    if (payload.url?.startsWith('http')) return payload.url;
  } catch { /* fall through */ }
  return null;
}

function pickMediaUrl(media) {
  if (!media) return null;
  const candidates = [
    media.downloadUrl, media.url, media.original,
    media.mediaUrl, media.videoUrl, media.imageUrl, media.urls?.[0]
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.startsWith('http')) {
      if (c.includes('rapidcdn.app') && c.includes('token=')) {
        const direct = extractInstagramUrl(c);
        if (direct) return direct;
      }
      return c;
    }
  }
  return null;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const STICKER_LIMIT = 950 * 1024;

function execAsync(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error) => (error ? reject(error) : resolve()));
  });
}

function buildStickerExif(packname) {
  const json = {
    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
    'sticker-pack-name': packname || 'Ladybug Bot Mini V2',
    'emojis': ['📸']
  };
  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);
  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  const exif = Buffer.concat([exifAttr, jsonBuf]);
  exif.writeUIntLE(jsonBuf.length, 14, 4);
  return exif;
}

async function attachExifAndSave(webpBuffer) {
  const img = new webp.Image();
  await img.load(webpBuffer);
  img.exif = buildStickerExif(config.packname);
  return img.save(null);
}

async function convertBufferToStickerWebp(inputBuffer, isAnimated, cropSquare) {
  if (inputBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(inputBuffer.length / 1024 / 1024).toFixed(2)} MB (max 50 MB)`);
  }

  const tmpDir = getTempDir();
  const base = `igsc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const tempInput  = path.join(tmpDir, `${base}.${isAnimated ? 'mp4' : 'jpg'}`);
  const tempOutput = path.join(tmpDir, `${base}_out.webp`);
  const tempFiles  = [tempInput, tempOutput];

  try {
    fs.writeFileSync(tempInput, inputBuffer);

    const vfCrop = 'crop=min(iw\\,ih):min(iw\\,ih),scale=512:512';
    const vfPad  = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000';

    let ffCmd;
    if (isAnimated) {
      const vf = cropSquare ? `${vfCrop},fps=6` : `${vfPad},fps=6`;
      ffCmd = `ffmpeg -y -i "${tempInput}" -t 2 -vf "${vf}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 25 -compression_level 6 -b:v 60k -max_muxing_queue_size 1024 "${tempOutput}"`;
    } else {
      const vf = `${cropSquare ? vfCrop : vfPad},format=rgba`;
      ffCmd = `ffmpeg -y -i "${tempInput}" -vf "${vf}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 60 -compression_level 6 "${tempOutput}"`;
    }

    await execAsync(ffCmd);
    let webpBuffer = fs.readFileSync(tempOutput);

    let attempt = 0;
    const maxAttempts = 8;
    while (webpBuffer.length > STICKER_LIMIT && attempt < maxAttempts) {
      attempt++;
      const outN = path.join(tmpDir, `${base}_out${attempt}.webp`);
      tempFiles.push(outN);

      let hCmd;
      if (isAnimated) {
        const fps      = Math.max(3, 6 - attempt);
        const quality  = Math.max(10, 25 - attempt * 3);
        const bitrate  = Math.max(30, 60 - attempt * 5);
        const duration = Math.max(0.5, 2 - attempt * 0.25);
        const size     = attempt <= 2 ? 512 : attempt <= 4 ? 400 : attempt <= 6 ? 320 : 256;
        const vf       = cropSquare
          ? `crop=min(iw\\,ih):min(iw\\,ih),scale=${size}:${size},fps=${fps}`
          : `scale=${size}:${size}:force_original_aspect_ratio=decrease,pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=${fps}`;
        hCmd = `ffmpeg -y -i "${tempInput}" -t ${duration} -vf "${vf}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality ${quality} -compression_level 6 -b:v ${bitrate}k -max_muxing_queue_size 1024 "${outN}"`;
      } else {
        const quality = Math.max(30, 60 - attempt * 5);
        const size    = [512, 400, 320, 256, 200][Math.min(attempt - 1, 4)];
        const vf      = cropSquare
          ? `crop=min(iw\\,ih):min(iw\\,ih),scale=${size}:${size},format=rgba`
          : `scale=${size}:${size}:force_original_aspect_ratio=decrease,pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=#00000000,format=rgba`;
        hCmd = `ffmpeg -y -i "${tempInput}" -vf "${vf}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality ${quality} -compression_level 6 "${outN}"`;
      }

      try {
        await execAsync(hCmd);
        if (fs.existsSync(outN)) webpBuffer = fs.readFileSync(outN);
      } catch { /* keep trying */ }
    }

    let finalBuffer = await attachExifAndSave(webpBuffer);

    if (finalBuffer.length > STICKER_LIMIT) {
      for (const size of [256, 200, 180, 160, 128]) {
        const outM = path.join(tmpDir, `${base}_mini${size}.webp`);
        tempFiles.push(outM);
        const vf = cropSquare
          ? `crop=min(iw\\,ih):min(iw\\,ih),scale=${size}:${size}${isAnimated ? ',fps=3' : ''}`
          : `scale=${size}:${size}:force_original_aspect_ratio=decrease,pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=#00000000${isAnimated ? ',fps=3' : ''}`;
        const cmdM = `ffmpeg -y -i "${tempInput}" ${isAnimated ? '-t 0.5' : ''} -vf "${vf}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality ${isAnimated ? 15 : 30} -compression_level 6 -b:v 30k -max_muxing_queue_size 1024 "${outM}"`;
        try {
          await execAsync(cmdM);
          if (fs.existsSync(outM)) {
            const candidate = await attachExifAndSave(fs.readFileSync(outM));
            if (candidate.length <= STICKER_LIMIT) { finalBuffer = candidate; break; }
          }
        } catch { /* keep trying */ }
      }
    }

    return finalBuffer;
  } finally {
    tempFiles.forEach(f => deleteTempFile(f));
  }
}

async function fetchBufferFromUrl(url) {
  const MAX_RETRIES = 3;
  const standardHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  const igHeaders = {
    ...standardHeaders,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.instagram.com/',
    'Origin': 'https://www.instagram.com',
    'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8'
  };

  function isHtml(buf) {
    if (!buf?.length) return false;
    const s = buf.toString('utf8', 0, 100).toLowerCase().trim();
    return s.startsWith('<!doctype html') || s.startsWith('<html');
  }

  function validContentType(ct) {
    if (!ct) return true;
    const c = ct.toLowerCase();
    return c.startsWith('image/') || c.startsWith('video/') || c === 'application/octet-stream';
  }

  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const headers = attempt === 0 ? standardHeaders : igHeaders;
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers,
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        decompress: true,
        maxRedirects: 5,
        validateStatus: s => s >= 200 && s < 300
      });
      const buffer = Buffer.from(res.data);
      if (!validContentType(res.headers['content-type'])) {
        throw new Error(`Invalid content-type: ${res.headers['content-type']}`);
      }
      if (isHtml(buffer)) throw new Error('Response is HTML (blocked/login required)');
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES - 1) {
        try {
          const res = await axios.get(url, {
            responseType: 'stream',
            headers: igHeaders,
            timeout: 40000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            maxRedirects: 5,
            validateStatus: s => s >= 200 && s < 300
          });
          const chunks = [];
          await new Promise((resolve, reject) => {
            res.data.on('data', c => chunks.push(c));
            res.data.on('end', resolve);
            res.data.on('error', reject);
          });
          const buffer = Buffer.concat(chunks);
          if (!validContentType(res.headers['content-type'])) {
            throw new Error(`Invalid content-type (stream): ${res.headers['content-type']}`);
          }
          if (isHtml(buffer)) throw new Error('Stream response is HTML');
          return buffer;
        } catch (streamErr) {
          throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
        }
      }
      await new Promise(r => setTimeout(r, (attempt + 1) * 500));
    }
  }
  throw new Error(`Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

async function forceMiniSticker(inputBuffer, isVideo, cropSquare) {
  const tmpDir = getTempDir();
  const tempFiles = [];
  try {
    for (const size of [256, 200, 180, 160]) {
      const base = `mini_${size}_${Date.now()}`;
      const tempInput  = path.join(tmpDir, `${base}.${isVideo ? 'mp4' : 'jpg'}`);
      const tempOutput = path.join(tmpDir, `${base}_out.webp`);
      tempFiles.push(tempInput, tempOutput);
      try {
        fs.writeFileSync(tempInput, inputBuffer);
        const vf = cropSquare
          ? `crop=min(iw\\,ih):min(iw\\,ih),scale=${size}:${size}${isVideo ? ',fps=3' : ''}`
          : `scale=${size}:${size}:force_original_aspect_ratio=decrease,pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=#00000000${isVideo ? ',fps=3' : ''}`;
        const cmd = `ffmpeg -y -i "${tempInput}" ${isVideo ? '-t 0.5' : ''} -vf "${vf}" -c:v libwebp -preset default -loop 0 -pix_fmt yuva420p -quality ${isVideo ? 15 : 30} -compression_level 6 -b:v 30k "${tempOutput}"`;
        await execAsync(cmd);
        if (fs.existsSync(tempOutput)) {
          const buf = fs.readFileSync(tempOutput);
          if (buf.length <= STICKER_LIMIT) return await attachExifAndSave(buf);
        }
      } catch { /* try next size */ }
    }
    return null;
  } finally {
    tempFiles.forEach(f => deleteTempFile(f));
  }
}

async function ultraCompressSticker(inputBuffer, isVideo, cropSquare, itemIndex) {
  const tmpDir = getTempDir();
  const tempInput  = path.join(tmpDir, `ultra_${Date.now()}_${itemIndex}.${isVideo ? 'mp4' : 'jpg'}`);
  const tempOutput = path.join(tmpDir, `ultra_out_${Date.now()}_${itemIndex}.webp`);
  const tempFiles  = [tempInput, tempOutput];
  try {
    fs.writeFileSync(tempInput, inputBuffer);
    const size = 180;
    const vf   = cropSquare
      ? `crop=min(iw\\,ih):min(iw\\,ih),scale=${size}:${size}${isVideo ? ',fps=3' : ''}`
      : `scale=${size}:${size}:force_original_aspect_ratio=decrease,pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=#00000000${isVideo ? ',fps=3' : ''}`;
    const cmd  = `ffmpeg -y -i "${tempInput}" ${isVideo ? '-t 0.5' : ''} -vf "${vf}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality ${isVideo ? 12 : 25} -compression_level 6 -b:v 25k -max_muxing_queue_size 1024 "${tempOutput}"`;
    await execAsync(cmd);
    if (fs.existsSync(tempOutput)) return await attachExifAndSave(fs.readFileSync(tempOutput));
    return null;
  } catch {
    return null;
  } finally {
    tempFiles.forEach(f => deleteTempFile(f));
  }
}

// ─── Core logic ───────────────────────────────────────────────────────────────

async function igsCommand(sock, msg, args, extra, crop = false) {
  const chatId = extra?.from || msg.key.remoteJid;

  try {
    const text = msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      args.join(' ');

    const urlMatch = text.match(/https?:\/\/\S+/);
    if (!urlMatch) {
      return await sock.sendMessage(chatId, {
        text: `❌ Please send an Instagram post or reel link.\n\nUsage:\n.igs <url>  → sticker with padding\n.igsc <url> → cropped square sticker`
      }, { quoted: msg });
    }

    await sock.sendMessage(chatId, { react: { text: '📥', key: msg.key } });

    const downloadData = await igdl(urlMatch[0]).catch(() => null);
    if (!downloadData?.data) {
      return await sock.sendMessage(chatId, {
        text: '❌ Failed to fetch media from that Instagram link. The post may be private or the link is invalid.'
      }, { quoted: msg });
    }

    const rawItems = (downloadData.data || []).filter(m => m && pickMediaUrl(m));
    const items = rawItems.slice(0, 10);

    if (!items.length) {
      return await sock.sendMessage(chatId, {
        text: '❌ No valid media found at the provided link.'
      }, { quoted: msg });
    }

    const seenHashes = new Set();
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < items.length; i++) {
      try {
        const media = items[i];
        const mediaUrl = pickMediaUrl(media);
        if (!mediaUrl) { failCount++; continue; }

        const isVideo = media?.type === 'video' || /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl);

        const buffer = await fetchBufferFromUrl(mediaUrl);

        const hash = crypto.createHash('md5').update(buffer).digest('hex');
        if (seenHashes.has(hash)) continue;
        seenHashes.add(hash);

        let sticker = await convertBufferToStickerWebp(buffer, isVideo, crop);

        if (sticker.length > STICKER_LIMIT) {
          const mini = await forceMiniSticker(buffer, isVideo, crop).catch(() => null);
          if (mini) sticker = mini;
        }
        if (sticker.length > STICKER_LIMIT) {
          const ultra = await ultraCompressSticker(buffer, isVideo, crop, i).catch(() => null);
          if (ultra) sticker = ultra;
        }

        try {
          await sock.sendMessage(chatId, { sticker }, { quoted: msg });
          successCount++;
        } catch (sendErr) {
          console.error(`[igsc] Failed to send sticker ${i + 1}:`, sendErr.message);
          failCount++;
        }

        if (i < items.length - 1) {
          await new Promise(r => setTimeout(r, 800));
        }

      } catch (itemErr) {
        console.error(`[igsc] Error processing item ${i + 1}:`, itemErr.message);
        failCount++;
      }
    }

    if (successCount === 0) {
      await sock.sendMessage(chatId, {
        text: '❌ Failed to create stickers from the Instagram media. The media may be restricted.'
      }, { quoted: msg });
    }

  } catch (err) {
    console.error('[igsc] Command error:', err);
    await sock.sendMessage(chatId, {
      text: '❌ Failed to create sticker from Instagram link. Please try again later.'
    }, { quoted: msg });
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = {
  name: 'igsc',
  aliases: ['igstickercrop'],
  category: 'media',
  description: 'Convert Instagram post/reel to cropped square sticker',
  usage: '.igsc <Instagram URL>',

  async execute(sock, msg, args, extra) {
    await igsCommand(sock, msg, args, extra, true);
  }
};
