const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const Profile = require('../../models/Profile');
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

    const senderSlot = await getActiveSlot(interaction.guildId, interaction.user.id);
    const receiverSlot = await getActiveSlot(interaction.guildId, targetUser.id);

    const senderProfile = await getProfileBySlot(
      interaction.guildId,
      interaction.user.id,
      senderSlot
    );

    if (!senderProfile) {
      await interaction.reply({
        content: `Tu n’as pas encore de profil actif valide. Utilise \`/profil\` ou \`/profil-switch\`.`,
        ephemeral: true
      });
      return;
    }

    if ((senderProfile.wallet || 0) < montant) {
      await interaction.reply({
        content:
          `Tu n’as pas assez d’argent sur ton **profil actif (slot ${senderSlot})**.\n` +
          `Portefeuille actuel : **${senderProfile.wallet || 0}** pièces.`,
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
      senderSlot,
      receiverId: targetUser.id,
      receiverSlot,
      amount: montant,
      expiresAt
    });

    setTimeout(() => {
      deleteTrade(tradeId);
    }, 60_000);

    await interaction.reply({
      content:
        `💸 <@${interaction.user.id}> propose de donner **${montant}** pièces ` +
        `depuis son **slot ${senderSlot}** à <@${targetUser.id}> sur son **slot ${receiverSlot}**.\n` +
        `⏳ Cette demande expire dans **60 secondes**.`,
      components: [buildTradeActionRow(tradeId)]
    });
  }
};