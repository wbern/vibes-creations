// Spökfilmen: en kort animerad Halloween-film som spelas om när man klickar.

const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.setAttribute('aria-label', 'Animerad spökfilm, klicka för att spela om');
Object.assign(canvas.style, {
  position: 'fixed', inset: '0', width: '100%', height: '100%',
  display: 'block', touchAction: 'manipulation', userSelect: 'none',
  webkitUserSelect: 'none', webkitTouchCallout: 'none', cursor: 'pointer',
});
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const DURATION = 7;
const stars = Array.from({ length: 60 }, () => ({
  x: Math.random(), y: Math.random() * 0.6, phase: Math.random() * Math.PI * 2,
}));
let W = 0, H = 0, startTime = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function restart(time) {
  startTime = time;
}

function drawSky(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0f0a1f');
  g.addColorStop(1, '#4c1d95');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (const s of stars) {
    const alpha = 0.5 + 0.5 * Math.sin(t * 2 + s.phase);
    ctx.fillStyle = `rgba(254, 243, 199, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(W * 0.8, H * 0.2, Math.min(W, H) * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround() {
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, H * 0.85, W, H * 0.15);
}

function drawPumpkin(t) {
  const bob = Math.sin(t * 2) * 6;
  const cx = W * 0.2, cy = H * 0.8 + bob;
  const r = Math.min(W, H) * 0.08;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(cx - 4, cy - r * 0.8 - 10, 8, 12);
}

function drawGhost(t) {
  const p = Math.min(t / (DURATION - 1.5), 1);
  const x = -W * 0.1 + p * W * 1.2;
  const y = H * 0.4 + Math.sin(t * 3) * H * 0.05;
  const r = Math.min(W, H) * 0.06;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0);
  ctx.lineTo(x + r, y + r * 1.2);
  for (let i = 0; i < 3; i++) {
    const wave = i % 2 === 0 ? r * 1.2 : r * 0.8;
    ctx.lineTo(x + r - (i + 1) * (2 * r / 3), y + wave);
  }
  ctx.lineTo(x - r, y + r * 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.2, r * 0.12, 0, Math.PI * 2);
  ctx.arc(x + r * 0.35, y - r * 0.2, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawTitle(t) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fef3c7';
  if (t < DURATION - 1) {
    ctx.globalAlpha = Math.min(1, t / 0.8, (DURATION - 1 - t) / 0.5);
    ctx.font = `bold ${Math.round(Math.min(W, H) * 0.09)}px sans-serif`;
    ctx.fillText('Buu!', W / 2, H * 0.3);
    ctx.globalAlpha = 1;
  } else {
    ctx.font = `${Math.round(Math.min(W, H) * 0.04)}px sans-serif`;
    ctx.fillText('Slut! Klicka för att se om', W / 2, H * 0.3);
  }
}

function draw(t) {
  drawSky(t);
  drawGround();
  drawPumpkin(t);
  if (t < DURATION - 1) drawGhost(t);
  drawTitle(t);
}

function frame(time) {
  const t = Math.min((time - startTime) / 1000, DURATION);
  draw(t);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
canvas.addEventListener('click', () => restart(performance.now()));
resize();
restart(performance.now());
requestAnimationFrame(frame);
