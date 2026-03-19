const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Teste si le bot répond'),
  
  async execute(interaction) {
    await interaction.reply({
      content: 'Pong ✅',
      ephemeral: true
    });
  }
};