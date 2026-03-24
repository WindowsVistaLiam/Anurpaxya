const { EmbedBuilder } = require('discord.js');

const HISTORY_PER_PAGE = 5;

function formatDate(date) {
  if (!date) return 'Inconnue';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Inconnue';
  return parsed.toLocaleString('fr-FR');
}

function getHistoryPage(entries = [], page = 1) {
  const totalPages = Math.max(1, Math.ceil(entries.length / HISTORY_PER_PAGE));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));
  const start = (safePage - 1) * HISTORY_PER_PAGE;

  return {
    page: safePage,
    totalPages,
    totalItems: entries.length,
    items: entries.slice(start, start + HISTORY_PER_PAGE)
  };
}

function buildReputationHistoryEmbed({ guild, profileName, slot, entries, page, targetUser }) {
  const pageData = getHistoryPage(entries, page);

  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setAuthor({
      name: `Historique de réputation de ${targetUser.username}`,
      iconURL: targetUser.displayAvatarURL({ size: 256 })
    })
    .setTitle(`📜 ${profileName || 'Profil inconnu'} • Slot ${slot}`)
    .setDescription(
      pageData.totalItems === 0
        ? 'Aucun historique de réputation pour ce profil.'
        : pageData.items
            .map((entry, index) => {
              const absoluteIndex = (pageData.page - 1) * HISTORY_PER_PAGE + index + 1;
              const action = entry.actionType === 'add' ? 'Ajout' : 'Retrait';
              const repType = entry.reputationType === 'positive' ? '🌟 Positive' : '🕸️ Négative';

              return [
                `**#${absoluteIndex} — ${action} ${repType}**`,
                `Montant : **${entry.amount}**`,
                `Raison : ${entry.reason || 'Aucune raison précisée.'}`,
                `Par : ${entry.performedByTagSnapshot || entry.performedByUserId}`,
                `Date : ${formatDate(entry.createdAt)}`
              ].join('\n');
            })
            .join('\n\n')
    )
    .setFooter({
      text: `${guild?.name || 'Serveur RP'} • ${pageData.totalItems} entrée(s) • Page ${pageData.page}/${pageData.totalPages}`
    })
    .setTimestamp();
}

module.exports = {
  HISTORY_PER_PAGE,
  getHistoryPage,
  buildReputationHistoryEmbed
};