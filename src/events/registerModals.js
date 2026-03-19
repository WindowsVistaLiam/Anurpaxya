const Profile = require('../models/Profile');
const { setActiveSlot } = require('../services/profileService');
const { ABSOLUTE_MAX_PROFILE_SLOTS } = require('../utils/profileLimits');

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
    if (!interaction.customId.startsWith('profile_create:')) return;

    try {
      const [, ownerId, rawSlot] = interaction.customId.split(':');
      const slot = Number(rawSlot);

      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          content: 'Ce modal ne t’appartient pas.',
          ephemeral: true
        });
        return;
      }

      if (!Number.isInteger(slot) || slot < 1 || slot > ABSOLUTE_MAX_PROFILE_SLOTS) {
        await interaction.reply({
          content: 'Slot de profil invalide.',
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
        userId: interaction.user.id,
        slot
      });

      await Profile.findOneAndUpdate(
        {
          guildId: interaction.guildId,
          userId: interaction.user.id,
          slot
        },
        {
          guildId: interaction.guildId,
          userId: interaction.user.id,
          slot,
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

      await setActiveSlot(interaction.guildId, interaction.user.id, slot);

      await interaction.reply({
        content: existedBefore
          ? `✅ Ton profil RP du **slot ${slot}** a bien été modifié et défini comme profil actif.`
          : `✅ Ton profil RP du **slot ${slot}** a bien été créé et défini comme profil actif.`,
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