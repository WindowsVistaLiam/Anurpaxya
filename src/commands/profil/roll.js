const { SlashCommandBuilder } = require('discord.js');

function parseDiceExpression(input) {
  const cleaned = input.trim().toLowerCase();
  const match = cleaned.match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) return null;

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3]) : 0;

  if (
    Number.isNaN(count) ||
    Number.isNaN(sides) ||
    Number.isNaN(modifier) ||
    count < 1 ||
    count > 20 ||
    sides < 2 ||
    sides > 1000
  ) {
    return null;
  }

  return { count, sides, modifier };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Lancer un ou plusieurs dés')
    .addStringOption(option =>
      option
        .setName('de')
        .setDescription('Exemple : 1d20, 2d6, 1d100+5')
        .setRequired(true)
        .setMaxLength(20)
    ),

  async execute(interaction) {
    const expression = interaction.options.getString('de', true);
    const parsed = parseDiceExpression(expression);

    if (!parsed) {
      await interaction.reply({
        content: 'Format invalide. Exemples valides : `1d20`, `2d6`, `1d100+5`, `2d8-1`.',
        ephemeral: true
      });
      return;
    }

    const rolls = Array.from({ length: parsed.count }, () =>
      Math.floor(Math.random() * parsed.sides) + 1
    );

    const totalBeforeModifier = rolls.reduce((sum, value) => sum + value, 0);
    const total = totalBeforeModifier + parsed.modifier;

    const modifierText =
      parsed.modifier === 0
        ? ''
        : parsed.modifier > 0
          ? ` + ${parsed.modifier}`
          : ` - ${Math.abs(parsed.modifier)}`;

    await interaction.reply({
      content:
        `🎲 **${interaction.user.username}** lance **${parsed.count}d${parsed.sides}${parsed.modifier !== 0 ? (parsed.modifier > 0 ? `+${parsed.modifier}` : parsed.modifier) : ''}**\n` +
        `Résultats : **[${rolls.join(', ')}]**\n` +
        `Calcul : **${totalBeforeModifier}${modifierText} = ${total}**`
    });
  }
};