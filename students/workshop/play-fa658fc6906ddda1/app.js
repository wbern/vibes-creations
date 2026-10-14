// Spindelhoppet: spindeln hoppar av sig självt mellan spindelnäten. Styr åt sidorna.

const W = 360, H = 600;
const GRAVITY = 1200, BOUNCE = 720, MOVE = 180;
const WEB_W = 90;

const area = document.getElementById('canvas-area');

const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Spindelhoppet. Piltangenter styr, spindeln hoppar själv.');
canvas.style.cssText = 'display:block;width:100%;outline:none;touch-action:none;border-radius:12px;background:#120a1f;';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const pad = document.createElement('div');
pad.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation;';
area.appendChild(pad);

const touch = { left: false, right: false };
const keys = { left: false, right: false };

function makeButton(label, onDown, onUp) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = 'min-width:56px;min-height:56px;padding:0 14px;font-size:1.5rem;border:none;border-radius:12px;background:#ff8c1a;color:#120a1f;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;';
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); onDown(); });
  btn.addEventListener('pointerup', onUp);
  btn.addEventListener('pointerleave', onUp);
  btn.addEventListener('pointercancel', onUp);
  return btn;
}

const moveGroup = document.createElement('div');
moveGroup.style.cssText = 'display:flex;gap:10px;';
moveGroup.append(
  makeButton('◀', () => { touch.left = true; }, () => { touch.left = false; }),
  makeButton('▶', () => { touch.right = true; }, () => { touch.right = false; }),
);
pad.append(moveGroup, makeButton('🔄 Börja om', () => reset(), () => {}));

const KEY_MAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };

// Tangenterna lyssnas bara på spelytan, så chatten får skriva fritt.
canvas.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'KeyR') { reset(); e.preventDefault(); return; }
  const k = KEY_MAP[e.code];
  if (!k) return;
  keys[k] = true;
  e.preventDefault();
});
canvas.addEventListener('keyup', (e) => {
  const k = KEY_MAP[e.code];
  if (k) keys[k] = false;
});
canvas.addEventListener('blur', () => { keys.left = keys.right = false; touch.left = touch.right = false; });
canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));

let player, webs, cameraY, highestY, highestX, score, playing;

function reset() {
  keys.left = keys.right = false;
  touch.left = touch.right = false;
  const floorY = H - 60;
  player = { x: W / 2 - 14, y: floorY - 28, w: 28, h: 28, vy: -BOUNCE };
  webs = [{ x: W / 2 - 60, y: floorY, w: 120 }];
  highestY = floorY;
  highestX = W / 2;
  cameraY = 0;
  score = 0;
  playing = true;
  fillWebs();
}

function fillWebs() {
  while (highestY > cameraY - H) {
    highestY -= 65 + Math.random() * 15;
    highestX = Math.max(WEB_W / 2, Math.min(W - WEB_W / 2,
      highestX + (Math.random() * 2 - 1) * 65));
    webs.push({ x: highestX - WEB_W / 2, y: highestY, w: WEB_W });
  }
  webs = webs.filter((p) => p.y < cameraY + H + 140);
}

function stepWorld(dt) {
  if (!playing) return;
  const oldBottom = player.y + player.h;
  const steer = (keys.right || touch.right ? 1 : 0) - (keys.left || touch.left ? 1 : 0);
  player.x += steer * MOVE * dt;
  if (player.x > W) player.x = -player.w;
  if (player.x + player.w < 0) player.x = W;

  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;
  if (player.vy > 0) {
    const landing = webs
      .filter((p) => oldBottom <= p.y && player.y + player.h >= p.y
        && player.x + player.w > p.x && player.x < p.x + p.w)
      .sort((a, b) => a.y - b.y)[0];
    if (landing) {
      player.y = landing.y - player.h;
      player.vy = -BOUNCE;
    }
  }

  cameraY = Math.min(cameraY, player.y - H * 0.4);
  score = Math.max(score, Math.floor(-cameraY / 10));
  fillWebs();
  if (player.y > cameraY + H + 60) playing = false;
}

let width, height, dpr, scale, ox, oy;

function resize() {
  dpr = window.devicePixelRatio || 1;
  width = area.clientWidth || window.innerWidth;
  const top = canvas.getBoundingClientRect().top;
  height = Math.max(360, window.innerHeight - top - 110);
  canvas.style.height = height + 'px';
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  scale = Math.min(width / W, height / H);
  ox = (width - W * scale) / 2;
  oy = (height - H * scale) / 2;
}

function drawSpider(x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -1.5; i <= 1.5; i++) {
    const ly = cy + i * 6;
    ctx.moveTo(cx - 6, cy); ctx.lineTo(cx - 20, ly - 6);
    ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + 20, ly - 6);
  }
  ctx.stroke();
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#2a1450');
  sky.addColorStop(1, '#0a0514');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

  for (const p of webs) {
    const sy = p.y - cameraY;
    ctx.strokeStyle = 'rgba(230,230,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, sy); ctx.lineTo(p.x + p.w, sy);
    ctx.moveTo(p.x + p.w / 2, sy - 8); ctx.lineTo(p.x + p.w / 2, sy + 8);
    ctx.moveTo(p.x, sy); ctx.lineTo(p.x + p.w / 2, sy - 8); ctx.lineTo(p.x + p.w, sy);
    ctx.stroke();
  }

  drawSpider(player.x, player.y - cameraY, player.w, player.h);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Höjd: ${score}`, 16, 32);
  ctx.font = '14px sans-serif';
  ctx.fillText('Piltangenter styr, R börjar om', 16, 54);
  if (!playing) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Ajdå, spindeln föll! Tryck R', width / 2, height / 2);
    ctx.textAlign = 'start';
  }
}

let last;
function frame(t) {
  const dt = last === undefined ? 0 : Math.min((t - last) / 1000, 0.05);
  last = t;
  stepWorld(dt);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
reset();
requestAnimationFrame(frame);
