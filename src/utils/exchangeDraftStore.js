const exchangeDrafts = new Map();

function createExchangeDraft(draft) {
  exchangeDrafts.set(draft.id, draft);
  return draft;
}

function getExchangeDraft(draftId) {
  return exchangeDrafts.get(draftId) || null;
}

function deleteExchangeDraft(draftId) {
  return exchangeDrafts.delete(draftId);
}

function isExchangeDraftExpired(draft) {
  return !draft || Date.now() > draft.expiresAt;
}

module.exports = {
  createExchangeDraft,
  getExchangeDraft,
  deleteExchangeDraft,
  isExchangeDraftExpired
};