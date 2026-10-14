// Godisregnet: fånga godiset i korgen.
const area = document.getElementById('canvas-area');

const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Godisregnet-spelet. Använd piltangenterna eller dra korgen.');
canvas.style.display = 'block';
canvas.style.margin = '0 auto';
canvas.style.borderRadius = '18px';
canvas.style.touchAction = 'none';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
canvas.style.outline = 'none';
canvas.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
area.appendChild(canvas);

const controls = document.createElement('div');
controls.style.display = 'flex';
controls.style.justifyContent = 'center';
controls.style.gap = '1rem';
controls.style.marginTop = '0.75rem';
area.appendChild(controls);

const ctx = canvas.getContext('2d');
const CANDY_COLORS = ['#ff7ab6', '#ffb347', '#7bdff2', '#b28dff', '#a8e063'];

let W = 300;
let H = 400;
let dpr = 1;
let basket;
let drops;
let score;
let level = 1;
let levelBanner = 0;
let spawnTimer;
let dragging = false;
const keys = { left: false, right: false };

function resize() {
  W = Math.max(280, Math.floor(area.clientWidth || window.innerWidth - 32));
  const top = canvas.getBoundingClientRect().top;
  H = Math.max(360, Math.floor(window.innerHeight - Math.max(top, 0) - 90));
  dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (basket) {
    basket.w = Math.max(70, W * 0.18);
    basket.y = H - 40;
    basket.x = Math.min(Math.max(basket.x, basket.w / 2), W - basket.w / 2);
  }
}

function reset() {
  score = 0;
  level = 1;
  levelBanner = 0;
  drops = [];
  spawnTimer = 0;
  basket = { x: W / 2, w: Math.max(70, W * 0.18), y: H - 40, h: 22 };
}

function spawn() {
  const r = 14 + Math.random() * 6;
  drops.push({
    x: r + Math.random() * (W - 2 * r),
    y: -r,
    r,
    vy: H * (0.22 + Math.random() * 0.12) + level * 25,
    color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
  });
}

function update(dt) {
  const speed = W * 0.6;
  if (keys.left) basket.x -= speed * dt;
  if (keys.right) basket.x += speed * dt;
  basket.x = Math.min(Math.max(basket.x, basket.w / 2), W - basket.w / 2);

  if (levelBanner > 0) levelBanner -= dt;
  const newLevel = Math.floor(score / 10) + 1;
  if (newLevel > level) {
    level = newLevel;
    levelBanner = 2;
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawn();
    spawnTimer = Math.max(0.35, 0.9 - level * 0.08);
  }

  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.y += d.vy * dt;
    const hitsBasket =
      d.y + d.r >= basket.y &&
      d.y - d.r <= basket.y + basket.h &&
      Math.abs(d.x - basket.x) < basket.w / 2 + d.r * 0.5;
    if (hitsBasket) {
      score++;
      drops.splice(i, 1);
    } else if (d.y - d.r > H) {
      drops.splice(i, 1);
    }
  }
}

function drawCandy(d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.fillStyle = d.color;
  ctx.beginPath();
  ctx.arc(0, 0, d.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-d.r * 0.6, -d.r * 0.2);
  ctx.lineTo(d.r * 0.6, d.r * 0.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(-d.r * 0.35, -d.r * 0.35, d.r * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const LEVEL_SKIES = [
  ['#1e1333', '#3b1d5a'],
  ['#0d2b2b', '#1d5a4a'],
  ['#2b1010', '#5a1d1d'],
  ['#101a33', '#1d3a5a'],
];

function draw() {
  const [top, bottom] = LEVEL_SKIES[(level - 1) % LEVEL_SKIES.length];
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.arc(W - 50, 50, 22, 0, Math.PI * 2);
  ctx.fill();

  drops.forEach(drawCandy);

  if (basket) {
    const px = basket.x;
    const py = basket.y + 22;
    const pr = basket.w / 2;
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.ellipse(px, py, pr, pr * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(px - 4, py - pr * 0.8 - 14, 8, 14);
    ctx.fillStyle = '#1e1333';
    ctx.beginPath();
    ctx.arc(px - pr * 0.35, py - 4, pr * 0.12, 0, Math.PI * 2);
    ctx.arc(px + pr * 0.35, py - 4, pr * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py + pr * 0.3, pr * 0.25, 0, Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🍬 ' + score, 16, 34);
  ctx.fillText('Nivå ' + level, 16, 62);

  if (levelBanner > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('Nivå ' + level + '! 🎃', W / 2, H / 2);
  }
}

let lastT = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
  lastT = t;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function pointerX(e) {
  const rect = canvas.getBoundingClientRect();
  return e.clientX - rect.left;
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.focus();
  dragging = true;
  canvas.setPointerCapture(e.pointerId);
  basket.x = pointerX(e);
});

canvas.addEventListener('pointermove', (e) => {
  if (dragging) basket.x = pointerX(e);
});

canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });

function setKey(e, down) {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = down;
    e.preventDefault();
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = down;
    e.preventDefault();
  }
}

canvas.addEventListener('keydown', (e) => setKey(e, true));

canvas.addEventListener('keyup', (e) => setKey(e, false));
canvas.addEventListener('blur', () => { keys.left = false; keys.right = false; });

function makeButton(label, dir) {
  const b = document.createElement('button');
  b.textContent = label;
  b.setAttribute('aria-label', dir < 0 ? 'Flytta korgen vänster' : 'Flytta korgen höger');
  b.style.touchAction = 'manipulation';
  b.style.userSelect = 'none';
  b.style.webkitUserSelect = 'none';
  b.style.webkitTouchCallout = 'none';
  b.style.fontSize = '1.75rem';
  b.style.width = '5.5rem';
  b.style.height = '3.5rem';
  b.style.borderRadius = '14px';
  b.style.border = 'none';
  b.style.background = '#ff9f1c';
  b.style.color = '#1e1333';
  const key = dir < 0 ? 'left' : 'right';
  const press = (e) => {
    e.preventDefault();
    keys[key] = true;
  };
  const release = () => { keys[key] = false; };
  b.addEventListener('pointerdown', press);
  b.addEventListener('pointerup', release);
  b.addEventListener('pointerleave', release);
  b.addEventListener('pointercancel', release);
  return b;
}

controls.appendChild(makeButton('◀', -1));
controls.appendChild(makeButton('▶', 1));

window.addEventListener('resize', resize);
resize();
reset();
requestAnimationFrame((t) => {
  lastT = t;
  requestAnimationFrame(frame);
});

const jumpArea = document.createElement('div');
jumpArea.style.marginTop = '1.5rem';
area.appendChild(jumpArea);

const jc = document.createElement('canvas');
jc.tabIndex = 0;
jc.setAttribute('aria-label', 'Pumpan hoppar när du trycker på den');
jc.style.display = 'block';
jc.style.margin = '0 auto';
jc.style.borderRadius = '18px';
jc.style.touchAction = 'manipulation';
jc.style.userSelect = 'none';
jc.style.webkitUserSelect = 'none';
jc.style.webkitTouchCallout = 'none';
jc.style.outline = 'none';
jumpArea.appendChild(jc);

const jx = jc.getContext('2d');
let jW = 300;
let jH = 240;
let groundY = 200;
let pumpR = 40;
let pumpY = 0;
let pumpVy = 0;

function jResize() {
  jW = Math.max(280, Math.floor(area.clientWidth || window.innerWidth - 32));
  jH = Math.max(200, Math.floor(window.innerHeight * 0.35));
  const d = window.devicePixelRatio || 1;
  jc.width = jW * d;
  jc.height = jH * d;
  jc.style.width = jW + 'px';
  jc.style.height = jH + 'px';
  jx.setTransform(d, 0, 0, d, 0, 0);
  groundY = jH - 30;
  pumpR = Math.max(36, Math.min(jW, jH) * 0.14);
  if (pumpVy === 0 && pumpY === 0) pumpY = groundY - pumpR;
  pumpY = Math.min(pumpY, groundY - pumpR);
}

function onGround() {
  return pumpY >= groundY - pumpR - 0.5;
}

function jumpPumpkin() {
  if (onGround()) pumpVy = -jH * 2.6;
}

jc.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  jc.focus();
  jumpPumpkin();
});

jc.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    jumpPumpkin();
  }
});

function jDraw() {
  jx.fillStyle = '#1e1333';
  jx.fillRect(0, 0, jW, jH);
  jx.fillStyle = '#2d1f47';
  jx.fillRect(0, groundY, jW, jH - groundY);

  jx.save();
  jx.translate(jW / 2, pumpY);
  jx.fillStyle = '#ff7a1a';
  jx.beginPath();
  jx.ellipse(0, 0, pumpR, pumpR * 0.8, 0, 0, Math.PI * 2);
  jx.fill();
  jx.fillStyle = '#2e7d32';
  jx.fillRect(-4, -pumpR * 0.8 - 14, 8, 14);
  jx.fillStyle = '#1e1333';
  jx.beginPath();
  jx.arc(-pumpR * 0.35, -4, pumpR * 0.12, 0, Math.PI * 2);
  jx.arc(pumpR * 0.35, -4, pumpR * 0.12, 0, Math.PI * 2);
  jx.fill();
  jx.beginPath();
  jx.arc(0, pumpR * 0.3, pumpR * 0.25, 0, Math.PI);
  jx.fill();
  jx.restore();

  jx.fillStyle = '#ffffff';
  jx.font = '16px sans-serif';
  jx.textAlign = 'center';
  jx.fillText('Tryck på pumpan för att hoppa!', jW / 2, 28);
}

let jLast = 0;
function jFrame(t) {
  const dt = Math.min(0.05, (t - jLast) / 1000 || 0);
  jLast = t;
  pumpVy += jH * 6 * dt;
  pumpY += pumpVy * dt;
  if (pumpY > groundY - pumpR) {
    pumpY = groundY - pumpR;
    pumpVy = 0;
  }
  jDraw();
  requestAnimationFrame(jFrame);
}

window.addEventListener('resize', jResize);
jResize();
requestAnimationFrame((t) => {
  jLast = t;
  requestAnimationFrame(jFrame);
});
