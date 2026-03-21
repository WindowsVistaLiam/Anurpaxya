const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildHelpNavigationRow(page = 1) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_prev:${page}`)
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),

    new ButtonBuilder()
      .setCustomId(`help_home:${page}`)
      .setLabel(`Page ${page}/4`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`help_next:${page}`)
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= 4)
  );
}

module.exports = {
  buildHelpNavigationRow
};