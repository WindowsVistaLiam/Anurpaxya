const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    nomPrenom: {
      type: String,
      default: ''
    },
    ageGenre: {
      type: String,
      default: ''
    },
    pouvoir: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    souillure: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    rpActionsCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

profileSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Profile', profileSchema);