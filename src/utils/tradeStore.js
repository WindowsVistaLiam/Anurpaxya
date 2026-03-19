const pendingTrades = new Map();

function createTrade(trade) {
  pendingTrades.set(trade.id, trade);
  return trade;
}

function getTrade(tradeId) {
  return pendingTrades.get(tradeId) || null;
}

function deleteTrade(tradeId) {
  return pendingTrades.delete(tradeId);
}

function isTradeExpired(trade) {
  return !trade || Date.now() > trade.expiresAt;
}

module.exports = {
  createTrade,
  getTrade,
  deleteTrade,
  isTradeExpired
};