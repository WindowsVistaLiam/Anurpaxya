const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('titre')
    .setDescription('Voir les titres de ton personnage'),

  async execute(interaction) {
    const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot
    });

    if (!profile) {
      return interaction.reply({
        content: 'Aucun profil actif.',
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`🏅 Titres — ${profile.nomPrenom}`)
      .setDescription(
        profile.titles.length > 0
          ? profile.titles.map(t => `• ${t}`).join('\n')
          : 'Aucun titre obtenu.'
      )
      .addFields({
        name: '📊 Progression',
        value: `Niveau RP : **${profile.rpLevel}**\nMessages RP : **${profile.rpMessages}**`
      });

    await interaction.reply({ embeds: [embed] });
  }
};