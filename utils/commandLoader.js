/**
 * Command Loader - Separate module to avoid circular dependencies
 */

const fs = require('fs');
const path = require('path');

// Load all commands
const loadCommands = () => {
  const commands = new Map();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const errors = [];
  let loaded = 0;

  if (!fs.existsSync(commandsPath)) {
    console.log('⚠️  Commands directory not found');
    return commands;
  }

  const categories = fs.readdirSync(commandsPath);

  categories.forEach(category => {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) return;

    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

    files.forEach(file => {
      const filePath = path.join(categoryPath, file);
      try {
        const command = require(filePath);
        if (command && command.name) {
          commands.set(command.name, command);
          loaded++;
          if (Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
              commands.set(alias, command);
            });
          }
        } else if (command) {
          errors.push(`${category}/${file}: missing 'name' export`);
        }
      } catch (error) {
        errors.push(`${category}/${file}: ${error.message}`);
      }
    });
  });

  if (errors.length) {
    console.warn(`⚠️  Command loader — ${errors.length} error(s):`);
    errors.forEach(e => console.warn(`   • ${e}`));
  }
  console.log(`✅ Loaded ${loaded} commands (${commands.size} entries incl. aliases)`);

  return commands;
};

module.exports = { loadCommands };

