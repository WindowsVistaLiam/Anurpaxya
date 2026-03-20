const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

function buildExchangeDraftRows(draftId) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`exchange_draft_offer_money:${draftId}`)
      .setLabel('Donner argent')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`exchange_draft_offer_item:${draftId}`)
      .setLabel('Donner objet')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`exchange_draft_request_money:${draftId}`)
      .setLabel('Demander argent')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`exchange_draft_request_item:${draftId}`)
      .setLabel('Demander objet')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`exchange_draft_reset:${draftId}`)
      .setLabel('Réinitialiser')
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`exchange_draft_send:${draftId}`)
      .setLabel('Envoyer la proposition')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`exchange_draft_cancel:${draftId}`)
      .setLabel('Annuler')
      .setStyle(ButtonStyle.Danger)
  );

  return [row1, row2];
}

function buildExchangeConfirmRow(tradeId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`exchange_accept:${tradeId}`)
      .setLabel('Accepter')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`exchange_refuse:${tradeId}`)
      .setLabel('Refuser')
      .setStyle(ButtonStyle.Danger)
  );
}

module.exports = {
  buildExchangeDraftRows,
  buildExchangeConfirmRow
};