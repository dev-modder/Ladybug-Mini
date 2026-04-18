/**
 * Benchmark Command - Quick bot performance benchmark
 * Ladybug Bot Mini | by Dev-Ntando
 */

module.exports = {
  name: 'benchmark',
  aliases: ['perf', 'speedtest'],
  category: 'utility',
  description: 'Run a quick performance benchmark on the bot',
  usage: '.benchmark',

  async execute(sock, msg, args, extra) {
    try {
      const start = Date.now();

      // CPU benchmark
      const cpuStart = process.hrtime.bigint();
      let n = 0;
      for (let i = 0; i < 1_000_000; i++) n += Math.sqrt(i);
      const cpuEnd = process.hrtime.bigint();
      const cpuMs = Number(cpuEnd - cpuStart) / 1_000_000;

      // Memory snapshot
      const mem = process.memoryUsage();

      // Network latency to Google
      const netStart = Date.now();
      let netMs = 0;
      try {
        await fetch('https://www.google.com', { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        netMs = Date.now() - netStart;
      } catch (_) {
        netMs = -1;
      }

      const totalMs = Date.now() - start;

      await extra.reply(
        `⚡ *Performance Benchmark*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🧮 *CPU Test (1M ops):* ${cpuMs.toFixed(1)}ms\n` +
        `🌐 *Network Latency:* ${netMs >= 0 ? netMs + 'ms' : 'Timeout'}\n` +
        `💾 *Heap Used:* ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB\n` +
        `💾 *RSS:* ${(mem.rss / 1024 / 1024).toFixed(1)} MB\n` +
        `⏱️ *Total time:* ${totalMs}ms\n\n` +
        `${cpuMs < 100 ? '🟢 Performance: Excellent' : cpuMs < 300 ? '🟡 Performance: Good' : '🔴 Performance: Slow'}\n\n` +
        `> 🐞 Powered by Ladybug Bot`
      );
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
