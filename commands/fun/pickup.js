/**
 * Pickup Command - Get a random pickup line
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'pickup',
  aliases: ['pickupline', 'pline'],
  category: 'fun',
  description: 'Get a random funny/cheesy pickup line',
  usage: '.pickup',

  async execute(sock, msg, args, extra) {
    try {
      const lines = [
        'Are you a magician? Because every time I look at you, everyone else disappears. 🪄',
        'Do you have a map? I keep getting lost in your eyes. 🗺️',
        'Are you a Wi-Fi signal? Because I\'m feeling a connection. 📶',
        'Do you believe in love at first sight, or should I walk by again? 😏',
        'Are you Google? Because you have everything I\'ve been searching for. 🔍',
        'Is your name Bluetooth? Because I\'m feeling paired. 💙',
        'Are you a bank loan? Because you have my interest. 💰',
        'Are you a camera? Because every time I look at you, I smile. 📸',
        'Are you Netflix? Because I could watch you all night. 📺',
        'Is your name Alexa? Because you\'ve been in my thoughts all day. 🔊',
        'Do you like science? Because I\'ve got great chemistry with you. ⚗️',
        'Are you a keyboard? Because you\'re just my type. ⌨️',
        'Are you an electrician? Because you just lit up my world. ⚡',
        'Do you like raisins? How do you feel about a date? 🍇',
        'Are you a 90-degree angle? Because you\'re looking right! 📐',
      ];

      const line = lines[Math.floor(Math.random() * lines.length)];

      await extra.reply(
        `😏 *Pickup Line*\n\n` +
        `💬 "${line}"\n\n` +
        `_Use at your own risk! 😂_`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
