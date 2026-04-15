/**
 * GroupReport Command - Detailed group activity & stats report (Ladybug V5.2)
 *
 * Tracks messages per member in a group and generates a leaderboard + insights.
 * Stats are accumulated passively in the background via the handler, or can
 * be built on-demand from the session store.
 *
 * Usage:
 *   .groupreport           — full report for this group
 *   .groupreport top       — top 10 most active members
 *   .groupreport me        — your own activity stats
 *   .groupreport reset     — (admin only) reset stats for this group
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR    = path.join(process.cwd(), 'data');
const STATS_PATH  = path.join(DATA_DIR, 'group_activity.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadStats() {
  try { return fs.existsSync(STATS_PATH) ? JSON.parse(fs.readFileSync(STATS_PATH, 'utf8')) : {}; }
  catch (_) { return {}; }
}
function saveStats(d) { fs.writeFileSync(STATS_PATH, JSON.stringify(d, null, 2), 'utf8'); }

/** Call this from your handler on every incoming group message */
module.exports.trackMessage = function(groupId, senderJid, senderName) {
  try {
    const stats = loadStats();
    if (!stats[groupId]) stats[groupId] = { members: {}, total: 0, since: Date.now() };
    if (!stats[groupId].members[senderJid]) {
      stats[groupId].members[senderJid] = { name: senderName || senderJid.split('@')[0], count: 0, lastSeen: 0 };
    }
    stats[groupId].members[senderJid].count++;
    stats[groupId].members[senderJid].lastSeen = Date.now();
    stats[groupId].members[senderJid].name = senderName || stats[groupId].members[senderJid].name;
    stats[groupId].total++;
    saveStats(stats);
  } catch (_) {}
};

function fmtDate(ts) {
  if (!ts) return 'Unknown';
  const d = new Date(ts);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function medal(i) {
  return ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
}

module.exports = {
  name: 'groupreport',
  aliases: ['greport', 'groupstats2', 'activity', 'leaderboard'],
  category: 'general',
  description: 'Group activity report — message counts, leaderboard, top members',
  usage: '.groupreport | .groupreport top | .groupreport me | .groupreport reset',

  async execute(sock, msg, args, extra) {
    try {
      if (!extra.from.endsWith('@g.us')) {
        return extra.reply('⚠️ This command only works in groups.');
      }

      const chatId    = extra.from;
      const senderJid = msg.key.participant || msg.key.remoteJid;
      const stats     = loadStats();
      const groupData = stats[chatId];
      const sub       = args[0]?.toLowerCase();

      // ── Reset (admin only) ─────────────────────────────────────────────
      if (sub === 'reset') {
        let isAdmin = false;
        try {
          const meta = await sock.groupMetadata(chatId);
          isAdmin = meta.participants.some(p => p.id === senderJid && p.admin);
        } catch (_) {}
        if (!isAdmin) return extra.reply('❌ Only group admins can reset activity stats.');
        if (stats[chatId]) { delete stats[chatId]; saveStats(stats); }
        return extra.reply('🧹 Group activity stats have been reset.');
      }

      // No data yet
      if (!groupData || !Object.keys(groupData.members || {}).length) {
        return extra.reply(
          '📊 *Group Report*\n\n' +
          '📭 No activity data yet.\n\n' +
          '_Stats are tracked as members send messages. Come back after some activity!_'
        );
      }

      const members = Object.entries(groupData.members)
        .map(([jid, d]) => ({ jid, name: d.name, count: d.count, lastSeen: d.lastSeen }))
        .sort((a, b) => b.count - a.count);

      const total = groupData.total || members.reduce((s, m) => s + m.count, 0);
      const since = fmtDate(groupData.since);

      // ── My stats ───────────────────────────────────────────────────────
      if (sub === 'me') {
        const me = members.find(m => m.jid === senderJid);
        if (!me) return extra.reply('📭 No activity found for you in this group yet.');
        const rank = members.indexOf(me) + 1;
        const pct  = total > 0 ? ((me.count / total) * 100).toFixed(1) : 0;
        return extra.reply(
          `📊 *Your Group Activity*\n\n` +
          `👤 Name: ${me.name}\n` +
          `🏆 Rank: #${rank} of ${members.length}\n` +
          `💬 Messages: ${me.count}\n` +
          `📈 Share: ${pct}% of all messages\n` +
          `🕐 Last seen: ${fmtDate(me.lastSeen)}`
        );
      }

      // ── Top 10 ────────────────────────────────────────────────────────
      if (sub === 'top') {
        const top = members.slice(0, 10);
        const lines = top.map((m, i) => `${medal(i)} *${m.name}* — ${m.count} msgs`);
        return await sock.sendMessage(chatId, {
          text:
            `🏆 *Top Active Members*\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n\n` +
            lines.join('\n') +
            `\n\n_Total: ${total} messages tracked_`,
        }, { quoted: msg });
      }

      // ── Full report ────────────────────────────────────────────────────
      let groupMeta;
      try { groupMeta = await sock.groupMetadata(chatId); } catch (_) {}

      const totalMembers = groupMeta?.participants?.length || members.length;
      const activeCount  = members.filter(m => m.count > 0).length;
      const avgMsgs      = (total / Math.max(activeCount, 1)).toFixed(1);
      const top5         = members.slice(0, 5);

      const topLines = top5.map((m, i) => {
        const bar = '█'.repeat(Math.min(10, Math.round((m.count / (top5[0]?.count || 1)) * 10)));
        const pct = total > 0 ? ((m.count / total) * 100).toFixed(1) : 0;
        return `${medal(i)} *${m.name}*\n   ${bar} ${m.count} msgs (${pct}%)`;
      });

      const leastActive = [...members].reverse().slice(0, 3)
        .map(m => `• ${m.name} (${m.count} msgs)`).join('\n');

      const text =
        `📊 *Group Activity Report*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👥 Members: ${totalMembers}\n` +
        `💬 Total Messages: ${total}\n` +
        `🟢 Active Members: ${activeCount}\n` +
        `📈 Avg per member: ${avgMsgs} msgs\n` +
        `📅 Tracking since: ${since}\n\n` +
        `🏆 *Top 5 Most Active*\n\n` +
        topLines.join('\n\n') +
        `\n\n📉 *Least Active*\n${leastActive}\n\n` +
        `_Use .groupreport top for full leaderboard_`;

      await sock.sendMessage(chatId, { text }, { quoted: msg });
    } catch (error) {
      console.error('[groupreport] Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
