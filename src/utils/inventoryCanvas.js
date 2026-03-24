const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;
const SLOT_SIZE = 88;

const SLOT_LABELS = {
  tete: 'Tête',
  torse: 'Torse',
  jambes: 'Jambes',
  pieds: 'Pieds',
  mainDroite: 'Main D.',
  mainGauche: 'Main G.',
  accessoire1: 'Accessoire 1',
  accessoire2: 'Accessoire 2'
};

const SLOT_POSITIONS = {
  tete: { x: 456, y: 60 },
  torse: { x: 456, y: 180 },
  jambes: { x: 456, y: 300 },
  pieds: { x: 456, y: 420 },

  mainDroite: { x: 160, y: 220 },
  mainGauche: { x: 752, y: 220 },

  accessoire1: { x: 160, y: 420 },
  accessoire2: { x: 752, y: 420 }
};

function getSlotColor(slot) {
  const colors = {
    tete: '#8e44ad',
    torse: '#2980b9',
    jambes: '#16a085',
    pieds: '#27ae60',
    mainDroite: '#d35400',
    mainGauche: '#c0392b',
    accessoire1: '#f1c40f',
    accessoire2: '#f39c12'
  };

  return colors[slot] || '#7f8c8d';
}

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

function shorten(text, max = 16) {
  if (!text) return 'Vide';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function getEquippedName(profile, slot) {
  return profile?.equippedItems?.[slot]?.itemNameSnapshot || '';
}

async function tryLoadItemIcon(iconName) {
  if (!iconName) return null;

  const iconPath = path.join(process.cwd(), 'src', 'assets', 'inventory', 'items', iconName);
  if (!fs.existsSync(iconPath)) return null;

  try {
    return await loadImage(iconPath);
  } catch {
    return null;
  }
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#10131a');
  gradient.addColorStop(1, '#1c2330');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 50; i += 1) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * CANVAS_WIDTH,
      Math.random() * CANVAS_HEIGHT,
      Math.random() * 2 + 1,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function drawSilhouette(ctx) {
  ctx.save();
  ctx.translate(CANVAS_WIDTH / 2, 350);

  ctx.fillStyle = 'rgba(220, 228, 239, 0.10)';
  ctx.strokeStyle = 'rgba(220, 228, 239, 0.35)';
  ctx.lineWidth = 4;

  // tête
  ctx.beginPath();
  ctx.arc(0, -180, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // torse
  drawRoundedRect(ctx, -70, -125, 140, 175, 34);
  ctx.fill();
  ctx.stroke();

  // jambes
  drawRoundedRect(ctx, -58, 55, 46, 150, 20);
  ctx.fill();
  ctx.stroke();

  drawRoundedRect(ctx, 12, 55, 46, 150, 20);
  ctx.fill();
  ctx.stroke();

  // bras
  drawRoundedRect(ctx, -130, -105, 38, 150, 18);
  ctx.fill();
  ctx.stroke();

  drawRoundedRect(ctx, 92, -105, 38, 150, 18);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

async function drawSlot(ctx, slot, equippedData) {
  const pos = SLOT_POSITIONS[slot];
  const color = getSlotColor(slot);

  drawRoundedRect(ctx, pos.x, pos.y, SLOT_SIZE, SLOT_SIZE, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 14px Sans';
  ctx.textAlign = 'center';
  ctx.fillText(SLOT_LABELS[slot], pos.x + SLOT_SIZE / 2, pos.y - 10);

  const itemName = equippedData?.itemNameSnapshot || '';
  const iconName = equippedData?.icon || '';

  if (!itemName) {
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.font = '12px Sans';
    ctx.fillText('Vide', pos.x + SLOT_SIZE / 2, pos.y + SLOT_SIZE / 2 + 4);
    return;
  }

  const itemIcon = await tryLoadItemIcon(iconName);

  if (itemIcon) {
    ctx.drawImage(itemIcon, pos.x + 12, pos.y + 12, 64, 64);
  } else {
    ctx.fillStyle = color;
    drawRoundedRect(ctx, pos.x + 14, pos.y + 14, 60, 38, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Sans';
    ctx.fillText(shorten(itemName, 10), pos.x + SLOT_SIZE / 2, pos.y + 38);
  }

  ctx.fillStyle = '#dfe6e9';
  ctx.font = '11px Sans';
  wrapTextCentered(ctx, shorten(itemName, 18), pos.x + SLOT_SIZE / 2, pos.y + 66, 72, 12);
}

function wrapTextCentered(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);

  lines.slice(0, 2).forEach((currentLine, index) => {
    ctx.fillText(currentLine, centerX, startY + index * lineHeight);
  });
}

function buildEquipmentSummary(profile) {
  const slots = Object.keys(SLOT_LABELS);

  return slots
    .map(slot => {
      const equipped = profile?.equippedItems?.[slot];
      const name = equipped?.itemNameSnapshot || 'Aucun';
      return `• **${SLOT_LABELS[slot]}** : ${name}`;
    })
    .join('\n');
}

async function createInventoryAttachment(profile) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx);
  drawSilhouette(ctx);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Sans';
  ctx.textAlign = 'left';
  ctx.fillText('Équipement', 40, 50);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '16px Sans';
  ctx.fillText(profile.nomPrenom || 'Personnage sans nom', 40, 80);

  for (const slot of Object.keys(SLOT_LABELS)) {
    await drawSlot(ctx, slot, profile?.equippedItems?.[slot] || {});
  }

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  drawRoundedRect(ctx, 40, 530, 920, 130, 18);
  ctx.fill();

  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 18px Sans';
  ctx.fillText('Résumé des slots', 60, 560);

  ctx.font = '14px Sans';
  ctx.textAlign = 'left';

  const summaryLines = buildEquipmentSummary(profile).split('\n');
  summaryLines.forEach((line, index) => {
    const col = index < 4 ? 0 : 1;
    const row = index % 4;
    ctx.fillText(line.replace(/\*\*/g, ''), 60 + col * 430, 590 + row * 24);
  });

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'inventaire-silhouette.png' });
}

module.exports = {
  SLOT_LABELS,
  createInventoryAttachment,
  buildEquipmentSummary
};