/**
 * AI Generated Music Lyrics & Song Idea Command
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Generates original song lyrics, a song concept, and a suggested music style
 * using the bot's AI engine. No external music API needed.
 *
 * Usage:
 *   .aigenmusic <topic or mood>
 *   .aigenmusic heartbreak
 *   .aigenmusic hype party afrobeat
 *   .aigenmusic sad rainy night lofi
 *
 * Aliases: genmusic, songgen, makelyrics, songai, musicai
 */

'use strict';

const APIs = require('../../utils/api');

const MUSIC_GENRES = [
  'Afrobeats', 'R&B', 'Pop', 'Hip-Hop', 'Lo-fi', 'Amapiano',
  'Afropop', 'Soul', 'Dancehall', 'Reggae', 'Trap', 'Drill',
];

module.exports = {
  name: 'aigenmusic',
  aliases: ['genmusic', 'songgen', 'makelyrics', 'songai', 'musicai', 'ailyrics'],
  category: 'ai',
  description: 'Generate original AI song lyrics and a music concept',
  usage: '.aigenmusic <topic | mood | genre>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🎵 *AI Music Generator*\n\n` +
          `Usage: .aigenmusic <topic or mood>\n\n` +
          `Examples:\n` +
          `  .aigenmusic heartbreak\n` +
          `  .aigenmusic hype afrobeats party\n` +
          `  .aigenmusic rainy night lo-fi sad\n` +
          `  .aigenmusic love amapiano\n\n` +
          `I'll generate: *Title, Concept, Genre, Lyrics (Verse + Hook)*\n\n` +
          `💡 *Tip:* Use *.aigenmusicaudio <topic>* to also get a real matching audio track!`
        );
      }

      // ── audio sub-command: delegate to aigenmusicaudio ─────────────────
      if (args[0]?.toLowerCase() === 'audio') {
        const audioCmd = require('./aigenmusicaudio');
        return audioCmd.execute(sock, msg, args.slice(1), extra);
      }

      const topic = args.join(' ').trim();
      await extra.reply(`🎵 Composing a song about *"${topic}"*... Give me a sec 🎤`);

      // Pick a random genre hint if user didn't mention one
      const genreHint = MUSIC_GENRES[Math.floor(Math.random() * MUSIC_GENRES.length)];

      const prompt =
        `You are a professional music producer and songwriter. ` +
        `Create an original song based on this topic/mood: "${topic}". ` +
        `If the topic suggests a specific genre, use that; otherwise suggest a fitting one (e.g. ${genreHint}). ` +
        `\n\nFormat your response EXACTLY like this (no extra text before or after):\n` +
        `🎵 Title: [song title]\n` +
        `🎭 Concept: [1-2 sentence song concept]\n` +
        `🎸 Genre: [music genre]\n` +
        `🎤 BPM: [suggested BPM]\n` +
        `🎼 Key: [musical key, e.g. C minor]\n\n` +
        `[VERSE 1]\n` +
        `[4-8 lines of verse lyrics]\n\n` +
        `[HOOK/CHORUS]\n` +
        `[4-6 lines of catchy hook lyrics]\n\n` +
        `[VERSE 2]\n` +
        `[4-8 lines of verse lyrics]\n\n` +
        `[BRIDGE]\n` +
        `[2-4 lines of bridge]\n\n` +
        `Keep it authentic, emotional, and radio-ready. Use rhymes and rhythm.`;

      const response = await APIs.chatAI(prompt);
      const lyrics = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        (typeof response === 'string' ? response : null) ||
        '🎵 Could not generate lyrics right now. Try again!'
      ).trim();

      const senderName = msg.pushName || extra.sender?.split('@')[0] || 'you';

      const header =
        `╔══════════════════════════╗\n` +
        `║  🎵  *AI MUSIC GENERATOR* ║\n` +
        `╚══════════════════════════╝\n\n` +
        `📝 *Topic:* ${topic}\n` +
        `👤 *Requested by:* ${senderName}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const footer =
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_🤖 AI-generated original. Not affiliated with any artist._\n` +
        `_Use .aigenmusic <topic> to generate another song!_`;

      await extra.reply(header + lyrics + footer);

    } catch (error) {
      console.error('[aigenmusic] Error:', error);
      await extra.reply(`❌ Music generation failed: ${error.message}`);
    }
  },
};
