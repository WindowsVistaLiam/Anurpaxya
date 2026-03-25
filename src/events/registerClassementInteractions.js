const { MessageFlags } = require('discord.js');
const { TYPES } = require('../utils/classementUtils');
const { buildClassementPayload } = require('../commands/general/classement');
const { getActiveSlot } = require('../services/profileService');

module.exports = function registerClassementInteractions(client) {
  client.on('interactionCreate', async interaction => {
    try {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('classement:')) return;

      const [, action, ownerUserId, rawPage, type, mode] = interaction.customId.split(':');

      if (interaction.user.id !== ownerUserId) {
        await interaction.reply({
          content: 'Tu ne peux pas utiliser cette interface.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      let page = Number(rawPage) || 1;
      let nextType = type;
      let nextMode = mode;

      if (action === 'prev') {
        page = Math.max(1, page - 1);
      } else if (action === 'next') {
        page += 1;
      } else if (action === 'mode') {
        nextMode = mode === 'profil' ? 'joueur' : 'profil';
        page = 1;
      } else if (action === 'type') {
        const currentIndex = TYPES.indexOf(type);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % TYPES.length;
        nextType = TYPES[nextIndex];
        page = 1;
      }

      const viewerSlot = await getActiveSlot(interaction.guildId, interaction.user.id);

      const payload = await buildClassementPayload({
        client,
        guild: interaction.guild,
        guildId: interaction.guildId,
        viewerId: interaction.user.id,
        viewerSlot,
        type: nextType,
        mode: nextMode,
        page
      });

      await interaction.update(payload);
    } catch (error) {
      console.error('❌ Erreur interactions classement :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant la navigation du classement.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant la navigation du classement.',
          flags: MessageFlags.Ephemeral
        }).catch(() => {});
      }
    }
  });
};