const { EmbedBuilder } = require('discord.js');

const ITEMS_PER_PAGE = 5;

function truncate(text, maxLength) {
  if (!text) return 'Aucune description.';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function formatStock(stock) {
  return stock === -1 ? 'Illimité' : String(stock);
}

function buildShopEmbed({ items, page, totalPages, category, guildName }) {
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(start, start + ITEMS_PER_PAGE);

  const embed = new EmbedBuilder()
    .setTitle(category ? `🛒 Boutique — ${category}` : '🛒 Boutique')
    .setDescription(
      paginatedItems.length > 0
        ? paginatedItems
            .map(item =>
              [
                `**${item.name}** — \`${item.itemId}\``,
                `${truncate(item.description, 160)}`,
                `💰 Achat : **${item.buyPrice}** • 💸 Vente : **${item.sellPrice}**`,
                `📦 Stock : **${formatStock(item.stock)}** • 🗂️ ${item.category}`
              ].join('\n')
            )
            .join('\n\n')
        : 'Aucun article à afficher.'
    )
    .setFooter({
      text: `${guildName} • Page ${page}/${Math.max(totalPages, 1)} • ${items.length} article(s)`
    })
    .setTimestamp();

  return embed;
}

module.exports = {
  ITEMS_PER_PAGE,
  buildShopEmbed
};