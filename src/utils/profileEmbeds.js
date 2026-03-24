const { EmbedBuilder } = require('discord.js');
const { getTitleRarityDisplay } = require('./titleUtils');
const { buildEquipmentSummary } = require('./inventoryCanvas');

function truncate(text, maxLength) {
  if (!text) return 'Non renseigné';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function buildSouillureBar(percent = 0) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  const totalBars = 10;
  const filledBars = Math.round(safe / 10);
  const emptyBars = totalBars - filledBars;
  return `${'█'.repeat(filledBars)}${'░'.repeat(emptyBars)} ${safe}%`;
}

function getSouillureState(percent = 0) {
  const value = Number(percent) || 0;
  if (value <= 0) return 'Pureté apparente';
  if (value <= 10) return 'Frémissement léger';
  if (value <= 20) return 'Frémissement intense';
  if (value <= 30) return 'Tic inopiné';
  if (value <= 40) return 'Présence diffuse';
  if (value <= 50) return 'Modification corporelle et psychique';
  if (value <= 60) return 'Corruption rampante sur le corps';
  if (value <= 70) return 'Corruption gangrénée';
  if (value <= 80) return 'Altération profonde';
  if (value <= 90) return 'Altération chaotique';
  return 'Souillure critique';
}

function getPresenceText(souillure = 0) {
  if (souillure <= 0) return 'Aucune anomalie perceptible.';
  if (souillure <= 10) return 'Aucune anomalie perceptible.';
  if (souillure <= 20) return 'Altération comportementale.';
  if (souillure <= 30) return 'Altération comportementale brutale.';
  if (souillure <= 40) return 'Altération comportementale brutale et trace de striure sur le corps.';
  if (souillure <= 50) return 'Altération comportementale brutale et une partie du corps altérée.';
  if (souillure <= 60) return 'Altération comportementale brutale et plusieurs parties du corps altérées.';
  if (souillure <= 70) return 'Perte de lucidité et de la maîtrise de ses actes, altérations profondes sur le corps.';
  if (souillure <= 80) return 'Perte totale de lucidité et séquelles sur le corps.';
  if (souillure <= 90) return 'Phase de non retour amorcée.';
  return "La réalité elle-même semble se déformer, ce personnage n'est plus que l'ombre de lui-même.";
}

function formatInventory(inventory = []) {
  if (!Array.isArray(inventory) || inventory.length === 0) {
    return 'Aucun objet.';
  }

  return inventory
    .slice(0, 20)
    .map(item => {
      const extra = item.equipable && item.equipmentSlot
        ? ` *(équipable : ${item.equipmentSlot})*`
        : '';
      return `• **${item.name}** ×${item.quantity}${extra}`;
    })
    .join('\n');
}

function getEquippedTitleDisplay(profile) {
  if (!profile.equippedTitle) return 'Aucun titre équipé';
  if (!Array.isArray(profile.titles) || profile.titles.length === 0) return profile.equippedTitle;

  const equipped = profile.titles.find(title => {
    if (typeof title === 'string') return title === profile.equippedTitle;
    return title.name === profile.equippedTitle;
  });

  if (!equipped) return profile.equippedTitle;
  if (typeof equipped === 'string') return getTitleRarityDisplay(equipped, 'common');

  return getTitleRarityDisplay(equipped.name, equipped.rarity || 'common');
}

function formatRelationType(type = 'autre') {
  const labels = {
    allie: 'Allié',
    rival: 'Rival',
    famille: 'Famille',
    mentor: 'Mentor',
    disciple: 'Disciple',
    amour: 'Amour',
    haine: 'Haine',
    neutre: 'Neutre',
    autre: 'Autre'
  };

  return labels[type] || 'Autre';
}

function buildRelationsSummary(relations = []) {
  if (!Array.isArray(relations) || relations.length === 0) {
    return 'Aucune relation connue.';
  }

  const sorted = [...relations].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const preview = sorted.slice(0, 4).map(relation => {
    const targetName =
      relation.targetProfileNameSnapshot ||
      `Utilisateur ${relation.targetUserId} • Slot ${relation.targetSlot || 1}`;

    return `• **${formatRelationType(relation.type)}** — ${truncate(targetName, 60)}`;
  });

  const remaining = sorted.length - preview.length;
  if (remaining > 0) {
    preview.push(`• … et **${remaining}** autre(s)`);
  }

  return truncate(preview.join('\n'), 1024);
}

function buildReputationSummary(profile) {
  const positive = Number(profile.positiveReputation) || 0;
  const negative = Number(profile.negativeReputation) || 0;
  const balance = positive - negative;
  const balanceText = balance > 0 ? `+${balance}` : `${balance}`;

  return [
    `🌟 **Réputation positive :** ${positive}`,
    `🕸️ **Réputation négative :** ${negative}`,
    `⚖️ **Balance :** ${balanceText}`
  ].join('\n');
}

function formatDate(date) {
  if (!date) return 'Inconnue';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Inconnue';
  return parsed.toLocaleString('fr-FR');
}

function getPageColor(page, souillure = 0) {
  if (page === 1) return 0x3498db;
  if (page === 2) return 0x9b59b6;
  if (page === 3) return 0x2ecc71;

  if (souillure <= 20) return 0x95a5a6;
  if (souillure <= 40) return 0x8e44ad;
  if (souillure <= 60) return 0x7d3c98;
  if (souillure <= 80) return 0xc0392b;
  return 0x7f0000;
}

function buildProfileEmbed(profile, targetUser, guild, page = 1) {
  const souillure = Number(profile.souillure) || 0;
  const wallet = Number(profile.wallet) || 0;
  const rpMessages = Number(profile.rpMessages) || 0;
  const rpLevel = Number(profile.rpLevel) || 1;
  const color = getPageColor(page, souillure);
  const slot = profile.slot || 1;

  const baseFooter = {
    text: `${guild?.name || 'Serveur RP'} • Profil de ${targetUser.username} • Slot ${slot} • Page ${page}/3`
  };

  if (page === 1) {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({
        name: `📘 Dossier de ${targetUser.username}`,
        iconURL: targetUser.displayAvatarURL({ size: 256 })
      })
      .setTitle(`✨ ${profile.nomPrenom || 'Personnage sans nom'} • Slot ${slot}`)
      .addFields(
        { name: '🪪 Identité', value: profile.nomPrenom || 'Non renseigné', inline: false },
        { name: '👤 Âge / Genre', value: profile.ageGenre || 'Non renseigné', inline: false },
        { name: '🔮 Pouvoir / Aptitude', value: truncate(profile.pouvoir || 'Non renseigné', 1024), inline: false },
        { name: '📝 Description', value: truncate(profile.description || 'Aucune description.', 1024), inline: false },
        { name: '⭐ Réputation', value: buildReputationSummary(profile), inline: false },
        { name: '💞 Relations', value: buildRelationsSummary(profile.relations || []), inline: false }
      )
      .setFooter(baseFooter)
      .setTimestamp();

    if (profile.imageUrl) {
      embed.setThumbnail(profile.imageUrl);
      embed.setImage(profile.imageUrl);
    }

    return embed;
  }

  if (page === 2) {
    return new EmbedBuilder()
      .setColor(color)
      .setAuthor({
        name: `📚 Détails complémentaires de ${targetUser.username}`,
        iconURL: targetUser.displayAvatarURL({ size: 256 })
      })
      .setTitle(`🧾 Fiche annexe — ${profile.nomPrenom || targetUser.username} • Slot ${slot}`)
      .addFields(
        { name: '💼 Métier', value: profile.metier || 'Sans métier', inline: false },
        { name: '🏅 Titre équipé', value: getEquippedTitleDisplay(profile), inline: false },
        { name: '☣️ Souillure', value: `${buildSouillureBar(souillure)}\n${getSouillureState(souillure)}`, inline: false },
        { name: '👁️ Présence', value: getPresenceText(souillure), inline: false },
        {
          name: '📈 Progression RP',
          value: [
            `**Niveau RP :** ${rpLevel}`,
            `**Messages RP validés :** ${rpMessages}`,
            `**Avant le prochain niveau :** ${Math.max(0, 20 - (rpMessages % 20))} message(s)`
          ].join('\n'),
          inline: false
        },
        {
          name: '📂 Archive',
          value: [
            `**Créé le :** ${formatDate(profile.createdAt)}`,
            `**Dernière mise à jour :** ${formatDate(profile.updatedAt)}`
          ].join('\n'),
          inline: false
        }
      )
      .setFooter(baseFooter)
      .setTimestamp();
  }

  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `🎒 Inventaire de ${targetUser.username}`,
      iconURL: targetUser.displayAvatarURL({ size: 256 })
    })
    .setTitle(`💰 Inventaire & Équipement — ${profile.nomPrenom || targetUser.username} • Slot ${slot}`)
    .setDescription('L’image ci-dessous représente la silhouette et les emplacements équipés du profil.')
    .addFields(
      { name: '🪙 Portefeuille', value: `**${wallet}** pièces`, inline: false },
      { name: '🧩 Équipement', value: buildEquipmentSummary(profile), inline: false },
      { name: '🎁 Inventaire', value: truncate(formatInventory(profile.inventory), 1024), inline: false }
    )
    .setImage('attachment://inventaire-silhouette.png')
    .setFooter(baseFooter)
    .setTimestamp();
}

module.exports = {
  buildProfileEmbed
};