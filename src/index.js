require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { connectDatabase } = require('./config/database');
const registerModals = require('./events/registerModals');
const registerProfileNavigation = require('./events/registerProfileNavigation');
const registerTradeInteractions = require('./events/registerTradeInteractions');
const registerShopNavigation = require('./events/registerShopNavigation');
const registerHelpNavigation = require('./events/registerHelpNavigation');
const registerExchangeDraftInteractions = require('./events/registerExchangeDraftInteractions');
const registerExchangeConfirmations = require('./events/registerExchangeConfirmations');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');

function loadCommandsRecursively(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      loadCommandsRecursively(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.js')) continue;

    const command = require(fullPath);

    if (!command.data || !command.execute) {
      console.warn(`⚠️ Commande invalide ignorée : ${fullPath}`);
      continue;
    }

    client.commands.set(command.data.name, command);
  }
}

if (fs.existsSync(commandsPath)) {
  loadCommandsRecursively(commandsPath);
}

const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(
    file =>
      file.endsWith('.js') &&
      file !== 'registerModals.js' &&
      file !== 'registerProfileNavigation.js' &&
      file !== 'registerTradeInteractions.js' &&
      file !== 'registerShopNavigation.js' &&
      file !== 'registerHelpNavigation.js' &&
      file !== 'registerExchangeDraftInteractions.js' &&
      file !== 'registerExchangeConfirmations.js'
  );

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

registerModals(client);
registerProfileNavigation(client);
registerTradeInteractions(client);
registerShopNavigation(client);
registerHelpNavigation(client);
registerExchangeDraftInteractions(client);
registerExchangeConfirmations(client);

(async () => {
  await connectDatabase();
  await client.login(process.env.DISCORD_TOKEN);
})();