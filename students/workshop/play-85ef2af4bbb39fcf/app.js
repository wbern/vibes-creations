const area = document.getElementById('canvas-area');
const W = 800;
const H = 600;
const HALF = W / 2;
const CAULDRON_W = 80;
const CATCH_Y = H - 70;
const TIME_LIMIT = 30;
const PLAYERS = [
  { name: 'Spelare 1', color: '#7dd3fc', keys: { left: 'p0l', right: 'p0r' } },
  { name: 'Spelare 2', color: '#ff8c1a', keys: { left: 'p1l', right: 'p1r' } }
];

const canvas = document.createElement('canvas');
canvas.style.display = 'block';
canvas.style.touchAction = 'manipulation';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

let cw, ch, scale, ox, oy;
let sides, over, elapsed, timeLeft, dir, lastTime;

function reset() {
  sides = PLAYERS.map((p, i) => ({
    x: i * HALF + HALF / 2,
    score: 0,
    lives: 3,
    items: [],
    spawnTimer: 0
  }));
  over = false;
  elapsed = 0;
  timeLeft = TIME_LIMIT;
  dir = { p0l: false, p0r: false, p1l: false, p1r: false };
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  cw = area.clientWidth || window.innerWidth;
  ch = Math.max(360, Math.round(window.innerHeight * 0.7));
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  scale = Math.min(cw / W, ch / H);
  ox = (cw - W * scale) / 2;
  oy = (ch - H * scale) / 2;
  draw();
}

function update(dt) {
  if (over) return;
  elapsed += dt;
  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    over = true;
    return;
  }

  sides.forEach((s, i) => {
    if (s.lives <= 0) return;
    const p = PLAYERS[i];
    const vx = (dir[p.keys.right] ? 1 : 0) - (dir[p.keys.left] ? 1 : 0);
    const min = i * HALF + CAULDRON_W / 2;
    const max = i * HALF + HALF - CAULDRON_W / 2;
    s.x = Math.max(min, Math.min(max, s.x + vx * 300 * dt));

    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      s.spawnTimer = Math.max(0.4, 0.9 - elapsed * 0.01);
      s.items.push({
        x: i * HALF + 20 + Math.random() * (HALF - 40),
        y: -20,
        ghost: Math.random() < 0.25
      });
    }

    const speed = 160 + s.score * 4;
    for (const it of s.items) {
      it.y += speed * dt;
      if (it.y >= CATCH_Y && Math.abs(it.x - s.x) < CAULDRON_W / 2) {
        if (it.ghost) s.lives--;
        else s.score++;
        it.done = true;
      }
    }
    s.items = s.items.filter((it) => !it.done && it.y < H + 20);
  });

  if (sides.every((s) => s.lives <= 0)) over = true;
}

function drawGhost(x, y) {
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.arc(x, y - 4, 14, Math.PI, 0);
  ctx.lineTo(x + 14, y + 12);
  ctx.lineTo(x - 14, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#14101c';
  ctx.beginPath();
  ctx.arc(x - 5, y - 4, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPumpkin(x, y) {
  ctx.fillStyle = '#ff8c1a';
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b8e23';
  ctx.fillRect(x - 2, y - 17, 4, 6);
}

function drawMan(x, shirt) {
  ctx.fillStyle = '#f5d0a9';
  ctx.beginPath();
  ctx.arc(x, CATCH_Y - 26, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14101c';
  ctx.fillRect(x - 12, CATCH_Y - 40, 24, 6);
  ctx.fillStyle = shirt;
  ctx.fillRect(x - 10, CATCH_Y - 12, 20, 26);
  ctx.fillStyle = '#14101c';
  ctx.fillRect(x - 9, CATCH_Y + 14, 7, 8);
  ctx.fillRect(x + 2, CATCH_Y + 14, 7, 8);
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath();
  ctx.moveTo(x - CAULDRON_W / 2, CATCH_Y - 4);
  ctx.lineTo(x + CAULDRON_W / 2, CATCH_Y - 4);
  ctx.lineTo(x + CAULDRON_W / 2 - 10, CATCH_Y + 12);
  ctx.lineTo(x - CAULDRON_W / 2 + 10, CATCH_Y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8c1a';
  ctx.fillRect(x - CAULDRON_W / 2 - 4, CATCH_Y - 8, CAULDRON_W + 8, 6);
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, cw, ch);

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
  ctx.fillStyle = '#231a2e';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#3a2d4d';
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.moveTo(HALF, 0);
  ctx.lineTo(HALF, H);
  ctx.stroke();
  ctx.setLineDash([]);

  sides.forEach((s, i) => {
    for (const it of s.items) {
      if (it.ghost) drawGhost(it.x, it.y);
      else drawPumpkin(it.x, it.y);
    }
    drawMan(s.x, PLAYERS[i].color);
  });

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = 'bold 20px sans-serif';
  ctx.textBaseline = 'top';
  sides.forEach((s, i) => {
    ctx.fillStyle = PLAYERS[i].color;
    ctx.textAlign = i === 0 ? 'left' : 'right';
    const x = i === 0 ? 16 : cw - 16;
    ctx.fillText(PLAYERS[i].name + ': ' + s.score, x, 16);
    ctx.fillStyle = '#f5e6c8';
    ctx.fillText('❤'.repeat(Math.max(0, s.lives)), x, 44);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5e6c8';
  ctx.fillText('Tid: ' + Math.ceil(timeLeft), cw / 2, 16);

  if (over) {
    ctx.fillStyle = 'rgba(20, 16, 28, 0.75)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const [a, b] = sides;
    let winner = 'Oavgjort!';
    if (a.score > b.score) winner = PLAYERS[0].name + ' vinner! 🎃';
    else if (b.score > a.score) winner = PLAYERS[1].name + ' vinner! 🎃';
    ctx.fillStyle = '#ff8c1a';
    ctx.font = `bold ${Math.max(24, Math.round(cw * 0.06))}px sans-serif`;
    ctx.fillText(winner, cw / 2, ch / 2 - 30);
    ctx.fillStyle = '#f5e6c8';
    ctx.font = '20px sans-serif';
    ctx.fillText('Tryck R eller på skärmen för en ny omgång', cw / 2, ch / 2 + 16);
  }
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function padButton(label, key) {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText =
    'font-size:1.6rem;width:4rem;height:3.4rem;border:none;border-radius:12px;background:#d68a3c;color:#14101c;' +
    'touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:pointer;';
  const press = (e) => {
    e.preventDefault();
    dir[key] = true;
  };
  const release = () => {
    dir[key] = false;
  };
  b.addEventListener('pointerdown', press);
  b.addEventListener('pointerup', release);
  b.addEventListener('pointerleave', release);
  b.addEventListener('pointercancel', release);
  return b;
}

const controls = document.createElement('div');
controls.style.cssText =
  'display:flex;justify-content:space-around;align-items:center;margin-top:12px;' +
  'user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;';
const p1Pad = document.createElement('div');
p1Pad.style.cssText = 'display:flex;gap:8px;';
p1Pad.appendChild(padButton('◀', 'p0l'));
p1Pad.appendChild(padButton('▶', 'p0r'));
const p2Pad = document.createElement('div');
p2Pad.style.cssText = 'display:flex;gap:8px;';
p2Pad.appendChild(padButton('◀', 'p1l'));
p2Pad.appendChild(padButton('▶', 'p1r'));
controls.appendChild(p1Pad);
controls.appendChild(p2Pad);
area.appendChild(controls);

canvas.addEventListener('pointerdown', () => {
  if (over) reset();
});

const KEY_DIRS = {
  a: 'p0l', d: 'p0r',
  arrowleft: 'p1l', arrowright: 'p1r'
};

window.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const key = e.key.toLowerCase();
  if (key === 'r') {
    reset();
  } else if (KEY_DIRS[key]) {
    e.preventDefault();
    dir[KEY_DIRS[key]] = true;
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (KEY_DIRS[key]) dir[KEY_DIRS[key]] = false;
});

window.addEventListener('resize', resize);

reset();
resize();
lastTime = performance.now();
requestAnimationFrame(loop);
