const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  { _id: false }
);

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
    slot: {
      type: Number,
      required: true,
      min: 1,
      max: 10
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
    metier: {
      type: String,
      default: 'Sans métier'
    },
    equippedTitle: {
      type: String,
      default: ''
    },
    titles: {
      type: [String],
      default: []
    },
    rpMessages: {
      type: Number,
      default: 0,
      min: 0
    },
    rpLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 50
    },
    wallet: {
      type: Number,
      default: 0,
      min: 0
    },
    inventory: {
      type: [inventoryItemSchema],
      default: []
    },
    souillure: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

profileSchema.index({ guildId: 1, userId: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Profile', profileSchema);