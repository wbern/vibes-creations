const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.id = 'stage';
canvas.tabIndex = 0;
canvas.style.touchAction = 'none';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
canvas.setAttribute('aria-label', 'Spöket bygger. Piltangenterna flyttar spöket, mellanslag lägger eller tar bort en kloss. Tryck på en ruta för att bygga där.');
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const CELL = 28;
const GRID_TOP = 56;
const SWATCH_W = 40;
const SWATCH_GAP = 52;
const MATERIALS = [
  { name: 'Tegel', color: '#b45309' },
  { name: 'Trä', color: '#7c4a1e' },
  { name: 'Löv', color: '#f97316' },
  { name: 'Pumpa', color: '#ff8c1a' },
];

let W = 0;
let H = 0;
let cols = 0;
let rows = 0;
let ox = 0;
let oy = 0;
let blocks = new Map();
let ghost = { x: 0, y: 0 };
let selected = 0;
let time = 0;
let lastT = 0;

function key(x, y) {
  return x + ',' + y;
}

function isBuildable(x, y) {
  return x >= 0 && y >= 0 && x < cols && y < rows - 1;
}

function cellX(x) {
  return ox + x * CELL;
}

function cellY(y) {
  return oy + y * CELL;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = area.clientWidth || window.innerWidth;
  H = Math.max(320, Math.round(window.innerHeight * 0.7));
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const availH = H - GRID_TOP;
  cols = Math.floor(W / CELL);
  rows = Math.floor(availH / CELL);
  ox = (W - cols * CELL) / 2;
  oy = GRID_TOP + (availH - rows * CELL) / 2;
  ghost.x = Math.min(ghost.x, cols - 1);
  ghost.y = Math.min(ghost.y, rows - 2);
}

function clearWorld() {
  blocks = new Map();
  ghost = { x: Math.floor(cols / 2), y: Math.max(0, rows - 3) };
}

function moveGhost(dx, dy) {
  const nx = Math.max(0, Math.min(cols - 1, ghost.x + dx));
  const ny = Math.max(0, Math.min(rows - 2, ghost.y + dy));
  ghost = { x: nx, y: ny };
}

function toggleBlock() {
  if (!isBuildable(ghost.x, ghost.y)) return;
  const k = key(ghost.x, ghost.y);
  if (blocks.has(k)) blocks.delete(k);
  else blocks.set(k, selected);
}

function drawBlock(type, x, y) {
  const px = cellX(x);
  const py = cellY(y);
  ctx.fillStyle = MATERIALS[type].color;
  if (type === 2) {
    ctx.beginPath();
    ctx.arc(px + CELL / 2, py + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 3) {
    ctx.beginPath();
    ctx.ellipse(px + CELL / 2, py + CELL / 2 + 2, CELL / 2 - 2, CELL / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(px + CELL / 2 - 2, py + 3, 4, 5);
  } else {
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    if (type === 0) {
      ctx.strokeStyle = 'rgba(60, 20, 0, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 1, py + CELL / 2);
      ctx.lineTo(px + CELL - 1, py + CELL / 2);
      ctx.moveTo(px + CELL / 2, py + 1);
      ctx.lineTo(px + CELL / 2, py + CELL / 2);
      ctx.stroke();
    }
  }
}

function drawGhostPart(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y - 2, r, Math.PI, 0);
  ctx.lineTo(x + r, y + r);
  ctx.lineTo(x + r / 2, y + r - 4);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r / 2, y + r - 4);
  ctx.lineTo(x - r, y + r);
  ctx.closePath();
  ctx.fill();
}

function drawGhost() {
  const bob = Math.sin(time * 3) * 3;
  const x = cellX(ghost.x) + CELL / 2;
  const y = cellY(ghost.y) + CELL / 2 + bob;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  drawGhostPart(x, y, CELL / 2 - 3);
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.arc(x - 4, y - 3, 2, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 3, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPalette() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(0, 0, W, GRID_TOP - 6);
  MATERIALS.forEach((m, i) => {
    const sx = 16 + i * SWATCH_GAP;
    ctx.fillStyle = m.color;
    ctx.fillRect(sx, 10, SWATCH_W, 30);
    if (i === selected) {
      ctx.strokeStyle = '#1a1a22';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx - 2, 8, SWATCH_W + 4, 34);
    }
  });
  ctx.fillStyle = '#1a1a22';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Kloss: ' + MATERIALS[selected].name + '   Klossar: ' + blocks.size, 16 + MATERIALS.length * SWATCH_GAP + 8, 30);
}

function draw() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#7dd3fc');
  sky.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(W * 0.9, GRID_TOP + 30, Math.min(W, H) * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(30, 58, 95, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 0; c <= cols; c++) {
    ctx.moveTo(cellX(c), cellY(0));
    ctx.lineTo(cellX(c), cellY(rows - 1));
  }
  for (let r = 0; r <= rows - 1; r++) {
    ctx.moveTo(cellX(0), cellY(r));
    ctx.lineTo(cellX(cols), cellY(r));
  }
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, cellY(rows - 1), W, H - cellY(rows - 1));
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, cellY(rows - 1), W, 4);

  blocks.forEach((type, k) => {
    const [x, y] = k.split(',').map(Number);
    drawBlock(type, x, y);
  });

  if (isBuildable(ghost.x, ghost.y) && !blocks.has(key(ghost.x, ghost.y))) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = MATERIALS[selected].color;
    ctx.fillRect(cellX(ghost.x) + 1, cellY(ghost.y) + 1, CELL - 2, CELL - 2);
    ctx.globalAlpha = 1;
  }

  drawGhost();

  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(cellX(ghost.x) + 1, cellY(ghost.y) + 1, CELL - 2, CELL - 2);
  ctx.setLineDash([]);

  drawPalette();

  ctx.fillStyle = '#052e16';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Piltar: flytta · Mellanslag: lägg/ta bort · 1-4: välj kloss · R: börja om', W / 2, H - 8);
}

function frame(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
  lastT = t;
  time += dt;
  draw();
  requestAnimationFrame(frame);
}

canvas.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowUp') {
    e.preventDefault();
    moveGhost(0, -1);
  } else if (e.code === 'ArrowDown') {
    e.preventDefault();
    moveGhost(0, 1);
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    moveGhost(-1, 0);
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    moveGhost(1, 0);
  } else if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    toggleBlock();
  } else if (e.key >= '1' && e.key <= '4') {
    selected = Number(e.key) - 1;
  } else if (e.key === 'r' || e.key === 'R') {
    clearWorld();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  canvas.focus();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (y < GRID_TOP) {
    const i = Math.floor((x - 16) / SWATCH_GAP);
    if (i >= 0 && i < MATERIALS.length && (x - 16) - i * SWATCH_GAP < SWATCH_W) {
      selected = i;
    }
    return;
  }
  const cx = Math.floor((x - ox) / CELL);
  const cy = Math.floor((y - oy) / CELL);
  if (isBuildable(cx, cy)) {
    ghost = { x: cx, y: cy };
    toggleBlock();
  }
});

window.addEventListener('resize', resize);

resize();
clearWorld();
requestAnimationFrame((t) => {
  lastT = t;
  requestAnimationFrame(frame);
});
