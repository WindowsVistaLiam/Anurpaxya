const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildProfileNavigationRow(targetUserId, slot, currentPage) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`profile_page:${targetUserId}:${slot}:1`)
      .setLabel('1')
      .setStyle(currentPage === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`profile_page:${targetUserId}:${slot}:2`)
      .setLabel('2')
      .setStyle(currentPage === 2 ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`profile_page:${targetUserId}:${slot}:3`)
      .setLabel('3')
      .setStyle(currentPage === 3 ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`profile_prev:${targetUserId}:${slot}:${currentPage}`)
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 1),

    new ButtonBuilder()
      .setCustomId(`profile_next:${targetUserId}:${slot}:${currentPage}`)
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 3)
  );
}

module.exports = {
  buildProfileNavigationRow
};