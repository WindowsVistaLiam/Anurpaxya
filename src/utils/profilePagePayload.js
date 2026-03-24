const { createInventoryAttachment } = require('./inventoryCanvas');
const { buildProfileEmbed } = require('./profileEmbeds');

async function buildProfilePagePayload(profile, targetUser, guild, page) {
  const embed = buildProfileEmbed(profile, targetUser, guild, page);

  if (page === 3) {
    const attachment = await createInventoryAttachment(profile);

    return {
      embeds: [embed],
      files: [attachment]
    };
  }

  return {
    embeds: [embed],
    files: []
  };
}

module.exports = {
  buildProfilePagePayload
};