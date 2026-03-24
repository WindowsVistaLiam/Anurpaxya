const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const ReputationHistory = require('../../models/ReputationHistory');
const Profile = require('../../models/Profile');
const { canManageReputation } = require('../../config/permissions');
const { getHistoryPage, buildReputationHistoryEmbed } = require('../../utils/reputationHistoryEmbeds');
const { buildReputationHistoryRows } = require('../../utils/reputationHistoryComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin-reputation-historique')
    .setDescription('Consulter l’historique de réputation d’un profil')
    .addUserOption(option =>
      option.setName('joueur').setDescription('Joueur ciblé').setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('slot').setDescription('Slot ciblé').setRequired(true).setMinValue(1).setMaxValue(10)
    ),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: 'Tu n’as pas la permission d’utiliser cette commande.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetUser = interaction.options.getUser('joueur', true);
    const slot = interaction.options.getInteger('slot', true);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    }).lean();

    if (!profile) {
      await interaction.reply({
        content: `Aucun profil trouvé pour **${targetUser.username}** dans le **slot ${slot}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const entries = await ReputationHistory.find({
      guildId: interaction.guildId,
      targetUserId: targetUser.id,
      targetSlot: slot
    })
      .sort({ createdAt: -1 })
      .lean();

    const page = 1;
    const pageData = getHistoryPage(entries, page);

    await interaction.reply({
      embeds: [
        buildReputationHistoryEmbed({
          guild: interaction.guild,
          profileName: profile.nomPrenom,
          slot,
          entries,
          page,
          targetUser
        })
      ],
      components: buildReputationHistoryRows(
        interaction.user.id,
        targetUser.id,
        slot,
        pageData.page,
        pageData.totalPages
      ),
      flags: MessageFlags.Ephemeral
    });
  }
};