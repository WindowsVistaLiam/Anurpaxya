const { EmbedBuilder } = require('discord.js');

function formatSide(side) {
  const lines = [];

  if ((side.money || 0) > 0) {
    lines.push(`💰 **${side.money}** pièces`);
  }

  if (side.itemName && (side.itemQuantity || 0) > 0) {
    lines.push(`🎒 **${side.itemName}** ×${side.itemQuantity}`);
  }

  return lines.length > 0 ? lines.join('\n') : '*Rien*';
}

function hasSideContent(side) {
  return (side.money || 0) > 0 || (!!side.itemName && (side.itemQuantity || 0) > 0);
}

function buildExchangeDraftEmbed({
  draft,
  senderUser,
  receiverUser,
  guildName
}) {
  return new EmbedBuilder()
    .setColor(0x8e44ad)
    .setTitle('🤝 Préparation de l’échange')
    .setDescription(
      [
        `**Proposé par :** ${senderUser.username} (slot ${draft.senderSlot})`,
        `**Destinataire :** ${receiverUser.username} (slot ${draft.receiverSlot})`,
        '',
        '**Tu donnes :**',
        formatSide(draft.offer),
        '',
        '**Tu demandes :**',
        formatSide(draft.request)
      ].join('\n')
    )
    .addFields(
      {
        name: '📌 Règles',
        value: [
          '• Tu peux configurer **1 montant** et **1 objet** de chaque côté.',
          '• L’échange sera revalidé au moment de l’acceptation.',
          '• Utilise les boutons ci-dessous pour modifier le brouillon.'
        ].join('\n'),
        inline: false
      }
    )
    .setFooter({
      text: `${guildName} • Brouillon d’échange`
    })
    .setTimestamp();
}

function buildExchangeProposalEmbed({
  trade,
  senderUser,
  receiverUser,
  guildName
}) {
  return new EmbedBuilder()
    .setColor(0xc0392b)
    .setTitle('🤝 Proposition d’échange')
    .setDescription(
      [
        `**${senderUser.username}** (slot ${trade.senderSlot}) propose un échange à **${receiverUser.username}** (slot ${trade.receiverSlot}).`,
        '',
        '**Le joueur 1 donne :**',
        formatSide(trade.offer),
        '',
        '**Le joueur 1 demande :**',
        formatSide(trade.request),
        '',
        '⏳ Cette proposition expire dans **60 secondes**.'
      ].join('\n')
    )
    .setFooter({
      text: `${guildName} • En attente de réponse`
    })
    .setTimestamp();
}

module.exports = {
  formatSide,
  hasSideContent,
  buildExchangeDraftEmbed,
  buildExchangeProposalEmbed
};