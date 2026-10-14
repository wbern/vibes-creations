const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Pumpajakten, 3D-spel');
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.borderRadius = '12px';
canvas.style.outline = 'none';
canvas.style.touchAction = 'none';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const MAP = [
  '############',
  '#..........#',
  '#..##......#',
  '#..##...#..#',
  '#......#...#',
  '#....#.....#',
  '#.....#....#',
  '#..........#',
  '#.###......#',
  '#.#........#',
  '#.#...##...#',
  '############'
];
const grid = MAP.map(row => [...row].map(c => (c === '#' ? 1 : 0)));
const MAP_H = grid.length;
const MAP_W = grid[0].length;
const FOV_T = Math.tan(Math.PI / 6);
const TARGET_COUNT = 6;

const player = { x: 1.5, y: 1.5, a: 0 };
const keys = { up: false, down: false, left: false, right: false, strafeL: false, strafeR: false };
const KEY_MAP = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', q: 'left', Q: 'left',
  ArrowRight: 'right', e: 'right', E: 'right',
  a: 'strafeL', A: 'strafeL', d: 'strafeR', D: 'strafeR'
};

let zBuf = [];
let targets = [];
let score = 0;
let bossSpawned = false;
let health = 100;
let recoil = 0;
let flashUntil = 0;
let lastShot = 0;
let last = performance.now();

function isWall(x, y) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) return true;
  return grid[my][mx] === 1;
}

function blocked(x, y) {
  const r = 0.2;
  return isWall(x - r, y - r) || isWall(x + r, y - r) || isWall(x - r, y + r) || isWall(x + r, y + r);
}

function randomOpenSpot() {
  for (;;) {
    const x = 1 + Math.random() * (MAP_W - 2);
    const y = 1 + Math.random() * (MAP_H - 2);
    if (!isWall(x, y) && Math.hypot(x - player.x, y - player.y) > 3) return { x, y };
  }
}

function spawnTargets() {
  targets = [];
  for (let i = 0; i < TARGET_COUNT; i++) {
    const s = randomOpenSpot();
    targets.push({ x: s.x, y: s.y, alive: true, respawnAt: 0, id: i });
  }
}

function restart() {
  player.x = 1.5;
  player.y = 1.5;
  player.a = 0;
  score = 0;
  bossSpawned = false;
  health = 100;
  spawnTargets();
}

function hasLineOfSight(x1, y1, x2, y2) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  for (let s = 0.05; s < dist; s += 0.05) {
    const t = s / dist;
    if (isWall(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}

function shoot() {
  const now = performance.now();
  if (now - lastShot < 350) return;
  lastShot = now;
  recoil = 1;
  flashUntil = now + 80;

  let best = null;
  let bestDist = Infinity;
  for (const t of targets) {
    if (!t.alive) continue;
    const dx = t.x - player.x;
    const dy = t.y - player.y;
    const dist = Math.hypot(dx, dy);
    const diff = Math.atan2(dy, dx) - player.a;
    const off = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(off) < 0.15 && dist < bestDist && hasLineOfSight(player.x, player.y, t.x, t.y)) {
      best = t;
      bestDist = dist;
    }
  }
  if (best) {
    if (best.isBoss) {
      best.hp--;
      if (best.hp <= 0) {
        best.alive = false;
        best.respawnAt = Infinity;
        score++;
      }
    } else {
      best.alive = false;
      best.respawnAt = now + 2000;
      score++;
    }
  }
}

function resize() {
  canvas.width = area.clientWidth;
  const top = canvas.getBoundingClientRect().top;
  canvas.height = Math.max(320, Math.round(window.innerHeight - top - 20));
  zBuf = new Array(canvas.width).fill(Infinity);
}

function update(dt, now) {
  const turn = 2.5 * dt;
  const speed = 3 * dt;
  if (keys.left) player.a -= turn;
  if (keys.right) player.a += turn;

  const fx = Math.cos(player.a);
  const fy = Math.sin(player.a);
  let mx = 0;
  let my = 0;
  if (keys.up) { mx += fx; my += fy; }
  if (keys.down) { mx -= fx; my -= fy; }
  if (keys.strafeR) { mx += -fy; my += fx; }
  if (keys.strafeL) { mx += fy; my += -fx; }

  if (health <= 0) return;

  const len = Math.hypot(mx, my);
  if (len > 0) {
    const sx = (mx / len) * speed;
    const sy = (my / len) * speed;
    if (!blocked(player.x + sx, player.y)) player.x += sx;
    if (!blocked(player.x, player.y + sy)) player.y += sy;
  }

  for (const t of targets) {
    if (!t.alive) {
      if (now >= t.respawnAt) {
        const s = randomOpenSpot();
        t.x = s.x;
        t.y = s.y;
        t.alive = true;
      }
      continue;
    }
    const dx = player.x - t.x;
    const dy = player.y - t.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.6) {
      health = Math.max(0, health - (t.isBoss ? 30 : 15) * dt);
    } else if (d < 6 && hasLineOfSight(t.x, t.y, player.x, player.y)) {
      const step = Math.min((t.isBoss ? 0.6 : 0.9) * dt, d);
      const nx = t.x + (dx / d) * step;
      const ny = t.y + (dy / d) * step;
      if (!isWall(nx, t.y)) t.x = nx;
      if (!isWall(t.x, ny)) t.y = ny;
    }
  }
  if (!bossSpawned && score >= 15) {
    bossSpawned = true;
    const s = randomOpenSpot();
    targets.push({ x: s.x, y: s.y, alive: true, respawnAt: Infinity, id: 99, isBoss: true, hp: 5 });
  }
  recoil = Math.max(0, recoil - dt * 5);
}

function drawPumpkin(sx, cy, r, color = '#ff7a1a') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(sx, cy, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1200';
  ctx.beginPath();
  ctx.arc(sx - r * 0.35, cy - r * 0.15, r * 0.15, 0, Math.PI * 2);
  ctx.arc(sx + r * 0.35, cy - r * 0.15, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(sx - r * 0.4, cy + r * 0.25, r * 0.8, r * 0.2);
  ctx.fillStyle = '#3a6b1f';
  ctx.fillRect(sx - r * 0.08, cy - r * 1.0, r * 0.16, r * 0.25);
}

function render(now) {
  const w = canvas.width;
  const h = canvas.height;

  const sky = ctx.createLinearGradient(0, 0, 0, h / 2);
  sky.addColorStop(0, '#120a1f');
  sky.addColorStop(1, '#4a1d5c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h / 2);
  ctx.fillStyle = '#14201a';
  ctx.fillRect(0, h / 2, w, h / 2);

  const dirX = Math.cos(player.a);
  const dirY = Math.sin(player.a);
  const planeX = -dirY * FOV_T;
  const planeY = dirX * FOV_T;

  for (let x = 0; x < w; x += 2) {
    const cameraX = (2 * x) / w - 1;
    const rdx = dirX + planeX * cameraX;
    const rdy = dirY + planeY * cameraX;
    let mapX = Math.floor(player.x);
    let mapY = Math.floor(player.y);
    const ddx = Math.abs(1 / rdx);
    const ddy = Math.abs(1 / rdy);
    let stepX;
    let stepY;
    let sideDistX;
    let sideDistY;
    if (rdx < 0) { stepX = -1; sideDistX = (player.x - mapX) * ddx; }
    else { stepX = 1; sideDistX = (mapX + 1 - player.x) * ddx; }
    if (rdy < 0) { stepY = -1; sideDistY = (player.y - mapY) * ddy; }
    else { stepY = 1; sideDistY = (mapY + 1 - player.y) * ddy; }

    let hit = false;
    let side = 0;
    while (!hit) {
      if (sideDistX < sideDistY) { sideDistX += ddx; mapX += stepX; side = 0; }
      else { sideDistY += ddy; mapY += stepY; side = 1; }
      if (isWall(mapX + 0.5, mapY + 0.5)) hit = true;
    }
    const perp = side === 0 ? sideDistX - ddx : sideDistY - ddy;
    const lineH = Math.min(h * 4, h / perp);
    const top = h / 2 - lineH / 2;
    const shade = Math.max(0.2, 1 - perp / 9);
    const r = (side ? 90 : 130) * shade;
    const g = (side ? 70 : 105) * shade;
    const b = (side ? 110 : 150) * shade;
    ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    ctx.fillRect(x, top, 2, lineH);
    zBuf[x] = perp;
    zBuf[x + 1] = perp;
  }

  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const sorted = targets
    .filter(t => t.alive)
    .map(t => ({ t, d: Math.hypot(t.x - player.x, t.y - player.y) }))
    .sort((a, b) => b.d - a.d);
  for (const { t } of sorted) {
    const sx = t.x - player.x;
    const sy = t.y - player.y;
    const tx = invDet * (dirY * sx - dirX * sy);
    const tz = invDet * (-planeY * sx + planeX * sy);
    if (tz <= 0.2) continue;
    const screenX = Math.floor((w / 2) * (1 + tx / tz));
    if (screenX < 0 || screenX >= w || zBuf[screenX] < tz) continue;
    const size = Math.abs(h / tz) * (t.isBoss ? 1 : 0.5);
    const r = size * 0.35;
    const cy = h / 2 + size * 0.25 + Math.sin(now / 300 + t.id) * size * 0.04;
    drawPumpkin(screenX, cy, r, t.isBoss ? '#7a2bd6' : '#ff7a1a');
  }

  const gunW = Math.min(w * 0.3, 220);
  const gunH = gunW * 0.6;
  const gx = w / 2 - gunW / 2;
  const gy = h - gunH * 0.9 + recoil * gunH * 0.25;
  ctx.fillStyle = '#2b2b33';
  ctx.fillRect(gx + gunW * 0.35, gy, gunW * 0.3, gunH * 0.7);
  ctx.fillStyle = '#55555f';
  ctx.fillRect(gx + gunW * 0.2, gy + gunH * 0.4, gunW * 0.6, gunH * 0.35);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(gx + gunW * 0.4, gy + gunH * 0.7, gunW * 0.2, gunH * 0.5);
  if (now < flashUntil) {
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(w / 2, gy, gunW * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(w / 2 - 1, h / 2 - 8, 2, 16);
  ctx.fillRect(w / 2 - 8, h / 2 - 1, 16, 2);

  ctx.fillStyle = '#f5e6d3';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`Pumpor: ${score}`, 12, 24);
  ctx.fillStyle = '#3a0a0a';
  ctx.fillRect(12, 34, 200, 14);
  ctx.fillStyle = '#ff3b3b';
  ctx.fillRect(12, 34, 200 * (health / 100), 14);
  ctx.fillStyle = '#f5e6d3';
  if (health <= 0) {
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pumporna vann! Tryck R', w / 2, h / 2);
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px sans-serif';
  }
  ctx.fillText('Piltar/WASD: gå • Mellanslag: skjut • R: börja om', 12, h - 12);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt, now);
  render(now);
  requestAnimationFrame(frame);
}

canvas.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (!e.repeat) shoot();
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    restart();
    return;
  }
  const k = KEY_MAP[e.key];
  if (k) {
    keys[k] = true;
    e.preventDefault();
  }
});
canvas.addEventListener('keyup', e => {
  const k = KEY_MAP[e.key];
  if (k) keys[k] = false;
});
canvas.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
});
canvas.addEventListener('pointerdown', () => {
  canvas.focus();
  shoot();
});

const pad = document.createElement('div');
pad.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:10px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation';
const padButtons = [['◀', 'left'], ['▲', 'up'], ['▼', 'down'], ['▶', 'right'], ['A', 'strafeL'], ['D', 'strafeR'], ['🔥', 'fire']];
for (const [label, action] of padButtons) {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = 'min-width:56px;min-height:56px;font-size:22px;border:none;border-radius:12px;background:#ff7a1a;color:#2a1200;touch-action:manipulation;user-select:none;-webkit-touch-callout:none';
  if (action === 'fire') {
    b.addEventListener('pointerdown', e => { e.preventDefault(); shoot(); });
  } else {
    b.addEventListener('pointerdown', e => { e.preventDefault(); keys[action] = true; });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
      b.addEventListener(ev, () => { keys[action] = false; });
    }
  }
  pad.appendChild(b);
}
area.appendChild(pad);

window.addEventListener('resize', resize);
resize();
spawnTargets();
requestAnimationFrame(frame);
