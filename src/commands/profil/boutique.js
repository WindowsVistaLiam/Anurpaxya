const { SlashCommandBuilder } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { ITEMS_PER_PAGE, buildShopEmbed } = require('../../utils/shopEmbeds');
const { buildShopNavigationRow } = require('../../utils/shopComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Afficher les articles disponibles en boutique')
    .addStringOption(option =>
      option
        .setName('categorie')
        .setDescription('Filtrer par catégorie')
        .setRequired(false)
        .setMaxLength(50)
    ),

  async execute(interaction) {
    const category = interaction.options.getString('categorie');

    const query = {
      guildId: interaction.guildId,
      isActive: true
    };

    if (category) {
      query.category = category;
    }

    const items = await ShopItem.find(query).sort({ category: 1, name: 1 }).lean();

    if (items.length === 0) {
      await interaction.reply({
        content: category
          ? `Aucun article actif dans la catégorie **${category}**.`
          : 'Aucun article actif en boutique.',
        ephemeral: true
      });
      return;
    }

    const page = 1;
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

    const embed = buildShopEmbed({
      items,
      page,
      totalPages,
      category,
      guildName: interaction.guild?.name || 'Serveur RP'
    });

    const components = [buildShopNavigationRow(page, totalPages, category || 'all')];

    await interaction.reply({
      embeds: [embed],
      components
    });
  }
};