const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const { formatValue, getLabel, getModeLabel } = require('./classementUtils');

const WIDTH = 1200;
const HEIGHT = 900;

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCircleImage(ctx, image, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
}

function drawAvatarFallback(ctx, x, y, size, label = '?') {
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, '#4b5563');
  gradient.addColorStop(1, '#1f2937');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f9fafb';
  ctx.font = `bold ${Math.floor(size * 0.34)}px Sans`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + size / 2, y + size / 2 + 2);
}

async function tryLoadAvatar(user) {
  if (!user) return null;

  try {
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
    return await loadImage(avatarUrl);
  } catch {
    return null;
  }
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, '#0b0d12');
  gradient.addColorStop(0.5, '#141923');
  gradient.addColorStop(1, '#090b10');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const radial = ctx.createRadialGradient(WIDTH / 2, 120, 50, WIDTH / 2, HEIGHT / 2, 850);
  radial.addColorStop(0, 'rgba(255,255,255,0.04)');
  radial.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = 'rgba(212, 179, 102, 0.08)';
  ctx.lineWidth = 1;

  for (let y = 36; y < HEIGHT; y += 48) {
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(WIDTH - 50, y);
    ctx.stroke();
  }
}

function drawFrame(ctx) {
  drawRoundedRect(ctx, 20, 20, WIDTH - 40, HEIGHT - 40, 26);
  ctx.fillStyle = 'rgba(15, 18, 24, 0.35)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(201, 164, 84, 0.78)';
  ctx.stroke();

  drawRoundedRect(ctx, 34, 34, WIDTH - 68, HEIGHT - 68, 18);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 225, 148, 0.12)';
  ctx.stroke();
}

function drawHeader(ctx, title, subtitle) {
  const titleGradient = ctx.createLinearGradient(70, 0, 520, 0);
  titleGradient.addColorStop(0, '#f1d38a');
  titleGradient.addColorStop(1, '#a67d34');

  ctx.fillStyle = titleGradient;
  ctx.font = 'bold 40px Serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, 70, 86);

  ctx.fillStyle = 'rgba(237, 227, 204, 0.85)';
  ctx.font = '20px Sans';
  ctx.fillText(subtitle, 72, 120);

  ctx.strokeStyle = 'rgba(214, 177, 91, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 140);
  ctx.lineTo(470, 140);
  ctx.stroke();
}

function drawPodiumBase(ctx) {
  const centerX = WIDTH / 2;
  const baseY = 395;

  const blocks = [
    { x: centerX - 250, y: baseY + 55, w: 170, h: 120, color: '#5f6670' }, // 2
    { x: centerX - 85, y: baseY, w: 170, h: 175, color: '#d4af37' },        // 1
    { x: centerX + 80, y: baseY + 80, w: 170, h: 95, color: '#8d6f63' }     // 3
  ];

  for (const block of blocks) {
    drawRoundedRect(ctx, block.x, block.y, block.w, block.h, 20);
    ctx.fillStyle = block.color;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
  }
}

async function drawPodiumEntry(ctx, entry, user, rank, x, y, accentColor, type) {
  const avatar = await tryLoadAvatar(user);
  const avatarSize = 104;

  ctx.save();
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fill();
  ctx.restore();

  if (avatar) {
    drawCircleImage(ctx, avatar, x, y, avatarSize);
  } else {
    drawAvatarFallback(ctx, x, y, avatarSize, String(rank));
  }

  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 26px Serif';
  ctx.textAlign = 'center';
  ctx.fillText(`#${rank}`, x + avatarSize / 2, y - 18);

  ctx.fillStyle = '#f3ead5';
  ctx.font = 'bold 18px Sans';
  ctx.fillText(entry.displayName.slice(0, 24), x + avatarSize / 2, y + avatarSize + 28);

  ctx.fillStyle = 'rgba(240, 232, 217, 0.9)';
  ctx.font = '16px Sans';
  ctx.fillText(formatValue(type, entry.value), x + avatarSize / 2, y + avatarSize + 54);
}

async function drawList(ctx, entries, usersMap, type) {
  const startY = 560;
  const rowHeight = 54;
  const left = 80;
  const width = WIDTH - 160;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const y = startY + i * rowHeight;
    const user = usersMap.get(entry.userId);
    const avatar = await tryLoadAvatar(user);

    drawRoundedRect(ctx, left, y, width, 42, 14);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    ctx.fill();

    if (avatar) {
      drawCircleImage(ctx, avatar, left + 12, y + 5, 32);
    } else {
      drawAvatarFallback(ctx, left + 12, y + 5, 32, String(entry.rank));
    }

    ctx.fillStyle = '#d9c79d';
    ctx.font = 'bold 16px Sans';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${entry.rank}`, left + 58, y + 21);

    ctx.fillStyle = '#f3ead5';
    ctx.font = '15px Sans';
    ctx.fillText(entry.displayName, left + 110, y + 21);

    ctx.fillStyle = '#f1d38a';
    ctx.font = 'bold 16px Sans';
    ctx.textAlign = 'right';
    ctx.fillText(formatValue(type, entry.value), left + width - 18, y + 21);
  }
}

async function createClassementAttachment({
  guildName,
  type,
  mode,
  page,
  paginatedItems,
  usersMap
}) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx);
  drawFrame(ctx);
  drawHeader(
    ctx,
    `Classement - ${getLabel(type)}`,
    `${guildName} - Mode ${getModeLabel(mode)} - Page ${page}`
  );

  drawPodiumBase(ctx);

  const topThree = paginatedItems.slice(0, 3);

  if (topThree[1]) {
    await drawPodiumEntry(
      ctx,
      topThree[1],
      usersMap.get(topThree[1].userId),
      topThree[1].rank,
      WIDTH / 2 - 215,
      318,
      '#c0c7d1',
      type
    );
  }

  if (topThree[0]) {
    await drawPodiumEntry(
      ctx,
      topThree[0],
      usersMap.get(topThree[0].userId),
      topThree[0].rank,
      WIDTH / 2 - 52,
      250,
      '#e0b84d',
      type
    );
  }

  if (topThree[2]) {
    await drawPodiumEntry(
      ctx,
      topThree[2],
      usersMap.get(topThree[2].userId),
      topThree[2].rank,
      WIDTH / 2 + 110,
      340,
      '#b27d66',
      type
    );
  }

  const listEntries = paginatedItems.slice(3);
  await drawList(ctx, listEntries, usersMap, type);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'classement-podium.png' });
}

module.exports = {
  createClassementAttachment
};