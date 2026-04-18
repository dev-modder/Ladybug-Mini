/**
 * AskPDF Command - Analyze a document and answer questions about it
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'askpdf',
  aliases: ['asktxt', 'docqa'],
  category: 'ai',
  description: 'Ask a question about a quoted document or text',
  usage: '.askpdf <question> (reply to a document)',

  async execute(sock, msg, args, extra) {
    try {
      const question = args.join(' ').trim();
      const ctx = msg.message?.extendedTextMessage?.contextInfo;

      if (!ctx || !ctx.quotedMessage) {
        return extra.reply(
          '📄 *How to use:*\n\n' +
          '1. Send a text message with your content\n' +
          '2. Reply to it with *.askpdf <your question>*\n\n' +
          'Example: *.askpdf What is the main topic?*'
        );
      }

      if (!question) {
        return extra.reply('❓ Please include a question.\n\nUsage: *.askpdf <question>*');
      }

      const quotedText =
        ctx.quotedMessage?.conversation ||
        ctx.quotedMessage?.extendedTextMessage?.text ||
        ctx.quotedMessage?.documentMessage?.caption ||
        '';

      if (!quotedText) {
        return extra.reply('❌ Could not read the quoted message. Please reply to a text message.');
      }

      await extra.reply('🤔 _Analyzing your document..._');

      const prompt = `You are a helpful document assistant. Based on the following text, answer the question.\n\nDocument:\n${quotedText.slice(0, 3000)}\n\nQuestion: ${question}\n\nAnswer concisely and accurately.`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.trim() || 'No answer found.';

      await extra.reply(`📄 *Document Q&A*\n\n❓ *Question:* ${question}\n\n💡 *Answer:*\n${answer}`);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
