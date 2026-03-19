const Profile = require('../models/Profile');
const { getTrade, deleteTrade, isTradeExpired } = require('../utils/tradeStore');

module.exports = function registerTradeInteractions(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (
      !interaction.customId.startsWith('trade_accept:') &&
      !interaction.customId.startsWith('trade_refuse:')
    ) {
      return;
    }

    try {
      const [action, tradeId] = interaction.customId.split(':');
      const trade = getTrade(tradeId);

      if (!trade) {
        await interaction.reply({
          content: 'Cette demande d’échange est introuvable ou a déjà été traitée.',
          ephemeral: true
        });
        return;
      }

      if (interaction.user.id !== trade.receiverId) {
        await interaction.reply({
          content: 'Seul le destinataire peut répondre à cette demande.',
          ephemeral: true
        });
        return;
      }

      if (isTradeExpired(trade)) {
        deleteTrade(tradeId);

        await interaction.update({
          content: '⌛ Cette demande d’échange a expiré.',
          components: []
        });

        return;
      }

      if (action === 'trade_refuse') {
        deleteTrade(tradeId);

        await interaction.update({
          content: `❌ ${interaction.user.username} a refusé l’échange.`,
          components: []
        });

        return;
      }

      if (trade.type === 'money') {
        const senderProfile = await Profile.findOne({
          guildId: trade.guildId,
          userId: trade.senderId,
          slot: trade.senderSlot
        });

        if (!senderProfile) {
          deleteTrade(tradeId);

          await interaction.update({
            content: '❌ Le profil donneur est introuvable. Échange annulé.',
            components: []
          });

          return;
        }

        if ((senderProfile.wallet || 0) < trade.amount) {
          deleteTrade(tradeId);

          await interaction.update({
            content: '❌ Le donneur ne possède plus assez d’argent sur ce profil. Échange annulé.',
            components: []
          });

          return;
        }

        let receiverProfile = await Profile.findOne({
          guildId: trade.guildId,
          userId: trade.receiverId,
          slot: trade.receiverSlot
        });

        if (!receiverProfile) {
          receiverProfile = await Profile.create({
            guildId: trade.guildId,
            userId: trade.receiverId,
            slot: trade.receiverSlot
          });
        }

        senderProfile.wallet -= trade.amount;
        receiverProfile.wallet = (receiverProfile.wallet || 0) + trade.amount;

        await senderProfile.save();
        await receiverProfile.save();

        deleteTrade(tradeId);

        await interaction.update({
          content:
            `✅ Échange accepté.\n` +
            `**${trade.amount}** pièces ont été transférées du **slot ${trade.senderSlot}** de <@${trade.senderId}> ` +
            `vers le **slot ${trade.receiverSlot}** de <@${trade.receiverId}>.`,
          components: []
        });

        return;
      }

      if (trade.type === 'item') {
        const senderProfile = await Profile.findOne({
          guildId: trade.guildId,
          userId: trade.senderId,
          slot: trade.senderSlot
        });

        if (!senderProfile) {
          deleteTrade(tradeId);

          await interaction.update({
            content: '❌ Le profil donneur est introuvable. Échange annulé.',
            components: []
          });

          return;
        }

        const senderItem = senderProfile.inventory.find(
          item => item.name.toLowerCase() === trade.itemName.toLowerCase()
        );

        if (!senderItem || senderItem.quantity < trade.quantity) {
          deleteTrade(tradeId);

          await interaction.update({
            content: '❌ Le donneur ne possède plus assez de cet objet sur ce profil. Échange annulé.',
            components: []
          });

          return;
        }

        let receiverProfile = await Profile.findOne({
          guildId: trade.guildId,
          userId: trade.receiverId,
          slot: trade.receiverSlot
        });

        if (!receiverProfile) {
          receiverProfile = await Profile.create({
            guildId: trade.guildId,
            userId: trade.receiverId,
            slot: trade.receiverSlot
          });
        }

        senderItem.quantity -= trade.quantity;

        if (senderItem.quantity <= 0) {
          senderProfile.inventory = senderProfile.inventory.filter(
            item => item.name.toLowerCase() !== trade.itemName.toLowerCase()
          );
        }

        const receiverItem = receiverProfile.inventory.find(
          item => item.name.toLowerCase() === trade.itemName.toLowerCase()
        );

        if (receiverItem) {
          receiverItem.quantity += trade.quantity;
        } else {
          receiverProfile.inventory.push({
            name: trade.itemName,
            quantity: trade.quantity
          });
        }

        await senderProfile.save();
        await receiverProfile.save();

        deleteTrade(tradeId);

        await interaction.update({
          content:
            `✅ Échange accepté.\n` +
            `**${trade.itemName}** ×${trade.quantity} a été transféré du **slot ${trade.senderSlot}** de <@${trade.senderId}> ` +
            `vers le **slot ${trade.receiverSlot}** de <@${trade.receiverId}>.`,
          components: []
        });

        return;
      }

      deleteTrade(tradeId);

      await interaction.update({
        content: '❌ Type d’échange inconnu. Demande annulée.',
        components: []
      });
    } catch (error) {
      console.error('❌ Erreur échange V2 :', error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Une erreur est survenue pendant le traitement de l’échange.',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue pendant le traitement de l’échange.',
          ephemeral: true
        }).catch(() => {});
      }
    }
  });
};