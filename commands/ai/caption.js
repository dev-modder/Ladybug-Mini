/**
 * Caption v3 — Ladybug Bot Mini
 * .caption <platform> | <description>  [--hashtags] [--cta]
 */
'use strict';
const APIs = require('../../utils/api');
const PLATFORMS = { instagram:'Instagram', twitter:'Twitter/X', tiktok:'TikTok', facebook:'Facebook', linkedin:'LinkedIn', youtube:'YouTube', threads:'Threads', whatsapp:'WhatsApp Status' };
module.exports = {
  name: 'caption',
  aliases: ['postcaption', 'socialmedia', 'posttext'],
  category: 'ai',
  description: 'Generate engaging social media captions for any platform',
  usage: '.caption <platform> | <description>  OR  .caption <description>  [--hashtags] [--cta]',
  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) return extra.reply(`📱 *Caption Generator v3*\n\nUsage: .caption <platform> | <description>\n\nPlatforms: ${Object.keys(PLATFORMS).join(', ')}\n\nOptions:\n  --hashtags — include hashtags\n  --cta      — include call-to-action\n\nExamples:\n  .caption instagram | photo of me at victoria falls --hashtags\n  .caption linkedin | just got promoted! --cta\n\n> _Ladybug Bot Mini v3_`);
      let hashtags = false, cta = false;
      const cleanArgs = args.filter(a => { if (a === '--hashtags') { hashtags = true; return false; } if (a === '--cta') { cta = true; return false; } return true; });
      const fullText = cleanArgs.join(' ');
      let platform = null, description = fullText;
      if (fullText.includes('|')) { const [p, d] = fullText.split('|').map(s => s.trim()); platform = p.toLowerCase(); description = d; }
      else { const first = cleanArgs[0]?.toLowerCase(); if (PLATFORMS[first]) { platform = first; description = cleanArgs.slice(1).join(' ').trim(); } }
      if (!description) return extra.reply('❌ Please provide a description of your post.');
      const platName = platform && PLATFORMS[platform] ? PLATFORMS[platform] : 'social media';
      const extras   = [hashtags ? 'Include 5-8 relevant hashtags at the end.' : '', cta ? 'Include a compelling call-to-action.' : ''].filter(Boolean).join(' ');
      await extra.reply(`📱 Writing *${platName}* caption...`);
      await sock.sendPresenceUpdate('composing', extra.from);
      const prompt = `Write an engaging ${platName} caption for: "${description}". Make it authentic, relatable, and platform-appropriate. ${extras} Under 150 words (excluding hashtags).`;
      const result = await APIs.chatAI(prompt, `You are a social media expert who writes viral, authentic ${platName} captions.`);
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`📱 *${platName} Caption*\n━━━━━━━━━━━━━━━━━━━━\n${result}\n━━━━━━━━━━━━━━━━━━━━\n> _Ladybug Bot Mini v3_`);
    } catch (e) { await extra.reply(`❌ ${e.message}`); }
  }
};
