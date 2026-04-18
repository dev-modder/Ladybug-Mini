/**
 * FunCmds Command - List all fun commands
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'funcmds',
  aliases: ['funmenu', 'flist'],
  category: 'fun',
  description: 'Show all available fun commands',
  usage: '.funcmds',

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menu =
        `🎮 *Ladybug Mini — Fun Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `🎲 *Games*\n` +
        `  ${p}8ball <question>   — Ask the magic 8ball\n` +
        `  ${p}coinflip           — Flip a coin\n` +
        `  ${p}dice               — Roll a dice\n` +
        `  ${p}rps <rock|paper|scissors> — Rock Paper Scissors\n` +
        `  ${p}trivia             — Random trivia question\n` +
        `  ${p}hangman            — Play hangman\n` +
        `  ${p}numberguess        — Number guessing game\n` +
        `  ${p}roulette           — Russian roulette\n\n` +

        `😂 *Humor*\n` +
        `  ${p}joke               — Random joke\n` +
        `  ${p}meme               — Random meme\n` +
        `  ${p}memesearch <term>  — Search for memes\n` +
        `  ${p}insult             — Random insult\n` +
        `  ${p}pies               — Random pie chart\n` +
        `  ${p}pickup             — Cheesy pickup line\n\n` +

        `💬 *Social*\n` +
        `  ${p}truth              — Truth question\n` +
        `  ${p}dare               — Dare challenge\n` +
        `  ${p}wouldyourather     — Would you rather?\n` +
        `  ${p}neverhavei         — Never have I ever\n` +
        `  ${p}confess <secret>   — Anonymous confession\n` +
        `  ${p}ship @user1 @user2 — Ship two people\n` +
        `  ${p}gayrate @user      — Gay rate meter\n\n` +

        `❤️ *Compliments & Quotes*\n` +
        `  ${p}complimentry @user — Random compliment\n` +
        `  ${p}flirt @user        — Flirty message\n` +
        `  ${p}quote              — Motivational quote\n` +
        `  ${p}define <word>      — Word definition\n` +
        `  ${p}urban <word>       — Urban Dictionary\n\n` +

        `⏰ *Reminders*\n` +
        `  ${p}remind <min> <msg> — Set a reminder\n` +
        `  ${p}riddle             — Random riddle\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Ladybug Bot Mini_`;

      await extra.reply(menu);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
