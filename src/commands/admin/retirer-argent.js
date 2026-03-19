const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retirer-argent')
    .setDescription('Retire de l’argent du portefeuille d’un profil')
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
        .setDescription('Le montant à retirer')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot ciblé (sinon profil actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const montant = interaction.options.getInteger('montant', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    let profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    if (!profile) {
      profile = await Profile.create({
        guildId: interaction.guildId,
        userId: targetUser.id,
        slot
      });
    }

    profile.wallet = Math.max(0, (profile.wallet || 0) - montant);
    await profile.save();

    await interaction.reply({
      content:
        `✅ **${montant}** pièces ont été retirées à **${targetUser.username}** ` +
        `(**slot ${slot}**).\nPortefeuille actuel : **${profile.wallet}** pièces.`,
      ephemeral: true
    });
  }
};