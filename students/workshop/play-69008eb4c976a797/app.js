(function () {
  const area = document.getElementById('canvas-area');
  const canvas = document.createElement('canvas');
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'En tjej som rider på en häst. Använd pilarna eller tryck för att gå och hoppa.');
  canvas.style.display = 'block';
  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  canvas.style.webkitUserSelect = 'none';
  canvas.style.webkitTouchCallout = 'none';
  canvas.style.outline = 'none';
  area.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  const held = { left: false, right: false };
  const pointerButtons = new Map();
  let jumpReq = false;
  let rider, ground, ladder, buttons = [], moving = false, candies = [], score = 0;
  const candyColors = ['#ff6fb5', '#ffe066', '#7ee8fa', '#b388ff', '#ff7518'];

  function spawnCandy() {
    const r = Math.min(W, H) * 0.03;
    return {
      x: r + Math.random() * (W - 2 * r),
      y: H * 0.1 + Math.random() * H * 0.4,
      r,
      color: candyColors[Math.floor(Math.random() * candyColors.length)]
    };
  }

  function layout() {
    W = Math.max(320, area.clientWidth || window.innerWidth);
    H = Math.max(420, Math.round(window.innerHeight * 0.75));
    dpr = window.devicePixelRatio || 1;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ground = { y: H * 0.78 };
    ladder = { x: W * 0.7, w: W * 0.025, topY: H * 0.3 };

    const bs = Math.min(W, H) * 0.14, pad = bs * 0.25;
    buttons = [
      { id: 'left', x: pad, y: H - bs - pad, w: bs, h: bs, label: '◀' },
      { id: 'right', x: pad * 2 + bs, y: H - bs - pad, w: bs, h: bs, label: '▶' },
      { id: 'jump', x: W - bs - pad, y: H - bs - pad, w: bs, h: bs, label: '▲' },
      { id: 'restart', x: W - bs * 0.8 - pad, y: pad, w: bs * 0.8, h: bs * 0.8, label: '↻' }
    ];
  }

  function reset() {
    const s = Math.min(W, H) * 0.3;
    rider = { x: W * 0.2, y: ground.y, vy: 0, w: s, h: s * 0.75, face: 1, grounded: true, climbing: false };
    candies = Array.from({ length: 6 }, spawnCandy);
    score = 0;
    jumpReq = false;
  }

  function update(dt) {
    const G = H * 2.2;
    const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    moving = dir !== 0;
    if (dir) rider.face = dir;
    const nearLadder = Math.abs(rider.x - ladder.x) < rider.w * 0.5 + ladder.w;

    if (rider.climbing) {
      if (dir !== 0) {
        rider.climbing = false;
      } else {
        rider.x = ladder.x;
        rider.y -= H * 0.5 * dt;
        if (rider.y <= ladder.topY) {
          rider.y = ladder.topY;
          rider.climbing = false;
          rider.grounded = true;
        }
      }
    } else {
      rider.x += dir * W * 0.3 * dt;
      rider.x = Math.max(rider.w / 2, Math.min(W - rider.w / 2, rider.x));

      if (jumpReq && rider.grounded) {
        if (nearLadder) {
          rider.climbing = true;
          rider.grounded = false;
          rider.x = ladder.x;
        } else {
          rider.vy = -H * 1.4;
          rider.grounded = false;
        }
      }

      rider.vy += G * dt;
      const prev = rider.y;
      rider.y += rider.vy * dt;
      rider.grounded = false;
      if (rider.vy >= 0) {
        const surfaces = [
          { x1: 0, x2: W, y: ground.y },
          { x1: ladder.x - ladder.w, x2: ladder.x + W * 0.15, y: ladder.topY }
        ];
        let best = null;
        for (const s of surfaces) {
          const overlap = rider.x + rider.w * 0.35 > s.x1 && rider.x - rider.w * 0.35 < s.x2;
          if (overlap && prev <= s.y + 1 && rider.y >= s.y && (!best || s.y < best.y)) best = s;
        }
        if (best) {
          rider.y = best.y;
          rider.vy = 0;
          rider.grounded = true;
        }
      }
    }
    jumpReq = false;

    const cx = rider.x, cy = rider.y - rider.h * 0.5, reach = rider.w * 0.5;
    for (let i = 0; i < candies.length; i++) {
      const c = candies[i];
      if (Math.hypot(c.x - cx, c.y - cy) < reach + c.r) {
        score++;
        candies[i] = spawnCandy();
      }
    }
  }

  function drawLadder() {
    const lw = ladder.w * 0.5;
    ctx.fillStyle = '#6b3e1e';
    ctx.fillRect(ladder.x - ladder.w, ladder.topY, W * 0.15 + ladder.w, H * 0.03);
    ctx.strokeStyle = '#c9a06b';
    ctx.lineWidth = H * 0.012;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ladder.x - lw, ground.y);
    ctx.lineTo(ladder.x - lw, ladder.topY);
    ctx.moveTo(ladder.x + lw, ground.y);
    ctx.lineTo(ladder.x + lw, ladder.topY);
    ctx.stroke();
    for (let y = ladder.topY + H * 0.05; y < ground.y; y += H * 0.06) {
      ctx.beginPath();
      ctx.moveTo(ladder.x - lw, y);
      ctx.lineTo(ladder.x + lw, y);
      ctx.stroke();
    }
  }

  function drawCandies() {
    for (const c of candies) {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.moveTo(c.x - c.r * 1.8, c.y - c.r * 0.7);
      ctx.lineTo(c.x - c.r * 1.1, c.y);
      ctx.lineTo(c.x - c.r * 1.8, c.y + c.r * 0.7);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(c.x + c.r * 1.8, c.y - c.r * 0.7);
      ctx.lineTo(c.x + c.r * 1.1, c.y);
      ctx.lineTo(c.x + c.r * 1.8, c.y + c.r * 0.7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(c.x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRider() {
    const { x, y, w, h, face } = rider;
    const cy = y - h * 0.5;
    const swing = moving ? Math.sin(performance.now() / 90) * h * 0.12 : 0;

    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6b3e1e';
    ctx.lineWidth = h * 0.1;
    const legX = [x + face * w * 0.25, x - face * w * 0.25];
    const legSwing = [swing, -swing];
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(legX[i] + legSwing[i] * 0.3, cy + h * 0.12);
      ctx.lineTo(legX[i] + legSwing[i], y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#3b2314';
    ctx.lineWidth = h * 0.08;
    ctx.beginPath();
    ctx.moveTo(x - face * w * 0.36, cy - h * 0.1);
    ctx.quadraticCurveTo(x - face * w * 0.52, cy - h * 0.05, x - face * w * 0.5, cy + h * 0.25);
    ctx.stroke();

    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(x, cy, w * 0.38, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = h * 0.2;
    ctx.beginPath();
    ctx.moveTo(x + face * w * 0.3, cy - h * 0.1);
    ctx.lineTo(x + face * w * 0.5, cy - h * 0.55);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x + face * w * 0.54, cy - h * 0.62, w * 0.1, h * 0.16, face * 0.4, 0, Math.PI * 2);
    ctx.fill();

    const bodyTop = cy - h * 0.28;
    const tw = h * 0.3, th = h * 0.42;
    ctx.fillStyle = '#ff6fb5';
    ctx.fillRect(x - tw / 2, bodyTop - th, tw, th);

    const hr = h * 0.17;
    const hx = x + face * h * 0.02, hy = bodyTop - th - hr * 0.8;
    ctx.fillStyle = '#ffd7b5';
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb830';
    ctx.beginPath();
    ctx.arc(hx, hy, hr * 1.05, Math.PI, 0);
    ctx.lineTo(hx + hr * 0.9 * -face, hy + hr * 0.6);
    ctx.lineTo(hx - hr * 1.1 * face, hy + hr * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a0b2e';
    ctx.beginPath();
    ctx.arc(hx + face * hr * 0.35, hy + hr * 0.1, hr * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb830';
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.1, bodyTop - th);
    ctx.lineTo(x - tw * 0.1 - face * hr * 1.2, bodyTop - th + hr * 0.6);
    ctx.lineTo(x - tw * 0.1 - face * hr * 0.3, bodyTop - th + hr * 1.6);
    ctx.fill();
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a0b2e');
    g.addColorStop(1, '#4a1942');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff8dc';
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.18, Math.min(W, H) * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2b1d3d';
    ctx.beginPath();
    ctx.ellipse(W * 0.3, ground.y + H * 0.02, W * 0.35, H * 0.12, 0, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#2b1d10';
    ctx.fillRect(0, ground.y, W, H - ground.y);

    const pr = Math.min(W, H) * 0.04;
    for (const [px, s] of [[W * 0.08, 1], [W * 0.92, 0.8], [W * 0.55, 0.6]]) {
      const r = pr * s;
      ctx.fillStyle = '#ff7518';
      ctx.beginPath();
      ctx.ellipse(px, ground.y - r * 0.2, r * 1.2, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d7a1f';
      ctx.fillRect(px - r * 0.1, ground.y - r * 1.5, r * 0.2, r * 0.4);
    }

    ctx.fillStyle = '#0d0517';
    for (const [bx, by] of [[W * 0.25, H * 0.1], [W * 0.6, H * 0.16], [W * 0.75, H * 0.07]]) {
      ctx.beginPath();
      ctx.ellipse(bx, by, W * 0.02, H * 0.012, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - W * 0.02, by);
      ctx.lineTo(bx - W * 0.035, by - H * 0.02);
      ctx.lineTo(bx - W * 0.008, by - H * 0.004);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx + W * 0.02, by);
      ctx.lineTo(bx + W * 0.035, by - H * 0.02);
      ctx.lineTo(bx + W * 0.008, by - H * 0.004);
      ctx.fill();
    }

    const lineY = H * 0.35 + Math.sin(performance.now() / 400) * H * 0.12;
    ctx.strokeStyle = '#ff2d2d';
    ctx.lineWidth = H * 0.025;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(W, lineY);
    ctx.stroke();

    drawLadder();
    drawCandies();
    drawRider();

    ctx.fillStyle = '#fff8dc';
    ctx.textAlign = 'left';
    ctx.font = Math.round(H * 0.05) + 'px sans-serif';
    ctx.fillText('Godis: ' + score, W * 0.03, H * 0.06);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const b of buttons) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#fff';
      ctx.font = Math.round(b.h * 0.45) + 'px sans-serif';
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
    }
  }

  function hit(e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    return buttons.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const b = hit(e);
    if (!b) { jumpReq = true; return; }
    pointerButtons.set(e.pointerId, b.id);
    if (b.id === 'left' || b.id === 'right') held[b.id] = true;
    if (b.id === 'jump') jumpReq = true;
    if (b.id === 'restart') reset();
  });

  const release = e => {
    const id = pointerButtons.get(e.pointerId);
    if (id === 'left' || id === 'right') held[id] = false;
    pointerButtons.delete(e.pointerId);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function setKey(k, down, e) {
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      held.left = down;
      e && e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      held.right = down;
      e && e.preventDefault();
    } else if (down && (k === 'ArrowUp' || k === ' ' || k === 'w' || k === 'W')) {
      if (!e.repeat) jumpReq = true;
      e.preventDefault();
    } else if (down && (k === 'r' || k === 'R')) {
      reset();
    }
  }

  canvas.addEventListener('keydown', e => setKey(e.key, true, e));
  canvas.addEventListener('keyup', e => setKey(e.key, false, e));
  canvas.addEventListener('blur', () => { held.left = false; held.right = false; });

  window.addEventListener('resize', () => { layout(); reset(); });

  layout();
  reset();
  let last = performance.now();
  function frame(t) {
    const dt = Math.min(0.033, (t - last) / 1000);
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
