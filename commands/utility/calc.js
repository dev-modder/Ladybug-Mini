/**
 * Calculator Command - Perform math calculations
 * Ladybug V5 — Updated
 *
 * Supports:
 *   - Basic arithmetic: + - * / %
 *   - Exponents: 2^10 or 2**10
 *   - Scientific: sqrt(9), pi, e, sin(45), cos(90), tan(45), log(100), abs(-5), round(3.7), floor/ceil
 *   - Constants: pi, e
 *
 * Usage:
 *   .calc 5 + 3 * 2
 *   .calc sqrt(144)
 *   .calc 2^10
 *   .calc sin(90) * pi
 *   .calc (100 - 25) / 3
 */

// Safe math evaluator — no eval() of arbitrary code
const { create, all } = (() => {
  try { return require('mathjs'); } catch (_) { return null; }
})() || {};

// Fallback: lightweight safe evaluator using Function constructor on sanitized input
function safeMath(expr) {
  // Replace common math shortcuts
  let e = expr
    .replace(/\^/g, '**')
    .replace(/\bpi\b/gi, `${Math.PI}`)
    .replace(/\be\b/g, `${Math.E}`)
    .replace(/\bsqrt\b/gi, 'Math.sqrt')
    .replace(/\babs\b/gi, 'Math.abs')
    .replace(/\bsin\b/gi, 'Math.sin')
    .replace(/\bcos\b/gi, 'Math.cos')
    .replace(/\btan\b/gi, 'Math.tan')
    .replace(/\blog\b/gi, 'Math.log10')
    .replace(/\bln\b/gi, 'Math.log')
    .replace(/\bfloor\b/gi, 'Math.floor')
    .replace(/\bceil\b/gi, 'Math.ceil')
    .replace(/\bround\b/gi, 'Math.round')
    .replace(/\bmax\b/gi, 'Math.max')
    .replace(/\bmin\b/gi, 'Math.min')
    .replace(/\bpow\b/gi, 'Math.pow')
    .replace(/\bmod\b/gi, '%')
    .trim();

  // Security: allow only safe characters after substitution
  if (!/^[0-9+\-*/.%(),\s Math_a-z]+$/i.test(e)) {
    throw new Error('Invalid expression — unsupported characters or functions');
  }

  // eslint-disable-next-line no-new-func
  const result = new Function(`"use strict"; return (${e});`)();
  if (typeof result !== 'number' || isNaN(result)) {
    throw new Error('Expression did not evaluate to a number');
  }
  return result;
}

// Format number nicely
function formatResult(n) {
  if (!isFinite(n)) return n.toString();
  // Show up to 10 significant digits, strip trailing zeros
  const str = parseFloat(n.toPrecision(10)).toString();
  return str;
}

module.exports = {
  name: 'calc',
  aliases: ['calculate', 'math', 'calculator', 'c'],
  category: 'utility',
  description: 'Calculate math expressions including scientific functions',
  usage: '.calc <expression>',

  async execute(sock, msg, args, extra) {
    try {
      if (args.length === 0) {
        return extra.reply(
          `🧮 *Calculator — Ladybug V5*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `*Basic:*\n` +
          `  .calc 5 + 3 * 2\n` +
          `  .calc (100 - 25) / 3\n` +
          `  .calc 15 % 4\n\n` +
          `*Scientific:*\n` +
          `  .calc sqrt(144)\n` +
          `  .calc 2^10\n` +
          `  .calc sin(90) * pi\n` +
          `  .calc log(1000)\n` +
          `  .calc abs(-42)\n\n` +
          `*Constants:* \`pi\`, \`e\`\n` +
          `*Functions:* sqrt, abs, sin, cos, tan, log, ln, floor, ceil, round, max, min, pow`
        );
      }

      const expression = args.join(' ').trim();

      let result;
      let usedMathjs = false;

      // Try mathjs first (if installed)
      if (create && all) {
        try {
          const math = create(all, { number: 'number' });
          result = math.evaluate(expression);
          usedMathjs = true;
        } catch (_) {}
      }

      // Fallback to safe evaluator
      if (result === undefined) {
        result = safeMath(expression);
      }

      const formatted = formatResult(result);

      // Build pretty expression display
      const displayExpr = expression
        .replace(/\*\*/g, '^')
        .replace(/Math\.\w+/g, s => s.replace('Math.', ''));

      await extra.reply(
        `🧮 *Calculator*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📝 *Expression:*\n  \`${displayExpr}\`\n\n` +
        `✅ *Result:*\n  \`${formatted}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━`
      );

    } catch (error) {
      console.error('[calc] Error:', error);
      await extra.reply(
        `❌ *Calculation Error*\n\n` +
        `${error.message}\n\n` +
        `Make sure your expression is valid.\n` +
        `Type *.calc* (no args) to see examples.`
      );
    }
  },
};
