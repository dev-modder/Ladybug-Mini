/**
 * TextCmds Command - List all text maker commands
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'textcmds',
  aliases: ['textmenu', 'tlist'],
  category: 'textmaker',
  description: 'Show all available text maker commands',
  usage: '.textcmds',

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menu =
        `✏️ *Ladybug Mini — Text Maker Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `🎨 *Styles*\n` +
        `  ${p}fire <text>       — 🔥 Fire effect text\n` +
        `  ${p}neon <text>       — 💜 Neon glow text\n` +
        `  ${p}ice <text>        — 🧊 Ice frost text\n` +
        `  ${p}glitch <text>     — 🔀 Glitch effect text\n` +
        `  ${p}hacker <text>     — 💻 Hacker terminal text\n` +
        `  ${p}matrix <text>     — 🟩 Matrix text\n` +
        `  ${p}metallic <text>   — 🪙 Metallic text\n` +
        `  ${p}devil <text>      — 😈 Devil/red text\n` +
        `  ${p}light <text>      — ✨ Light/bright text\n` +
        `  ${p}snow <text>       — ❄️ Snow/winter text\n\n` +

        `🌸 *Special*\n` +
        `  ${p}blackpink <text>  — 💗 Blackpink style\n` +
        `  ${p}arena <text>      — 🏟️ Arena text\n` +
        `  ${p}1917 <text>       — 🎬 1917 film style\n` +
        `  ${p}impressive <text> — 🌟 Impressive style\n` +
        `  ${p}leaves <text>     — 🍃 Leaves effect\n` +
        `  ${p}purple <text>     — 💜 Purple text\n` +
        `  ${p}sand <text>       — 🏜️ Sand/desert text\n` +
        `  ${p}thunder <text>    — ⚡ Thunder effect\n\n` +

        `🔮 *New Styles*\n` +
        `  ${p}cyberpunk <text>  — 🔮 Cyberpunk neon\n` +
        `  ${p}galaxy <text>     — 🌌 Galaxy/space text\n` +
        `  ${p}ocean <text>      — 🌊 Ocean wave text\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Ladybug Bot Mini_`;

      await extra.reply(menu);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
