/**
 * ╔══════════════════════════════════════════════╗
 * ║       AutoChat AI - Ladybug Bot Mini V5      ║
 * ║   Human-like AI auto-reply for all chats     ║
 * ║            Made with ❤️                      ║
 * ╚══════════════════════════════════════════════╝
 */

const APIs = require('../../utils/api');

// ─── In-memory store ─────────────────────────────────────────────────────────
// Map<chatId, { enabled: boolean, history: Array<{role,content}> }>
const chatSessions = new Map();

// ─── Personality system prompt ────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Ladybug, a friendly, witty, and helpful WhatsApp assistant created by Ladybug Bot Mini V5.
You chat like a real human — casual, warm, and conversational. Keep replies short and natural unless the user asks for detail.
Use emojis occasionally but don't overdo it. Never say you are an AI unless directly asked.
Never use bullet lists unless the user explicitly asks for a list. Respond in the same language the user speaks.
If someone is rude, stay calm and politely redirect. You remember the recent conversation context.`;

// ─── Typing simulation delay ─────────────────────────────────────────────────
const typingDelay = (text) =>
  new Promise(r => setTimeout(r, Math.min(1500 + text.length * 18, 5000)));

// ─── Trim history to last N messages to stay within token limits ──────────────
const trimHistory = (history, max = 20) =>
  history.length > max ? history.slice(history.length - max) : history;

// ─── Get or create session ────────────────────────────────────────────────────
const getSession = (chatId) => {
  if (!chatSessions.has(chatId)) {
    chatSessions.set(chatId, { enabled: false, history: [] });
  }
  return chatSessions.get(chatId);
};

// ─── Build prompt with history ────────────────────────────────────────────────
const buildPrompt = (history, userMessage) => {
  const lines = [SYSTEM_PROMPT, ''];
  for (const h of history) {
    lines.push(`${h.role === 'user' ? 'User' : 'Ladybug'}: ${h.content}`);
  }
  lines.push(`User: ${userMessage}`);
  lines.push('Ladybug:');
  return lines.join('\n');
};

// ─── Module export ────────────────────────────────────────────────────────────
module.exports = {
  name: 'autochat',
  aliases: ['autoreply', 'aichat', 'ladybugai'],
  category: 'ai',
  description: 'Enable human-like AI auto-chat in this group/DM',
  usage: '.autochat on | off | reset | status',

  /**
   * Called by command handler when user runs .autochat
   */
  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;
    const session = getSession(chatId);
    const sub = (args[0] || '').toLowerCase();

    switch (sub) {
      case 'on':
      case 'enable': {
        session.enabled = true;
        return extra.reply(
          '🤖 *AutoChat AI enabled!*\n\n' +
          'I will now respond to every message in this chat like a real human. 💬\n' +
          'Type `.autochat off` to disable.\n\n' +
          '> Made with ❤️ by Ladybug Bot Mini V5'
        );
      }

      case 'off':
      case 'disable': {
        session.enabled = false;
        return extra.reply(
          '🔕 *AutoChat AI disabled.*\n\n' +
          'I\'ll stop auto-replying. Run `.autochat on` to enable again.\n\n' +
          '> Made with ❤️ by Ladybug Bot Mini V5'
        );
      }

      case 'reset':
      case 'clear': {
        session.history = [];
        return extra.reply(
          '🧹 *Conversation memory cleared!*\n\n' +
          'I\'ve forgotten our chat history. Fresh start! 🌱\n\n' +
          '> Made with ❤️ by Ladybug Bot Mini V5'
        );
      }

      case 'status': {
        return extra.reply(
          `📊 *AutoChat Status*\n\n` +
          `• State: ${session.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
          `• Memory: ${session.history.length} messages stored\n\n` +
          '> Made with ❤️ by Ladybug Bot Mini V5'
        );
      }

      default: {
        return extra.reply(
          '🤖 *AutoChat AI — Ladybug V5*\n\n' +
          'Commands:\n' +
          '• `.autochat on` — enable auto-reply\n' +
          '• `.autochat off` — disable auto-reply\n' +
          '• `.autochat reset` — clear memory\n' +
          '• `.autochat status` — check state\n\n' +
          '> Made with ❤️ by Ladybug Bot Mini V5'
        );
      }
    }
  },

  /**
   * Called by the main message handler for EVERY incoming message.
   * Wire this into your message handler like:
   *
   *   const autochat = require('./commands/ai/autochat');
   *   await autochat.handleIncoming(sock, msg, extra);
   *
   * Place it BEFORE command parsing so it can intercept non-command messages.
   */
  async handleIncoming(sock, msg, extra) {
    try {
      const chatId = extra?.from || msg.key.remoteJid;
      const session = getSession(chatId);

      if (!session.enabled) return false; // not active, skip

      // Extract message text
      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      if (!body.trim()) return false;  // no text to reply to
      if (body.startsWith('.') || body.startsWith('!') || body.startsWith('/')) return false; // skip commands

      // Build prompt with context history
      const trimmed = trimHistory(session.history);
      const prompt = buildPrompt(trimmed, body.trim());

      // Simulate typing presence
      await sock.sendPresenceUpdate('composing', chatId);
      await typingDelay(body);
      await sock.sendPresenceUpdate('paused', chatId);

      // Call AI
      const response = await APIs.chatAI(prompt);
      const answer = (
        response?.response ||
        response?.msg ||
        response?.data?.msg ||
        response?.data?.response ||
        (typeof response === 'string' ? response : null) ||
        '...'
      ).trim();

      if (!answer || answer === '...') return false;

      // Update history
      session.history.push({ role: 'user', content: body.trim() });
      session.history.push({ role: 'bot', content: answer });
      session.history = trimHistory(session.history, 40);

      // Send reply
      await sock.sendMessage(chatId, { text: answer }, { quoted: msg });
      return true;

    } catch (err) {
      console.error('[AutoChat V5] Error:', err.message);
      return false;
    }
  }
};
