const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.touchAction = 'none';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
canvas.style.outline = 'none';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const PR = 18;
const FLOOR_GOAL = 20;
const floorNo = () => 1 + Math.floor(elapsed / 2);
let W = 0, H = 0, ex = 0, ew = 0;
let state, elapsed, px, dir = 0, touchDir = 0, monsters, spawnT, lastT, lives;

const playerY = () => H - 70;

function clampX(x) {
  return Math.max(ex + PR + 6, Math.min(ex + ew - PR - 6, x));
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = area.clientWidth;
  H = Math.max(320, Math.round(window.innerHeight * 0.6));
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ew = Math.min(W * 0.6, 360);
  ex = (W - ew) / 2;
  if (px !== undefined) px = clampX(px);
}

function reset() {
  state = 'playing';
  elapsed = 0;
  monsters = [];
  spawnT = 1;
  lives = 3;
  px = W / 2;
}

function update(dt) {
  elapsed += dt;
  px = clampX(px + (dir || touchDir) * ew * 0.9 * dt);

  spawnT -= dt;
  if (spawnT <= 0) {
    const r = ew * 0.06;
    monsters.push({
      x: ex + r + Math.random() * (ew - 2 * r),
      y: -r,
      r,
      vy: H * 0.4 + elapsed * 10,
    });
    spawnT = Math.max(0.35, 0.9 - elapsed * 0.04) * (0.7 + Math.random() * 0.6);
  }

  for (const m of monsters) {
    m.y += m.vy * dt;
    if (!m.hit && Math.hypot(m.x - px, m.y - playerY()) < m.r + PR * 0.8) {
      m.hit = true;
      lives--;
      if (lives <= 0) state = 'over';
    }
  }
  monsters = monsters.filter(m => !m.hit && m.y < H + m.r);

  if (state === 'playing' && floorNo() >= FLOOR_GOAL) state = 'won';
}

function drawGhost(x, y, s) {
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y, s, Math.PI, 0);
  ctx.lineTo(x + s, y + s * 0.8);
  ctx.lineTo(x + s * 0.4, y + s * 0.4);
  ctx.lineTo(x, y + s * 0.8);
  ctx.lineTo(x - s * 0.4, y + s * 0.4);
  ctx.lineTo(x - s, y + s * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(x - s * 0.35, y - s * 0.2, s * 0.14, 0, Math.PI * 2);
  ctx.arc(x + s * 0.35, y - s * 0.2, s * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

function drawMonster(m) {
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(m.x - m.r * 0.35, m.y - m.r * 0.2, m.r * 0.25, 0, Math.PI * 2);
  ctx.arc(m.x + m.r * 0.35, m.y - m.r * 0.2, m.r * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(m.x - m.r * 0.35, m.y - m.r * 0.2, m.r * 0.1, 0, Math.PI * 2);
  ctx.arc(m.x + m.r * 0.35, m.y - m.r * 0.2, m.r * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawCenteredText(lines, y) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, i) => {
    ctx.font = i === 0 ? 'bold 28px sans-serif' : '18px sans-serif';
    ctx.fillText(line, W / 2, y + i * 34);
  });
}

function draw() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0f172a');
  sky.addColorStop(1, '#312e81');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(ex - 20, 0, ew + 40, H);

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  const spacing = 70;
  const offset = (elapsed * 120) % spacing;
  for (let y = offset - spacing; y < H; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(ex - 20, y);
    ctx.lineTo(ex + ew + 20, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(ex, 0, ew, H);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(ex + 8, 50, ew - 16, H - 50);

  ctx.fillStyle = '#facc15';
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Våning ' + floorNo(), ex + ew / 2, 32);

  for (const m of monsters) drawMonster(m);
  drawGhost(px, playerY(), PR);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#f87171';
  ctx.fillText('♥'.repeat(Math.max(0, lives)), W - 16, 30);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Mål: våning ' + FLOOR_GOAL, 16, 30);

  if (state === 'won') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);
    drawCenteredText(['Du nådde våning ' + FLOOR_GOAL + '!', 'Tryck för att spela igen'], H / 2 - 10);
  } else if (state === 'over') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);
    drawCenteredText(['Monstret fick dig!', 'Tryck för att försöka igen'], H / 2 - 10);
  }
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (state === 'playing') update(dt);
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    dir = -1;
    e.preventDefault();
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    dir = 1;
    e.preventDefault();
  } else if ((e.code === 'Space' || e.code === 'Enter') && state !== 'playing') {
    reset();
    e.preventDefault();
  }
});

canvas.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    if (dir === -1) dir = 0;
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    if (dir === 1) dir = 0;
  }
});

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  canvas.focus();
  if (state !== 'playing') {
    reset();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  touchDir = (e.clientX - rect.left) < rect.width / 2 ? -1 : 1;
});

const stopTouch = () => { touchDir = 0; };
canvas.addEventListener('pointerup', stopTouch);
canvas.addEventListener('pointercancel', stopTouch);
canvas.addEventListener('pointerleave', stopTouch);

window.addEventListener('resize', resize);

resize();
reset();
lastT = performance.now();
requestAnimationFrame(loop);
