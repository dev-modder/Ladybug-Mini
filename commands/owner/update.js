/**
 * Update Command - Pull latest code from Git and optionally restart (owner only)
 * Ladybug V5
 *
 * Requirements: Git must be installed and the bot folder must be a git repo.
 *
 * Usage:
 *   .update            — pull latest, show changes
 *   .update -r         — pull latest, then auto-restart
 */

const { execSync } = require('child_process');
const path = require('path');

function runCmd(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: 'utf8', timeout: 30000 }).trim();
}

module.exports = {
  name: 'update',
  aliases: ['gitpull', 'pullupdate'],
  category: 'owner',
  description: 'Pull the latest bot updates from GitHub',
  usage: '.update [-r to auto-restart after update]',
  ownerOnly: true,
  adminOnly: false,
  groupOnly: false,
  botAdminOnly: false,

  async execute(sock, msg, args, extra) {
    try {
      const autoRestart = args.includes('-r');
      const botDir = path.join(__dirname, '../../');

      await extra.reply('🔄 Checking for updates...');

      // Check if inside a git repo
      let isGit = false;
      try {
        runCmd('git rev-parse --is-inside-work-tree', botDir);
        isGit = true;
      } catch (_) {}

      if (!isGit) {
        return extra.reply(
          '❌ This bot folder is not a Git repository.\n\n' +
          'To enable .update, initialize git:\n' +
          '`git init && git remote add origin <your-repo-url>`'
        );
      }

      // Get current branch + latest local commit
      const branch  = runCmd('git rev-parse --abbrev-ref HEAD', botDir);
      const before  = runCmd('git rev-parse --short HEAD', botDir);

      // Fetch + pull
      let pullOutput;
      try {
        runCmd('git fetch origin', botDir);
        pullOutput = runCmd(`git pull origin ${branch}`, botDir);
      } catch (gitErr) {
        return extra.reply(
          `❌ Git pull failed:\n\`\`\`\n${gitErr.message}\n\`\`\``
        );
      }

      const after = runCmd('git rev-parse --short HEAD', botDir);

      if (before === after) {
        return extra.reply(
          `✅ *Already up to date!*\n\n` +
          `Branch: \`${branch}\`\n` +
          `Commit: \`${before}\``
        );
      }

      // Get changelog between old and new commit
      let changelog = '';
      try {
        changelog = runCmd(`git log ${before}..${after} --oneline`, botDir);
      } catch (_) {}

      let replyText =
        `✅ *Bot Updated!*\n\n` +
        `Branch: \`${branch}\`\n` +
        `Before: \`${before}\`\n` +
        `After:  \`${after}\`\n`;

      if (changelog) {
        replyText += `\n📋 *Changes:*\n${changelog}\n`;
      }

      if (autoRestart) {
        replyText += `\n🔄 Auto-restarting in 2 seconds...`;
      } else {
        replyText += `\n💡 Use \`.update -r\` to auto-restart after update.`;
      }

      await extra.reply(replyText);

      if (autoRestart) {
        setTimeout(() => {
          console.log('[update] Restarting after git pull...');
          process.exit(0);
        }, 2000);
      }

    } catch (error) {
      console.error('[update] Error:', error);
      await extra.reply(`❌ Update failed: ${error.message}`);
    }
  },
};
