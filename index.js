/**
 * WhatsApp MD Bot — Main Entry Point
 * Ladybug Bot V5 | by Dev-Ntando
 * Version: 5.0.0
 */

// ─────────────────────────────────────────────
// 🚫 Disable Puppeteer BEFORE anything loads
// ─────────────────────────────────────────────
process.env.PUPPETEER_SKIP_DOWNLOAD            = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD   = 'true';
process.env.PUPPETEER_CACHE_DIR                =
  process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

// ─────────────────────────────────────────────
// 🧹 Init temp system & cleanup scheduler
// ─────────────────────────────────────────────
const { initializeTempSystem } = require('./utils/tempManager');
const { startCleanup, cleanupOldFiles } = require('./utils/cleanup');
initializeTempSystem();
startCleanup();

// ─────────────────────────────────────────────
// 🔇 Console noise filter — suppress Baileys internals
// ─────────────────────────────────────────────
const originalConsoleLog   = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn  = console.warn;

const FORBIDDEN_PATTERNS = [
  'closing session', 'closing open session', 'sessionentry',
  'prekey bundle', 'pendingprekey', '_chains', 'registrationid',
  'currentratchet', 'chainkey', 'ratchet', 'signal protocol',
  'ephemeralkeypair', 'indexinfo', 'basekey', 'ratchetkey'
];

const shouldSuppress = (...args) => {
  const msg = args
    .map(a => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ')
    .toLowerCase();
  return FORBIDDEN_PATTERNS.some(p => msg.includes(p));
};

console.log   = (...args) => { if (!shouldSuppress(...args)) originalConsoleLog.apply(console, args); };
console.error = (...args) => { if (!shouldSuppress(...args)) originalConsoleError.apply(console, args); };
console.warn  = (...args) => { if (!shouldSuppress(...args)) originalConsoleWarn.apply(console, args); };

// ─────────────────────────────────────────────
// 📦 Dependencies
// ─────────────────────────────────────────────
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode  = require('qrcode-terminal');
const config  = require('./config');
const handler = require('./handler');
const fs      = require('fs');
const path    = require('path');
const zlib    = require('zlib');
const os      = require('os');

// ─────────────────────────────────────────────
// 🎨 Startup Banner — Ladybug V5
// ─────────────────────────────────────────────
function printBanner() {
  const ownerNames = Array.isArray(config.ownerName)
    ? config.ownerName.join(', ')
    : config.ownerName;

  const lines = [
    '',
    '╔══════════════════════════════════════════╗',
    '  🐞  L A D Y B U G  B O T  V 5  🐞',
    '  ✨  Next Generation WhatsApp Bot  ✨',
    '╚══════════════════════════════════════════╝',
    '',
    `   📦  Bot     : ${config.botName}`,
    `   🏷️  Version : 5.0.0`,
    `   ⚡  Prefix  : ${config.prefix}`,
    `   👑  Owner   : ${ownerNames}`,
    `   🌐  Host    : LadybugNodes`,
    '',
    '   🆕  V5 Features: Anti-Spam, Word Filter,',
    '       Message Logger, Poll Support, Rate Limiter',
    '',
    '   ⏳  Starting up — please wait...',
    '',
  ];

  originalConsoleLog(lines.join('\n'));
}

// ─────────────────────────────────────────────
// ✅ Connection Success Banner
// ─────────────────────────────────────────────
function printConnectedBanner(sock) {
  const ownerNames = Array.isArray(config.ownerName)
    ? config.ownerName.join(', ')
    : config.ownerName;

  const botNumber = sock.user.id.split(':')[0];
  const now = new Date().toLocaleString('en-ZA', {
    timeZone: config.timezone || 'Africa/Harare',
    hour12: false,
    weekday: 'short', year: 'numeric',
    month: 'short',   day: 'numeric',
    hour: '2-digit',  minute: '2-digit'
  });

  const lines = [
    '',
    '╔══════════════════════════════════════════╗',
    '  ✅  B O T  C O N N E C T E D  ! ! !',
    '  🐞  Ladybug Bot V5 is Online  🐞',
    '╚══════════════════════════════════════════╝',
    '',
    `   🤖  Bot Name : ${config.botName}`,
    `   🏷️  Version  : 5.0.0`,
    `   📱  Number   : +${botNumber}`,
    `   ⚡  Prefix   : ${config.prefix}`,
    `   👑  Owner    : ${ownerNames}`,
    `   🌐  Host     : LadybugNodes`,
    `   🕐  Time     : ${now}`,
    '',
    '   🟢  Ready to receive messages!',
    '   🔥  Powered by Dev-Ntando Ofc',
    '',
    '╰────────────────────────────────────────╯',
    '',
  ];

  originalConsoleLog(lines.join('\n'));
}

// ─────────────────────────────────────────────
// 🧹 Puppeteer cache remover
// ─────────────────────────────────────────────
function cleanupPuppeteerCache() {
  try {
    const cacheDir = path.join(os.homedir(), '.cache', 'puppeteer');
    if (fs.existsSync(cacheDir)) {
      console.log('🧹 Removing Puppeteer cache:', cacheDir);
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('✅ Puppeteer cache removed');
    }
  } catch (err) {
    console.error('⚠️ Failed to cleanup Puppeteer cache:', err.message || err);
  }
}

// ─────────────────────────────────────────────
// 💾 In-memory message store (Map-based, bounded)
// ─────────────────────────────────────────────
const store = {
  messages:   new Map(),
  maxPerChat: 20,

  bind(ev) {
    ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key?.id) continue;
        const jid = msg.key.remoteJid;
        if (!store.messages.has(jid)) store.messages.set(jid, new Map());
        const chatMsgs = store.messages.get(jid);
        chatMsgs.set(msg.key.id, msg);
        if (chatMsgs.size > store.maxPerChat) {
          chatMsgs.delete(chatMsgs.keys().next().value); // drop oldest
        }
      }
    });
  },

  loadMessage: async (jid, id) => store.messages.get(jid)?.get(id) || null
};

// ─────────────────────────────────────────────
// 🔁 Message deduplication
// ─────────────────────────────────────────────
const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 5 * 60 * 1000); // flush every 5 min

// ─────────────────────────────────────────────
// 📝 Suppressed Pino logger for Baileys
// ─────────────────────────────────────────────
function createSuppressedLogger(level = 'silent') {
  let logger;
  try {
    logger = pino({
      level,
      transport: process.env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: { colorize: true, ignore: 'pid,hostname' }
      },
      redact: ['registrationId', 'ephemeralKeyPair', 'rootKey', 'chainKey', 'baseKey']
    });
  } catch {
    logger = pino({ level });
  }

  const originalInfo = logger.info.bind(logger);
  logger.info  = (...args) => {
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ').toLowerCase();
    if (!FORBIDDEN_PATTERNS.some(p => msg.includes(p))) originalInfo(...args);
  };
  logger.debug = () => {};
  logger.trace = () => {};
  return logger;
}

// ─────────────────────────────────────────────
// 🚀 Main bot start function
// ─────────────────────────────────────────────
async function startBot() {
  const sessionFolder = `./${config.sessionName}`;
  const sessionFile   = path.join(sessionFolder, 'creds.json');

  // Decode & restore session from sessionID (LadybugBot! format)
  if (config.sessionID && config.sessionID.startsWith('LadybugBot!')) {
    try {
      const parts   = config.sessionID.split('!');
      const b64data = parts[1];

      if (!b64data) throw new Error("Missing base64 payload in sessionID");

      const compressedData   = Buffer.from(b64data, 'base64');
      const decompressedData = zlib.gunzipSync(compressedData);

      if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
      }

      fs.writeFileSync(sessionFile, decompressedData, 'utf8');
      console.log('📡 Session : 🔑 Retrieved from LadybugBot Session');
    } catch (e) {
      console.error('📡 Session : ❌ Error processing session:', e.message);
      // Falls through to QR code flow
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version }          = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger:               createSuppressedLogger('silent'),
    printQRInTerminal:    false,
    browser:              ['Chrome', 'Windows', '10.0'],
    auth:                 state,
    syncFullHistory:      false,
    downloadHistory:      false,
    markOnlineOnConnect:  false,
    getMessage:           async () => undefined
  });

  store.bind(sock.ev);

  // ── Watchdog (force reconnect after 30min inactivity) ──
  let lastActivity       = Date.now();
  const INACTIVITY_LIMIT = 30 * 60 * 1000;

  sock.ev.on('messages.upsert', () => { lastActivity = Date.now(); });

  const watchdogInterval = setInterval(async () => {
    if (Date.now() - lastActivity > INACTIVITY_LIMIT && sock.ws.readyState === 1) {
      console.log('⚠️  No activity for 30 min — forcing reconnect...');
      await sock.end(undefined, undefined, { reason: 'inactive' });
      clearInterval(watchdogInterval);
      setTimeout(() => startBot(), 5000);
    }
  }, 5 * 60 * 1000);

  // ── Connection events (merged into single handler to prevent duplicate firing) ──
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Update watchdog activity & clear interval on close
    if (connection === 'open')  lastActivity = Date.now();
    if (connection === 'close') clearInterval(watchdogInterval);

    if (qr) {
      console.log('\n📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode      = lastDisconnect?.error?.output?.statusCode;
      const errorMessage    = lastDisconnect?.error?.message || 'Unknown error';
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if ([515, 503, 408].includes(statusCode)) {
        console.log(`⚠️  Connection closed (${statusCode}). Reconnecting...`);
      } else {
        console.log(`❌ Connection closed: ${errorMessage} | Reconnecting: ${shouldReconnect}`);
      }

      if (shouldReconnect) setTimeout(() => startBot(), 3000);
    }

    if (connection === 'open') {
      // Print the fancy V5 connected banner
      printConnectedBanner(sock);

      // Set bot bio/status
      if (config.autoBio) {
        try {
          await sock.updateProfileStatus(`${config.botName} V5 | Active 24/7 🔥`);
        } catch (_) {}
      }

      // Initialize anti-call
      handler.initializeAntiCall(sock);

      // Prune stale chats (older than 24h)
      const now = Date.now();
      for (const [jid, chatMsgs] of store.messages.entries()) {
        const timestamps = Array.from(chatMsgs.values())
          .map(m => (m.messageTimestamp || 0) * 1000);
        if (timestamps.length && now - Math.max(...timestamps) > 86400000) {
          store.messages.delete(jid);
        }
      }
      console.log(`🧹 Store pruned. Active chats: ${store.messages.size}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── JID filter — ignore broadcast/status/newsletter ──
  const isSystemJid = (jid) =>
    !jid ||
    jid.includes('@broadcast') ||
    jid.includes('status.broadcast') ||
    jid.includes('@newsletter');

  // ── Incoming message handler ──
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || !msg.key?.id) continue;

      const from = msg.key.remoteJid;
      if (!from || isSystemJid(from)) continue;

      const msgId = msg.key.id;
      if (processedMessages.has(msgId)) continue;

      // Drop messages older than 5 minutes
      if (msg.messageTimestamp) {
        const age = Date.now() - msg.messageTimestamp * 1000;
        if (age > 5 * 60 * 1000) continue;
      }

      processedMessages.add(msgId);

      // Cache message
      if (!store.messages.has(from)) store.messages.set(from, new Map());
      const chatMsgs = store.messages.get(from);
      chatMsgs.set(msgId, msg);
      if (chatMsgs.size > store.maxPerChat) {
        const sorted = Array.from(chatMsgs.entries())
          .sort((a, b) => (a[1].messageTimestamp || 0) - (b[1].messageTimestamp || 0));
        for (let i = 0; i < sorted.length - store.maxPerChat; i++) {
          chatMsgs.delete(sorted[i][0]);
        }
      }

      // Handle polls inline (avoids registering a second messages.upsert listener)
      if (msg.message?.pollCreationMessage || msg.message?.pollUpdateMessage) {
        handler.handlePollMessage(sock, msg).catch(() => {});
      }

      // Handle command (non-blocking)
      handler.handleMessage(sock, msg).catch(err => {
        if (!err.message?.includes('rate-overlimit') && !err.message?.includes('not-authorized')) {
          console.error('Error handling message:', err.message);
        }
      });

      // Background tasks
      setImmediate(async () => {
        try {
          if (config.autoRead && from.endsWith('@g.us')) {
            await sock.readMessages([msg.key]);
          }
          if (from.endsWith('@g.us')) {
            const groupMetadata = await handler.getGroupMetadata(sock, from);
            if (groupMetadata) {
              await handler.handleAntilink(sock, msg, groupMetadata);
              // ── V5: Anti-spam & word filter run in background ──
              await handler.handleAntiSpam(sock, msg, groupMetadata);
              await handler.handleWordFilter(sock, msg, groupMetadata);
            }
          }
        } catch (_) {}
      });
    }
  });

  // ── Silently swallow non-critical events ──
  sock.ev.on('message-receipt.update', () => {});
  sock.ev.on('messages.update',        () => {});

  // ── Group join/leave ──
  sock.ev.on('group-participants.update', async (update) => {
    await handler.handleGroupUpdate(sock, update);
  });

  // ── Socket errors ──
  sock.ev.on('error', (error) => {
    const code = error?.output?.statusCode;
    if ([515, 503, 408].includes(code)) return; // transient, ignore
    console.error('Socket error:', error.message || error);
  });

  return sock;
}

// ─────────────────────────────────────────────
// 🔥 Boot sequence
// ─────────────────────────────────────────────
printBanner();
cleanupPuppeteerCache();

startBot().catch(err => {
  console.error('❌ Fatal error starting bot:', err);
  process.exit(1);
});

// ─────────────────────────────────────────────
// 🛡️ Process-level error handlers
// ─────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  if (
    err.code === 'ENOSPC' ||
    err.errno === -28 ||
    err.message?.includes('no space left on device')
  ) {
    console.error('⚠️ ENOSPC: No disk space left. Attempting cleanup...');
    try {
      cleanupOldFiles();
    } catch (cleanErr) {
      console.error('Cleanup failed:', cleanErr.message);
    }
    return; // Don't crash — let the bot keep running
  }

  console.error('⚠️ Uncaught Exception:', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  if (msg.includes('rate-overlimit') || msg.includes('not-authorized')) return;
  console.error('⚠️ Unhandled Rejection:', msg);
});

process.on('SIGINT',  () => { console.log('\n👋 Ladybug V5 stopped (SIGINT).');  process.exit(0); });
process.on('SIGTERM', () => { console.log('\n👋 Ladybug V5 stopped (SIGTERM).'); process.exit(0); });
