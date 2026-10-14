const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.id = 'stage';
canvas.tabIndex = 0;
const ctx = canvas.getContext('2d');
const bar = document.createElement('div');
bar.className = 'toolbar';
area.append(canvas, bar);

const TAU = Math.PI * 2;
const NEEDLE_PRICE = 60;

const state = {
  money: 0,
  hay: 0,
  needles: 0,
  bagCap: 40,
  bagUpgrades: 0,
  forkLevel: 0,
  dynamite: 0,
  vacuumLevel: 0,
  tool: 'fork',
  dots: [],
  needle: { u: 0, v: 0 },
  blasts: [],
  message: '',
  messageUntil: 0,
  pointer: null,
  lastDig: 0,
  blockedAt: 0,
  dirty: true,
  w: 0, h: 0, cx: 0, cy: 0, rx: 1, ry: 1
};

const forkRadius = () => 22 + state.forkLevel * 6;
const vacRadius = () => 16 + state.vacuumLevel * 10;
const forkCost = () => 25 * (state.forkLevel + 1);
const bagCost = () => 30 + 20 * state.bagUpgrades;
const vacCost = () => (state.vacuumLevel === 0 ? 60 : 50 * state.vacuumLevel);
const toolName = () => ({ fork: 'Gaffel', dynamite: 'Dynamit', vacuum: 'Dammsugare' })[state.tool];

function say(text, ms = 2200) {
  state.message = text;
  state.messageUntil = performance.now() + ms;
}

function newHaystack() {
  state.dots = [];
  for (let i = 0; i < 520; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random());
    state.dots.push({
      u: Math.cos(a) * r,
      v: Math.sin(a) * r,
      ang: Math.random() * Math.PI,
      warm: Math.random() < 0.5
    });
  }
  const a = Math.random() * TAU;
  const r = Math.sqrt(Math.random()) * 0.85;
  state.needle = { u: Math.cos(a) * r, v: Math.sin(a) * r };
}

function dig(x, y, r) {
  const { cx, cy, rx, ry, needle } = state;
  const found = Math.hypot(cx + needle.u * rx - x, cy + needle.v * ry - y) < r;
  let space = state.bagCap - state.hay;
  let blocked = false;
  const kept = [];
  for (const d of state.dots) {
    const dx = cx + d.u * rx - x;
    const dy = cy + d.v * ry - y;
    if (dx * dx + dy * dy < r * r) {
      if (space > 0) {
        space--;
        state.hay++;
        state.dirty = true;
        continue;
      }
      blocked = true;
    }
    kept.push(d);
  }
  state.dots = kept;
  const now = performance.now();
  if (blocked && now - state.blockedAt > 1500) {
    state.blockedAt = now;
    say('Påsen är full! Sälj först.');
  }
  if (found) {
    state.needles++;
    state.dirty = true;
    say('Nålen hittad! Sälj den för mynt.');
    newHaystack();
  } else if (state.dots.length === 0) {
    newHaystack();
    say('Ny höstack!');
  }
}

function explode(x, y) {
  if (state.dynamite <= 0) return say('Köp dynamit i butiken först.');
  state.dynamite--;
  state.dirty = true;
  state.blasts.push({ x, y, t: performance.now() });
  dig(x, y, 95);
}

function sellAll() {
  const gain = state.hay + state.needles * NEEDLE_PRICE;
  if (gain === 0) return say('Påsen är tom.');
  state.money += gain;
  state.hay = 0;
  state.needles = 0;
  state.dirty = true;
  say(`Sålt för ${gain} mynt!`);
}

function spend(cost) {
  if (state.money < cost) {
    say('Det har du inte råd med.');
    return false;
  }
  state.money -= cost;
  state.dirty = true;
  return true;
}

function buyDynamite() {
  if (spend(20)) {
    state.dynamite++;
    say('Dynamit köpt!');
  }
}

function buyVacuum() {
  const first = state.vacuumLevel === 0;
  if (spend(vacCost())) {
    state.vacuumLevel++;
    say(first ? 'Dammsugaren är din! Håll inne för att suga.' : 'Dammsugaren är starkare!');
  }
}

function buyFork() {
  if (spend(forkCost())) {
    state.forkLevel++;
    say('Gaffeln är vassare!');
  }
}

function buyBag() {
  if (spend(bagCost())) {
    state.bagCap += 20;
    state.bagUpgrades++;
    say('Större påse!');
  }
}

function setTool(t) {
  if (t === 'vacuum' && state.vacuumLevel === 0) return say('Köp dammsugaren i butiken först.');
  state.tool = t;
  state.dirty = true;
}

function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  const p = pos(e);
  state.pointer = { x: p.x, y: p.y, down: true };
  if (state.tool === 'dynamite') {
    explode(p.x, p.y);
  } else if (state.tool === 'fork') {
    dig(p.x, p.y, forkRadius());
    state.lastDig = performance.now();
  } else if (state.tool === 'vacuum') {
    dig(p.x, p.y, vacRadius());
  }
});

canvas.addEventListener('pointermove', (e) => {
  const p = pos(e);
  if (!state.pointer) state.pointer = { down: false };
  state.pointer.x = p.x;
  state.pointer.y = p.y;
});

function endPointer() {
  if (state.pointer) state.pointer.down = false;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => {
  if (state.pointer && !state.pointer.down) state.pointer = null;
});

canvas.addEventListener('keydown', (e) => {
  if (e.key === '1') setTool('fork');
  else if (e.key === '2') setTool('dynamite');
  else if (e.key === '3') setTool('vacuum');
  else if (e.key === 's' || e.key === 'S') sellAll();
  else return;
  e.preventDefault();
});

function update(now) {
  const p = state.pointer;
  if (p && p.down) {
    if (state.tool === 'fork' && now - state.lastDig > 120) {
      dig(p.x, p.y, forkRadius());
      state.lastDig = now;
    } else if (state.tool === 'vacuum') {
      dig(p.x, p.y, vacRadius());
    }
  }
  state.blasts = state.blasts.filter((b) => now - b.t < 600);
  if (state.dirty) {
    updateBar();
    state.dirty = false;
  }
}

function draw(now) {
  const { w, h, cx, cy, rx, ry } = state;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1b1033');
  sky.addColorStop(1, '#3d1f4f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(w * 0.85, h * 0.18, Math.min(w, h) * 0.06, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#2a1630';
  ctx.fillRect(0, cy + ry * 0.9, w, h);

  ctx.fillStyle = '#7a4a1c';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 1.05, ry * 1.05, 0, 0, TAU);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const d of state.dots) {
    const x = cx + d.u * rx;
    const y = cy + d.v * ry;
    ctx.strokeStyle = d.warm ? '#f4c76a' : '#c98b34';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(d.ang) * 6, y + Math.sin(d.ang) * 4);
    ctx.stroke();
  }

  const p = state.pointer;
  const nx = cx + state.needle.u * rx;
  const ny = cy + state.needle.v * ry;
  if (p && Math.hypot(nx - p.x, ny - p.y) < 110) {
    const s = 4 + 2 * Math.sin(now / 120);
    ctx.strokeStyle = '#e8f1ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nx - s * 2, ny);
    ctx.lineTo(nx + s * 2, ny);
    ctx.moveTo(nx, ny - s * 2);
    ctx.lineTo(nx, ny + s * 2);
    ctx.stroke();
  }

  for (const b of state.blasts) {
    const t = (now - b.t) / 600;
    ctx.strokeStyle = `rgba(255,140,40,${1 - t})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 95 * t, 0, TAU);
    ctx.stroke();
  }

  if (p) {
    const r = state.tool === 'fork' ? forkRadius() : state.tool === 'vacuum' ? vacRadius() : 95;
    ctx.strokeStyle = 'rgba(255,233,168,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 18px sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(`Mynt: ${state.money}`, 12, 12);
  ctx.fillText(`Påse: ${state.hay}/${state.bagCap}`, 12, 38);
  ctx.fillText(`Nålar: ${state.needles}`, 12, 64);
  ctx.textAlign = 'right';
  ctx.fillText(`Dynamit: ${state.dynamite}`, w - 12, 12);
  ctx.fillText(`Verktyg: ${toolName()}`, w - 12, 38);

  if (now < state.messageUntil) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(state.message, w / 2, h - 14);
  }
}

const B = {};
function btn(key, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.addEventListener('click', onClick);
  bar.appendChild(b);
  B[key] = b;
}

function buildBar() {
  btn('fork', () => setTool('fork'));
  btn('dyn', () => setTool('dynamite'));
  btn('vac', () => setTool('vacuum'));
  btn('buyDyn', buyDynamite);
  btn('buyVac', buyVacuum);
  btn('upFork', buyFork);
  btn('buyBag', buyBag);
  btn('sell', sellAll);
}

function updateBar() {
  const gain = state.hay + state.needles * NEEDLE_PRICE;
  B.fork.textContent = 'Gaffel';
  B.fork.classList.toggle('on', state.tool === 'fork');
  B.dyn.textContent = `Dynamit (${state.dynamite})`;
  B.dyn.classList.toggle('on', state.tool === 'dynamite');
  B.vac.textContent = state.vacuumLevel ? `Dammsugare (nivå ${state.vacuumLevel})` : 'Dammsugare (låst)';
  B.vac.classList.toggle('on', state.tool === 'vacuum');
  B.vac.disabled = state.vacuumLevel === 0;

  B.buyDyn.textContent = 'Köp dynamit · 20';
  B.buyDyn.disabled = state.money < 20;
  B.buyVac.textContent = state.vacuumLevel === 0
    ? `Köp dammsugare · ${vacCost()}`
    : `Starkare dammsugare · ${vacCost()}`;
  B.buyVac.disabled = state.money < vacCost();
  B.upFork.textContent = `Vassare gaffel · ${forkCost()}`;
  B.upFork.disabled = state.money < forkCost();
  B.buyBag.textContent = `Större påse · ${bagCost()}`;
  B.buyBag.disabled = state.money < bagCost();
  B.sell.textContent = `Sälj allt · ${gain}`;
  B.sell.disabled = gain === 0;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = area.clientWidth;
  const h = Math.max(320, window.innerHeight - area.getBoundingClientRect().top - bar.offsetHeight - 16);
  canvas.style.height = h + 'px';
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.w = w;
  state.h = h;
  state.cx = w / 2;
  state.cy = h * 0.55;
  state.rx = Math.min(w * 0.42, h * 0.5);
  state.ry = state.rx * 0.7;
}

function loop(now) {
  update(now);
  draw(now);
  requestAnimationFrame(loop);
}

newHaystack();
buildBar();
updateBar();
resize();
window.addEventListener('resize', resize);
say('Gräv efter nålen! Håll inne för att gräva.', 4000);
requestAnimationFrame(loop);
