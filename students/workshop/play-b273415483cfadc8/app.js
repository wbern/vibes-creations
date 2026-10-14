// Halloween-spelet: fånga godis i korgen, undvik spöken
const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Spelplan. Dra för att flytta korgen och fånga godis.');
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

let W = 360, H = 480;
const basket = { x: 180, w: 90, y: 0 };
const held = { left: false, right: false };
const game = {};
let dragging = false;

const HS_KEY = 'hajskolan-highscores';
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(HS_KEY)) || [];
  } catch (e) {
    return [];
  }
}
let highScores = loadScores();

function recordScore(score) {
  highScores.push(score);
  highScores.sort((a, b) => b - a);
  highScores = highScores.slice(0, 5);
  try {
    localStorage.setItem(HS_KEY, JSON.stringify(highScores));
  } catch (e) {}
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = Math.max(320, area.getBoundingClientRect().width);
  H = Math.max(360, window.innerHeight * 0.7);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  basket.y = H - 40;
  clampBasket();
}

function clampBasket() {
  basket.x = Math.min(Math.max(basket.x, basket.w / 2), W - basket.w / 2);
}

function reset() {
  game.score = 0;
  game.lives = 3;
  game.items = [];
  game.spawnT = 0.6;
  game.powerT = 8;
  game.over = false;
  game.paused = false;
  basket.x = W / 2;
}

function spawn() {
  const roll = Math.random();
  game.items.push({
    kind: roll < 0.2 ? 'spöke' : roll < 0.3 ? 'fladdermus' : roll < 0.55 ? 'pumpa' : 'godis',
    x: 30 + Math.random() * (W - 60),
    y: -20,
    vy: 120 + Math.random() * 80 + game.score * 5,
  });
}

function update(dt) {
  if (game.over || game.paused) return;
  if (held.left) basket.x -= 420 * dt;
  if (held.right) basket.x += 420 * dt;
  clampBasket();

  game.spawnT -= dt;
  if (game.spawnT <= 0) {
    spawn();
    game.spawnT = Math.max(0.35, 1.0 - game.score * 0.02);
  }

  game.powerT -= dt;
  if (game.powerT <= 0) {
    game.powerT = 8;
    game.items.push({ kind: 'power', x: 30 + Math.random() * (W - 60), y: -20, vy: 140 });
  }

  for (let i = game.items.length - 1; i >= 0; i--) {
    const it = game.items[i];
    it.y += it.vy * dt;
    const caught = Math.abs(it.x - basket.x) < basket.w / 2 && Math.abs(it.y - basket.y) < 20;
    if (caught) {
      game.items.splice(i, 1);
      if (it.kind === 'godis') {
        game.score++;
      } else if (it.kind === 'pumpa') {
        game.score += 2;
      } else if (it.kind === 'fladdermus') {
        game.score--;
      } else if (it.kind === 'power') {
        game.lives = Math.min(5, game.lives + 1);
      } else {
        game.lives--;
        if (game.lives <= 0) {
          game.over = true;
          recordScore(game.score);
        }
      }
    } else if (it.y > H + 30) {
      game.items.splice(i, 1);
    }
  }
}

function drawCandy(x, y) {
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 7, y); ctx.lineTo(x - 18, y - 8); ctx.lineTo(x - 18, y + 8);
  ctx.moveTo(x + 7, y); ctx.lineTo(x + 18, y - 8); ctx.lineTo(x + 18, y + 8);
  ctx.fill();
}

function drawGhost(x, y) {
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y - 4, 16, Math.PI, 0);
  ctx.lineTo(x + 16, y + 14);
  ctx.lineTo(x + 8, y + 8);
  ctx.lineTo(x, y + 14);
  ctx.lineTo(x - 8, y + 8);
  ctx.lineTo(x - 16, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e1033';
  ctx.beginPath();
  ctx.arc(x - 6, y - 4, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPumpkin(x, y) {
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(x - 2, y - 19, 4, 6);
  ctx.fillStyle = '#1a202c';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 3); ctx.lineTo(x - 4, y - 7); ctx.lineTo(x - 2, y - 3);
  ctx.moveTo(x + 8, y - 3); ctx.lineTo(x + 4, y - 7); ctx.lineTo(x + 2, y - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y + 4, 4, 0, Math.PI);
  ctx.fill();
}

function drawBat(x, y) {
  ctx.fillStyle = '#1e1033';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 10, y - 14, x - 22, y - 4);
  ctx.quadraticCurveTo(x - 14, y + 2, x - 8, y + 4);
  ctx.quadraticCurveTo(x - 4, y + 10, x, y + 4);
  ctx.quadraticCurveTo(x + 4, y + 10, x + 8, y + 4);
  ctx.quadraticCurveTo(x + 14, y + 2, x + 22, y - 4);
  ctx.quadraticCurveTo(x + 10, y - 14, x, y);
  ctx.fill();
}

function drawPauseButton() {
  const x = W / 2 - 18;
  ctx.fillStyle = 'rgba(253, 230, 138, 0.25)';
  ctx.fillRect(x, 8, 36, 28);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(x + 11, 14, 4, 16);
  ctx.fillRect(x + 21, 14, 4, 16);
}

function drawPower(x, y) {
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e1033';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('+1', x, y + 5);
}

function drawBasket() {
  const left = basket.x - basket.w / 2;
  const top = basket.y - 14;
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left + basket.w, top);
  ctx.lineTo(left + basket.w - 10, top + 34);
  ctx.lineTo(left + 10, top + 34);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1e1033');
  sky.addColorStop(1, '#4c1d95');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(W - 50, 50, 26, 0, Math.PI * 2);
  ctx.fill();

  for (const it of game.items) {
    if (it.kind === 'godis') drawCandy(it.x, it.y);
    else if (it.kind === 'pumpa') drawPumpkin(it.x, it.y);
    else if (it.kind === 'fladdermus') drawBat(it.x, it.y);
    else if (it.kind === 'power') drawPower(it.x, it.y);
    else drawGhost(it.x, it.y);
  }

  drawBasket();

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Godis: ' + game.score, 12, 26);
  ctx.textAlign = 'right';
  ctx.fillText('Liv: ' + '❤'.repeat(Math.max(0, game.lives)), W - 12, 26);

  drawPauseButton();
  if (game.paused && !game.over) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Paus', W / 2, H / 2 - 10);
    ctx.font = '18px sans-serif';
    ctx.fillText('Tryck för att fortsätta', W / 2, H / 2 + 24);
  }

  if (game.over) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Spökena fick dig!', W / 2, H / 2 - 10);
    ctx.fillStyle = '#fde68a';
    ctx.font = '18px sans-serif';
    ctx.fillText('Godis: ' + game.score + '. Tryck för att spela igen.', W / 2, H / 2 + 24);
    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Topplista', W / 2, H / 2 + 60);
    ctx.fillStyle = '#fde68a';
    ctx.font = '18px sans-serif';
    highScores.forEach((s, i) => {
      ctx.fillText((i + 1) + '. ' + s, W / 2, H / 2 + 88 + i * 24);
    });
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function moveBasketTo(e) {
  const r = canvas.getBoundingClientRect();
  basket.x = e.clientX - r.left;
  clampBasket();
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  canvas.focus();
  if (game.over) { reset(); return; }
  const r = canvas.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;
  if (game.paused) { game.paused = false; return; }
  if (px > W / 2 - 18 && px < W / 2 + 18 && py > 8 && py < 36) { game.paused = true; return; }
  dragging = true;
  canvas.setPointerCapture(e.pointerId);
  moveBasketTo(e);
});

canvas.addEventListener('pointermove', e => {
  if (dragging && !game.over && !game.paused) moveBasketTo(e);
});

function endDrag() {
  dragging = false;
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { held.left = true; e.preventDefault(); }
  else if (e.key === 'ArrowRight') { held.right = true; e.preventDefault(); }
  else if ((e.key === 'p' || e.key === 'P') && !game.over) game.paused = !game.paused;
  else if ((e.key === ' ' || e.key === 'Enter') && game.over) { e.preventDefault(); reset(); }
});

canvas.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') held.left = false;
  else if (e.key === 'ArrowRight') held.right = false;
});

canvas.addEventListener('blur', () => { held.left = false; held.right = false; });

window.addEventListener('resize', resize);

resize();
reset();
requestAnimationFrame(now => { last = now; loop(now); });
