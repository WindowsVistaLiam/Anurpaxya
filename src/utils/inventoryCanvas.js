const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

const CANVAS_WIDTH = 1100;
const CANVAS_HEIGHT = 760;
const SLOT_SIZE = 108;

const SLOT_LABELS = {
  tete: 'Tête',
  torse: 'Torse',
  jambes: 'Jambes',
  pieds: 'Pieds',
  mainDroite: 'Main droite',
  mainGauche: 'Main gauche',
  accessoire1: 'Accessoire I',
  accessoire2: 'Accessoire II'
};

const SLOT_POSITIONS = {
  tete: { x: 496, y: 72 },
  torse: { x: 496, y: 208 },
  jambes: { x: 496, y: 344 },
  pieds: { x: 496, y: 480 },

  mainDroite: { x: 160, y: 230 },
  mainGauche: { x: 832, y: 230 },

  accessoire1: { x: 160, y: 455 },
  accessoire2: { x: 832, y: 455 }
};

const EQUIPMENT_SLOTS = Object.keys(SLOT_LABELS);

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

function drawDiamond(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
}

function shorten(text, max = 18) {
  if (!text) return 'Vide';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function getSlotAccent(slot) {
  const accents = {
    tete: '#8b6bd6',
    torse: '#6aa9ff',
    jambes: '#54c3a7',
    pieds: '#6ccf79',
    mainDroite: '#d98a43',
    mainGauche: '#cf5e5e',
    accessoire1: '#c8a85a',
    accessoire2: '#b9923f'
  };

  return accents[slot] || '#8b8f98';
}

function getSlotGlow(slot) {
  const accents = {
    tete: 'rgba(139,107,214,0.22)',
    torse: 'rgba(106,169,255,0.22)',
    jambes: 'rgba(84,195,167,0.22)',
    pieds: 'rgba(108,207,121,0.22)',
    mainDroite: 'rgba(217,138,67,0.22)',
    mainGauche: 'rgba(207,94,94,0.22)',
    accessoire1: 'rgba(200,168,90,0.22)',
    accessoire2: 'rgba(185,146,63,0.22)'
  };

  return accents[slot] || 'rgba(255,255,255,0.15)';
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

function wrapTextCentered(ctx, text, centerX, startY, maxWidth, lineHeight, maxLines = 2) {
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

  lines.slice(0, maxLines).forEach((currentLine, index) => {
    ctx.fillText(currentLine, centerX, startY + index * lineHeight);
  });
}

function drawBackground(ctx) {
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, '#090b10');
  bg.addColorStop(0.5, '#11151c');
  bg.addColorStop(1, '#07090d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const vignette = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    120,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    680
  );
  vignette.addColorStop(0, 'rgba(255,255,255,0.02)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = 'rgba(212, 179, 102, 0.10)';
  ctx.lineWidth = 1;

  for (let y = 44; y < CANVAS_HEIGHT; y += 52) {
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(CANVAS_WIDTH - 70, y);
    ctx.stroke();
  }
}

function drawOuterFrame(ctx) {
  drawRoundedRect(ctx, 24, 24, CANVAS_WIDTH - 48, CANVAS_HEIGHT - 48, 28);
  ctx.fillStyle = 'rgba(18, 20, 26, 0.48)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(197, 161, 86, 0.75)';
  ctx.stroke();

  drawRoundedRect(ctx, 38, 38, CANVAS_WIDTH - 76, CANVAS_HEIGHT - 76, 22);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 225, 148, 0.16)';
  ctx.stroke();

  const corners = [
    [52, 52],
    [CANVAS_WIDTH - 52, 52],
    [52, CANVAS_HEIGHT - 52],
    [CANVAS_WIDTH - 52, CANVAS_HEIGHT - 52]
  ];

  for (const [x, y] of corners) {
    ctx.fillStyle = 'rgba(198, 162, 86, 0.9)';
    drawDiamond(ctx, x, y, 8);
    ctx.fill();
  }
}

function drawTitleBlock(ctx, profile) {
  const titleGradient = ctx.createLinearGradient(70, 0, 420, 0);
  titleGradient.addColorStop(0, '#e2c27b');
  titleGradient.addColorStop(1, '#a67d34');

  ctx.fillStyle = titleGradient;
  ctx.font = 'bold 36px Serif';
  ctx.textAlign = 'left';
  ctx.fillText('Arsenal du personnage', 70, 78);

  ctx.fillStyle = 'rgba(239, 230, 210, 0.85)';
  ctx.font = '20px Serif';
  ctx.fillText(profile.nomPrenom || 'Personnage sans nom', 72, 110);

  ctx.strokeStyle = 'rgba(214, 177, 91, 0.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 128);
  ctx.lineTo(380, 128);
  ctx.stroke();
}

function drawCenterAura(ctx) {
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    360,
    40,
    CANVAS_WIDTH / 2,
    360,
    250
  );
  gradient.addColorStop(0, 'rgba(218, 189, 120, 0.15)');
  gradient.addColorStop(0.35, 'rgba(137, 107, 214, 0.07)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH / 2, 360, 250, 0, Math.PI * 2);
  ctx.fill();
}

function drawHumanSilhouette(ctx) {
  ctx.save();
  ctx.translate(CANVAS_WIDTH / 2, 360);

  const bodyGradient = ctx.createLinearGradient(0, -250, 0, 260);
  bodyGradient.addColorStop(0, 'rgba(230, 226, 214, 0.14)');
  bodyGradient.addColorStop(0.45, 'rgba(205, 195, 178, 0.10)');
  bodyGradient.addColorStop(1, 'rgba(170, 165, 155, 0.06)');

  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = 'rgba(223, 189, 113, 0.20)';
  ctx.lineWidth = 2;

  // tête
  ctx.beginPath();
  ctx.ellipse(0, -198, 42, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // cou
  drawRoundedRect(ctx, -14, -155, 28, 24, 8);
  ctx.fill();
  ctx.stroke();

  // épaules + torse
  ctx.beginPath();
  ctx.moveTo(-82, -122);
  ctx.quadraticCurveTo(-112, -104, -108, -66);
  ctx.quadraticCurveTo(-102, 8, -70, 78);
  ctx.quadraticCurveTo(-48, 124, -28, 152);
  ctx.quadraticCurveTo(-14, 170, 0, 178);
  ctx.quadraticCurveTo(14, 170, 28, 152);
  ctx.quadraticCurveTo(48, 124, 70, 78);
  ctx.quadraticCurveTo(102, 8, 108, -66);
  ctx.quadraticCurveTo(112, -104, 82, -122);
  ctx.quadraticCurveTo(44, -144, 0, -136);
  ctx.quadraticCurveTo(-44, -144, -82, -122);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // bras gauche
  ctx.beginPath();
  ctx.moveTo(-86, -106);
  ctx.quadraticCurveTo(-132, -78, -146, -18);
  ctx.quadraticCurveTo(-154, 24, -144, 82);
  ctx.quadraticCurveTo(-136, 124, -118, 152);
  ctx.quadraticCurveTo(-104, 174, -90, 170);
  ctx.quadraticCurveTo(-78, 164, -80, 142);
  ctx.quadraticCurveTo(-86, 108, -92, 72);
  ctx.quadraticCurveTo(-98, 26, -92, -8);
  ctx.quadraticCurveTo(-86, -46, -62, -88);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // bras droit
  ctx.beginPath();
  ctx.moveTo(86, -106);
  ctx.quadraticCurveTo(132, -78, 146, -18);
  ctx.quadraticCurveTo(154, 24, 144, 82);
  ctx.quadraticCurveTo(136, 124, 118, 152);
  ctx.quadraticCurveTo(104, 174, 90, 170);
  ctx.quadraticCurveTo(78, 164, 80, 142);
  ctx.quadraticCurveTo(86, 108, 92, 72);
  ctx.quadraticCurveTo(98, 26, 92, -8);
  ctx.quadraticCurveTo(86, -46, 62, -88);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // bassin
  ctx.beginPath();
  ctx.moveTo(-46, 150);
  ctx.quadraticCurveTo(-18, 174, 0, 178);
  ctx.quadraticCurveTo(18, 174, 46, 150);
  ctx.quadraticCurveTo(30, 198, 24, 228);
  ctx.lineTo(-24, 228);
  ctx.quadraticCurveTo(-30, 198, -46, 150);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // jambe gauche
  ctx.beginPath();
  ctx.moveTo(-22, 228);
  ctx.quadraticCurveTo(-48, 300, -54, 382);
  ctx.quadraticCurveTo(-58, 438, -50, 492);
  ctx.quadraticCurveTo(-44, 530, -26, 534);
  ctx.quadraticCurveTo(-8, 534, -8, 508);
  ctx.quadraticCurveTo(-8, 454, -2, 394);
  ctx.quadraticCurveTo(2, 338, 10, 250);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // jambe droite
  ctx.beginPath();
  ctx.moveTo(22, 228);
  ctx.quadraticCurveTo(48, 300, 54, 382);
  ctx.quadraticCurveTo(58, 438, 50, 492);
  ctx.quadraticCurveTo(44, 530, 26, 534);
  ctx.quadraticCurveTo(8, 534, 8, 508);
  ctx.quadraticCurveTo(8, 454, 2, 394);
  ctx.quadraticCurveTo(-2, 338, -10, 250);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // séparation légère centrale
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -132);
  ctx.quadraticCurveTo(-2, 20, 0, 178);
  ctx.stroke();

  ctx.restore();
}

function drawConnector(ctx, fromX, fromY, toX, toY, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);

  const midX = (fromX + toX) / 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.bezierCurveTo(midX, fromY, midX, toY, toX, toY);
  ctx.stroke();

  ctx.restore();
}

function detectItemTheme(itemName = '', slot = '') {
  const name = itemName.toLowerCase();

  if (slot === 'tete' || /casque|chapeau|couronne|capuche|heaume/.test(name)) return 'helmet';
  if (slot === 'torse' || /armure|plastron|cape|robe|manteau|veste/.test(name)) return 'armor';
  if (slot === 'jambes' || /jamb|pantalon|grève|cuiss/.test(name)) return 'legs';
  if (slot === 'pieds' || /botte|chaussure|soulier/.test(name)) return 'boots';
  if (slot === 'mainDroite' || /epee|épée|lame|dague|hache|marteau|baton|bâton|lance|arc/.test(name)) return 'weapon';
  if (slot === 'mainGauche' || /bouclier|livre|grimoire|orbe|lanterne/.test(name)) return 'offhand';
  if (/anneau|ring|bague/.test(name)) return 'ring';
  if (/amulette|collier|pendentif/.test(name)) return 'amulet';

  if (slot === 'accessoire1' || slot === 'accessoire2') return 'trinket';
  return 'generic';
}

function drawIconFrame(ctx, x, y, size, accent) {
  drawRoundedRect(ctx, x, y, size, size, 18);
  ctx.fillStyle = 'rgba(10, 12, 17, 0.74)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(244, 222, 167, 0.22)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 14, 0, Math.PI * 2);
  ctx.stroke();
}

function drawProceduralIcon(ctx, theme, x, y, size, accent) {
  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (theme === 'helmet') {
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 24, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 4);
    ctx.lineTo(cx - 18, cy + 16);
    ctx.lineTo(cx + 18, cy + 16);
    ctx.lineTo(cx + 24, cy - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx, cy + 16);
    ctx.stroke();
  } else if (theme === 'armor') {
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 24);
    ctx.lineTo(cx + 24, cy - 24);
    ctx.lineTo(cx + 18, cy + 24);
    ctx.lineTo(cx, cy + 14);
    ctx.lineTo(cx - 18, cy + 24);
    ctx.closePath();
    ctx.stroke();
  } else if (theme === 'legs') {
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 24);
    ctx.lineTo(cx - 6, cy + 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 16, cy - 24);
    ctx.lineTo(cx + 6, cy + 24);
    ctx.stroke();
  } else if (theme === 'boots') {
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 6);
    ctx.lineTo(cx - 10, cy - 6);
    ctx.lineTo(cx - 2, cy + 20);
    ctx.lineTo(cx - 18, cy + 20);
    ctx.lineTo(cx - 22, cy + 10);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 6);
    ctx.lineTo(cx + 14, cy - 6);
    ctx.lineTo(cx + 22, cy + 20);
    ctx.lineTo(cx + 6, cy + 20);
    ctx.lineTo(cx + 2, cy + 10);
    ctx.closePath();
    ctx.stroke();
  } else if (theme === 'weapon') {
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 18);
    ctx.lineTo(cx + 20, cy - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 4);
    ctx.lineTo(cx + 8, cy + 16);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 12, cy - 28);
    ctx.lineTo(cx + 28, cy - 12);
    ctx.stroke();
  } else if (theme === 'offhand') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 28);
    ctx.lineTo(cx + 24, cy - 10);
    ctx.lineTo(cx + 18, cy + 22);
    ctx.lineTo(cx, cy + 30);
    ctx.lineTo(cx - 18, cy + 22);
    ctx.lineTo(cx - 24, cy - 10);
    ctx.closePath();
    ctx.stroke();
  } else if (theme === 'ring') {
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
  } else if (theme === 'amulet') {
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx, cy + 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 20);
    ctx.quadraticCurveTo(cx, cy - 40, cx + 20, cy - 20);
    ctx.stroke();
  } else if (theme === 'trinket') {
    drawDiamond(ctx, cx, cy, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawDiamond(ctx, cx, cy, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

async function drawSlot(ctx, slot, equippedData) {
  const pos = SLOT_POSITIONS[slot];
  const accent = getSlotAccent(slot);
  const glow = getSlotGlow(slot);

  drawConnector(
    ctx,
    pos.x + SLOT_SIZE / 2,
    pos.y + SLOT_SIZE / 2,
    CANVAS_WIDTH / 2,
    slot === 'tete' ? 180 : slot === 'pieds' ? 565 : 360,
    glow
  );

  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 24;
  drawRoundedRect(ctx, pos.x, pos.y, SLOT_SIZE, SLOT_SIZE, 18);
  ctx.fillStyle = 'rgba(16,18,23,0.92)';
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(235, 209, 149, 0.22)';
  drawRoundedRect(ctx, pos.x, pos.y, SLOT_SIZE, SLOT_SIZE, 18);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = accent;
  drawRoundedRect(ctx, pos.x + 4, pos.y + 4, SLOT_SIZE - 8, SLOT_SIZE - 8, 14);
  ctx.stroke();

  ctx.fillStyle = '#dbcaa3';
  ctx.font = 'bold 15px Serif';
  ctx.textAlign = 'center';
  ctx.fillText(SLOT_LABELS[slot], pos.x + SLOT_SIZE / 2, pos.y - 12);

  const itemName = equippedData?.itemNameSnapshot || '';
  const iconName = equippedData?.icon || '';

  drawIconFrame(ctx, pos.x + 14, pos.y + 12, 80, accent);

  if (!itemName) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '13px Serif';
    ctx.fillText('Emplacement vide', pos.x + SLOT_SIZE / 2, pos.y + 58);

    ctx.fillStyle = 'rgba(220, 210, 188, 0.50)';
    ctx.font = '11px Sans';
    ctx.fillText('—', pos.x + SLOT_SIZE / 2, pos.y + 82);
    return;
  }

  const itemIcon = await tryLoadItemIcon(iconName);

  if (itemIcon) {
    ctx.save();
    drawRoundedRect(ctx, pos.x + 14, pos.y + 12, 80, 80, 16);
    ctx.clip();
    ctx.drawImage(itemIcon, pos.x + 14, pos.y + 12, 80, 80);
    ctx.restore();
  } else {
    const theme = detectItemTheme(itemName, slot);
    drawProceduralIcon(ctx, theme, pos.x + 14, pos.y + 12, 80, accent);
  }

  ctx.fillStyle = '#e9ddc3';
  ctx.font = '12px Sans';
  wrapTextCentered(ctx, shorten(itemName, 20), pos.x + SLOT_SIZE / 2, pos.y + 104, 92, 13, 2);
}

function buildEquipmentSummary(profile) {
  return EQUIPMENT_SLOTS.map(slot => {
    const equipped = profile?.equippedItems?.[slot];
    const name = equipped?.itemNameSnapshot || 'Aucun';
    return `• **${SLOT_LABELS[slot]}** : ${name}`;
  }).join('\n');
}

function drawSummaryPanel(ctx, profile) {
  drawRoundedRect(ctx, 62, 610, CANVAS_WIDTH - 124, 100, 18);
  ctx.fillStyle = 'rgba(12, 14, 20, 0.82)';
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(204, 169, 93, 0.28)';
  ctx.stroke();

  ctx.fillStyle = '#dbcaa3';
  ctx.font = 'bold 18px Serif';
  ctx.textAlign = 'left';
  ctx.fillText('Résumé des emplacements', 84, 640);

  ctx.font = '14px Sans';
  ctx.fillStyle = 'rgba(234, 227, 214, 0.92)';

  const summaryLines = buildEquipmentSummary(profile).split('\n');
  summaryLines.forEach((line, index) => {
    const col = index < 4 ? 0 : 1;
    const row = index % 4;
    ctx.fillText(
      line.replace(/\*\*/g, ''),
      84 + col * 470,
      668 + row * 18
    );
  });
}

async function createInventoryAttachment(profile) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx);
  drawOuterFrame(ctx);
  drawTitleBlock(ctx, profile);
  drawCenterAura(ctx);
  drawHumanSilhouette(ctx);

  for (const slot of EQUIPMENT_SLOTS) {
    await drawSlot(ctx, slot, profile?.equippedItems?.[slot] || {});
  }

  drawSummaryPanel(ctx, profile);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'inventaire-silhouette.png' });
}

module.exports = {
  SLOT_LABELS,
  createInventoryAttachment,
  buildEquipmentSummary
};