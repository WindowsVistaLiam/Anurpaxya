const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ShopItem = require('../../models/ShopItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lister-boutique-items')
    .setDescription('Lister tous les articles de la boutique')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const items = await ShopItem.find({
      guildId: interaction.guildId
    }).sort({ isActive: -1, category: 1, name: 1 }).lean();

    if (items.length === 0) {
      await interaction.reply({
        content: 'Aucun article n’est enregistré dans la boutique.',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🗂️ Liste des articles de boutique')
      .setDescription(
        items
          .slice(0, 25)
          .map(item =>
            [
              `**${item.name}** — \`${item.itemId}\``,
              `🗂️ ${item.category} • 💰 ${item.buyPrice} / 💸 ${item.sellPrice} • 📦 ${item.stock === -1 ? 'Illimité' : item.stock} • ${item.isActive ? '✅ Actif' : '❌ Inactif'}`
            ].join('\n')
          )
          .join('\n\n')
      )
      .setFooter({
        text: items.length > 25
          ? `Affichage des 25 premiers articles sur ${items.length}`
          : `${items.length} article(s)`
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};