/**
 * Calculator2 — Conversational multi-step calculator (Ladybug V5.2)
 *
 * Goes beyond basic .calc — supports:
 *   • Unit conversions  (km→miles, kg→lbs, C→F, USD→ZAR etc.)
 *   • Percentage helpers (tip, discount, tax, markup)
 *   • Loan/instalment calculator
 *   • BMI calculator
 *   • Age calculator
 *   • Plain math expressions (fallback)
 *
 * Usage:
 *   .convert 100 km to miles
 *   .convert 37 C to F
 *   .tip 250 15%
 *   .discount 500 20%
 *   .loan 10000 12% 24
 *   .bmi 70 1.75
 *   .age 2000-05-14
 *   .tax 199.99 15%
 */

'use strict';

// ── Unit conversion table ─────────────────────────────────────────────────────
const CONVERSIONS = {
  // Length
  km_miles:  v => v * 0.621371,   miles_km:  v => v / 0.621371,
  km_m:      v => v * 1000,       m_km:      v => v / 1000,
  m_cm:      v => v * 100,        cm_m:      v => v / 100,
  m_ft:      v => v * 3.28084,    ft_m:      v => v / 3.28084,
  ft_inches: v => v * 12,         inches_ft: v => v / 12,
  inches_cm: v => v * 2.54,       cm_inches: v => v / 2.54,
  // Weight
  kg_lbs:    v => v * 2.20462,    lbs_kg:    v => v / 2.20462,
  kg_g:      v => v * 1000,       g_kg:      v => v / 1000,
  // Temperature
  c_f:       v => v * 9/5 + 32,   f_c:       v => (v - 32) * 5/9,
  c_k:       v => v + 273.15,     k_c:       v => v - 273.15,
  // Volume
  l_ml:      v => v * 1000,       ml_l:      v => v / 1000,
  l_gallons: v => v * 0.264172,   gallons_l: v => v / 0.264172,
  // Speed
  kmh_mph:   v => v * 0.621371,   mph_kmh:   v => v / 0.621371,
  // Data
  gb_mb:     v => v * 1024,       mb_gb:     v => v / 1024,
  tb_gb:     v => v * 1024,       gb_tb:     v => v / 1024,
};

const ALIASES = {
  kilometres: 'km', kilometer: 'km', kilometre: 'km',
  mile: 'miles', meter: 'm', metre: 'm', centimeter: 'cm', centimetre: 'cm',
  foot: 'ft', feet: 'ft', inch: 'inches',
  kilogram: 'kg', kilograms: 'kg', pound: 'lbs', pounds: 'lbs', gram: 'g', grams: 'g',
  celsius: 'c', fahrenheit: 'f', kelvin: 'k',
  litre: 'l', liter: 'l', liters: 'l', litres: 'l', gallon: 'gallons',
  megabyte: 'mb', megabytes: 'mb', gigabyte: 'gb', gigabytes: 'gb', terabyte: 'tb',
};

function normaliseUnit(u) {
  const l = u.toLowerCase().replace(/°/g, '').trim();
  return ALIASES[l] || l;
}

function convert(value, from, to) {
  const key = `${normaliseUnit(from)}_${normaliseUnit(to)}`;
  const fn  = CONVERSIONS[key];
  if (!fn) return null;
  return fn(value);
}

// ── Safe math eval ────────────────────────────────────────────────────────────
function safeMath(expr) {
  const clean = expr.replace(/[^0-9+\-*/%.()^ ]/g, '').replace(/\^/g, '**');
  try {
    const result = Function(`"use strict"; return (${clean})`)();
    if (!isFinite(result)) return null;
    return result;
  } catch (_) { return null; }
}

function round(n, dp = 4) {
  return parseFloat(n.toFixed(dp));
}

// ── Command ───────────────────────────────────────────────────────────────────
module.exports = {
  name: 'convert',
  aliases: ['tip', 'discount', 'tax', 'loan', 'bmi', 'age', 'calc2', 'percentage'],
  category: 'general',
  description: 'Multi-purpose calculator: conversions, percentages, loan, BMI, age',
  usage: '.convert 100 km to miles | .tip 200 15% | .discount 500 20% | .loan 5000 12% 24 | .bmi 70 1.75 | .age 2001-05-14',

  async execute(sock, msg, args, extra) {
    try {
      const cmd  = extra.command?.toLowerCase() || 'convert';
      const text = args.join(' ').trim();

      if (!text) {
        return extra.reply(
          `🧮 *Multi-Purpose Calculator*\n\n` +
          `📐 *Convert:*\n` +
          `  .convert 100 km to miles\n` +
          `  .convert 37 C to F\n` +
          `  .convert 5 kg to lbs\n` +
          `  .convert 1 gb to mb\n\n` +
          `💸 *Finance:*\n` +
          `  .tip 250 15%          — tip calculator\n` +
          `  .discount 500 20%     — discount price\n` +
          `  .tax 199.99 15%       — price + tax\n` +
          `  .loan 10000 12% 24    — monthly instalment\n\n` +
          `🏋️ *Health:*\n` +
          `  .bmi 70 1.75          — BMI (kg, meters)\n\n` +
          `📅 *Age:*\n` +
          `  .age 2001-05-14       — age from birthdate`
        );
      }

      // ── TIP ──────────────────────────────────────────────────────────────
      if (cmd === 'tip') {
        const m = text.match(/([\d.]+)\s+([\d.]+)%?/);
        if (!m) return extra.reply('❌ Usage: .tip <amount> <percent>\nExample: .tip 250 15');
        const bill = parseFloat(m[1]);
        const pct  = parseFloat(m[2]);
        const tip  = bill * pct / 100;
        return extra.reply(
          `💰 *Tip Calculator*\n\n` +
          `Bill:    ${bill.toFixed(2)}\n` +
          `Tip (${pct}%): ${tip.toFixed(2)}\n` +
          `Total:   ${(bill + tip).toFixed(2)}\n\n` +
          `_Per person (2): ${((bill + tip) / 2).toFixed(2)}_\n` +
          `_Per person (4): ${((bill + tip) / 4).toFixed(2)}_`
        );
      }

      // ── DISCOUNT ─────────────────────────────────────────────────────────
      if (cmd === 'discount') {
        const m = text.match(/([\d.]+)\s+([\d.]+)%?/);
        if (!m) return extra.reply('❌ Usage: .discount <price> <percent>\nExample: .discount 500 20');
        const price = parseFloat(m[1]);
        const pct   = parseFloat(m[2]);
        const saved = price * pct / 100;
        return extra.reply(
          `🏷️ *Discount Calculator*\n\n` +
          `Original:   ${price.toFixed(2)}\n` +
          `Discount:   -${saved.toFixed(2)} (${pct}%)\n` +
          `You pay:    *${(price - saved).toFixed(2)}*\n` +
          `You save:   ${saved.toFixed(2)}`
        );
      }

      // ── TAX ──────────────────────────────────────────────────────────────
      if (cmd === 'tax') {
        const m = text.match(/([\d.]+)\s+([\d.]+)%?/);
        if (!m) return extra.reply('❌ Usage: .tax <price> <tax%>\nExample: .tax 199.99 15');
        const price = parseFloat(m[1]);
        const pct   = parseFloat(m[2]);
        const taxAmt = price * pct / 100;
        return extra.reply(
          `🧾 *Tax Calculator*\n\n` +
          `Price (ex-tax): ${price.toFixed(2)}\n` +
          `Tax (${pct}%):       ${taxAmt.toFixed(2)}\n` +
          `Total (inc-tax): *${(price + taxAmt).toFixed(2)}*`
        );
      }

      // ── LOAN ─────────────────────────────────────────────────────────────
      if (cmd === 'loan') {
        const m = text.match(/([\d.]+)\s+([\d.]+)%?\s+(\d+)/);
        if (!m) return extra.reply('❌ Usage: .loan <amount> <annual rate%> <months>\nExample: .loan 10000 12% 24');
        const P  = parseFloat(m[1]);
        const r  = parseFloat(m[2]) / 100 / 12;  // monthly rate
        const n  = parseInt(m[3]);
        const monthly = r === 0
          ? P / n
          : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalPay = monthly * n;
        const interest = totalPay - P;
        return extra.reply(
          `🏦 *Loan Calculator*\n\n` +
          `Principal:       ${P.toFixed(2)}\n` +
          `Annual Rate:     ${parseFloat(m[2])}%\n` +
          `Term:            ${n} months\n\n` +
          `Monthly Payment: *${monthly.toFixed(2)}*\n` +
          `Total Paid:      ${totalPay.toFixed(2)}\n` +
          `Total Interest:  ${interest.toFixed(2)}`
        );
      }

      // ── BMI ──────────────────────────────────────────────────────────────
      if (cmd === 'bmi') {
        const m = text.match(/([\d.]+)\s+([\d.]+)/);
        if (!m) return extra.reply('❌ Usage: .bmi <weight_kg> <height_m>\nExample: .bmi 70 1.75');
        const kg = parseFloat(m[1]);
        const h  = parseFloat(m[2]);
        const bmi = kg / (h * h);
        let category;
        if (bmi < 18.5)     category = '🟡 Underweight';
        else if (bmi < 25)  category = '🟢 Normal weight';
        else if (bmi < 30)  category = '🟡 Overweight';
        else                category = '🔴 Obese';
        return extra.reply(
          `⚖️ *BMI Calculator*\n\n` +
          `Weight: ${kg} kg\n` +
          `Height: ${h} m\n\n` +
          `BMI:    *${bmi.toFixed(1)}*\n` +
          `Result: ${category}\n\n` +
          `_Healthy range: 18.5 – 24.9_`
        );
      }

      // ── AGE ──────────────────────────────────────────────────────────────
      if (cmd === 'age') {
        const dateStr = text.replace(/[^0-9\-/]/g, '');
        const dob     = new Date(dateStr);
        if (isNaN(dob.getTime())) return extra.reply('❌ Usage: .age <YYYY-MM-DD>\nExample: .age 2001-05-14');
        const now   = new Date();
        let years   = now.getFullYear() - dob.getFullYear();
        let months  = now.getMonth()   - dob.getMonth();
        let days    = now.getDate()    - dob.getDate();
        if (days < 0)   { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
        if (months < 0) { years--;  months += 12; }
        const nextBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        if (nextBday < now) nextBday.setFullYear(nextBday.getFullYear() + 1);
        const daysLeft = Math.ceil((nextBday - now) / 86400000);
        return extra.reply(
          `🎂 *Age Calculator*\n\n` +
          `Date of Birth: ${dob.toDateString()}\n\n` +
          `Age: *${years} years, ${months} months, ${days} days*\n` +
          `🎉 Next birthday in: ${daysLeft} day(s)`
        );
      }

      // ── CONVERT ──────────────────────────────────────────────────────────
      if (cmd === 'convert' || cmd === 'percentage') {
        // Match: <value> <unit> to <unit>
        const m = text.match(/([\d.]+)\s+(\S+)\s+(?:to|in|=|→)\s+(\S+)/i);
        if (m) {
          const val    = parseFloat(m[1]);
          const result = convert(val, m[2], m[3]);
          if (result !== null) {
            return extra.reply(
              `📐 *Conversion*\n\n` +
              `${val} ${m[2]} = *${round(result)} ${m[3]}*`
            );
          }
          return extra.reply(`❌ Sorry, I don't know how to convert *${m[2]}* to *${m[3]}*.\n\nTry: .convert 100 km to miles`);
        }

        // Fallback: plain math
        const mathResult = safeMath(text);
        if (mathResult !== null) {
          return extra.reply(`🧮 ${text} = *${round(mathResult)}*`);
        }

        return extra.reply('❌ Could not parse that.\n\nExamples:\n.convert 100 km to miles\n.convert 37 C to F\n.convert 5 kg to lbs');
      }

    } catch (error) {
      console.error('[calculator2] Error:', error);
      await extra.reply(`❌ Calculation error: ${error.message}`);
    }
  },
};
