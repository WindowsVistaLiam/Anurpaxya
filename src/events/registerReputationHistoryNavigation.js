const { MessageFlags } = require('discord.js');
const ReputationHistory = require('../models/ReputationHistory');
const Profile = require('../models/Profile');
const { buildReputationHistoryEmbed, getHistoryPage } = require('../utils/reputationHistoryEmbeds');
const { buildReputationHistoryRows } = require('../utils/reputationHistoryComponents');

module.exports = function registerReputationHistoryNavigation(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (!interaction.isButton()) return;
      if (
        !interaction.customId.startsWith('rep_history_prev:') &&
        !interaction.customId.startsWith('rep_history_next:')
      ) {
        return;
      }

      const [action, ownerUserId, targetUserId, rawSlot, rawPage] = interaction.customId.split(':');
      const slot = Number(rawSlot);
      let page = Number(rawPage) || 1;

      if (interaction.user.id !== ownerUserId) {
        await interaction.reply({
          content: 'Tu ne peux pas utiliser cette interface.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (action === 'rep_history_prev') {
        page -= 1;
      } else {
        page += 1;
      }

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

      const entries = await ReputationHistory.find({
        guildId: interaction.guildId,
        targetUserId,
        targetSlot: slot
      })
        .sort({ createdAt: -1 })
        .lean();

      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (!targetUser) {
        await interaction.reply({
          content: 'Impossible de retrouver cet utilisateur.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const pageData = getHistoryPage(entries, page);

      await interaction.update({
        embeds: [
          buildReputationHistoryEmbed({
            guild: interaction.guild,
            profileName: profile.nomPrenom,
            slot,
            entries,
            page: pageData.page,
            targetUser
          })
        ],
        components: buildReputationHistoryRows(
          ownerUserId,
          targetUserId,
          slot,
          pageData.page,
          pageData.totalPages
        )
      });
    } catch (error) {
      console.error('❌ Erreur navigation historique réputation :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la navigation de l’historique.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la navigation de l’historique.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });
};