const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const {
  getActiveSlot,
  getProfileBySlot,
  getNextAvailableSlot,
  MAX_PROFILE_SLOTS,
  ensureActiveState
} = require('../../services/profileService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Créer ou modifier ton profil RP actif'),

  async execute(interaction) {
    await ensureActiveState(interaction.guildId, interaction.user.id);

    const activeSlot = await getActiveSlot(interaction.guildId, interaction.user.id);
    let existingProfile = await getProfileBySlot(interaction.guildId, interaction.user.id, activeSlot);
    let targetSlot = activeSlot;

    if (!existingProfile) {
      const nextSlot = await getNextAvailableSlot(interaction.guildId, interaction.user.id);

      if (!nextSlot) {
        await interaction.reply({
          content: `Tu as déjà atteint la limite de **${MAX_PROFILE_SLOTS} profils**. Utilise \`/profil-switch\` pour changer de profil actif puis \`/profil\` pour le modifier.`,
          ephemeral: true
        });
        return;
      }

      targetSlot = nextSlot;
    }

    const modal = new ModalBuilder()
      .setCustomId(`profile_create:${interaction.user.id}:${targetSlot}`)
      .setTitle(existingProfile ? `Modification du profil RP • Slot ${targetSlot}` : `Création du profil RP • Slot ${targetSlot}`);

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