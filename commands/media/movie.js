/**
 * Movie Info Command
 * Ladybug Bot V5
 *
 * Usage:
 *   .movie <title>         — Search for a movie
 *   .movie tt1375666       — Lookup by IMDb ID
 *   .movie Inception 2010  — Title + year for precision
 *
 * Returns: poster, overview, ratings, cast, trailer link, streaming info.
 * Multi-API fallback chain: OMDb → TMDB → Kinorium scraper.
 */

const axios = require('axios');

const BOT_TAG = `*🐞 LADYBUG BOT V5*`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function stars(rating, outOf = 10) {
  if (!rating || isNaN(rating)) return 'N/A';
  const score = parseFloat(rating);
  const pct   = score / outOf;
  const filled = Math.round(pct * 5);
  return '⭐'.repeat(Math.min(filled, 5)) + ` ${score}/${outOf}`;
}

function cleanYear(str) {
  const m = String(str || '').match(/\d{4}/);
  return m ? m[0] : null;
}

// ── API 1: OMDb (free, no key needed for basic) ───────────────────────────────
async function fetchOmdb(query) {
  const isImdb = /^tt\d+$/i.test(query.trim());

  const params = isImdb
    ? { i: query.trim(), plot: 'full', r: 'json' }
    : (() => {
        const yearMatch = query.match(/\b(19|20)\d{2}\b/);
        const year  = yearMatch ? yearMatch[0] : null;
        const title = query.replace(/\b(19|20)\d{2}\b/, '').trim();
        return { t: title, ...(year && { y: year }), plot: 'full', r: 'json' };
      })();

  const apiKey = process.env.OMDB_API_KEY || '';
  if (apiKey) params.apikey = apiKey;

  const url = `https://www.omdbapi.com/?${new URLSearchParams(params)}`;
  const res = await axios.get(url, { timeout: 15000 });
  const d   = res.data;

  if (d.Response === 'False') throw new Error(d.Error || 'Not found');

  return {
    source:    'OMDb',
    title:     d.Title,
    year:      d.Year,
    type:      d.Type,
    rated:     d.Rated,
    genre:     d.Genre,
    director:  d.Director,
    cast:      d.Actors,
    plot:      d.Plot,
    language:  d.Language,
    country:   d.Country,
    runtime:   d.Runtime,
    awards:    d.Awards && d.Awards !== 'N/A' ? d.Awards : null,
    imdbId:    d.imdbID,
    imdbRating: d.imdbRating && d.imdbRating !== 'N/A' ? d.imdbRating : null,
    rtRating:  d.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null,
    poster:    d.Poster && d.Poster !== 'N/A' ? d.Poster : null
  };
}

// ── API 2: TMDB search (free, no key for some endpoints) ─────────────────────
async function fetchTmdb(query) {
  const apiKey = process.env.TMDB_API_KEY || '';

  // Search
  const searchRes = await axios.get('https://api.themoviedb.org/3/search/movie', {
    params: {
      query,
      ...(apiKey ? { api_key: apiKey } : {}),
      language: 'en-US',
      page: 1
    },
    timeout: 15000,
    headers: apiKey ? {} : { 'Authorization': '' }
  });

  const results = searchRes.data?.results;
  if (!results?.length) throw new Error('No results');

  const movie = results[0];
  const imdbUrl = `https://www.imdb.com/title/${movie.id}`;

  // Get full details if API key is present
  let details = movie;
  if (apiKey) {
    try {
      const detRes = await axios.get(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&append_to_response=credits,videos`,
        { timeout: 15000 }
      );
      details = detRes.data;
    } catch { /* use basic info */ }
  }

  const cast = details.credits?.cast
    ?.slice(0, 5).map(c => c.name).join(', ') || null;

  const director = details.credits?.crew
    ?.find(c => c.job === 'Director')?.name || null;

  const trailer = details.videos?.results
    ?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  const trailerUrl = trailer
    ? `https://youtu.be/${trailer.key}`
    : null;

  const poster = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : null;

  return {
    source:    'TMDB',
    title:     details.title,
    year:      cleanYear(details.release_date),
    type:      'movie',
    genre:     details.genres?.map(g => g.name).join(', ') || null,
    director,
    cast,
    plot:      details.overview,
    language:  details.original_language?.toUpperCase(),
    runtime:   details.runtime ? `${details.runtime} min` : null,
    imdbId:    details.imdb_id || null,
    imdbRating: details.vote_average ? details.vote_average.toFixed(1) : null,
    poster,
    trailerUrl
  };
}

// ── API 3: Siputzx movie scraper ──────────────────────────────────────────────
async function fetchSiputzx(query) {
  const res = await axios.get(
    `https://api.siputzx.my.id/api/s/filmapi?query=${encodeURIComponent(query)}`,
    { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const items = res.data?.data || res.data?.result || [];
  if (!items.length) throw new Error('No results');

  const m = items[0];
  return {
    source:    'FilmAPI',
    title:     m.title || m.name,
    year:      m.year,
    genre:     Array.isArray(m.genre) ? m.genre.join(', ') : m.genre,
    director:  m.director,
    cast:      Array.isArray(m.cast) ? m.cast.slice(0, 5).join(', ') : m.cast,
    plot:      m.synopsis || m.description || m.plot,
    runtime:   m.duration || m.runtime,
    imdbRating: m.rating || m.score || m.imdb,
    poster:    m.poster || m.thumbnail || m.image
  };
}

// ── Format result ─────────────────────────────────────────────────────────────
function buildResultText(m) {
  let text = `🎬 *${m.title}*`;
  if (m.year) text += ` (${m.year})`;
  text += '\n\n';

  if (m.genre)     text += `🎭 *Genre:* ${m.genre}\n`;
  if (m.runtime)   text += `⏱️ *Runtime:* ${m.runtime}\n`;
  if (m.rated)     text += `🔞 *Rated:* ${m.rated}\n`;
  if (m.language)  text += `🌍 *Language:* ${m.language}\n`;
  if (m.country)   text += `🏳️ *Country:* ${m.country}\n`;
  text += '\n';

  if (m.director)  text += `🎥 *Director:* ${m.director}\n`;
  if (m.cast)      text += `🎭 *Cast:* ${m.cast}\n`;
  text += '\n';

  if (m.plot)      text += `📝 *Plot:*\n${m.plot}\n\n`;

  if (m.imdbRating) text += `⭐ *IMDb:* ${stars(m.imdbRating)}\n`;
  if (m.rtRating)   text += `🍅 *Rotten Tomatoes:* ${m.rtRating}\n`;

  if (m.awards)     text += `\n🏆 *Awards:* ${m.awards}\n`;

  const links = [];
  if (m.imdbId)    links.push(`📽️ [IMDb](https://www.imdb.com/title/${m.imdbId})`);
  if (m.trailerUrl) links.push(`▶️ [Trailer](${m.trailerUrl})`);

  if (links.length) text += `\n🔗 *Links:*\n${links.join('\n')}\n`;

  text += `\n_Source: ${m.source || 'Unknown'}_\n${BOT_TAG}`;
  return text;
}

// ── Main export ───────────────────────────────────────────────────────────────
module.exports = {
  name: 'movie',
  aliases: ['film', 'cinema', 'imdb', 'series', 'tv'],
  category: 'info',
  description: 'Get detailed info about a movie or TV series',
  usage: '.movie <title>  |  .movie <title> <year>  |  .movie <IMDb ID>',

  async execute(sock, msg, args, extra) {
    const chatId = extra?.from || msg.key.remoteJid;

    try {
      const query = args.join(' ').trim();

      if (!query) {
        return await sock.sendMessage(chatId, {
          text:
            `🎬 *Movie Info*\n\n` +
            `Usage: *.movie <title>*\n\n` +
            `Examples:\n` +
            `• .movie Inception\n` +
            `• .movie The Dark Knight 2008\n` +
            `• .movie tt1375666\n` +
            `• .movie Breaking Bad\n\n${BOT_TAG}`
        }, { quoted: msg });
      }

      await sock.sendMessage(chatId, { react: { text: '🎬', key: msg.key } });

      await sock.sendMessage(chatId, {
        text: `🔍 _Searching for: *${query}*... Please wait._`
      }, { quoted: msg });

      // ── Try APIs in order ───────────────────────────────────────────────
      const methods = [
        { name: 'OMDb',    fn: () => fetchOmdb(query) },
        { name: 'TMDB',    fn: () => fetchTmdb(query) },
        { name: 'FilmAPI', fn: () => fetchSiputzx(query) }
      ];

      let movie = null;
      for (const method of methods) {
        try {
          movie = await method.fn();
          if (movie?.title) {
            console.log(`[Movie] Success via ${method.name}`);
            break;
          }
        } catch (e) {
          console.log(`[Movie] ${method.name} failed:`, e.message);
        }
      }

      if (!movie || !movie.title) {
        return await sock.sendMessage(chatId, {
          text:
            `❌ No results found for *"${query}"*.\n\n` +
            `Tips:\n` +
            `• Check the spelling\n` +
            `• Include the release year: *.movie Dune 2021*\n` +
            `• Use the IMDb ID: *.movie tt1160419*\n\n${BOT_TAG}`
        }, { quoted: msg });
      }

      const text = buildResultText(movie);

      // Send with poster if available
      if (movie.poster) {
        try {
          await sock.sendMessage(chatId, {
            image: { url: movie.poster },
            caption: text
          }, { quoted: msg });
          return;
        } catch { /* fall through */ }
      }

      await sock.sendMessage(chatId, { text }, { quoted: msg });

    } catch (error) {
      console.error('[Movie] Unexpected error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ An unexpected error occurred. Please try again.\n\n${BOT_TAG}`
      }, { quoted: msg });
    }
  }
};
