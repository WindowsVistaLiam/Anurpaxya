const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Profile = require('../../models/Profile');
const { canManageReputation } = require('../../config/permissions');

function getReputationField(type) {
  if (type === 'positive') return 'positiveReputation';
  if (type === 'negative') return 'negativeReputation';
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin-reputation')
    .setDescription('Ajouter ou retirer de la réputation à un profil')
    .addSubcommand(sub =>
      sub
        .setName('ajouter')
        .setDescription('Ajouter de la réputation positive ou négative')
        .addUserOption(option =>
          option
            .setName('joueur')
            .setDescription('Joueur ciblé')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('slot')
            .setDescription('Slot ciblé')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Type de réputation')
            .setRequired(true)
            .addChoices(
              { name: 'Positive', value: 'positive' },
              { name: 'Négative', value: 'negative' }
            )
        )
        .addIntegerOption(option =>
          option
            .setName('montant')
            .setDescription('Montant à ajouter')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(option =>
          option
            .setName('raison')
            .setDescription('Raison RP / MJ')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('retirer')
        .setDescription('Retirer de la réputation positive ou négative')
        .addUserOption(option =>
          option
            .setName('joueur')
            .setDescription('Joueur ciblé')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('slot')
            .setDescription('Slot ciblé')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Type de réputation')
            .setRequired(true)
            .addChoices(
              { name: 'Positive', value: 'positive' },
              { name: 'Négative', value: 'negative' }
            )
        )
        .addIntegerOption(option =>
          option
            .setName('montant')
            .setDescription('Montant à retirer')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(option =>
          option
            .setName('raison')
            .setDescription('Raison RP / MJ')
            .setRequired(false)
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
    const targetUser = interaction.options.getUser('joueur', true);
    const slot = interaction.options.getInteger('slot', true);
    const type = interaction.options.getString('type', true);
    const amount = interaction.options.getInteger('montant', true);
    const reason = interaction.options.getString('raison') || 'Aucune raison précisée.';

    const reputationField = getReputationField(type);

    if (!reputationField) {
      await interaction.reply({
        content: 'Type de réputation invalide.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const profile = await Profile.findOne({
      guildId: interaction.guildId,
      userId: targetUser.id,
      slot
    });

    if (!profile) {
      await interaction.reply({
        content: `Aucun profil trouvé pour **${targetUser.username}** dans le **slot ${slot}**.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const oldPositive = Number(profile.positiveReputation) || 0;
    const oldNegative = Number(profile.negativeReputation) || 0;

    if (subcommand === 'ajouter') {
      profile[reputationField] = (Number(profile[reputationField]) || 0) + amount;
    } else if (subcommand === 'retirer') {
      profile[reputationField] = Math.max(0, (Number(profile[reputationField]) || 0) - amount);
    }

    await profile.save();

    const newPositive = Number(profile.positiveReputation) || 0;
    const newNegative = Number(profile.negativeReputation) || 0;
    const balance = newPositive - newNegative;
    const balanceText = balance > 0 ? `+${balance}` : `${balance}`;

    await interaction.reply({
      content: [
        `Profil : **${profile.nomPrenom || targetUser.username}** (slot ${slot})`,
        `Action : **${subcommand}**`,
        `Type : **${type === 'positive' ? 'réputation positive' : 'réputation négative'}**`,
        `Montant : **${amount}**`,
        `Raison : ${reason}`,
        '',
        `Avant : 🌟 ${oldPositive} • 🕸️ ${oldNegative}`,
        `Après : 🌟 ${newPositive} • 🕸️ ${newNegative} • ⚖️ ${balanceText}`
      ].join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};