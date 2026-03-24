const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { buildEquipmentPanelEmbed } = require('../../utils/equipmentEmbeds');
const { buildEquipmentRows } = require('../../utils/equipmentComponents');
const { createInventoryAttachment } = require('../../utils/inventoryCanvas');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equipement')
    .setDescription('Gérer les objets équipés de ton profil actif'),

  async execute(interaction) {
    const activeSlot = await getActiveSlot(interaction.guildId, interaction.user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot: activeSlot
    });

    if (!profile) {
      await interaction.reply({
        content: `Tu n’as pas de profil RP dans le **slot ${activeSlot}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const attachment = await createInventoryAttachment(profile);

    await interaction.reply({
      embeds: [buildEquipmentPanelEmbed(profile, interaction.user).setImage('attachment://inventaire-silhouette.png')],
      files: [attachment],
      components: buildEquipmentRows(interaction.user.id, activeSlot, profile),
      flags: MessageFlags.Ephemeral
    });
  }
};