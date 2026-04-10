/**
 * Calculator Command - Evaluate math expressions safely
 * Ladybug Bot Mini | by Dev-Ntando
 *
 * Supports: +, -, *, /, %, ^, sqrt(), abs(), floor(), ceil(), round(), pi, e
 * Usage: .calc <expression>
 */

'use strict';

module.exports = {
  name: 'calc',
  aliases: ['calculator', 'math', 'calculate', 'hitung'],
  category: 'general',
  description: 'Evaluate a math expression',
  usage: '.calc <expression>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) {
        return extra.reply(
          `🔢 *Calculator*\n\n` +
          `Usage: .calc <expression>\n\n` +
          `Examples:\n` +
          `  .calc 25 * 4 + 10\n` +
          `  .calc sqrt(144)\n` +
          `  .calc (100 / 3) ^ 2\n` +
          `  .calc pi * 5^2\n\n` +
          `Supported: +  -  *  /  %  ^ (power)\n` +
          `Functions: sqrt()  abs()  floor()  ceil()  round()\n` +
          `Constants: pi, e`
        );
      }

      let expression = args.join(' ').trim();

      // Sanitize: only allow safe math characters
      const safe = expression.replace(/[^0-9+\-*/%.^() a-zA-Z]/g, '');

      if (!safe.trim()) {
        return extra.reply('❌ Invalid expression. Only numbers and math operators are allowed.');
      }

      // Replace common aliases
      let expr = safe
        .replace(/\bpi\b/gi, String(Math.PI))
        .replace(/\be\b/g, String(Math.E))
        .replace(/\^/g, '**')
        .replace(/\bsqrt\b/gi, 'Math.sqrt')
        .replace(/\babs\b/gi, 'Math.abs')
        .replace(/\bfloor\b/gi, 'Math.floor')
        .replace(/\bceil\b/gi, 'Math.ceil')
        .replace(/\bround\b/gi, 'Math.round')
        .replace(/\bsin\b/gi, 'Math.sin')
        .replace(/\bcos\b/gi, 'Math.cos')
        .replace(/\btan\b/gi, 'Math.tan')
        .replace(/\blog\b/gi, 'Math.log10')
        .replace(/\bln\b/gi, 'Math.log')
        .replace(/\bmax\b/gi, 'Math.max')
        .replace(/\bmin\b/gi, 'Math.min');

      // Safely evaluate using Function
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${expr})`)();

      if (typeof result !== 'number' || isNaN(result)) {
        return extra.reply('❌ That expression returned an invalid result.');
      }

      if (!isFinite(result)) {
        return extra.reply(`⚠️ Result is *${result > 0 ? 'Infinity' : '-Infinity'}* — probably a division by zero.`);
      }

      // Format: show up to 10 decimal places, strip trailing zeros
      const formatted = parseFloat(result.toFixed(10)).toString();

      await extra.reply(
        `🔢 *Calculator*\n\n` +
        `📝 *Expression:* \`${expression}\`\n` +
        `✅ *Result:* \`${formatted}\``
      );

    } catch (error) {
      console.error('[calc] Error:', error);
      await extra.reply(`❌ Invalid expression. Check your syntax.\n\nExample: \`.calc 25 * 4 + 10\``);
    }
  },
};
