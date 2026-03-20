const ExchangeHistory = require('../models/ExchangeHistory');

async function saveExchangeHistory({
  guildId,
  senderId,
  senderSlot,
  receiverId,
  receiverSlot,
  offer,
  request,
  status,
  reason = ''
}) {
  return ExchangeHistory.create({
    guildId,
    senderId,
    senderSlot,
    receiverId,
    receiverSlot,
    offer: {
      money: offer?.money || 0,
      itemName: offer?.itemName || '',
      itemQuantity: offer?.itemQuantity || 0
    },
    request: {
      money: request?.money || 0,
      itemName: request?.itemName || '',
      itemQuantity: request?.itemQuantity || 0
    },
    status,
    reason
  });
}

module.exports = {
  saveExchangeHistory
};