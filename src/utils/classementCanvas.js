const { createCanvas, loadImage, registerFont } = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const path = require('path');

registerFont(
  path.join(__dirname, '../assets/fonts/Cinzel-Regular.ttf'),
  { family: 'Cinzel' }
);

const WIDTH = 1200;
const HEIGHT = 800;

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCircleImage(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

async function loadAvatar(user) {
  try {
    const url = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
    return await loadImage(url);
  } catch {
    return null;
  }
}

function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  g.addColorStop(0, '#0b0d12');
  g.addColorStop(1, '#05070a');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const radial = ctx.createRadialGradient(WIDTH / 2, 120, 60, WIDTH / 2, HEIGHT / 2, 900);
  radial.addColorStop(0, 'rgba(255,255,255,0.03)');
  radial.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawTitle(ctx, text) {
  ctx.fillStyle = '#e0b84d';
  ctx.font = 'bold 42px "Cinzel"';
  ctx.textAlign = 'center';
  ctx.fillText(text, WIDTH / 2, 70);
}

function drawPodium(ctx) {
  const center = WIDTH / 2;

  const blocks = [
    { x: center - 250, y: 350, w: 170, h: 120, color: '#7f8c8d' },
    { x: center - 85, y: 300, w: 170, h: 170, color: '#d4af37' },
    { x: center + 80, y: 380, w: 170, h: 90, color: '#a67c52' }
  ];

  for (const b of blocks) {
    drawRoundedRect(ctx, b.x, b.y, b.w, b.h, 20);
    ctx.fillStyle = b.color;
    ctx.fill();
  }
}

function drawText(ctx, text, x, y, size = 18, align = 'center', color = '#f5f5f5') {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Cinzel"`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

async function drawPodiumEntry(ctx, entry, user, rank, x, y) {
  const avatar = await loadAvatar(user);

  if (avatar) {
    drawCircleImage(ctx, avatar, x, y, 100);
  }

  const name = entry.displayName || `User ${entry.userId}`;
  const value = entry.value;

  // Texte podium : un peu plus bas + en noir
  drawText(ctx, `#${rank}`, x + 50, y + 4, 22, 'center', '#111111');
  drawText(ctx, name.slice(0, 20), x + 50, y + 132, 18, 'center', '#111111');
  drawText(ctx, String(value), x + 50, y + 158, 16, 'center', '#111111');
}

async function drawList(ctx, entries, usersMap) {
  let y = 520;

  for (const entry of entries) {
    const user = usersMap.get(entry.userId);
    const avatar = await loadAvatar(user);

    if (avatar) {
      drawCircleImage(ctx, avatar, 100, y - 15, 40);
    }

    drawText(ctx, `#${entry.rank}`, 180, y + 5, 16, 'left');
    drawText(ctx, entry.displayName.slice(0, 25), 240, y + 5, 16, 'left');
    drawText(ctx, String(entry.value), WIDTH - 120, y + 5, 16, 'right');

    y += 50;
  }
}

async function createClassementAttachment({ paginatedItems, usersMap }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx);
  drawTitle(ctx, 'Classement');
  drawPodium(ctx);

  const top = paginatedItems.slice(0, 3);

  if (top[1]) await drawPodiumEntry(ctx, top[1], usersMap.get(top[1].userId), 2, WIDTH / 2 - 215, 230);
  if (top[0]) await drawPodiumEntry(ctx, top[0], usersMap.get(top[0].userId), 1, WIDTH / 2 - 50, 180);
  if (top[2]) await drawPodiumEntry(ctx, top[2], usersMap.get(top[2].userId), 3, WIDTH / 2 + 110, 260);

  await drawList(ctx, paginatedItems.slice(3), usersMap);

  const buffer = canvas.toBuffer('image/png');

  return new AttachmentBuilder(buffer, {
    name: 'classement-podium.png'
  });
}

module.exports = {
  createClassementAttachment
};