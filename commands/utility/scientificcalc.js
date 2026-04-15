/**
 * Scientific Calculator Command
 * Ladybug Bot V5 | by Dev-Ntando
 *
 * Extends the basic .calc with trig, log, factorial, permutations, combinations.
 *
 * Usage:
 *   .sci 25 * 4 + 10
 *   .sci sin(pi/6)
 *   .sci factorial(10)
 *   .sci comb(10,3)
 */

'use strict';

const HELP = `🔬 *Scientific Calculator*

*Basic:*  + - * / % ^ (power)
*Functions:* sqrt(), abs(), floor(), ceil(), round()
*Trig:*   sin(), cos(), tan(), asin(), acos(), atan()
*Log:*    log() (base-10), ln() (natural), log2()
*Other:*  max(a,b), min(a,b), factorial(n), perm(n,r), comb(n,r)
*Constants:* pi, e, phi (golden ratio), tau

*Examples:*
  .sci sqrt(144)
  .sci sin(pi/6)
  .sci factorial(10)
  .sci comb(10,3)
  .sci (100 * pi) / tau`;

function factorial(n) {
  n = Math.floor(n);
  if (n < 0) return NaN;
  if (n > 20) return Infinity;
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function perm(n, r) {
  n = Math.floor(n); r = Math.floor(r);
  if (n < 0 || r < 0 || r > n) return NaN;
  return factorial(n) / factorial(n - r);
}

function comb(n, r) {
  n = Math.floor(n); r = Math.floor(r);
  if (n < 0 || r < 0 || r > n) return NaN;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

module.exports = {
  name: 'sci',
  aliases: ['scientific', 'scimath', 'advcalc', 'advancedcalc'],
  category: 'utility',
  description: 'Scientific calculator: trig, log, factorial, combinations and more',
  usage: '.sci <expression>',

  async execute(sock, msg, args, extra) {
    try {
      if (!args.length) return extra.reply(HELP);

      let expression = args.join(' ').trim();

      // Sanitize
      const safe = expression.replace(/[^0-9+\-*/%.^() a-zA-Z,_]/g, '');
      if (!safe.trim()) return extra.reply('❌ Invalid expression.');

      let expr = safe
        .replace(/\bpi\b/gi,    String(Math.PI))
        .replace(/\btau\b/gi,   String(Math.PI * 2))
        .replace(/\bphi\b/gi,   '1.6180339887498948482')
        .replace(/\be\b/g,      String(Math.E))
        .replace(/\^/g,         '**')
        .replace(/\bsqrt\b/gi,      'Math.sqrt')
        .replace(/\bcbrt\b/gi,      'Math.cbrt')
        .replace(/\babs\b/gi,       'Math.abs')
        .replace(/\bfloor\b/gi,     'Math.floor')
        .replace(/\bceil\b/gi,      'Math.ceil')
        .replace(/\bround\b/gi,     'Math.round')
        .replace(/\bsinh\b/gi,      'Math.sinh')
        .replace(/\bcosh\b/gi,      'Math.cosh')
        .replace(/\btanh\b/gi,      'Math.tanh')
        .replace(/\basin\b/gi,      'Math.asin')
        .replace(/\bacos\b/gi,      'Math.acos')
        .replace(/\batan2\b/gi,     'Math.atan2')
        .replace(/\batan\b/gi,      'Math.atan')
        .replace(/\bsin\b/gi,       'Math.sin')
        .replace(/\bcos\b/gi,       'Math.cos')
        .replace(/\btan\b/gi,       'Math.tan')
        .replace(/\blog2\b/gi,      'Math.log2')
        .replace(/\blog10\b/gi,     'Math.log10')
        .replace(/\blog\b/gi,       'Math.log10')
        .replace(/\bln\b/gi,        'Math.log')
        .replace(/\bexp\b/gi,       'Math.exp')
        .replace(/\bpow\b/gi,       'Math.pow')
        .replace(/\bmax\b/gi,       'Math.max')
        .replace(/\bmin\b/gi,       'Math.min')
        .replace(/\bhypot\b/gi,     'Math.hypot')
        .replace(/\btrunc\b/gi,     'Math.trunc')
        .replace(/\bsign\b/gi,      'Math.sign')
        .replace(/\bfactorial\b/gi, '_fact')
        .replace(/\bperm\b/gi,      '_perm')
        .replace(/\bcomb\b/gi,      '_comb');

      // eslint-disable-next-line no-new-func
      const result = Function(
        '"use strict";' +
        'const _fact = ' + factorial.toString() + ';' +
        'const _perm = ' + perm.toString() + ';' +
        'const _comb = ' + comb.toString() + ';' +
        'return (' + expr + ');'
      )();

      if (typeof result !== 'number' || isNaN(result)) {
        return extra.reply('❌ Expression returned an invalid result. Check syntax or use .sci (no args) for help.');
      }
      if (!isFinite(result)) {
        return extra.reply(`⚠️ Result: *${result > 0 ? '+∞' : '-∞'}*\n(Division by zero or overflow)`);
      }

      const formatted = parseFloat(result.toFixed(10)).toString();
      await extra.reply(`🔬 \`${expression}\`\n= *${formatted}*`);

    } catch {
      await extra.reply('❌ Invalid expression.\n\nType .sci (no args) for the full help guide.');
    }
  },
};
