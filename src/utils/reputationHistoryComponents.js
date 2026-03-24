const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildReputationHistoryRows(ownerUserId, targetUserId, slot, page, totalPages) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rep_history_prev:${ownerUserId}:${targetUserId}:${slot}:${page}`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`rep_history_next:${ownerUserId}:${targetUserId}:${slot}:${page}`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages)
    )
  ];
}

module.exports = {
  buildReputationHistoryRows
};