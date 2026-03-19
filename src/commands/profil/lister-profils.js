const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getAllProfiles, getActiveSlot } = require('../../services/profileService');
const { isMj, isAdmin } = require('../../utils/profileLimits');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lister-profils')
    .setDescription('Lister les profils d’un joueur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('utilisateur')
        .setDescription('Le joueur ciblé')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('utilisateur', true);

    const profiles = await getAllProfiles(interaction.guildId, targetUser.id);
    const activeSlot = await getActiveSlot(interaction.guildId, targetUser.id);

    if (profiles.length === 0) {
      await interaction.reply({
        content: `**${targetUser.username}** n’a aucun profil enregistré.`,
        ephemeral: true
      });
      return;
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const lines = profiles.map(profile => {
      const isActive = profile.slot === activeSlot ? '✅' : '•';
      const name = profile.nomPrenom || 'Sans nom';
      return `${isActive} **Slot ${profile.slot}** — ${name}`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`📚 Profils de ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setDescription(lines.join('\n'))
      .addFields(
        {
          name: '🎯 Profil actif',
          value: `Slot **${activeSlot}**`,
          inline: true
        },
        {
          name: '🧩 Statut',
          value: targetMember
            ? isAdmin(targetMember)
              ? 'Administrateur'
              : isMj(targetMember)
                ? 'MJ'
                : 'Joueur'
            : 'Inconnu',
          inline: true
        },
        {
          name: '📦 Limite autorisée',
          value: targetMember
            ? (isAdmin(targetMember) || isMj(targetMember) ? '**10 profils**' : '**3 profils**')
            : '**3 profils**',
          inline: true
        }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};