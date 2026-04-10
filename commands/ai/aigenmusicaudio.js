/**
 * AI Generate Music + Audio Command
 * Ladybug Bot Mini V5 | by Dev-Ntando
 *
 * Generates AI song lyrics AND fetches a matching audio track from YouTube.
 * Two-step: first the AI writes original lyrics, then it searches YouTube
 * for a real song that matches the mood/genre and sends the audio file.
 *
 * Usage:
 *   .aigenmusicaudio <topic or mood>
 *   .aigenmusicaudio heartbreak afrobeats
 *   .aigenmusicaudio happy amapiano party
 *
 * Aliases: genmusicaudio, aimusicaudio, songwithmusic, aiaudio, musicgen
 */

'use strict';

const yts    = require('yt-search');
const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const APIs   = require('../../utils/api');

// ─── Genre pool for random suggestions ────────────────────────────────────────
const GENRES = [
  'Afrobeats', 'Amapiano', 'R&B', 'Pop', 'Hip-Hop', 'Lo-fi',
  'Afropop', 'Soul', 'Dancehall', 'Reggae', 'Trap', 'Drill',
];

// ─── Temp dir helper ──────────────────────────────────────────────────────────
const TMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ─── Module ───────────────────────────────────────────────────────────────────
module.exports = {
  name: 'aigenmusicaudio',
  aliases: ['genmusicaudio', 'aimusicaudio', 'songwithmusic', 'aiaudio', 'musicgen'],
  category: 'ai',
  description: 'Generate AI song lyrics + fetch a matching real audio track',
  usage: '.aigenmusicaudio <topic | mood | genre>',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
      if (!args.length) {
        return extra.reply(
          `🎵 *AI Music + Audio Generator*\n\n` +
          `Usage: .aigenmusicaudio <topic or mood>\n\n` +
          `Examples:\n` +
          `  .aigenmusicaudio heartbreak afrobeats\n` +
          `  .aigenmusicaudio hype party amapiano\n` +
          `  .aigenmusicaudio rainy night lo-fi\n\n` +
          `I will: ①Generate original AI lyrics ②Find & send a real matching song 🎧`
        );
      }

      const topic = args.join(' ').trim();
      await extra.reply(`🎵 Composing lyrics + finding music for *"${topic}"*... 🎤`);

      // ── Step 1: Generate AI lyrics ─────────────────────────────────────
      const genreHint = GENRES[Math.floor(Math.random() * GENRES.length)];

      const lyricsPrompt =
        `You are a professional music producer and songwriter. ` +
        `Create an original song based on this topic/mood: "${topic}". ` +
        `Use an appropriate genre (e.g. ${genreHint} if it fits). ` +
        `\n\nFormat your response EXACTLY like this:\n` +
        `🎵 Title: [song title]\n` +
        `🎭 Concept: [1-2 sentence concept]\n` +
        `🎸 Genre: [music genre]\n` +
        `🎤 BPM: [suggested BPM]\n` +
        `🎼 Key: [musical key]\n\n` +
        `[VERSE 1]\n[4-8 lines]\n\n` +
        `[HOOK/CHORUS]\n[4-6 lines]\n\n` +
        `[VERSE 2]\n[4-8 lines]\n\n` +
        `[BRIDGE]\n[2-4 lines]\n\n` +
        `Keep it authentic, emotional, and radio-ready. Use rhymes and rhythm.`;

      const lyricsRes  = await APIs.chatAI(lyricsPrompt);
      const lyrics     = (
        lyricsRes?.response ||
        lyricsRes?.msg ||
        lyricsRes?.data?.msg ||
        (typeof lyricsRes === 'string' ? lyricsRes : null) ||
        '🎵 Could not generate lyrics right now.'
      ).trim();

      // Extract title/genre from AI lyrics for YouTube search
      const titleMatch = lyrics.match(/🎵\s*Title:\s*(.+)/i);
      const genreMatch = lyrics.match(/🎸\s*Genre:\s*(.+)/i);
      const songTitle  = titleMatch ? titleMatch[1].trim() : topic;
      const songGenre  = genreMatch ? genreMatch[1].trim() : genreHint;

      const senderName = msg.pushName || extra.sender?.split('@')[0] || 'you';

      // ── Send lyrics first ──────────────────────────────────────────────
      const header =
        `╔══════════════════════════════╗\n` +
        `║  🎵  *AI MUSIC + AUDIO*       ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `📝 *Topic:* ${topic}\n` +
        `👤 *Requested by:* ${senderName}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const footer =
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_🤖 AI-generated lyrics. Searching for matching audio..._`;

      await extra.reply(header + lyrics + footer);

      // ── Step 2: Find matching audio on YouTube ─────────────────────────
      await extra.reply(`🔍 Searching YouTube for a *${songGenre}* track matching *"${topic}"*...`);

      const query    = `${topic} ${songGenre} official audio`;
      const search   = await yts(query);
      const video    = search?.videos?.find(v => v.seconds > 60 && v.seconds < 600);

      if (!video) {
        return extra.reply(
          `⚠️ Lyrics generated but couldn't find a matching song on YouTube for *"${query}"*.\n` +
          `Try *.song ${songTitle}* to search manually.`
        );
      }

      await extra.reply(
        `🎧 Found: *${video.title}*\n` +
        `⏱️ Duration: ${video.timestamp}\n` +
        `📥 Downloading audio...`
      );

      // ── Step 3: Download audio via siputzx API ─────────────────────────
      let audioUrl = null;
      try {
        const dlRes = await axios.get(`https://api.siputzx.my.id/api/d/ytmp3`, {
          params: { url: video.url },
          timeout: 30000,
        });
        audioUrl = dlRes?.data?.data?.url || dlRes?.data?.url || null;
      } catch (dlErr) {
        console.error('[aigenmusicaudio] DL error:', dlErr.message);
      }

      if (!audioUrl) {
        return extra.reply(
          `⚠️ Found the song but couldn't download audio right now.\n` +
          `🎵 *${video.title}*\n🔗 ${video.url}\n\n` +
          `Try *.song ${topic}* to download manually.`
        );
      }

      // ── Step 4: Send audio ─────────────────────────────────────────────
      const tmpFile = path.join(TMP_DIR, `aimusicaudio_${Date.now()}.mp3`);
      let fileSent  = false;

      try {
        const audioRes = await axios.get(audioUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
        });

        fs.writeFileSync(tmpFile, audioRes.data);

        await sock.sendMessage(chatId, {
          audio: fs.readFileSync(tmpFile),
          mimetype: 'audio/mp4',
          ptt: false,
          fileName: `${songTitle}.mp3`,
        }, { quoted: msg });

        fileSent = true;
      } catch (sendErr) {
        console.error('[aigenmusicaudio] Send error:', sendErr.message);
      } finally {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      }

      if (!fileSent) {
        return extra.reply(
          `⚠️ Couldn't send the audio file directly.\n` +
          `🎵 *${video.title}*\n🔗 ${video.url}\n\n` +
          `Try *.song ${topic}* to download manually.`
        );
      }

      await extra.reply(
        `✅ *Done!* Here's your AI-generated song + matching audio.\n\n` +
        `🎵 *${video.title}*\n` +
        `⏱️ ${video.timestamp}\n\n` +
        `_Use .aigenmusicaudio <topic> for a new one!_\n` +
        `> Made with ❤️ by Ladybug Bot Mini V5`
      );

    } catch (error) {
      console.error('[aigenmusicaudio] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
