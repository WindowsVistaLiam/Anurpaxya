const TYPES = [
  'titles',
  'reputation_positive',
  'reputation_negative',
  'relations',
  'rp_messages',
  'souillure'
];

function getLabel(type) {
  return {
    titles: 'Titres',
    reputation_positive: 'Réputation positive',
    reputation_negative: 'Réputation négative',
    relations: 'Relations',
    rp_messages: 'Messages RP',
    souillure: 'Souillure'
  }[type] || 'Classement';
}

function getModeLabel(mode) {
  return mode === 'joueur' ? 'Joueur' : 'Profil';
}

function getValue(profile, type) {
  switch (type) {
    case 'titles':
      return Array.isArray(profile.titles) ? profile.titles.length : 0;

    case 'reputation_positive':
      return Number(profile.positiveReputation) || 0;

    case 'reputation_negative':
      return Number(profile.negativeReputation) || 0;

    case 'relations':
      return Array.isArray(profile.relations) ? profile.relations.length : 0;

    case 'rp_messages':
      return Number(profile.rpMessages) || 0;

    case 'souillure':
      return Number(profile.souillure) || 0;

    default:
      return 0;
  }
}

function formatValue(type, value) {
  if (type === 'souillure') {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  return Number(value || 0).toLocaleString('fr-FR');
}

function buildRanking(profiles, type, mode) {
  if (mode === 'profil') {
    return profiles
      .map(profile => ({
        id: `${profile.userId}-${profile.slot}`,
        userId: profile.userId,
        slot: profile.slot,
        displayName: profile.nomPrenom || `Profil ${profile.userId}`,
        value: getValue(profile, type)
      }))
      .sort((a, b) => b.value - a.value);
  }

  const grouped = new Map();

  for (const profile of profiles) {
    if (!grouped.has(profile.userId)) {
      grouped.set(profile.userId, {
        id: profile.userId,
        userId: profile.userId,
        displayName: null,
        slots: [],
        value: 0
      });
    }

    const entry = grouped.get(profile.userId);
    entry.value += getValue(profile, type);
    entry.slots.push({
      slot: profile.slot,
      name: profile.nomPrenom || `Profil ${profile.slot}`
    });
  }

  return Array.from(grouped.values()).sort((a, b) => b.value - a.value);
}

function getPersonalRank(ranking, userId, slot, mode) {
  if (mode === 'profil') {
    return ranking.findIndex(entry => entry.userId === userId && Number(entry.slot) === Number(slot)) + 1;
  }

  return ranking.findIndex(entry => entry.userId === userId) + 1;
}

function paginateRanking(ranking, page = 1, perPage = 10) {
  const totalPages = Math.max(1, Math.ceil(ranking.length / perPage));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));
  const start = (safePage - 1) * perPage;

  return {
    page: safePage,
    perPage,
    totalPages,
    totalItems: ranking.length,
    items: ranking.slice(start, start + perPage)
  };
}

module.exports = {
  TYPES,
  getLabel,
  getModeLabel,
  getValue,
  formatValue,
  buildRanking,
  getPersonalRank,
  paginateRanking
};