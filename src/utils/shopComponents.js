const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildShopNavigationRow(page, totalPages, category = 'all') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_prev:${category}:${page}`)
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),

    new ButtonBuilder()
      .setCustomId(`shop_pageinfo:${category}:${page}`)
      .setLabel(`Page ${page}/${Math.max(totalPages, 1)}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`shop_next:${category}:${page}`)
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}

module.exports = {
  buildShopNavigationRow
};