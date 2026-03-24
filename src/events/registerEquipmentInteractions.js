const { MessageFlags } = require('discord.js');
const Profile = require('../models/Profile');
const { buildEquipmentPanelEmbed } = require('../utils/equipmentEmbeds');
const { buildEquipmentRows } = require('../utils/equipmentComponents');
const { createInventoryAttachment } = require('../utils/inventoryCanvas');

async function buildEquipmentPayload(profile, user, selectedSlot = '') {
  const attachment = await createInventoryAttachment(profile);

  return {
    embeds: [
      buildEquipmentPanelEmbed(profile, user)
        .setImage('attachment://inventaire-silhouette.png')
    ],
    files: [attachment],
    components: buildEquipmentRows(user.id, profile.slot, profile, selectedSlot)
  };
}

module.exports = function registerEquipmentInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (!interaction.isStringSelectMenu()) return;

      if (
        !interaction.customId.startsWith('equip_slot_select:') &&
        !interaction.customId.startsWith('equip_item_select:') &&
        !interaction.customId.startsWith('equip_unequip_select:')
      ) {
        return;
      }

      if (interaction.customId.startsWith('equip_slot_select:')) {
        const [, ownerUserId, rawSlot] = interaction.customId.split(':');
        const slot = Number(rawSlot);
        const selectedSlot = interaction.values[0];

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const profile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: ownerUserId,
          slot
        });

        if (!profile) {
          await interaction.reply({
            content: 'Profil introuvable.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const payload = await buildEquipmentPayload(profile, interaction.user, selectedSlot);
        await interaction.update(payload);
        return;
      }

      if (interaction.customId.startsWith('equip_item_select:')) {
        const [, ownerUserId, rawSlot, selectedSlot] = interaction.customId.split(':');
        const slot = Number(rawSlot);
        const inventoryItemId = interaction.values[0];

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const profile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: ownerUserId,
          slot
        });

        if (!profile) {
          await interaction.reply({
            content: 'Profil introuvable.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const item = profile.inventory.id(inventoryItemId);

        if (!item) {
          await interaction.reply({
            content: 'Objet introuvable dans l’inventaire.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        if (!item.equipable || item.equipmentSlot !== selectedSlot) {
          await interaction.reply({
            content: 'Cet objet n’est pas compatible avec ce slot.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        profile.equippedItems[selectedSlot] = {
          inventoryItemId: item._id,
          itemNameSnapshot: item.name,
          icon: item.icon || ''
        };

        await profile.save();

        const payload = await buildEquipmentPayload(profile, interaction.user, selectedSlot);
        await interaction.update(payload);
        return;
      }

      if (interaction.customId.startsWith('equip_unequip_select:')) {
        const [, ownerUserId, rawSlot] = interaction.customId.split(':');
        const slot = Number(rawSlot);
        const selectedSlot = interaction.values[0];

        if (interaction.user.id !== ownerUserId) {
          await interaction.reply({
            content: 'Tu ne peux pas utiliser cette interface.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const profile = await Profile.findOne({
          guildId: interaction.guildId,
          userId: ownerUserId,
          slot
        });

        if (!profile) {
          await interaction.reply({
            content: 'Profil introuvable.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        profile.equippedItems[selectedSlot] = {
          inventoryItemId: null,
          itemNameSnapshot: '',
          icon: ''
        };

        await profile.save();

        const payload = await buildEquipmentPayload(profile, interaction.user);
        await interaction.update(payload);
      }
    } catch (error) {
      console.error('❌ Erreur interactions équipement :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la gestion de l’équipement.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la gestion de l’équipement.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });
};