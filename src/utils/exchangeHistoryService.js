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
  reason
}) {
  const record = new ExchangeHistory({
    guildId,
    senderId,
    senderSlot,
    receiverId,
    receiverSlot,
    offer,
    request,
    status,
    reason
  });

  await record.save();
}

module.exports = { saveExchangeHistory };
