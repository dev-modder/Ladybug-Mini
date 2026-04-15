/**
 * ClearMemory Command - Clear AI conversation memory (owner only)
 * Ladybug V5
 *
 * Usage: .clearmemory [all|<number>]
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const DATA_DIR    = path.join(__dirname, '../../data');
const MEMORY_PATH = path.join(DATA_DIR, 'aiautoreply_memory.json');

module.exports = {
  name: 'clearmemory',
  aliases: ['clearai', 'resetmemory', 'clearchat'],
  category: 'owner',
  description: 'Clear AI conversation memory for a user or all users',
  usage: '.clearmemory all | .clearmemory <number>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      if (!fs.existsSync(MEMORY_PATH)) {
        return extra.reply('✅ AI memory is already empty.');
      }

      const sub = args[0]?.toLowerCase();

      if (!sub || sub === 'all') {
        fs.writeFileSync(MEMORY_PATH, '{}', 'utf8');
        return extra.reply('🧹 *All AI conversation memory cleared.*');
      }

      const num = sub.replace(/[^0-9]/g, '');
      const jid = `${num}@s.whatsapp.net`;

      let mem = {};
      try { mem = JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8')); } catch (_) {}

      if (!mem[jid]) return extra.reply(`⚠️ No memory found for *+${num}*.`);

      delete mem[jid];
      fs.writeFileSync(MEMORY_PATH, JSON.stringify(mem, null, 2), 'utf8');
      await extra.reply(`🧹 Memory cleared for *+${num}*.`);
    } catch (error) {
      console.error('[clearmemory] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
