/**
 * AnimeCmds Command - List all anime commands
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'animecmds',
  aliases: ['animemenu', 'alist'],
  category: 'anime',
  description: 'Show all available anime commands',
  usage: '.animecmds',

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menu =
        `🌸 *Ladybug Mini — Anime Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `🧡 *Regular Anime*\n` +
        `  ${p}neko          — Neko girl image\n` +
        `  ${p}nekogirl      — Nekogirl image\n` +
        `  ${p}waifu         — Anime waifu image\n` +
        `  ${p}maid          — Anime maid image\n` +
        `  ${p}foxgirl       — Fox girl anime image\n` +
        `  ${p}uniform       — Anime uniform image\n` +
        `  ${p}random        — Random anime image\n` +
        `  ${p}megumin       — Megumin (KonoSuba) image\n` +
        `  ${p}genshin       — Genshin Impact art\n\n` +

        `🔞 *NSFW Anime (18+)*\n` +
        `  ${p}ahegao        — Ahegao anime image\n` +
        `  ${p}ecchi         — Ecchi anime image\n` +
        `  ${p}hwaifu        — NSFW waifu image\n` +
        `  ${p}hneko         — NSFW neko image\n` +
        `  ${p}oppai         — Oppai anime image\n` +
        `  ${p}milf          — NSFW milf image\n` +
        `  ${p}loli          — Loli anime image\n` +
        `  ${p}konachan      — Konachan NSFW image\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_⚠️ NSFW commands require 18+ group setting_\n` +
        `_Prefix: ${p}  |  Ladybug Bot Mini_`;

      await extra.reply(menu);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
