/**
 * Riddle Command - Get a random riddle (answer shown after 30 seconds or on request)
 * Ladybug Bot V5 | by Dev-Ntando
 */

'use strict';

const pendingRiddles = new Map(); // jid → { answer, timeoutId }

const RIDDLES = [
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "An echo" },
  { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
  { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. I have roads, but no cars drive there. What am I?", a: "A map" },
  { q: "What has keys but no locks, space but no room, and you can enter but can't go inside?", a: "A keyboard" },
  { q: "I'm light as a feather, but even the world's strongest man can't hold me for more than a few minutes. What am I?", a: "Breath" },
  { q: "What comes once in a minute, twice in a moment, but never in a thousand years?", a: "The letter M" },
  { q: "I have hands but I can't clap. What am I?", a: "A clock" },
  { q: "What gets wetter as it dries?", a: "A towel" },
  { q: "I go up but never come down. What am I?", a: "Your age" },
  { q: "What has a head, a tail, but no body?", a: "A coin" },
  { q: "What has to be broken before you can use it?", a: "An egg" },
  { q: "I'm tall when I'm young, and short when I'm old. What am I?", a: "A candle" },
  { q: "What has one eye but can't see?", a: "A needle" },
  { q: "What can travel around the world while staying in a corner?", a: "A stamp" },
  { q: "The more you have of it, the less you see. What is it?", a: "Darkness" },
  { q: "What has many teeth but cannot bite?", a: "A comb" },
  { q: "What can you break, even if you never pick it up or touch it?", a: "A promise" },
  { q: "I have branches but no fruit, trunk, or leaves. What am I?", a: "A bank" },
  { q: "What is full of holes but still holds a lot of weight?", a: "A net" },
  { q: "What has words but never speaks?", a: "A book" },
];

module.exports = {
  name: 'riddle',
  aliases: ['riddleme', 'brainteaser', 'riddles'],
  category: 'fun',
  description: 'Get a random riddle. Use .riddle answer to reveal the answer.',
  usage: '.riddle | .riddle answer',

  async execute(sock, msg, args, extra) {
    try {
      const jid = extra.from;

      // Show answer for pending riddle
      if (args[0] && args[0].toLowerCase() === 'answer') {
        const pending = pendingRiddles.get(jid);
        if (!pending) {
          return extra.reply('❓ No active riddle! Ask one with .riddle first.');
        }
        clearTimeout(pending.timeoutId);
        pendingRiddles.delete(jid);
        return extra.reply(`💡 *The answer is:* ${pending.answer}`);
      }

      // Cancel previous riddle if any
      const existing = pendingRiddles.get(jid);
      if (existing) {
        clearTimeout(existing.timeoutId);
        pendingRiddles.delete(jid);
      }

      const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];

      // Auto-reveal after 60 seconds
      const timeoutId = setTimeout(async () => {
        pendingRiddles.delete(jid);
        try {
          await sock.sendMessage(jid, {
            text: `⏰ *Time's up!*\nThe answer was: *${riddle.a}*`,
          });
        } catch { /* ignore if chat closed */ }
      }, 60_000);

      pendingRiddles.set(jid, { answer: riddle.a, timeoutId });

      await extra.reply(
        `🧩 *Riddle Time!*\n\n` +
        `❓ ${riddle.q}\n\n` +
        `_Type_ *.riddle answer* _to reveal, or wait 60 seconds._`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
