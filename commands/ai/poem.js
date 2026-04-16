/**
 * Poem v3 — Ladybug Bot Mini
 * .poem <topic> [--style haiku|sonnet|free|limerick|acrostic]
 */
'use strict';
const APIs = require('../../utils/api');
const STYLES = { haiku:'haiku (5-7-5 syllable structure, 3 lines)', sonnet:'Shakespearean sonnet (14 lines, ABAB CDCD EFEF GG rhyme scheme)', free:'free verse poem (no rhyme constraints, modern style)', limerick:'limerick (AABBA rhyme scheme, humorous)', acrostic:'acrostic poem where the first letters spell out the topic', ballad:'ballad (narrative poem with ABAB rhyme, 4+ stanzas)', rap:'rap verse with rhymes and rhythm' };
module.exports = {
  name: 'poem',
  aliases: ['poetry', 'verse', 'rhyme', 'rap'],
  category: 'ai',
  description: 'Generate creative poems in multiple styles',
  usage: '.poem <topic> [--style haiku|sonnet|free|limerick|acrostic|ballad|rap]',
  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) return extra.reply(`🎭 *Poem Generator v3*\n\nUsage: .poem <topic>\n\nStyles: ${Object.keys(STYLES).join(', ')}\n\nExamples:\n  .poem Zimbabwe --style acrostic\n  .poem heartbreak --style sonnet\n  .poem my dog --style limerick\n\n> _Ladybug Bot Mini v3_`);
      let style = 'free';
      const cleanArgs = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--style' && args[i+1]) { style = args[++i].toLowerCase(); }
        else { cleanArgs.push(args[i]); }
      }
      const topic = cleanArgs.join(' ').trim();
      if (!topic) return extra.reply('❌ Please provide a poem topic.');
      const styleDesc = STYLES[style] || STYLES.free;
      await extra.reply(`🎭 Writing a *${style}* poem about: *${topic}*...`);
      await sock.sendPresenceUpdate('composing', extra.from);
      const prompt = `Write a beautiful, original ${styleDesc} about "${topic}". Make it evocative, emotional, and memorable. Only output the poem itself, no intro text.`;
      const result = await APIs.chatAI(prompt, 'You are a gifted poet. Write creative, emotionally resonant poetry with vivid imagery and strong rhythm.');
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`🎭 *Poem: ${topic}*\n━━━━━━━━━━━━━━━━━━━━\n${result}\n━━━━━━━━━━━━━━━━━━━━\n🖊️ Style: ${style}\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
