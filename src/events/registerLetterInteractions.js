const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require('discord.js');

const Letter = require('../models/Letter');
const Profile = require('../models/Profile');
const { getActiveSlot } = require('../services/profileService');

function buildListEmbed(title, letters) {
  return {
    embeds: [{
      color: 0xe0b84d,
      title,
      description: letters.length
        ? letters.map(l => `• ${l.senderNameSnapshot} → ${l.receiverNameSnapshot}`).join('\n')
        : 'Aucune lettre.'
    }]
  };
}

module.exports = function registerLetterInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      // ---------------- BUTTONS ----------------
      if (interaction.isButton() && interaction.customId.startsWith('letter:')) {
        const [_, action, ownerId] = interaction.customId.split(':');

        if (interaction.user.id !== ownerId) {
          return interaction.reply({
            content: "Ce menu ne t'appartient pas.",
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // 📝 RÉDIGER
        if (action === 'write') {
          const modal = new ModalBuilder()
            .setCustomId(`letterModal:${interaction.user.id}`)
            .setTitle('Rédiger une lettre');

          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('receiver')
                .setLabel('ID du destinataire')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('content')
                .setLabel('Contenu')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );

          return interaction.showModal(modal);
        }

        // 📬 INBOX
        if (action === 'inbox') {
          const letters = await Letter.find({
            receiverId: interaction.user.id,
            status: 'sent'
          }).sort({ createdAt: -1 });

          return interaction.editReply(buildListEmbed('📬 Boîte de réception', letters));
        }

        // 📦 ARCHIVE
        if (action === 'archive') {
          const letters = await Letter.find({
            receiverId: interaction.user.id,
            status: 'archived'
          });

          return interaction.editReply(buildListEmbed('📦 Archives', letters));
        }

        // 🗑️ CORBEILLE
        if (action === 'trash') {
          const letters = await Letter.find({
            receiverId: interaction.user.id,
            status: 'deleted'
          });

          return interaction.editReply(buildListEmbed('🗑️ Corbeille', letters));
        }

        // 🕵️ INTERCEPTION
        if (action === 'intercept') {
          const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

          const profile = await Profile.findOne({
            guildId: interaction.guildId,
            userId: interaction.user.id,
            slot
          });

          if (!profile || !profile.location) {
            return interaction.editReply({ content: "Pas de position." });
          }

          const letters = await Letter.find({
            guildId: interaction.guildId,
            location: profile.location
          });

          if (!letters.length) {
            return interaction.editReply({ content: "Aucune lettre à intercepter." });
          }

          const success = Math.random() < 0.25;

          if (!success) {
            return interaction.editReply({ content: "❌ Échec de l'interception." });
          }

          const letter = letters[Math.floor(Math.random() * letters.length)];

          if (!letter.interceptedBy.includes(interaction.user.id)) {
            letter.interceptedBy.push(interaction.user.id);
            await letter.save();
          }

          return interaction.editReply({
            content: `🕵️ Lettre interceptée :\n\n${letter.content}`
          });
        }
      }

      // ---------------- MODAL ----------------
      if (interaction.isModalSubmit() && interaction.customId.startsWith('letterModal')) {
        const receiver = interaction.fields.getTextInputValue('receiver');
        const content = interaction.fields.getTextInputValue('content');

        const slot = await getActiveSlot(interaction.guildId, interaction.user.id);

        const profile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: interaction.user.id,
          slot
        });

        const letter = new Letter({
          guildId: interaction.guildId,
          senderId: interaction.user.id,
          receiverId: receiver,
          senderNameSnapshot: profile?.nomPrenom || interaction.user.username,
          receiverNameSnapshot: receiver,
          content,
          location: profile?.location || 'Aucune'
        });

        await letter.save();

        await interaction.reply({
          content: "✉️ Lettre envoyée.",
          flags: MessageFlags.Ephemeral
        });
      }

    } catch (err) {
      console.error('❌ Lettre error:', err);
    }
  });
};