const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const Profile = require('../../models/Profile');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Créer ou modifier ton profil RP'),

  async execute(interaction) {
    const existingProfile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id
    }).lean();

    const modal = new ModalBuilder()
      .setCustomId(`profile_create_${interaction.user.id}`)
      .setTitle(existingProfile ? 'Modification du profil RP' : 'Création du profil RP');

    const fullNameInput = new TextInputBuilder()
      .setCustomId('full_name')
      .setLabel('Nom et Prénom')
      .setPlaceholder('Écris ce que tu veux')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(200);

    const ageGenderInput = new TextInputBuilder()
      .setCustomId('age_gender')
      .setLabel('Âge et Genre')
      .setPlaceholder('Écris ce que tu veux')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(200);

    const pouvoirInput = new TextInputBuilder()
      .setCustomId('pouvoir')
      .setLabel('Pouvoir / Aptitude')
      .setPlaceholder('Écris ce que tu veux')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Description du Personnage')
      .setPlaceholder('Écris ce que tu veux')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    const imageInput = new TextInputBuilder()
      .setCustomId('image')
      .setLabel('Image')
      .setPlaceholder('https://...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(1000);

    if (existingProfile) {
      fullNameInput.setValue(existingProfile.nomPrenom || '');
      ageGenderInput.setValue(existingProfile.ageGenre || '');
      pouvoirInput.setValue(existingProfile.pouvoir || '');
      descriptionInput.setValue(existingProfile.description || '');
      imageInput.setValue(existingProfile.imageUrl || '');
    }

    modal.addComponents(
      new ActionRowBuilder().addComponents(fullNameInput),
      new ActionRowBuilder().addComponents(ageGenderInput),
      new ActionRowBuilder().addComponents(pouvoirInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(imageInput)
    );

    await interaction.showModal(modal);
  }
};