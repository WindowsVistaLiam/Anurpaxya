const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { buildProfilePagePayload } = require('../../utils/profilePagePayload');

function buildProfileNavigationRows(targetUserId, slot, currentPage) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`profile_prev:${targetUserId}:${slot}:${currentPage}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1),
      new ButtonBuilder()
        .setCustomId(`profile_next:${targetUserId}:${slot}:${currentPage}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= 3)
    )
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voir-profil')
    .setDescription('Voir le profil RP d’un joueur')
    .addUserOption(option =>
      option.setName('joueur').setDescription('Joueur ciblé').setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('slot').setDescription('Slot ciblé').setRequired(false).setMinValue(1).setMaxValue(10)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('joueur') || interaction.user;
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    }).lean();

    if (!profile) {
      await interaction.reply({
        content: `Aucun profil trouvé pour **${targetUser.username}** dans le **slot ${slot}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const page = 1;
    const payload = await buildProfilePagePayload(profile, targetUser, interaction.guild, page);

    await interaction.reply({
      ...payload,
      components: buildProfileNavigationRows(targetUser.id, slot, page)
    });
  }
};