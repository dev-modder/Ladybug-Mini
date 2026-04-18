/**
 * NeverHaveI Command - Never Have I Ever game
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'neverhavei',
  aliases: ['neverhaveiever', 'nhi'],
  category: 'fun',
  description: 'Play Never Have I Ever with a random statement',
  usage: '.neverhavei',

  async execute(sock, msg, args, extra) {
    try {
      const statements = [
        'Never have I ever stayed up all night watching series.',
        'Never have I ever lied to get out of trouble.',
        'Never have I ever sent a text to the wrong person.',
        'Never have I ever eaten an entire pizza by myself.',
        'Never have I ever cried during a movie.',
        'Never have I ever forgotten someone\'s birthday.',
        'Never have I ever danced in public by myself.',
        'Never have I ever pretended to be sick to skip work/school.',
        'Never have I ever fallen asleep in class or a meeting.',
        'Never have I ever gone a whole day without using my phone.',
        'Never have I ever eaten something off the floor.',
        'Never have I ever ghosted someone.',
        'Never have I ever been on a blind date.',
        'Never have I ever stayed in my pajamas all day.',
        'Never have I ever talked to myself out loud in public.',
        'Never have I ever laughed so hard I cried.',
        'Never have I ever accidentally liked an old photo while stalking someone\'s profile.',
        'Never have I ever sang in the shower.',
        'Never have I ever forgotten where I parked my car.',
        'Never have I ever called a teacher "mom" or "dad" by accident.',
      ];

      const s = statements[Math.floor(Math.random() * statements.length)];

      await extra.reply(
        `🙋 *Never Have I Ever*\n\n` +
        `🎯 ${s}\n\n` +
        `_React with 🍺 if you HAVE done it, or 🙅 if you haven't!_\n\n` +
        `> 🐞 Ladybug Bot Fun`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
