/**
 * AutoStatusView & AutoStatusLike Command — V(5) Nusantara Design
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Perintah:
 *   .autostatusview on           — mulai otomatis melihat semua status kontak
 *   .autostatusview off          — hentikan auto-view
 *   .autostatusview now          — lihat semua status sekarang (sekali)
 *   .autostatusview interval 5   — atur interval pengecekan dalam menit (default: 10)
 *   .autostatusview stats        — lihat statistik sesi ini
 *
 *   .autostatuslike on           — mulai otomatis like (react 🔥) semua status
 *   .autostatuslike off          — hentikan auto-like
 *   .autostatuslike emoji 😍     — ganti emoji reaksi (default: 🔥)
 *   .autostatuslike stats        — lihat statistik reaksi
 *
 * Catatan:
 *   • WhatsApp menandai status sebagai "dilihat" saat kamu mengirim
 *     readMessages() ke pesan status tersebut.
 *   • Reaksi status dikirim via sendMessage ke 'status@broadcast'
 *     dengan payload reactionMessage.
 *   • Kedua fitur ini berjalan independen — kamu bisa aktifkan keduanya
 *     sekaligus atau hanya salah satu.
 *
 *  Version: V(5)
 */

'use strict';

const config = require('../../config');

// ─────────────────────────────────────────────
// State (dalam memori per sesi)
// ─────────────────────────────────────────────

// AutoStatusView state
let viewInterval      = null;   // handle setInterval auto-view
let viewIntervalMins  = 10;     // default: cek setiap 10 menit
let totalViewed       = 0;      // total status yang dilihat sesi ini
let viewSessionStart  = null;   // waktu mulai sesi view

// AutoStatusLike state
let likeInterval      = null;   // handle setInterval auto-like
let likeIntervalMins  = 10;     // default: cek setiap 10 menit
let reactEmoji        = '🔥';   // emoji reaksi default
let totalLiked        = 0;      // total status yang di-react sesi ini
let likeSessionStart  = null;   // waktu mulai sesi like

// Daftar status yang sudah direact (hindari duplikat per sesi)
const reactedSet = new Set();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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

/** Format durasi sesi */
function formatDuration(startTime) {
  if (!startTime) return '0 detik';
  const sec = Math.floor((Date.now() - startTime) / 1000);
  const h   = Math.floor(sec / 3600);
  const m   = Math.floor((sec % 3600) / 60);
  const s   = sec % 60;
  const p   = [];
  if (h) p.push(`${h}j`);
  if (m) p.push(`${m}m`);
  if (s || !p.length) p.push(`${s}d`);
  return p.join(' ');
}

/**
 * Ambil semua update status yang tersedia dari kontak.
 * Baileys menyimpan status kontak di sock.store (jika pakai store)
 * atau bisa diambil via fetchStatus.
 *
 * @param {object} sock - Socket WhatsApp (Baileys)
 * @returns {Array} Array of { jid, messages: [{ key, messageTimestamp }] }
 */
async function fetchAllStatuses(sock) {
  const results = [];

  try {
    // Pendekatan 1: Gunakan store jika tersedia (makeInMemoryStore)
    if (sock.store?.messages) {
      const statusJid = 'status@broadcast';
      const msgs      = sock.store.messages[statusJid];
      if (msgs) {
        const entries = msgs.array || Object.values(msgs);
        for (const m of entries) {
          if (m?.key?.participant) {
            results.push({
              jid: m.key.participant,
              key: m.key,
              timestamp: m.messageTimestamp,
            });
          }
        }
      }
    }

    // Pendekatan 2: Iterasi kontak dan fetchStatus individual
    if (results.length === 0 && sock.contacts) {
      const contactJids = Object.keys(sock.contacts).filter(
        j => j.endsWith('@s.whatsapp.net') && j !== sock.user?.id
      );

      // Proses dalam batch kecil agar tidak di-rate-limit
      const BATCH = 10;
      for (let i = 0; i < contactJids.length; i += BATCH) {
        const batch = contactJids.slice(i, i + BATCH);
        await Promise.allSettled(
          batch.map(async jid => {
            try {
              const status = await sock.fetchStatus(jid);
              if (status?.status) {
                results.push({ jid, key: null, statusText: status.status });
              }
            } catch (_) { /* kontak mungkin tidak punya status */ }
          })
        );
        // Delay kecil antar batch
        await new Promise(r => setTimeout(r, 300));
      }
    }
  } catch (err) {
    console.error('[AutoStatusView] fetchAllStatuses error:', err.message);
  }

  return results;
}

/**
 * Tandai status sebagai sudah dilihat.
 * Mengirim readMessages() ke key status tersebut.
 *
 * @param {object} sock
 * @param {Array}  statuses - dari fetchAllStatuses()
 * @returns {number} jumlah status yang berhasil dilihat
 */
async function viewStatuses(sock) {
  const statuses = await fetchAllStatuses(sock);
  let count      = 0;

  for (const s of statuses) {
    try {
      if (s.key) {
        await sock.readMessages([s.key]);
        count++;
        totalViewed++;
      }
      // Delay kecil agar tidak terdeteksi sebagai spam
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    } catch (err) {
      console.warn('[AutoStatusView] Gagal melihat status:', err.message);
    }
  }

  return count;
}

/**
 * Kirim reaksi ke status.
 * Menggunakan sendMessage dengan reactionMessage ke 'status@broadcast'.
 *
 * @param {object} sock
 * @param {string} emoji - emoji reaksi
 * @returns {number} jumlah status yang berhasil di-react
 */
async function likeStatuses(sock, emoji) {
  const statuses = await fetchAllStatuses(sock);
  let count      = 0;

  for (const s of statuses) {
    try {
      if (!s.key) continue;

      // Buat ID unik untuk menghindari duplikat react per sesi
      const uid = `${s.key.remoteJid}_${s.key.id}_${s.key.participant}`;
      if (reactedSet.has(uid)) continue;

      await sock.sendMessage(
        'status@broadcast',
        {
          react: {
            text: emoji,
            key:  s.key,
          },
        }
      );

      reactedSet.add(uid);
      count++;
      totalLiked++;

      // Delay antar reaksi (hindari rate-limit)
      await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
    } catch (err) {
      console.warn('[AutoStatusLike] Gagal mereact status:', err.message);
    }
  }

  return count;
}

// ─────────────────────────────────────────────
// Modul Perintah — AutoStatusView
// ─────────────────────────────────────────────
module.exports = [

  // ═══════════════════════════════════════════
  //  .autostatusview
  // ═══════════════════════════════════════════
  {
    name:        'autostatusview',
    aliases:     ['asview', 'statusview', 'viewstatus'],
    category:    'general',
    description: 'Otomatis melihat semua status kontak WhatsApp',
    usage:       '.autostatusview [on|off|now|interval <menit>|stats]',

    async execute(sock, msg, args, extra) {
      try {
        const sub      = (args[0] || 'help').toLowerCase();
        const greeting = getGreeting();

        // ── .autostatusview on ────────────────────────────
        if (sub === 'on') {
          if (viewInterval) {
            return extra.reply(
              `✅ *AutoStatusView sudah berjalan!*\n` +
              `⏱️ Mengecek setiap *${viewIntervalMins} menit*.\n` +
              `👁️ Total dilihat sesi ini: *${totalViewed} status*\n` +
              `Gunakan *.autostatusview off* untuk menghentikan.`
            );
          }

          viewSessionStart = Date.now();

          // Langsung lihat status sekarang
          await extra.reply(
            `⏳ *Memulai AutoStatusView...*\n` +
            `🌙 ${greeting}! Sedang melihat semua status kontak...`
          );
          const firstCount = await viewStatuses(sock);

          // Jadwalkan pengecekan berulang
          viewInterval = setInterval(async () => {
            try {
              const n = await viewStatuses(sock);
              console.log(`[AutoStatusView] Melihat ${n} status baru.`);
            } catch (err) {
              console.error('[AutoStatusView] Error interval:', err.message);
            }
          }, viewIntervalMins * 60 * 1000);

          return extra.reply(
            `🟢 *AutoStatusView DIAKTIFKAN!*\n\n` +
            `👁️ Langsung melihat: *${firstCount} status*\n` +
            `⏱️ Interval pengecekan: *${viewIntervalMins} menit*\n` +
            `🔖 Versi: *V(5)*\n\n` +
            `_Bot akan terus melihat status kontak secara otomatis._\n` +
            `Gunakan *.autostatusview off* untuk menghentikan.`
          );
        }

        // ── .autostatusview off ───────────────────────────
        if (sub === 'off') {
          if (viewInterval) {
            clearInterval(viewInterval);
            viewInterval = null;
            const dur    = formatDuration(viewSessionStart);
            viewSessionStart = null;
            return extra.reply(
              `🔴 *AutoStatusView DINONAKTIFKAN.*\n\n` +
              `📊 Ringkasan sesi:\n` +
              `👁️ Total dilihat: *${totalViewed} status*\n` +
              `⏱️ Durasi: *${dur}*\n\n` +
              `_Bot berhenti melihat status secara otomatis._`
            );
          }
          return extra.reply(
            `ℹ️ AutoStatusView tidak sedang berjalan.\n` +
            `Gunakan *.autostatusview on* untuk memulai.`
          );
        }

        // ── .autostatusview now ───────────────────────────
        if (sub === 'now') {
          await extra.reply(
            `⏳ *Sedang melihat semua status...*\n` +
            `🌙 ${greeting}! Mohon tunggu sebentar.`
          );
          const count = await viewStatuses(sock);
          return extra.reply(
            `✅ *Selesai!*\n\n` +
            `👁️ Status dilihat: *${count} status*\n` +
            `📊 Total sesi ini: *${totalViewed} status*\n` +
            `🔖 Versi: *V(5)*`
          );
        }

        // ── .autostatusview interval <menit> ──────────────
        if (sub === 'interval') {
          const mins = parseInt(args[1]);
          if (!mins || mins < 1) {
            return extra.reply(
              `❌ Berikan interval yang valid dalam menit.\n` +
              `Contoh: *.autostatusview interval 5*`
            );
          }
          viewIntervalMins = mins;

          if (viewInterval) {
            clearInterval(viewInterval);
            viewInterval = setInterval(async () => {
              try {
                await viewStatuses(sock);
              } catch (err) {
                console.error('[AutoStatusView] Error interval:', err.message);
              }
            }, viewIntervalMins * 60 * 1000);
          }

          return extra.reply(
            `⏱️ *Interval diperbarui menjadi ${viewIntervalMins} menit.*\n` +
            (viewInterval
              ? '🟢 AutoStatusView berjalan dengan interval baru.'
              : 'ℹ️ AutoStatusView tidak aktif. Gunakan *.autostatusview on* untuk memulai.')
          );
        }

        // ── .autostatusview stats ─────────────────────────
        if (sub === 'stats') {
          const dur = formatDuration(viewSessionStart);
          return extra.reply(
            `╔══════════════════════════════════════╗\n` +
            `║  👁️  *STATISTIK AUTO STATUS VIEW*     ║\n` +
            `║         V(5) — Ladybug Bot Mini       ║\n` +
            `╠══════════════════════════════════════╣\n` +
            `║                                      ║\n` +
            `║  🟢  Status:    ${viewInterval ? 'Aktif ✅' : 'Nonaktif 🔴'}\n` +
            `║  👁️  Dilihat:   *${totalViewed} status*\n` +
            `║  ⏱️  Interval:  *${viewIntervalMins} menit*\n` +
            `║  🕐  Durasi:   *${dur}*\n` +
            `║                                      ║\n` +
            `╚══════════════════════════════════════╝\n` +
            `_🔥 Didukung oleh Mr Ntando Ofc · V(5)_`
          );
        }

        // ── .autostatusview help (default) ────────────────
        const isRunning = !!viewInterval;
        return extra.reply(
          `╔══════════════════════════════════════╗\n` +
          `║  👁️  *BANTUAN AUTO STATUS VIEW  V(5)* ║\n` +
          `╚══════════════════════════════════════╝\n\n` +
          `🌙 *${greeting}!*\n\n` +
          `*Status:*    ${isRunning ? '🟢 Aktif' : '🔴 Nonaktif'}\n` +
          `*Interval:*  ${viewIntervalMins} menit\n` +
          `*Dilihat:*   ${totalViewed} status sesi ini\n\n` +
          `━━━━━ *PERINTAH* ━━━━━\n\n` +
          `▸ *.autostatusview on*            — Mulai auto-view\n` +
          `▸ *.autostatusview off*           — Hentikan auto-view\n` +
          `▸ *.autostatusview now*           — Lihat semua status sekarang\n` +
          `▸ *.autostatusview interval 5*    — Atur interval (menit)\n` +
          `▸ *.autostatusview stats*         — Lihat statistik sesi\n\n` +
          `_Alias: .asview · .statusview · .viewstatus_\n` +
          `_🔖 Versi V(5) · Ladybug Bot Mini_`
        );

      } catch (err) {
        console.error('[AutoStatusView V5] Error:', err);
        await extra.reply('❌ Terjadi kesalahan pada AutoStatusView. Coba lagi.');
      }
    },
  },

  // ═══════════════════════════════════════════
  //  .autostatuslike
  // ═══════════════════════════════════════════
  {
    name:        'autostatuslike',
    aliases:     ['aslike', 'statuslike', 'likestatus', 'statusreact'],
    category:    'general',
    description: 'Otomatis like (react) semua status kontak WhatsApp',
    usage:       '.autostatuslike [on|off|emoji <emoji>|stats]',

    async execute(sock, msg, args, extra) {
      try {
        const sub      = (args[0] || 'help').toLowerCase();
        const greeting = getGreeting();

        // ── .autostatuslike on ────────────────────────────
        if (sub === 'on') {
          if (likeInterval) {
            return extra.reply(
              `✅ *AutoStatusLike sudah berjalan!*\n` +
              `${reactEmoji} Bereaksi setiap *${likeIntervalMins} menit*.\n` +
              `❤️ Total direact sesi ini: *${totalLiked} status*\n` +
              `Gunakan *.autostatuslike off* untuk menghentikan.`
            );
          }

          likeSessionStart = Date.now();

          await extra.reply(
            `⏳ *Memulai AutoStatusLike...*\n` +
            `🌙 ${greeting}! Sedang mereact semua status dengan ${reactEmoji}...`
          );
          const firstCount = await likeStatuses(sock, reactEmoji);

          likeInterval = setInterval(async () => {
            try {
              const n = await likeStatuses(sock, reactEmoji);
              console.log(`[AutoStatusLike] React ${n} status baru.`);
            } catch (err) {
              console.error('[AutoStatusLike] Error interval:', err.message);
            }
          }, likeIntervalMins * 60 * 1000);

          return extra.reply(
            `🟢 *AutoStatusLike DIAKTIFKAN!*\n\n` +
            `${reactEmoji} Emoji reaksi: *${reactEmoji}*\n` +
            `❤️ Langsung direact: *${firstCount} status*\n` +
            `⏱️ Interval pengecekan: *${likeIntervalMins} menit*\n` +
            `🔖 Versi: *V(5)*\n\n` +
            `_Bot akan terus mereact status kontak secara otomatis._\n` +
            `Gunakan *.autostatuslike off* untuk menghentikan.\n` +
            `Ganti emoji: *.autostatuslike emoji 😍*`
          );
        }

        // ── .autostatuslike off ───────────────────────────
        if (sub === 'off') {
          if (likeInterval) {
            clearInterval(likeInterval);
            likeInterval = null;
            const dur    = formatDuration(likeSessionStart);
            likeSessionStart = null;
            reactedSet.clear(); // reset agar sesi berikutnya bersih
            return extra.reply(
              `🔴 *AutoStatusLike DINONAKTIFKAN.*\n\n` +
              `📊 Ringkasan sesi:\n` +
              `❤️ Total direact: *${totalLiked} status*\n` +
              `${reactEmoji} Emoji dipakai: *${reactEmoji}*\n` +
              `⏱️ Durasi: *${dur}*\n\n` +
              `_Bot berhenti mereact status secara otomatis._`
            );
          }
          return extra.reply(
            `ℹ️ AutoStatusLike tidak sedang berjalan.\n` +
            `Gunakan *.autostatuslike on* untuk memulai.`
          );
        }

        // ── .autostatuslike emoji <emoji> ─────────────────
        if (sub === 'emoji') {
          const newEmoji = args[1]?.trim();
          if (!newEmoji) {
            return extra.reply(
              `❌ Berikan emoji yang valid.\n` +
              `Contoh: *.autostatuslike emoji 😍*\n` +
              `Emoji saat ini: *${reactEmoji}*`
            );
          }
          reactEmoji = newEmoji;
          return extra.reply(
            `✅ *Emoji reaksi diperbarui!*\n\n` +
            `${reactEmoji} Emoji baru: *${reactEmoji}*\n` +
            `_Reaksi berikutnya akan menggunakan emoji ini._`
          );
        }

        // ── .autostatuslike stats ─────────────────────────
        if (sub === 'stats') {
          const dur = formatDuration(likeSessionStart);
          return extra.reply(
            `╔══════════════════════════════════════╗\n` +
            `║  ❤️  *STATISTIK AUTO STATUS LIKE*     ║\n` +
            `║         V(5) — Ladybug Bot Mini       ║\n` +
            `╠══════════════════════════════════════╣\n` +
            `║                                      ║\n` +
            `║  🟢  Status:    ${likeInterval ? 'Aktif ✅' : 'Nonaktif 🔴'}\n` +
            `║  ❤️  Direact:   *${totalLiked} status*\n` +
            `║  ${reactEmoji}  Emoji:     *${reactEmoji}*\n` +
            `║  ⏱️  Interval:  *${likeIntervalMins} menit*\n` +
            `║  🕐  Durasi:   *${dur}*\n` +
            `║                                      ║\n` +
            `╚══════════════════════════════════════╝\n` +
            `_🔥 Didukung oleh Mr Ntando Ofc · V(5)_`
          );
        }

        // ── .autostatuslike help (default) ────────────────
        const isRunning = !!likeInterval;
        return extra.reply(
          `╔══════════════════════════════════════╗\n` +
          `║  ❤️  *BANTUAN AUTO STATUS LIKE  V(5)* ║\n` +
          `╚══════════════════════════════════════╝\n\n` +
          `🌙 *${greeting}!*\n\n` +
          `*Status:*   ${isRunning ? '🟢 Aktif' : '🔴 Nonaktif'}\n` +
          `*Emoji:*    ${reactEmoji}\n` +
          `*Interval:* ${likeIntervalMins} menit\n` +
          `*Direact:*  ${totalLiked} status sesi ini\n\n` +
          `━━━━━ *PERINTAH* ━━━━━\n\n` +
          `▸ *.autostatuslike on*            — Mulai auto-like\n` +
          `▸ *.autostatuslike off*           — Hentikan auto-like\n` +
          `▸ *.autostatuslike emoji 😍*      — Ganti emoji reaksi\n` +
          `▸ *.autostatuslike stats*         — Lihat statistik sesi\n\n` +
          `_Alias: .aslike · .statuslike · .likestatus · .statusreact_\n` +
          `_🔖 Versi V(5) · Ladybug Bot Mini_`
        );

      } catch (err) {
        console.error('[AutoStatusLike V5] Error:', err);
        await extra.reply('❌ Terjadi kesalahan pada AutoStatusLike. Coba lagi.');
      }
    },
  },
];
