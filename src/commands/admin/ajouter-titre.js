const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { isMj } = require('../../utils/profileLimits');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-titre')
    .setDescription('Ajouter un titre RP à un joueur')
    .addUserOption(o => o.setName('utilisateur').setRequired(true))
    .addStringOption(o => o.setName('titre').setRequired(true)),

  async execute(interaction) {
    const member = interaction.member;

    if (
      !member.permissions.has(PermissionFlagsBits.Administrator) &&
      !isMj(member)
    ) {
      return interaction.reply({
        content: 'Permission refusée.',
        flags: 64
      });
    }

    const user = interaction.options.getUser('utilisateur');
    const title = interaction.options.getString('titre');

    const slot = await getActiveSlot(interaction.guildId, user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: user.id,
      slot
    });

    if (!profile) {
      return interaction.reply({
        content: 'Profil introuvable.',
        flags: 64
      });
    }

    if (!profile.titles.includes(title)) {
      profile.titles.push(title);
      await profile.save();
    }

    await interaction.reply({
      content: `🏅 Titre ajouté à ${user.username} : **${title}**`
    });
  }
};