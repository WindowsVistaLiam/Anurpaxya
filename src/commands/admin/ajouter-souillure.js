const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');
const { isMj } = require('../../utils/profileLimits');
const {
  getSouillureStageIndex,
  buildSouillureStageEmbed
} = require('../../utils/souillureStages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-souillure')
    .setDescription('Ajouter de la souillure à un joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('montant')
        .setDescription('Montant de souillure à ajouter')
        .setRequired(true)
        .setMinValue(0.1)
        .setMaxValue(100)
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
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
    const mj = isMj(member);

    if (!isAdmin && !mj) {
      await interaction.reply({
        content: 'Tu n’as pas la permission d’utiliser cette commande.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetUser = interaction.options.getUser('utilisateur', true);
    const amount = interaction.options.getNumber('montant', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: `Aucun profil trouvé pour **${targetUser.username}** dans le **slot ${slot}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const oldSouillure = Number(profile.souillure) || 0;
    const oldStageIndex = getSouillureStageIndex(oldSouillure);

    const newSouillure = Math.min(100, Number((oldSouillure + amount).toFixed(2)));
    profile.souillure = newSouillure;
    await profile.save();

    const newStageIndex = getSouillureStageIndex(newSouillure);

    await interaction.reply({
      content:
        `🩸 Souillure augmentée pour **${profile.nomPrenom || targetUser.username}** ` +
        `(**slot ${slot}**).\n` +
        `Souillure : **${oldSouillure}%** → **${newSouillure}%**`,
      flags: MessageFlags.Ephemeral
    });

    if (newStageIndex > oldStageIndex) {
      const embed = buildSouillureStageEmbed({
        profile,
        user: targetUser,
        souillure: newSouillure
      });

      await interaction.channel.send({
        content: `<@${targetUser.id}>`,
        embeds: [embed]
      });
    }
  }
};