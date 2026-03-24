const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 1 },

  equipable: { type: Boolean, default: false },
  equipmentSlot: {
    type: String,
    enum: [
      '',
      'tete',
      'torse',
      'jambes',
      'pieds',
      'mainDroite',
      'mainGauche',
      'accessoire1',
      'accessoire2'
    ],
    default: ''
  },

  icon: { type: String, default: '' } // nom de fichier optionnel dans src/assets/inventory/items/
});

const titleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common'
    }
  },
  { _id: false }
);

const relationSchema = new mongoose.Schema(
  {
    targetUserId: { type: String, required: true },
    targetSlot: { type: Number, required: true, min: 1, max: 10 },
    targetProfileNameSnapshot: { type: String, default: '' },
    type: {
      type: String,
      enum: ['allie', 'rival', 'famille', 'mentor', 'disciple', 'amour', 'haine', 'neutre', 'autre'],
      default: 'autre'
    },
    description: { type: String, default: '', maxlength: 300 },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const equippedSlotSchema = new mongoose.Schema(
  {
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
    itemNameSnapshot: { type: String, default: '' },
    icon: { type: String, default: '' }
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    slot: { type: Number, required: true, min: 1, max: 10 },

    nomPrenom: { type: String, default: '' },
    ageGenre: { type: String, default: '' },
    pouvoir: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    metier: { type: String, default: 'Sans métier' },

    equippedTitle: { type: String, default: '' },
    titles: { type: [titleSchema], default: [] },

    rpMessages: { type: Number, default: 0, min: 0 },
    rpLevel: { type: Number, default: 1, min: 1, max: 50 },

    wallet: { type: Number, default: 0, min: 0 },
    inventory: { type: [inventoryItemSchema], default: [] },

    equippedItems: {
      tete: { type: equippedSlotSchema, default: () => ({}) },
      torse: { type: equippedSlotSchema, default: () => ({}) },
      jambes: { type: equippedSlotSchema, default: () => ({}) },
      pieds: { type: equippedSlotSchema, default: () => ({}) },
      mainDroite: { type: equippedSlotSchema, default: () => ({}) },
      mainGauche: { type: equippedSlotSchema, default: () => ({}) },
      accessoire1: { type: equippedSlotSchema, default: () => ({}) },
      accessoire2: { type: equippedSlotSchema, default: () => ({}) }
    },

    souillure: { type: Number, default: 0, min: 0, max: 100 },

    positiveReputation: { type: Number, default: 0, min: 0 },
    negativeReputation: { type: Number, default: 0, min: 0 },

    relations: {
      type: [relationSchema],
      default: []
    }
  },
  { timestamps: true }
);

profileSchema.index({ guildId: 1, userId: 1, slot: 1 }, { unique: true });

module.exports = mongoose.models.Profile || mongoose.model('Profile', profileSchema);