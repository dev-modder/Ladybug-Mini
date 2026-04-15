/**
 * WarnConfig Command - Configure warn system thresholds and actions (owner only)
 * Ladybug V5.2
 *
 * Usage:
 *   .warnconfig status            — view current settings
 *   .warnconfig setmax <number>   — set max warns before action (default: 3)
 *   .warnconfig setaction <kick|ban|mute> — set action at max warns
 *   .warnconfig setexpiry <days>  — warns expire after N days (0 = never)
 *   .warnconfig reset             — reset to defaults
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const DATA_DIR    = path.join(__dirname, '../../data');
const CONFIG_PATH = path.join(DATA_DIR, 'warn_config.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULTS = {
  maxWarns:    3,
  action:      'kick',      // kick | ban | mute
  expiryDays:  0,           // 0 = never expire
  warnMessage: 'You have been warned. {current}/{max} warnings.',
  updatedAt:   null,
};

function loadConfig() {
  try { return fs.existsSync(CONFIG_PATH) ? { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) } : { ...DEFAULTS }; }
  catch (_) { return { ...DEFAULTS }; }
}
function saveConfig(c) { c.updatedAt = new Date().toISOString(); fs.writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2), 'utf8'); }

module.exports = {
  name: 'warnconfig',
  aliases: ['warnset', 'configwarn', 'warnsetup'],
  category: 'owner',
  description: 'Configure the warn system (max warns, action, expiry)',
  usage: '.warnconfig status | setmax <n> | setaction <kick|ban|mute> | setexpiry <days>',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const cfg = loadConfig();
      const sub = args[0]?.toLowerCase();

      if (!sub || sub === 'status') {
        return extra.reply(
          `⚠️ *Warn System Config*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🔢 Max Warns:  *${cfg.maxWarns}*\n` +
          `⚡ Action:     *${cfg.action}* (at max warns)\n` +
          `⏳ Expiry:     *${cfg.expiryDays > 0 ? cfg.expiryDays + ' days' : 'Never (permanent)'}*\n` +
          `💬 Warn Msg:   ${cfg.warnMessage}\n\n` +
          `Commands:\n` +
          `.warnconfig setmax <number>\n` +
          `.warnconfig setaction kick|ban|mute\n` +
          `.warnconfig setexpiry <days> (0 = never)\n` +
          `.warnconfig setmsg <message>  ({current} {max} placeholders)\n` +
          `.warnconfig reset`
        );
      }

      if (sub === 'setmax') {
        const n = parseInt(args[1]);
        if (isNaN(n) || n < 1 || n > 20) return extra.reply('❌ Max warns must be 1-20.');
        cfg.maxWarns = n;
        saveConfig(cfg);
        return extra.reply(`✅ Max warns set to *${n}*. Users will be ${cfg.action}ed at ${n} warnings.`);
      }

      if (sub === 'setaction') {
        const action = args[1]?.toLowerCase();
        if (!['kick', 'ban', 'mute'].includes(action)) return extra.reply('❌ Action must be: kick, ban, or mute');
        cfg.action = action;
        saveConfig(cfg);
        return extra.reply(`✅ Warn action set to *${action}* at ${cfg.maxWarns} warnings.`);
      }

      if (sub === 'setexpiry') {
        const days = parseInt(args[1]);
        if (isNaN(days) || days < 0) return extra.reply('❌ Expiry must be 0 or more days. (0 = never expires)');
        cfg.expiryDays = days;
        saveConfig(cfg);
        return extra.reply(days === 0 ? '✅ Warn expiry disabled. Warnings are now permanent.' : `✅ Warns expire after *${days} day(s)*.`);
      }

      if (sub === 'setmsg') {
        const message = args.slice(1).join(' ').trim();
        if (!message) return extra.reply('❌ Usage: .warnconfig setmsg <message>  (use {current} and {max})');
        cfg.warnMessage = message;
        saveConfig(cfg);
        return extra.reply(`✅ Warn message updated:\n${message}`);
      }

      if (sub === 'reset') {
        saveConfig({ ...DEFAULTS });
        return extra.reply('✅ Warn config reset to defaults.');
      }

      return extra.reply('❌ Unknown sub-command. Use: status, setmax, setaction, setexpiry, setmsg, reset');
    } catch (error) {
      console.error('[warnconfig] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
