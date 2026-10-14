const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.touchAction = 'none';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const ghost = { x: 0, y: 0, speed: 6, dir: 0, t: 0 };
const keys = { left: false, right: false };
const pointer = { active: false, x: 0 };

function resize() {
  const w = area.clientWidth || window.innerWidth;
  const h = Math.max(320, window.innerHeight - 40);
  canvas.width = w;
  canvas.height = h;
  canvas.style.height = h + 'px';
  if (ghost.y === 0) {
    ghost.x = w / 2;
  }
  ghost.x = Math.min(Math.max(ghost.x, 30), w - 30);
  ghost.y = h * 0.6;
}

function isEditable(target) {
  return target && (target.isContentEditable ||
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
}

window.addEventListener('keydown', (e) => {
  if (isEditable(e.target)) return;
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

function setPointer(e) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = e.clientX - rect.left;
  pointer.active = true;
}
canvas.addEventListener('pointerdown', (e) => { setPointer(e); canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') setPointer(e); });
canvas.addEventListener('pointerup', () => { pointer.active = false; });
canvas.addEventListener('pointercancel', () => { pointer.active = false; });

function update() {
  ghost.t += 0.05;
  if (keys.left) ghost.x -= ghost.speed;
  if (keys.right) ghost.x += ghost.speed;
  if (pointer.active) {
    const diff = pointer.x - ghost.x;
    ghost.x += Math.max(-ghost.speed, Math.min(ghost.speed, diff * 0.2));
  }
  ghost.x = Math.min(Math.max(ghost.x, 30), canvas.width - 30);
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#1e1b4b');
  g.addColorStop(1, '#4c1d95');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 160; i++) {
    const sx = ((i * 7919) % 1000) / 1000 * canvas.width;
    const sy = ((i * 104729) % 1000) / 1000 * canvas.height * 0.6;
    ctx.fillStyle = `rgba(254, 249, 195, ${0.4 + (i % 5) * 0.12})`;
    ctx.fillRect(sx, sy, 2, 2);
  }
  const moonX = canvas.width * 0.85;
  const moonY = canvas.height * 0.15;
  const glow = ctx.createRadialGradient(moonX, moonY, 30, moonX, moonY, 90);
  glow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
  glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(moonX - 90, moonY - 90, 180, 180);
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(127, 29, 29, 0.6)';
  for (const [dx, dy, r] of [[-12, -8, 8], [10, 6, 6], [-4, 14, 4.5], [14, -14, 3.5], [-18, 10, 3]]) {
    ctx.beginPath();
    ctx.arc(moonX + dx, moonY + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFunPark() {
  const groundY = canvas.height * 0.72;

  const wx = canvas.width * 0.42;
  const wr = Math.min(canvas.height * 0.28, 150);
  const wy = groundY - wr - 10;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(wx - 40, groundY);
  ctx.lineTo(wx, wy);
  ctx.lineTo(wx + 40, groundY);
  ctx.moveTo(wx, wy);
  ctx.lineTo(wx, wy - 10);
  ctx.stroke();
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(wx, wy, wr, 0, Math.PI * 2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr);
  }
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const gx = wx + Math.cos(a) * wr;
    const gy = wy + Math.sin(a) * wr;
    ctx.fillStyle = i % 2 ? '#facc15' : '#f97316';
    ctx.fillRect(gx - 7, gy - 5, 14, 12);
    ctx.fillStyle = '#fef9c3';
    ctx.fillRect(gx - 4, gy - 2, 3, 3);
  }

  const stationX = canvas.width * 0.52;
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(stationX - 60, groundY - 46, 120, 46);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(stationX - 68, groundY - 56, 136, 12);
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = '#fde047';
    ctx.fillRect(stationX + i * 22 - 6, groundY - 34, 12, 14);
  }
  const towerX = canvas.width * 0.22;
  const towerH = Math.min(canvas.height * 0.45, 260);
  ctx.fillStyle = '#334155';
  ctx.fillRect(towerX - 22, groundY - towerH, 44, towerH);
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(towerX - 30, groundY - towerH);
  ctx.lineTo(towerX, groundY - towerH - 40);
  ctx.lineTo(towerX + 30, groundY - towerH);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#fde68a' : '#f472b6';
    ctx.fillRect(towerX - 16 + (i % 2) * 14, groundY - towerH + 20 + i * (towerH - 40) / 5, 8, 8);
  }
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(towerX, groundY - towerH - 44, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(towerX - 56, groundY - towerH + 30, 112, 22);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LISEBERG', towerX, groundY - towerH + 46);
  ctx.textAlign = 'start';

  const startX = canvas.width * 0.6;
  const coasterY = (i) => groundY - (i % 2 ? 110 : 60) - i * 6;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(startX, groundY);
  for (let i = 1; i <= 6; i++) {
    ctx.lineTo(startX + i * canvas.width * 0.06, coasterY(i));
  }
  ctx.stroke();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX, groundY - 10);
  for (let i = 1; i <= 6; i++) {
    ctx.lineTo(startX + i * canvas.width * 0.06, coasterY(i) - 10);
  }
  ctx.stroke();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 1; i <= 6; i++) {
    const x = startX + i * canvas.width * 0.06;
    ctx.moveTo(x, coasterY(i));
    ctx.lineTo(x, groundY);
  }
  ctx.stroke();
  drawCarousel(canvas.width * 0.7, groundY);
}

function drawCarousel(x, groundY) {
  const h = Math.min(canvas.height * 0.3, 150);
  const top = groundY - h;
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(x - 50, groundY - 14, 100, 14);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  for (const px of [-40, -20, 0, 20, 40]) {
    ctx.beginPath();
    ctx.moveTo(x + px, groundY - 14);
    ctx.lineTo(x + px, top + 30);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#fef2f2' : '#dc2626';
    const x0 = x - 60 + i * 20;
    ctx.beginPath();
    ctx.moveTo(x0, top + 30);
    ctx.lineTo(x0 + 20, top + 30);
    ctx.lineTo(x, top);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(x, top - 6, 5, 0, Math.PI * 2);
  ctx.fill();
  for (const px of [-30, -10, 10, 30]) {
    ctx.fillStyle = px < 0 ? '#f472b6' : '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(x + px, groundY - 40, 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const bulbs = ['#fde047', '#f97316', '#4ade80'];
  for (let i = 0; i <= 12; i++) {
    ctx.fillStyle = bulbs[i % 3];
    ctx.beginPath();
    ctx.arc(x - 60 + i * 10, top + 30, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEiffel(x, groundY) {
  const H = Math.min(canvas.height * 0.55, 320);
  const top = groundY - H;
  const bw = H * 0.22;
  const tw = 4;
  const gold = '#facc15';
  ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
  ctx.beginPath();
  ctx.moveTo(x - bw, groundY);
  ctx.quadraticCurveTo(x - bw * 0.45, groundY - H * 0.5, x - tw, top);
  ctx.lineTo(x + tw, top);
  ctx.quadraticCurveTo(x + bw * 0.45, groundY - H * 0.5, x + bw, groundY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - bw, groundY);
  ctx.quadraticCurveTo(x - bw * 0.45, groundY - H * 0.5, x - tw, top);
  ctx.moveTo(x + bw, groundY);
  ctx.quadraticCurveTo(x + bw * 0.45, groundY - H * 0.5, x + tw, top);
  ctx.moveTo(x - bw * 0.55, groundY - H * 0.2);
  ctx.quadraticCurveTo(x, groundY - H * 0.42, x + bw * 0.55, groundY - H * 0.2);
  ctx.stroke();
  for (const f of [0.5, 0.78]) {
    const y = groundY - H * f;
    const hw = bw * (1 - f) + tw * f;
    ctx.beginPath();
    ctx.moveTo(x - hw, y);
    ctx.lineTo(x + hw, y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, top - H * 0.1);
  ctx.stroke();
}

function drawGround() {
  const groundY = canvas.height * 0.72;
  const grass = ctx.createLinearGradient(0, groundY, 0, canvas.height);
  grass.addColorStop(0, '#166534');
  grass.addColorStop(1, '#052e16');
  ctx.fillStyle = grass;
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
  const mist = ctx.createLinearGradient(0, groundY - 30, 0, groundY + 10);
  mist.addColorStop(0, 'rgba(196, 181, 253, 0)');
  mist.addColorStop(1, 'rgba(196, 181, 253, 0.18)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, groundY - 30, canvas.width, 40);
  for (let x = 0; x < canvas.width; x += 6) {
    const h = 10 + ((x * 37) % 17);
    const lean = ((x * 13) % 7) - 3;
    ctx.strokeStyle = (x / 6) % 2 ? '#22c55e' : '#15803d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, groundY + 4);
    ctx.lineTo(x + lean, groundY - h);
    ctx.stroke();
  }
  for (let x = 2; x < canvas.width; x += 4) {
    const h = 6 + ((x * 53) % 13);
    const lean = ((x * 17) % 9) - 4;
    ctx.strokeStyle = (x / 4) % 2 ? '#4ade80' : '#166534';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, groundY + 8);
    ctx.lineTo(x + lean, groundY - h);
    ctx.stroke();
  }
}

function drawTree(x, baseY) {
  const s = 0.8 + ((x * 31) % 7) / 10;
  ctx.fillStyle = '#3f2a1d';
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, baseY);
  ctx.lineTo(x - 5 * s, baseY - 70 * s);
  ctx.lineTo(x + 5 * s, baseY - 70 * s);
  ctx.lineTo(x + 9 * s, baseY);
  ctx.closePath();
  ctx.fill();
  const crowns = [
    [0, -88 * s, 34 * s, '#14532d'],
    [-18 * s, -70 * s, 24 * s, '#166534'],
    [18 * s, -70 * s, 24 * s, '#166534'],
    [0, -115 * s, 26 * s, '#15803d'],
    [-12 * s, -100 * s, 18 * s, '#15803d'],
    [14 * s, -102 * s, 18 * s, '#22c55e'],
  ];
  for (const [dx, dy, r, c] of crowns) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + dx, baseY + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPumpkin(x, y, r) {
  ctx.fillStyle = '#c2410c';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, r + 2, r * 0.85 + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(124, 45, 18, 0.6)';
  ctx.lineWidth = 2;
  for (const k of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(x + k * r, y, r * 0.35, r * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 237, 213, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.4, y - r * 0.4, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.85);
  ctx.quadraticCurveTo(x + 4, y - r * 0.85 - 8, x + 8, y - r * 0.85 - 12);
  ctx.stroke();
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(x + 14, y - r * 0.85 - 10, 7, 3.5, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGhost() {
  const bob = Math.sin(ghost.t) * 8;
  const x = ghost.x;
  const y = ghost.y + bob;
  const aura = ctx.createRadialGradient(x, y, 20, x, y, 60);
  aura.addColorStop(0, 'rgba(224, 231, 255, 0.35)');
  aura.addColorStop(1, 'rgba(224, 231, 255, 0)');
  ctx.fillStyle = aura;
  ctx.fillRect(x - 60, y - 60, 120, 120);
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y, 28, Math.PI, 0);
  const bottom = y + 28;
  ctx.lineTo(x + 28, bottom);
  for (let i = 0; i < 4; i++) {
    const sx = x + 28 - (i + 1) * 14;
    ctx.quadraticCurveTo(sx + 7, bottom + 12, sx, bottom);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(x - 10, y - 4, 4, 0, Math.PI * 2);
  ctx.arc(x + 10, y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y + 8, 4, 0, Math.PI);
  ctx.stroke();
}

function drawSpookHouse(x, groundY) {
  const hBase = groundY + 6;
  ctx.fillStyle = '#44403c';
  ctx.fillRect(x + 22, hBase - 118, 12, 40);
  ctx.fillStyle = '#292524';
  ctx.fillRect(x - 40, hBase - 70, 80, 70);
  ctx.fillStyle = '#1f1d1b';
  for (let y = hBase - 68; y < hBase; y += 10) {
    ctx.fillRect(x - 40, y, 80, 2);
  }
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath();
  ctx.moveTo(x - 48, hBase - 70);
  ctx.lineTo(x, hBase - 100);
  ctx.lineTo(x + 48, hBase - 70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(x - 8, hBase - 28, 16, 28);
  const flicker = 0.7 + Math.sin(Date.now() / 150) * 0.2;
  for (const wx of [x - 28, x + 16]) {
    ctx.fillStyle = `rgba(253, 224, 71, ${flicker})`;
    ctx.fillRect(wx, hBase - 55, 12, 12);
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, hBase - 55, 12, 12);
  }
}

function drawDeadTree(x, baseY) {
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - 130);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, baseY - 80);
  ctx.lineTo(x - 30, baseY - 115);
  ctx.moveTo(x, baseY - 100);
  ctx.lineTo(x + 26, baseY - 135);
  ctx.moveTo(x, baseY - 60);
  ctx.lineTo(x + 22, baseY - 85);
  ctx.stroke();
}

function drawCobweb(x, y, size, dir) {
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * Math.PI / 2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + dir * Math.cos(a) * size, y + Math.sin(a) * size);
  }
  ctx.stroke();
  for (const r of [0.35, 0.65, 1]) {
    ctx.beginPath();
    ctx.arc(x, y, size * r, dir > 0 ? 0 : Math.PI / 2, dir > 0 ? Math.PI / 2 : Math.PI);
    ctx.stroke();
  }
}

function drawSpider(x, y) {
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y - 10);
  ctx.stroke();
  ctx.strokeStyle = '#0f0a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + i * 8, y - 6 + Math.abs(i) * 2);
    ctx.moveTo(x, y);
    ctx.lineTo(x + i * 8, y + 6 - Math.abs(i) * 2);
  }
  ctx.stroke();
  ctx.fillStyle = '#0f0a1a';
  ctx.beginPath();
  ctx.ellipse(x, y, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x - 2, y - 4, 2, 2);
  ctx.fillRect(x + 1, y - 4, 2, 2);
}

function drawFloatingGhost(x, y, s) {
  ctx.fillStyle = 'rgba(248, 250, 252, 0.75)';
  ctx.beginPath();
  ctx.arc(x, y, 14 * s, Math.PI, 0);
  const bottom = y + 16 * s;
  ctx.lineTo(x + 14 * s, bottom);
  for (let i = 0; i < 3; i++) {
    const sx = x + 14 * s - (i + 1) * 9.33 * s;
    ctx.quadraticCurveTo(sx + 4.66 * s, bottom + 8 * s, sx, bottom);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(x - 5 * s, y - 2 * s, 2 * s, 0, Math.PI * 2);
  ctx.arc(x + 5 * s, y - 2 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpooks() {
  const t = Date.now() / 1000;
  for (let i = 0; i < 6; i++) {
    const s = 0.8 + (i % 3) * 0.25;
    const x = ((t * (20 + (i % 3) * 8) + i * 220) % (canvas.width + 120)) - 60;
    const y = canvas.height * (0.18 + (i % 3) * 0.1 + Math.floor(i / 3) * 0.04) + Math.sin(t + i * 2) * 12;
    drawFloatingGhost(x, y, s);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSky();
  drawFunPark();
  drawEiffel(canvas.width * 0.1, canvas.height * 0.72);
  drawGround();
  const groundY = canvas.height * 0.72;
  for (let i = 0; i < 12; i++) {
    drawTree(canvas.width * (i + 0.5) / 12, groundY);
  }
  const pumpkins = [[0.08, 14], [0.2, 14], [0.33, 20], [0.47, 12], [0.6, 18], [0.74, 14], [0.9, 20]];
  for (const [px, r] of pumpkins) {
    drawPumpkin(canvas.width * px, groundY - 10, r);
  }
  const lakeX = canvas.width * 0.8;
  const lakeY = groundY + 50;
  ctx.fillStyle = '#422006';
  ctx.beginPath();
  ctx.ellipse(lakeX, lakeY + 3, 180, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  const water = ctx.createLinearGradient(0, lakeY - 30, 0, lakeY + 30);
  water.addColorStop(0, '#1d4ed8');
  water.addColorStop(1, '#0c1a4a');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(lakeX, lakeY, 170, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  const moonX = canvas.width * 0.85;
  ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(moonX, lakeY - 14 + i * 9, 40 - i * 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(254, 243, 199, 0.25)';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(lakeX - 60 + i * 12, lakeY + 10 + i * 3);
    ctx.lineTo(lakeX - 30 + i * 12, lakeY + 10 + i * 3);
    ctx.stroke();
  }
  const pathTop = groundY + 6;
  ctx.fillStyle = '#4a3b2a';
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.3, canvas.height);
  ctx.lineTo(canvas.width * 0.45, pathTop);
  ctx.lineTo(canvas.width * 0.55, pathTop);
  ctx.lineTo(canvas.width * 0.7, canvas.height);
  ctx.closePath();
  ctx.fill();
  for (const lx of [0.15, 0.4, 0.65, 0.9]) {
    const x = canvas.width * lx;
    const top = groundY - 90;
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x, top);
    ctx.stroke();
    const lamp = ctx.createRadialGradient(x, top, 4, x, top, 60);
    lamp.addColorStop(0, 'rgba(253, 224, 71, 0.5)');
    lamp.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(x - 60, top - 60, 120, 120);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x, top, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const hx = canvas.width * 0.32;
  const hBase = groundY + 6;
  ctx.fillStyle = '#44403c';
  ctx.fillRect(hx + 30, hBase - 136, 14, 40);
  ctx.fillStyle = '#292524';
  ctx.fillRect(hx - 55, hBase - 80, 110, 80);
  ctx.fillStyle = '#1f1d1b';
  for (let y = hBase - 78; y < hBase; y += 10) {
    ctx.fillRect(hx - 55, y, 110, 2);
  }
  ctx.fillStyle = '#3b0764';
  ctx.beginPath();
  ctx.moveTo(hx - 68, hBase - 78);
  ctx.lineTo(hx, hBase - 128);
  ctx.lineTo(hx + 68, hBase - 78);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(hx - 12, hBase - 40, 24, 40);
  ctx.fillStyle = '#57534e';
  ctx.fillRect(hx - 22, hBase - 4, 44, 6);
  const flicker = 0.7 + Math.sin(Date.now() / 120) * 0.2;
  for (const wx of [hx - 42, hx + 24]) {
    const halo = ctx.createRadialGradient(wx + 9, hBase - 54, 4, wx + 9, hBase - 54, 34);
    halo.addColorStop(0, `rgba(253, 224, 71, ${0.35 * flicker})`);
    halo.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(wx - 25, hBase - 88, 68, 68);
    ctx.fillStyle = `rgba(253, 224, 71, ${flicker})`;
    ctx.fillRect(wx, hBase - 62, 18, 16);
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, hBase - 62, 18, 16);
  }
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx + 24, hBase - 62);
  ctx.lineTo(hx + 42, hBase - 46);
  ctx.moveTo(hx + 24, hBase - 62);
  ctx.lineTo(hx + 36, hBase - 62);
  ctx.stroke();
  for (const tx of [0.05, 0.3, 0.52, 0.85]) {
    const x = canvas.width * tx;
    ctx.fillStyle = '#525252';
    ctx.beginPath();
    ctx.moveTo(x - 14, groundY + 6);
    ctx.lineTo(x - 14, groundY - 22);
    ctx.arc(x, groundY - 22, 14, Math.PI, 0);
    ctx.lineTo(x + 14, groundY + 6);
    ctx.closePath();
    ctx.fill();
  }
  const t = Date.now() / 1000;
  for (let i = 0; i < 5; i++) {
    const bx = ((t * 40 + i * 260) % (canvas.width + 80)) - 40;
    const by = canvas.height * (0.15 + (i % 3) * 0.08) + Math.sin(t + i) * 10;
    ctx.fillStyle = '#0f0a1a';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 8, by - 10, bx + 16, by);
    ctx.quadraticCurveTo(bx + 24, by - 10, bx + 32, by);
    ctx.quadraticCurveTo(bx + 16, by + 6, bx, by);
    ctx.fill();
  }
  drawDeadTree(canvas.width * 0.67, groundY + 6);
  drawSpookHouse(canvas.width * 0.95, groundY);
  drawCobweb(0, 0, 120, 1);
  drawCobweb(canvas.width, 0, 120, -1);
  drawSpider(canvas.width * 0.45, canvas.height * 0.3);
  drawSpider(canvas.width * 0.12, canvas.height * 0.4);
  drawSpider(canvas.width * 0.7, canvas.height * 0.25);
  drawSpider(canvas.width * 0.88, canvas.height * 0.42);
  drawSpooks();
  drawGhost();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
loop();
