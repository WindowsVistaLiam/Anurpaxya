const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retirer-objet')
    .setDescription('Retire un objet de l’inventaire d’un profil')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Nom de l’objet')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addIntegerOption(option =>
      option
        .setName('quantite')
        .setDescription('Quantité à retirer')
        .setRequired(true)
        .setMinValue(1)
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
    const targetUser = interaction.options.getUser('utilisateur', true);
    const nom = interaction.options.getString('nom', true).trim();
    const quantite = interaction.options.getInteger('quantite', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: `Ce joueur n’a pas encore de profil dans le **slot ${slot}**.`,
        ephemeral: true
      });
      return;
    }

    const item = profile.inventory.find(
      entry => entry.name.toLowerCase() === nom.toLowerCase()
    );

    if (!item) {
      await interaction.reply({
        content:
          `L’objet **${nom}** n’existe pas dans l’inventaire de **${targetUser.username}** ` +
          `(**slot ${slot}**).`,
        ephemeral: true
      });
      return;
    }

    item.quantity -= quantite;

    if (item.quantity <= 0) {
      profile.inventory = profile.inventory.filter(
        entry => entry.name.toLowerCase() !== nom.toLowerCase()
      );
    }

    await profile.save();

    await interaction.reply({
      content:
        `✅ Objet retiré à **${targetUser.username}** ` +
        `(**slot ${slot}**) : **${nom}** ×${quantite}`,
      ephemeral: true
    });
  }
};