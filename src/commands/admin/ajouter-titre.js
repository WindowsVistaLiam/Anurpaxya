const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { isMj } = require('../../utils/profileLimits');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-titre')
    .setDescription('Ajouter un titre RP à un joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur qui recevra le titre')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('titre')
        .setDescription('Le titre à ajouter')
        .setRequired(true)
        .setMaxLength(100)
    ),

  async execute(interaction) {
    const member = interaction.member;

    if (
      !member.permissions.has(PermissionFlagsBits.Administrator) &&
      !isMj(member)
    ) {
      await interaction.reply({
        content: 'Permission refusée.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const user = interaction.options.getUser('utilisateur', true);
    const title = interaction.options.getString('titre', true).trim();

    const slot = await getActiveSlot(interaction.guildId, user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: user.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: 'Profil introuvable.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!profile.titles.includes(title)) {
      profile.titles.push(title);
      await profile.save();
    }

    await interaction.reply({
      content: `🏅 Titre ajouté à ${user.username} : **${title}**`,
      flags: MessageFlags.Ephemeral
    });
  }
};