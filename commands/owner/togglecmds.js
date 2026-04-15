/**
 * ToggleCmds Command - Enable or disable specific commands (owner only)
 * Ladybug V5
 *
 * Usage: .togglecmd <command> on|off
 *        .togglecmd list
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../../config.js');
const DATA_DIR    = path.join(__dirname, '../../data');
const DISABLED_PATH = path.join(DATA_DIR, 'disabled_commands.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadDisabled() {
  try { return fs.existsSync(DISABLED_PATH) ? JSON.parse(fs.readFileSync(DISABLED_PATH, 'utf8')) : []; }
  catch (_) { return []; }
}
function saveDisabled(list) { fs.writeFileSync(DISABLED_PATH, JSON.stringify(list, null, 2), 'utf8'); }

module.exports = {
  name: 'togglecmd',
  aliases: ['disablecmd', 'enablecmd', 'togglecmds'],
  category: 'owner',
  description: 'Enable or disable specific bot commands',
  usage: '.togglecmd <command> on|off | .togglecmd list',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const disabled = loadDisabled();

      if (!args.length || args[0]?.toLowerCase() === 'list') {
        if (!disabled.length) return extra.reply('✅ No commands are currently disabled.');
        return extra.reply(`🔒 *Disabled Commands (${disabled.length})*\n\n` + disabled.map((c, i) => `${i + 1}. ${c}`).join('\n'));
      }

      if (args.length < 2) {
        return extra.reply('❌ Usage: .togglecmd <command> on|off\nExample: .togglecmd joke off');
      }

      const cmdName = args[0].toLowerCase();
      const action  = args[1].toLowerCase();

      if (action === 'off') {
        if (disabled.includes(cmdName)) return extra.reply(`⚠️ Command *${cmdName}* is already disabled.`);
        disabled.push(cmdName);
        saveDisabled(disabled);
        return extra.reply(`🔒 Command *${cmdName}* has been *disabled*.`);
      }

      if (action === 'on') {
        const idx = disabled.indexOf(cmdName);
        if (idx === -1) return extra.reply(`✅ Command *${cmdName}* is already enabled.`);
        disabled.splice(idx, 1);
        saveDisabled(disabled);
        return extra.reply(`✅ Command *${cmdName}* has been *re-enabled*.`);
      }

      return extra.reply('❌ Action must be *on* or *off*.');
    } catch (error) {
      console.error('[togglecmd] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
