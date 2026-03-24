const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Rumor = require('../../models/rumor');
const { canManageReputation } = require('../../config/permissions');
const { buildPublishedRumorEmbed } = require('../../utils/rumorEmbeds');
const { buildPublishedRumorRows } = require('../../utils/rumorComponents');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin-rumeur')
    .setDescription('Gérer les rumeurs RP')
    .addSubcommand(sub =>
      sub
        .setName('archiver')
        .setDescription('Archiver une rumeur active')
        .addStringOption(option =>
          option.setName('id').setDescription('ID MongoDB de la rumeur').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('raison').setDescription('Raison de l’archivage').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('supprimer')
        .setDescription('Supprimer une rumeur')
        .addStringOption(option =>
          option.setName('id').setDescription('ID MongoDB de la rumeur').setRequired(true)
        )
        .addStringOption(option =>
          option.setName('raison').setDescription('Raison de la suppression').setRequired(false)
        )
    ),

  async execute(interaction) {
    if (!canManageReputation(interaction.member)) {
      await interaction.reply({
        content: 'Tu n’as pas la permission d’utiliser cette commande.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const rumorId = interaction.options.getString('id', true);
    const reason = interaction.options.getString('raison') || 'Aucune raison précisée.';

    const rumor = await Rumor.findOne({
      _id: rumorId,
      guildId: interaction.guildId
    });

    if (!rumor) {
      await interaction.reply({
        content: 'Rumeur introuvable.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (subcommand === 'archiver') {
      rumor.status = 'archived';
    } else if (subcommand === 'supprimer') {
      rumor.status = 'deleted';
    }

    rumor.moderatedByUserId = interaction.user.id;
    rumor.moderationReason = reason;
    rumor.moderatedAt = new Date();

    await rumor.save();

    if (rumor.channelId && rumor.messageId) {
      const channel = await interaction.guild.channels.fetch(rumor.channelId).catch(() => null);
      if (channel?.isTextBased()) {
        const message = await channel.messages.fetch(rumor.messageId).catch(() => null);

        if (message) {
          if (subcommand === 'archiver') {
            const archivedEmbed = buildPublishedRumorEmbed(rumor)
              .setTitle('📦 Rumeur archivée')
              .setFooter({
                text: `Rumeur archivée par le staff • ${reason}`
              });

            await message.edit({
              embeds: [archivedEmbed],
              components: []
            }).catch(() => {});
          } else {
            await message.edit({
              content: '🗑️ Cette rumeur a été supprimée par le staff.',
              embeds: [],
              components: []
            }).catch(() => {});
          }
        }
      }
    }

    await interaction.reply({
      content: [
        `Rumeur **${subcommand === 'archiver' ? 'archivée' : 'supprimée'}** avec succès.`,
        `ID : \`${rumor._id}\``,
        `Raison : ${reason}`
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};