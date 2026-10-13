// Spöktanken: en tank som kör runt och skjuter.
const area = document.querySelector("#canvas-area");
const stage = document.createElement("canvas");
stage.id = "game-stage";
stage.tabIndex = 0;
stage.setAttribute("aria-label", "Spelområde");
area.appendChild(stage);
const ctx = stage.getContext("2d");

const tank = { x: 0, y: 0, angle: 0, speed: 260, radius: 22 };
const bullets = [];
const pumpkins = [];
let score = 0;
const keys = {};
let aimX = 0;
let aimY = 0;
let lastTime = performance.now();

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(window.innerWidth - 32));
  const height = Math.max(320, Math.floor(window.innerHeight * 0.8));
  stage.style.width = width + "px";
  stage.style.height = height + "px";
  stage.width = Math.floor(width * dpr);
  stage.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!tank.placed) {
    tank.x = width / 2;
    tank.y = height / 2;
    tank.placed = true;
  }
  tank.x = Math.min(Math.max(tank.x, tank.radius), width - tank.radius);
  tank.y = Math.min(Math.max(tank.y, tank.radius), height - tank.radius);
}

function shoot() {
  bullets.push({
    x: tank.x + Math.cos(tank.angle) * 30,
    y: tank.y + Math.sin(tank.angle) * 30,
    vx: Math.cos(tank.angle) * 520,
    vy: Math.sin(tank.angle) * 520,
    life: 1.2,
  });
}

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

const moveKeys = {
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
  ArrowUp: "up", w: "up", W: "up",
  ArrowDown: "down", s: "down", S: "down",
};

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  if (cameFromChatOrEditor(event)) return;
  const gameHasFocus = document.activeElement === stage;
  if (!gameHasFocus) return;
  if (moveKeys[event.key]) {
    keys[moveKeys[event.key]] = true;
    event.preventDefault();
  } else if (event.key === " ") {
    shoot();
    event.preventDefault();
  }
});

document.addEventListener("keyup", (event) => {
  if (moveKeys[event.key]) keys[moveKeys[event.key]] = false;
});

stage.addEventListener("pointerdown", (event) => {
  stage.focus({ preventScroll: true });
  const rect = stage.getBoundingClientRect();
  aimX = event.clientX - rect.left;
  aimY = event.clientY - rect.top;
  shoot();
});

stage.addEventListener("pointermove", (event) => {
  const rect = stage.getBoundingClientRect();
  aimX = event.clientX - rect.left;
  aimY = event.clientY - rect.top;
  tank.angle = Math.atan2(aimY - tank.y, aimX - tank.x);
});

function update(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    tank.x += (dx / len) * tank.speed * dt;
    tank.y += (dy / len) * tank.speed * dt;
  }
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  tank.x = Math.min(Math.max(tank.x, tank.radius), width - tank.radius);
  tank.y = Math.min(Math.max(tank.y, tank.radius), height - tank.radius);

  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].life <= 0) bullets.splice(i, 1);
  }

  if (pumpkins.length < 6) spawnPumpkin(width, height);
  for (const p of pumpkins) {
    const dist = Math.hypot(tank.x - p.x, tank.y - p.y) || 1;
    p.x += ((tank.x - p.x) / dist) * p.speed * dt;
    p.y += ((tank.y - p.y) / dist) * p.speed * dt;
  }
  for (let i = pumpkins.length - 1; i >= 0; i--) {
    const p = pumpkins[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius) {
        p.hp -= 1;
        bullets.splice(j, 1);
      }
    }
    if (p.hp <= 0) {
      pumpkins.splice(i, 1);
      score += 1;
    }
  }
}

function spawnPumpkin(width, height) {
  const side = Math.floor(Math.random() * 4);
  const x = side === 0 ? 0 : side === 1 ? width : Math.random() * width;
  const y = side === 2 ? 0 : side === 3 ? height : Math.random() * height;
  pumpkins.push({ x, y, radius: 20, speed: 60, hp: 2 });
}

function draw() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  ctx.fillStyle = "#2a1a3d";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(tank.x, tank.y);
  ctx.rotate(tank.angle);
  ctx.fillStyle = "#6b8e23";
  ctx.beginPath();
  ctx.arc(0, 0, tank.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3d4f14";
  ctx.fillRect(0, -5, 32, 10);
  ctx.restore();

  ctx.fillStyle = "#ffb347";
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of pumpkins) {
    ctx.fillStyle = "#ff7a1a";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a1a3d";
    ctx.fillRect(p.x - 2, p.y - p.radius - 6, 4, 6);
  }

  ctx.fillStyle = "#f5e6c8";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("🎃 " + score, 16, 32);
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

const pad = document.createElement("div");
pad.className = "touch-pad";
for (const [dir, label] of [["up", "▲"], ["left", "◀"], ["right", "▶"], ["down", "▼"]]) {
  const btn = document.createElement("button");
  btn.className = "touch-btn touch-" + dir;
  btn.textContent = label;
  btn.setAttribute("aria-label", dir);
  btn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys[dir] = true;
  });
  const release = () => { keys[dir] = false; };
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("pointerleave", release);
  pad.appendChild(btn);
}
const fire = document.createElement("button");
fire.className = "touch-btn touch-fire";
fire.textContent = "🎃";
fire.setAttribute("aria-label", "skjut");
fire.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  shoot();
});
pad.appendChild(fire);
area.appendChild(pad);

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
