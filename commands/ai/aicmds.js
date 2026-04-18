/**
 * AiCmds Command - List all AI commands
 * Ladybug Bot Mini | by Dev-Ntando
 */

const config = require('../../config');

module.exports = {
  name: 'aicmds',
  aliases: ['aimenu', 'ailist'],
  category: 'ai',
  description: 'Show all available AI commands',
  usage: '.aicmds',

  async execute(sock, msg, args, extra) {
    try {
      const p = config.prefix || '.';

      const menu =
        `🤖 *Ladybug Mini — AI Commands*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +

        `💬 *Chat & Writing*\n` +
        `  ${p}ai <question>      — Ask anything (GPT)\n` +
        `  ${p}chat <text>        — Conversational AI chat\n` +
        `  ${p}schoolai <q>       — School homework helper\n` +
        `  ${p}rewrite <text>     — Rewrite/rephrase text\n` +
        `  ${p}summarize <text>   — Summarize long text\n` +
        `  ${p}explain <topic>    — Explain a concept\n` +
        `  ${p}grammar <text>     — Grammar check & correct\n\n` +

        `🎨 *Image Generation*\n` +
        `  ${p}imagine <prompt>   — AI image (Stable Diffusion)\n` +
        `  ${p}imagine2 <prompt>  — AI image (alternative model)\n` +
        `  ${p}imagine3 <prompt>  — AI image (Pollinations)\n` +
        `  ${p}gimage <prompt>    — Google AI image search\n` +
        `  ${p}gptimage <prompt>  — GPT-4 image generation\n` +
        `  ${p}magicstudio <text> — Magic Studio image gen\n` +
        `  ${p}ailogo <brand>     — Generate AI brand logo\n` +
        `  ${p}removebg           — Remove image background\n\n` +

        `🎵 *Audio & Music*\n` +
        `  ${p}tts <text>         — Text to speech\n` +
        `  ${p}aisings <topic>    — AI sings a song\n` +
        `  ${p}aigenmusic <topic> — Generate music lyrics\n` +
        `  ${p}aigenmusicaudio    — Generate music audio\n` +
        `  ${p}shazam             — Identify a song\n\n` +

        `📖 *Analysis & Learning*\n` +
        `  ${p}ocr                — Extract text from image\n` +
        `  ${p}caption            — Caption/describe an image\n` +
        `  ${p}analyzedoc         — Analyze a document\n` +
        `  ${p}askpdf <q>         — Q&A on a quoted doc\n` +
        `  ${p}factcheck <claim>  — Verify a fact\n` +
        `  ${p}debate <topic>     — AI debate both sides\n` +
        `  ${p}studyplan <topic>  — Generate a study plan\n` +
        `  ${p}zimsec <q>         — ZIMSEC exam help\n\n` +

        `✨ *Creative*\n` +
        `  ${p}poem <topic>       — Write a poem\n` +
        `  ${p}story <prompt>     — Write a short story\n` +
        `  ${p}lyrics <song>      — Get song lyrics\n` +
        `  ${p}roast @user        — AI roast\n` +
        `  ${p}compliment @user   — AI compliment\n` +
        `  ${p}advice <problem>   — Life advice\n` +
        `  ${p}motivate           — Motivational quote\n` +
        `  ${p}codehelper <code>  — Debug/explain code\n` +
        `  ${p}translate <text>   — Translate any language\n\n` +

        `🔄 *AutoChat*\n` +
        `  ${p}autochat on/off    — Toggle AI auto-reply\n` +
        `  ${p}aiautoreply on/off — Auto-reply mode\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Prefix: ${p}  |  Ladybug Bot Mini_`;

      await extra.reply(menu);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
