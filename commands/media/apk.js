/**
 * APK Downloader / Search
 * Ladybug Bot V5
 *
 * Usage:
 *   .apk <app name or package>    — Search and get APK download link
 *   .apk com.whatsapp             — Direct package lookup
 *
 * Multi-API fallback chain for reliability.
 */

const axios = require('axios');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'N/A';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatRating(r) {
  if (!r || isNaN(r)) return 'N/A';
  const stars = Math.round(parseFloat(r));
  return '⭐'.repeat(Math.min(stars, 5)) + ` (${parseFloat(r).toFixed(1)})`;
}

// ── API 1: APKPure via Siputzx ────────────────────────────────────────────────
async function searchApkPure(query) {
  const res = await axios.get(
    `https://api.siputzx.my.id/api/s/apkpure?query=${encodeURIComponent(query)}`,
    { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const items = res.data?.data || res.data?.result || [];
  if (!items.length) throw new Error('No results');

  const top = items[0];
  return {
    source:   'APKPure',
    name:     top.name || top.title,
    package:  top.package || top.pkg,
    version:  top.version || top.ver,
    size:     top.size,
    icon:     top.icon || top.logo || top.thumbnail,
    downloads: top.downloads || top.installs,
    rating:   top.rating || top.score,
    download: top.link || top.url || top.download,
    page:     top.pageUrl || top.pageLink
  };
}

// ── API 2: APKCombo via scraper ───────────────────────────────────────────────
async function searchApkCombo(query) {
  const res = await axios.get(
    `https://api.vreden.my.id/api/apkdl?query=${encodeURIComponent(query)}`,
    { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const d = res.data?.result || res.data?.data;
  if (!d) throw new Error('No result');

  return {
    source:   'APKCombo',
    name:     d.name || d.title,
    package:  d.package || d.pkg,
    version:  d.version,
    size:     d.size,
    icon:     d.icon,
    downloads: d.installs || d.downloads,
    rating:   d.rating,
    download: d.download || d.link || d.url,
    developer: d.developer || d.dev
  };
}

// ── API 3: APKMirror search ───────────────────────────────────────────────────
async function searchApkMirror(query) {
  const searchUrl = `https://www.apkmirror.com/?post_type=app_release&searchtype=app&s=${encodeURIComponent(query)}`;
  const res = await axios.get(searchUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'text/html'
    }
  });

  const html = res.data;
  const titleMatch = html.match(/<h5 class="appRowTitle[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
  if (!titleMatch) throw new Error('No results');

  return {
    source:   'APKMirror',
    name:     titleMatch[2]?.trim(),
    page:     `https://www.apkmirror.com${titleMatch[1]}`,
    download: `https://www.apkmirror.com${titleMatch[1]}`
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
module.exports = {
  name: 'apk',
  aliases: ['apkdl', 'apkdownload', 'getapk', 'findapk'],
  category: 'tools',
  description: 'Search and download APK files for Android apps',
  usage: '.apk <app name or package name>',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
      const query = args.join(' ').trim();

      if (!query) {
        return await sock.sendMessage(chatId, {
          text:
            `📦 *APK Downloader*\n\n` +
            `Usage: *.apk <app name or package>*\n\n` +
            `Examples:\n` +
            `• .apk WhatsApp\n` +
            `• .apk TikTok\n` +
            `• .apk com.instagram.android\n` +
            `• .apk Spotify\n\n${BOT_TAG}`
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '📦', key: msg.key } });

      await sock.sendMessage(chatId, {
        text: `🔍 _Searching APK for: *${query}*... Please wait._`
      }, { quoted: msg });

      // ── Try each API in order ───────────────────────────────────────────
      const methods = [
        { name: 'APKPure',   fn: () => searchApkPure(query) },
        { name: 'APKCombo',  fn: () => searchApkCombo(query) },
        { name: 'APKMirror', fn: () => searchApkMirror(query) }
      ];

      let apk = null;
      for (const method of methods) {
        try {
          apk = await method.fn();
          if (apk?.name || apk?.download) {
            console.log(`[APK] Success via ${method.name}`);
            break;
          }
        } catch (e) {
          console.log(`[APK] ${method.name} failed:`, e.message);
        }
      }

      if (!apk) {
        return await sock.sendMessage(chatId, {
          text:
            `❌ No APK found for *"${query}"*.\n\n` +
            `Tips:\n` +
            `• Try the exact app name (e.g. "WhatsApp" not "WA")\n` +
            `• Try the package name (e.g. com.whatsapp)\n` +
            `• Check the spelling\n\n${BOT_TAG}`
        }, { quoted: msg });
      }

      // ── Build result message ────────────────────────────────────────────
      let text =
        `📦 *APK Found!*\n\n` +
        `📱 *App:* ${apk.name || 'Unknown'}\n`;

      if (apk.package)   text += `🔖 *Package:* ${apk.package}\n`;
      if (apk.version)   text += `📌 *Version:* ${apk.version}\n`;
      if (apk.size)      text += `📏 *Size:* ${typeof apk.size === 'number' ? formatSize(apk.size) : apk.size}\n`;
      if (apk.developer) text += `👨‍💻 *Developer:* ${apk.developer}\n`;
      if (apk.downloads) text += `📥 *Installs:* ${apk.downloads}\n`;
      if (apk.rating)    text += `⭐ *Rating:* ${formatRating(apk.rating)}\n`;

      text += `\n📡 *Source:* ${apk.source || 'Unknown'}\n`;

      if (apk.download) {
        text += `\n🔗 *Download Link:*\n${apk.download}\n`;
      } else if (apk.page) {
        text += `\n🔗 *APK Page:*\n${apk.page}\n`;
      }

      text += `\n⚠️ _Only install APKs from trusted sources._\n\n${BOT_TAG}`;

      // Send with icon if available
      if (apk.icon) {
        try {
          await sock.sendMessage(chatId, {
            image: { url: apk.icon },
            caption: text
          }, { quoted: msg });
          return;
        } catch { /* fall through to text */ }
      }

      await sock.sendMessage(chatId, { text }, { quoted: msg });

    } catch (error) {
      console.error('[APK] Unexpected error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ An unexpected error occurred while searching for the APK.\n\nPlease try again.\n\n${BOT_TAG}`
      }, { quoted: msg });
    }
  }
};
