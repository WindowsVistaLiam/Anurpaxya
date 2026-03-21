const { buildHelpEmbed } = require('../utils/helpEmbeds');
const { buildHelpNavigationRow } = require('../utils/helpComponents');

module.exports = function registerHelpNavigation(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (
      !interaction.customId.startsWith('help_prev:') &&
      !interaction.customId.startsWith('help_next:')
    ) {
      return;
    }

    try {
      const [action, rawPage] = interaction.customId.split(':');
      let page = Number(rawPage) || 1;

      if (action === 'help_prev') {
        page = Math.max(1, page - 1);
      }

      if (action === 'help_next') {
        page = Math.min(4, page + 1);
      }

      await interaction.update({
        embeds: [buildHelpEmbed(page, interaction.guild?.name || 'Serveur RP')],
        components: [buildHelpNavigationRow(page)]
      });
    } catch (error) {
      console.error('❌ Erreur navigation help :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la navigation de l’aide.',
          flags: 64
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la navigation de l’aide.',
          flags: 64
        }).catch(() => {});
      }
    }
  });
};