/**
 * Caption Command - AI generates social media captions (Ladybug V5)
 *
 * Usage: .caption <description of photo/post>
 *        .caption <platform> | <description>
 *
 * Platforms: instagram, twitter, tiktok, facebook, linkedin
 */

'use strict';

const axios = require('axios');

async function callAI(prompt) {
  const endpoints = [
    `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/chatgpt?query=${encodeURIComponent(prompt)}`,
    `https://widipe.com/openai?text=${encodeURIComponent(prompt)}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await axios.get(url, { timeout: 12000 });
      const d = r.data;
      const ans = d?.msg || d?.result || d?.data?.text || d?.response;
      if (ans && ans.trim().length > 5) return ans.trim();
    } catch (_) {}
  }
  throw new Error('AI unavailable right now.');
}

const PLATFORMS = ['instagram', 'twitter', 'tiktok', 'facebook', 'linkedin'];

module.exports = {
  name: 'caption',
  aliases: ['postcaption', 'igcaption', 'socialcaption'],
  category: 'ai',
  description: 'Generate social media captions using AI',
  usage: '.caption <description> | .caption <platform> | <description>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          '📸 *Caption Generator*\n\n' +
          'Usage:\n.caption <description>\n.caption instagram | sunset selfie at the beach\n\n' +
          `Platforms: ${PLATFORMS.join(', ')}`
        );
      }

      const full = args.join(' ');
      let platform = 'Instagram';
      let description = full;

      if (full.includes('|')) {
        const parts = full.split('|');
        const p = parts[0].trim().toLowerCase();
        if (PLATFORMS.includes(p)) {
          platform    = p.charAt(0).toUpperCase() + p.slice(1);
          description = parts.slice(1).join('|').trim();
        }
      }

      await sock.sendPresenceUpdate('composing', extra.from);

      const platformGuide = {
        Instagram: 'engaging with emojis and 5-8 relevant hashtags',
        Twitter:   'under 280 characters, punchy and witty',
        Tiktok:    'trendy, energetic, and fun with hashtags',
        Facebook:  'conversational and shareable, medium length',
        Linkedin:  'professional and insightful, no excessive hashtags',
      };

      const guide = platformGuide[platform] || 'engaging and shareable';
      const prompt = `Write a ${platform} caption for this: "${description}". Make it ${guide}. Keep it natural and authentic. Only output the caption itself.`;

      const result = await callAI(prompt);
      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`📸 *${platform} Caption*\n\n${result}`);
    } catch (error) {
      console.error('[caption] Error:', error);
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
