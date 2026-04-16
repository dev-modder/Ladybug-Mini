/**
 * ╔══════════════════════════════════════════════════╗
 * ║  Chat — Persistent multi-turn AI (Ladybug v3)   ║
 * ║  .chat <msg> | clear | history | topic <topic>  ║
 * ╚══════════════════════════════════════════════════╝
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const APIs = require('../../utils/api');

const DATA_DIR  = path.join(__dirname, '../../data');
const CHAT_FILE = path.join(DATA_DIR, 'chat_memory.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadMem()  { try { return JSON.parse(fs.readFileSync(CHAT_FILE, 'utf8')); } catch(_) { return {}; } }
function saveMem(m) { fs.writeFileSync(CHAT_FILE, JSON.stringify(m, null, 2), 'utf8'); }

module.exports = {
  name: 'chat',
  aliases: ['talk', 'convo', 'memory', 'remember'],
  category: 'ai',
  description: 'Multi-turn AI conversation with persistent memory per user',
  usage: '.chat <message> | .chat clear | .chat history | .chat topic <topic>',

  async execute(sock, msg, args, extra) {
    try {
      const senderJid = msg.key.participant || msg.key.remoteJid;
      const mem = loadMem();
      if (!mem[senderJid]) mem[senderJid] = { history: [], topic: null };

      if (!args.length) {
        return extra.reply(
          `💬 *Chat (Memory AI) v3*\n\n` +
          `I remember your previous messages!\n\n` +
          `*Commands:*\n` +
          `  .chat <message> — talk to me\n` +
          `  .chat clear — wipe your memory\n` +
          `  .chat history — see past exchanges\n` +
          `  .chat topic <topic> — focus the conversation\n\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }

      const sub = args[0]?.toLowerCase();

      if (sub === 'clear' || sub === 'reset') {
        mem[senderJid] = { history: [], topic: null };
        saveMem(mem);
        return extra.reply('🧹 Your conversation memory has been cleared. Fresh start!');
      }

      if (sub === 'history') {
        const h = mem[senderJid].history;
        if (!h.length) return extra.reply('📭 No conversation history yet. Start by typing .chat hello!');
        const lines = h.slice(-5).map((e, i) => `*Q${i+1}:* ${e.q}\n*A${i+1}:* ${e.a}`);
        return extra.reply(`📜 *Your Last ${lines.length} Exchanges*\n\n${lines.join('\n\n')}`);
      }

      if (sub === 'topic') {
        const topic = args.slice(1).join(' ').trim();
        if (!topic) return extra.reply('❌ Provide a topic. E.g.: .chat topic science');
        mem[senderJid].topic = topic;
        saveMem(mem);
        return extra.reply(`🎯 Conversation focus set to: *${topic}*\n\nNow chat away! I'll keep the topic in context.`);
      }

      const question = args.join(' ');
      const userData = mem[senderJid];
      const topicCtx = userData.topic ? `This conversation is focused on: ${userData.topic}. ` : '';

      // Build context prompt
      const ctxParts = userData.history.slice(-8).map(h => `User: ${h.q}\nLadybug: ${h.a}`).join('\n');
      const fullPrompt = [
        topicCtx + 'You are Ladybug, a helpful friendly WhatsApp assistant. You remember the conversation context.',
        '',
        ctxParts,
        `User: ${question}`,
        'Ladybug:',
      ].filter(Boolean).join('\n');

      await sock.sendPresenceUpdate('composing', extra.from);
      const answer = await APIs.chatAI(fullPrompt);
      await sock.sendPresenceUpdate('paused', extra.from);

      userData.history.push({ q: question, a: answer });
      if (userData.history.length > 20) userData.history = userData.history.slice(-20);
      saveMem(mem);

      await extra.reply(
        `💬 ${answer}\n\n` +
        `_Memory: ${userData.history.length}/20 exchanges stored_`
      );

    } catch (error) {
      console.error('[chat] Error:', error.message);
      await extra.reply(`❌ ${error.message}`);
    }
  }
};
