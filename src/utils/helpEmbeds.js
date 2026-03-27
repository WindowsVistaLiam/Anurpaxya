const { EmbedBuilder } = require('discord.js');

function buildHelpEmbed(page = 1, guildName = 'Serveur RP') {

  // PAGE 1 — PROFILS
  if (page === 1) {
    return new EmbedBuilder()
      .setColor(0x8e44ad)
      .setTitle('📘 Aide — Profils & Personnages')
      .setDescription('Gestion de ton personnage RP et de ses informations.')
      .addFields(
        {
          name: '👤 Profils',
          value: [
            '`/profil` — modifier ton profil actif',
            '`/profil-creer` — créer un personnage (slot)',
            '`/profil-switch` — changer de personnage actif',
            '`/profil-supprimer` — supprimer un personnage',
            '`/voir-profil` — voir un profil',
            '`/lister-profils` — voir les profils d’un joueur'
          ].join('\n')
        },
        {
          name: '🧾 Informations',
          value: [
            '`/metier` — modifier ton métier',
            '`/relation` — gérer tes relations RP',
            '`/equipement` — gérer ton équipement (visuel)'
          ].join('\n')
        },
        {
          name: '🩸 Souillure',
          value: [
            '`/repos` — réduire ta souillure',
            'La souillure influence ton état et ton RP'
          ].join('\n')
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 1/4` })
      .setTimestamp();
  }

  // PAGE 2 — ÉCONOMIE & INVENTAIRE
  if (page === 2) {
    return new EmbedBuilder()
      .setColor(0xc0392b)
      .setTitle('💰 Aide — Économie & Inventaire')
      .setDescription('Gestion de ton argent et de tes objets.')
      .addFields(
        {
          name: '🛒 Boutique',
          value: [
            '`/boutique` — ouvrir la boutique',
            '`/acheter` — acheter un objet',
            '`/vendre` — vendre un objet'
          ].join('\n')
        },
        {
          name: '🎒 Inventaire',
          value: [
            '`/equipement` — équiper tes objets',
            'Les objets équipés apparaissent sur la silhouette',
            'Certains objets sont équipables selon leur type'
          ].join('\n')
        },
        {
          name: '💼 Informations',
          value: [
            'Ton portefeuille et ton inventaire sont visibles dans la page 3 du profil'
          ].join('\n')
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 2/4` })
      .setTimestamp();
  }

  // PAGE 3 — INTERACTIONS & RP
  if (page === 3) {
    return new EmbedBuilder()
      .setColor(0x16a085)
      .setTitle('🤝 Aide — Interactions & RP')
      .setDescription('Interactions entre joueurs et mécaniques RP.')
      .addFields(
        {
          name: '🤲 Dons',
          value: [
            '`/donner-argent` — donner de l’argent',
            '`/donner-objet` — donner un objet'
          ].join('\n')
        },
        {
          name: '🔄 Échanges',
          value: [
            '`/echange` — échanger avec un joueur',
            '`/historique-echanges` — voir les échanges récents'
          ].join('\n')
        },
        {
          name: '🗣️ Rumeurs',
          value: [
            '`/rumeur` — créer une rumeur',
            'Les rumeurs influencent la réputation'
          ].join('\n')
        },
        {
          name: '⭐ Réputation',
          value: [
            'Positive ou négative selon tes actions',
            'Visible sur ton profil',
            'Influence ton image RP'
          ].join('\n')
        },
        {
          name: '🎲 RP',
          value: [
            '`/roll` — lancer des dés'
          ].join('\n')
        },
        {
          name: '🗺️ Map',
          value: [
            '`/map` — voir les joueurs dans la zone'
          ].join('\n')
        }
      )
      .setFooter({ text: `${guildName} • Aide • Page 3/4` })
      .setTimestamp();
  }

  // PAGE 4 — ADMIN / MJ
  return new EmbedBuilder()
    .setColor(0x2c3e50)
    .setTitle('🛠️ Aide — Administration & MJ')
    .setDescription('Commandes réservées aux MJ et administrateurs.')
    .addFields(
      {
        name: '👑 Profils',
        value: [
          '`/supprimer-profil` — supprimer un profil joueur'
        ].join('\n')
      },
      {
        name: '🩸 Souillure',
        value: [
          '`/heal` — retirer de la souillure',
          '`/ajouter-souillure` — ajouter de la souillure'
        ].join('\n')
      },
      {
        name: '⭐ Réputation',
        value: [
          '`/ajouter-reputation`',
          '`/retirer-reputation`'
        ].join('\n')
      },
      {
        name: '💰 Économie',
        value: [
          '`/set-portefeuille`',
          '`/ajouter-argent`',
          '`/retirer-argent`',
          '`/ajouter-objet`',
          '`/retirer-objet`'
        ].join('\n')
      },
      {
        name: '🏪 Boutique',
        value: [
          '`/set-boutique-item`',
          '`/set-icone-item`',
          '`/supprimer-boutique-item`',
          '`/lister-boutique-items`'
        ].join('\n')
      },
      {
        name: '🗞️ Rumeurs',
        value: [
          'Gestion des rumeurs (suppression / modération)'
        ].join('\n')
      }
    )
    .setFooter({ text: `${guildName} • Aide • Page 4/4` })
    .setTimestamp();
}

module.exports = {
  buildHelpEmbed
};