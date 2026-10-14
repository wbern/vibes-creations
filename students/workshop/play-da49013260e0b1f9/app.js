// Spökjakten: shoot sparkle shots at the monsters before they reach the bottom.
const area = document.getElementById("canvas-area");
const canvas = document.createElement("canvas");
Object.assign(canvas.style, {
  width: "100%", height: "72dvh", display: "block", touchAction: "none",
  userSelect: "none", webkitUserSelect: "none", webkitTouchCallout: "none", outline: "none"
});
canvas.tabIndex = 0;
area.appendChild(canvas);
const ctx = canvas.getContext("2d");

const PAD_Y_OFFSET = 36, PAD_R = 26;
const PAD = [
  { id: "left", dx: -100, label: "←" },
  { id: "fire", dx: 0, label: "✦" },
  { id: "right", dx: 100, label: "→" }
];
const PLAYER_SPEED = 320, BULLET_SPEED = 520, FIRE_COOLDOWN = 0.3;
const SPAWN_EVERY = 1.0, MAX_LIVES = 3;

let W = 0, H = 0, arenaH = 0;
function measure() {
  const dpr = window.devicePixelRatio || 1;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  arenaH = Math.max(0, H - 72);
}

let player, bullets, monsters, puffs, score, lives, playing, spawnTimer, cooldown, flash;
let leftHeld = false, rightHeld = false, fireHeld = false;
let touchLeft = false, touchRight = false, touchFire = false;

function resetGame() {
  player = { x: W / 2, y: arenaH - 28 };
  bullets = [];
  monsters = [];
  puffs = [];
  score = 0;
  lives = MAX_LIVES;
  playing = true;
  spawnTimer = 0;
  cooldown = 0;
  flash = 0;
}

function spawnMonster() {
  const r = 18;
  monsters.push({
    x: r + Math.random() * (W - 2 * r),
    y: -r,
    r,
    speed: 50 + Math.random() * 40 + score * 2,
    phase: Math.random() * Math.PI * 2
  });
}

function update(dt) {
  flash = Math.max(0, flash - dt);
  puffs = puffs.filter(p => (p.t += dt) < 0.4);
  if (!playing) return;

  const moveDir = (rightHeld || touchRight ? 1 : 0) - (leftHeld || touchLeft ? 1 : 0);
  player.x = Math.max(16, Math.min(W - 16, player.x + moveDir * PLAYER_SPEED * dt));

  cooldown = Math.max(0, cooldown - dt);
  if ((fireHeld || touchFire) && cooldown <= 0) {
    bullets.push({ x: player.x, y: player.y - 16 });
    cooldown = FIRE_COOLDOWN;
  }

  bullets = bullets.filter(b => (b.y -= BULLET_SPEED * dt) > -10);

  spawnTimer += dt;
  if (spawnTimer >= SPAWN_EVERY) {
    spawnTimer = 0;
    spawnMonster();
  }

  for (const m of monsters) {
    m.y += m.speed * dt;
    m.x += Math.sin(m.phase + m.y * 0.03) * 30 * dt;
    m.x = Math.max(m.r, Math.min(W - m.r, m.x));
  }

  for (const b of bullets) {
    for (const m of monsters) {
      if (m.dead) continue;
      if (Math.hypot(b.x - m.x, b.y - m.y) < m.r + 4) {
        m.dead = true;
        b.hit = true;
        score++;
        puffs.push({ x: m.x, y: m.y, t: 0 });
        break;
      }
    }
  }
  bullets = bullets.filter(b => !b.hit);
  monsters = monsters.filter(m => !m.dead);

  for (const m of monsters) {
    if (m.y - m.r > arenaH) m.escaped = true;
  }
  const escaped = monsters.filter(m => m.escaped).length;
  if (escaped > 0) {
    lives -= escaped;
    flash = 1;
    monsters = monsters.filter(m => !m.escaped);
    if (lives <= 0) {
      lives = 0;
      playing = false;
    }
  }
}

function drawGhost(x, y, r) {
  ctx.fillStyle = "#f8f8ff";
  ctx.beginPath();
  ctx.arc(x, y - r * 0.2, r, Math.PI, 0);
  ctx.lineTo(x + r, y + r * 0.8);
  ctx.lineTo(x - r, y + r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1b0b2e";
  ctx.beginPath();
  ctx.arc(x - r * 0.4, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
  ctx.arc(x + r * 0.4, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawMonster(m) {
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff3b3b";
  ctx.beginPath();
  ctx.arc(m.x - m.r * 0.35, m.y - m.r * 0.2, m.r * 0.18, 0, Math.PI * 2);
  ctx.arc(m.x + m.r * 0.35, m.y - m.r * 0.2, m.r * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawPad() {
  const cx = W / 2, cy = H - PAD_Y_OFFSET;
  for (const b of PAD) {
    const active = (b.id === "left" && touchLeft) || (b.id === "right" && touchRight) || (b.id === "fire" && touchFire);
    ctx.fillStyle = active ? "rgba(255,140,26,0.8)" : "rgba(245,230,200,0.25)";
    ctx.beginPath();
    ctx.arc(cx + b.dx, cy, PAD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5e6c8";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.label, cx + b.dx, cy + 1);
  }
}

function draw() {
  ctx.fillStyle = "#1b0b2e";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#4a3260";
  for (let x = 0; x < W; x += 60) ctx.fillRect(x, 0, 30, arenaH);

  ctx.fillStyle = flash > 0 ? "rgba(255,60,60,0.25)" : "transparent";
  ctx.fillRect(0, 0, W, arenaH);

  ctx.fillStyle = "#ff8c1a";
  ctx.fillRect(0, arenaH - 4, W, 4);

  for (const p of puffs) {
    const k = p.t / 0.4;
    ctx.fillStyle = `rgba(245,230,200,${1 - k})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10 + k * 18, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const m of monsters) drawMonster(m);

  ctx.fillStyle = "#ffe066";
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (playing) drawGhost(player.x, player.y, 16);

  const lx = playing ? player.x : W / 2, ly = playing ? player.y : arenaH / 2;
  const light = ctx.createRadialGradient(lx, ly, 90, lx, ly, 230);
  light.addColorStop(0, "rgba(0,0,0,0)");
  light.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, arenaH);

  ctx.fillStyle = "#f5e6c8";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Poäng: " + score, 10, 8);
  ctx.textAlign = "right";
  ctx.fillText("Liv: " + lives, W - 10, 8);

  if (!playing) {
    ctx.fillStyle = "rgba(27,11,46,0.75)";
    ctx.fillRect(0, arenaH / 2 - 50, W, 100);
    ctx.fillStyle = "#f5e6c8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Monstren kom ner!", W / 2, arenaH / 2 - 14);
    ctx.font = "18px sans-serif";
    ctx.fillText("Poäng: " + score + ". Tryck för att spela igen", W / 2, arenaH / 2 + 22);
  }
  drawPad();
}

canvas.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (!playing) resetGame();
    else fireHeld = true;
    return;
  }
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); leftHeld = true; }
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); rightHeld = true; }
});
canvas.addEventListener("keyup", (e) => {
  if (e.key === " " || e.key === "Enter") fireHeld = false;
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") leftHeld = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") rightHeld = false;
});
canvas.addEventListener("blur", () => {
  leftHeld = rightHeld = fireHeld = false;
  touchLeft = touchRight = touchFire = false;
});

function padAt(x, y) {
  const cx = W / 2, cy = H - PAD_Y_OFFSET;
  for (const b of PAD) {
    const dx = x - (cx + b.dx), dy = y - cy;
    if (dx * dx + dy * dy <= (PAD_R + 6) * (PAD_R + 6)) return b.id;
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.focus();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  if (!playing) {
    resetGame();
    return;
  }
  const id = padAt(x, y);
  if (!id) return;
  if (id === "left") touchLeft = true;
  if (id === "right") touchRight = true;
  if (id === "fire") touchFire = true;
  canvas.setPointerCapture(e.pointerId);
});
function releaseTouch() {
  touchLeft = touchRight = touchFire = false;
}
canvas.addEventListener("pointerup", releaseTouch);
canvas.addEventListener("pointercancel", releaseTouch);
canvas.addEventListener("lostpointercapture", releaseTouch);

let previousTime;
function frame(time) {
  let remaining = previousTime === undefined ? 0
    : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 120);
    update(dt);
    remaining -= dt;
  }
  draw();
  requestAnimationFrame(frame);
}

measure();
resetGame();
window.addEventListener("resize", () => {
  measure();
  if (player) player.y = arenaH - 28;
});
requestAnimationFrame(frame);
