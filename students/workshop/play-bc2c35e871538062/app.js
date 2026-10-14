// Pumpahoppet: en pumpa hoppar uppåt från gravsten till gravsten.
const area = document.querySelector("#canvas-area");

const stage = document.createElement("section");
stage.id = "game-stage";
stage.tabIndex = 0;
stage.setAttribute("aria-label", "Spelområde");
stage.style.cssText =
  "display:block;width:100%;height:65vh;height:65dvh;min-height:320px;position:relative;" +
  "touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;outline:none;" +
  "border-radius:12px;overflow:hidden;";

const canvas = document.createElement("canvas");
canvas.style.cssText = "display:block;width:100%;height:100%;";
stage.appendChild(canvas);

const pad = document.createElement("div");
pad.style.cssText =
  "display:flex;gap:0.75rem;justify-content:center;margin-top:0.75rem;touch-action:manipulation;" +
  "user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;";

area.appendChild(stage);
area.appendChild(pad);
const ctx = canvas.getContext("2d");

// Fysik (världens y växer nedåt).
const gravity = 1800;
const bounceSpeed = 620;
const moveSpeed = 220;

let W = 1;
let H = 1;
let dpr = 1;
let player;
let platforms;
let cameraY;
let highestY;
let highestX;
let score;
let playing;
let steering = 0;

// Indata: tangenter och knappar delar samma tillstånd.
const held = new Set();
const KEY_DIR = { ArrowLeft: "left", ArrowRight: "right", a: "left", d: "right" };

function cameFromChatOrEditor(event) {
  const editableSelector =
    'input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"])';
  return event.composedPath().some((node) => {
    if (!(node instanceof Element)) return false;
    return node.id === "workshop-chat-root"
      || node.closest?.("#workshop-chat-root")
      || node.matches(editableSelector);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  const gameHasFocus = document.activeElement === stage || stage.contains(document.activeElement);
  if (!gameHasFocus || cameFromChatOrEditor(event)) return;
  const dir = KEY_DIR[event.key];
  if (!dir) return;
  event.preventDefault();
  held.add(dir);
});

document.addEventListener("keyup", (event) => {
  const dir = KEY_DIR[event.key];
  if (dir) held.delete(dir);
});

window.addEventListener("blur", () => held.clear());
stage.addEventListener("pointerdown", () => {
  stage.focus({ preventScroll: true });
  if (!playing) resetWorld();
});

[["left", "←", "Vänster"], ["right", "→", "Höger"]].forEach(([dir, label, name]) => {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.setAttribute("aria-label", name);
  btn.style.cssText =
    "width:5rem;height:4.5rem;font-size:1.8rem;border-radius:12px;border:2px solid #f97316;" +
    "background:#1f1b2e;color:#f97316;touch-action:manipulation;user-select:none;" +
    "-webkit-user-select:none;-webkit-touch-callout:none;";
  const press = (e) => { e.preventDefault(); held.add(dir); };
  const release = () => held.delete(dir);
  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("pointerleave", release);
  pad.appendChild(btn);
});

function resize() {
  const r = stage.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  W = Math.max(1, r.width);
  H = Math.max(1, r.height);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  resetWorld();
}
new ResizeObserver(resize).observe(stage);

function resetWorld() {
  const pw = Math.min(110, W * 0.45);
  const floorY = H - 60;
  player = { x: W / 2 - 14, y: floorY - 28, w: 28, h: 28, vy: -bounceSpeed };
  platforms = [{ x: W / 2 - pw / 2, y: floorY, w: pw }];
  highestY = floorY;
  highestX = W / 2;
  cameraY = 0;
  score = 0;
  steering = 0;
  held.clear();
  playing = true;
  fillPlatforms();
}

function fillPlatforms() {
  const pw = Math.min(110, W * 0.45);
  while (highestY > cameraY - H) {
    highestY -= 65 + Math.random() * 15;
    highestX = Math.max(pw / 2, Math.min(W - pw / 2,
      highestX + (Math.random() * 2 - 1) * 65));
    platforms.push({ x: highestX - pw / 2, y: highestY, w: pw });
  }
  platforms = platforms.filter((p) => p.y < cameraY + H + 140);
}

function stepWorld(dt) {
  if (!playing) return;
  const oldBottom = player.y + player.h;
  player.x += steering * moveSpeed * dt;
  if (player.x > W) player.x = -player.w;
  if (player.x + player.w < 0) player.x = W;
  player.vy += gravity * dt;
  player.y += player.vy * dt;
  if (player.vy > 0) {
    const landing = platforms
      .filter((p) => oldBottom <= p.y && player.y + player.h >= p.y
        && player.x + player.w > p.x && player.x < p.x + p.w)
      .sort((a, b) => a.y - b.y)[0];
    if (landing) {
      player.y = landing.y - player.h;
      player.vy = -bounceSpeed;
    }
  }
  cameraY = Math.min(cameraY, player.y - H * 0.4);
  score = Math.max(score, Math.floor(-cameraY / 10));
  fillPlatforms();
  if (player.y > cameraY + H + 60) playing = false;
}

function drawNight() {
  ctx.fillStyle = "#0d0b1a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(W * 0.8, H * 0.18, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e5e7eb";
  for (let i = 0; i < 25; i++) {
    ctx.fillRect((i * 97) % W, (i * 53) % (H * 0.6), 2, 2);
  }
}

function drawPlatform(p) {
  const y = p.y - cameraY;
  const x = p.x;
  ctx.fillStyle = "#4b5563";
  ctx.beginPath();
  ctx.roundRect(x + 4, y - 14, p.w - 8, 18, [10, 10, 0, 0]);
  ctx.fill();
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(x, y + 4, p.w, 6);
}

function drawPumpkin() {
  const x = player.x + player.w / 2;
  const y = player.y - cameraY + player.h / 2;
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#15803d";
  ctx.fillRect(x - 2, y - 20, 4, 7);
  ctx.fillStyle = "#1c1830";
  ctx.fillRect(x - 8, y - 3, 4, 4);
  ctx.fillRect(x + 4, y - 3, 4, 4);
}

function drawHud() {
  ctx.fillStyle = "#e5e0f0";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Höjd: ${score}`, 16, 32);
  ctx.textAlign = "left";
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f97316";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Pumpan föll!", W / 2, H / 2 - 16);
  ctx.fillStyle = "#e5e0f0";
  ctx.font = "20px sans-serif";
  ctx.fillText(`Höjd ${score}. Tryck för att hoppa igen.`, W / 2, H / 2 + 20);
  ctx.textAlign = "left";
}

function drawWorld() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawNight();
  platforms.forEach(drawPlatform);
  drawPumpkin();
  drawHud();
  if (!playing) drawGameOver();
}

let previousTime;
function frame(time) {
  const remaining = previousTime === undefined ? 0
    : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  let left = remaining;
  steering = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
  while (left > 0) {
    const dt = Math.min(left, 1 / 120);
    stepWorld(dt);
    left -= dt;
  }
  drawWorld();
  requestAnimationFrame(frame);
}
resize();
requestAnimationFrame(frame);
