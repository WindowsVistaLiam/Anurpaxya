const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('repos')
    .setDescription('Se reposer pour réduire la souillure de ton profil actif'),

  async execute(interaction) {
    const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: `Tu n’as pas de profil dans ton **slot actif (${slot})**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const oldSouillure = Number(profile.souillure) || 0;

    if (oldSouillure <= 0) {
      await interaction.reply({
        content: 'Ton profil actif ne possède aucune souillure à dissiper.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const newSouillure = Math.max(0, Number((oldSouillure - 10).toFixed(2)));
    profile.souillure = newSouillure;

    await profile.save();

    await interaction.reply({
      content:
        `🛌 **${profile.nomPrenom || interaction.user.username}** se repose.\n` +
        `Souillure : **${oldSouillure}%** → **${newSouillure}%**`,
      flags: MessageFlags.Ephemeral
    });
  }
};