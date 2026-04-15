/**
 * Would You Rather Command
 * Ladybug Bot V5 | by Dev-Ntando
 */

'use strict';

const QUESTIONS = [
  ["Be able to fly", "Be invisible"],
  ["Always speak your mind", "Never speak again"],
  ["Have super strength", "Have super speed"],
  ["Know when you'll die", "Know how you'll die"],
  ["Live in the past", "Live in the future"],
  ["Never use social media again", "Never watch movies/TV again"],
  ["Be famous but broke", "Be rich but unknown"],
  ["Only be able to whisper", "Only be able to shout"],
  ["Eat only pizza for a year", "Eat only salad for a year"],
  ["Have a pet dragon", "Have a pet unicorn"],
  ["Be stuck on a deserted island alone", "Be stuck with someone you hate"],
  ["Be able to speak all languages", "Be able to play all instruments"],
  ["Have no internet for a month", "Have no sleep for a week"],
  ["Be a wizard", "Be a superhero"],
  ["Know all the secrets of the universe", "Live forever"],
  ["Always be 10 minutes late", "Always be 20 minutes early"],
  ["Forget who you are every morning", "Remember every bad memory forever"],
  ["Be the richest person in the world", "Be the smartest person in the world"],
  ["Fight 100 duck-sized horses", "Fight 1 horse-sized duck"],
  ["Never be able to lie", "Never be able to tell the truth"],
  ["Have to sing everything you say", "Have to dance everywhere you go"],
  ["Be able to talk to animals", "Be able to talk to dead people"],
  ["Give up your phone for a year", "Give up your best friend for a year"],
  ["Live without music", "Live without TV"],
  ["Be younger in an older body", "Be older in a younger body"],
];

module.exports = {
  name: 'wouldyourather',
  aliases: ['wyr', 'rather', 'would'],
  category: 'fun',
  description: 'Get a random Would You Rather question',
  usage: '.wyr',

  async execute(sock, msg, args, extra) {
    try {
      const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

      await extra.reply(
        `🤔 *Would You Rather...*\n\n` +
        `🅰️  *${q[0]}*\n\n` +
        `          — OR —\n\n` +
        `🅱️  *${q[1]}*\n\n` +
        `_Reply with A or B and give your reason!_`
      );

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
