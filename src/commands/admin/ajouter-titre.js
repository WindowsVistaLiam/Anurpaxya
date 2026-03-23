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
    )
    .addStringOption(option =>
      option
        .setName('rarete')
        .setDescription('La rareté du titre')
        .setRequired(true)
        .addChoices(
          { name: 'Commun', value: 'common' },
          { name: 'Rare', value: 'rare' },
          { name: 'Épique', value: 'epic' },
          { name: 'Légendaire', value: 'legendary' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot ciblé (sinon profil actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
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
    const rarity = interaction.options.getString('rarete', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, user.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: user.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: `Profil introuvable dans le slot ${slot}.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const alreadyExists = profile.titles.some(existing => existing.name === title);

    if (!alreadyExists) {
      profile.titles.push({
        name: title,
        rarity
      });

      await profile.save();
    }

    await interaction.reply({
      content:
        `🏅 Titre ajouté à **${user.username}** sur le **slot ${slot}**.\n` +
        `**Titre :** ${title}\n` +
        `**Rareté :** ${rarity}`,
      flags: MessageFlags.Ephemeral
    });
  }
};