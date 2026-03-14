/**
 * Base64 Command - Encode/Decode Base64
 */

const config = require('../../config');

module.exports = {
  name: 'base64',
  aliases: ['b64', 'encode', 'decode'],
  category: 'utility',
  description: 'Encode or decode Base64 strings',
  usage: '.base64 <encode|decode> <text>',
  
  async execute(sock, msg, args, extra) {
    try {
      if (args.length < 2) {
        return extra.reply('❌ Please provide an action and text!\n\n' +
          'Usage:\n' +
          '• .base64 encode Hello World\n' +
          '• .base64 decode SGVsbG8gV29ybGQ=');
      }
      
      const action = args[0].toLowerCase();
      const text = args.slice(1).join(' ');
      
      let result;
      
      if (action === 'encode' || action === 'enc' || action === 'e') {
        try {
          result = Buffer.from(text).toString('base64');
          
          const message = `🔐 *BASE64 ENCODER*\n\n` +
                         `📝 Input:\n${text}\n\n` +
                         `✅ Encoded:\n${result}\n\n` +
                         `_Processed by ${config.botName}_`;
          
          return await extra.reply(message);
        } catch (e) {
          return await extra.reply('❌ Failed to encode the text.');
        }
        
      } else if (action === 'decode' || action === 'dec' || action === 'd') {
        try {
          result = Buffer.from(text, 'base64').toString('utf8');
          
          if (!result) {
            return await extra.reply('❌ Invalid Base64 string. Could not decode.');
          }
          
          const message = `🔓 *BASE64 DECODER*\n\n` +
                         `📝 Input:\n${text}\n\n` +
                         `✅ Decoded:\n${result}\n\n` +
                         `_Processed by ${config.botName}_`;
          
          return await extra.reply(message);
        } catch (e) {
          return await extra.reply('❌ Invalid Base64 string. Please check the input.');
        }
        
      } else {
        return extra.reply('❌ Invalid action! Use "encode" or "decode".\n\n' +
          'Examples:\n' +
          '• .base64 encode Hello\n' +
          '• .base64 decode SGVsbG8=');
      }
      
    } catch (error) {
      console.error('Base64 command error:', error);
      await extra.reply('❌ Failed to process. Please try again.');
    }
  }
};