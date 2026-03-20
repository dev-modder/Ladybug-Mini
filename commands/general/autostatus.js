/**
 * AutoStatus Command - Otomatis posting Status WhatsApp
 * dengan kutipan bertenaga dari Mr Ntando.
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Perintah:
 *   .autostatus on              — mulai posting status otomatis setiap interval
 *   .autostatus off             — hentikan posting otomatis
 *   .autostatus now             — posting satu status sekarang
 *   .autostatus interval 30     — atur interval dalam menit (default: 60)
 *   .autostatus list            — lihat semua kutipan
 *   .autostatus add <kutipan>   — tambah kutipan kustom Ntando
 *
 *  Version: V(5)
 */

const config = require('../../config');

// ─────────────────────────────────────────────
// 🔥 Kutipan Bertenaga Mr Ntando
// ─────────────────────────────────────────────
const NTANDO_QUOTES = [
  "Perjuangan tidak peduli perasaanmu — tetap muncul dan bertarung. 💪\n— *Mr Ntando*",
  "Orang biasa membicarakan apa yang mereka inginkan. Pemenang membangunnya dalam diam. 🔇\n— *Mr Ntando*",
  "Alasanmu adalah kisah sukses orang lain yang sedang menunggu. 🚀\n— *Mr Ntando*",
  "Berhenti menunggu momen sempurna. Serang momen yang kamu miliki sekarang. ⚔️\n— *Mr Ntando*",
  "Kenyamanan adalah musuh kemajuan. Jadilah tidak nyaman. Jadilah hebat. 🔥\n— *Mr Ntando*",
  "Orang akan meragukanmu. Biarkan mereka. Keraguan tidak membayar tagihan — hasil yang membayar. 💰\n— *Mr Ntando*",
  "Kamu tidak lelah. Kamu hanya belum terhubung dengan tujuanmu. 🎯\n— *Mr Ntando*",
  "Versi dirimu yang menang sudah ada di dalam dirimu. Berhenti memberi makan yang menyerah. 🧠\n— *Mr Ntando*",
  "Bekerjalah sekeras itu sehingga ketika peluang datang, ia sudah tahu alamatmu. 🏠\n— *Mr Ntando*",
  "Mereka menertawakan mimpimu. Mereka akan bertepuk tangan untuk kesuksesanmu. Keduanya adalah bahan bakar. ⚡\n— *Mr Ntando*",
  "Setiap kemunduran adalah persiapan. Setiap kegagalan adalah kurikulum. Pelajari itu. 📚\n— *Mr Ntando*",
  "Jaringanmu adalah kekayaanmu — tetapi hanya jika kamu membawa nilai ke meja. 🤝\n— *Mr Ntando*",
  "Perbaikan kecil setiap hari menghasilkan hasil yang luar biasa dalam jangka panjang. Percaya prosesnya. 📈\n— *Mr Ntando*",
  "Disiplin adalah melakukan apa yang perlu dilakukan, bahkan ketika kamu tidak merasa seperti juara. 👑\n— *Mr Ntando*",
  "Dunia memberi ruang bagi orang yang tahu ke mana ia pergi. Ketahui arahmu. 🧭\n— *Mr Ntando*",
  "Kamu tidak datang sejauh ini hanya untuk sampai sejauh ini. Terus bergerak. 🛤️\n— *Mr Ntando*",
  "Reputasimu dibangun dalam bertahun-tahun dan dihancurkan dalam hitungan detik. Jaga itu. 🛡️\n— *Mr Ntando*",
  "Kemiskinan adalah pola pikir sebelum menjadi keadaan. Ubah pikiranmu terlebih dahulu. 💡\n— *Mr Ntando*",
  "Orang-orang yang mengubah dunia tidak menunggu izin. Kamu pun tidak perlu. 🌍\n— *Mr Ntando*",
  "Singa tidak kehilangan tidur karena pendapat domba. Tetap fokus. 🦁\n— *Mr Ntando*",
];

// ─────────────────────────────────────────────
// State (dalam memori per sesi)
// ─────────────────────────────────────────────
let autoStatusInterval = null;   // handle setInterval
let intervalMinutes    = 60;     // default: posting setiap 60 menit
let quoteIndex         = 0;      // siklus melalui kutipan secara berurutan
let customQuotes       = [];     // kutipan yang ditambahkan pengguna

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Dapatkan semua kutipan (bawaan + kustom), bersiklus secara berurutan */
function getAllQuotes() {
  return [...NTANDO_QUOTES, ...customQuotes];
}

/** Dapatkan kutipan berikutnya dalam rotasi */
function getNextQuote() {
  const all   = getAllQuotes();
  const quote = all[quoteIndex % all.length];
  quoteIndex++;
  return quote;
}

/** Dapatkan kutipan acak */
function getRandomQuote() {
  const all = getAllQuotes();
  return all[Math.floor(Math.random() * all.length)];
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

/** Bangun teks status lengkap */
function buildStatusText(quote) {
  const now = new Date().toLocaleString('id-ID', {
    timeZone: 'Africa/Johannesburg',
    hour12:   false,
    weekday:  'short',
    year:     'numeric',
    month:    'short',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
  });

  return `${quote}\n\n🕐 _${now} | SAST_`;
}

/**
 * Posting pembaruan status WhatsApp.
 *
 * @param {object} sock - Socket WhatsApp (Baileys)
 * @param {string} text - Konten teks status
 */
async function postWhatsAppStatus(sock, text) {
  let statusJidList = [];

  try {
    if (sock.contacts) {
      statusJidList = Object.keys(sock.contacts).filter(
        (jid) => jid.endsWith('@s.whatsapp.net') && jid !== sock.user?.id
      );
    }
  } catch (_) {
    // non-fatal
  }

  await sock.sendMessage(
    'status@broadcast',
    { text },
    { statusJidList }
  );
}

/** Hentikan interval yang sedang berjalan */
function stopAutoStatus() {
  if (autoStatusInterval) {
    clearInterval(autoStatusInterval);
    autoStatusInterval = null;
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────
// Modul Perintah
// ─────────────────────────────────────────────
module.exports = {
  name:        'autostatus',
  aliases:     ['statusbot', 'ntandostatus', 'quotestatus'],
  category:    'general',
  description: 'Posting otomatis kutipan Mr Ntando sebagai Status WhatsApp',
  usage:       '.autostatus [on|off|now|interval <menit>|list|add <kutipan>]',

  async execute(sock, msg, args, extra) {
    try {
      const sub      = (args[0] || 'help').toLowerCase();
      const greeting = getGreeting();

      // ── .autostatus on ──────────────────────────────────
      if (sub === 'on') {
        if (autoStatusInterval) {
          return extra.reply(
            `✅ *AutoStatus sudah berjalan!*\n⏱️ Posting setiap *${intervalMinutes} menit*.\nGunakan *.autostatus off* untuk menghentikan.`
          );
        }

        // Posting langsung saat dimulai
        const firstQuote = getNextQuote();
        await postWhatsAppStatus(sock, buildStatusText(firstQuote));

        // Jadwalkan posting berulang
        autoStatusInterval = setInterval(async () => {
          try {
            const quote = getNextQuote();
            await postWhatsAppStatus(sock, buildStatusText(quote));
            console.log(`[AutoStatus] Status diposting: ${quote.substring(0, 50)}...`);
          } catch (err) {
            console.error('[AutoStatus] Gagal memposting status:', err.message);
          }
        }, intervalMinutes * 60 * 1000);

        return extra.reply(
          `🟢 *AutoStatus DIAKTIFKAN!*\n\n` +
          `📡 Memposting *kutipan Mr Ntando* sebagai status WhatsApp kamu\n` +
          `⏱️ Interval: setiap *${intervalMinutes} menit*\n` +
          `📝 Total kutipan: *${getAllQuotes().length}*\n\n` +
          `_Status pertama sudah diposting sekarang!_\n` +
          `Gunakan *.autostatus off* untuk menghentikan.`
        );
      }

      // ── .autostatus off ─────────────────────────────────
      if (sub === 'off') {
        const stopped = stopAutoStatus();
        if (stopped) {
          return extra.reply('🔴 *AutoStatus DINONAKTIFKAN.*\nTidak ada lagi pembaruan status otomatis.');
        }
        return extra.reply('ℹ️ AutoStatus tidak sedang berjalan. Gunakan *.autostatus on* untuk memulainya.');
      }

      // ── .autostatus now ─────────────────────────────────
      if (sub === 'now') {
        const quote = getRandomQuote();
        const text  = buildStatusText(quote);
        await postWhatsAppStatus(sock, text);
        return extra.reply(
          `✅ *Status berhasil diposting!*\n\n` +
          `📝 *Kutipan yang digunakan:*\n${quote}`
        );
      }

      // ── .autostatus interval <menit> ────────────────────
      if (sub === 'interval') {
        const mins = parseInt(args[1]);
        if (!mins || mins < 1) {
          return extra.reply('❌ Berikan interval yang valid dalam menit.\nContoh: *.autostatus interval 30*');
        }

        intervalMinutes = mins;

        if (autoStatusInterval) {
          stopAutoStatus();
          autoStatusInterval = setInterval(async () => {
            try {
              const quote = getNextQuote();
              await postWhatsAppStatus(sock, buildStatusText(quote));
            } catch (err) {
              console.error('[AutoStatus] Gagal memposting status:', err.message);
            }
          }, intervalMinutes * 60 * 1000);
        }

        return extra.reply(
          `⏱️ *Interval diperbarui menjadi ${intervalMinutes} menit*.\n` +
          (autoStatusInterval
            ? '🟢 AutoStatus berjalan dengan interval baru.'
            : 'ℹ️ AutoStatus tidak sedang berjalan. Gunakan *.autostatus on* untuk memulainya.')
        );
      }

      // ── .autostatus list ────────────────────────────────
      if (sub === 'list') {
        const all = getAllQuotes();
        let list  = `📋 *Kutipan Mr Ntando (${all.length} total)*\n`;
        list     += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        all.forEach((q, i) => {
          list += `*${i + 1}.* ${q}\n\n`;
        });

        // Bagi menjadi beberapa bagian jika terlalu panjang (batas 4096 karakter WhatsApp)
        if (list.length > 4000) {
          const chunks = [];
          const lines  = list.split('\n\n');
          let chunk    = '';

          for (const line of lines) {
            if ((chunk + line).length > 3800) {
              chunks.push(chunk.trim());
              chunk = '';
            }
            chunk += line + '\n\n';
          }
          if (chunk.trim()) chunks.push(chunk.trim());

          for (const c of chunks) {
            await extra.reply(c);
          }
          return;
        }

        return extra.reply(list.trim());
      }

      // ── .autostatus add <kutipan> ───────────────────────
      if (sub === 'add') {
        const newQuote = args.slice(1).join(' ').trim();
        if (!newQuote) {
          return extra.reply('❌ Berikan teks kutipan.\nContoh: *.autostatus add Mimpi besar, kerja keras!*');
        }

        const formatted = `${newQuote}\n— *Mr Ntando*`;
        customQuotes.push(formatted);

        return extra.reply(
          `✅ *Kutipan ditambahkan!*\n\n"${formatted}"\n\n` +
          `📊 Total kutipan: *${getAllQuotes().length}*`
        );
      }

      // ── .autostatus help (default) ──────────────────────
      const isRunning = !!autoStatusInterval;
      return extra.reply(
        `╔══════════════════════════════╗\n` +
        `  📡 *BANTUAN AUTO STATUS  V(5)*\n` +
        `╚══════════════════════════════╝\n\n` +
        `🌙 *${greeting}!*\n\n` +
        `*Status:*    ${isRunning ? '🟢 Berjalan' : '🔴 Berhenti'}\n` +
        `*Interval:*  ${intervalMinutes} menit\n` +
        `*Kutipan:*   ${getAllQuotes().length} tersedia\n\n` +
        `━━━━━ *PERINTAH* ━━━━━\n\n` +
        `▸ *.autostatus on*              — Mulai posting otomatis\n` +
        `▸ *.autostatus off*             — Hentikan posting otomatis\n` +
        `▸ *.autostatus now*             — Posting satu status sekarang\n` +
        `▸ *.autostatus interval 30*     — Atur interval (menit)\n` +
        `▸ *.autostatus list*            — Lihat semua kutipan\n` +
        `▸ *.autostatus add <teks>*      — Tambah kutipan kustom\n\n` +
        `_Didukung oleh Kebijaksanaan Mr Ntando 🔥_\n` +
        `_🔖 Versi V(5)_`
      );

    } catch (error) {
      console.error('[AutoStatus V5] Error:', error);
      await extra.reply('❌ Terjadi kesalahan pada perintah AutoStatus. Coba lagi.');
    }
  }
};
