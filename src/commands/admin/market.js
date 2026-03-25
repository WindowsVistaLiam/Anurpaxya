const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const { canManageReputation } = require('../../config/permissions');
const { formatModifier } = require('../../utils/marketUtils');

function getRandomModifier() {
  return Math.floor(Math.random() * 21) - 10;
}

async function findTargetItems(guildId, { itemId = '', category = '' } = {}) {
  const query = {
    guildId,
    isActive: true
  };

  if (itemId) {
    query.itemId = itemId.trim().toLowerCase();
  } else if (category) {
    query.category = category.trim();
  }

  return ShopItem.find(query);
}

async function applyToItems(items, callback) {
  const changes = [];

  for (const item of items) {
    const old = Number(item.marketModifier) || 0;
    const next = callback(item, old);

    item.marketModifier = Number(next) || 0;
    await item.save();

    changes.push({
      name: item.name,
      itemId: item.itemId,
      category: item.category || 'Sans catégorie',
      old,
      new: item.marketModifier
    });
  }

  return changes;
}

function buildPreview(changes) {
  const preview = changes.slice(0, 10).map(change =>
    `• **${change.name}** (\`${change.itemId}\`) : ${formatModifier(change.old)} → ${formatModifier(change.new)}`
  );

  const remaining = changes.length - preview.length;
  if (remaining > 0) {
    preview.push('');
    preview.push(`… et **${remaining}** autre(s) objet(s)`);
  }

  return preview.join('\n');
}

function buildScopeLabel({ itemId = '', category = '' } = {}) {
  if (itemId) {
    return `Objet ciblé : **${itemId}**`;
  }

  if (category) {
    return `Catégorie ciblée : **${category}**`;
  }

  return 'Cible : **toute la boutique**';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Gestion globale du marché')
    .addSubcommand(sub =>
      sub
        .setName('random')
        .setDescription('Appliquer une variation aléatoire du marché à tous les objets')
    )
    .addSubcommand(sub =>
      sub
        .setName('crash')
        .setDescription('Faire baisser le marché')
        .addIntegerOption(option =>
          option
            .setName('valeur')
            .setDescription('Baisse en pourcentage')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('item_id')
            .setDescription('ID d’un item précis à cibler')
            .setRequired(false)
            .setMaxLength(50)
        )
        .addStringOption(option =>
          option
            .setName('categorie')
            .setDescription('Catégorie à cibler')
            .setRequired(false)
            .setMaxLength(50)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('inflation')
        .setDescription('Faire monter le marché')
        .addIntegerOption(option =>
          option
            .setName('valeur')
            .setDescription('Hausse en pourcentage')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('item_id')
            .setDescription('ID d’un item précis à cibler')
            .setRequired(false)
            .setMaxLength(50)
        )
        .addStringOption(option =>
          option
            .setName('categorie')
            .setDescription('Catégorie à cibler')
            .setRequired(false)
            .setMaxLength(50)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('Remettre le marché à 0%')
        .addStringOption(option =>
          option
            .setName('item_id')
            .setDescription('ID d’un item précis à réinitialiser')
            .setRequired(false)
            .setMaxLength(50)
        )
        .addStringOption(option =>
          option
            .setName('categorie')
            .setDescription('Catégorie à réinitialiser')
            .setRequired(false)
            .setMaxLength(50)
        )
    ),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: "Tu n'as pas la permission d'utiliser cette commande.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'random') {
      const items = await findTargetItems(interaction.guildId);

      if (items.length === 0) {
        await interaction.reply({
          content: 'Aucun objet actif en boutique.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const changes = await applyToItems(items, () => getRandomModifier());

      await interaction.reply({
        content: [
          `🎲 **Marché aléatoire appliqué**`,
          `Cible : **toute la boutique**`,
          `Objets modifiés : **${changes.length}**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (subcommand === 'crash') {
      const value = interaction.options.getInteger('valeur', true);
      const itemId = interaction.options.getString('item_id') || '';
      const category = interaction.options.getString('categorie') || '';

      const items = await findTargetItems(interaction.guildId, { itemId, category });

      if (items.length === 0) {
        await interaction.reply({
          content: 'Aucun objet correspondant trouvé.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const changes = await applyToItems(items, (item, old) => old - value);

      await interaction.reply({
        content: [
          `💥 **Crash du marché**`,
          `Variation appliquée : **-${value}%**`,
          buildScopeLabel({ itemId, category }),
          `Objets modifiés : **${changes.length}**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (subcommand === 'inflation') {
      const value = interaction.options.getInteger('valeur', true);
      const itemId = interaction.options.getString('item_id') || '';
      const category = interaction.options.getString('categorie') || '';

      const items = await findTargetItems(interaction.guildId, { itemId, category });

      if (items.length === 0) {
        await interaction.reply({
          content: 'Aucun objet correspondant trouvé.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const changes = await applyToItems(items, (item, old) => old + value);

      await interaction.reply({
        content: [
          `📈 **Inflation du marché**`,
          `Variation appliquée : **+${value}%**`,
          buildScopeLabel({ itemId, category }),
          `Objets modifiés : **${changes.length}**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (subcommand === 'reset') {
      const itemId = interaction.options.getString('item_id') || '';
      const category = interaction.options.getString('categorie') || '';

      const items = await findTargetItems(interaction.guildId, { itemId, category });

      if (items.length === 0) {
        await interaction.reply({
          content: 'Aucun objet correspondant trouvé.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const changes = await applyToItems(items, () => 0);

      await interaction.reply({
        content: [
          `🧼 **Marché réinitialisé**`,
          buildScopeLabel({ itemId, category }),
          `Objets remis à **0%** : **${changes.length}**`,
          '',
          buildPreview(changes)
        ].join('\n'),
        flags: MessageFlags.Ephemeral
      });
    }
  }
};