const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { isMj } = require('../../utils/profileLimits');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retirer-titre')
    .setDescription('Retirer un titre à un joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('titre')
        .setDescription('Le titre à retirer')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Slot du profil (sinon actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async autocomplete(interaction) {
    try {
      const user = interaction.options.getUser('utilisateur');
      const focused = interaction.options.getFocused().toLowerCase();

      if (!user) {
        return interaction.respond([]);
      }

      const slot =
        interaction.options.getInteger('slot') ||
        await getActiveSlot(interaction.guildId, user.id);

      const profile = await Profile.findOne({
        guildId: interaction.guildId,
        userId: user.id,
        slot
      }).lean();

      if (!profile || !profile.titles) {
        return interaction.respond([]);
      }

      const results = profile.titles
        .filter(t => t.toLowerCase().includes(focused))
        .slice(0, 25)
        .map(t => ({
          name: t,
          value: t
        }));

      await interaction.respond(results);
    } catch (error) {
      console.error('❌ autocomplete retirer-titre :', error);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const member = interaction.member;

    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const mj = isMj(member);

    if (!isAdmin && !mj) {
      return interaction.reply({
        content: 'Tu n’as pas la permission.',
        flags: MessageFlags.Ephemeral
      });
    }

    const user = interaction.options.getUser('utilisateur', true);
    const title = interaction.options.getString('titre', true);
    const slotOption = interaction.options.getInteger('slot');

    const slot =
      slotOption || await getActiveSlot(interaction.guildId, user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: user.id,
      slot
    });

    if (!profile) {
      return interaction.reply({
        content: `Profil introuvable (slot ${slot}).`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (!profile.titles.includes(title)) {
      return interaction.reply({
        content: `Ce joueur ne possède pas ce titre.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // 🔥 Retirer le titre
    profile.titles = profile.titles.filter(t => t !== title);

    // 🔥 Si c'était le titre équipé → on l'enlève aussi
    if (profile.equippedTitle === title) {
      profile.equippedTitle = '';
    }

    await profile.save();

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('❌ Titre retiré')
      .setDescription(
        `**${profile.nomPrenom || user.username}** perd le titre :\n\n` +
        `*${title}*`
      )
      .setThumbnail(profile.imageUrl || user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `Slot ${slot} • ${user.username}`
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  }
};