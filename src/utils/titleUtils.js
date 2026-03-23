function getTitleRarityDisplay(title = '', rarity = 'common') {
  if (rarity === 'legendary') {
    return `👑 Légendaire • ${title}`;
  }

  if (rarity === 'epic') {
    return `💠 Épique • ${title}`;
  }

  if (rarity === 'rare') {
    return `🔷 Rare • ${title}`;
  }

  return `▫️ Commun • ${title}`;
}

function getTitleRarityColor(rarity = 'common') {
  if (rarity === 'legendary') return 0xf1c40f;
  if (rarity === 'epic') return 0x9b59b6;
  if (rarity === 'rare') return 0x3498db;
  return 0x95a5a6;
}

module.exports = {
  getTitleRarityDisplay,
  getTitleRarityColor
};