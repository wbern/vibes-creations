// Spöklabyrinten: gå genom en 3D-labyrint och hitta pumpan. Ett snällt spöke följer efter dig.
const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.style.cssText =
  'display:block;width:100%;touch-action:none;user-select:none;-webkit-user-select:none;' +
  '-webkit-touch-callout:none;border-radius:12px;';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const N = 11;
const GX = N - 1.5;
const GY = N - 1.5;
const FOV = Math.PI / 3;
const KEYS = {
  ArrowUp: 'forward', w: 'forward', ArrowDown: 'back', s: 'back',
  ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
};
const held = { forward: false, back: false, left: false, right: false };

let W, H, grid, px, py, ang, won, lastT, gx, gy, hugT, lanternT;
let zbuf = new Float64Array(0);

function resize() {
  canvas.width = area.clientWidth;
  canvas.height = Math.max(360, Math.round(window.innerHeight * 0.6));
  W = canvas.width;
  H = canvas.height;
  zbuf = new Float64Array(W);
}

function makeMaze() {
  grid = Array.from({ length: N }, () => Array(N).fill(1));
  const stack = [[1, 1]];
  grid[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx > 0 && nx < N - 1 && ny > 0 && ny < N - 1 && grid[ny][nx] === 1;
    });
    if (!dirs.length) { stack.pop(); continue; }
    const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
    grid[y + dy / 2][x + dx / 2] = 0;
    grid[y + dy][x + dx] = 0;
    stack.push([x + dx, y + dy]);
  }
}

function reset() {
  makeMaze();
  px = 1.5;
  py = 1.5;
  ang = 0;
  won = false;
  gx = N - 1.5;
  gy = 1.5;
  hugT = 0;
  lanternT = 0;
}

// Tänder pumpalyktan: spöket går tillbaka till sin plats en stund.
function light() {
  if (won) { reset(); return; }
  lanternT = 4;
}

function wall(x, y) {
  return x < 0 || y < 0 || x >= N || y >= N || grid[y][x] === 1;
}

function blocked(x, y) {
  for (const ox of [-0.2, 0.2]) {
    for (const oy of [-0.2, 0.2]) {
      if (wall(Math.floor(x + ox), Math.floor(y + oy))) return true;
    }
  }
  return false;
}

// Första steget mot målcellen, med breddenförsta sökning i labyrinten.
function nextStep(sx, sy, tx, ty) {
  const prev = Array.from({ length: N }, () => Array(N).fill(null));
  prev[sy][sx] = true;
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (wall(nx, ny) || prev[ny][nx]) continue;
      prev[ny][nx] = [x, y];
      queue.push([nx, ny]);
    }
  }
  if (!prev[ty][tx]) return null;
  let cur = [tx, ty];
  while (true) {
    const p = prev[cur[1]][cur[0]];
    if (p[0] === sx && p[1] === sy) return cur;
    cur = p;
  }
}

function update(dt) {
  if (won) return;
  const turn = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  ang += turn * 2.2 * dt;
  const step = ((held.forward ? 1 : 0) - (held.back ? 1 : 0)) * 2.2 * dt;
  const dx = Math.cos(ang) * step;
  const dy = Math.sin(ang) * step;
  if (!blocked(px + dx, py)) px += dx;
  if (!blocked(px, py + dy)) py += dy;

  if (hugT > 0) hugT -= dt;
  if (lanternT > 0) lanternT -= dt;
  const gcx = Math.floor(gx), gcy = Math.floor(gy);
  const fleeing = lanternT > 0;
  const goalX = fleeing ? N - 2 : Math.floor(px);
  const goalY = fleeing ? 1 : Math.floor(py);
  let tx = goalX + 0.5, ty = goalY + 0.5;
  if (gcx !== goalX || gcy !== goalY) {
    const s = nextStep(gcx, gcy, goalX, goalY);
    if (s) { tx = s[0] + 0.5; ty = s[1] + 0.5; }
  }
  const ex = tx - gx, ey = ty - gy;
  const ed = Math.hypot(ex, ey);
  if (ed > 0) {
    const mv = Math.min(1.2 * dt, ed);
    gx += (ex / ed) * mv;
    gy += (ey / ed) * mv;
  }
  if (!fleeing && Math.hypot(px - gx, py - gy) < 0.5) {
    gx = N - 1.5;
    gy = 1.5;
    hugT = 2;
  }

  if (Math.hypot(px - GX, py - GY) < 0.5) won = true;
}

// Gör en världspunkt till skärmkoordinater. Returnerar null om den inte syns.
function project(wx, wy) {
  const dx = wx - px;
  const dy = wy - py;
  let a = Math.atan2(dy, dx) - ang;
  a = Math.atan2(Math.sin(a), Math.cos(a));
  if (Math.abs(a) >= FOV / 2 + 0.1) return null;
  const depth = Math.hypot(dx, dy) * Math.cos(a);
  if (depth <= 0.2) return null;
  const sx = W / 2 + (Math.tan(a) / Math.tan(FOV / 2)) * (W / 2);
  const col = Math.max(0, Math.min(W - 1, Math.round(sx)));
  if (zbuf[col] <= depth) return null;
  return { sx, depth, size: (H * 0.5) / depth };
}

function draw() {
  ctx.fillStyle = '#1e1b2e';
  ctx.fillRect(0, 0, W, H / 2);
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, H / 2, W, H / 2);

  for (let x = 0; x < W; x++) {
    const rayA = ang - FOV / 2 + FOV * (x / W);
    const rdx = Math.cos(rayA);
    const rdy = Math.sin(rayA);
    let mx = Math.floor(px);
    let my = Math.floor(py);
    const ddx = Math.abs(1 / rdx);
    const ddy = Math.abs(1 / rdy);
    let stepX, stepY, sdx, sdy;
    if (rdx < 0) { stepX = -1; sdx = (px - mx) * ddx; } else { stepX = 1; sdx = (mx + 1 - px) * ddx; }
    if (rdy < 0) { stepY = -1; sdy = (py - my) * ddy; } else { stepY = 1; sdy = (my + 1 - py) * ddy; }
    let side = 0;
    for (let i = 0; i < 64 && !wall(mx, my); i++) {
      if (sdx < sdy) { sdx += ddx; mx += stepX; side = 0; }
      else { sdy += ddy; my += stepY; side = 1; }
    }
    const raw = side === 0 ? sdx - ddx : sdy - ddy;
    const dist = Math.max(0.05, raw * Math.cos(rayA - ang));
    zbuf[x] = dist;

    const lineH = Math.min(H * 2, (H * 0.7) / dist);
    const top = H / 2 - lineH / 2;
    const b = Math.max(0.2, 1 - dist / 7) * (side ? 0.7 : 1);
    ctx.fillStyle = 'rgb(' + (96 * b | 0) + ',' + (60 * b | 0) + ',' + (130 * b | 0) + ')';
    ctx.fillRect(x, top, 1, lineH);
  }

  const pumpkin = project(GX, GY);
  if (pumpkin) {
    const { sx, size } = pumpkin;
    const cy = H / 2 + size * 0.1;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(sx, cy, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(sx - size * 0.04, cy - size * 0.45, size * 0.08, size * 0.15);
    ctx.fillStyle = '#1e1b2e';
    ctx.beginPath();
    ctx.arc(sx - size * 0.12, cy - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.arc(sx + size * 0.12, cy - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  const ghost = project(gx, gy);
  if (ghost) {
    const { sx, size } = ghost;
    const top = H / 2 - size * 0.2;
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.arc(sx, top + size * 0.3, size * 0.3, Math.PI, 0);
    ctx.lineTo(sx + size * 0.3, top + size * 0.55);
    ctx.lineTo(sx - size * 0.3, top + size * 0.55);
    ctx.fill();
    ctx.fillStyle = '#1e1b2e';
    ctx.beginPath();
    ctx.arc(sx - size * 0.1, top + size * 0.25, size * 0.04, 0, Math.PI * 2);
    ctx.arc(sx + size * 0.1, top + size * 0.25, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'left';
  ctx.fillText('Hitta pumpan!', 12, 28);
  if (hugT > 0) {
    ctx.textAlign = 'center';
    ctx.fillText('Spöket kramade dig!', W / 2, 28);
  }

  if (won) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Du hittade pumpan!', W / 2, H / 2 - 10);
    ctx.font = '18px sans-serif';
    ctx.fillText('Tryck på skärmen eller en pil för att spela igen', W / 2, H / 2 + 26);
  }
}

function loop(t) {
  const dt = lastT === undefined ? 0 : Math.min((t - lastT) / 1000, 0.033);
  lastT = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener('pointerdown', () => { if (won) reset(); });

// Fyra knappar för pekskärm: vrid vänster, fram, bak, vrid höger. Håll inne för att röra dig.
const controls = document.createElement('div');
controls.style.cssText =
  'display:flex;gap:10px;padding:12px 0;user-select:none;-webkit-user-select:none;' +
  '-webkit-touch-callout:none;touch-action:manipulation;';
area.appendChild(controls);
for (const [label, key] of [['←', 'left'], ['↑', 'forward'], ['↓', 'back'], ['→', 'right'], ['🎃', 'light']]) {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText =
    'flex:1;min-height:44px;font-size:2rem;padding:18px 0;border:0;border-radius:12px;' +
    'background:#fde047;color:#1e1b2e;touch-action:manipulation;' +
    'user-select:none;-webkit-user-select:none;';
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (key === 'light') { light(); return; }
    if (won) { reset(); return; }
    held[key] = true;
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    b.addEventListener(type, () => { if (key !== 'light') held[key] = false; });
  }
  controls.appendChild(b);
}

window.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName))) return;
  if (e.key === ' ') {
    e.preventDefault();
    if (!e.repeat) light();
    return;
  }
  const key = KEYS[e.key.toLowerCase()];
  if (!key) return;
  e.preventDefault();
  if (won) { if (!e.repeat) reset(); return; }
  held[key] = true;
});

window.addEventListener('keyup', (e) => {
  const key = KEYS[e.key.toLowerCase()];
  if (key) held[key] = false;
});

window.addEventListener('blur', () => {
  for (const k in held) held[k] = false;
});

window.addEventListener('resize', resize);

resize();
reset();
requestAnimationFrame(loop);
