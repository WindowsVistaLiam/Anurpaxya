const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const Profile = require('../models/Profile');
const { buildProfilePagePayload } = require('../utils/profilePagePayload');

function buildProfileNavigationRows(targetUserId, slot, currentPage) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`profile_prev:${targetUserId}:${slot}:${currentPage}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1),
      new ButtonBuilder()
        .setCustomId(`profile_next:${targetUserId}:${slot}:${currentPage}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= 3)
    )
  ];
}

module.exports = function registerProfileNavigation(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (!interaction.isButton()) return;
      if (
        !interaction.customId.startsWith('profile_prev:') &&
        !interaction.customId.startsWith('profile_next:')
      ) {
        return;
      }

      const [action, targetUserId, rawSlot, rawPage] = interaction.customId.split(':');
      const slot = Number(rawSlot);
      let page = Number(rawPage) || 1;

      if (action === 'profile_prev') {
        page -= 1;
      } else {
        page += 1;
      }

      page = Math.max(1, Math.min(3, page));

      const profile = await Profile.findOne({
        guildId: interaction.guildId,
        userId: targetUserId,
        slot
      }).lean();

      if (!profile) {
        await interaction.reply({
          content: 'Ce profil est introuvable.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (!targetUser) {
        await interaction.reply({
          content: 'Impossible de retrouver cet utilisateur.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const payload = await buildProfilePagePayload(profile, targetUser, interaction.guild, page);

      await interaction.update({
        ...payload,
        components: buildProfileNavigationRows(targetUserId, slot, page)
      });
    } catch (error) {
      console.error('❌ Erreur navigation profil :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la navigation du profil.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la navigation du profil.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });
};