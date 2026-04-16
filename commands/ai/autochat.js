/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║    AutoChat AI v3 — Ladybug Bot Mini                        ║
 * ║    Human-like AI auto-reply for groups and DMs              ║
 * ║    Features: Per-chat memory · Persona modes · Smart filter ║
 * ╚══════════════════════════════════════════════════════════════╝
 * Commands:
 *   .autochat on            — enable auto-reply
 *   .autochat off           — disable
 *   .autochat reset         — clear memory
 *   .autochat status        — show state
 *   .autochat persona <name> — switch personality
 *   .autochat delay <ms>    — set reply delay (500–8000ms)
 */

'use strict';

const APIs = require('../../utils/api');

// ── Persona definitions ──────────────────────────────────────────────────────
const PERSONAS = {
  friendly: {
    name: 'Friendly Ladybug',
    prompt: `You are Ladybug, a warm, friendly, and helpful WhatsApp assistant by Dev-Ntando. 
You chat like a real human friend — casual, encouraging, and fun. Keep replies short and natural.
Use emojis occasionally. Never say you are an AI unless directly asked. 
Respond in the same language the user speaks. If someone is rude, stay calm and politely redirect.`,
  },
  professional: {
    name: 'Pro Ladybug',
    prompt: `You are Ladybug, a professional and knowledgeable WhatsApp assistant by Dev-Ntando.
You give accurate, concise, well-structured answers. Use formal but approachable language.
No unnecessary emojis. Be direct and helpful. Correct misinformation politely.`,
  },
  savage: {
    name: 'Savage Ladybug',
    prompt: `You are Ladybug, a witty, sharp, and slightly savage WhatsApp assistant by Dev-Ntando.
You are funny, sarcastic (but never mean-spirited), and keep people entertained.
You roast gently, joke constantly, and always make people laugh. Keep it fun and harmless.`,
  },
  tutor: {
    name: 'Tutor Ladybug',
    prompt: `You are Ladybug, an educational AI tutor by Dev-Ntando.
You explain things step by step, use examples, and check understanding.
You are patient, encouraging, and cover school/university topics well.
Always make complex topics easy to understand.`,
  },
  therapist: {
    name: 'Support Ladybug',
    prompt: `You are Ladybug, an empathetic and supportive listener by Dev-Ntando.
You listen carefully, validate feelings, offer thoughtful perspective, and encourage.
Never diagnose or prescribe. Suggest professional help for serious issues.
Be warm, gentle, and non-judgmental always.`,
  },
};

// ── In-memory chat sessions ──────────────────────────────────────────────────
// Map<chatId, { enabled, history, persona, delayMs, msgCount }>
const sessions = new Map();

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      enabled: false,
      history: [],
      persona: 'friendly',
      delayMs: 1500,
      msgCount: 0,
    });
  }
  return sessions.get(chatId);
}

function trimHistory(h, max = 30) {
  return h.length > max ? h.slice(h.length - max) : h;
}

function buildPrompt(persona, history, userMsg) {
  const sys = PERSONAS[persona]?.prompt || PERSONAS.friendly.prompt;
  const lines = [sys, ''];
  for (const h of history) {
    lines.push(`${h.role === 'user' ? 'User' : 'Ladybug'}: ${h.content}`);
  }
  lines.push(`User: ${userMsg}`, 'Ladybug:');
  return lines.join('\n');
}

// Simulate realistic human typing delay
const typingDelay = (text, base = 1200) =>
  new Promise(r => setTimeout(r, Math.min(base + text.length * 20, 5500)));

// ── Command handler ──────────────────────────────────────────────────────────
module.exports = {
  name: 'autochat',
  aliases: ['autoreply', 'aichat', 'ladybugai', 'autoai'],
  category: 'ai',
  description: 'Enable human-like AI auto-chat in this group or DM',
  usage: '.autochat on | off | reset | status | persona <name> | delay <ms>',

  async execute(sock, msg, args, extra) {
    const chatId  = extra?.from || msg.key.remoteJid;
    const session = getSession(chatId);
    const sub     = (args[0] || '').toLowerCase();
    const val     = args.slice(1).join(' ').trim();

    switch (sub) {
      case 'on':
      case 'enable': {
        session.enabled = true;
        const p = PERSONAS[session.persona];
        return extra.reply(
          `🤖 *AutoChat AI v3 — Enabled!*\n\n` +
          `I'll now reply to every message in this chat.\n\n` +
          `🎭 Persona: *${p?.name || 'Friendly Ladybug'}*\n` +
          `⏱️ Reply delay: *${session.delayMs}ms*\n` +
          `💬 Memory: *${session.history.length} messages*\n\n` +
          `Commands:\n` +
          `  .autochat off — stop\n` +
          `  .autochat persona friendly|professional|savage|tutor|therapist\n` +
          `  .autochat reset — clear memory\n\n` +
          `> _Ladybug Bot Mini v3 — AutoChat_`
        );
      }

      case 'off':
      case 'disable': {
        session.enabled = false;
        return extra.reply(
          `🔕 *AutoChat AI disabled.*\n\n` +
          `I've stopped auto-replying. Run *.autochat on* to enable again.\n\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }

      case 'reset':
      case 'clear': {
        session.history   = [];
        session.msgCount  = 0;
        return extra.reply(
          `🧹 *Memory cleared!*\n\n` +
          `I've forgotten all previous context. Fresh start! 🌱\n\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }

      case 'status': {
        const p = PERSONAS[session.persona]?.name || 'Friendly Ladybug';
        return extra.reply(
          `📊 *AutoChat Status*\n` +
          `━━━━━━━━━━━━━━━━━\n` +
          `🔘 State:   ${session.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
          `🎭 Persona: ${p}\n` +
          `💬 Memory:  ${session.history.length} messages\n` +
          `⏱️ Delay:   ${session.delayMs}ms\n` +
          `📨 Replies: ${session.msgCount}\n` +
          `━━━━━━━━━━━━━━━━━\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }

      case 'persona':
      case 'mode': {
        const personaKey = val.toLowerCase();
        if (!PERSONAS[personaKey]) {
          return extra.reply(
            `❌ Unknown persona: *${val}*\n\n` +
            `Available personas:\n` +
            Object.entries(PERSONAS).map(([k, v]) => `  • *${k}* — ${v.name}`).join('\n')
          );
        }
        session.persona = personaKey;
        session.history = []; // Reset memory when persona changes
        return extra.reply(
          `🎭 *Persona switched to: ${PERSONAS[personaKey].name}*\n\n` +
          `Memory has been reset for a clean personality switch.\n\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }

      case 'delay': {
        const ms = parseInt(val, 10);
        if (isNaN(ms) || ms < 300 || ms > 8000) {
          return extra.reply('❌ Delay must be between 300ms and 8000ms\nExample: .autochat delay 2000');
        }
        session.delayMs = ms;
        return extra.reply(`⏱️ Reply delay set to *${ms}ms*`);
      }

      default: {
        return extra.reply(
          `🤖 *AutoChat AI v3 — Ladybug*\n\n` +
          `Available commands:\n` +
          `  *.autochat on* — enable auto-reply\n` +
          `  *.autochat off* — disable\n` +
          `  *.autochat status* — check state\n` +
          `  *.autochat reset* — clear memory\n` +
          `  *.autochat persona <name>* — switch personality\n` +
          `  *.autochat delay <ms>* — set reply delay\n\n` +
          `Personas: friendly · professional · savage · tutor · therapist\n\n` +
          `> _Ladybug Bot Mini v3_`
        );
      }
    }
  },

  /**
   * handleIncoming — wire into message handler for EVERY message
   * Usage in handler.js:
   *   const autochat = require('./commands/ai/autochat');
   *   await autochat.handleIncoming(sock, msg, extra);
   */
  async handleIncoming(sock, msg, extra) {
    try {
      const chatId  = extra?.from || msg.key.remoteJid;
      const session = getSession(chatId);

      if (!session.enabled) return false;

      // Extract message text
      const body = (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        ''
      ).trim();

      if (!body) return false;

      // Skip commands
      const cfg = (() => { try { return require('../../config'); } catch(_) { return {}; } })();
      const prefix = cfg.prefix || '.';
      if (body.startsWith(prefix) || body.startsWith('!') || body.startsWith('/')) return false;

      // Skip very short messages unless they're questions
      if (body.length < 2) return false;

      // Build prompt with context
      const trimmed = trimHistory(session.history);
      const prompt  = buildPrompt(session.persona, trimmed, body);

      // Simulate typing
      await sock.sendPresenceUpdate('composing', chatId);
      await typingDelay(body, session.delayMs);
      await sock.sendPresenceUpdate('paused', chatId);

      const answer = await APIs.chatAI(prompt, PERSONAS[session.persona]?.prompt);

      if (!answer || answer.length < 1) return false;

      // Update memory
      session.history.push({ role: 'user',    content: body   });
      session.history.push({ role: 'ladybug', content: answer });
      session.history = trimHistory(session.history, 40);
      session.msgCount++;

      await sock.sendMessage(chatId, { text: answer }, { quoted: msg });
      return true;

    } catch (err) {
      console.error('[AutoChat v3] Error:', err.message);
      return false;
    }
  },

  // Expose sessions for external access (e.g. admin commands)
  sessions,
  PERSONAS,
};
