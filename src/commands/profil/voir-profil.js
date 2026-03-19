const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../../models/Profile');
const { buildProfileEmbeds } = require('../../utils/profileEmbeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voir-profil')
    .setDescription('Voir le profil RP d’un joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur dont tu veux voir le profil')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur') || interaction.user;

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id
    }).lean();

    if (!profile) {
      await interaction.reply({
        content:
          targetUser.id === interaction.user.id
            ? 'Tu n’as pas encore de profil RP. Utilise `/profil` pour le créer.'
            : `${targetUser.username} n’a pas encore de profil RP.`,
        ephemeral: true
      });
      return;
    }

    const embeds = buildProfileEmbeds(profile, targetUser, interaction.guild);

    await interaction.reply({
      embeds
    });
  }
};