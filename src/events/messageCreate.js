const { EmbedBuilder } = require('discord.js');
const Profile = require('../models/Profile');
const {
  CHANNELS,
  GAINS,
  MIN_LENGTH,
  MAX_SOUILLURE
} = require('../config/souillure');
const { LEVEL_TITLES } = require('../config/titles');
const { getActiveSlot } = require('../services/profileService');
const {
  getSouillureStageIndex,
  buildSouillureStageEmbed
} = require('../utils/souillureStages');
const { getTitleRarityDisplay, getTitleRarityColor } = require('../utils/titleUtils');

const cooldowns = new Map();

function normalizeIdArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

/**
 * Retourne true si le message provient :
 * - soit directement d'un salon texte configuré
 * - soit d'un thread dont le parent est configuré
 * - soit d'un thread de forum dont le forum parent est configuré
 */
function matchesConfiguredChannel(message, configuredIds) {
  const ids = normalizeIdArray(configuredIds);
  if (ids.length === 0) return false;

  const channelId = String(message.channel.id);
  const parentId = message.channel.parentId ? String(message.channel.parentId) : null;

  if (ids.includes(channelId)) return true;
  if (parentId && ids.includes(parentId)) return true;

  return false;
}

function getChannelType(message) {
  if (matchesConfiguredChannel(message, CHANNELS.SAINT)) return 'SAINT';
  if (matchesConfiguredChannel(message, CHANNELS.POLLUE)) return 'POLLUE';
  if (matchesConfiguredChannel(message, CHANNELS.SOUILLE)) return 'SOUILLE';
  return null;
}

function getAutomaticTitleRarity(level) {
  if (level >= 40) return 'legendary';
  if (level >= 15) return 'epic';
  if (level >= 5) return 'rare';
  return 'common';
}

function buildTitleEmbed({ profile, user, level, title, rarity }) {
  return new EmbedBuilder()
    .setColor(getTitleRarityColor(rarity))
    .setTitle('🏅 Nouveau titre obtenu')
    .setDescription(
      `**${profile.nomPrenom || user.username}** progresse dans son parcours RP.\n\n` +
      `**Niveau RP :** ${level}\n` +
      `**Titre obtenu :** ${getTitleRarityDisplay(title, rarity)}`
    )
    .setThumbnail(profile.imageUrl || user.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: `Slot ${profile.slot} • ${user.username}`
    })
    .setTimestamp();
}

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    try {
      if (!message.guild) return;
      if (!message.author) return;
      if (message.author.bot) return;
      if (!message.content) return;

      if (message.content.length < MIN_LENGTH) return;

      const channelType = getChannelType(message);
      if (!channelType) return;

      const key = `${message.guild.id}-${message.author.id}`;
      const now = Date.now();
      const last = cooldowns.get(key) || 0;

      if (now - last < 10000) return;
      cooldowns.set(key, now);

      const gain = GAINS[channelType];
      const slot = await getActiveSlot(message.guild.id, message.author.id);

      const profile = await Profile.findOne({
        guildId: message.guild.id,
        userId: message.author.id,
        slot
      });

      if (!profile) return;

      // ----- Souillure -----
      const oldSouillure = Number(profile.souillure) || 0;
      const oldSouillureStageIndex = getSouillureStageIndex(oldSouillure);

      let newSouillure = oldSouillure + gain;
      newSouillure = Math.min(newSouillure, MAX_SOUILLURE);
      newSouillure = Number(newSouillure.toFixed(2));

      profile.souillure = newSouillure;

      const newSouillureStageIndex = getSouillureStageIndex(newSouillure);

      // ----- Progression RP / titres -----
      const oldLevel = Number(profile.rpLevel) || 1;

      profile.rpMessages = (Number(profile.rpMessages) || 0) + 1;

      const computedLevel = Math.min(50, Math.floor(profile.rpMessages / 20) + 1);
      profile.rpLevel = computedLevel;

      const newTitles = [];

      for (let level = oldLevel + 1; level <= computedLevel; level += 1) {
        const title = LEVEL_TITLES[level];

        if (
          title &&
          !profile.titles.some(existing => {
            if (typeof existing === 'string') return existing === title;
            return existing.name === title;
          })
        ) {
          const rarity = getAutomaticTitleRarity(level);

          profile.titles.push({
            name: title,
            rarity
          });

          newTitles.push({
            level,
            title,
            rarity
          });
        }
      }

      await profile.save();

      // ----- Embed de palier de souillure -----
      if (newSouillureStageIndex > oldSouillureStageIndex) {
        const souillureEmbed = buildSouillureStageEmbed({
          profile,
          user: message.author,
          souillure: newSouillure
        });

        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [souillureEmbed]
        });
      }

      // ----- Embed(s) de titre(s) -----
      for (const entry of newTitles) {
        const titleEmbed = buildTitleEmbed({
          profile,
          user: message.author,
          level: entry.level,
          title: entry.title,
          rarity: entry.rarity
        });

        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [titleEmbed]
        });
      }
    } catch (error) {
      console.error('❌ Erreur messageCreate :', error);
    }
  }
};