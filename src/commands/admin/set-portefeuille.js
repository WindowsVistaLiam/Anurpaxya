const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-portefeuille')
    .setDescription('Définit le montant du portefeuille d’un profil')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('montant')
        .setDescription('Le nouveau montant')
        .setRequired(true)
        .setMinValue(0)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot ciblé (sinon profil actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(3)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const montant = interaction.options.getInteger('montant', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    const profile = await Profile.findOneAndUpdate(
      {
        guildId: interaction.guildId,
        userId: targetUser.id,
        slot
      },
      {
        guildId: interaction.guildId,
        userId: targetUser.id,
        slot,
        wallet: montant
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await interaction.reply({
      content:
        `✅ Le portefeuille de **${targetUser.username}** ` +
        `(**slot ${slot}**) est maintenant de **${profile.wallet}** pièces.`,
      ephemeral: true
    });
  }
};