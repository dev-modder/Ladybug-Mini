/**
 * Ping Command — V(5) Nusantara Design
 * Ladybug Bot Mini | by Dev-Ntando
 *
 *  ✦ Menampilkan waktu respons dalam ms
 *  ✦ Penilaian kecepatan (Kilat / Cepat / Normal / Lambat)
 *  ✦ Statistik RAM & uptime langsung
 *  ✦ Mengedit pesan ping awal dengan hasil lengkap
 *  ✦ Sapa pengguna dalam bahasa Indonesia
 *  ✦ Version: V(5)
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
  if (d) p.push(`${d}h`);
  if (h) p.push(`${h}j`);
  if (m) p.push(`${m}m`);
  if (s || !p.length) p.push(`${s}d`);
  return p.join(' ');
}

function getRam() {
  const used  = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const total = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  return `${used} MB / ${total} GB`;
}

/** Penilaian kecepatan berdasarkan ms */
function getSpeedRating(ms) {
  if (ms < 300)  return { label: 'KILAT ⚡',   bar: '█████████░' };
  if (ms < 700)  return { label: 'CEPAT 🚀',   bar: '███████░░░' };
  if (ms < 1500) return { label: 'NORMAL 🟢',  bar: '█████░░░░░' };
  return              { label: 'LAMBAT 🔴', bar: '██░░░░░░░░' };
}

/** Indonesian time-based greeting */
function getGreeting() {
  const hour = new Date().toLocaleString('id-ID', {
    timeZone: config.timezone || 'Africa/Harare',
    hour: '2-digit',
    hour12: false,
  });
  const h = parseInt(hour, 10);
  if (h >= 4  && h < 11) return 'Selamat Pagi';
  if (h >= 11 && h < 15) return 'Selamat Siang';
  if (h >= 15 && h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// ── Module ───────────────────────────────────

module.exports = {
  name: 'ping',
  aliases: ['p', 'ladybug', 'speed'],
  category: 'general',
  description: 'Cek waktu respons dan kesehatan sistem bot',
  usage: '.ping',

  async execute(sock, msg, args, extra) {
    try {
      const greeting = getGreeting();

      // ── 1. Kirim pesan ping awal & ukur waktunya ──
      const start = Date.now();

      const sent = await sock.sendMessage(
        extra.from,
        {
          text:
            `╔══════════════════════════════╗\n` +
            `║  🏓  *UJI PING  V(5)*        ║\n` +
            `╠══════════════════════════════╣\n` +
            `║  📡  Mengukur latensi...\n` +
            `║  ⏳  Mohon tunggu sebentar...\n` +
            `╚══════════════════════════════╝`,
        },
        { quoted: msg }
      );

      const ms     = Date.now() - start;
      const speed  = getSpeedRating(ms);
      const uptime = formatUptime(Math.floor(process.uptime()));
      const ram    = getRam();
      const now    = new Date().toLocaleString('id-ID', {
        timeZone: config.timezone || 'Africa/Harare',
        hour12:   false,
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
      });

      // ── 2. Edit pesan dengan hasil lengkap ──────
      const result =
        `╔══════════════════════════════════════╗\n` +
        `║   🏓  *PONG!  Bot Aktif!*  V(5)      ║\n` +
        `╠══════════════════════════════════════╣\n` +
        `║                                      ║\n` +
        `║  🌙  *${greeting}!*\n` +
        `║  💬  Bot kamu berjalan dengan baik!\n` +
        `║                                      ║\n` +
        `╠══════〘 ⚡ *HASIL PING* 〙═════════════╣\n` +
        `║                                      ║\n` +
        `║  ⚡  *Respons* »  *${ms}ms*\n` +
        `║  🚦  *Kecepatan* »  *${speed.label}*\n` +
        `║  📊  *Rating*  »  ${speed.bar}\n` +
        `║                                      ║\n` +
        `╠══════〘 ⚙️  *SISTEM* 〙══════════════════╣\n` +
        `║                                      ║\n` +
        `║  ⏱️   Uptime    »  *${uptime}*\n` +
        `║  💾   Memori    »  *${ram}*\n` +
        `║  🕐   Waktu     »  *${now} CAT*\n` +
        `║  🌐   Host      »  *LadybugNodes*\n` +
        `║  🟢   Status    »  *Online & Aktif*\n` +
        `║  🔖   Versi     »  *V(5)*\n` +
        `║                                      ║\n` +
        `╚══════════════════════════════════════╝\n` +
        `\n🔥 _Didukung oleh Mr Ntando Ofc_`;

      await sock.sendMessage(extra.from, {
        text: result,
        edit: sent.key,
      });

      // ── 3. Kirim kartu gambar setelah hasil ─────
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      if (fs.existsSync(imagePath)) {
        await sock.sendMessage(
          extra.from,
          {
            image:   fs.readFileSync(imagePath),
            caption: `⚡ *${ms}ms* · ${speed.label}\n🌐 *LadybugNodes* · 🟢 Online · 🔖 V(5)`,
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
      console.error('[Ping V5] Error:', error);
      await extra.reply(`❌ Ping gagal: ${error.message}`);
    }
  },
};
