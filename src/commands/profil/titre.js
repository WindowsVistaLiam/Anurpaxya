const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { getTitleRarityDisplay } = require('../../utils/titleUtils');

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
      await interaction.reply({
        content: 'Aucun profil actif.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const titleLines = profile.titles.length > 0
      ? profile.titles.map(title => {
          const equipped = profile.equippedTitle === title.name ? '✅ ' : '• ';
          return `${equipped}${getTitleRarityDisplay(title.name, title.rarity)}`;
        }).join('\n')
      : 'Aucun titre obtenu.';

    const equippedTitleData = profile.titles.find(t => t.name === profile.equippedTitle);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`🏅 Titres — ${profile.nomPrenom || interaction.user.username}`)
      .setDescription(titleLines)
      .addFields(
        {
          name: '📊 Progression',
          value:
            `Niveau RP : **${profile.rpLevel || 1}**\n` +
            `Messages RP : **${profile.rpMessages || 0}**`,
          inline: false
        },
        {
          name: '🎖️ Titre équipé',
          value: equippedTitleData
            ? getTitleRarityDisplay(equippedTitleData.name, equippedTitleData.rarity)
            : 'Aucun titre équipé',
          inline: false
        }
      )
      .setThumbnail(profile.imageUrl || interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `Slot ${profile.slot} • ${interaction.user.username}`
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};