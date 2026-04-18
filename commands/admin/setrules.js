/**
 * SetRules Command - Set group rules and display them
 * Ladybug Bot Mini | by Dev-Ntando
 */

const database = require('../../database');

module.exports = {
  name: 'setrules',
  aliases: ['rules'],
  category: 'admin',
  description: 'Set or view the group rules',
  usage: '.setrules <rules text> | .setrules to view',
  groupOnly: true,
  adminOnly: true,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      const text = args.join(' ').trim();

      if (!text) {
        const settings = database.getGroupSettings(extra.from);
        const rules = settings.groupRules;
        if (!rules) {
          return extra.reply('📜 No rules have been set for this group yet.\n\nUse *.setrules <your rules>* to set them.');
        }
        return extra.reply(`📜 *Group Rules*\n\n${rules}`);
      }

      const settings = database.getGroupSettings(extra.from);
      settings.groupRules = text;
      database.saveGroupSettings(extra.from, settings);

      await extra.reply(`✅ *Group rules updated!*\n\n📜 *Rules:*\n${text}`);
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },
};
