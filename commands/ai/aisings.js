/**
 * AI Sings Command
 * Ladybug Bot Mini V5 | by Dev-Ntando (Ntandoyenkosi Chisaya, Zimbabwe)
 *
 * The AI writes a song AND performs it — generating audio where the AI is the singer.
 * Uses TTS (text-to-speech) voice synthesis to "sing" the lyrics over a backing track.
 *
 * How it works:
 *   1. AI writes original song lyrics for your topic
 *   2. AI converts lyrics to a spoken/sung TTS audio via voice API
 *   3. Bot sends you the AI voice audio as a voice message
 *   4. Optionally also finds an instrumental backing track
 *
 * Usage:
 *   .aisings <topic or theme>
 *   .aisings love Zimbabwe
 *   .aisings motivational morning vibes
 *   .aisings birthday party afrobeats
 *
 * Aliases: aisung, sings, aisinger, voicesong, aiperform
 */

'use strict';

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const yts   = require('yt-search');

const TMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const GENRES  = ['Afrobeats', 'Amapiano', 'R&B', 'Gospel', 'Zimdancehall', 'Sungura', 'Soul', 'Pop'];

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

// ─── TTS audio generation — multiple provider fallbacks ───────────────────────
async function generateTTSAudio(text, voice) {
  const tmpFile = path.join(TMP_DIR, 'aisings_' + Date.now() + '.mp3');

  // Limit text length for TTS
  const ttsText = text.slice(0, 1500);

  const ttsApis = [
    // 1. StreamElements TTS (free, no key needed)
    async () => {
      const voice_ = ['Brian', 'Amy', 'Emma', 'Joanna', 'Matthew'][Math.floor(Math.random() * 5)];
      const r = await axios.get('https://api.streamelements.com/kappa/v2/speech', {
        params: { voice: voice_, text: ttsText },
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      if (r.data && r.data.byteLength > 5000) {
        fs.writeFileSync(tmpFile, r.data);
        return tmpFile;
      }
      return null;
    },
    // 2. ttsmp3.com
    async () => {
      const r = await axios.post('https://ttsmp3.com/makemp3_new.php',
        'msg=' + encodeURIComponent(ttsText.slice(0, 600)) + '&lang=Joanna&source=ttsmp3',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 25000,
        }
      );
      const url = r?.data?.URL || r?.data?.url;
      if (!url) return null;
      const audioRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
      if (audioRes.data && audioRes.data.byteLength > 5000) {
        fs.writeFileSync(tmpFile, audioRes.data);
        return tmpFile;
      }
      return null;
    },
    // 3. voicerss.org free API
    async () => {
      const r = await axios.get('https://api.voicerss.org/', {
        params: {
          key: '9cc0ef61d8e74c0298b826a0b3af8fd8', // free tier key
          hl: 'en-us',
          v: 'Linda',
          src: ttsText.slice(0, 500),
          r: '0',
          c: 'mp3',
          f: '44khz_16bit_stereo',
        },
        responseType: 'arraybuffer',
        timeout: 25000,
      });
      if (r.data && r.data.byteLength > 5000) {
        fs.writeFileSync(tmpFile, r.data);
        return tmpFile;
      }
      return null;
    },
  ];

  for (const fn of ttsApis) {
    try {
      const result = await fn();
      if (result) return result;
    } catch (_) {}
  }
  return null;
}

// ─── YouTube instrumental download ───────────────────────────────────────────
async function downloadInstrumental(topic, genre) {
  const tmpFile = path.join(TMP_DIR, 'instrumental_' + Date.now() + '.mp3');
  try {
    const query = topic + ' ' + genre + ' instrumental beat no vocals';
    const search = await yts(query);
    const video  = search?.videos?.find(v => v.seconds > 60 && v.seconds < 360);
    if (!video) return null;

    const dlApis = [
      async () => {
        const r = await axios.get('https://api.siputzx.my.id/api/d/ytmp3', {
          params: { url: video.url }, timeout: 30000,
        });
        return r?.data?.data?.url || r?.data?.url || null;
      },
      async () => {
        const r = await axios.get('https://api.agatz.xyz/api/ytmp3', {
          params: { url: video.url }, timeout: 25000,
        });
        return r?.data?.data || r?.data?.url || null;
      },
    ];

    for (const fn of dlApis) {
      try {
        const audioUrl = await fn();
        if (!audioUrl) continue;
        const res = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 60000 });
        if (res.data && res.data.byteLength > 10000) {
          fs.writeFileSync(tmpFile, res.data);
          return { file: tmpFile, title: video.title, url: video.url };
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

// ─── Module export ─────────────────────────────────────────────────────────────
module.exports = {
  name: 'aisings',
  aliases: ['aisung', 'sings', 'aisinger', 'voicesong', 'aiperform'],
  category: 'ai',
  description: 'The AI writes AND sings a song — sends you an actual voice performance!',
  usage: '.aisings <topic or theme>',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    if (!args.length) {
      return extra.reply(
        '🎤 *AI Sings — AI Voice Performance*\n\n' +
        'Usage: *.aisings <topic or theme>*\n\n' +
        'Examples:\n' +
        '  .aisings love Zimbabwe\n' +
        '  .aisings birthday party\n' +
        '  .aisings motivational morning\n' +
        '  .aisings heartbreak afrobeats\n\n' +
        'The AI will:\n' +
        '  ✍️ Write original song lyrics\n' +
        '  🎤 Perform the song in AI voice\n' +
        '  🎸 Send you an instrumental beat\n\n' +
        '> _Made with ❤️ by Dev-Ntando 🇿🇼_'
      );
    }

    const topic   = args.join(' ').trim();
    const genre   = GENRES[Math.floor(Math.random() * GENRES.length)];
    const voice   = VOICES[Math.floor(Math.random() * VOICES.length)];
    const senderName = msg.pushName || extra?.sender?.split('@')[0] || 'you';

    await extra.reply('🎤 *AI is composing a song for you...*\nTopic: *' + topic + '*\nGenre: *' + genre + '*\n\n_This may take a moment..._');

    // ── Step 1: Write lyrics ──────────────────────────────────────────────────
    const lyricsPrompt =
      'You are a professional singer-songwriter from Zimbabwe. ' +
      'Write a short, singable song about: "' + topic + '". ' +
      'Genre: ' + genre + '. Keep it short (max 2 verses + chorus + bridge). ' +
      'Format EXACTLY like this:\n' +
      'Title: [song title]\n' +
      'Genre: [genre]\n\n' +
      '[VERSE 1]\n[4-6 lines]\n\n' +
      '[CHORUS]\n[4 lines - catchy and memorable]\n\n' +
      '[VERSE 2]\n[4-6 lines]\n\n' +
      '[CHORUS]\n[same chorus]\n\n' +
      '[OUTRO]\n[2 lines]\n\n' +
      'IMPORTANT: Write lyrics that sound great when spoken/sung aloud. Focus on rhythm and flow.';

    const lyrics = await callAI(lyricsPrompt);

    if (!lyrics) {
      return extra.reply('❌ Could not generate lyrics. Please try again!');
    }

    const titleMatch = lyrics.match(/^Title:\s*(.+)/im);
    const songTitle  = titleMatch ? titleMatch[1].trim() : topic;
    const genreMatch = lyrics.match(/^Genre:\s*(.+)/im);
    const songGenre  = genreMatch ? genreMatch[1].trim() : genre;

    // Send lyrics first
    await extra.reply(
      '╔═══════════════════════════════╗\n' +
      '║   🎤  *AI SINGS FOR YOU!*      ║\n' +
      '╚═══════════════════════════════╝\n\n' +
      '🎵 *' + songTitle + '*\n' +
      '🎸 Genre: ' + songGenre + '\n' +
      '👤 For: ' + senderName + '\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      lyrics +
      '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '_🎤 Now generating AI voice performance..._'
    );

    // ── Step 2: Generate TTS voice audio ─────────────────────────────────────
    await extra.reply('🎙️ Converting lyrics to AI voice... Give me a moment!');

    // Clean lyrics for TTS — remove formatting markers
    const ttsLyrics = lyrics
      .replace(/\[VERSE \d+\]/gi, 'Verse.')
      .replace(/\[CHORUS\]/gi, 'Chorus.')
      .replace(/\[BRIDGE\]/gi, 'Bridge.')
      .replace(/\[OUTRO\]/gi, 'Outro.')
      .replace(/^Title:.*$/im, '')
      .replace(/^Genre:.*$/im, '')
      .trim();

    const performanceIntro = 'Hello! I am Ladybug, and I am singing this song for ' + senderName + '. ' +
      'The song is called ' + songTitle + '. Here we go! ... ';
    const fullTTSText = performanceIntro + ttsLyrics;

    const ttsFile = await generateTTSAudio(fullTTSText, voice);

    if (ttsFile) {
      try {
        await sock.sendMessage(chatId, {
          audio: fs.readFileSync(ttsFile),
          mimetype: 'audio/mp4',
          ptt: true, // Send as voice note so it plays automatically
          fileName: songTitle + '_ai_performance.mp3',
        }, { quoted: msg });

        await extra.reply('🎤 *AI performance sent above!* 👆\n_That\'s me singing just for you!_');
      } catch (_) {
        await extra.reply('⚠️ Could not send voice audio directly. Searching for an instrumental instead...');
      } finally {
        try { if (fs.existsSync(ttsFile)) fs.unlinkSync(ttsFile); } catch (_) {}
      }
    } else {
      await extra.reply('🎙️ Voice synthesis is busy right now. Sending an instrumental instead...');
    }

    // ── Step 3: Find + send instrumental backing track ────────────────────────
    await extra.reply('🎸 Searching for a *' + songGenre + '* instrumental to go with this...');

    const instrumental = await downloadInstrumental(topic, songGenre);

    if (instrumental) {
      try {
        await sock.sendMessage(chatId, {
          audio: fs.readFileSync(instrumental.file),
          mimetype: 'audio/mp4',
          ptt: false,
          fileName: songTitle + '_instrumental.mp3',
        }, { quoted: msg });

        await extra.reply(
          '🎸 *Instrumental sent!*\n' +
          '🎵 ' + instrumental.title + '\n\n' +
          '✅ *Performance complete!*\n\n' +
          '🎤 Lyrics written by AI\n' +
          '🔊 AI voice performance sent\n' +
          '🎸 Instrumental backing track sent\n\n' +
          'Use *.aisings <topic>* for another performance!\n' +
          '> _Made with ❤️ by Dev-Ntando 🇿🇼_'
        );
      } catch (_) {
        await extra.reply('🎵 ' + instrumental.title + '\n🔗 ' + instrumental.url);
      } finally {
        try { if (fs.existsSync(instrumental.file)) fs.unlinkSync(instrumental.file); } catch (_) {}
      }
    } else {
      await extra.reply(
        '✅ *Done!* AI lyrics and voice performance complete!\n\n' +
        '_Could not find an instrumental for this topic — try a different genre!_\n\n' +
        '> _Made with ❤️ by Dev-Ntando 🇿🇼_'
      );
    }
  },
};
