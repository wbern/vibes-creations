// Halloween-berättelse: tryck för att gå vidare genom sidorna i natten.

const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Halloween-berättelse: tryck på skärmen eller mellanslag för nästa sida');
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.touchAction = 'manipulation';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
canvas.style.webkitTapHighlightColor = 'transparent';
canvas.style.outline = 'none';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

let W = 0, H = 0;
let page = 0;
let pageStart = performance.now();

const stars = Array.from({ length: 60 }, () => ({
  x: Math.random(), y: Math.random() * 0.6, r: 0.5 + Math.random() * 1.5, phase: Math.random() * 6,
}));
const bats = Array.from({ length: 6 }, (_, i) => ({
  delay: i * 0.8, y: 0.12 + Math.random() * 0.35, speed: 0.08 + Math.random() * 0.05,
}));

const pages = [
  { text: 'Natten faller på...', scene: 'moon' },
  { text: 'En pumpa vaknar till liv!', scene: 'pumpkin' },
  { text: 'Fladdermössen flyger förbi.', scene: 'bats' },
  { text: 'Happy Halloween!', scene: 'end' },
];

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = area.clientWidth;
  H = Math.max(360, Math.round(window.innerHeight * 0.7));
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function nextPage() {
  page = (page + 1) % pages.length;
  pageStart = performance.now();
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b0716');
  g.addColorStop(1, '#2d1645');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawStars(t) {
  for (const s of stars) {
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + s.phase));
    ctx.fillStyle = `rgba(245, 240, 230, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMoon() {
  const x = W * 0.8, y = H * 0.2, r = Math.min(W, H) * 0.09;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d1645';
  ctx.beginPath();
  ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.85, 0, Math.PI * 2);
  ctx.fill();
}

function drawBat(x, y, size, flap) {
  ctx.fillStyle = '#05030a';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - size * 0.5, y - size * flap, x - size, y + size * 0.1);
  ctx.quadraticCurveTo(x - size * 0.6, y + size * 0.1, x - size * 0.3, y + size * 0.15);
  ctx.quadraticCurveTo(x - size * 0.15, y + size * 0.4, x, y + size * 0.3);
  ctx.quadraticCurveTo(x + size * 0.15, y + size * 0.4, x + size * 0.3, y + size * 0.15);
  ctx.quadraticCurveTo(x + size * 0.6, y + size * 0.1, x + size, y + size * 0.1);
  ctx.quadraticCurveTo(x + size * 0.5, y - size * flap, x, y);
  ctx.fill();
}

function drawBats(t) {
  const size = Math.min(W, H) * 0.035;
  for (const b of bats) {
    const local = t - b.delay;
    if (local < 0) continue;
    const progress = (local * b.speed) % 1.3;
    const x = W * (1.15 - progress);
    const y = H * b.y + Math.sin(local * 2) * H * 0.03;
    const flap = 0.6 + 0.4 * Math.sin(local * 10);
    drawBat(x, y, size, flap);
  }
}

function drawPumpkin(t) {
  const grow = Math.min(1, t / 1.5);
  const ease = 1 - Math.pow(1 - grow, 3);
  const s = Math.min(W, H) * 0.22 * ease;
  const x = W / 2;
  const y = H * 0.68 + Math.sin(t * 2) * H * 0.01;

  ctx.fillStyle = 'rgba(255, 140, 26, 0.15)';
  ctx.beginPath();
  ctx.arc(x, y, s * 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff8c1a';
  ctx.strokeStyle = '#c24d0a';
  ctx.lineWidth = Math.max(2, s * 0.03);
  for (const dx of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * s, y, s * 0.5, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x - s * 0.06, y - s * 0.75, s * 0.12, s * 0.2);

  ctx.fillStyle = '#1d0f2e';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.4, y - s * 0.15);
  ctx.lineTo(x - s * 0.2, y - s * 0.35);
  ctx.lineTo(x - s * 0.05, y - s * 0.15);
  ctx.moveTo(x + s * 0.4, y - s * 0.15);
  ctx.lineTo(x + s * 0.2, y - s * 0.35);
  ctx.lineTo(x + s * 0.05, y - s * 0.15);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.35, y + s * 0.15);
  ctx.quadraticCurveTo(x, y + s * 0.5, x + s * 0.35, y + s * 0.15);
  ctx.quadraticCurveTo(x, y + s * 0.3, x - s * 0.35, y + s * 0.15);
  ctx.fill();
}

function drawPageText(text, hint) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff8c1a';
  ctx.font = `bold ${Math.max(22, H * 0.07)}px sans-serif`;
  ctx.fillText(text, W / 2, H * 0.12);
  ctx.fillStyle = '#f5f0e6';
  ctx.font = `${Math.max(14, H * 0.04)}px sans-serif`;
  ctx.fillText(hint, W / 2, H * 0.12 + Math.max(30, H * 0.07));
}

function draw(t) {
  const p = pages[page];
  const local = (performance.now() - pageStart) / 1000;
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawStars(t);
  drawMoon();
  if (p.scene === 'bats' || p.scene === 'end') drawBats(local);
  if (p.scene === 'pumpkin' || p.scene === 'end') drawPumpkin(local);
  const hint = page === pages.length - 1 ? 'Tryck för att börja om' : 'Tryck för nästa sida';
  drawPageText(p.text, hint);
}

function advance() {
  nextPage();
}

canvas.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  canvas.focus({ preventScroll: true });
  advance();
});

window.addEventListener('resize', resize);

resize();
function frame(now) {
  draw((now - pageStart) / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
