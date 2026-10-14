// Spindelhoppet - Canvas 2D: spindeln hoppar mellan spindelnät som kommer in från höger.

const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Spindelhoppet-spelplan');
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.outline = 'none';
canvas.style.touchAction = 'manipulation';
canvas.style.webkitTapHighlightColor = 'transparent';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

let W = 0;
let H = 0;
const GRAVITY = 1800;
const JUMP_SPEED = -820;
const SCROLL_SPEED = 180;
const WEB_WIDTH = 110;
const spider = { x: 0, y: 0, vy: 0, size: 44, onGround: false };
let webs = [];
let score = 0;
let lastWeb = null;
let nextWebX = 0;
let witches = [];
let nextWitchIn = 2;

function groundY() {
  return H - 40;
}

function resetGame() {
  spider.x = W * 0.3;
  spider.y = groundY() - spider.size / 2;
  spider.vy = 0;
  spider.onGround = true;
  webs = [];
  witches = [];
  nextWitchIn = 2;
  score = 0;
  lastWeb = null;
  nextWebX = W + 60;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = area.clientWidth || window.innerWidth;
  H = Math.max(360, Math.round(window.innerHeight * 0.6));
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  resetGame();
}

function jump() {
  if (spider.onGround) {
    spider.vy = JUMP_SPEED;
    spider.onGround = false;
  }
}

canvas.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    jump();
  } else if (e.code === 'KeyR') {
    resetGame();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  canvas.focus();
  jump();
});

function spawnWebs() {
  while (nextWebX < W + 40) {
    const minY = groundY() - 170;
    const maxY = groundY() - 90;
    const y = minY + Math.random() * (maxY - minY);
    webs.push({ x: nextWebX, y, w: WEB_WIDTH, candy: Math.random() < 0.7 });
    nextWebX += WEB_WIDTH + 130 + Math.random() * 90;
  }
}

function update(dt) {
  const prevBottom = spider.y + spider.size / 2;

  for (const w of webs) w.x -= SCROLL_SPEED * dt;
  webs = webs.filter((w) => w.x + w.w > -10);
  nextWebX -= SCROLL_SPEED * dt;
  spawnWebs();

  nextWitchIn -= dt;
  if (nextWitchIn <= 0) {
    witches.push({ x: W + 30, y: 70 + Math.random() * (H * 0.35) });
    nextWitchIn = 2 + Math.random() * 3;
  }
  for (const wt of witches) wt.x -= 140 * dt;
  witches = witches.filter((wt) => wt.x > -40);
  for (const wt of witches) {
    if (Math.hypot(spider.x - wt.x, spider.y - wt.y) < spider.size / 2 + 18) {
      resetGame();
      break;
    }
  }

  spider.vy += GRAVITY * dt;
  spider.y += spider.vy * dt;

  let landed = false;
  const r = spider.size / 2;
  const bottom = spider.y + r;

  for (const w of webs) {
    if (!w.candy) continue;
    const cx = w.x + w.w / 2;
    const cy = w.y - 14;
    if (Math.hypot(spider.x - cx, spider.y - cy) < r + 10) {
      w.candy = false;
      score += 5;
    }
  }

  if (spider.vy >= 0) {
    for (const w of webs) {
      const overlapX = spider.x + r * 0.6 > w.x && spider.x - r * 0.6 < w.x + w.w;
      if (overlapX && prevBottom <= w.y + 2 && bottom >= w.y) {
        spider.y = w.y - r;
        spider.vy = 0;
        landed = true;
        if (w !== lastWeb) {
          score++;
          lastWeb = w;
        }
        break;
      }
    }
  }

  const floor = groundY() - r;
  if (spider.y >= floor) {
    spider.y = floor;
    spider.vy = 0;
    landed = true;
  }

  spider.onGround = landed;
}

function drawBackground() {
  ctx.fillStyle = '#1a1027';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f5f0d0';
  ctx.beginPath();
  ctx.arc(W * 0.82, H * 0.18, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d1b3d';
  ctx.fillRect(0, groundY(), W, H - groundY());
}

function drawWebs() {
  for (const w of webs) {
    ctx.strokeStyle = '#e8e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w.x, w.y);
    ctx.lineTo(w.x + w.w, w.y);
    ctx.stroke();
    for (let i = 0; i <= 4; i++) {
      const sx = w.x + (w.w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(sx, w.y);
      ctx.lineTo(w.x + w.w / 2, w.y + 22);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w.x + w.w / 2, w.y + 22);
    ctx.lineTo(w.x + w.w / 2, w.y + 40);
    ctx.stroke();
    if (w.candy) {
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y - 14, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y - 14, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSpider() {
  const { x, y, size } = spider;
  const r = size / 2;
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    const legY = y + i * 5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, legY);
    ctx.lineTo(x - r * 1.2, legY + i * 6 - 6);
    ctx.moveTo(x + r * 0.4, legY);
    ctx.lineTo(x + r * 1.2, legY + i * 6 - 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.8, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - r * 0.75, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff3b3b';
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.85, 3, 0, Math.PI * 2);
  ctx.arc(x + r * 0.2, y - r * 0.85, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawWitches() {
  for (const wt of witches) {
    const { x, y } = wt;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 8);
    ctx.lineTo(x + 14, y - 8);
    ctx.lineTo(x, y - 42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y + 4, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7CFC00';
    ctx.beginPath();
    ctx.arc(x, y + 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  drawBackground();
  drawWebs();
  drawWitches();
  drawSpider();
  ctx.fillStyle = '#ff7a1a';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Godis: ' + score, 16, 30);
  ctx.textAlign = 'center';
  ctx.fillText('Tryck eller tryck mellanslag för att hoppa', W / 2, 30);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(loop);
