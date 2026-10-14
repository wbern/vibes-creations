(function () {
  const stage = document.getElementById('canvas-area');
  const welcome = document.querySelector('.welcome');
  if (welcome) welcome.hidden = true;
  stage.classList.add('game-stage');

  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const controls = document.createElement('div');
  controls.className = 'touch-controls';
  controls.innerHTML =
    '<button type="button" class="hold" data-control="left">◀</button>' +
    '<button type="button" class="hold" data-control="right">▶</button>' +
    '<button type="button" class="hold jump" data-control="jump">Hopp</button>' +
    '<button type="button" class="hold boost" data-control="boost">Boost</button>' +
    '<button type="button" class="restart">Starta om</button>';
  stage.appendChild(controls);

  // Units: U = one unit of the field (scales with the preview size)
  const G = 120, JUMP_V = 66, CAR_SPEED = 45, CAR_ACC = 150;
  const CAR_W = 12, CAR_H = 7, BALL_R = 4.5, GOAL_H = 22, BALL_MAX = 150;

  // Touch controls steer the orange car
  const hold = { left: false, right: false, jump: false, boost: false };

  const players = [
    {
      name: 'Orange', color: '#ff7a18', touch: hold,
      bind: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', boost: 'ShiftRight' }
    },
    {
      name: 'Grön', color: '#7bd389', touch: null,
      bind: { left: 'KeyA', right: 'KeyD', jump: 'KeyW', boost: 'ShiftLeft' }
    }
  ];
  players.forEach((p) => {
    p.car = null;
    p.score = 0;
    p.boost = 1;
    p.prevJump = false;
  });
  const BOUND_CODES = new Set(players.flatMap((p) => Object.values(p.bind)));
  const keyState = {};

  let W = 0, H = 0, U = 1, ground = 0;
  let ball, goalTimer = 0, goalText = '', lastTime = 0;
  let stars = [];

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function resetCar(p, x) {
    p.car = { x, y: ground - CAR_H * U, vx: 0, vy: 0, onGround: true };
  }

  function resetPositions() {
    resetCar(players[0], W * 0.2);
    resetCar(players[1], W * 0.8 - CAR_W * U);
    ball = { x: W / 2, y: ground - BALL_R * U, vx: 0, vy: 0 };
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    U = Math.min(W, H) / 100;
    ground = H * 0.8;
    stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * W,
      y: Math.random() * ground * 0.9,
      r: Math.random() * 1.5 + 0.5
    }));
    if (!ball) {
      resetPositions();
    } else {
      players.forEach((p) => {
        p.car.x = clamp(p.car.x, 0, W - CAR_W * U);
        if (p.car.onGround) p.car.y = ground - CAR_H * U;
      });
      ball.x = clamp(ball.x, BALL_R * U, W - BALL_R * U);
      ball.y = Math.min(ball.y, ground - BALL_R * U);
    }
  }

  function restart() {
    players.forEach((p) => { p.score = 0; p.boost = 1; });
    goalTimer = 0;
    resetPositions();
  }

  function isGameTarget(e) {
    const t = e.composedPath()[0];
    return t === window || t === document.body || t === document.documentElement || (t instanceof Node && stage.contains(t));
  }

  let audioCtx = null;
  function startMusic() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return;
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [147, 139, 147, 117, 110, 104, 117, 98];
    let i = 0;
    setInterval(() => {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = notes[i % notes.length];
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.02, t + 0.6);
      gain.gain.linearRampToValueAtTime(0, t + 2.4);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 2.4);
      i++;
    }, 1400);
  }

  window.addEventListener('keydown', (e) => {
    if (!isGameTarget(e)) return;
    startMusic();
    if (e.code === 'KeyR') { restart(); return; }
    if (BOUND_CODES.has(e.code)) {
      e.preventDefault();
      keyState[e.code] = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (BOUND_CODES.has(e.code)) keyState[e.code] = false;
  });

  window.addEventListener('blur', () => {
    Object.keys(keyState).forEach((k) => { keyState[k] = false; });
    Object.keys(hold).forEach((k) => { hold[k] = false; });
  });

  controls.querySelectorAll('.hold').forEach((btn) => {
    const name = btn.dataset.control;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); startMusic(); hold[name] = true; });
    const release = () => { hold[name] = false; };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
  });
  controls.querySelector('.restart').addEventListener('click', restart);

  function pressed(p, action) {
    return !!keyState[p.bind[action]] || !!(p.touch && p.touch[action]);
  }

  // i = the player who scores (0 = Orange, 1 = Grön)
  function scoreGoal(i) {
    players[i].score += 1;
    goalText = players[i].name + ' gjorde mål!';
    goalTimer = 1.5;
    resetPositions();
  }

  function stepCar(c, dir, jumpPressed, boosting, dt) {
    const boostMul = boosting ? 2 : 1;
    const targetVx = dir * CAR_SPEED * U * boostMul;
    const maxStep = CAR_ACC * U * boostMul * dt;
    c.vx += clamp(targetVx - c.vx, -maxStep, maxStep);
    if (jumpPressed && c.onGround) {
      c.vy = -JUMP_V * U;
      c.onGround = false;
    }
    c.vy += G * U * dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.x = clamp(c.x, 0, W - CAR_W * U);
    const carFloor = ground - CAR_H * U;
    if (c.y >= carFloor) {
      c.y = carFloor;
      c.vy = 0;
      c.onGround = true;
    }
  }

  function update(dt) {
    for (const p of players) {
      const left = pressed(p, 'left');
      const right = pressed(p, 'right');
      const jump = pressed(p, 'jump');
      const jumpPressed = jump && !p.prevJump;
      p.prevJump = jump;

      // Boost drains while held and moving, and refills when released
      const boosting = pressed(p, 'boost') && p.boost > 0 && (left || right);
      p.boost = clamp(p.boost + (boosting ? -0.5 : 0.25) * dt, 0, 1);

      const dir = (right ? 1 : 0) - (left ? 1 : 0);
      stepCar(p.car, dir, jumpPressed, boosting, dt);
    }

    // Ball movement
    const r = BALL_R * U;
    ball.vy += G * U * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Floor
    if (ball.y + r > ground) {
      ball.y = ground - r;
      if (ball.vy > 0) ball.vy = -ball.vy * 0.65;
      if (Math.abs(ball.vy) < 6 * U) ball.vy = 0;
      ball.vx *= Math.pow(0.4, dt);
    }
    // Ceiling
    if (ball.y - r < 0) {
      ball.y = r;
      ball.vy = Math.abs(ball.vy) * 0.7;
    }

    // Side walls with goal openings
    const goalTop = ground - GOAL_H * U;
    const inMouth = ball.y > goalTop;
    if (ball.x - r < 0) {
      if (inMouth) {
        if (ball.x < -r) scoreGoal(1);
      } else {
        ball.x = r;
        ball.vx = Math.abs(ball.vx) * 0.7;
      }
    } else if (ball.x + r > W) {
      if (inMouth) {
        if (ball.x > W + r) scoreGoal(0);
      } else {
        ball.x = W - r;
        ball.vx = -Math.abs(ball.vx) * 0.7;
      }
    }

    // Cars hit ball (last, so the ball is never left inside a car)
    const cw = CAR_W * U, ch = CAR_H * U;
    for (const p of players) {
      const c = p.car;
      const cx = clamp(ball.x, c.x, c.x + cw);
      const cy = clamp(ball.y, c.y, c.y + ch);
      const dx = ball.x - cx, dy = ball.y - cy;
      const d = Math.hypot(dx, dy);
      if (d < r) {
        let nx, ny;
        if (d > 0.0001) {
          nx = dx / d; ny = dy / d;
          const overlap = r - d;
          ball.x += nx * overlap;
          ball.y += ny * overlap;
        } else {
          // Ball center inside the car: push out sideways
          const toLeft = ball.x - c.x, toRight = c.x + cw - ball.x;
          if (toLeft < toRight) { nx = -1; ball.x = c.x - r; }
          else { nx = 1; ball.x = c.x + cw + r; }
          ny = 0;
        }
        const rvn = (ball.vx - c.vx) * nx + (ball.vy - c.vy) * ny;
        if (rvn < 0) {
          const j = -(1 + 0.7) * rvn;
          ball.vx += j * nx;
          ball.vy += j * ny;
        }
      }
    }

    // Speed cap
    const sp = Math.hypot(ball.vx, ball.vy);
    const maxSp = BALL_MAX * U;
    if (sp > maxSp) {
      ball.vx *= maxSp / sp;
      ball.vy *= maxSp / sp;
    }

    if (goalTimer > 0) goalTimer = Math.max(0, goalTimer - dt);
  }

  function drawBat(x, y, s) {
    ctx.fillStyle = '#0d0614';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.6, x - s, y);
    ctx.quadraticCurveTo(x - s * 0.6, y + s * 0.1, x, y + s * 0.3);
    ctx.quadraticCurveTo(x + s * 0.6, y + s * 0.1, x + s, y);
    ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.6, x, y);
    ctx.fill();
  }

  function drawCar(c, bodyColor) {
    const x = c.x, y = c.y, cw = CAR_W * U, ch = CAR_H * U;
    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x, y + ch * 0.35, cw, ch * 0.4);
    // Cabin
    ctx.fillStyle = '#2b1a3d';
    ctx.beginPath();
    ctx.moveTo(x + cw * 0.22, y + ch * 0.35);
    ctx.lineTo(x + cw * 0.36, y);
    ctx.lineTo(x + cw * 0.7, y);
    ctx.lineTo(x + cw * 0.82, y + ch * 0.35);
    ctx.fill();
    // Glowing eyes
    ctx.fillStyle = '#ffe14d';
    ctx.beginPath();
    ctx.arc(x + cw * 0.9, y + ch * 0.5, U * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // Wheels
    ctx.fillStyle = '#0d0614';
    const wr = ch * 0.22;
    [0.22, 0.78].forEach((p) => {
      ctx.beginPath();
      ctx.arc(x + cw * p, y + ch - wr, wr, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPumpkin() {
    const x = ball.x, y = ball.y, r = BALL_R * U;
    ctx.fillStyle = '#ff8a1f';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c2510a';
    ctx.lineWidth = Math.max(1, U * 0.3);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.5, r, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Stem
    ctx.fillStyle = '#4a7a2b';
    ctx.fillRect(x - r * 0.1, y - r - r * 0.3, r * 0.2, r * 0.35);
    // Face
    ctx.fillStyle = '#1a0f2e';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y - r * 0.2);
    ctx.lineTo(x - r * 0.2, y - r * 0.5);
    ctx.lineTo(x - r * 0.1, y - r * 0.1);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.5, y - r * 0.2);
    ctx.lineTo(x + r * 0.2, y - r * 0.5);
    ctx.lineTo(x + r * 0.1, y - r * 0.1);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y + r * 0.3);
    ctx.lineTo(x + r * 0.5, y + r * 0.3);
    ctx.lineTo(x, y + r * 0.7);
    ctx.fill();
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, '#14072b');
    sky.addColorStop(1, '#4b1d6b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff4d6';
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.18, 6 * U, 0, Math.PI * 2);
    ctx.fill();

    drawBat(W * 0.15, H * 0.2, 5 * U);
    drawBat(W * 0.35, H * 0.12, 3.5 * U);
    drawBat(W * 0.6, H * 0.3, 4 * U);

    // Ground
    ctx.fillStyle = '#2b1a3d';
    ctx.fillRect(0, ground, W, H - ground);
    ctx.fillStyle = '#ff7a18';
    ctx.fillRect(0, ground, W, U * 0.8);

    // Walls and goal mouths
    const goalTop = ground - GOAL_H * U;
    ctx.fillStyle = '#6b4a8a';
    ctx.fillRect(0, 0, U * 0.8, goalTop);
    ctx.fillRect(W - U * 0.8, 0, U * 0.8, goalTop);
    ctx.fillStyle = '#ff7a18';
    ctx.fillRect(0, goalTop - U * 0.4, U * 4, U * 0.8);
    ctx.fillRect(W - U * 4, goalTop - U * 0.4, U * 4, U * 0.8);

    players.forEach((p) => drawCar(p.car, p.color));
    drawPumpkin();

    // HUD
    ctx.fillStyle = '#ffd39b';
    ctx.font = 'bold ' + Math.round(4 * U) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(players[0].name + ': ' + players[0].score + '   ' + players[1].name + ': ' + players[1].score, 2 * U, 2 * U);

    ctx.font = Math.round(2.5 * U) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Orange: piltangenter + höger Shift   |   Grön: A D W + vänster Shift', W / 2, 2 * U);

    // Boost bars: Orange on the left, Grön on the right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(2 * U, 8 * U, 30 * U, 2 * U);
    ctx.fillRect(W - 32 * U, 8 * U, 30 * U, 2 * U);
    ctx.fillStyle = players[0].color;
    ctx.fillRect(2 * U, 8 * U, 30 * U * players[0].boost, 2 * U);
    ctx.fillStyle = players[1].color;
    ctx.fillRect(W - 32 * U, 8 * U, 30 * U * players[1].boost, 2 * U);

    if (goalTimer > 0) {
      ctx.globalAlpha = Math.min(1, goalTimer);
      ctx.fillStyle = '#ff7a18';
      ctx.font = 'bold ' + Math.round(10 * U) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(goalText, W / 2, H * 0.4);
      ctx.globalAlpha = 1;
    }
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
