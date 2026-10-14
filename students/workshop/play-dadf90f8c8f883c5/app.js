// Spökjakten: välj en bana i lobbyn, skjut spöken, samla mynt och köp nya vapen.
const area = document.getElementById("canvas-area");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
area.appendChild(canvas);

canvas.style.width = "100%";
canvas.style.height = "80vh";
canvas.style.display = "block";
canvas.style.borderRadius = "12px";
canvas.style.touchAction = "none";
canvas.style.userSelect = "none";
canvas.style.webkitUserSelect = "none";
canvas.style.webkitTouchCallout = "none";

let W = 0;
let H = 0;

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  W = rect.width;
  H = rect.height;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const MAX_HP = 100;
const BITE_DAMAGE = 15;
const BOMB_START = 3;
const MAX_GHOSTS = 8;

const GHOST_TYPES = [
  { name: "Spöke", color: "#e9e4f5", hits: 1, speed: [0.0005, 0.0012], size: 1 },
  { name: "Pumpa", color: "#ff7a1a", hits: 2, speed: [0.0003, 0.0007], size: 1.25 },
  { name: "Fladdermus", color: "#8b5cf6", hits: 1, speed: [0.001, 0.0016], size: 0.8 },
];

const LEVELS = [
  { name: "Spökskogen", winKills: 8, speedMul: 0.8, pool: [0], startGhosts: 3 },
  { name: "Pumpagården", winKills: 10, speedMul: 1, pool: [0, 1], startGhosts: 4 },
  { name: "Fladdermusgrottan", winKills: 14, speedMul: 1.3, pool: [0, 1, 2], startGhosts: 5 },
];

const WEAPON_NAMES = ["Blaster", "Bomb"];

const SHOP_ITEMS = [
  { label: "3 bomber", cost: 4, action: "bomb" },
  { label: "Kraftigare blaster", cost: 6, action: "damage" },
  { label: "2 fler spöken", cost: 5, action: "ghosts" },
];

let state = "lobby";
let currentLevel = 0;
let selectedLevel = 0;
let ghosts = [];
let kills = 0;
let coins = 0;
let hp = MAX_HP;
let weapon = 0;
let bombs = BOMB_START;
let blasterDamage = 1;
let ghostCap = 0;
let shopOpen = false;
let shotFlash = 0;
let hurtFlash = 0;
let aim = { x: 0, y: 0 };
let levelButtons = [];
let startButton = null;
let restartButton = null;
let menuButton = null;
let weaponButton = null;
let shopButton = null;
let shopRects = [];
let shopCloseButton = null;

function spawnGhost(farAway) {
  const level = LEVELS[currentLevel];
  const type = GHOST_TYPES[level.pool[Math.floor(Math.random() * level.pool.length)]];
  const [lo, hi] = type.speed;
  return {
    type,
    hits: type.hits,
    x: (Math.random() * 2 - 1) * 0.6,
    z: farAway ? 0.8 + Math.random() * 0.2 : 0.5 + Math.random() * 0.5,
    speed: (lo + Math.random() * (hi - lo)) * level.speedMul,
    wobble: Math.random() * 6,
  };
}

function reset() {
  const level = LEVELS[currentLevel];
  ghostCap = level.startGhosts;
  ghosts = [];
  for (let i = 0; i < ghostCap; i++) ghosts.push(spawnGhost(false));
  kills = 0;
  coins = 0;
  hp = MAX_HP;
  weapon = 0;
  bombs = BOMB_START;
  blasterDamage = 1;
  shopOpen = false;
  shotFlash = 0;
  hurtFlash = 0;
  aim = { x: W / 2, y: H / 2 };
}

function startLevel() {
  currentLevel = selectedLevel;
  reset();
  state = "play";
}

// Längre bort = mindre och närmare horisonten; z går från 1 (långt) mot 0.
function project(g) {
  const scale = 1 / g.z;
  return {
    sx: W / 2 + g.x * scale * W * 0.3,
    sy: H * 0.5,
    r: H * 0.1 * scale * g.type.size,
  };
}

function damageGhost(g, amount) {
  g.hits -= amount;
  if (g.hits <= 0) {
    ghosts = ghosts.filter((other) => other !== g);
    kills++;
    coins++;
  }
}

function canBuy(item) {
  if (coins < item.cost) return false;
  if (item.action === "damage") return blasterDamage < 2;
  if (item.action === "ghosts") return ghostCap < MAX_GHOSTS;
  return true;
}

function buy(item) {
  if (!canBuy(item)) return;
  coins -= item.cost;
  if (item.action === "bomb") bombs += 3;
  if (item.action === "damage") blasterDamage = 2;
  if (item.action === "ghosts") ghostCap += 2;
}

function update() {
  if (state !== "play" || shopOpen) return;
  for (const g of ghosts) {
    g.z -= g.speed;
    g.wobble += 0.05;
  }
  ghosts = ghosts.filter((g) => {
    if (g.z <= 0.25) {
      hp = Math.max(0, hp - BITE_DAMAGE);
      hurtFlash = 15;
      return false;
    }
    return true;
  });
  while (ghosts.length < ghostCap) ghosts.push(spawnGhost(true));
  if (shotFlash > 0) shotFlash--;
  if (hurtFlash > 0) hurtFlash--;
  if (hp <= 0) state = "lose";
  else if (kills >= LEVELS[currentLevel].winKills) state = "win";
}

function shoot(x, y) {
  if (state !== "play" || shopOpen) return;
  if (weapon === 0) {
    shotFlash = 8;
    let best = null;
    for (const g of ghosts) {
      const p = project(g);
      if (Math.hypot(x - p.sx, y - p.sy) < p.r && (!best || g.z < best.z)) best = g;
    }
    if (best) damageGhost(best, blasterDamage);
    return;
  }
  if (bombs <= 0) return;
  bombs--;
  shotFlash = 12;
  const radius = H * 0.25;
  for (const g of [...ghosts]) {
    const p = project(g);
    if (Math.hypot(x - p.sx, y - p.sy) < radius) damageGhost(g, 2);
  }
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function inside(p, b) {
  return b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

canvas.addEventListener("pointerdown", (e) => {
  const p = canvasPoint(e);
  aim = p;
  if (state === "lobby") {
    const level = levelButtons.find((b) => inside(p, b));
    if (level) selectedLevel = level.index;
    else if (inside(p, startButton)) startLevel();
    return;
  }
  if (state !== "play") {
    if (inside(p, restartButton)) startLevel();
    else if (inside(p, menuButton)) state = "lobby";
    return;
  }
  if (shopOpen) {
    if (inside(p, shopCloseButton)) {
      shopOpen = false;
      return;
    }
    const hit = shopRects.find((r) => inside(p, r));
    if (hit) buy(hit.item);
    return;
  }
  if (inside(p, shopButton)) {
    shopOpen = true;
    return;
  }
  if (inside(p, weaponButton)) {
    weapon = (weapon + 1) % WEAPON_NAMES.length;
    return;
  }
  shoot(p.x, p.y);
});
canvas.addEventListener("pointermove", (e) => {
  aim = canvasPoint(e);
});

window.addEventListener("keydown", (e) => {
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (state === "lobby") {
    if (e.key === "Enter") startLevel();
  } else if (state === "play") {
    if (e.key === "b" || e.key === "B") {
      shopOpen = !shopOpen;
    } else if (shopOpen) {
      return;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      shoot(aim.x, aim.y);
    } else if (e.key === "1") {
      weapon = 0;
    } else if (e.key === "2") {
      weapon = 1;
    }
  } else if (e.key === "r" || e.key === "R") {
    startLevel();
  }
});

function drawGhost(sx, sy, r, wobble, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, sy, r, Math.PI, 0);
  ctx.lineTo(sx + r, sy + r * 1.2);
  const teeth = 4;
  for (let i = 0; i < teeth; i++) {
    const x1 = sx + r - (2 * r * (i + 0.5)) / teeth;
    const x2 = sx + r - (2 * r * (i + 1)) / teeth;
    const wave = Math.sin(wobble + i) * r * 0.2;
    ctx.lineTo(x1, sy + r * 0.7 + wave);
    ctx.lineTo(x2, sy + r * 1.2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1a1024";
  ctx.beginPath();
  ctx.arc(sx - r * 0.35, sy - r * 0.1, r * 0.15, 0, Math.PI * 2);
  ctx.arc(sx + r * 0.35, sy - r * 0.1, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  sky.addColorStop(0, "#1a0b2e");
  sky.addColorStop(1, "#3b1d4f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.5);
  ctx.fillStyle = "#1f1410";
  ctx.fillRect(0, H * 0.5, W, H * 0.5);

  ctx.fillStyle = "#f5e6c8";
  ctx.beginPath();
  ctx.arc(W * 0.8, H * 0.18, H * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function drawScene() {
  drawBackground();
  const sorted = [...ghosts].sort((a, b) => b.z - a.z);
  for (const g of sorted) {
    const p = project(g);
    drawGhost(p.sx, p.sy, p.r, g.wobble, g.type.color);
  }
}

function drawWeapon() {
  const w = Math.min(W * 0.25, 220);
  const h = H * 0.14;
  const x = W / 2 - w / 2;
  const y = H - h;
  ctx.fillStyle = weapon === 0 ? "#374151" : "#7c2d12";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#f97316";
  ctx.fillRect(x + w * 0.4, y - 10, w * 0.2, 14);
  if (shotFlash > 0) {
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(W / 2, y - 14, 22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWeaponButton() {
  const bw = 170;
  const bh = 40;
  weaponButton = { x: 16, y: H - bh - 16, w: bw, h: bh };
  ctx.fillStyle = "#4c1d95";
  ctx.fillRect(weaponButton.x, weaponButton.y, bw, bh);
  ctx.fillStyle = "#f5e6c8";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  const label = weapon === 0 ? "Blaster (1)" : "Bomb x" + bombs + " (2)";
  ctx.fillText(label, weaponButton.x + bw / 2, weaponButton.y + 26);
}

function drawShopButton() {
  shopButton = { x: W - 136, y: 40, w: 120, h: 32 };
  ctx.fillStyle = "#ff8c1a";
  ctx.fillRect(shopButton.x, shopButton.y, shopButton.w, shopButton.h);
  ctx.fillStyle = "#1a1024";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Butik (B)", shopButton.x + shopButton.w / 2, shopButton.y + 22);
}

function drawShop() {
  ctx.fillStyle = "rgba(13, 7, 22, 0.8)";
  ctx.fillRect(0, 0, W, H);

  const pw = Math.min(360, W * 0.9);
  const ph = 300;
  const px = W / 2 - pw / 2;
  const py = H * 0.5 - ph / 2;
  ctx.fillStyle = "#2a1a3a";
  ctx.fillRect(px, py, pw, ph);

  ctx.fillStyle = "#f5e6c8";
  ctx.textAlign = "center";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("Butik - mynt: " + coins, W / 2, py + 36);

  shopRects = SHOP_ITEMS.map((item, i) => {
    const rect = { x: px + 16, y: py + 60 + i * 60, w: pw - 32, h: 46, item };
    ctx.fillStyle = canBuy(item) ? "#ff8c1a" : "#4b3b5c";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#1a1024";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(item.label + " - " + item.cost + " mynt", W / 2, rect.y + 28);
    return rect;
  });

  shopCloseButton = { x: W / 2 - 80, y: py + ph - 56, w: 160, h: 40 };
  ctx.fillStyle = "#7c3aed";
  ctx.fillRect(shopCloseButton.x, shopCloseButton.y, shopCloseButton.w, shopCloseButton.h);
  ctx.fillStyle = "#f5e6c8";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("Stäng (B)", W / 2, shopCloseButton.y + 26);
}

function drawCrosshair() {
  ctx.strokeStyle = "#f5e6c8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(aim.x - 12, aim.y);
  ctx.lineTo(aim.x + 12, aim.y);
  ctx.moveTo(aim.x, aim.y - 12);
  ctx.lineTo(aim.x, aim.y + 12);
  ctx.stroke();
}

function drawHud() {
  ctx.fillStyle = "#f5e6c8";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(LEVELS[currentLevel].name + ": " + kills + " / " + LEVELS[currentLevel].winKills, 16, 28);
  ctx.fillText("Mynt: " + coins, 16, 54);

  const bw = Math.min(160, W * 0.3);
  ctx.fillStyle = "#3a2a4a";
  ctx.fillRect(W - bw - 16, 16, bw, 12);
  ctx.fillStyle = "#f97316";
  ctx.fillRect(W - bw - 16, 16, bw * (hp / MAX_HP), 12);
}

function drawEnd() {
  ctx.fillStyle = "rgba(13, 7, 22, 0.7)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f5e6c8";
  ctx.textAlign = "center";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(state === "win" ? "Du vann! 🎃" : "Spökena tog dig!", W / 2, H * 0.4);

  const bw = 200;
  const bh = 52;
  restartButton = { x: W / 2 - bw / 2, y: H * 0.5, w: bw, h: bh };
  ctx.fillStyle = "#ff8c1a";
  ctx.fillRect(restartButton.x, restartButton.y, bw, bh);
  ctx.fillStyle = "#1a1024";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Spela igen", W / 2, restartButton.y + 32);

  menuButton = { x: W / 2 - bw / 2, y: H * 0.5 + 68, w: bw, h: bh };
  ctx.fillStyle = "#7c3aed";
  ctx.fillRect(menuButton.x, menuButton.y, bw, bh);
  ctx.fillStyle = "#f5e6c8";
  ctx.fillText("Meny", W / 2, menuButton.y + 32);
}

function drawLobby() {
  drawBackground();
  ctx.fillStyle = "rgba(13, 7, 22, 0.6)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ff8c1a";
  ctx.textAlign = "center";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("Spökjakten 👻", W / 2, H * 0.2);

  const bw = Math.min(360, W * 0.8);
  const bh = 52;
  levelButtons = LEVELS.map((level, i) => {
    const rect = { x: W / 2 - bw / 2, y: H * 0.32 + i * 64, w: bw, h: bh, index: i };
    ctx.fillStyle = i === selectedLevel ? "#ff8c1a" : "#4c1d95";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = i === selectedLevel ? "#1a1024" : "#f5e6c8";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(level.name + " - mål " + level.winKills, W / 2, rect.y + 32);
    return rect;
  });

  startButton = { x: W / 2 - 100, y: H * 0.32 + LEVELS.length * 64 + 16, w: 200, h: bh };
  ctx.fillStyle = "#84cc16";
  ctx.fillRect(startButton.x, startButton.y, startButton.w, startButton.h);
  ctx.fillStyle = "#1a1024";
  ctx.fillText("Starta bana", W / 2, startButton.y + 32);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (state === "lobby") {
    drawLobby();
    return;
  }
  drawScene();
  drawWeapon();
  if (state === "play") {
    drawCrosshair();
    drawWeaponButton();
    drawShopButton();
  }
  if (hurtFlash > 0) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.25)";
    ctx.fillRect(0, 0, W, H);
  }
  drawHud();
  if (state === "play" && shopOpen) drawShop();
  if (state !== "play") drawEnd();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
resize();
reset();
loop();
