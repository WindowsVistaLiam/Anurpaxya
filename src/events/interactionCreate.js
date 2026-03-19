const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);

      if (!command) {
        await interaction.reply({
          content: 'Commande introuvable.',
          ephemeral: true
        });
        return;
      }

      await command.execute(interaction, client);
    } catch (error) {
      console.error('❌ Erreur interaction :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant le traitement.',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant le traitement.',
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
};