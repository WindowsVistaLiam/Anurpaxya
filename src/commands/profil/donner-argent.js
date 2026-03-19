const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const Profile = require('../../models/Profile');
const { createTrade, deleteTrade } = require('../../utils/tradeStore');
const { buildTradeActionRow } = require('../../utils/tradeComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('donner-argent')
    .setDescription('Proposer de donner de l’argent à un autre joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur qui reçoit l’argent')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('montant')
        .setDescription('Le montant à donner')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const montant = interaction.options.getInteger('montant', true);

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: 'Tu ne peux pas te donner de l’argent à toi-même.',
        ephemeral: true
      });
      return;
    }

    if (targetUser.bot) {
      await interaction.reply({
        content: 'Tu ne peux pas donner de l’argent à un bot.',
        ephemeral: true
      });
      return;
    }

    const senderProfile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id
    });

    if (!senderProfile) {
      await interaction.reply({
        content: 'Tu n’as pas encore de profil. Utilise `/profil` pour le créer.',
        ephemeral: true
      });
      return;
    }

    if ((senderProfile.wallet || 0) < montant) {
      await interaction.reply({
        content: `Tu n’as pas assez d’argent. Ton portefeuille actuel est de **${senderProfile.wallet || 0}** pièces.`,
        ephemeral: true
      });
      return;
    }

    const tradeId = crypto.randomUUID();
    const expiresAt = Date.now() + 60_000;

    createTrade({
      id: tradeId,
      type: 'money',
      guildId: interaction.guildId,
      senderId: interaction.user.id,
      receiverId: targetUser.id,
      amount: montant,
      expiresAt
    });

    setTimeout(() => {
      deleteTrade(tradeId);
    }, 60_000);

    await interaction.reply({
      content:
        `💸 <@${interaction.user.id}> propose de donner **${montant}** pièces à <@${targetUser.id}>.\n` +
        `⏳ Cette demande expire dans **60 secondes**.`,
      components: [buildTradeActionRow(tradeId)]
    });
  }
};