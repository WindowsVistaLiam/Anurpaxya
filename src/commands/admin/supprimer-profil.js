const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');
const {
  getAllProfiles,
  getActiveSlot,
  setActiveSlot
} = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('supprimer-profil')
    .setDescription('Supprime un profil RP d’un joueur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot du profil à supprimer')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(3)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const slot = interaction.options.getInteger('slot', true);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: `Aucun profil trouvé pour **${targetUser.username}** dans le **slot ${slot}**.`,
        ephemeral: true
      });
      return;
    }

    const activeSlot = await getActiveSlot(interaction.guildId, targetUser.id);

    await Profile.deleteOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    const remainingProfiles = await getAllProfiles(interaction.guildId, targetUser.id);

    if (remainingProfiles.length === 0) {
      await setActiveSlot(interaction.guildId, targetUser.id, 1);
    } else if (activeSlot === slot) {
      await setActiveSlot(interaction.guildId, targetUser.id, remainingProfiles[0].slot);
    }

    await interaction.reply({
      content:
        `✅ Le profil du **slot ${slot}** de **${targetUser.username}** a bien été supprimé.\n` +
        `Nom du profil supprimé : **${profile.nomPrenom || 'Sans nom'}**`,
      ephemeral: true
    });
  }
};