const ShopItem = require('../models/ShopItem');
const { ITEMS_PER_PAGE, buildShopEmbed } = require('../utils/shopEmbeds');
const { buildShopNavigationRow } = require('../utils/shopComponents');

module.exports = function registerShopNavigation(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (
      !interaction.customId.startsWith('shop_prev:') &&
      !interaction.customId.startsWith('shop_next:')
    ) {
      return;
    }

    try {
      const [action, rawCategory, rawPage] = interaction.customId.split(':');
      const category = rawCategory === 'all' ? null : rawCategory;
      let page = Number(rawPage) || 1;

      const query = {
        guildId: interaction.guildId,
        isActive: true
      };

      if (category) {
        query.category = category;
      }

      const items = await ShopItem.find(query).sort({ category: 1, name: 1 }).lean();

      const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

      if (action === 'shop_prev') {
        page = Math.max(1, page - 1);
      }

      if (action === 'shop_next') {
        page = Math.min(totalPages, page + 1);
      }

      const embed = buildShopEmbed({
        items,
        page,
        totalPages,
        category,
        guildName: interaction.guild?.name || 'Serveur RP'
      });

      const components = [buildShopNavigationRow(page, totalPages, category || 'all')];

      await interaction.update({
        embeds: [embed],
        components
      });
    } catch (error) {
      console.error('❌ Erreur navigation boutique :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la navigation de la boutique.',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la navigation de la boutique.',
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};