/**
 * AI Auto-Reply Command (Owner Only)
 * Ladybug Bot Mini V5 | by Dev-Ntando
 *
 * Globally enables AI-powered auto-reply for ALL incoming DMs.
 * When enabled, any message sent to the bot in a private chat
 * that doesn't start with the command prefix will be answered
 * automatically by the AI engine (Ladybug personality).
 *
 * This works differently from .autochat:
 *   .autochat   — toggled per-chat by anyone (group or DM)
 *   .aiautoreply — global DM auto-reply, owner-controlled only
 *
 * Usage:
 *   .aiautoreply on        — enable AI auto-reply for all DMs
 *   .aiautoreply off       — disable AI auto-reply
 *   .aiautoreply status    — check current state
 *   .aiautoreply setprompt <text> — set custom AI personality prompt
 *   .aiautoreply clearprompt      — reset to default personality
 *
 * Aliases: aar, aireply, smartreply, dmreply
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../config.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readConfig() {
  delete require.cache[require.resolve('../../config.js')];
  return require('../../config.js');
}

function writeConfig(key, value) {
  let content = fs.readFileSync(CONFIG_PATH, 'utf8');
  const valStr = typeof value === 'string'
    ? `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    : String(value);

  if (content.includes(`${key}:`)) {
    if (typeof value === 'string') {
      content = content.replace(new RegExp(`${key}:\\s*'[^']*'`), `${key}: ${valStr}`);
    } else {
      content = content.replace(new RegExp(`${key}:\\s*(true|false|\\d+)`), `${key}: ${valStr}`);
    }
  } else {
    // Append before closing brace of module.exports
    content = content.replace(
      /(module\.exports\s*=\s*\{)/,
      `$1\n  ${key}: ${valStr},`
    );
  }

  fs.writeFileSync(CONFIG_PATH, content, 'utf8');
  delete require.cache[require.resolve('../../config.js')];
}

// ─── Module ───────────────────────────────────────────────────────────────────
module.exports = {
  name: 'aiautoreply',
  aliases: ['aar', 'aireply', 'smartreply', 'dmreply'],
  category: 'owner',
  description: 'Toggle global AI auto-reply for all incoming DMs',
  usage: '.aiautoreply on | off | status | setprompt <text> | clearprompt',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const cfg = readConfig();
      const sub = (args[0] || '').toLowerCase();

      // ── status (default) ─────────────────────────────────────────────────
      if (!sub || sub === 'status') {
        const enabled  = cfg.aiAutoReply === true;
        const hasPrompt = !!cfg.aiAutoReplyPrompt;
        return extra.reply(
          `🤖 *AI Auto-Reply — Status*\n\n` +
          `• State:   *${enabled ? '🟢 Enabled' : '🔴 Disabled'}*\n` +
          `• Scope:   Private DMs only\n` +
          `• Prompt:  ${hasPrompt ? '✏️ Custom set' : '📄 Default (Ladybug personality)'}\n\n` +
          `Commands:\n` +
          `  .aiautoreply on\n` +
          `  .aiautoreply off\n` +
          `  .aiautoreply setprompt <text>\n` +
          `  .aiautoreply clearprompt`
        );
      }

      // ── on ───────────────────────────────────────────────────────────────
      if (sub === 'on' || sub === 'enable') {
        writeConfig('aiAutoReply', true);
        return extra.reply(
          `🟢 *AI Auto-Reply Enabled*\n\n` +
          `The bot will now automatically reply to all incoming DMs using AI.\n\n` +
          `• Command messages (starting with prefix) are still handled normally.\n` +
          `• Use *.aiautoreply off* to disable at any time.\n\n` +
          `> Made with ❤️ by Ladybug Bot Mini V5`
        );
      }

      // ── off ──────────────────────────────────────────────────────────────
      if (sub === 'off' || sub === 'disable') {
        writeConfig('aiAutoReply', false);
        return extra.reply(
          `🔴 *AI Auto-Reply Disabled*\n\n` +
          `The bot will no longer auto-reply to DMs.\n\n` +
          `> Made with ❤️ by Ladybug Bot Mini V5`
        );
      }

      // ── setprompt ────────────────────────────────────────────────────────
      if (sub === 'setprompt') {
        const newPrompt = args.slice(1).join(' ').trim();
        if (!newPrompt) {
          return extra.reply(
            `❌ Please provide a prompt.\n\n` +
            `Example: .aiautoreply setprompt You are a helpful Zimbabwean assistant named Ladybug. Keep replies short and friendly.`
          );
        }
        if (newPrompt.length > 600) {
          return extra.reply('❌ Prompt too long (max 600 characters).');
        }
        writeConfig('aiAutoReplyPrompt', newPrompt);
        return extra.reply(
          `✏️ *Custom AI Prompt Set*\n\n` +
          `_${newPrompt}_\n\n` +
          `The bot will use this personality for all AI auto-replies.\n` +
          `Use *.aiautoreply clearprompt* to reset to default.`
        );
      }

      // ── clearprompt ──────────────────────────────────────────────────────
      if (sub === 'clearprompt' || sub === 'resetprompt') {
        let content = fs.readFileSync(CONFIG_PATH, 'utf8');
        content = content.replace(/\n?\s*aiAutoReplyPrompt:\s*'[^']*',?/, '');
        fs.writeFileSync(CONFIG_PATH, content, 'utf8');
        delete require.cache[require.resolve('../../config.js')];
        return extra.reply(
          `🔄 *AI Prompt Reset*\n\n` +
          `The bot will now use the default Ladybug personality for auto-replies.`
        );
      }

      // ── unknown sub ──────────────────────────────────────────────────────
      return extra.reply(
        `❓ Unknown option: *${sub}*\n\n` +
        `Valid options:\n` +
        `  .aiautoreply on\n` +
        `  .aiautoreply off\n` +
        `  .aiautoreply status\n` +
        `  .aiautoreply setprompt <text>\n` +
        `  .aiautoreply clearprompt`
      );

    } catch (error) {
      console.error('[aiautoreply] Error:', error);
      await extra.reply(`❌ Failed: ${error.message}`);
    }
  },
};
