/**
 * SetAIPersonality Command - Set a custom personality/system prompt for AI (owner only)
 * Ladybug V5
 *
 * Usage: .setaipersonality <personality text>
 *        .setaipersonality reset
 *        .setaipersonality view
 *
 * Presets: .setaipersonality preset <friendly|strict|funny|teacher|therapist|girlfriend>
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const CONFIG_PATH = path.join(__dirname, '../../config.js');

function writeStringKey(key, value) {
  let c = fs.readFileSync(CONFIG_PATH, 'utf8');
  const v = "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (c.includes(key + ':')) {
    c = c.replace(new RegExp(key + ":\\s*'[^']*'"), key + ': ' + v);
  } else {
    c = c.replace(/(module\.exports\s*=\s*\{)/, '$1\n  ' + key + ': ' + v + ',');
  }
  fs.writeFileSync(CONFIG_PATH, c, 'utf8');
  delete require.cache[require.resolve('../../config.js')];
}

const PRESETS = {
  friendly:   'You are a friendly, warm, and helpful AI assistant. You use emojis and speak casually. You are supportive and encouraging.',
  strict:     'You are a strict, professional AI assistant. You give direct, concise answers with no unnecessary chatter. You are formal and precise.',
  funny:      'You are a hilarious comedian AI. You crack jokes, use puns, and keep everything light-hearted and funny. You mix humor with helpful answers.',
  teacher:    'You are a patient and knowledgeable teacher. You explain everything step-by-step in simple terms, give examples, and check understanding.',
  therapist:  'You are a compassionate and empathetic listener. You are calm, non-judgmental, and supportive. You help users process their feelings and find clarity.',
  girlfriend: 'You are a caring, affectionate, and playful AI companion. You are supportive, fun, and loving in your responses.',
  default:    'You are Ladybug, a helpful and friendly WhatsApp bot assistant.',
};

module.exports = {
  name: 'setaipersonality',
  aliases: ['aipersonality', 'botpersonality', 'aiprompt'],
  category: 'owner',
  description: 'Set the AI personality/system prompt for all AI responses',
  usage: '.setaipersonality <text> | preset <name> | reset | view',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const sub = args[0]?.toLowerCase();

      if (!sub || sub === 'view') {
        const cfg = require('../../config');
        return extra.reply(
          `🧠 *Current AI Personality*\n\n${cfg.aiPersonality || PRESETS.default}\n\n` +
          `Presets: friendly, strict, funny, teacher, therapist, girlfriend, default\n` +
          `Usage: .setaipersonality preset <name>`
        );
      }

      if (sub === 'reset') {
        writeStringKey('aiPersonality', PRESETS.default);
        return extra.reply('✅ AI personality reset to default.');
      }

      if (sub === 'preset') {
        const name = args[1]?.toLowerCase();
        if (!name || !PRESETS[name]) {
          return extra.reply(`❌ Unknown preset. Available: ${Object.keys(PRESETS).join(', ')}`);
        }
        writeStringKey('aiPersonality', PRESETS[name]);
        return extra.reply(`✅ AI personality set to *${name}* preset.\n\n${PRESETS[name]}`);
      }

      const personality = args.join(' ').trim();
      if (!personality) return extra.reply('❌ Please provide a personality description.');
      writeStringKey('aiPersonality', personality);
      await extra.reply(`✅ *AI Personality Updated!*\n\n${personality}`);
    } catch (error) {
      console.error('[setaipersonality] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
