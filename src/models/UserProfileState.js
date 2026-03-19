const mongoose = require('mongoose');

const userProfileStateSchema = new mongoose.Schema(
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
    activeSlot: {
      type: Number,
      default: 1,
      min: 1,
      max: 3
    }
  },
  {
    timestamps: true
  }
);

userProfileStateSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('UserProfileState', userProfileStateSchema);