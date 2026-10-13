// Bollen och formregnet
const area = document.querySelector("#canvas-area");
const stage = document.createElement("div");
stage.id = "game-stage";
stage.tabIndex = 0;
stage.setAttribute("aria-label", "Spelyta");
const canvas = document.createElement("canvas");
canvas.id = "game-canvas";
stage.appendChild(canvas);
area.appendChild(stage);
const ctx = canvas.getContext("2d");

let W = 300, H = 300, dpr = 1;
let arena = { x: 0, y: 0, w: 0, h: 0 };

function resize() {
  const r = stage.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  W = Math.max(200, r.width);
  H = Math.max(200, r.height);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pad = Math.min(W, H) * 0.04;
  arena = { x: pad, y: pad, w: W - pad * 2, h: H - pad * 2 };
  if (player) {
    player.x = Math.min(Math.max(player.x, arena.x + player.r), arena.x + arena.w - player.r);
    player.y = Math.min(Math.max(player.y, arena.y + player.r), arena.y + arena.h - player.r);
  }
}
window.addEventListener("resize", resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);

// ----- Spelstate -----
let player = null;
let monster = null;
let shots = [];
let time = 0;
let spawnTimer = 0;
let hp = 3;
let maxHp = 3;
let hurtTimer = 0;
let best = 0;
let state = "playing"; // playing | over
let last = performance.now();
const keys = {};
let target = null; // touch/mus-mål

const COLORS = ["#ff5d73", "#ffd84d", "#5de0ff", "#9d7bff", "#6dff9b", "#ff9e4d"];
const SHAPES = ["circle", "square", "triangle", "diamond", "star", "cross"];

function unit() { return Math.min(arena.w, arena.h); }

function reset() {
  player = { x: arena.x + arena.w / 2, y: arena.y + arena.h / 2, r: Math.max(9, unit() * 0.03) };
  monster = { x: arena.x + arena.w / 2, y: arena.y + unit() * 0.1, r: unit() * 0.075, shootFlash: 0 };
  shots = [];
  time = 0;
  spawnTimer = 1;
  hp = maxHp;
  hurtTimer = 0;
  target = null;
  state = "playing";
}

function level() { return 1 + Math.floor(time / 10); }

function spawn() {
  const u = unit();
  const lv = level();
  // Fler former blir tillgängliga med tiden
  const avail = SHAPES.slice(0, Math.min(SHAPES.length, 2 + Math.floor(lv / 1.5)));
  const shape = avail[Math.floor(Math.random() * avail.length)];
  const size = u * (0.03 + Math.random() * 0.04);
  const speed = u * (0.22 + Math.min(0.55, time * 0.008)) * (0.8 + Math.random() * 0.5);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  // Skotten kommer ur monstrets mun och siktar ungefär mot bollen
  const x = monster.x, y = monster.y + monster.r * 0.7;
  monster.shootFlash = 0.15;
  const aimErr = Math.max(0.05, 0.9 - time * 0.02);
  const tx = player.x + (Math.random() - 0.5) * u * aimErr;
  const ty = player.y + (Math.random() - 0.5) * u * aimErr;
  const base = Math.atan2(ty - y, tx - x);
  let angles = [base];
  const roll = Math.random();
  if (lv >= 4 && roll < 0.2) {
    const off = Math.random() * 6;
    angles = [];
    for (let i = 0; i < 8; i++) angles.push(off + (i * Math.PI * 2) / 8);
  } else if (lv >= 2 && roll < 0.5) {
    angles = [base - 0.35, base, base + 0.35];
  }
  for (const a of angles) {
    shots.push({
      shape, size, color, x, y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      rot: Math.random() * 6, spin: (Math.random() - 0.5) * 4,
    });
  }
}

function drawMonster() {
  const m = monster, r = m.r;
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.fillStyle = "#7a3cff";
  ctx.strokeStyle = "#c9a8ff";
  ctx.lineWidth = 3;
  // Taggar
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const rr = i % 2 ? r * 0.95 : r * 1.2;
    ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Ögon som tittar på bollen
  const look = Math.atan2(player.y - m.y, player.x - m.x);
  for (const sx of [-1, 1]) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sx * r * 0.38, -r * 0.2, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(sx * r * 0.38 + Math.cos(look) * r * 0.1, -r * 0.2 + Math.sin(look) * r * 0.1, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Arga ögonbryn
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx * r * 0.7, -r * 0.62);
    ctx.lineTo(sx * r * 0.12, -r * 0.4);
    ctx.stroke();
  }
  // Mun
  const open = m.shootFlash > 0 ? r * 0.38 : r * 0.2;
  ctx.fillStyle = "#220033";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.5, r * 0.5, open, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  for (const tx of [-0.3, -0.1, 0.1, 0.3]) {
    ctx.beginPath();
    ctx.moveTo(tx * r - r * 0.06, r * 0.5 - open * 0.8);
    ctx.lineTo(tx * r + r * 0.06, r * 0.5 - open * 0.8);
    ctx.lineTo(tx * r, r * 0.5 - open * 0.2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function update(dt) {
  if (state !== "playing") return;
  time += dt;

  // Rörelse
  const speed = unit() * 0.55;
  let dx = 0, dy = 0;
  if (keys.ArrowLeft || keys.a) dx -= 1;
  if (keys.ArrowRight || keys.d) dx += 1;
  if (keys.ArrowUp || keys.w) dy -= 1;
  if (keys.ArrowDown || keys.s) dy += 1;
  if (dx || dy) {
    const l = Math.hypot(dx, dy);
    player.x += (dx / l) * speed * dt;
    player.y += (dy / l) * speed * dt;
    target = null;
  } else if (target) {
    const tx = target.x - player.x, ty = target.y - player.y;
    const d = Math.hypot(tx, ty);
    const step = speed * 1.3 * dt;
    if (d > step) { player.x += (tx / d) * step; player.y += (ty / d) * step; }
    else { player.x = target.x; player.y = target.y; }
  }
  player.x = Math.min(Math.max(player.x, arena.x + player.r), arena.x + arena.w - player.r);
  player.y = Math.min(Math.max(player.y, arena.y + player.r), arena.y + arena.h - player.r);

  // Monstret glider fram och tillbaka, snabbare med tiden (och kan inte skadas)
  monster.r = unit() * 0.075;
  monster.y = arena.y + unit() * 0.1;
  monster.x = arena.x + arena.w / 2 + Math.sin(time * (0.7 + level() * 0.12)) * arena.w * 0.38;
  if (monster.shootFlash > 0) monster.shootFlash -= dt;

  // Skott
  spawnTimer -= dt;
  const interval = Math.max(0.3, 0.9 - time * 0.008);
  while (spawnTimer <= 0) {
    spawn();
    spawnTimer += interval;
  }
  for (const s of shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.rot += s.spin * dt;
  }
  shots = shots.filter((s) =>
    s.x > arena.x - 200 - s.size && s.x < arena.x + arena.w + 200 + s.size &&
    s.y > arena.y - 200 - s.size && s.y < arena.y + arena.h + 200 + s.size);

  // Träff
  if (hurtTimer > 0) hurtTimer -= dt;
  else {
    for (const s of shots) {
      if (Math.hypot(s.x - player.x, s.y - player.y) < s.size * 0.8 + player.r * 0.8) {
        hp--;
        hurtTimer = 1.2;
        shots = shots.filter((o) => o !== s);
        if (hp <= 0) {
          state = "over";
          best = Math.max(best, time);
        }
        break;
      }
    }
  }
}

function drawShape(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rot);
  ctx.fillStyle = s.color;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  const r = s.size;
  ctx.beginPath();
  switch (s.shape) {
    case "circle": ctx.arc(0, 0, r, 0, Math.PI * 2); break;
    case "square": ctx.rect(-r, -r, r * 2, r * 2); break;
    case "triangle":
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
        ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2);
      }
      ctx.closePath(); break;
    case "diamond":
      ctx.moveTo(0, -r * 1.3); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.3); ctx.lineTo(-r, 0);
      ctx.closePath(); break;
    case "star":
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.5 : r * 1.3;
        ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); break;
    case "cross": {
      const t = r * 0.4;
      ctx.moveTo(-t, -r); ctx.lineTo(t, -r); ctx.lineTo(t, -t); ctx.lineTo(r, -t);
      ctx.lineTo(r, t); ctx.lineTo(t, t); ctx.lineTo(t, r); ctx.lineTo(-t, r);
      ctx.lineTo(-t, t); ctx.lineTo(-r, t); ctx.lineTo(-r, -t); ctx.lineTo(-t, -t);
      ctx.closePath(); break;
    }
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.fillStyle = "#0b0b16";
  ctx.fillRect(0, 0, W, H);

  // Arenan
  ctx.fillStyle = "#12122a";
  ctx.fillRect(arena.x, arena.y, arena.w, arena.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(arena.x, arena.y, arena.w, arena.h);
  ctx.clip();
  drawMonster();
  for (const s of shots) drawShape(s);

  // Bollen
  if (state === "playing" || hp > 0) {
    const blink = hurtTimer > 0 && Math.floor(hurtTimer * 12) % 2 === 0;
    if (!blink) {
      const g = ctx.createRadialGradient(player.x - player.r * 0.3, player.y - player.r * 0.3, 1, player.x, player.y, player.r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, "#ff3b3b");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.strokeRect(arena.x, arena.y, arena.w, arena.h);

  // HUD
  const fs = Math.max(14, Math.min(22, unit() * 0.045));
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Tid: ${time.toFixed(1)}s   Nivå ${level()}`, arena.x + 10, arena.y + 8);
  ctx.textAlign = "right";
  let hearts = "";
  for (let i = 0; i < maxHp; i++) hearts += i < hp ? "♥ " : "♡ ";
  ctx.fillStyle = "#ff5d73";
  ctx.fillText(hearts.trim(), arena.x + arena.w - 10, arena.y + 8);

  if (state === "over") {
    ctx.fillStyle = "rgba(5,5,15,0.75)";
    ctx.fillRect(arena.x, arena.y, arena.w, arena.h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = arena.x + arena.w / 2, cy = arena.y + arena.h / 2;
    ctx.fillStyle = "#ffd84d";
    ctx.font = `bold ${fs * 2}px sans-serif`;
    ctx.fillText("Bollen small!", cx, cy - fs * 2.2);
    ctx.fillStyle = "#fff";
    ctx.font = `${fs * 1.1}px sans-serif`;
    ctx.fillText(`Du höll ut ${time.toFixed(1)} sekunder`, cx, cy - fs * 0.4);
    ctx.fillText(`Rekord: ${best.toFixed(1)} sekunder`, cx, cy + fs * 1.0);
    // Knapp
    const bw = fs * 10, bh = fs * 2.4;
    retryBtn = { x: cx - bw / 2, y: cy + fs * 2.2, w: bw, h: bh };
    ctx.fillStyle = "#5de0ff";
    ctx.fillRect(retryBtn.x, retryBtn.y, bw, bh);
    ctx.fillStyle = "#0b0b16";
    ctx.font = `bold ${fs * 1.1}px sans-serif`;
    ctx.fillText("Försök igen", cx, retryBtn.y + bh / 2);
  } else {
    retryBtn = null;
  }
}
let retryBtn = null;

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ----- Kontroller -----
const editableSelector =
  'input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"])';
function cameFromChatOrEditor(event) {
  return event.composedPath().some((node) => {
    if (!(node instanceof Element)) return false;
    return node.id === "workshop-chat-root"
      || node.closest?.("#workshop-chat-root")
      || node.matches(editableSelector);
  });
}
function stageFocused() {
  return document.activeElement === stage || stage.contains(document.activeElement);
}
const moveKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"];
document.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  if (!stageFocused() || cameFromChatOrEditor(e)) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (moveKeys.includes(k)) {
    keys[k] = true;
    e.preventDefault();
  } else if ((k === "Enter" || k === " ") && state === "over") {
    e.preventDefault();
    reset();
  }
});
document.addEventListener("keyup", (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (moveKeys.includes(k)) keys[k] = false;
});
window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

function pointerPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
stage.addEventListener("pointerdown", (e) => {
  stage.focus({ preventScroll: true });
  const p = pointerPos(e);
  if (state === "over") {
    if (retryBtn && p.x >= retryBtn.x && p.x <= retryBtn.x + retryBtn.w &&
        p.y >= retryBtn.y && p.y <= retryBtn.y + retryBtn.h) reset();
    return;
  }
  target = p;
  stage.setPointerCapture?.(e.pointerId);
});
stage.addEventListener("pointermove", (e) => {
  if (state === "playing" && e.buttons) target = pointerPos(e);
});
stage.addEventListener("pointerup", () => { target = null; });
stage.addEventListener("pointercancel", () => { target = null; });
stage.addEventListener("contextmenu", (e) => e.preventDefault());

resize();
reset();
requestAnimationFrame(loop);
