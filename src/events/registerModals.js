const Profile = require('../models/Profile');

function isValidImageUrl(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

module.exports = function registerModals(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (!interaction.customId.startsWith('profile_create_')) return;

    try {
      const ownerId = interaction.customId.replace('profile_create_', '');

      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          content: 'Ce modal ne t’appartient pas.',
          ephemeral: true
        });
        return;
      }

      const nomPrenom = interaction.fields.getTextInputValue('full_name').trim();
      const ageGenre = interaction.fields.getTextInputValue('age_gender').trim();
      const pouvoir = interaction.fields.getTextInputValue('pouvoir').trim();
      const description = interaction.fields.getTextInputValue('description').trim();
      const imageUrl = interaction.fields.getTextInputValue('image').trim();

      if (!isValidImageUrl(imageUrl)) {
        await interaction.reply({
          content: 'Le champ image doit contenir une URL valide commençant par http:// ou https://.',
          ephemeral: true
        });
        return;
      }

      const existedBefore = await Profile.exists({
        guildId: interaction.guildId,
        userId: interaction.user.id
      });

      await Profile.findOneAndUpdate(
        {
          guildId: interaction.guildId,
          userId: interaction.user.id
        },
        {
          guildId: interaction.guildId,
          userId: interaction.user.id,
          nomPrenom,
          ageGenre,
          pouvoir,
          description,
          imageUrl
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      await interaction.reply({
        content: existedBefore
          ? '✅ Ton profil RP a bien été modifié.'
          : '✅ Ton profil RP a bien été créé.',
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Erreur modal profil :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant l’enregistrement du profil.',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant l’enregistrement du profil.',
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};