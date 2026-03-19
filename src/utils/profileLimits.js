const { PermissionFlagsBits } = require('discord.js');

const MJ_ROLE_IDS = [
  '1483120881290182802',
  '1483120881290182801'
];

const DEFAULT_PROFILE_SLOTS = 3;
const STAFF_PROFILE_SLOTS = 10;
const ABSOLUTE_MAX_PROFILE_SLOTS = 10;

function isMj(member) {
  if (!member?.roles?.cache) return false;
  return MJ_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
}

function isAdmin(member) {
  return !!member?.permissions?.has(PermissionFlagsBits.Administrator);
}

function getMaxProfileSlotsForMember(member) {
  if (isAdmin(member) || isMj(member)) {
    return STAFF_PROFILE_SLOTS;
  }

  return DEFAULT_PROFILE_SLOTS;
}

module.exports = {
  MJ_ROLE_IDS,
  DEFAULT_PROFILE_SLOTS,
  STAFF_PROFILE_SLOTS,
  ABSOLUTE_MAX_PROFILE_SLOTS,
  isMj,
  isAdmin,
  getMaxProfileSlotsForMember
};