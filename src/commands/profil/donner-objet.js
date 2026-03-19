const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const {
  createTrade,
  deleteTrade
} = require('../../utils/tradeStore');
const { buildTradeActionRow } = require('../../utils/tradeComponents');
const {
  getActiveSlot,
  getProfileBySlot
} = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('donner-objet')
    .setDescription('Proposer de donner un objet de ton inventaire à un autre joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur qui reçoit l’objet')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('nom')
        .setDescription('Le nom de l’objet à donner')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addIntegerOption(option =>
      option
        .setName('quantite')
        .setDescription('La quantité à donner')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const nom = interaction.options.getString('nom', true).trim();
    const quantite = interaction.options.getInteger('quantite', true);

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: 'Tu ne peux pas te donner un objet à toi-même.',
        ephemeral: true
      });
      return;
    }

    if (targetUser.bot) {
      await interaction.reply({
        content: 'Tu ne peux pas donner un objet à un bot.',
        ephemeral: true
      });
      return;
    }

    const senderSlot = await getActiveSlot(interaction.guildId, interaction.user.id);
    const receiverSlot = await getActiveSlot(interaction.guildId, targetUser.id);

    const senderProfile = await getProfileBySlot(
      interaction.guildId,
      interaction.user.id,
      senderSlot
    );

    if (!senderProfile) {
      await interaction.reply({
        content: 'Tu n’as pas encore de profil actif valide. Utilise `/profil` ou `/profil-switch`.',
        ephemeral: true
      });
      return;
    }

    const senderItem = senderProfile.inventory.find(
      item => item.name.toLowerCase() === nom.toLowerCase()
    );

    if (!senderItem) {
      await interaction.reply({
        content: `Tu ne possèdes pas l’objet **${nom}** sur ton **profil actif (slot ${senderSlot})**.`,
        ephemeral: true
      });
      return;
    }

    if (senderItem.quantity < quantite) {
      await interaction.reply({
        content:
          `Tu n’as pas assez de **${nom}** sur ton **profil actif (slot ${senderSlot})**.\n` +
          `Quantité disponible : **${senderItem.quantity}**.`,
        ephemeral: true
      });
      return;
    }

    const tradeId = crypto.randomUUID();
    const expiresAt = Date.now() + 60_000;

    createTrade({
      id: tradeId,
      type: 'item',
      guildId: interaction.guildId,
      senderId: interaction.user.id,
      senderSlot,
      receiverId: targetUser.id,
      receiverSlot,
      itemName: nom,
      quantity: quantite,
      expiresAt
    });

    setTimeout(() => {
      deleteTrade(tradeId);
    }, 60_000);

    await interaction.reply({
      content:
        `🎒 <@${interaction.user.id}> propose de donner **${nom}** ×${quantite} ` +
        `depuis son **slot ${senderSlot}** à <@${targetUser.id}> sur son **slot ${receiverSlot}**.\n` +
        `⏳ Cette demande expire dans **60 secondes**.`,
      components: [buildTradeActionRow(tradeId)]
    });
  }
};