// Spöket och godisbitarna: hoppa uppåt, samla godis och undvik spöket.
const area = document.getElementById("canvas-area");
const canvas = document.createElement("canvas");
canvas.tabIndex = 0;
canvas.setAttribute("aria-label", "Spelplan: hoppa uppåt, samla godis och undvik spöket");
Object.assign(canvas.style, {
  display: "block",
  width: "100%",
  touchAction: "none",
  userSelect: "none",
  webkitUserSelect: "none",
  webkitTouchCallout: "none",
  outline: "none",
  borderRadius: "16px",
});
canvas.addEventListener("focus", () => { canvas.style.boxShadow = "0 0 0 3px #ffd39b"; });
canvas.addEventListener("blur", () => {
  canvas.style.boxShadow = "none";
  keys.left = false;
  keys.right = false;
});
area.appendChild(canvas);
const ctx = canvas.getContext("2d");

const GRAVITY = 1800;
const BOUNCE = 620;
const MOVE_SPEED = 220;
const GHOST_SPEED = 90;
const GHOST_RISE = 110;
const VAMPIRE_SPEED = 120;
const HURT_TIME = 1.5;

let W = 0;
let H = 0;
let state = null;
const keys = { left: false, right: false };
const touch = { left: false, right: false };

function steering() {
  const left = keys.left || touch.left;
  const right = keys.right || touch.right;
  return (right ? 1 : 0) - (left ? 1 : 0);
}

function platformWidth() {
  return Math.min(110, W * 0.45);
}

function fillPlatforms(s) {
  const pw = platformWidth();
  while (s.highestY > s.cameraY - H) {
    s.highestY -= 65 + Math.random() * 15;
    s.highestX = Math.max(pw / 2, Math.min(W - pw / 2,
      s.highestX + (Math.random() * 2 - 1) * 65));
    s.platforms.push({
      x: s.highestX - pw / 2, y: s.highestY, w: pw,
      candy: Math.random() < 0.5, bouncy: Math.random() < 0.2,
    });
  }
  s.platforms = s.platforms.filter((p) => p.y < s.cameraY + H + 140);
}

function newGame() {
  const pw = platformWidth();
  const floorY = H - 60;
  const s = {
    player: { x: W / 2 - 14, y: floorY - 28, w: 28, h: 28, vy: -BOUNCE },
    platforms: [{ x: W / 2 - pw / 2, y: floorY, w: pw, candy: false }],
    highestY: floorY,
    highestX: W / 2,
    cameraY: 0,
    ghost: { x: W * 0.15, y: floorY - 200, bob: 0 },
    vampires: [],
    msgText: "BU!",
    hurt: 0,
    msg: 0,
    candies: 0,
    lives: 3,
    height: 0,
    over: false,
  };
  fillPlatforms(s);
  return s;
}

function step(s, dt) {
  if (s.over) return;
  const p = s.player;
  const g = s.ghost;
  const oldBottom = p.y + p.h;

  p.x += steering() * MOVE_SPEED * dt;
  if (p.x > W) p.x = -p.w;
  if (p.x + p.w < 0) p.x = W;

  p.vy += GRAVITY * dt;
  p.y += p.vy * dt;
  if (p.vy > 0) {
    const landing = s.platforms
      .filter((pl) => oldBottom <= pl.y && p.y + p.h >= pl.y &&
        p.x + p.w > pl.x && p.x < pl.x + pl.w)
      .sort((a, b) => a.y - b.y)[0];
    if (landing) {
      p.y = landing.y - p.h;
      p.vy = landing.bouncy ? -BOUNCE * 1.5 : -BOUNCE;
    }
  }

  const pcx = p.x + p.w / 2;
  const pcy = p.y + p.h / 2;
  for (const pl of s.platforms) {
    if (!pl.candy) continue;
    if (Math.abs(pcx - (pl.x + pl.w / 2)) < 28 && Math.abs(pcy - (pl.y - 60)) < 28) {
      pl.candy = false;
      s.candies++;
    }
  }

  const dx = pcx - g.x;
  g.x += Math.sign(dx) * Math.min(Math.abs(dx), GHOST_SPEED * dt);
  const dy = pcy - g.y;
  g.y += Math.sign(dy) * Math.min(Math.abs(dy), GHOST_RISE * dt);
  g.bob += dt;

  s.hurt = Math.max(0, s.hurt - dt);
  s.msg = Math.max(0, s.msg - dt);
  if (s.hurt === 0 && Math.abs(g.x - pcx) < 28 && Math.abs(g.y - pcy) < 28) {
    s.lives--;
    s.hurt = HURT_TIME;
    s.msg = 1;
    s.msgText = "BU!";
    g.x = pcx < W / 2 ? W * 0.85 : W * 0.15;
    g.y = p.y - 150;
    if (s.lives <= 0) s.over = true;
  }

  if (s.height >= 5 && s.vampires.length === 0) {
    s.vampires.push({ x: Math.random() < 0.5 ? -20 : W + 20, y: p.y - 150, bob: 0 });
  }
  for (const v of s.vampires) {
    const vdx = pcx - v.x;
    v.x += Math.sign(vdx) * Math.min(Math.abs(vdx), VAMPIRE_SPEED * dt);
    const vdy = pcy - v.y;
    v.y += Math.sign(vdy) * Math.min(Math.abs(vdy), VAMPIRE_SPEED * dt);
    v.bob += dt;
    if (s.hurt === 0 && Math.abs(v.x - pcx) < 26 && Math.abs(v.y - pcy) < 26) {
      s.lives--;
      s.hurt = HURT_TIME;
      s.msg = 1;
      s.msgText = "Vampyr!";
      v.x = pcx < W / 2 ? W + 20 : -20;
      v.y = p.y - 150;
      if (s.lives <= 0) s.over = true;
    }
  }

  s.cameraY = Math.min(s.cameraY, p.y - H * 0.4);
  s.height = Math.max(s.height, Math.floor(-s.cameraY / 10));
  fillPlatforms(s);
  if (p.y > s.cameraY + H + 60) s.over = true;
}

function drawCandy(x, y) {
  ctx.fillStyle = "#ff5fa2";
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff3a8";
  ctx.fillRect(x - 4, y - 1.5, 8, 3);
}

function drawGhost(g, cameraY) {
  const x = g.x;
  const y = g.y - cameraY + Math.sin(g.bob * 4) * 5;
  ctx.fillStyle = "#e8f0ff";
  ctx.beginPath();
  ctx.arc(x, y - 4, 20, Math.PI, 0);
  ctx.lineTo(x + 20, y + 18);
  ctx.lineTo(x + 10, y + 10);
  ctx.lineTo(x, y + 18);
  ctx.lineTo(x - 10, y + 10);
  ctx.lineTo(x - 20, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1a0f2e";
  ctx.beginPath();
  ctx.arc(x - 7, y - 4, 3, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawVampire(v, cameraY) {
  const x = v.x;
  const y = v.y - cameraY + Math.sin(v.bob * 6) * 4;
  ctx.fillStyle = "#4b2a6b";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 30, y - 14);
  ctx.lineTo(x - 22, y + 8);
  ctx.lineTo(x, y + 2);
  ctx.lineTo(x + 22, y + 8);
  ctx.lineTo(x + 30, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2b1a3d";
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff3b3b";
  ctx.beginPath();
  ctx.arc(x - 4, y - 2, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 4);
  ctx.lineTo(x - 2, y + 9);
  ctx.lineTo(x, y + 4);
  ctx.moveTo(x + 4, y + 4);
  ctx.lineTo(x + 2, y + 9);
  ctx.lineTo(x, y + 4);
  ctx.fill();
}

function drawPlayer(p, cameraY, hurt) {
  if (hurt > 0 && Math.floor(hurt * 10) % 2 === 0) return;
  const cx = p.x + p.w / 2;
  const cy = p.y - cameraY + p.h / 2;
  ctx.fillStyle = "#ff7a00";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3f7a1f";
  ctx.fillRect(cx - 2, cy - 22, 4, 8);
  ctx.fillStyle = "#1a0f2e";
  ctx.fillRect(cx - 8, cy - 5, 4, 4);
  ctx.fillRect(cx + 4, cy - 5, 4, 4);
  ctx.fillRect(cx - 7, cy + 4, 14, 3);
}

function draw(s) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0d0520");
  sky.addColorStop(1, "#3b1a4d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.15, H * 0.05, 0, Math.PI * 2);
  ctx.fill();

  for (const pl of s.platforms) {
    const y = pl.y - s.cameraY;
    if (y < -20 || y > H + 20) continue;
    ctx.fillStyle = pl.bouncy ? "#5a2a8a" : "#7a3e12";
    ctx.fillRect(pl.x, y, pl.w, 14);
    ctx.fillStyle = pl.bouncy ? "#b36bff" : "#ff8c1a";
    ctx.fillRect(pl.x, y, pl.w, 5);
    if (pl.candy) drawCandy(pl.x + pl.w / 2, y - 60);
  }

  for (const v of s.vampires) drawVampire(v, s.cameraY);
  drawPlayer(s.player, s.cameraY, s.hurt);
  drawGhost(s.ghost, s.cameraY);

  if (s.msg > 0) {
    ctx.fillStyle = "#ffd39b";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.msgText, s.player.x + s.player.w / 2, s.player.y - s.cameraY - 40);
  }

  ctx.fillStyle = "#ffd39b";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Höjd: " + s.height + " m   Godis: " + s.candies, 12, 30);
  ctx.textAlign = "right";
  ctx.fillText("Liv: " + s.lives, W - 12, 30);

  if (!s.over && document.activeElement !== canvas) {
    ctx.fillStyle = "#ffd39b";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Klicka på spelet, så styr piltangenterna", W / 2, H - 14);
  }

  if (s.over) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ff8c1a";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Spöket fick dig!", W / 2, H / 2 - 20);
    ctx.fillStyle = "#ffd39b";
    ctx.font = "20px sans-serif";
    ctx.fillText("Godis: " + s.candies + "   Tryck för att börja om", W / 2, H / 2 + 20);
  }
}

canvas.addEventListener("pointerdown", () => {
  canvas.focus({ preventScroll: true });
  if (state.over) state = newGame();
});

canvas.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    keys.left = true;
    e.preventDefault();
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    keys.right = true;
    e.preventDefault();
  } else if ((e.key === " " || e.key === "Enter" || e.key === "ArrowUp") && state.over) {
    state = newGame();
    e.preventDefault();
  }
});

canvas.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
});

const controls = document.createElement("div");
Object.assign(controls.style, {
  display: "flex",
  gap: "12px",
  marginTop: "12px",
  touchAction: "none",
  userSelect: "none",
  webkitUserSelect: "none",
  webkitTouchCallout: "none",
});

function makeHoldButton(label, side) {
  const b = document.createElement("button");
  b.textContent = label;
  Object.assign(b.style, {
    flex: "1",
    minHeight: "64px",
    fontSize: "32px",
    fontWeight: "bold",
    borderRadius: "14px",
    border: "none",
    background: "#ff8c1a",
    color: "#1a0f2e",
    touchAction: "none",
    userSelect: "none",
    webkitUserSelect: "none",
    webkitTouchCallout: "none",
  });
  b.setAttribute("aria-label", side === "left" ? "Gå vänster" : "Gå höger");
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (state.over) {
      state = newGame();
      return;
    }
    b.setPointerCapture(e.pointerId);
    touch[side] = true;
  });
  const release = () => { touch[side] = false; };
  b.addEventListener("pointerup", release);
  b.addEventListener("pointercancel", release);
  b.addEventListener("lostpointercapture", release);
  return b;
}

controls.append(makeHoldButton("◀", "left"), makeHoldButton("▶", "right"));
area.appendChild(controls);

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = area.clientWidth || window.innerWidth;
  H = Math.max(420, Math.round(window.innerHeight * 0.7));
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (state) state.player.x = Math.min(state.player.x, W - state.player.w);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(state, dt);
  draw(state);
  requestAnimationFrame(loop);
}

resize();
state = newGame();
window.addEventListener("resize", resize);
requestAnimationFrame(loop);
