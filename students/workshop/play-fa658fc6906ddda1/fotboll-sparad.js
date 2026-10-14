// Fotbollsvärlden: spring på planen och sparka bollen i mål.

const W = 960, H = 560;
const area = document.getElementById('canvas-area');

const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Fotbollsplan. Piltangenter flyttar, mellanslag sparkar.');
canvas.style.cssText = 'display:block;width:100%;outline:none;touch-action:none;border-radius:12px;';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const pad = document.createElement('div');
pad.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation;';
area.appendChild(pad);

const touch = { left: false, right: false, up: false, down: false };
let kickQueued = false;

function makeButton(label, onDown, onUp) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = 'min-width:56px;min-height:56px;padding:0 14px;font-size:1.5rem;border:none;border-radius:12px;background:#ffb347;color:#12301a;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;';
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); onDown(); });
  btn.addEventListener('pointerup', onUp);
  btn.addEventListener('pointerleave', onUp);
  btn.addEventListener('pointercancel', onUp);
  return btn;
}

const dirGroup = document.createElement('div');
dirGroup.style.cssText = 'display:flex;gap:8px;';
const hold = (name) => [() => { touch[name] = true; }, () => { touch[name] = false; }];
dirGroup.append(
  makeButton('◀', ...hold('left')),
  makeButton('▲', ...hold('up')),
  makeButton('▼', ...hold('down')),
  makeButton('▶', ...hold('right')),
);
pad.append(dirGroup, makeButton('⚽ Sparka', () => { kickQueued = true; }, () => {}), makeButton('🎩 Köp', buyAtShop, () => {}));

const KEY_MAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
};
const keys = { left: false, right: false, up: false, down: false };

// Tangenterna lyssnas bara på spelytan, så chatten får skriva fritt.
canvas.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'KeyR') { reset(); e.preventDefault(); return; }
  if (e.code === 'KeyE') { buyAtShop(); e.preventDefault(); return; }
  if (e.code === 'Space') {
    if (!e.repeat) kickQueued = true;
    e.preventDefault();
    return;
  }
  const k = KEY_MAP[e.code];
  if (!k) return;
  keys[k] = true;
  e.preventDefault();
});
canvas.addEventListener('keyup', (e) => {
  const k = KEY_MAP[e.code];
  if (k) keys[k] = false;
});
canvas.addEventListener('blur', () => {
  Object.keys(keys).forEach((k) => { keys[k] = false; touch[k] = false; });
});
canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const GOAL_TOP = 200, GOAL_BOTTOM = 360;
let player, ball, goals, coins, hasHat, cards;
// cards: antal kort per kortbutik, t.ex. { Fotboll: 1 }
const shop = { x: 840, y: 440, w: 90, h: 70, price: 3 };
const cardShops = [
  { name: 'Fotboll', x: 720, y: 440, w: 90, h: 70, price: 2000000, color: '#1d6fa3' },
  { name: 'Pumpa', x: 600, y: 440, w: 90, h: 70, price: 1000000, color: '#e07b1a' },
  { name: 'Clown', x: 480, y: 440, w: 90, h: 70, price: 1500000, color: '#c0392b' },
];

function reset() {
  Object.keys(keys).forEach((k) => { keys[k] = false; touch[k] = false; });
  kickQueued = false;
  player = { x: 200, y: H / 2, r: 18, vx: 0, vy: 0, fx: 1, fy: 0 };
  ball = { x: W / 2, y: H / 2, r: 10, vx: 0, vy: 0 };
  goals = 0;
  coins = 0;
  hasHat = false;
  cards = {};
}

function nearRect(r) {
  return player.x + player.r > r.x && player.x - player.r < r.x + r.w
    && player.y + player.r > r.y && player.y - player.r < r.y + r.h;
}

function buyHat() {
  if (nearRect(shop) && !hasHat && coins >= shop.price) {
    coins -= shop.price;
    hasHat = true;
  }
}

function buyCard() {
  for (const s of cardShops) {
    if (nearRect(s) && coins >= s.price) {
      coins -= s.price;
      cards[s.name] = (cards[s.name] || 0) + 1;
    }
  }
}

function buyAtShop() {
  buyHat();
  buyCard();
}

function update(dt) {
  const ix = (keys.right || touch.right ? 1 : 0) - (keys.left || touch.left ? 1 : 0);
  const iy = (keys.down || touch.down ? 1 : 0) - (keys.up || touch.up ? 1 : 0);
  if (ix || iy) {
    const len = Math.hypot(ix, iy);
    player.vx = (ix / len) * 240;
    player.vy = (iy / len) * 240;
    player.fx = ix / len;
    player.fy = iy / len;
  } else {
    player.vx = 0;
    player.vy = 0;
  }
  player.x = clamp(player.x + player.vx * dt, player.r, W - player.r);
  player.y = clamp(player.y + player.vy * dt, player.r, H - player.r);

  // Spelaren knuffar bollen när de krockar.
  const dx = ball.x - player.x, dy = ball.y - player.y;
  const d = Math.hypot(dx, dy) || 1;
  const minD = player.r + ball.r;
  if (d < minD) {
    const nx = dx / d, ny = dy / d;
    ball.x = player.x + nx * minD;
    ball.y = player.y + ny * minD;
    ball.vx = nx * 180 + player.vx * 0.8;
    ball.vy = ny * 180 + player.vy * 0.8;
  }

  // Sparka: bollen får fart i den riktning spelaren tittar, om den är nära.
  if (kickQueued) {
    kickQueued = false;
    if (d < minD + 16) {
      ball.vx = player.fx * 600;
      ball.vy = player.fy * 600;
    }
  }

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  const damp = Math.pow(0.45, dt);
  ball.vx *= damp;
  ball.vy *= damp;

  if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy) * 0.8; }
  if (ball.y > H - ball.r) { ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy) * 0.8; }

  const inGoalMouth = ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM;
  if (ball.x < ball.r && !inGoalMouth) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.8; }
  if (ball.x > W - ball.r && !inGoalMouth) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * 0.8; }
  if (ball.x < -ball.r || ball.x > W + ball.r) {
    goals++;
    coins++;
    ball = { x: W / 2, y: H / 2, r: 10, vx: 0, vy: 0 };
  }
}

let width, height, dpr, scale, ox, oy;

function resize() {
  dpr = window.devicePixelRatio || 1;
  width = area.clientWidth || window.innerWidth;
  const top = canvas.getBoundingClientRect().top;
  height = Math.max(320, window.innerHeight - top - 110);
  canvas.style.height = height + 'px';
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  scale = Math.min(width / W, height / H);
  ox = (width - W * scale) / 2;
  oy = (height - H * scale) / 2;
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0b1a0e';
  ctx.fillRect(0, 0, width, height);

  // Gräs med ränder över hela spelytan, även utanför planens linjer.
  const stripeW = (W / 8) * scale;
  const firstX = ox - Math.ceil(ox / stripeW) * stripeW;
  for (let x = firstX; x < width; x += stripeW) {
    const k = Math.round((x - ox) / stripeW);
    ctx.fillStyle = k % 2 ? '#2f7a3a' : '#338a40';
    ctx.fillRect(x, 0, stripeW, height);
  }

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

  // Linjer.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.beginPath();
  ctx.moveTo(W / 2, 6); ctx.lineTo(W / 2, H - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  // Mål.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-6, GOAL_TOP, 12, GOAL_BOTTOM - GOAL_TOP);
  ctx.fillRect(W - 6, GOAL_TOP, 12, GOAL_BOTTOM - GOAL_TOP);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(-6, GOAL_TOP, 12, GOAL_BOTTOM - GOAL_TOP);
  ctx.strokeRect(W - 6, GOAL_TOP, 12, GOAL_BOTTOM - GOAL_TOP);

  // Boll.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Spelare och riktning.
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(player.x + player.fx * 10, player.y + player.fy * 10, 5, 0, Math.PI * 2);
  ctx.fill();
  if (hasHat) {
    ctx.fillStyle = '#2a1450';
    ctx.fillRect(player.x - 14, player.y - player.r - 8, 28, 8);
    ctx.fillRect(player.x - 8, player.y - player.r - 18, 16, 12);
  }

  // Butik.
  ctx.fillStyle = '#7a3b9e';
  ctx.fillRect(shop.x, shop.y, shop.w, shop.h);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(shop.x, shop.y, shop.w, 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Butik', shop.x + 14, shop.y + 36);
  ctx.fillText(hasHat ? 'Såld!' : `${shop.price} mynt`, shop.x + 6, shop.y + 56);

  // Kortbutiker.
  for (const s of cardShops) {
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(s.x, s.y, s.w, 12);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(s.name, s.x + 10, s.y + 36);
    ctx.fillText(`${(s.price / 1000000).toString().replace('.', ',')} M mynt`, s.x + 4, s.y + 56);
  }

  // Text.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  const cardText = Object.entries(cards).map(([n, c]) => `${n} ${c}`).join(', ');
  ctx.fillText(`Mål: ${goals}   Mynt: ${coins}   Kort: ${cardText || '0'}`, 16, 32);
  ctx.font = '14px sans-serif';
  ctx.fillText('Piltangenter springer, mellanslag sparkar, E köper vid butiken, R startar om', 16, 54);
}

let last;
function frame(t) {
  const dt = last === undefined ? 0 : Math.min((t - last) / 1000, 0.05);
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
reset();
requestAnimationFrame(frame);
