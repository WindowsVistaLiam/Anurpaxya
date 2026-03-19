require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function collectCommandsRecursively(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      collectCommandsRecursively(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.js')) continue;

    const command = require(fullPath);

    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

if (fs.existsSync(commandsPath)) {
  collectCommandsRecursively(commandsPath);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Déploiement des commandes...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Commandes déployées avec succès');
  } catch (error) {
    console.error('❌ Erreur déploiement commandes :', error);
  }
})();