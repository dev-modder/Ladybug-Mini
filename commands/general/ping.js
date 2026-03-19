/**
 * Ping Command — CRIMSON EMPIRE Design
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  ✦ Shows response time in ms
 *  ✦ Speed rating (Blazing / Fast / Normal / Slow)
 *  ✦ Live RAM & uptime stats
 *  ✦ Edits the initial ping message with full result
 */

'use strict';

const config = require('../../config');
const os     = require('os');
const fs     = require('fs');
const path   = require('path');

// ── Helpers ─────────────────────────────────

function formatUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const p = [];
  if (d) p.push(`${d}d`);
  if (h) p.push(`${h}h`);
  if (m) p.push(`${m}m`);
  if (s || !p.length) p.push(`${s}s`);
  return p.join(' ');
}

function getRam() {
  const used  = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const total = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  return `${used} MB / ${total} GB`;
}

/** Speed tier based on ms */
function getSpeedRating(ms) {
  if (ms < 300)  return { label: 'BLAZING ⚡',  bar: '█████████░' };
  if (ms < 700)  return { label: 'FAST 🚀',     bar: '███████░░░' };
  if (ms < 1500) return { label: 'NORMAL 🟢',   bar: '█████░░░░░' };
  return              { label: 'SLOW 🔴',      bar: '██░░░░░░░░' };
}

// ── Module ───────────────────────────────────

module.exports = {
  name: 'ping',
  aliases: ['p', 'ladybug', 'speed'],
  category: 'general',
  description: 'Check bot response time and system health',
  usage: '.ping',

  async execute(sock, msg, args, extra) {
    try {
      // ── 1. Send initial ping message & time it ──
      const start = Date.now();

      const sent = await sock.sendMessage(
        extra.from,
        {
          text:
            `╔══════════════════════════╗\n` +
            `║  🏓  *PING TEST*         ║\n` +
            `╠══════════════════════════╣\n` +
            `║  📡  Measuring latency...\n` +
            `║  ⏳  Please wait...\n` +
            `╚══════════════════════════╝`,
        },
        { quoted: msg }
      );

      const ms     = Date.now() - start;
      const speed  = getSpeedRating(ms);
      const uptime = formatUptime(Math.floor(process.uptime()));
      const ram    = getRam();
      const now    = new Date().toLocaleString('en-ZA', {
        timeZone: config.timezone || 'Africa/Harare',
        hour12:   false,
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
      });

      // ── 2. Edit message with full result ────────
      const result =
        `╔══════════════════════════════════════╗\n` +
        `║   🏓  *PONG!  Bot is Alive!*         ║\n` +
        `╠══════════════════════════════════════╣\n` +
        `║                                      ║\n` +
        `║  ⚡  *Response* »  *${ms}ms*\n` +
        `║  🚦  *Speed*    »  *${speed.label}*\n` +
        `║  📊  *Rating*   »  ${speed.bar}\n` +
        `║                                      ║\n` +
        `╠══════〘 ⚙️  *SYSTEM* 〙════════════════╣\n` +
        `║                                      ║\n` +
        `║  ⏱️   Uptime    »  *${uptime}*\n` +
        `║  💾   Memory    »  *${ram}*\n` +
        `║  🕐   Time      »  *${now} CAT*\n` +
        `║  🌐   Host      »  *LadybugNodes*\n` +
        `║  🟢   Status    »  *Online & Active*\n` +
        `║                                      ║\n` +
        `╚══════════════════════════════════════╝\n` +
        `\n🔥 _Powered by Mr Ntando Ofc_`;

      // ── 2. Edit message with full result ────────
      await sock.sendMessage(extra.from, {
        text: result,
        edit: sent.key,
      });

      // ── 3. Send image card after result ─────────
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      if (fs.existsSync(imagePath)) {
        await sock.sendMessage(
          extra.from,
          {
            image:   fs.readFileSync(imagePath),
            caption: `⚡ *${ms}ms* · ${speed.label}\n🌐 *LadybugNodes* · 🟢 Online`,
            contextInfo: {
              forwardingScore: 1,
              isForwarded:     true,
              forwardedNewsletterMessageInfo: {
                newsletterJid:   config.newsletterJid || '120363161518@newsletter',
                newsletterName:  config.botName,
                serverMessageId: -1,
              },
            },
          }
        );
      }

    } catch (error) {
      console.error('[Ping] Error:', error);
      await extra.reply(`❌ Ping failed: ${error.message}`);
    }
  },
};
