const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lettre')
    .setDescription('Système de lettres'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xe0b84d)
      .setTitle('✉️ Système de Lettres')
      .setDescription([
        '📝 Rédiger une lettre',
        '📬 Consulter tes lettres',
        '📦 Archives',
        '🗑️ Corbeille',
        '🕵️ Intercepter'
      ].join('\n'));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`letter:write:${interaction.user.id}`).setLabel('📝').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`letter:inbox:${interaction.user.id}`).setLabel('📬').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`letter:archive:${interaction.user.id}`).setLabel('📦').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`letter:trash:${interaction.user.id}`).setLabel('🗑️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`letter:intercept:${interaction.user.id}`).setLabel('🕵️').setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};