const Profile = require('../models/Profile');
const UserProfileState = require('../models/UserProfileState');

const ABSOLUTE_MAX_PROFILE_SLOTS = 10;

async function getActiveSlot(guildId, userId) {
  const state = await UserProfileState.findOne({ guildId, userId }).lean();
  return state?.activeSlot || 1;
}

async function setActiveSlot(guildId, userId, slot) {
  return UserProfileState.findOneAndUpdate(
    { guildId, userId },
    {
      guildId,
      userId,
      activeSlot: slot
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

async function getProfileBySlot(guildId, userId, slot) {
  return Profile.findOne({ guildId, userId, slot });
}

async function getActiveProfile(guildId, userId) {
  const activeSlot = await getActiveSlot(guildId, userId);
  return Profile.findOne({ guildId, userId, slot: activeSlot });
}

async function getAllProfiles(guildId, userId) {
  return Profile.find({ guildId, userId }).sort({ slot: 1 }).lean();
}

async function getNextAvailableSlot(guildId, userId, maxSlots = ABSOLUTE_MAX_PROFILE_SLOTS) {
  const profiles = await getAllProfiles(guildId, userId);

  for (let slot = 1; slot <= maxSlots; slot += 1) {
    if (!profiles.find(profile => profile.slot === slot)) {
      return slot;
    }
  }

  return null;
}

async function ensureActiveState(guildId, userId) {
  const state = await UserProfileState.findOneAndUpdate(
    { guildId, userId },
    { guildId, userId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return state;
}

module.exports = {
  ABSOLUTE_MAX_PROFILE_SLOTS,
  getActiveSlot,
  setActiveSlot,
  getProfileBySlot,
  getActiveProfile,
  getAllProfiles,
  getNextAvailableSlot,
  ensureActiveState
};