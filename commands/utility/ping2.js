/**
 * Ping2 Command - Ping an external host or measure bot latency
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'ping2',
  aliases: ['hostping', 'netping'],
  category: 'utility',
  description: 'Ping a host to check if it is reachable',
  usage: '.ping2 [hostname]',

  async execute(sock, msg, args, extra) {
    try {
      const host = args[0] || 'google.com';

      const start = Date.now();
      let status = '❌ Unreachable';
      let httpCode = null;

      try {
        const res = await fetch(`https://${host}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        httpCode = res.status;
        status = '✅ Reachable';
      } catch (_) {
        try {
          const res = await fetch(`http://${host}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000),
          });
          httpCode = res.status;
          status = '✅ Reachable';
        } catch (_) {
          status = '❌ Unreachable';
        }
      }

      const elapsed = Date.now() - start;

      await extra.reply(
        `🌐 *Ping Test*\n\n` +
        `🖥️ Host: *${host}*\n` +
        `${status}\n` +
        `⏱️ Response time: *${elapsed}ms*\n` +
        `${httpCode ? `📡 HTTP Status: *${httpCode}*\n` : ''}` +
        `\n> 🐞 Powered by Ladybug Bot`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
