/**
 * AddOwner / RemoveOwner Command - Manage bot owner numbers (owner only)
 * Ladybug V5
 *
 * Usage:
 *   .addowner @mention | <number>    — add a new owner
 *   .removeowner @mention | <number> — remove an owner
 *   .addowner list                   — list all current owners
 *
 * Owners have full bot access (ownerOnly commands).
 */

const fs   = require('fs');
const path = require('path');

function getJidNumber(jid) {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
}

module.exports = {
  name: 'addowner',
  aliases: ['removeowner', 'ownerlist', 'addop', 'removeop'],
  category: 'owner',
  description: 'Add or remove bot owners',
  usage: '.addowner @mention|number | .removeowner @mention|number | .addowner list',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const config     = require('../../config');
      const configPath = path.join(__dirname, '../../config.js');
      const cmd        = msg.message?.conversation?.split(' ')[0]?.replace(/^[^a-z]*/i, '').toLowerCase()
                      || msg.message?.extendedTextMessage?.text?.split(' ')[0]?.replace(/^[^a-z]*/i, '').toLowerCase()
                      || 'addowner';

      const isRemove = cmd === 'removeowner' || cmd === 'removeop';

      // Normalise owner list to array of numbers (no @s.whatsapp.net)
      let owners = Array.isArray(config.ownerNumber)
        ? [...config.ownerNumber]
        : [config.ownerNumber].filter(Boolean);
      owners = owners.map(getJidNumber);

      // List owners
      if (args[0]?.toLowerCase() === 'list' || !args[0]) {
        if (owners.length === 0) {
          return extra.reply('👤 No owners configured.');
        }
        const list = owners.map((n, i) => `${i + 1}. \`${n}\``).join('\n');
        return extra.reply(
          `👥 *Bot Owners (${owners.length})*\n━━━━━━━━━━━━━━━━━━━━\n${list}\n━━━━━━━━━━━━━━━━━━━━`
        );
      }

      // Resolve target number
      let targetNum = null;

      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentions?.[0]) {
        targetNum = getJidNumber(mentions[0]);
      }

      if (!targetNum) {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        if (ctx?.participant) targetNum = getJidNumber(ctx.participant);
      }

      if (!targetNum && args[0]) {
        targetNum = args[0].replace(/\D/g, '');
      }

      if (!targetNum || targetNum.length < 7) {
        return extra.reply(
          `Usage:\n` +
          `  .addowner @mention | <number>\n` +
          `  .removeowner @mention | <number>\n` +
          `  .addowner list`
        );
      }

      if (isRemove) {
        if (!owners.includes(targetNum)) {
          return extra.reply(`❌ \`${targetNum}\` is not in the owner list.`);
        }
        if (owners.length === 1) {
          return extra.reply('❌ Cannot remove the last owner!');
        }
        owners = owners.filter((n) => n !== targetNum);
        await extra.reply(`✅ Removed \`${targetNum}\` from owners.`);
      } else {
        if (owners.includes(targetNum)) {
          return extra.reply(`❌ \`${targetNum}\` is already an owner.`);
        }
        owners.push(targetNum);
        await extra.reply(`✅ Added \`${targetNum}\` as an owner.`);
      }

      // Write updated owners back to config
      let configContent = fs.readFileSync(configPath, 'utf8');
      const arrayStr    = JSON.stringify(owners);

      if (configContent.includes('ownerNumber:')) {
        configContent = configContent.replace(
          /ownerNumber:\s*(\[.*?\]|'[^']*'|"[^"]*")/s,
          `ownerNumber: ${arrayStr}`
        );
      } else {
        configContent = configContent.replace(
          /(module\.exports\s*=\s*\{)/,
          `$1\n  ownerNumber: ${arrayStr},`
        );
      }

      fs.writeFileSync(configPath, configContent, 'utf8');
      delete require.cache[require.resolve('../../config')];

    } catch (error) {
      console.error('[addowner] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
