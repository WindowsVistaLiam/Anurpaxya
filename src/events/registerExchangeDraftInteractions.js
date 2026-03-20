const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags
} = require('discord.js');
const Profile = require('../models/Profile');
const { createTrade, deleteTrade } = require('../utils/tradeStore');
const {
  getExchangeDraft,
  deleteExchangeDraft,
  isExchangeDraftExpired
} = require('../utils/exchangeDraftStore');
const {
  buildExchangeDraftEmbed,
  buildExchangeProposalEmbed,
  hasSideContent
} = require('../utils/exchangeEmbeds');
const {
  buildExchangeDraftRows,
  buildExchangeConfirmRow
} = require('../utils/exchangeComponents');

function buildMoneyModal(customId, title, currentValue = 0) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title);

  const amountInput = new TextInputBuilder()
    .setCustomId('amount')
    .setLabel('Montant')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(String(currentValue || 0))
    .setMaxLength(10);

  modal.addComponents(
    new ActionRowBuilder().addComponents(amountInput)
  );

  return modal;
}

function buildItemModal(customId, title, currentName = '', currentQuantity = 0) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title);

  const nameInput = new TextInputBuilder()
    .setCustomId('item_name')
    .setLabel('Nom de l’objet')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(currentName || '')
    .setMaxLength(100);

  const quantityInput = new TextInputBuilder()
    .setCustomId('item_quantity')
    .setLabel('Quantité')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(String(currentQuantity || 0))
    .setMaxLength(10);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(quantityInput)
  );

  return modal;
}

module.exports = function registerExchangeDraftInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (interaction.isButton()) {
        if (!interaction.customId.startsWith('exchange_draft_')) return;

        const [action, draftId] = interaction.customId.replace('exchange_draft_', '').split(':');
        const draft = getExchangeDraft(draftId);

        if (!draft) {
          await interaction.reply({
            content: 'Ce brouillon d’échange est introuvable ou expiré.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (interaction.user.id !== draft.senderId) {
          await interaction.reply({
            content: 'Seul le créateur du brouillon peut le modifier.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (isExchangeDraftExpired(draft)) {
          deleteExchangeDraft(draftId);

          await interaction.reply({
            content: 'Ce brouillon d’échange a expiré.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (action === 'offer_money') {
          await interaction.showModal(
            buildMoneyModal(
              `exchange_modal:offer_money:${draftId}`,
              'Modifier l’argent donné',
              draft.offer.money
            )
          );
          return;
        }

        if (action === 'offer_item') {
          await interaction.showModal(
            buildItemModal(
              `exchange_modal:offer_item:${draftId}`,
              'Modifier l’objet donné',
              draft.offer.itemName,
              draft.offer.itemQuantity
            )
          );
          return;
        }

        if (action === 'request_money') {
          await interaction.showModal(
            buildMoneyModal(
              `exchange_modal:request_money:${draftId}`,
              'Modifier l’argent demandé',
              draft.request.money
            )
          );
          return;
        }

        if (action === 'request_item') {
          await interaction.showModal(
            buildItemModal(
              `exchange_modal:request_item:${draftId}`,
              'Modifier l’objet demandé',
              draft.request.itemName,
              draft.request.itemQuantity
            )
          );
          return;
        }

        if (action === 'reset') {
          draft.offer.money = 0;
          draft.offer.itemName = '';
          draft.offer.itemQuantity = 0;
          draft.request.money = 0;
          draft.request.itemName = '';
          draft.request.itemQuantity = 0;

          const receiverUser = await client.users.fetch(draft.receiverId).catch(() => null);

          await interaction.update({
            embeds: [
              buildExchangeDraftEmbed({
                draft,
                senderUser: interaction.user,
                receiverUser: receiverUser || { username: 'Inconnu' },
                guildName: interaction.guild?.name || 'Serveur RP'
              })
            ],
            components: buildExchangeDraftRows(draftId)
          });

          return;
        }

        if (action === 'cancel') {
          deleteExchangeDraft(draftId);

          await interaction.update({
            content: '❌ Brouillon d’échange annulé.',
            embeds: [],
            components: []
          });

          return;
        }

        if (action === 'send') {
          if (!hasSideContent(draft.offer) || !hasSideContent(draft.request)) {
            await interaction.reply({
              content: 'Tu dois configurer au moins un élément dans **ce que tu donnes** et dans **ce que tu demandes**.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          const senderProfile = await Profile.findOne({
            guildId: draft.guildId,
            userId: draft.senderId,
            slot: draft.senderSlot
          });

          if (!senderProfile) {
            await interaction.reply({
              content: 'Ton profil actif est introuvable.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          if ((draft.offer.money || 0) > 0 && (senderProfile.wallet || 0) < draft.offer.money) {
            await interaction.reply({
              content: 'Tu ne possèdes pas assez d’argent pour cette offre.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          if (draft.offer.itemName && draft.offer.itemQuantity > 0) {
            const senderItem = senderProfile.inventory.find(
              item => item.name.toLowerCase() === draft.offer.itemName.toLowerCase()
            );

            if (!senderItem || senderItem.quantity < draft.offer.itemQuantity) {
              await interaction.reply({
                content: 'Tu ne possèdes pas assez de cet objet pour cette offre.',
                flags: MessageFlags.Ephemeral
              });
              return;
            }
          }

          const tradeId = draft.id;
          createTrade({
            id: tradeId,
            type: 'exchange_proposal',
            guildId: draft.guildId,
            senderId: draft.senderId,
            senderSlot: draft.senderSlot,
            receiverId: draft.receiverId,
            receiverSlot: draft.receiverSlot,
            offer: { ...draft.offer },
            request: { ...draft.request },
            expiresAt: Date.now() + 60_000
          });

          setTimeout(() => {
            deleteTrade(tradeId);
          }, 60_000);

          const receiverUser = await client.users.fetch(draft.receiverId).catch(() => null);

          await interaction.channel.send({
            content: `<@${draft.senderId}> propose un échange à <@${draft.receiverId}>.`,
            embeds: [
              buildExchangeProposalEmbed({
                trade: {
                  senderSlot: draft.senderSlot,
                  receiverSlot: draft.receiverSlot,
                  offer: draft.offer,
                  request: draft.request
                },
                senderUser: interaction.user,
                receiverUser: receiverUser || { username: 'Inconnu' },
                guildName: interaction.guild?.name || 'Serveur RP'
              })
            ],
            components: [buildExchangeConfirmRow(tradeId)]
          });

          deleteExchangeDraft(draftId);

          await interaction.update({
            content: '✅ Proposition envoyée.',
            embeds: [],
            components: []
          });

          return;
        }
      }

      if (interaction.isModalSubmit()) {
        if (!interaction.customId.startsWith('exchange_modal:')) return;

        const [, action, draftId] = interaction.customId.split(':');
        const draft = getExchangeDraft(draftId);

        if (!draft) {
          await interaction.reply({
            content: 'Ce brouillon d’échange est introuvable ou expiré.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (interaction.user.id !== draft.senderId) {
          await interaction.reply({
            content: 'Seul le créateur du brouillon peut le modifier.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (isExchangeDraftExpired(draft)) {
          deleteExchangeDraft(draftId);

          await interaction.reply({
            content: 'Ce brouillon d’échange a expiré.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (action === 'offer_money' || action === 'request_money') {
          const amountRaw = interaction.fields.getTextInputValue('amount').trim();
          const amount = Number(amountRaw);

          if (!Number.isInteger(amount) || amount < 0) {
            await interaction.reply({
              content: 'Le montant doit être un nombre entier supérieur ou égal à 0.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          if (action === 'offer_money') {
            draft.offer.money = amount;
          } else {
            draft.request.money = amount;
          }
        }

        if (action === 'offer_item' || action === 'request_item') {
          const itemName = interaction.fields.getTextInputValue('item_name').trim();
          const quantityRaw = interaction.fields.getTextInputValue('item_quantity').trim();
          const quantity = Number(quantityRaw);

          if (!Number.isInteger(quantity) || quantity < 0) {
            await interaction.reply({
              content: 'La quantité doit être un nombre entier supérieur ou égal à 0.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          if (quantity > 0 && !itemName) {
            await interaction.reply({
              content: 'Tu dois renseigner un nom d’objet si la quantité est supérieure à 0.',
              flags: MessageFlags.Ephemeral
            });
            return;
          }

          if (action === 'offer_item') {
            draft.offer.itemName = itemName;
            draft.offer.itemQuantity = quantity;
          } else {
            draft.request.itemName = itemName;
            draft.request.itemQuantity = quantity;
          }
        }

        const receiverUser = await client.users.fetch(draft.receiverId).catch(() => null);

        await interaction.reply({
          embeds: [
            buildExchangeDraftEmbed({
              draft,
              senderUser: interaction.user,
              receiverUser: receiverUser || { username: 'Inconnu' },
              guildName: interaction.guild?.name || 'Serveur RP'
            })
          ],
          components: buildExchangeDraftRows(draftId),
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      console.error('❌ Erreur brouillon échange :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la préparation de l’échange.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la préparation de l’échange.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });
};