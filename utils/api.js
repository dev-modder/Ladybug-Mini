/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          Ladybug Bot Mini — API Utility v3.0.0              ║
 * ║  Robust multi-endpoint AI engine with smart fallback        ║
 * ║  By Dev-Ntando                                              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

'use strict';

const axios = require('axios');

// ── Base axios instance ────────────────────────────────────────────────────
const api = axios.create({
  timeout: 25000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
  },
});

// ── Retry helper ─────────────────────────────────────────────────────────────
async function withRetry(fn, attempts = 3, delayMs = 800) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last;
}

// ── AI Chat — multi-endpoint with progressive fallback ────────────────────────
async function chatAI(query, systemPrompt = null) {
  const sys = systemPrompt || 'You are Ladybug, a friendly, helpful, witty WhatsApp assistant by Dev-Ntando. Be concise and conversational.';
  const fullQuery = systemPrompt ? `${sys}\n\nUser: ${query}\nLadybug:` : query;

  const endpoints = [
    // Endpoint 1 — Shizo GPT (fast, reliable)
    async () => {
      const r = await axios.get(
        `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodeURIComponent(fullQuery)}&system=${encodeURIComponent(sys)}`,
        { timeout: 15000 }
      );
      const ans = r.data?.msg || r.data?.response || r.data?.data?.msg;
      if (ans && ans.trim().length > 2) return ans.trim();
      throw new Error('No response');
    },
    // Endpoint 2 — siputzx ChatGPT
    async () => {
      const r = await axios.get(
        `https://api.siputzx.my.id/api/ai/chatgpt?query=${encodeURIComponent(fullQuery)}`,
        { timeout: 18000 }
      );
      const ans = r.data?.data?.text || r.data?.result || r.data?.response || r.data?.msg;
      if (ans && ans.trim().length > 2) return ans.trim();
      throw new Error('No response');
    },
    // Endpoint 3 — widipe OpenAI
    async () => {
      const r = await axios.get(
        `https://widipe.com/openai?text=${encodeURIComponent(fullQuery)}`,
        { timeout: 15000 }
      );
      const ans = r.data?.result || r.data?.response || r.data?.msg;
      if (ans && ans.trim().length > 2) return ans.trim();
      throw new Error('No response');
    },
    // Endpoint 4 — BK9 API
    async () => {
      const r = await axios.get(
        `https://bk9.fun/ai/gpt4?q=${encodeURIComponent(fullQuery)}`,
        { timeout: 18000 }
      );
      const ans = r.data?.BK9 || r.data?.response || r.data?.result;
      if (ans && ans.trim().length > 2) return ans.trim();
      throw new Error('No response');
    },
    // Endpoint 5 — Nime AI
    async () => {
      const r = await axios.get(
        `https://nime-api.vercel.app/api/gpt?text=${encodeURIComponent(fullQuery)}`,
        { timeout: 15000 }
      );
      const ans = r.data?.result || r.data?.response || r.data?.msg;
      if (ans && ans.trim().length > 2) return ans.trim();
      throw new Error('No response');
    },
  ];

  for (const fn of endpoints) {
    try { return await fn(); }
    catch (_) { /* try next */ }
  }
  throw new Error('🤖 All AI endpoints are currently unavailable. Please try again in a moment.');
}

// ── Image Generation — multi-provider ────────────────────────────────────────
async function generateImage(prompt) {
  const providers = [
    // Provider 1 — Pollinations (free, no key, reliable)
    async () => {
      const seed = Math.floor(Math.random() * 999999);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
      const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
      if (r.data && r.data.byteLength > 1000) return { buffer: Buffer.from(r.data), url };
      throw new Error('Empty image');
    },
    // Provider 2 — siputzx Stable Diffusion
    async () => {
      const r = await axios.get(
        `https://api.siputzx.my.id/api/ai/stablediffusion?prompt=${encodeURIComponent(prompt)}`,
        { responseType: 'arraybuffer', timeout: 30000 }
      );
      if (r.data && r.data.byteLength > 1000) return { buffer: Buffer.from(r.data), url: null };
      throw new Error('Empty image');
    },
    // Provider 3 — Prodia via nime-api
    async () => {
      const r = await axios.get(
        `https://nime-api.vercel.app/api/txt2img?prompt=${encodeURIComponent(prompt)}`,
        { timeout: 30000 }
      );
      const imgUrl = r.data?.result || r.data?.url || r.data?.image;
      if (!imgUrl) throw new Error('No image URL');
      const img = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 20000 });
      return { buffer: Buffer.from(img.data), url: imgUrl };
    },
  ];

  for (const fn of providers) {
    try { return await fn(); }
    catch (_) { /* try next */ }
  }
  throw new Error('🖼️ All image generation providers failed. Try a different prompt or try again later.');
}

// ── YouTube Download ──────────────────────────────────────────────────────────
async function ytDownload(url, type = 'audio') {
  const endpoints = [
    async () => {
      const r = await api.get(`https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(url)}&format=${type === 'audio' ? 'mp3' : 'mp4'}`);
      if (r.data?.result?.download) return r.data.result;
      throw new Error('No download');
    },
    async () => {
      const r = await api.get(`https://api.siputzx.my.id/api/d/${type === 'audio' ? 'ytmp3' : 'ytmp4'}?url=${encodeURIComponent(url)}`);
      if (r.data?.data?.download?.url) return { download: r.data.data.download.url };
      throw new Error('No download');
    },
  ];
  for (const fn of endpoints) {
    try { return await fn(); }
    catch (_) {}
  }
  throw new Error('YouTube download failed. Check the URL and try again.');
}

// ── TikTok Download ───────────────────────────────────────────────────────────
async function tiktokDownload(url) {
  const endpoints = [
    async () => {
      const r = await api.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`);
      if (r.data?.data) return r.data.data;
      throw new Error('No data');
    },
    async () => {
      const r = await api.post('https://www.tikwm.com/api/', { url }, { timeout: 15000 });
      if (r.data?.data?.play) return { url: r.data.data.play, title: r.data.data.title };
      throw new Error('No data');
    },
  ];
  for (const fn of endpoints) {
    try { return await fn(); }
    catch (_) {}
  }
  throw new Error('TikTok download failed.');
}

// ── Instagram Download ────────────────────────────────────────────────────────
async function igDownload(url) {
  const r = await withRetry(() =>
    api.get(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`)
  );
  if (r.data?.data) return r.data.data;
  throw new Error('Instagram download failed.');
}

// ── Translate ─────────────────────────────────────────────────────────────────
async function translate(text, to = 'en', from = 'auto') {
  const endpoints = [
    async () => {
      const r = await api.get(`https://api.siputzx.my.id/api/tools/translate?text=${encodeURIComponent(text)}&to=${to}`);
      if (r.data?.data?.translatedText) return r.data.data.translatedText;
      throw new Error('No translation');
    },
    async () => {
      const r = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`,
        { timeout: 10000 }
      );
      const trans = r.data?.[0]?.map(x => x?.[0]).filter(Boolean).join('');
      if (trans) return trans;
      throw new Error('No translation');
    },
  ];
  for (const fn of endpoints) {
    try { return await fn(); }
    catch (_) {}
  }
  throw new Error('Translation failed. Try again.');
}

// ── Weather ───────────────────────────────────────────────────────────────────
async function getWeather(city) {
  const r = await withRetry(() =>
    api.get(`https://api.siputzx.my.id/api/tools/weather?city=${encodeURIComponent(city)}`)
  );
  if (r.data?.data) return r.data.data;
  throw new Error('Weather data unavailable for that city.');
}

// ── Random Quote ──────────────────────────────────────────────────────────────
async function getQuote() {
  const endpoints = [
    async () => {
      const r = await axios.get('https://api.quotable.io/random', { timeout: 8000 });
      if (r.data?.content) return { text: r.data.content, author: r.data.author };
      throw new Error('No quote');
    },
    async () => {
      const r = await axios.get('https://zenquotes.io/api/random', { timeout: 8000 });
      if (r.data?.[0]?.q) return { text: r.data[0].q, author: r.data[0].a };
      throw new Error('No quote');
    },
  ];
  for (const fn of endpoints) {
    try { return await fn(); }
    catch (_) {}
  }
  throw new Error('Could not fetch a quote right now.');
}

// ── Random Joke ───────────────────────────────────────────────────────────────
async function getJoke() {
  const endpoints = [
    async () => {
      const r = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 8000 });
      if (r.data?.setup) return { setup: r.data.setup, punchline: r.data.punchline };
      throw new Error('No joke');
    },
    async () => {
      const r = await axios.get('https://v2.jokeapi.dev/joke/Any?safe-mode&type=twopart', { timeout: 8000 });
      if (r.data?.setup) return { setup: r.data.setup, punchline: r.data.delivery };
      throw new Error('No joke');
    },
  ];
  for (const fn of endpoints) {
    try { return await fn(); }
    catch (_) {}
  }
  throw new Error('No jokes available.');
}

// ── Wikipedia ─────────────────────────────────────────────────────────────────
async function wikiSearch(query) {
  const r = await withRetry(() =>
    axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { timeout: 10000 })
  );
  return r.data;
}

// ── Shorten URL ───────────────────────────────────────────────────────────────
async function shortenUrl(url) {
  const r = await withRetry(() =>
    axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 8000 })
  );
  return r.data;
}

// ── YouTube music helpers (kept for compatibility) ────────────────────────────
async function getIzumiDownloadByUrl(youtubeUrl) {
  return ytDownload(youtubeUrl, 'audio');
}

async function getIzumiDownloadByQuery(query) {
  const r = await axios.get(
    `https://izumiiiiiiii.dpdns.org/downloader/ytSearch?q=${encodeURIComponent(query)}`,
    { timeout: 20000 }
  );
  if (r.data?.result?.[0]?.url) return r.data.result[0];
  throw new Error('No results for that query.');
}

// ── Named language map for translate ─────────────────────────────────────────
const LANG_CODES = {
  english:'en', afrikaans:'af', arabic:'ar', chinese:'zh', dutch:'nl', french:'fr',
  german:'de', hindi:'hi', indonesian:'id', italian:'it', japanese:'ja', korean:'ko',
  malay:'ms', portuguese:'pt', russian:'ru', shona:'sn', spanish:'es', swahili:'sw',
  turkish:'tr', zulu:'zu', ndebele:'nd', sotho:'st', xhosa:'xh', yoruba:'yo',
  igbo:'ig', hausa:'ha', somali:'so', amharic:'am', tamil:'ta', thai:'th',
  vietnamese:'vi', urdu:'ur', persian:'fa', polish:'pl', romanian:'ro',
};

module.exports = {
  chatAI,
  generateImage,
  ytDownload,
  tiktokDownload,
  igDownload,
  translate,
  getWeather,
  getQuote,
  getJoke,
  wikiSearch,
  shortenUrl,
  withRetry,
  LANG_CODES,
  getIzumiDownloadByUrl,
  getIzumiDownloadByQuery,
  // Legacy aliases
  getMeme: async () => {
    const r = await axios.get('https://meme-api.com/gimme', { timeout: 8000 });
    return r.data;
  },
};
