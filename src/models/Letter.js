const mongoose = require('mongoose');

const letterSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },

  senderId: { type: String, required: true, index: true },
  receiverId: { type: String, required: true, index: true },

  senderNameSnapshot: { type: String, default: '' },
  receiverNameSnapshot: { type: String, default: '' },

  content: { type: String, required: true, maxlength: 4000 },

  location: { type: String, default: 'Aucune' },

  status: {
    type: String,
    enum: ['sent', 'archived', 'deleted'],
    default: 'sent'
  },

  interceptedBy: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now }
});

module.exports =
  mongoose.models.Letter || mongoose.model('Letter', letterSchema);