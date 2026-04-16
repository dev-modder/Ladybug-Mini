/**
 * Motivate v3 — Ladybug Bot Mini
 * .motivate | .motivate @user | .motivate <name> --type <type>
 */
'use strict';
const APIs = require('../../utils/api');
const TYPES = { general:'general life motivation', hustle:'entrepreneurship and hustle culture', student:'student and academic motivation', sports:'sports and athletic performance', heartbreak:'recovering from heartbreak and loss', comeback:'making a comeback after failure' };
module.exports = {
  name: 'motivate',
  aliases: ['inspire', 'motivation', 'hype', 'encourage'],
  category: 'ai',
  description: 'Generate personalised AI motivation speeches',
  usage: '.motivate [name] [--type general|hustle|student|sports|heartbreak|comeback]',
  async execute(sock, msg, args, extra) {
    try {
      let type = 'general', name = null;
      const cleanArgs = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--type' && args[i+1]) { type = args[++i].toLowerCase(); }
        else { cleanArgs.push(args[i]); }
      }
      if (cleanArgs.length) name = cleanArgs.join(' ').replace('@', '').trim();
      const typeDesc = TYPES[type] || TYPES.general;
      const nameStr  = name ? ` for someone named ${name}` : '';
      await sock.sendPresenceUpdate('composing', extra.from);
      const prompt = `Write a powerful, original motivational speech${nameStr} focused on ${typeDesc}. It should be personal, emotional, and inspiring. 150-200 words. End with a strong call to action.`;
      const result = await APIs.chatAI(prompt, 'You are an inspiring motivational coach. Your words ignite passion, drive, and belief in people.');
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`💪 *Motivation${name ? ' for '+name : ''}*\n━━━━━━━━━━━━━━━━━━━━\n${result}\n━━━━━━━━━━━━━━━━━━━━\n🔥 You\'ve got this!\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
