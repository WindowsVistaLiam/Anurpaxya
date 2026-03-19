    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildTradeActionRow(tradeId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`trade_accept:${tradeId}`)
      .setLabel('Accepter')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`trade_refuse:${tradeId}`)
      .setLabel('Refuser')
      .setStyle(ButtonStyle.Danger)
  );
}

module.exports = {
  buildTradeActionRow
};