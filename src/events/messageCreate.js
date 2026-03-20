const Profile = require('../models/Profile');
const {
  CHANNELS,
  GAINS,
  MIN_LENGTH,
  MAX_SOUILLURE
} = require('../config/souillure');
const { getActiveSlot } = require('../services/profileService');
const cooldowns = new Map();

const key = `${message.guild.id}-${message.author.id}`;

const now = Date.now();
const last = cooldowns.get(key) || 0;

if (now - last < 10000) return; // 10 secondes

cooldowns.set(key, now);

function getChannelType(channelId) {
  if (CHANNELS.SAINT.includes(channelId)) return 'SAINT';
  if (CHANNELS.POLLUE.includes(channelId)) return 'POLLUE';
  if (CHANNELS.SOUILLE.includes(channelId)) return 'SOUILLE';
  return null;
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    try {
      if (!message.guild) return;
      if (message.author.bot) return;

      // Vérifier longueur RP
      if (message.content.length < MIN_LENGTH) return;

      const type = getChannelType(message.channel.id);
      if (!type) return;

      const gain = GAINS[type];

      const slot = await getActiveSlot(message.guild.id, message.author.id);

      const profile = await Profile.findOne({
        guildId: message.guild.id,
        userId: message.author.id,
        slot
      });

      if (!profile) return;

      const oldSouillure = profile.souillure || 0;

      let newSouillure = oldSouillure + gain;
      newSouillure = Math.min(newSouillure, MAX_SOUILLURE);

      profile.souillure = Number(newSouillure.toFixed(2));

      await profile.save();

      // Feedback discret (optionnel)
      if (Math.floor(oldSouillure) !== Math.floor(newSouillure)) {
        message.react('🩸').catch(() => {});
      }

    } catch (error) {
      console.error('❌ Erreur souillure message:', error);
    }
  }
};