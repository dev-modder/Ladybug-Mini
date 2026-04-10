/**
 * AI Generate Music + Audio Command
 * Ladybug Bot Mini V5 | by Dev-Ntando (Ntandoyenkosi Chisaya, Zimbabwe)
 *
 * Generates AI song lyrics AND fetches a matching audio track from YouTube.
 * Fixed: multiple fallback download APIs so audio actually sends.
 *
 * Usage:
 *   .aigenmusicaudio heartbreak afrobeats
 *   .aigenmusicaudio happy amapiano party
 *   .aigenmusicaudio Zimbabwe independence day
 *
 * Aliases: genmusicaudio, aimusicaudio, songwithmusic, aiaudio, musicgen
 */

'use strict';

const yts   = require('yt-search');
const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

let APIs;
try { APIs = require('../../utils/api'); } catch (_) { APIs = {}; }

const GENRES = [
  'Afrobeats', 'Amapiano', 'R&B', 'Pop', 'Hip-Hop', 'Lo-fi',
  'Afropop', 'Soul', 'Dancehall', 'Reggae', 'Sungura', 'Gospel',
  'Zimdancehall', 'Jit', 'Mbira', 'Jazz',
];

const TMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ─── AI call helper ────────────────────────────────────────────────────────────
async function callAI(prompt) {
  const endpoints = [
    async () => {
      const r = await axios.get('https://api.shizo.top/ai/gpt', {
        params: { apikey: 'shizo', query: prompt }, timeout: 25000,
      });
      return r?.data?.msg || r?.data?.response || (typeof r?.data === 'string' ? r.data : null);
    },
    async () => {
      const r = await axios.get('https://api.siputzx.my.id/api/ai/chatgpt', {
        params: { text: prompt }, timeout: 20000,
      });
      return r?.data?.data || r?.data?.msg;
    },
  ];
  for (const fn of endpoints) {
    try { const r = await fn(); if (r && String(r).length > 2) return String(r).trim(); } catch (_) {}
  }
  return null;
}

// ─── YouTube audio download — multiple API fallbacks ──────────────────────────
async function downloadYTAudio(videoUrl, videoTitle) {
  const tmpFile = path.join(TMP_DIR, 'aimusicaudio_' + Date.now() + '.mp3');

  // API attempts in order of reliability
  const attempts = [
    // 1. siputzx ytmp3
    async () => {
      const r = await axios.get('https://api.siputzx.my.id/api/d/ytmp3', {
        params: { url: videoUrl }, timeout: 30000,
      });
      return r?.data?.data?.url || r?.data?.url || null;
    },
    // 2. yt-api.p.rapidapi (free tier fallback)
    async () => {
      const r = await axios.get('https://youtube-mp36.p.rapidapi.com/dl', {
        params: { id: videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop() },
        headers: { 'X-RapidAPI-Key': 'free', 'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com' },
        timeout: 20000,
      });
      return r?.data?.link || null;
    },
    // 3. y2mate style
    async () => {
      const r = await axios.get('https://api.agatz.xyz/api/ytmp3', {
        params: { url: videoUrl }, timeout: 25000,
      });
      return r?.data?.data || r?.data?.url || null;
    },
    // 4. cobalt-style download
    async () => {
      const r = await axios.post('https://co.wuk.sh/api/json', {
        url: videoUrl,
        aFormat: 'mp3',
        isAudioOnly: true,
        vQuality: '144',
      }, {
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        timeout: 20000,
      });
      return r?.data?.url || null;
    },
  ];

  for (const fn of attempts) {
    try {
      const audioUrl = await fn();
      if (!audioUrl) continue;
      const res = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 60000 });
      if (res.data && res.data.byteLength > 10000) {
        fs.writeFileSync(tmpFile, res.data);
        return tmpFile;
      }
    } catch (_) {}
  }
  return null;
}

// ─── Module export ─────────────────────────────────────────────────────────────
module.exports = {
  name: 'aigenmusicaudio',
  aliases: ['genmusicaudio', 'aimusicaudio', 'songwithmusic', 'aiaudio', 'musicgen'],
  category: 'ai',
  description: 'Generate AI song lyrics + download and send a real matching audio track',
  usage: '.aigenmusicaudio <topic | mood | genre>',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    if (!args.length) {
      return extra.reply(
        '🎵 *AI Music + Audio Generator*\n\n' +
        'Usage: .aigenmusicaudio <topic or mood>\n\n' +
        'Examples:\n' +
        '  .aigenmusicaudio heartbreak afrobeats\n' +
        '  .aigenmusicaudio hype party amapiano\n' +
        '  .aigenmusicaudio Zimbabwe independence day\n' +
        '  .aigenmusicaudio rainy night lo-fi\n\n' +
        'I will: ①Write original lyrics ②Find & send a real matching song 🎧'
      );
    }

    const topic    = args.join(' ').trim();
    const genreHint = GENRES[Math.floor(Math.random() * GENRES.length)];
    const senderName = msg.pushName || extra?.sender?.split('@')[0] || 'you';

    await extra.reply('🎵 Composing lyrics + finding audio for *"' + topic + '"*... 🎤');

    // ── Step 1: Generate lyrics ──────────────────────────────────────────────
    const lyricsPrompt =
      'You are a professional music producer and songwriter from Zimbabwe. ' +
      'Create an original song based on: "' + topic + '". ' +
      'Genre suggestion: ' + genreHint + ' (use what fits best). ' +
      'Format EXACTLY like:\n' +
      '🎵 Title: [song title]\n' +
      '🎭 Concept: [1-2 sentence concept]\n' +
      '🎸 Genre: [genre]\n' +
      '🎤 BPM: [BPM]\n' +
      '🎼 Key: [key]\n\n' +
      '[VERSE 1]\n[4-8 lines]\n\n' +
      '[HOOK/CHORUS]\n[4-6 lines]\n\n' +
      '[VERSE 2]\n[4-8 lines]\n\n' +
      '[BRIDGE]\n[2-4 lines]\n\n' +
      'Keep it authentic, emotional, and radio-ready. Use good rhyme and rhythm.';

    const lyrics = await callAI(lyricsPrompt) || '🎵 Could not generate lyrics right now. Try again!';

    const titleMatch = lyrics.match(/🎵\s*Title:\s*(.+)/i);
    const genreMatch = lyrics.match(/🎸\s*Genre:\s*(.+)/i);
    const songTitle  = titleMatch ? titleMatch[1].trim() : topic;
    const songGenre  = genreMatch ? genreMatch[1].trim() : genreHint;

    await extra.reply(
      '╔══════════════════════════════╗\n' +
      '║  🎵  *AI MUSIC + AUDIO*       ║\n' +
      '╚══════════════════════════════╝\n\n' +
      '📝 *Topic:* ' + topic + '\n' +
      '👤 *Requested by:* ' + senderName + '\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      lyrics +
      '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '_🤖 AI-generated lyrics. Searching for audio..._'
    );

    // ── Step 2: Search YouTube ───────────────────────────────────────────────
    await extra.reply('🔍 Searching for *' + songGenre + '* audio matching *"' + topic + '"*...');

    let video = null;
    const queries = [
      topic + ' ' + songGenre + ' official audio',
      songTitle + ' ' + songGenre,
      topic + ' ' + songGenre + ' music',
      topic + ' audio 2024',
    ];

    for (const q of queries) {
      try {
        const search = await yts(q);
        const found  = search?.videos?.find(v => v.seconds > 60 && v.seconds < 600);
        if (found) { video = found; break; }
      } catch (_) {}
    }

    if (!video) {
      return extra.reply(
        '⚠️ Lyrics generated but could not find a matching song on YouTube.\n' +
        'Try: *.song ' + songTitle + '* to search manually.'
      );
    }

    await extra.reply(
      '🎧 Found: *' + video.title + '*\n' +
      '⏱️ Duration: ' + video.timestamp + '\n' +
      '📥 Downloading audio...'
    );

    // ── Step 3: Download audio ───────────────────────────────────────────────
    const tmpFile = await downloadYTAudio(video.url, video.title);

    if (!tmpFile) {
      return extra.reply(
        '⚠️ Found the song but could not download it right now.\n' +
        '🎵 *' + video.title + '*\n' +
        '🔗 ' + video.url + '\n\n' +
        'Try *.song ' + topic + '* to download manually.'
      );
    }

    // ── Step 4: Send audio ───────────────────────────────────────────────────
    try {
      await sock.sendMessage(chatId, {
        audio: fs.readFileSync(tmpFile),
        mimetype: 'audio/mp4',
        ptt: false,
        fileName: songTitle + '.mp3',
      }, { quoted: msg });

      await extra.reply(
        '✅ *Done!* Here is your AI-generated song + audio!\n\n' +
        '🎵 *' + video.title + '*\n' +
        '⏱️ ' + video.timestamp + '\n\n' +
        '_Use .aigenmusicaudio <topic> for a new one!_\n' +
        '> Made with ❤️ by Dev-Ntando 🇿🇼'
      );
    } catch (sendErr) {
      await extra.reply(
        '⚠️ Could not send audio directly.\n' +
        '🎵 *' + video.title + '*\n' +
        '🔗 ' + video.url
      );
    } finally {
      try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
    }
  },
};
