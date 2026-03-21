const { EmbedBuilder } = require('discord.js');

const SOUILLURE_STAGES = [
  {
    max: 10,
    label: 'Aucune anomalie perceptible.',
    gifUrl: 'https://i.pinimg.com/originals/c2/6b/06/c26b060e3b1c77f1c8f27d473caa5141.gif'
  },
  {
    max: 20,
    label: 'Altération comportementale.',
    gifUrl: 'https://media.discordapp.net/attachments/1473976944835035289/1484959681704230932/1FjF.gif'
  },
  {
    max: 30,
    label: 'Altération comportementale brutale.',
    gifUrl: 'https://media.discordapp.net/attachments/1473976944835035289/1484969124760125460/30_.gif?ex=69c028c4&is=69bed744&hm=b69f5cf6413f12fd13fdc92db35c24991f6dcfd5e388e8e614a796727a45d774&=&width=675&height=441'
  },
  {
    max: 40,
    label: 'Altération comportementale brutale et trace de striure sur le corps.',
    gifUrl: 'https://media.discordapp.net/attachments/1473976944835035289/1484967602374709378/40_.gif?ex=69c02759&is=69bed5d9&hm=9d3afb4f9729d25beef9dd919c0c41e8c135c07e1c9b69b994a93d5a3f2dbfda&=&width=675&height=368'
  },
  {
    max: 50,
    label: 'Altération comportementale brutale et une partie du corps altérée.',
    gifUrl: 'https://media.discordapp.net/attachments/1473976944835035289/1484938798268682240/Claymore.gif?ex=69c00c86&is=69bebb06&hm=923bcd6930e8959b49259443ad53196e8b4d6da823ba8595cec4068b8ce59c9e&=&width=675&height=338'
  },
  {
    max: 60,
    label: 'Altération comportementale brutale et plusieurs parties du corps altérées.',
    gifUrl: 'https://media.discordapp.net/attachments/1483120882124722214/1484965251945337084/90.gif?ex=69c02529&is=69bed3a9&hm=76081e053f9f001e3584185cbe085b2d400864ec8f714b892487cd05bfaf2dcd&=&width=533&height=300'
  },
  {
    max: 70,
    label: 'Perte de lucidité et de la maîtrise de ses actes, altérations profondes sur le corps.',
    gifUrl: 'https://media.discordapp.net/attachments/1473976944835035289/1484967463673139371/Transfo_gif.gif?ex=69c02738&is=69bed5b8&hm=9e300878a0e5f575406b143592f00b6664244e8548184ea896575a1468de1084&=&width=675&height=350'
  },
  {
    max: 80,
    label: 'Perte totale de lucidité et séquelles sur le corps.',
    gifUrl: 'https://media.discordapp.net/attachments/1473976944835035289/1484969595285671966/ezgif.com-video-to-gif-converter_2.gif?ex=69c02934&is=69bed7b4&hm=998747dd90b1a27435c7d7d317eb8cba449540d0385d79808be220986dfa3e19&=&width=1000&height=563'
  },
  {
    max: 99.99,
    label: 'Phase de non retour amorcée.',
    gifUrl: 'https://media.discordapp.net/attachments/1473976944835035289/1484939493302603807/Made_in_abyss.gif?ex=69c00d2c&is=69bebbac&hm=508171121e777f65109990d70e24a4f9e82004acab6034e3b35d7a8f09c31f84&=&width=623&height=350'
  },
  {
    max: 100,
    label: "La réalité elle-même semble se déformer, ce personnage n'est plus que l'ombre de lui-même.",
    gifUrl: 'https://media.discordapp.net/attachments/1473976944835035289/1484967327933141052/Devil_may_cry_bby.gif?ex=69c02718&is=69bed598&hm=f9326e16a5e3355d24797e083269df1aac86e5cc771d0c31bc42712ca22a98c2&=&width=675&height=350'
  }
];

function getSouillureStageIndex(value = 0) {
  const souillure = Math.max(0, Math.min(100, Number(value) || 0));
  return SOUILLURE_STAGES.findIndex(stage => souillure <= stage.max);
}

function getSouillureStage(value = 0) {
  const index = getSouillureStageIndex(value);
  return SOUILLURE_STAGES[index] || SOUILLURE_STAGES[SOUILLURE_STAGES.length - 1];
}

function buildSouillureStageEmbed({ profile, user, souillure }) {
  const stage = getSouillureStage(souillure);

  return new EmbedBuilder()
    .setColor(0xc0392b)
    .setTitle('🩸 La Souillure évolue')
    .setDescription(
      `**${profile.nomPrenom || user.username}** franchit un nouveau seuil...\n\n` +
      `**État :** ${stage.label}\n` +
      `**Souillure :** ${souillure}%`
    )
    .setThumbnail(profile.imageUrl || user.displayAvatarURL({ dynamic: true }))
    .setImage(stage.gifUrl)
    .setFooter({
      text: `Slot ${profile.slot} • ${user.username}`
    })
    .setTimestamp();
}

module.exports = {
  SOUILLURE_STAGES,
  getSouillureStageIndex,
  getSouillureStage,
  buildSouillureStageEmbed
};