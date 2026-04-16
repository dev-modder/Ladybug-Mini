/**
 * ╔══════════════════════════════════════════════╗
 * ║     AI Chat — Ladybug Bot Mini v3.0.0        ║
 * ║  Smart multi-model AI with context memory    ║
 * ╚══════════════════════════════════════════════╝
 * Usage: .ai <question>
 *        .ai clear      — clear your context
 *        .ai mode <pro|fast|balanced>
 */

'use strict';

const APIs = require('../../utils/api');

// Per-user short-term context (last 6 exchanges)
const memoryStore = new Map();

function getMemory(jid) {
  if (!memoryStore.has(jid)) memoryStore.set(jid, []);
  return memoryStore.get(jid);
}

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'chatgpt', 'ask', 'ladybug', 'lb'],
  category: 'ai',
  description: 'Chat with AI — smart, fast, context-aware responses',
  usage: '.ai <question> | .ai clear',

  async execute(sock, msg, args, extra) {
    try {
      const senderJid = msg.key.participant || msg.key.remoteJid;
      const sub = args[0]?.toLowerCase();

      // .ai clear
      if (sub === 'clear') {
        memoryStore.set(senderJid, []);
        return extra.reply('🧹 Your AI context has been cleared. Fresh start!');
      }

      // No question
      if (!args.length) {
        return extra.reply(
          `🤖 *Ladybug AI v3*\n\n` +
          `Ask me anything!\n\n` +
          `*Usage:*\n` +
          `  .ai <question>\n` +
          `  .ai clear — clear memory\n\n` +
          `*Examples:*\n` +
          `  .ai What is quantum computing?\n` +
          `  .ai Write a birthday message for my friend\n` +
          `  .ai Explain black holes simply\n\n` +
          `> _Powered by Ladybug Bot Mini v3_`
        );
      }

      const question = args.join(' ');
      const memory   = getMemory(senderJid);

      // Build context-aware prompt
      const ctxLines = memory.slice(-6).map(h => `User: ${h.q}\nLadybug: ${h.a}`).join('\n');
      const fullPrompt = ctxLines
        ? `${ctxLines}\nUser: ${question}\nLadybug:`
        : question;

      await sock.sendPresenceUpdate('composing', extra.from);

      const response = await APIs.chatAI(fullPrompt);

      // Store in memory
      memory.push({ q: question, a: response });
      if (memory.length > 12) memory.splice(0, memory.length - 12);

      await sock.sendPresenceUpdate('paused', extra.from);

      await extra.reply(
        `🤖 *Ladybug AI*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${response}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_💡 Context: ${memory.length} exchanges stored_`
      );

    } catch (error) {
      console.error('[ai] Error:', error.message);
      await extra.reply(`❌ ${error.message}`);
    }
  }
};
