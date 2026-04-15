/**
 * ChatList Command - List all active chats (owner only)
 * Ladybug V5
 *
 * Usage: .chatlist [groups|private]
 */

'use strict';

module.exports = {
  name: 'chatlist',
  aliases: ['listchats', 'allchats'],
  category: 'owner',
  description: 'List all active chats the bot has',
  usage: '.chatlist [groups|private]',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const filter = args[0]?.toLowerCase();
      const store = sock.store || sock._store;

      if (!store || !store.chats) {
        return extra.reply('⚠️ Chat store is unavailable on this connection type.');
      }

      let chats = Object.values(store.chats.all ? store.chats.all() : store.chats);

      if (filter === 'groups') chats = chats.filter(c => c.id?.endsWith('@g.us'));
      else if (filter === 'private') chats = chats.filter(c => c.id?.endsWith('@s.whatsapp.net'));

      if (!chats.length) {
        return extra.reply(`📭 No ${filter || ''} chats found.`);
      }

      const lines = chats.slice(0, 50).map((c, i) => {
        const type = c.id.endsWith('@g.us') ? '🏘️' : '👤';
        const name = c.name || c.id.split('@')[0];
        return `${i + 1}. ${type} ${name}`;
      });

      const more = chats.length > 50 ? `\n\n_...and ${chats.length - 50} more_` : '';
      await extra.reply(`💬 *Chat List (${chats.length})*\n━━━━━━━━━━━━━━━━━\n\n${lines.join('\n')}${more}`);
    } catch (error) {
      console.error('[chatlist] Error:', error);
      await extra.reply(`❌ Failed to list chats: ${error.message}`);
    }
  },
};
