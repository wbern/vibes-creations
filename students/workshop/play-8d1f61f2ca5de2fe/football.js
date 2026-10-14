// Fotbollsspel - Canvas 2D: sparka bollen i målet.
(() => {
const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.setAttribute('aria-label', 'Fotbollsspelets spelplan');
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.marginTop = '16px';
canvas.style.outline = 'none';
canvas.style.touchAction = 'manipulation';
canvas.style.webkitTapHighlightColor = 'transparent';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const GRAVITY = 900;
const BALL_R = 14;
let W = 0;
let H = 0;
let ground = 0;
let goal = { x: 0, y: 0, w: 70, h: 130 };
let ball = { x: 0, y: 0, vx: 0, vy: 0 };
let score = 0;
let scored = false;

function resetBall() {
  ball = { x: W * 0.25, y: ground - BALL_R, vx: 0, vy: 0 };
  scored = false;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = area.clientWidth || window.innerWidth;
  H = Math.max(320, Math.round(window.innerHeight * 0.5));
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ground = H - 30;
  goal = { x: W - 80, y: ground - 130, w: 70, h: 130 };
  resetBall();
}

function kick(tx, ty) {
  const vx = Math.max(-900, Math.min(900, (tx - ball.x) * 2.2));
  const vy = Math.max(-900, Math.min(900, (ty - ball.y) * 2.2 - 250));
  ball.vx = vx;
  ball.vy = vy;
}

function restart() {
  resetBall();
}

canvas.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (scored) restart();
    else kick(goal.x + goal.w / 2, goal.y + goal.h / 2);
  } else if (e.code === 'KeyR') {
    restart();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  canvas.focus();
  if (scored) {
    restart();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  kick(e.clientX - rect.left, e.clientY - rect.top);
});

function update(dt) {
  if (scored) return;
  ball.vy += GRAVITY * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.y + BALL_R > ground) {
    ball.y = ground - BALL_R;
    ball.vy *= -0.5;
    ball.vx *= 0.9;
    if (Math.abs(ball.vy) < 40) ball.vy = 0;
  }
  if (ball.x - BALL_R < 0) {
    ball.x = BALL_R;
    ball.vx = Math.abs(ball.vx) * 0.6;
  }
  if (ball.x + BALL_R > W) {
    ball.x = W - BALL_R;
    ball.vx = -Math.abs(ball.vx) * 0.6;
  }
  if (ball.y - BALL_R < 0) {
    ball.y = BALL_R;
    ball.vy = Math.abs(ball.vy) * 0.5;
  }

  if (
    ball.x > goal.x && ball.x < goal.x + goal.w &&
    ball.y > goal.y && ball.y < goal.y + goal.h
  ) {
    scored = true;
    score++;
  }
}

function drawField() {
  ctx.fillStyle = '#14301e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1d4a2c';
  ctx.fillRect(0, ground, W, H - ground);
  ctx.strokeStyle = '#2f6b3f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(W, ground);
  ctx.stroke();
}

function drawGoal() {
  ctx.strokeStyle = '#f5f0d0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(goal.x, ground);
  ctx.lineTo(goal.x, goal.y);
  ctx.lineTo(goal.x + goal.w, goal.y);
  ctx.lineTo(goal.x + goal.w, ground);
  ctx.stroke();
}

function drawBall() {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  drawField();
  drawGoal();
  drawBall();
  ctx.fillStyle = '#ff7a1a';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Mål: ' + score, 16, 30);
  ctx.textAlign = 'center';
  if (scored) {
    ctx.fillText('MÅL! Tryck för att spela igen', W / 2, 60);
  } else {
    ctx.fillText('Tryck på planen för att sparka bollen', W / 2, 30);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(loop);
})();
