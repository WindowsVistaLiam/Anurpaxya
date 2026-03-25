const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { canManageReputation } = require('../../config/permissions');
const { formatModifier } = require('../../utils/marketUtils');

function getRandomModifier() {
  return Math.floor(Math.random() * 21) - 10; // -10 → +10
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Appliquer une variation aléatoire du marché à tous les objets'),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: "Tu n'as pas la permission.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const items = await ShopItem.find({
      guildId: interaction.guildId,
      isActive: true
    });

    if (items.length === 0) {
      await interaction.reply({
        content: "Aucun objet en boutique.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const changes = [];

    for (const item of items) {
      const old = item.marketModifier || 0;
      const random = getRandomModifier();

      item.marketModifier = random;
      await item.save();

      changes.push({
        name: item.name,
        old,
        new: random
      });
    }

    // 🔥 résumé (max 10 affichés)
    const preview = changes.slice(0, 10).map(c =>
      `• **${c.name}** : ${formatModifier(c.old)} → ${formatModifier(c.new)}`
    );

    const remaining = changes.length - preview.length;

    await interaction.reply({
      content: [
        `📊 **Marché mis à jour (${changes.length} objets)**`,
        '',
        ...preview,
        remaining > 0 ? `\n… et **${remaining}** autres objets` : ''
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};