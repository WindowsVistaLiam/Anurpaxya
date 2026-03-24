const {
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const { SLOT_LABELS } = require('./inventoryCanvas');

function shorten(text, max = 100) {
  if (!text) return 'Sans nom';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function buildEquipmentRows(ownerUserId, slot, profile, selectedSlot = '') {
  const rows = [];

  rows.push(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`equip_slot_select:${ownerUserId}:${slot}`)
        .setPlaceholder('Choisir un slot à équiper')
        .addOptions(
          Object.entries(SLOT_LABELS).map(([slotKey, label]) => ({
            label,
            description: `Équiper un objet dans le slot ${label}`,
            value: slotKey,
            default: selectedSlot === slotKey
          }))
        )
    )
  );

  const equippedSlots = Object.entries(SLOT_LABELS)
    .filter(([slotKey]) => profile?.equippedItems?.[slotKey]?.itemNameSnapshot)
    .map(([slotKey, label]) => ({
      label,
      description: `Déséquiper ${profile.equippedItems[slotKey].itemNameSnapshot}`,
      value: slotKey
    }));

  if (equippedSlots.length > 0) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`equip_unequip_select:${ownerUserId}:${slot}`)
          .setPlaceholder('Déséquiper un slot')
          .addOptions(equippedSlots)
      )
    );
  }

  if (selectedSlot) {
    const items = (profile.inventory || []).filter(item =>
      item.equipable === true &&
      item.quantity > 0 &&
      item.equipmentSlot === selectedSlot
    );

    if (items.length > 0) {
      rows.push(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`equip_item_select:${ownerUserId}:${slot}:${selectedSlot}`)
            .setPlaceholder(`Choisir un objet pour ${SLOT_LABELS[selectedSlot]}`)
            .addOptions(
              items.slice(0, 25).map(item => ({
                label: shorten(item.name, 100),
                description: `Quantité : ${item.quantity}`,
                value: String(item._id)
              }))
            )
        )
      );
    }
  }

  return rows;
}

module.exports = {
  buildEquipmentRows
};