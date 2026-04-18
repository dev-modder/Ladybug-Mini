/**
 * UtilityCmds Command - List all utility commands
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'utilitycmds',
  aliases: ['utilitymenu', 'ulist'],
  category: 'utility',
  description: 'Show all available utility commands',
  usage: '.utilitycmds',

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menu =
        `🔧 *Ladybug Mini — Utility Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `🧮 *Calculators*\n` +
        `  ${p}calc <expr>       — Basic/scientific calculator\n` +
        `  ${p}scientificcalc <expr> — Advanced scientific calc\n\n` +

        `🔐 *Encoding & Security*\n` +
        `  ${p}encode <text>     — Base64 / URL encode/decode\n` +
        `  ${p}hash <text>       — Generate MD5/SHA hash\n` +
        `  ${p}password [length] — Generate secure password\n` +
        `  ${p}uuid              — Generate UUID\n\n` +

        `🌍 *Web & Network*\n` +
        `  ${p}translate <text>  — Translate text\n` +
        `  ${p}weather <city>    — Get weather info\n` +
        `  ${p}timestamp [date]  — Get Unix timestamp\n\n` +

        `📊 *System Tools*\n` +
        `  ${p}ping2             — System ping test\n` +
        `  ${p}sysinfo           — System information\n` +
        `  ${p}benchmark         — Quick performance test\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Ladybug Bot Mini_`;

      await extra.reply(menu);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
