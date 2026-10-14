const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.touchAction = 'none';
canvas.style.outline = 'none';
canvas.style.borderRadius = '12px';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

let W = 0;
let H = 0;
const keys = { up: false, down: false, left: false, right: false };
const SPEED = 260;
const player = { x: 0, y: 0, r: 22 };
let pumpkins = [];
let score = 0;
let gameOver = false;
const ghost = { x: 40, y: 40, r: 22, step: 0 };
const GHOST_SPEED = 90;
const WALLS = [
  [0.22, 0.1, 0.03, 0.5],
  [0.22, 0.1, 0.2, 0.03],
  [0.62, 0.4, 0.03, 0.5],
  [0.45, 0.75, 0.25, 0.03]
];

const built = new Set();
const CELL = 40;

function wallRects() {
  const rects = WALLS.map(([x, y, w, h]) => ({ x: x * W, y: y * H, w: w * W, h: h * H }));
  for (const key of built) {
    const [c, r] = key.split(',').map(Number);
    rects.push({ x: c * CELL, y: r * CELL, w: CELL, h: CELL });
  }
  return rects;
}

function toggleBlock(e) {
  const rect = canvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / CELL);
  const r = Math.floor((e.clientY - rect.top) / CELL);
  const key = c + ',' + r;
  if (built.has(key)) {
    built.delete(key);
    return;
  }
  built.add(key);
  const cell = { x: c * CELL, y: r * CELL, w: CELL, h: CELL };
  const blocked =
    circleHitsRect(player.x, player.y, player.r + 2, cell) ||
    circleHitsRect(ghost.x, ghost.y, ghost.r + 2, cell) ||
    pumpkins.some((p) => circleHitsRect(p.x, p.y, 20, cell));
  if (blocked) built.delete(key);
}

function circleHitsRect(x, y, r, w) {
  const cx = Math.max(w.x, Math.min(x, w.x + w.w));
  const cy = Math.max(w.y, Math.min(y, w.y + w.h));
  return Math.hypot(x - cx, y - cy) < r;
}

function hitsWall(x, y, r) {
  return wallRects().some((w) => circleHitsRect(x, y, r, w));
}

function moveObj(obj, vx, vy, r) {
  const nx = Math.min(Math.max(obj.x + vx, r), W - r);
  if (!hitsWall(nx, obj.y, r)) obj.x = nx;
  const ny = Math.min(Math.max(obj.y + vy, r), H - r);
  if (!hitsWall(obj.x, ny, r)) obj.y = ny;
}

function drawGhost() {
  const r = ghost.r;
  const wave = Math.sin(ghost.step) * 3;
  ctx.fillStyle = 'rgba(226,232,240,0.9)';
  ctx.beginPath();
  ctx.arc(ghost.x, ghost.y - 4, r, Math.PI, 0);
  ctx.lineTo(ghost.x + r, ghost.y + r);
  ctx.lineTo(ghost.x + r / 2, ghost.y + r * 0.6 + wave);
  ctx.lineTo(ghost.x, ghost.y + r);
  ctx.lineTo(ghost.x - r / 2, ghost.y + r * 0.6 - wave);
  ctx.lineTo(ghost.x - r, ghost.y + r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e1b2e';
  ctx.beginPath();
  ctx.arc(ghost.x - r * 0.35, ghost.y - r * 0.3, r * 0.15, 0, Math.PI * 2);
  ctx.arc(ghost.x + r * 0.35, ghost.y - r * 0.3, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function resetGame() {
  score = 0;
  gameOver = false;
  player.x = W / 2;
  player.y = H / 2;
  ghost.x = 40;
  ghost.y = 40;
  built.clear();
  pumpkins = [];
  for (let i = 0; i < 3; i++) {
    const p = {};
    placePumpkin(p);
    pumpkins.push(p);
  }
}

function placePumpkin(p) {
  do {
    p.x = 30 + Math.random() * Math.max(1, W - 60);
    p.y = 30 + Math.random() * Math.max(1, H - 60);
  } while (hitsWall(p.x, p.y, 20));
  p.wobble = Math.random() * Math.PI * 2;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = area.clientWidth || window.innerWidth;
  H = Math.max(320, Math.round(window.innerHeight * 0.6));
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  player.x = Math.min(Math.max(player.x, player.r), W - player.r);
  player.y = Math.min(Math.max(player.y, player.r), H - player.r);
  if (pumpkins.length === 0) resetGame();
}

const keyMap = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right'
};

canvas.addEventListener('keydown', (e) => {
  const k = keyMap[e.code];
  if (gameOver && e.code === 'KeyR') resetGame();
  if (k) {
    e.preventDefault();
    keys[k] = true;
  }
});
canvas.addEventListener('keyup', (e) => {
  const k = keyMap[e.code];
  if (k) keys[k] = false;
});
canvas.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
});
canvas.addEventListener('pointerdown', (e) => {
  canvas.focus();
  if (gameOver) {
    resetGame();
    return;
  }
  toggleBlock(e);
});

const controls = document.createElement('div');
controls.style.cssText =
  'display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(2,64px);gap:8px;margin-top:12px;justify-content:center;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none;';
const buttons = [
  { k: 'up', label: '▲', col: 2, row: 1 },
  { k: 'left', label: '◀', col: 1, row: 2 },
  { k: 'down', label: '▼', col: 2, row: 2 },
  { k: 'right', label: '▶', col: 3, row: 2 }
];
for (const b of buttons) {
  const btn = document.createElement('button');
  btn.textContent = b.label;
  btn.style.cssText =
    `grid-column:${b.col};grid-row:${b.row};font-size:1.6rem;border:none;border-radius:14px;background:#7c2d12;color:#fde68a;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;`;
  const on = (e) => { e.preventDefault(); keys[b.k] = true; };
  const off = (e) => { e.preventDefault(); keys[b.k] = false; };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('pointercancel', off);
  controls.appendChild(btn);
}
area.appendChild(controls);

function drawPlayer() {
  const r = player.r;
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(player.x - r * 0.35, player.y - r * 0.15, r * 0.18, 0, Math.PI * 2);
  ctx.arc(player.x + r * 0.35, player.y - r * 0.15, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e1b2e';
  ctx.beginPath();
  ctx.moveTo(player.x - r * 1.1, player.y - r * 0.55);
  ctx.lineTo(player.x, player.y - r * 2.4);
  ctx.lineTo(player.x + r * 1.1, player.y - r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(player.x - r * 1.5, player.y - r * 0.6, r * 3, r * 0.25);
}

function drawPumpkin(p, now) {
  const bob = Math.sin(now / 300 + p.wobble) * 3;
  const r = 16;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + bob, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(p.x - 2, p.y + bob - r * 0.95, 4, 6);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (dx && dy) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  if (!gameOver) {
    moveObj(player, dx * SPEED * dt, dy * SPEED * dt, player.r);

    const gx = player.x - ghost.x;
    const gy = player.y - ghost.y;
    const gd = Math.hypot(gx, gy) || 1;
    moveObj(ghost, (gx / gd) * GHOST_SPEED * dt, (gy / gd) * GHOST_SPEED * dt, ghost.r);
    ghost.step += dt * 4;

    for (const p of pumpkins) {
      const d = Math.hypot(p.x - player.x, p.y - player.y);
      if (d < player.r + 16) {
        score += 1;
        placePumpkin(p);
      }
    }

    if (Math.hypot(ghost.x - player.x, ghost.y - player.y) < player.r + ghost.r) {
      gameOver = true;
    }
  }

  ctx.fillStyle = '#1e1b2e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#7c2d12';
  for (const w of wallRects()) ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Pumpor: ' + score, 12, 28);
  for (const p of pumpkins) drawPumpkin(p, now);
  drawPlayer();
  drawGhost();

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Spöket fångade dig!', W / 2, H / 2 - 10);
    ctx.font = '18px sans-serif';
    ctx.fillText('Tryck på skärmen eller R för att börja om', W / 2, H / 2 + 26);
    ctx.textAlign = 'left';
  }

  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame((t) => {
  last = t;
  frame(t);
});
