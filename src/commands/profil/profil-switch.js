const { SlashCommandBuilder } = require('discord.js');
const { getProfileBySlot, setActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil-switch')
    .setDescription('Définir ton profil RP actif')
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot du profil à activer')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(3)
    ),

  async execute(interaction) {
    const slot = interaction.options.getInteger('slot', true);

    const profile = await getProfileBySlot(interaction.guildId, interaction.user.id, slot);

    if (!profile) {
      await interaction.reply({
        content: `Tu n’as pas de profil dans le **slot ${slot}**.`,
        ephemeral: true
      });
      return;
    }

    await setActiveSlot(interaction.guildId, interaction.user.id, slot);

    await interaction.reply({
      content: `✅ Ton profil actif est maintenant le **slot ${slot}**${profile.nomPrenom ? ` — **${profile.nomPrenom}**` : ''}.`,
      ephemeral: true
    });
  }
};