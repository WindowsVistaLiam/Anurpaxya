const mongoose = require('mongoose');

const reputationHistorySchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },

    targetUserId: { type: String, required: true, index: true },
    targetSlot: { type: Number, required: true, min: 1, max: 10 },
    targetProfileNameSnapshot: { type: String, default: '' },

    actionType: {
      type: String,
      enum: ['add', 'remove'],
      required: true
    },

    reputationType: {
      type: String,
      enum: ['positive', 'negative'],
      required: true
    },

    amount: { type: Number, required: true, min: 1 },
    reason: { type: String, default: 'Aucune raison précisée.' },

    performedByUserId: { type: String, required: true },
    performedByTagSnapshot: { type: String, default: '' }
  },
  { timestamps: true }
);

reputationHistorySchema.index({ guildId: 1, targetUserId: 1, targetSlot: 1, createdAt: -1 });

module.exports = mongoose.model('ReputationHistory', reputationHistorySchema);