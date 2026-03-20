const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const crypto = require('crypto');
const {
  createExchangeDraft,
  deleteExchangeDraft
} = require('../../utils/exchangeDraftStore');
const { buildExchangeDraftEmbed } = require('../../utils/exchangeEmbeds');
const { buildExchangeDraftRows } = require('../../utils/exchangeComponents');
const { getActiveSlot } = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('echange')
    .setDescription('Ouvrir un panneau d’échange avec un autre joueur')
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur avec qui échanger')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: 'Tu ne peux pas ouvrir un échange avec toi-même.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (targetUser.bot) {
      await interaction.reply({
        content: 'Tu ne peux pas ouvrir un échange avec un bot.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const senderSlot = await getActiveSlot(interaction.guildId, interaction.user.id);
    const receiverSlot = await getActiveSlot(interaction.guildId, targetUser.id);

    const draftId = crypto.randomUUID();
    const draft = createExchangeDraft({
      id: draftId,
      guildId: interaction.guildId,
      senderId: interaction.user.id,
      senderSlot,
      receiverId: targetUser.id,
      receiverSlot,
      offer: {
        money: 0,
        itemName: '',
        itemQuantity: 0
      },
      request: {
        money: 0,
        itemName: '',
        itemQuantity: 0
      },
      expiresAt: Date.now() + 10 * 60_000
    });

    setTimeout(() => {
      deleteExchangeDraft(draftId);
    }, 10 * 60_000);

    await interaction.reply({
      embeds: [
        buildExchangeDraftEmbed({
          draft,
          senderUser: interaction.user,
          receiverUser: targetUser,
          guildName: interaction.guild?.name || 'Serveur RP'
        })
      ],
      components: buildExchangeDraftRows(draftId),
      flags: MessageFlags.Ephemeral
    });
  }
};