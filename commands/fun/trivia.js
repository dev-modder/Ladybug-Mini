/**
 * Trivia Command - Random trivia question with answer reveal
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Uses Open Trivia DB (free, no API key)
 * Falls back to built-in questions if API fails
 */

'use strict';

const axios = require('axios');

const pendingTrivia = new Map(); // jid → { answer, timeoutId }

// He entities decoder
function decodeHtml(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = {
  name: 'trivia',
  aliases: ['quiz', 'triviaanswer'],
  category: 'fun',
  description: 'Answer a random trivia question. Use .trivia answer to reveal.',
  usage: '.trivia | .trivia answer',

  async execute(sock, msg, args, extra) {
    try {
      const jid = extra.from;

      // Reveal answer for pending trivia
      if (args[0] && args[0].toLowerCase() === 'answer') {
        const pending = pendingTrivia.get(jid);
        if (!pending) {
          return extra.reply('❓ No active trivia! Start one with .trivia');
        }
        clearTimeout(pending.timeoutId);
        pendingTrivia.delete(jid);
        return extra.reply(`✅ *The correct answer is:*\n${pending.answer}`);
      }

      // Cancel existing
      const existing = pendingTrivia.get(jid);
      if (existing) {
        clearTimeout(existing.timeoutId);
        pendingTrivia.delete(jid);
      }

      let question, correctAnswer, allAnswers, category, difficulty;

      try {
        const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 6000 });
        if (res.data?.results?.length) {
          const q = res.data.results[0];
          question      = decodeHtml(q.question);
          correctAnswer = decodeHtml(q.correct_answer);
          allAnswers    = shuffle([...q.incorrect_answers.map(decodeHtml), correctAnswer]);
          category      = decodeHtml(q.category);
          difficulty    = q.difficulty;
        }
      } catch {
        // API failed — use fallback
      }

      // Fallback built-in questions
      if (!question) {
        const fallbacks = [
          {
            question: "What is the capital city of Australia?",
            correct:  "Canberra",
            wrong:    ["Sydney", "Melbourne", "Brisbane"],
            category: "Geography",
            difficulty: "medium",
          },
          {
            question: "How many bones are in the adult human body?",
            correct:  "206",
            wrong:    ["212", "198", "220"],
            category: "Science",
            difficulty: "medium",
          },
          {
            question: "Which element has the chemical symbol 'Au'?",
            correct:  "Gold",
            wrong:    ["Silver", "Aluminium", "Argon"],
            category: "Science",
            difficulty: "easy",
          },
          {
            question: "Who painted the Mona Lisa?",
            correct:  "Leonardo da Vinci",
            wrong:    ["Michelangelo", "Raphael", "Picasso"],
            category: "Art",
            difficulty: "easy",
          },
          {
            question: "What year did World War II end?",
            correct:  "1945",
            wrong:    ["1939", "1943", "1950"],
            category: "History",
            difficulty: "easy",
          },
        ];
        const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        question      = fb.question;
        correctAnswer = fb.correct;
        allAnswers    = shuffle([...fb.wrong, fb.correct]);
        category      = fb.category;
        difficulty    = fb.difficulty;
      }

      const letters = ['A', 'B', 'C', 'D'];
      const optionLines = allAnswers.map((a, i) => `${letters[i]}) ${a}`).join('\n');

      // Auto-reveal after 45 seconds
      const timeoutId = setTimeout(async () => {
        pendingTrivia.delete(jid);
        try {
          await sock.sendMessage(jid, {
            text: `⏰ *Time's up!*\nThe correct answer was: *${correctAnswer}*`,
          });
        } catch { /* ignore */ }
      }, 45_000);

      pendingTrivia.set(jid, { answer: correctAnswer, timeoutId });

      const diffIcon = difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴';

      await extra.reply(
        `🧠 *Trivia Time!*\n` +
        `📂 Category: ${category}  ${diffIcon} ${difficulty.toUpperCase()}\n\n` +
        `❓ *${question}*\n\n` +
        `${optionLines}\n\n` +
        `_Type_ *.trivia answer* _to reveal, or wait 45 seconds._`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
