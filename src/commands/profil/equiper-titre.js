const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equiper-titre')
    .setDescription('Équiper un titre sur ton profil actif')
    .addStringOption(option =>
      option
        .setName('titre')
        .setDescription('Le titre à équiper')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

      const profile = await Profile.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        slot
      }).lean();

      if (!profile || !Array.isArray(profile.titles)) {
        await interaction.respond([]);
        return;
      }

      const filtered = profile.titles
        .filter(title => title.toLowerCase().includes(focusedValue))
        .slice(0, 25)
        .map(title => ({
          name: title,
          value: title
        }));

      await interaction.respond(filtered);
    } catch (error) {
      console.error('❌ Erreur autocomplete equiper-titre :', error);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const selectedTitle = interaction.options.getString('titre', true);
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

    if (!profile.titles.includes(selectedTitle)) {
      await interaction.reply({
        content: 'Tu ne possèdes pas ce titre sur ton profil actif.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    profile.equippedTitle = selectedTitle;
    await profile.save();

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🏅 Titre équipé')
      .setDescription(
        `**${profile.nomPrenom || interaction.user.username}** équipe désormais :\n\n` +
        `*${selectedTitle}*`
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