const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Five Nights in Halloween');
area.appendChild(canvas);
document.body.classList.add('playing');
const ctx = canvas.getContext('2d');

const NIGHTS = 5;
const NIGHT_LEN = 40;
let W = 0;
let H = 0;
let game = null;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);

function newGame() {
  game = {
    phase: 'intro',
    phaseT: 0,
    introText: 'Five Nights in Halloween',
    night: 1,
    time: 0,
    power: 100,
    doors: { left: true, right: true },
    closedT: { left: 0, right: 0 },
    ghosts: [],
    spawnT: 3,
    msg: '',
    msgT: 0,
    overText: '',
    overWin: false
  };
}

function toggleDoor(side) {
  if (game.phase !== 'play' || game.power <= 0) return;
  game.doors[side] = !game.doors[side];
}

function endGame(text, win, scare) {
  game.phase = 'over';
  game.overText = text;
  game.overWin = win;
  game.scareT = scare ? 1.2 : 0;
}

function spawnGhost() {
  const side = Math.random() < 0.5 ? 'left' : 'right';
  if (game.ghosts.some((gh) => gh.side === side)) return;
  game.ghosts.push({ side, t: 0, fast: Math.random() < 0.35 });
}

function update(dt) {
  const g = game;
  g.phaseT += dt;
  if (g.msgT > 0) g.msgT -= dt;
  if (g.scareT > 0) g.scareT -= dt;

  if (g.phase === 'intro') {
    if (g.phaseT >= 2.5) {
      g.phase = 'play';
      g.phaseT = 0;
    }
    return;
  }
  if (g.phase !== 'play') return;

  g.time += dt;
  const closed = (g.doors.left ? 1 : 0) + (g.doors.right ? 1 : 0);
  g.power = Math.max(0, g.power - (0.5 + closed * 0.7) * dt);
  if (g.power <= 0) {
    endGame('Strömmen tog slut i mörkret...', false);
    return;
  }

  for (const side of ['left', 'right']) {
    g.closedT[side] = g.doors[side] ? g.closedT[side] + dt : 0;
    if (g.closedT[side] > 10 && !g.ghosts.some((gh) => gh.side === side)) {
      g.ghosts.push({ side, t: 0, fast: true, rush: true });
      g.closedT[side] = 0;
    }
  }

  g.spawnT -= dt;
  if (g.spawnT <= 0) {
    spawnGhost();
    g.spawnT = Math.max(2, 6 - g.night * 0.8) * (0.7 + Math.random() * 0.6);
  }

  const speed = 0.07 + g.night * 0.015;
  g.ghosts = g.ghosts.filter((gh) => {
    gh.t += speed * (gh.fast ? 3.2 : 1) * dt;
    if (gh.t < 1) return true;
    if (gh.rush) {
      g.doors[gh.side] = false;
      g.power = Math.max(0, g.power - 25);
      g.closedT[gh.side] = 0;
      g.msg = 'Dörren gick sönder!';
      g.msgT = 1.5;
      return false;
    }
    if (g.doors[gh.side]) {
      g.msg = 'Dörren höll!';
      g.msgT = 1.2;
      return false;
    }
    game.scareFace = gh.fast ? 'pumpa' : 'baby';
    endGame(gh.fast ? 'Pumpan kom in i rummet...' : 'Vampyrbebisen kom in i rummet...', false, true);
    return true;
  });
  if (g.phase !== 'play') return;

  if (g.time >= NIGHT_LEN) {
    if (g.night >= NIGHTS) {
      endGame('Du klarade alla fem nätter!', true);
      return;
    }
    g.night++;
    g.time = 0;
    g.power = 100;
    g.ghosts = [];
    g.doors = { left: true, right: true };
    g.spawnT = 3;
    g.introText = 'Natt ' + g.night;
    g.phase = 'intro';
    g.phaseT = 0;
  }
}

function drawVampireBaby(x, y, s) {
  ctx.fillStyle = '#7a0f1f';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.9, y + s * 0.9);
  ctx.lineTo(x, y - s * 0.2);
  ctx.lineTo(x + s * 0.9, y + s * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e9e1f2';
  ctx.beginPath();
  ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a0a14';
  ctx.beginPath();
  ctx.arc(x - s * 0.5, y - s * 0.7, s * 0.25, 0, Math.PI * 2);
  ctx.arc(x + s * 0.5, y - s * 0.7, s * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e02020';
  ctx.beginPath();
  ctx.arc(x - s * 0.22, y - s * 0.1, s * 0.12, 0, Math.PI * 2);
  ctx.arc(x + s * 0.22, y - s * 0.1, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.22, y + s * 0.2);
  ctx.lineTo(x - s * 0.14, y + s * 0.2);
  ctx.lineTo(x - s * 0.18, y + s * 0.4);
  ctx.closePath();
  ctx.moveTo(x + s * 0.22, y + s * 0.2);
  ctx.lineTo(x + s * 0.14, y + s * 0.2);
  ctx.lineTo(x + s * 0.18, y + s * 0.4);
  ctx.closePath();
  ctx.fill();
}

function drawButton(x, y, w, h, label, closed, base) {
  ctx.fillStyle = closed ? '#2f6b4f' : '#8a2b3a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(245,230,168,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = '#f5e6a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${base * 0.04}px sans-serif`;
  ctx.fillText(label + (closed ? ' — stängd' : ' — öppen'), x + w / 2, y + h / 2);
}

function draw() {
  const g = game;
  const base = Math.min(W, H);
  const cx = W / 2;
  const dw = Math.min(W * 0.14, 130);
  const doorY = H * 0.2;
  const doorH = H * 0.5;
  const btnY = H * 0.76;

  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#120a22');
  wall.addColorStop(1, '#3b1f4a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  const flicker = 0.3 + 0.08 * Math.sin(performance.now() / 110) + (Math.random() < 0.03 ? -0.2 : 0);
  const glow = ctx.createRadialGradient(cx, H * 0.09, 0, cx, H * 0.09, base * 0.25);
  glow.addColorStop(0, `rgba(245,230,168,${flicker})`);
  glow.addColorStop(1, 'rgba(245,230,168,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H * 0.5);

  const vignette = ctx.createRadialGradient(cx, H / 2, base * 0.3, cx, H / 2, Math.max(W, H) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  if (Math.sin(performance.now() / 900) > 0.97) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = '#f5e6a8';
  ctx.beginPath();
  ctx.arc(cx, H * 0.09, base * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0d0716';
  ctx.fillRect(0, doorY + doorH, W, H - (doorY + doorH));
  ctx.fillStyle = 'rgba(245,230,168,0.06)';
  ctx.fillRect(0, doorY + doorH, W, 3);

  drawCobweb(0, 0, 1, base * 0.2);
  drawCobweb(W, 0, -1, base * 0.2);
  drawBat(W * 0.2, H * 0.2, base * 0.03);
  drawBat(W * 0.8, H * 0.15, base * 0.025);
  drawBat(W * 0.65, H * 0.28, base * 0.02);

  for (const side of ['left', 'right']) {
    if (!g.doors[side]) {
      const x = side === 'left' ? 0 : W - dw;
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.fillRect(x, doorY, dw, doorH);
      ctx.strokeStyle = 'rgba(245,230,168,0.9)';
      ctx.lineWidth = 6;
      ctx.strokeRect(x + 3, doorY + 3, dw - 6, doorH - 6);
    }
  }

  for (const gh of g.ghosts) {
    const s = base * 0.08 * (0.25 + 0.75 * gh.t);
    const edge = gh.side === 'left' ? dw / 2 : W - dw / 2;
    const x = cx + (edge - cx) * gh.t;
    const y = doorY + doorH * 0.5;
    if (g.doors[gh.side]) drawEyes(x, y, s);
    else if (gh.fast) drawPumpkinMonster(x, y, s);
    else drawVampireBaby(x, y, s);
  }

  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(cx - W * 0.2, H * 0.6, W * 0.4, H * 0.04);
  drawCandle(cx - W * 0.15, H * 0.6);
  drawCandle(cx + W * 0.15, H * 0.6);

  for (const side of ['left', 'right']) {
    if (!g.doors[side]) continue;
    ctx.globalAlpha = 0.6;
    const ew = dw * 1.12;
    const eh = doorH * 1.08;
    const ey = doorY - (eh - doorH) / 2;
    const x = side === 'left' ? 0 : W - ew;
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(x, ey, ew, eh);
    ctx.strokeStyle = 'rgba(245,230,168,0.9)';
    ctx.lineWidth = 6;
    ctx.strokeRect(x + 3, ey + 3, ew - 6, eh - 6);
    ctx.fillStyle = '#f5c542';
    const kx = side === 'left' ? x + dw - 14 : x + 14;
    ctx.beginPath();
    ctx.arc(kx, doorY + doorH * 0.5, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  if (g.phase === 'play') {
    drawButton(10, btnY, W / 2 - 16, H - btnY - 10, '← Vänster dörr', !g.doors.left, base);
    drawButton(W / 2 + 6, btnY, W / 2 - 16, H - btnY - 10, 'Höger dörr →', !g.doors.right, base);
  }

  const bw = Math.min(200, W * 0.3);
  const pct = g.power / 100;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#f5e6a8';
  ctx.font = `bold ${base * 0.045}px sans-serif`;
  ctx.fillText(`Natt ${g.night} / ${NIGHTS}`, 16, 14);
  ctx.fillStyle = '#333';
  ctx.fillRect(16, 14 + base * 0.06, bw, 10);
  ctx.fillStyle = '#e8b04a';
  ctx.fillRect(16, 14 + base * 0.06, bw * (g.time / NIGHT_LEN), 10);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#333';
  ctx.fillRect(W - bw - 16, 18, bw, 14);
  ctx.fillStyle = pct > 0.3 ? '#7bd389' : '#ff5a4e';
  ctx.fillRect(W - bw - 16, 18, bw * pct, 14);
  ctx.fillStyle = '#f5e6a8';
  ctx.font = `${base * 0.03}px sans-serif`;
  ctx.fillText('Ström', W - 16, 38);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (g.msgT > 0) {
    ctx.fillStyle = '#f5e6a8';
    ctx.font = `bold ${base * 0.05}px sans-serif`;
    ctx.fillText(g.msg, cx, H * 0.7);
  }
  if (g.phase === 'intro') {
    ctx.fillStyle = '#ff9d2e';
    ctx.font = `bold ${base * 0.09}px sans-serif`;
    ctx.fillText(g.introText, cx, H * 0.4);
  }
  if (g.phase === 'over' && g.scareT > 0) {
    const pumpa = g.scareFace === 'pumpa';
    ctx.fillStyle = pumpa
      ? `rgba(255,110,20,${0.5 + 0.5 * Math.random()})`
      : `rgba(160,0,0,${0.5 + 0.5 * Math.random()})`;
    ctx.fillRect(0, 0, W, H);
    const sx = cx + (Math.random() - 0.5) * 12;
    if (pumpa) drawPumpkinMonster(sx, H * 0.5, base * 0.45);
    else drawVampireBaby(sx, H * 0.5, base * 0.45);
  } else if (g.phase === 'over') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = g.overWin ? '#7bd389' : '#ff5a4e';
    ctx.font = `bold ${base * 0.07}px sans-serif`;
    ctx.fillText(g.overText, cx, H * 0.4);
    ctx.fillStyle = '#f5e6a8';
    ctx.font = `${base * 0.04}px sans-serif`;
    ctx.fillText('Tryck här eller tryck R för att börja om', cx, H * 0.55);
  }
}

function drawPumpkinMonster(x, y, s) {
  ctx.fillStyle = '#ff7a18';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.7, s * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f7d2a';
  ctx.fillRect(x - s * 0.06, y - s * 0.75, s * 0.12, s * 0.2);
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.4, y - s * 0.2);
  ctx.lineTo(x - s * 0.1, y - s * 0.2);
  ctx.lineTo(x - s * 0.25, y + s * 0.05);
  ctx.moveTo(x + s * 0.1, y - s * 0.2);
  ctx.lineTo(x + s * 0.4, y - s * 0.2);
  ctx.lineTo(x + s * 0.25, y + s * 0.05);
  ctx.fill();
  ctx.fillRect(x - s * 0.35, y + s * 0.2, s * 0.7, s * 0.18);
}

function drawEyes(x, y, s) {
  ctx.save();
  ctx.fillStyle = '#ff2020';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = s * 0.6;
  ctx.beginPath();
  ctx.arc(x - s * 0.25, y - s * 0.1, s * 0.1, 0, Math.PI * 2);
  ctx.arc(x + s * 0.25, y - s * 0.1, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBat(x, y, s) {
  ctx.fillStyle = '#0b0610';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.3, s * 0.4, 0, 0, Math.PI * 2);
  ctx.moveTo(x - s * 0.2, y);
  ctx.lineTo(x - s, y - s * 0.5);
  ctx.lineTo(x - s * 0.7, y + s * 0.3);
  ctx.lineTo(x - s * 0.2, y + s * 0.1);
  ctx.moveTo(x + s * 0.2, y);
  ctx.lineTo(x + s, y - s * 0.5);
  ctx.lineTo(x + s * 0.7, y + s * 0.3);
  ctx.lineTo(x + s * 0.2, y + s * 0.1);
  ctx.fill();
}

function drawCobweb(x, y, dir, s) {
  ctx.strokeStyle = 'rgba(220,220,235,0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const a = (Math.PI / 2) * (i / 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dir * Math.cos(a) * s, y + Math.sin(a) * s);
    ctx.stroke();
  }
  for (const f of [0.35, 0.65, 1]) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (Math.PI / 2) * (i / 8);
      const px = x + dir * Math.cos(a) * s * f;
      const py = y + Math.sin(a) * s * f;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

function drawCandle(x, y) {
  const h = H * 0.05;
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(x - 4, y - h, 8, h);
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.ellipse(x, y - h - 7, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function doorZoneAt(x, y) {
  const dw = Math.min(W * 0.14, 130);
  const doorY = H * 0.2;
  const doorH = H * 0.5;
  if (y < doorY || y > doorY + doorH) return null;
  if (x < dw) return 'left';
  if (x > W - dw) return 'right';
  return null;
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.focus({ preventScroll: true });
  if (game.phase === 'over' && game.scareT <= 0) {
    newGame();
    return;
  }
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (y >= H * 0.76) {
    toggleDoor(x < W / 2 ? 'left' : 'right');
  } else {
    const side = doorZoneAt(x, y);
    if (side) toggleDoor(side);
  }
});

canvas.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    toggleDoor('left');
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    toggleDoor('right');
  } else if (game.phase === 'over' && game.scareT <= 0 && ['r', 'R', ' ', 'Enter'].includes(e.key)) {
    e.preventDefault();
    newGame();
  }
});

resize();
newGame();
canvas.focus({ preventScroll: true });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
