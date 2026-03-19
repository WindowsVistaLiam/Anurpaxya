const Profile = require('../models/Profile');
const { buildProfileEmbed } = require('../utils/profileEmbeds');
const { buildProfileNavigationRow } = require('../utils/profileComponents');

module.exports = function registerProfileNavigation(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (
      !interaction.customId.startsWith('profile_page:') &&
      !interaction.customId.startsWith('profile_prev:') &&
      !interaction.customId.startsWith('profile_next:')
    ) {
      return;
    }

    try {
      const parts = interaction.customId.split(':');
      const action = parts[0];
      const targetUserId = parts[1];
      const slot = Number(parts[2]);
      const rawPage = Number(parts[3]);
      let page = rawPage || 1;

      if (action === 'profile_prev') page = Math.max(1, page - 1);
      if (action === 'profile_next') page = Math.min(3, page + 1);
      if (action === 'profile_page') page = Math.min(3, Math.max(1, Number(parts[3]) || 1));

      const targetUser = await client.users.fetch(targetUserId).catch(() => null);

      if (!targetUser) {
        await interaction.reply({
          content: 'Impossible de retrouver cet utilisateur.',
          ephemeral: true
        });
        return;
      }

      const profile = await Profile.findOne({
        guildId: interaction.guildId,
        userId: targetUserId,
        slot
      }).lean();

      if (!profile) {
        await interaction.reply({
          content: 'Ce profil n’existe plus.',
          ephemeral: true
        });
        return;
      }

      const embed = buildProfileEmbed(profile, targetUser, interaction.guild, page);
      const components = [buildProfileNavigationRow(targetUserId, slot, page)];

      await interaction.update({
        embeds: [embed],
        components
      });
    } catch (error) {
      console.error('❌ Erreur navigation profil :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la navigation du profil.',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la navigation du profil.',
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};