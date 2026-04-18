/**
 * MediaCmds Command - List all media commands
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'mediacmds',
  aliases: ['mediamenu', 'mlist'],
  category: 'media',
  description: 'Show all available media & download commands',
  usage: '.mediacmds',

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menu =
        `🎵 *Ladybug Mini — Media Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `🎵 *Music & Audio*\n` +
        `  ${p}song <title>      — Download song (MP3)\n` +
        `  ${p}ytmp3 <url/query> — YouTube to MP3\n` +
        `  ${p}spotify <url>     — Spotify track download\n` +
        `  ${p}lyrics <song>     — Get song lyrics\n` +
        `  ${p}shazam            — Identify a song from audio\n\n` +

        `🎬 *Video Downloads*\n` +
        `  ${p}tiktok <url>      — Download TikTok video\n` +
        `  ${p}instagram <url>   — Instagram reel/video\n` +
        `  ${p}igs <url>         — Instagram stories\n` +
        `  ${p}igsc <url>        — Instagram content\n` +
        `  ${p}facebook <url>    — Facebook video\n` +
        `  ${p}twitter <url>     — Twitter/X video\n` +
        `  ${p}pinterest <url>   — Pinterest image/video\n` +
        `  ${p}video <query>     — YouTube video download\n` +
        `  ${p}yts <query>       — YouTube search\n\n` +

        `🖼️ *Images*\n` +
        `  ${p}img <query>       — Search & download image\n` +
        `  ${p}imgdl <url>       — Download image from URL\n` +
        `  ${p}printrest <query> — Search Pinterest images\n\n` +

        `📱 *Apps & Other*\n` +
        `  ${p}apk <app name>    — Download APK from APKPure\n` +
        `  ${p}movie <title>     — Movie info & trailer\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Ladybug Bot Mini_`;

      await extra.reply(menu);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
