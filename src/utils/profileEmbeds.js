const { EmbedBuilder } = require('discord.js');

function truncate(text, maxLength) {
  if (!text) return 'Non renseigné';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function buildSouillureBar(percent = 0) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  const totalBars = 10;
  const filledBars = Math.round(safe / 10);
  const emptyBars = totalBars - filledBars;

  return `█`.repeat(filledBars) + `░`.repeat(emptyBars) + ` ${safe}%`;
}

function getSouillureState(percent = 0) {
  const value = Number(percent) || 0;

  if (value <= 0) {
    return 'Pureté apparente';
  }
  if (value <= 20) {
    return 'Frémissement léger';
  }
  if (value <= 40) {
    return 'Présence diffuse';
  }
  if (value <= 60) {
    return 'Corruption rampante';
  }
  if (value <= 80) {
    return 'Altération profonde';
  }
  return 'Souillure critique';
}

function getSouillureColor(percent = 0) {
  const value = Number(percent) || 0;

  if (value <= 20) return 0x95a5a6;
  if (value <= 40) return 0x9b59b6;
  if (value <= 60) return 0x8e44ad;
  if (value <= 80) return 0xc0392b;
  return 0x7f0000;
}

function buildProfileEmbeds(profile, targetUser, guild) {
  const souillure = Number(profile.souillure) || 0;
  const rpActions = Number(profile.rpActionsCount) || 0;

  const cardEmbed = new EmbedBuilder()
    .setColor(getSouillureColor(souillure))
    .setAuthor({
      name: `Dossier de ${targetUser.username}`,
      iconURL: targetUser.displayAvatarURL({ size: 256 })
    })
    .setTitle(profile.nomPrenom || 'Personnage sans nom')
    .setDescription(
      [
        '╔════════════════════╗',
        '✦ **FICHE PERSONNAGE** ✦',
        '╚════════════════════╝',
        '',
      ].join('\n')
    )
    .addFields(
      {
        name: '👤┈┈┈┈ Identité',
        value: profile.nomPrenom || 'Non renseigné',
        inline: false
      },
      {
        name: '🪪┈┈┈┈ Âge / Genre',
        value: profile.ageGenre || 'Non renseigné',
        inline: false
      },
      {
        name: '🧬┈┈┈┈ Pouvoir / Aptitude',
        value: truncate(profile.pouvoir || 'Non renseigné', 1024),
        inline: true
      },
      {
        name: '☣️┈┈┈┈ État de Souillure',
        value: getSouillureState(souillure),
        inline: false
      },
      {
        name: '📊┈┈┈┈ Niveau',
        value: buildSouillureBar(souillure),
        inline: false
      },
      {
        name: '👤┈┈┈┈ Description',
        value: truncate(profile.description || 'Aucune description.', 1024),
        inline: false
      },
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • Profil de ${targetUser.username}`
    })
    .setTimestamp();

  if (profile.imageUrl) {
    cardEmbed.setThumbnail(profile.imageUrl);
    cardEmbed.setImage(profile.imageUrl);
  }

  const detailsEmbed = new EmbedBuilder()
    .setColor(getSouillureColor(souillure))
    .setTitle('✦ Détails complémentaires')
    .setDescription(
      [
        '```fix',
        `☣️ Souillure actuelle : ${souillure}%`,
        `📚 Actions RP validées : ${rpActions}`,
        `📈 Progression : ${Math.max(0, 20 - (rpActions % 20))} action(s) avant le prochain palier`,
        '```'
      ].join('\n')
    )
    .addFields(
      {
        name: '⟡ Présence',
        value: souillure > 0
          ? 'Une trace perceptible semble émaner de ce personnage.'
          : 'Aucune trace notable ne semble émaner de ce personnage.',
        inline: false
      },
      {
        name: '⟡ Archive',
        value: [
          `Créé : <t:${Math.floor(new Date(profile.createdAt).getTime() / 1000)}:D>`,
          `Mis à jour : <t:${Math.floor(new Date(profile.updatedAt).getTime() / 1000)}:R>`
        ].join('\n'),
        inline: false
      }
    )
    .setFooter({
      text: 'Registre narratif'
    });

  return [cardEmbed, detailsEmbed];
}

module.exports = {
  buildProfileEmbeds
};