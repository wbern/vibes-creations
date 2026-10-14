const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.className = 'stage';
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Godisjakten');
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

let W = 0, H = 0, unit = 0;
let x = 0.5, score = 0, lives = 3, playing = true;
let items = [], spawnTimer = 0, time = 0, previousTime;
const keys = { left: false, right: false };
let pointerX = null;
const candyColors = ['#f97316', '#a855f7', '#84cc16', '#facc15'];

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  unit = Math.min(W, H);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function reset() {
  x = 0.5;
  score = 0;
  lives = 3;
  items = [];
  spawnTimer = 0;
  playing = true;
}

function spawn() {
  items.push({
    x: 0.08 + Math.random() * 0.84,
    y: -0.05,
    ghost: Math.random() < Math.min(0.5, 0.25 + score * 0.01),
    color: candyColors[Math.floor(Math.random() * candyColors.length)],
    vy: 0.25 + Math.random() * 0.15 + score * 0.01
  });
}

function update(dt) {
  if (!playing) return;
  if (pointerX !== null) x += (pointerX - x) * Math.min(1, dt * 12);
  else x += (Number(keys.right) - Number(keys.left)) * 0.8 * dt;
  x = Math.max(0.07, Math.min(0.93, x));

  spawnTimer += dt;
  if (spawnTimer > Math.max(0.25, 0.9 - score * 0.03)) {
    spawnTimer = 0;
    spawn();
  }

  const cx = x * W;
  const cy = H * 0.86;
  const half = unit * 0.12;
  const r = unit * 0.035;
  for (const it of items) {
    it.y += it.vy * dt;
    const ix = it.x * W;
    const iy = it.y * H;
    if (Math.abs(ix - cx) < half + r && Math.abs(iy - cy) < unit * 0.05) {
      it.done = true;
      if (it.ghost) lives--;
      else score++;
    } else if (it.y > 1.05) {
      it.done = true;
    }
  }
  items = items.filter(it => !it.done);
  if (lives <= 0) playing = false;
}

function drawCandy(px, py, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(px - r * 0.15, py - r, r * 0.3, r * 2);
}

function drawGhostItem(px, py, r) {
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(px, py - r * 0.2, r, Math.PI, 0);
  ctx.lineTo(px + r, py + r * 0.9);
  ctx.lineTo(px + r * 0.5, py + r * 0.5);
  ctx.lineTo(px, py + r * 0.9);
  ctx.lineTo(px - r * 0.5, py + r * 0.5);
  ctx.lineTo(px - r, py + r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(px - r * 0.4, py - r * 0.2, r * 0.14, 0, Math.PI * 2);
  ctx.arc(px + r * 0.4, py - r * 0.2, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

function drawCauldron() {
  const cx = x * W;
  const cy = H * 0.86;
  const half = unit * 0.12;
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(cx, cy, half, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.fillRect(cx - half * 1.1, cy - unit * 0.02, half * 2.2, unit * 0.03);
  ctx.fillStyle = '#a3e635';
  for (let i = -1; i <= 1; i++) {
    const bob = Math.sin(time * 4 + i) * unit * 0.008;
    ctx.beginPath();
    ctx.arc(cx + i * half * 0.45, cy - unit * 0.03 + bob, unit * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1e1433');
  sky.addColorStop(1, '#4c1d95');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.15, unit * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f0a1e';
  ctx.fillRect(0, H * 0.94, W, H * 0.06);

  const r = unit * 0.035;
  for (const it of items) {
    const px = it.x * W;
    const py = it.y * H;
    if (it.ghost) drawGhostItem(px, py, r);
    else drawCandy(px, py, r, it.color);
  }

  drawCauldron();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Poäng: ' + score, 16, 32);
  ctx.textAlign = 'right';
  ctx.fillText('Liv: ' + lives, W - 16, 32);

  if (!playing) {
    ctx.fillStyle = 'rgba(15, 10, 30, 0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Spöket fångade dig!', W / 2, H / 2 - 12);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Poäng: ' + score, W / 2, H / 2 + 20);
    ctx.fillText('Tryck här eller tryck R för att spela igen', W / 2, H / 2 + 50);
  }
}

function frame(now) {
  const dt = previousTime === undefined ? 0 : Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  time += dt;
  update(dt);
  drawWorld();
  requestAnimationFrame(frame);
}

canvas.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') { keys.left = true; e.preventDefault(); }
  else if (k === 'arrowright' || k === 'd') { keys.right = true; e.preventDefault(); }
  else if (k === 'r' && !playing) { reset(); e.preventDefault(); }
});

canvas.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keys.left = false;
  else if (k === 'arrowright' || k === 'd') keys.right = false;
});

canvas.addEventListener('blur', () => {
  keys.left = keys.right = false;
  pointerX = null;
});

canvas.addEventListener('pointerdown', e => {
  canvas.focus();
  canvas.setPointerCapture(e.pointerId);
  if (!playing) { reset(); return; }
  const rect = canvas.getBoundingClientRect();
  pointerX = (e.clientX - rect.left) / rect.width;
});

canvas.addEventListener('pointermove', e => {
  if (pointerX === null) return;
  const rect = canvas.getBoundingClientRect();
  pointerX = (e.clientX - rect.left) / rect.width;
});

function releasePointer() {
  pointerX = null;
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);

window.addEventListener('resize', resize);

resize();
reset();
requestAnimationFrame(frame);
