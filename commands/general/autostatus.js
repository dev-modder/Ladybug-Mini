/**
 * AutoStatus Command - Automatically post WhatsApp Status updates
 * with powerful quotes from Mr Ntando.
 *
 * Commands:
 *   .autostatus on           — start auto-posting status every interval
 *   .autostatus off          — stop auto-posting
 *   .autostatus now          — post one status immediately
 *   .autostatus interval 30  — set interval in minutes (default: 60)
 *   .autostatus list         — view all quotes
 *   .autostatus add <quote>  — add a custom Ntando quote
 */

const config = require('../../config');

// ─────────────────────────────────────────────
// 🔥 Mr Ntando's Signature Quotes
// ─────────────────────────────────────────────
const NTANDO_QUOTES = [
  "The grind doesn't care about your feelings — show up anyway. 💪\n— *Mr Ntando*",
  "Average people talk about what they want. Winners build it in silence. 🔇\n— *Mr Ntando*",
  "Your excuses are just someone else's success story waiting to happen. 🚀\n— *Mr Ntando*",
  "Stop waiting for the perfect moment. Attack the moment you have. ⚔️\n— *Mr Ntando*",
  "Comfort is the enemy of progress. Get uncomfortable. Get great. 🔥\n— *Mr Ntando*",
  "People will doubt you. Let them. Doubt doesn't pay your bills — results do. 💰\n— *Mr Ntando*",
  "You're not tired. You're just not connected to your purpose yet. 🎯\n— *Mr Ntando*",
  "The version of you that wins is already inside you. Stop feeding the one that quits. 🧠\n— *Mr Ntando*",
  "Work so hard that when opportunity arrives, it already knows your address. 🏠\n— *Mr Ntando*",
  "They laughed at your dream. They'll clap at your success. Both are fuel. ⚡\n— *Mr Ntando*",
  "Every setback is a setup. Every failure is a curriculum. Study it. 📚\n— *Mr Ntando*",
  "Your network is your net worth — but only if you bring value to the table. 🤝\n— *Mr Ntando*",
  "Small daily improvements lead to stunning long-term results. Trust the process. 📈\n— *Mr Ntando*",
  "Discipline is doing what needs to be done, even when you don't feel like a champion. 👑\n— *Mr Ntando*",
  "The world makes room for someone who knows where they are going. Know your direction. 🧭\n— *Mr Ntando*",
  "You didn't come this far to only come this far. Keep moving. 🛤️\n— *Mr Ntando*",
  "Your reputation is built in years and destroyed in seconds. Guard it. 🛡️\n— *Mr Ntando*",
  "Poverty is a mindset before it is a circumstance. Change your thinking first. 💡\n— *Mr Ntando*",
  "The people who change the world don't wait for permission. Neither should you. 🌍\n— *Mr Ntando*",
  "A lion doesn't lose sleep over the opinion of sheep. Stay focused. 🦁\n— *Mr Ntando*",
];

// ─────────────────────────────────────────────
// State (in-memory per session)
// ─────────────────────────────────────────────
let autoStatusInterval = null;   // setInterval handle
let intervalMinutes    = 60;     // default: post every 60 minutes
let quoteIndex         = 0;      // cycles through quotes in order
let customQuotes       = [];     // user-added quotes

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Get all quotes (built-in + custom), cycling in order */
function getAllQuotes() {
  return [...NTANDO_QUOTES, ...customQuotes];
}

/** Get the next quote in rotation */
function getNextQuote() {
  const all = getAllQuotes();
  const quote = all[quoteIndex % all.length];
  quoteIndex++;
  return quote;
}

/** Get a random quote */
function getRandomQuote() {
  const all = getAllQuotes();
  return all[Math.floor(Math.random() * all.length)];
}

/** Build the full status text */
function buildStatusText(quote) {
  const now = new Date().toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${quote}\n\n🕐 _${now} | SAST_`;
}

/**
 * Post a WhatsApp status update.
 * 
 * WhatsApp statuses are sent to the special JID: "status@broadcast"
 * The message must be visible to your contacts via statusJidList.
 *
 * @param {object} sock - WhatsApp socket (Baileys)
 * @param {string} text - Status text content
 */
async function postWhatsAppStatus(sock, text) {
  // Attempt to fetch own contacts for the broadcast list
  // Fall back to empty array if not available (WA will still post to all contacts)
  let statusJidList = [];

  try {
    if (sock.contacts) {
      statusJidList = Object.keys(sock.contacts).filter(
        (jid) => jid.endsWith('@s.whatsapp.net') && jid !== sock.user?.id
      );
    }
  } catch (_) {
    // non-fatal — status still posts without explicit jid list on some Baileys builds
  }

  await sock.sendMessage(
    'status@broadcast',
    {
      text,
      // Optional: add background color for text statuses (Baileys v6+)
      // backgroundArgb: 0xFF1A1A2E,
      // font: 4,
    },
    {
      statusJidList,
    }
  );
}

/** Stop any running interval */
function stopAutoStatus() {
  if (autoStatusInterval) {
    clearInterval(autoStatusInterval);
    autoStatusInterval = null;
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────
// Command Module
// ─────────────────────────────────────────────
module.exports = {
  name: 'autostatus',
  aliases: ['statusbot', 'ntandostatus', 'quotestatus'],
  category: 'general',
  description: 'Auto-post powerful Mr Ntando quotes as WhatsApp Status',
  usage: '.autostatus [on|off|now|interval <mins>|list|add <quote>]',

  async execute(sock, msg, args, extra) {
    try {
      const sub = (args[0] || 'help').toLowerCase();

      // ── .autostatus on ──────────────────────────────────
      if (sub === 'on') {
        if (autoStatusInterval) {
          return extra.reply(
            `✅ *AutoStatus is already running!*\n⏱️ Posting every *${intervalMinutes} minute(s)*.\nUse *.autostatus off* to stop.`
          );
        }

        // Post immediately on start
        const firstQuote = getNextQuote();
        await postWhatsAppStatus(sock, buildStatusText(firstQuote));

        // Schedule recurring posts
        autoStatusInterval = setInterval(async () => {
          try {
            const quote = getNextQuote();
            await postWhatsAppStatus(sock, buildStatusText(quote));
            console.log(`[AutoStatus] Posted status: ${quote.substring(0, 50)}...`);
          } catch (err) {
            console.error('[AutoStatus] Failed to post status:', err.message);
          }
        }, intervalMinutes * 60 * 1000);

        return extra.reply(
          `🟢 *AutoStatus ACTIVATED!*\n\n` +
          `📡 Posting *Mr Ntando quotes* as your WhatsApp status\n` +
          `⏱️ Interval: every *${intervalMinutes} minute(s)*\n` +
          `📝 Total quotes: *${getAllQuotes().length}*\n\n` +
          `_First status posted now!_\n` +
          `Use *.autostatus off* to stop.`
        );
      }

      // ── .autostatus off ─────────────────────────────────
      if (sub === 'off') {
        const stopped = stopAutoStatus();
        if (stopped) {
          return extra.reply('🔴 *AutoStatus DEACTIVATED.*\nNo more automatic status updates.');
        }
        return extra.reply('ℹ️ AutoStatus was not running. Use *.autostatus on* to start it.');
      }

      // ── .autostatus now ─────────────────────────────────
      if (sub === 'now') {
        const quote = getRandomQuote();
        const text  = buildStatusText(quote);
        await postWhatsAppStatus(sock, text);
        return extra.reply(
          `✅ *Status posted!*\n\n` +
          `📝 *Quote used:*\n${quote}`
        );
      }

      // ── .autostatus interval <mins> ─────────────────────
      if (sub === 'interval') {
        const mins = parseInt(args[1]);
        if (!mins || mins < 1) {
          return extra.reply('❌ Please provide a valid interval in minutes.\nExample: *.autostatus interval 30*');
        }

        intervalMinutes = mins;

        // Restart the interval if currently running
        if (autoStatusInterval) {
          stopAutoStatus();
          autoStatusInterval = setInterval(async () => {
            try {
              const quote = getNextQuote();
              await postWhatsAppStatus(sock, buildStatusText(quote));
            } catch (err) {
              console.error('[AutoStatus] Failed to post status:', err.message);
            }
          }, intervalMinutes * 60 * 1000);
        }

        return extra.reply(
          `⏱️ *Interval updated to ${intervalMinutes} minute(s)*.\n` +
          (autoStatusInterval ? '🟢 AutoStatus is running with new interval.' : 'ℹ️ AutoStatus is not running. Use *.autostatus on* to start.')
        );
      }

      // ── .autostatus list ────────────────────────────────
      if (sub === 'list') {
        const all = getAllQuotes();
        let list  = `📋 *Mr Ntando Quotes (${all.length} total)*\n`;
        list     += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        all.forEach((q, i) => {
          list += `*${i + 1}.* ${q}\n\n`;
        });

        // Split into chunks if too long (WhatsApp 4096 char limit)
        if (list.length > 4000) {
          const chunks = [];
          const lines  = list.split('\n\n');
          let chunk    = '';

          for (const line of lines) {
            if ((chunk + line).length > 3800) {
              chunks.push(chunk);
              chunk = '';
            }
            chunk += line + '\n\n';
          }
          if (chunk) chunks.push(chunk);

          for (const c of chunks) {
            await extra.reply(c);
          }
          return;
        }

        return extra.reply(list);
      }

      // ── .autostatus add <quote> ─────────────────────────
      if (sub === 'add') {
        const quote = args.slice(1).join(' ').trim();
        if (!quote) {
          return extra.reply('❌ Please provide a quote to add.\nExample: *.autostatus add Your time is now!*');
        }

        const formatted = `${quote}\n— *Mr Ntando*`;
        customQuotes.push(formatted);

        return extra.reply(
          `✅ *Quote added!*\n\n"${formatted}"\n\n` +
          `📊 Total quotes: *${getAllQuotes().length}*`
        );
      }

      // ── .autostatus help (default) ──────────────────────
      const isRunning = !!autoStatusInterval;
      return extra.reply(
        `╔══════════════════════╗\n` +
        `  📡 *AUTO STATUS HELP*\n` +
        `╚══════════════════════╝\n\n` +
        `*Status:* ${isRunning ? '🟢 Running' : '🔴 Stopped'}\n` +
        `*Interval:* ${intervalMinutes} minute(s)\n` +
        `*Quotes:* ${getAllQuotes().length} available\n\n` +
        `━━━━━ *COMMANDS* ━━━━━\n\n` +
        `▸ *.autostatus on* — Start auto-posting\n` +
        `▸ *.autostatus off* — Stop auto-posting\n` +
        `▸ *.autostatus now* — Post one status now\n` +
        `▸ *.autostatus interval 30* — Set interval (mins)\n` +
        `▸ *.autostatus list* — View all quotes\n` +
        `▸ *.autostatus add <text>* — Add a custom quote\n\n` +
        `_Powered by Mr Ntando's Wisdom 🔥_`
      );

    } catch (error) {
      console.error('Error in autostatus command:', error);
      await extra.reply('❌ Something went wrong with the AutoStatus command. Try again.');
    }
  }
};
