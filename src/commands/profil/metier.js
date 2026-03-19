const { SlashCommandBuilder } = require('discord.js');
const { getActiveSlot } = require('../../services/profileService');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('metier')
    .setDescription('Modifier le métier du profil actif')
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Le nom de ton métier')
        .setRequired(true)
        .setMaxLength(100)
    ),

  async execute(interaction) {
    const nomMetier = interaction.options.getString('nom', true).trim();
    const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

    const profile = await Profile.findOneAndUpdate(
      {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        slot
      },
      {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        slot,
        metier: nomMetier
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    await interaction.reply({
      content: `✅ Le métier du **profil actif (slot ${slot})** a été mis à jour : **${profile.metier}**`,
      ephemeral: true
    });
  }
};