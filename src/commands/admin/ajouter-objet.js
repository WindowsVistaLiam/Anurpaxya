const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajouter-objet')
    .setDescription('Ajoute un objet à l’inventaire d’un profil')
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
        .setDescription('Quantité à ajouter')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot ciblé (sinon profil actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(3)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const nom = interaction.options.getString('nom', true).trim();
    const quantite = interaction.options.getInteger('quantite', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    let profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    if (!profile) {
      profile = await Profile.create({
        guildId: interaction.guildId,
        userId: targetUser.id,
        slot
      });
    }

    const existingItem = profile.inventory.find(
      item => item.name.toLowerCase() === nom.toLowerCase()
    );

    if (existingItem) {
      existingItem.quantity += quantite;
    } else {
      profile.inventory.push({
        name: nom,
        quantity: quantite
      });
    }

    await profile.save();

    await interaction.reply({
      content:
        `✅ Objet ajouté à **${targetUser.username}** ` +
        `(**slot ${slot}**) : **${nom}** ×${quantite}`,
      ephemeral: true
    });
  }
};