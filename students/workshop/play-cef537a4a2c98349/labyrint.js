const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.className = 'stage';
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Spökslabyrinten');
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const COLS = 15, ROWS = 11;
const DIRS = {
  n: { dx: 0, dy: -1, opp: 's' },
  e: { dx: 1, dy: 0, opp: 'w' },
  s: { dx: 0, dy: 1, opp: 'n' },
  w: { dx: -1, dy: 0, opp: 'e' }
};

let W = 0, H = 0, cell = 0, ox = 0, oy = 0;
let maze = [];
let level = 1, lives = 3, state = 'playing';
let player, goal, enemies = [];
let moveCd = 0, enemyTimer = 0, queued = null, swipeStart = null;
let previousTime;
const held = {};

function cellAt(x, y) {
  return maze[y * COLS + x];
}

function canMove(x, y, d) {
  return !cellAt(x, y).walls[d];
}

function buildMaze() {
  maze = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      maze.push({ x, y, walls: { n: true, e: true, s: true, w: true }, seen: false });
    }
  }
  const stack = [cellAt(0, 0)];
  cellAt(0, 0).seen = true;
  while (stack.length) {
    const c = stack[stack.length - 1];
    const opts = [];
    for (const d of ['n', 'e', 's', 'w']) {
      const nx = c.x + DIRS[d].dx, ny = c.y + DIRS[d].dy;
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !cellAt(nx, ny).seen) opts.push(d);
    }
    if (!opts.length) { stack.pop(); continue; }
    const d = opts[Math.floor(Math.random() * opts.length)];
    const next = cellAt(c.x + DIRS[d].dx, c.y + DIRS[d].dy);
    c.walls[d] = false;
    next.walls[DIRS[d].opp] = false;
    next.seen = true;
    stack.push(next);
  }
}

function manhattan(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function startLevel() {
  buildMaze();
  player = { x: 0, y: 0 };
  goal = { x: COLS - 1, y: ROWS - 1 };
  enemies = [];
  const count = Math.min(2 + level, 8);
  while (enemies.length < count) {
    const ex = Math.floor(Math.random() * COLS);
    const ey = Math.floor(Math.random() * ROWS);
    if (manhattan(ex, ey, 0, 0) >= 6 && !(ex === goal.x && ey === goal.y)) {
      enemies.push({ x: ex, y: ey });
    }
  }
  enemyTimer = 0;
}

function newGame() {
  level = 1;
  lives = 3;
  state = 'playing';
  queued = null;
  startLevel();
}

function checkHit() {
  for (const e of enemies) {
    if (e.x === player.x && e.y === player.y) {
      lives--;
      player = { x: 0, y: 0 };
      if (lives <= 0) state = 'lost';
      return;
    }
  }
}

function tryMove(d) {
  if (!canMove(player.x, player.y, d)) return;
  player.x += DIRS[d].dx;
  player.y += DIRS[d].dy;
  if (player.x === goal.x && player.y === goal.y) {
    level++;
    startLevel();
    return;
  }
  checkHit();
}

function moveEnemies() {
  for (const e of enemies) {
    const opts = [];
    for (const d of ['n', 'e', 's', 'w']) if (canMove(e.x, e.y, d)) opts.push(d);
    if (!opts.length) continue;
    let pick = opts[Math.floor(Math.random() * opts.length)];
    if (Math.random() < 0.7) {
      let best = Infinity;
      for (const d of opts) {
        const dd = manhattan(e.x + DIRS[d].dx, e.y + DIRS[d].dy, player.x, player.y);
        if (dd < best) { best = dd; pick = d; }
      }
    }
    e.x += DIRS[pick].dx;
    e.y += DIRS[pick].dy;
  }
  checkHit();
}

function update(dt) {
  if (state !== 'playing') return;
  moveCd -= dt;
  enemyTimer += dt;

  if (moveCd <= 0) {
    const d = queued || Object.keys(held).find(k => held[k]);
    if (d) {
      queued = null;
      tryMove(d);
      moveCd = 0.14;
    }
  }

  const enemyDelay = Math.max(0.2, 0.5 - level * 0.03);
  if (state === 'playing' && enemyTimer >= enemyDelay) {
    enemyTimer = 0;
    moveEnemies();
  }
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cell = Math.min((W - 24) / COLS, (H - 60) / ROWS);
  ox = (W - COLS * cell) / 2;
  oy = 48;
}

function drawPumpkin(x, y, s) {
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.9, s * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#15803d';
  ctx.fillRect(x - s * 0.12, y - s * 0.95, s * 0.24, s * 0.3);
  ctx.fillStyle = '#111';
  ctx.fillRect(x - s * 0.5, y - s * 0.3, s * 0.25, s * 0.25);
  ctx.fillRect(x + s * 0.25, y - s * 0.3, s * 0.25, s * 0.25);
}

function drawBat(x, y, s) {
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s, y - s * 0.6);
  ctx.lineTo(x - s * 1.2, y + s * 0.4);
  ctx.lineTo(x - s * 0.5, y + s * 0.1);
  ctx.lineTo(x, y + s * 0.4);
  ctx.lineTo(x + s * 0.5, y + s * 0.1);
  ctx.lineTo(x + s * 1.2, y + s * 0.4);
  ctx.lineTo(x + s, y - s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(x - s * 0.3, y, s * 0.12, 0, Math.PI * 2);
  ctx.arc(x + s * 0.3, y, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(x, y, s) {
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y - s * 0.2, s * 0.7, Math.PI, 0);
  ctx.lineTo(x + s * 0.7, y + s * 0.6);
  ctx.lineTo(x + s * 0.35, y + s * 0.35);
  ctx.lineTo(x, y + s * 0.6);
  ctx.lineTo(x - s * 0.35, y + s * 0.35);
  ctx.lineTo(x - s * 0.7, y + s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(x - s * 0.25, y - s * 0.2, s * 0.09, 0, Math.PI * 2);
  ctx.arc(x + s * 0.25, y - s * 0.2, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.fillStyle = '#1e1433';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#2a1b4a';
  ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);

  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = Math.max(3, cell * 0.12);
  ctx.lineCap = 'square';
  ctx.beginPath();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = cellAt(x, y);
      const px = ox + x * cell, py = oy + y * cell;
      if (c.walls.n) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py); }
      if (c.walls.w) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell); }
      if (x === COLS - 1 && c.walls.e) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell); }
      if (y === ROWS - 1 && c.walls.s) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell); }
    }
  }
  ctx.stroke();

  drawPumpkin(ox + (goal.x + 0.5) * cell, oy + (goal.y + 0.5) * cell, cell * 0.35);
  for (const e of enemies) {
    drawBat(ox + (e.x + 0.5) * cell, oy + (e.y + 0.5) * cell, cell * 0.3);
  }
  drawPlayer(ox + (player.x + 0.5) * cell, oy + (player.y + 0.5) * cell, cell * 0.35);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Nivå ' + level, 16, 32);
  ctx.textAlign = 'right';
  ctx.fillText('Liv ' + lives, W - 16, 32);

  if (state === 'lost') {
    ctx.fillStyle = 'rgba(15, 10, 30, 0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Fladdermössen tog alla liv!', W / 2, H / 2 - 12);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Tryck här eller tryck R för att börja om', W / 2, H / 2 + 24);
  }
}

function frame(now) {
  const dt = previousTime === undefined ? 0 : Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

const KEY_DIRS = {
  arrowup: 'n', w: 'n',
  arrowright: 'e', d: 'e',
  arrowdown: 's', s: 's',
  arrowleft: 'w', a: 'w'
};

canvas.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (KEY_DIRS[k]) {
    held[KEY_DIRS[k]] = true;
    e.preventDefault();
  } else if (k === 'r' && state === 'lost') {
    newGame();
    e.preventDefault();
  }
});

canvas.addEventListener('keyup', e => {
  const d = KEY_DIRS[e.key.toLowerCase()];
  if (d) held[d] = false;
});

canvas.addEventListener('blur', () => {
  for (const d in held) held[d] = false;
  queued = null;
  swipeStart = null;
});

canvas.addEventListener('pointerdown', e => {
  canvas.focus();
  canvas.setPointerCapture(e.pointerId);
  if (state === 'lost') { newGame(); return; }
  swipeStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointermove', e => {
  if (!swipeStart) return;
  const dx = e.clientX - swipeStart.x;
  const dy = e.clientY - swipeStart.y;
  if (Math.hypot(dx, dy) < cell * 0.4) return;
  queued = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
  swipeStart = null;
});

function releaseSwipe() {
  swipeStart = null;
}
canvas.addEventListener('pointerup', releaseSwipe);
canvas.addEventListener('pointercancel', releaseSwipe);

window.addEventListener('resize', resize);

resize();
newGame();
requestAnimationFrame(frame);
