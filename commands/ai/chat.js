/**
 * Chat Command - Enhanced multi-turn AI conversation with memory (Ladybug V5)
 *
 * Usage: .chat <message>
 *        .chat clear — clear your personal chat history
 *        .chat history — view your last 5 exchanges
 */

'use strict';

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

const DATA_DIR    = path.join(__dirname, '../../data');
const CHAT_PATH   = path.join(DATA_DIR, 'chat_memory.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadMem() {
  try { return fs.existsSync(CHAT_PATH) ? JSON.parse(fs.readFileSync(CHAT_PATH, 'utf8')) : {}; }
  catch (_) { return {}; }
}
function saveMem(m) { fs.writeFileSync(CHAT_PATH, JSON.stringify(m, null, 2), 'utf8'); }

async function askAI(question, history = []) {
  const cfg = (() => { try { delete require.cache[require.resolve('../../config')]; return require('../../config'); } catch (_) { return {}; } })();
  const personality = cfg.aiPersonality || 'You are Ladybug, a helpful and friendly WhatsApp bot assistant.';
  const lang = cfg.botLanguage || 'English';

  const systemPrompt = `${personality} Always respond in ${lang}. Keep responses concise (under 250 words) and conversational.`;

  // Build context from history
  const ctx = history.slice(-6).map(h => `User: ${h.q}\nAssistant: ${h.a}`).join('\n');
  const prompt = ctx ? `${ctx}\nUser: ${question}\nAssistant:` : question;

  const endpoints = [
    `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodeURIComponent(prompt)}&system=${encodeURIComponent(systemPrompt)}`,
    `https://api.siputzx.my.id/api/ai/chatgpt?query=${encodeURIComponent(prompt)}`,
    `https://widipe.com/openai?text=${encodeURIComponent(prompt)}`,
  ];

  for (const url of endpoints) {
    try {
      const r = await axios.get(url, { timeout: 15000 });
      const data = r.data;
      const answer = data?.msg || data?.result || data?.data?.text || data?.response || data?.answer;
      if (answer && typeof answer === 'string' && answer.trim().length > 2) {
        return answer.trim();
      }
    } catch (_) {}
  }
  throw new Error('All AI endpoints failed. Try again in a moment.');
}

module.exports = {
  name: 'chat',
  aliases: ['talk', 'convo', 'memory'],
  category: 'ai',
  description: 'Multi-turn AI conversation with persistent memory',
  usage: '.chat <message> | .chat clear | .chat history',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply('💬 Usage: .chat <message>\n\nI remember our conversations!\n.chat clear — reset memory\n.chat history — view last exchanges');
      }

      const senderJid = msg.key.participant || msg.key.remoteJid;
      const mem = loadMem();
      if (!mem[senderJid]) mem[senderJid] = [];

      const sub = args[0]?.toLowerCase();

      if (sub === 'clear') {
        mem[senderJid] = [];
        saveMem(mem);
        return extra.reply('🧹 Your conversation memory has been cleared.');
      }

      if (sub === 'history') {
        const h = mem[senderJid];
        if (!h.length) return extra.reply('📭 No conversation history yet.');
        const lines = h.slice(-5).map((e, i) => `*Q${i+1}:* ${e.q}\n*A${i+1}:* ${e.a}`);
        return extra.reply(`📜 *Your Last ${lines.length} Exchanges*\n\n${lines.join('\n\n')}`);
      }

      const question = args.join(' ');
      await sock.sendPresenceUpdate('composing', extra.from);

      const answer = await askAI(question, mem[senderJid]);

      mem[senderJid].push({ q: question, a: answer });
      if (mem[senderJid].length > 20) mem[senderJid] = mem[senderJid].slice(-20);
      saveMem(mem);

      await sock.sendPresenceUpdate('paused', extra.from);
      await extra.reply(`🤖 ${answer}`);
    } catch (error) {
      console.error('[chat] Error:', error);
      await extra.reply(`❌ ${error.message}`);
    }
  },
};
