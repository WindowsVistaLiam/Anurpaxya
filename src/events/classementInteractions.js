const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Profile = require('../../models/profile');

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
  }[type];
}

function getValue(profile, type) {
  switch (type) {
    case 'titles': return profile.titles?.length || 0;
    case 'reputation_positive': return profile.positiveReputation || 0;
    case 'reputation_negative': return profile.negativeReputation || 0;
    case 'relations': return profile.relations?.length || 0;
    case 'rp_messages': return profile.rpMessages || 0;
    case 'souillure': return profile.souillure || 0;
  }
}

function buildRanking(profiles, type, mode) {
  if (mode === 'profil') {
    return profiles.map(p => ({
      id: `${p.userId}-${p.slot}`,
      name: `${p.nomPrenom || p.userId} (slot ${p.slot})`,
      userId: p.userId,
      value: getValue(p, type)
    })).sort((a, b) => b.value - a.value);
  }

  const map = new Map();

  for (const p of profiles) {
    if (!map.has(p.userId)) {
      map.set(p.userId, { userId: p.userId, value: 0 });
    }
    map.get(p.userId).value += getValue(p, type);
  }

  return Array.from(map.values())
    .map(e => ({
      id: e.userId,
      name: `<@${e.userId}>`,
      userId: e.userId,
      value: e.value
    }))
    .sort((a, b) => b.value - a.value);
}

function buildEmbed(ranking, page, type, mode, userId) {
  const perPage = 10;
  const start = (page - 1) * perPage;
  const slice = ranking.slice(start, start + perPage);

  const description = slice.map((e, i) =>
    `**${start + i + 1}.** ${e.name} — **${e.value}**`
  ).join('\n') || 'Aucune donnée';

  const rankIndex = ranking.findIndex(e => e.userId === userId);
  const rankText = rankIndex !== -1 ? `\n\n📍 **Tu es #${rankIndex + 1}**` : '';

  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(`🏆 Classement — ${getLabel(type)}`)
    .setDescription(description + rankText)
    .setFooter({ text: `Page ${page} • Mode : ${mode}` })
    .setTimestamp();
}

function buildButtons(page, type, mode) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`classement_prev_${page}_${type}_${mode}`)
      .setLabel('⬅️')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`classement_next_${page}_${type}_${mode}`)
      .setLabel('➡️')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`classement_switch_${page}_${type}_${mode}`)
      .setLabel('🔄 Mode')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`classement_type_${page}_${type}_${mode}`)
      .setLabel('📊 Type')
      .setStyle(ButtonStyle.Success)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('classement')
    .setDescription('Classements du serveur'),

  async execute(interaction) {
    const profiles = await Profile.find({ guildId: interaction.guildId });

    const type = 'rp_messages';
    const mode = 'profil';
    const page = 1;

    const ranking = buildRanking(profiles, type, mode);

    const embed = buildEmbed(ranking, page, type, mode, interaction.user.id);
    const buttons = buildButtons(page, type, mode);

    await interaction.reply({
      embeds: [embed],
      components: [buttons]
    });
  }
};