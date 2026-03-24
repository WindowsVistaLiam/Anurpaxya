const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { getActiveSlot } = require('../../services/profileService');

function isValidImageAttachment(attachment) {
  if (!attachment) return false;
  return attachment.contentType?.startsWith('image/');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-fond-inventaire')
    .setDescription("Définir ou retirer l'image de fond de l'inventaire d'un profil")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('slot')
        .setDescription('Le slot ciblé (sinon slot actif)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addAttachmentOption(option =>
      option
        .setName('image')
        .setDescription("Image de fond à utiliser")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('image_url')
        .setDescription("URL directe de l'image")
        .setRequired(false)
        .setMaxLength(1000)
    )
    .addBooleanOption(option =>
      option
        .setName('retirer')
        .setDescription("Retirer le fond personnalisé")
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);
    const requestedSlot = interaction.options.getInteger('slot');
    const slot = requestedSlot || await getActiveSlot(interaction.guildId, targetUser.id);

    const imageAttachment = interaction.options.getAttachment('image');
    const imageUrlOption = (interaction.options.getString('image_url') || '').trim();
    const removeBackground = interaction.options.getBoolean('retirer') || false;

    if (imageAttachment && !isValidImageAttachment(imageAttachment)) {
      await interaction.reply({
        content: "Le fichier fourni doit être une image valide.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    let profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: `Aucun profil trouvé pour **${targetUser.username}** dans le **slot ${slot}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (removeBackground) {
      profile.backgroundImageUrl = '';
      profile.backgroundImageApprovedBy = interaction.user.id;
      await profile.save();

      await interaction.reply({
        content: `✅ Fond personnalisé retiré pour **${profile.nomPrenom || targetUser.username}** (slot ${slot}).`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    let backgroundImageUrl = '';
    if (imageAttachment) {
      backgroundImageUrl = imageAttachment.url;
    } else if (imageUrlOption) {
      backgroundImageUrl = imageUrlOption;
    }

    if (!backgroundImageUrl) {
      await interaction.reply({
        content: "Tu dois fournir soit une **image**, soit une **image_url**, ou utiliser `retirer:true`.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    profile.backgroundImageUrl = backgroundImageUrl;
    profile.backgroundImageApprovedBy = interaction.user.id;
    await profile.save();

    await interaction.reply({
      content: [
        `✅ Fond personnalisé défini pour **${profile.nomPrenom || targetUser.username}** (slot ${slot}).`,
        `URL : ${backgroundImageUrl}`
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};