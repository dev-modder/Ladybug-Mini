/**
 * Story v3 — Ladybug Bot Mini
 * .story <prompt> [--genre] [--length short|long] [--chars <names>]
 */
'use strict';
const APIs = require('../../utils/api');
const GENRES = { horror:'terrifying horror', romance:'romantic', adventure:'action-adventure', comedy:'hilarious comedy', mystery:'suspenseful mystery', scifi:'science fiction', fantasy:'epic fantasy', drama:'emotional drama', thriller:'psychological thriller', folklore:'African folklore' };
module.exports = {
  name: 'story',
  aliases: ['writestory', 'narrate', 'tale', 'shortstory'],
  category: 'ai',
  description: 'Generate creative stories with genre control',
  usage: '.story <prompt> [--genre horror|romance|adventure|comedy|mystery|scifi|fantasy|drama|thriller|folklore] [--long]',
  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) return extra.reply(`📖 *Story Generator v3*\n\nUsage: .story <prompt>\n\nGenres: ${Object.keys(GENRES).join(', ')}\n\nExamples:\n  .story a boy who finds a magic phone --genre scifi\n  .story two strangers meet at a bus stop --genre romance\n  .story a detective in Harare --genre mystery\n\n> _Ladybug Bot Mini v3_`);
      let genre = null, long = false, chars = null;
      const cleanArgs = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--genre' && args[i+1]) { genre = args[++i].toLowerCase(); }
        else if (args[i] === '--long') { long = true; }
        else if (args[i] === '--chars' && args[i+1]) { chars = args[++i]; }
        else { cleanArgs.push(args[i]); }
      }
      const prompt = cleanArgs.join(' ').trim();
      if (!prompt) return extra.reply('❌ Please provide a story prompt.');
      const genreDesc = genre && GENRES[genre] ? GENRES[genre] : 'engaging and creative';
      const length    = long ? '600-800 words' : '200-350 words';
      const charStr   = chars ? ` Main characters: ${chars}.` : '';
      await extra.reply(`📖 *Writing your ${genre || ''} story...*\n⏳ Please wait...`);
      await sock.sendPresenceUpdate('composing', extra.from);
      const sysPrompt = `You are a talented creative writer. Write compelling, vivid, original stories with strong narrative structure, interesting characters, and satisfying endings.`;
      const userPrompt = `Write a ${genreDesc} short story (${length}) based on this prompt: "${prompt}"${charStr}\n\nInclude: engaging opening, character development, rising tension, and a satisfying conclusion. Make it memorable.`;
      const result = await APIs.chatAI(userPrompt, sysPrompt);
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`📖 *${genre ? genre.charAt(0).toUpperCase()+genre.slice(1)+' ' : ''}Story*\n━━━━━━━━━━━━━━━━━━━━\n${result}\n━━━━━━━━━━━━━━━━━━━━\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
