const area = document.getElementById("canvas-area");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
area.appendChild(canvas);
canvas.style.touchAction = "none";
canvas.style.userSelect = "none";

let W = 0, H = 0;
function measure() {
  const dpr = window.devicePixelRatio || 1;
  W = Math.max(280, area.clientWidth);
  H = Math.max(420, Math.round(window.innerHeight * 0.8));
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const gravity = 1400, flapSpeed = -430, gap = 170, pipeW = 56, pipeSpeed = 130;
let player, pipes, score, playing, spawnTimer;

function reset() {
  player = { x: W * 0.25, y: H / 2, r: 16, vy: 0, flap: 0 };
  pipes = [];
  score = 0;
  spawnTimer = 0.5;
  playing = true;
}

function flap() {
  if (!playing) { reset(); return; }
  player.vy = flapSpeed;
  player.flap = 0.15;
}

function addPipe() {
  const gapY = 90 + Math.random() * (H - gap - 180);
  const candy = Math.random() < 0.6 ? { y: gapY + gap / 2, got: false } : null;
  pipes.push({ x: W + 10, gapY, scored: false, candy });
}

function hitsRect(cx, cy, r, x, y, w, h) {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

function update(dt) {
  if (!playing) return;
  player.vy += gravity * dt;
  player.y += player.vy * dt;
  player.flap = Math.max(0, player.flap - dt);

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    addPipe();
    spawnTimer = 1.6;
  }

  for (const p of pipes) {
    p.x -= pipeSpeed * dt;
    if (!p.scored && p.x + pipeW < player.x - player.r) {
      p.scored = true;
      score++;
    }
    const { x, r } = player;
    if (hitsRect(x, player.y, r, p.x, 0, pipeW, p.gapY) ||
        hitsRect(x, player.y, r, p.x, p.gapY + gap, pipeW, H - p.gapY - gap)) {
      playing = false;
    }
    if (p.candy && !p.candy.got) {
      const cx = p.x + pipeW / 2;
      if ((x - cx) ** 2 + (player.y - p.candy.y) ** 2 < (r + 8) ** 2) {
        p.candy.got = true;
        score++;
      }
    }
  }
  if (player.y + player.r > H || player.y - player.r < 0) playing = false;
  pipes = pipes.filter(p => p.x > -pipeW - 10);
}

function drawBat(x, y, flapping) {
  ctx.fillStyle = "#2b1b3d";
  const wingY = flapping ? -14 : 6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 26, y + wingY);
  ctx.lineTo(x - 14, y + 4);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x + 14, y + 4);
  ctx.lineTo(x + 26, y + wingY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff3b3b";
  ctx.fillRect(x - 6, y - 3, 3, 3);
  ctx.fillRect(x + 3, y - 3, 3, 3);
}

function draw() {
  ctx.fillStyle = "#1e1033";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff22";
  ctx.beginPath();
  ctx.arc(W * 0.8, 80, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5a5a6e";
  for (const p of pipes) {
    ctx.fillRect(p.x, 0, pipeW, p.gapY);
    ctx.fillRect(p.x, p.gapY + gap, pipeW, H - p.gapY - gap);
    ctx.beginPath();
    ctx.arc(p.x + pipeW / 2, p.gapY, pipeW / 2, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x + pipeW / 2, p.gapY + gap, pipeW / 2, 0, Math.PI);
    ctx.fill();
    if (p.candy && !p.candy.got) {
      ctx.fillStyle = "#ff8c1a";
      ctx.beginPath();
      ctx.arc(p.x + pipeW / 2, p.candy.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a5a6e";
    }
  }

  drawBat(player.x, player.y, player.flap > 0 || player.vy < 0);

  ctx.fillStyle = "#f5e6c8";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Poäng: " + score, 12, 28);

  if (!playing) {
    ctx.textAlign = "center";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Fladdermusen kraschade! 🦇", W / 2, H / 2 - 10);
    ctx.font = "18px sans-serif";
    ctx.fillText("Tryck här eller på mellanslag för att flyga igen", W / 2, H / 2 + 24);
  }
}

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

canvas.tabIndex = 0;
canvas.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    flap();
    e.preventDefault();
  }
});
canvas.addEventListener("pointerdown", e => {
  canvas.focus();
  flap();
});

window.addEventListener("resize", () => {
  measure();
  reset();
});

measure();
reset();
requestAnimationFrame(frame);
