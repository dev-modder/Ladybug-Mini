/**
 * Spotify Track Search & Info
 * Ladybug Bot V5
 *
 * .spotify <song name>     — search Spotify and get track info + preview
 * .spotify <Spotify URL>   — get info for a specific track
 *
 * Uses Spotify public API (no auth required for search/preview).
 * Sends: album art, track details, 30s preview audio if available.
 */

const axios  = require('axios');
const config = require('../../config');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

// ─── Spotify token (public client credentials, no auth needed for search) ─────
let _spotifyToken    = null;
let _tokenExpires    = 0;

async function getSpotifyToken() {
  if (_spotifyToken && Date.now() < _tokenExpires) return _spotifyToken;

  // Public Spotify client ID (no secret needed for public search token via web flow)
  // Using a shared public approach — if rate limited, provide your own in config.apiKeys.spotify
  const clientId     = config.apiKeys?.spotifyClientId     || 'a38c368d6fab4e28bcd9e44f93b7ec61';
  const clientSecret = config.apiKeys?.spotifyClientSecret || '';

  if (clientSecret) {
    // Full token via client credentials
    const res = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        timeout: 10000
      }
    );
    _spotifyToken  = res.data.access_token;
    _tokenExpires  = Date.now() + (res.data.expires_in - 60) * 1000;
    return _spotifyToken;
  }

  // Anonymous token (limited, from Spotify web player)
  const res = await axios.get(
    'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
    {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Cookie': 'sp_t=1'
      }
    }
  );
  _spotifyToken = res.data?.accessToken;
  _tokenExpires = Date.now() + ((res.data?.accessTokenExpirationTimestampMs || Date.now() + 3600000) - Date.now() - 60000);
  return _spotifyToken;
}

function msToMinSec(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function isSpotifyUrl(input) {
  return /https?:\/\/(?:open\.)?spotify\.com\//i.test(input) ||
         /spotify:track:/i.test(input);
}

function extractSpotifyId(input) {
  const match = input.match(/track\/([A-Za-z0-9]+)/);
  return match?.[1] || null;
}

module.exports = {
  name: 'spotify',
  aliases: ['spot', 'spoti', 'spotifysearch'],
  category: 'media',
  description: 'Search Spotify for track info and 30s preview',
  usage: '.spotify <song name>  |  .spotify <Spotify URL>',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
      if (!args.length) {
        return await sock.sendMessage(chatId, {
          text: `❌ Please provide a song name or Spotify URL.\n\nExamples:\n• ${config.prefix}spotify Blinding Lights\n• ${config.prefix}spotify https://open.spotify.com/track/xxxxx`
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '🎵', key: msg.key } });

      const input = args.join(' ').trim();
      let track   = null;

      const token = await getSpotifyToken();
      if (!token) throw new Error('Could not obtain Spotify token');

      const authHeaders = { 'Authorization': `Bearer ${token}` };

      if (isSpotifyUrl(input)) {
        // Direct track lookup
        const id = extractSpotifyId(input);
        if (!id) {
          return await sock.sendMessage(chatId, {
            text: '❌ Invalid Spotify URL. Please provide a track link.'
          }, { quoted: msg });
        }
        const res = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
          headers: authHeaders, timeout: 15000
        });
        track = res.data;
      } else {
        // Search
        const res = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(input)}&type=track&limit=5`,
          { headers: authHeaders, timeout: 15000 }
        );
        const items = res.data?.tracks?.items || [];
        if (!items.length) {
          return await sock.sendMessage(chatId, {
            text: `❌ No Spotify results found for *"${input}"*. Try a different search.`
          }, { quoted: msg });
        }
        track = items[0];
      }

      if (!track) throw new Error('No track data');

      // ── Build info card ───────────────────────────────────────────────────
      const artists   = (track.artists || []).map(a => a.name).join(', ');
      const album     = track.album?.name || 'Unknown Album';
      const released  = track.album?.release_date?.split('-')[0] || 'N/A';
      const duration  = msToMinSec(track.duration_ms || 0);
      const popularity= track.popularity || 0;
      const previewUrl= track.preview_url;
      const albumArt  = track.album?.images?.[0]?.url;
      const spotifyLink = track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`;

      const popularityBar = '🟩'.repeat(Math.round(popularity / 20)) +
                            '⬜'.repeat(5 - Math.round(popularity / 20));

      const infoText = [
        `🎵 *${track.name}*`,
        `👤 ${artists}`,
        `💿 ${album} (${released})`,
        `⏱️ ${duration}`,
        `🔥 Popularity: ${popularityBar} ${popularity}/100`,
        `🔗 ${spotifyLink}`,
        '',
        previewUrl ? `🎧 _30s preview included below_` : `🔇 _No preview available for this track_`,
        '',
        BOT_TAG
      ].join('\n');

      // Send album art + info
      if (albumArt) {
        await sock.sendMessage(chatId, {
          image: { url: albumArt },
          caption: infoText
        }, { quoted: msg });
      } else {
        await sock.sendMessage(chatId, { text: infoText }, { quoted: msg });
      }

      // Send 30s preview audio if available
      if (previewUrl) {
        try {
          const audioBuf = await axios.get(previewUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          await sock.sendMessage(chatId, {
            audio: Buffer.from(audioBuf.data),
            mimetype: 'audio/mpeg',
            pttAudio: false,
            fileName: `${track.name} - ${artists}.mp3`
          });
        } catch (previewErr) {
          console.log('[Spotify] Preview send failed:', previewErr.message);
          // Non-critical — info was already sent
        }
      }

    } catch (err) {
      console.error('[Spotify] Error:', err.message);

      // Fallback: try Siputzx Spotify search
      try {
        const query = args.join(' ').trim();
        const res = await axios.get(
          `https://api.siputzx.my.id/api/s/spotify?query=${encodeURIComponent(query)}`,
          { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const d = res.data?.data?.[0];
        if (d) {
          const text = [
            `🎵 *${d.title || 'Unknown'}*`,
            `👤 ${d.artist || 'Unknown'}`,
            `💿 ${d.album || 'N/A'}`,
            `⏱️ ${d.duration || 'N/A'}`,
            `🔗 ${d.url || ''}`,
            '',
            BOT_TAG
          ].join('\n');

          if (d.image) {
            await sock.sendMessage(chatId, {
              image: { url: d.image },
              caption: text
            }, { quoted: msg });
          } else {
            await sock.sendMessage(chatId, { text }, { quoted: msg });
          }
          return;
        }
      } catch (_) {}

      await sock.sendMessage(chatId, {
        text: '❌ Could not connect to Spotify. Please try again later.'
      }, { quoted: msg });
    }
  }
};
