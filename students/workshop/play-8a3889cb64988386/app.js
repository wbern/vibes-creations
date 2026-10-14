(() => {
  const WORLD_W = 500;
  const WORLD_H = 64;
  const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, WOOD = 4, LEAVES = 5;
  const COLORS = { [GRASS]: '#4f9d3a', [DIRT]: '#8b5a2b', [STONE]: '#7d7d80', [WOOD]: '#6b4423', [LEAVES]: '#2f7d32' };
  const GRAVITY = 26, JUMP_V = 10.5, RUN_V = 5.5, MAX_FALL = 26;
  const PW = 0.7, PH = 1.8, REACH = 5, EPS = 0.0001;
  const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump' };

  // Terrain
  const world = new Uint8Array(WORLD_W * WORLD_H);
  const surface = [];
  const phase = Math.random() * 6;
  for (let x = 0; x < WORLD_W; x++) {
    surface[x] = Math.round(26 + Math.sin(x * 0.035 + phase) * 5 + Math.sin(x * 0.09 + 1.3) * 2.5 + Math.sin(x * 0.23) * 1);
  }
  for (let x = 0; x < WORLD_W; x++) {
    const h = surface[x];
    for (let y = 0; y < WORLD_H; y++) {
      let t = AIR;
      if (y === h) t = GRASS;
      else if (y > h && y < h + 4) t = DIRT;
      else if (y >= h + 4) t = STONE;
      world[y * WORLD_W + x] = t;
    }
  }
  const get = (x, y) => (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) ? AIR : world[y * WORLD_W + x];
  const set = (x, y, t) => { if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) world[y * WORLD_W + x] = t; };
  let lastTree = -10;
  for (let x = 3; x < WORLD_W - 3; x++) {
    if (x - lastTree < 6 || Math.random() > 0.05) continue;
    lastTree = x;
    const base = surface[x];
    for (let i = 1; i <= 4; i++) set(x, base - i, WOOD);
    for (let dx = -2; dx <= 2; dx++) if (get(x + dx, base - 5) === AIR) set(x + dx, base - 5, LEAVES);
    for (let dx = -1; dx <= 1; dx++) if (get(x + dx, base - 6) === AIR) set(x + dx, base - 6, LEAVES);
  }

  const isSolid = (x, y) => {
    if (x < 0 || x >= WORLD_W || y >= WORLD_H) return true;
    if (y < 0) return false;
    return world[y * WORLD_W + x] !== AIR;
  };

  // Player
  const p = { x: WORLD_W / 2 - PW / 2, y: 0, vx: 0, vy: 0, onGround: false };
  p.y = surface[Math.floor(WORLD_W / 2)] - PH - 3;
  const held = { left: false, right: false };
  let jumpQueued = false;

  function moveX(dist) {
    if (dist === 0) return;
    p.x += dist;
    let hit = null;
    const y0 = Math.floor(p.y), y1 = Math.floor(p.y + PH - EPS);
    const x0 = Math.floor(p.x), x1 = Math.floor(p.x + PW - EPS);
    for (let by = y0; by <= y1; by++) {
      for (let bx = x0; bx <= x1; bx++) {
        if (!isSolid(bx, by)) continue;
        if (hit === null) hit = bx;
        else hit = dist > 0 ? Math.min(hit, bx) : Math.max(hit, bx);
      }
    }
    if (hit !== null) p.x = dist > 0 ? hit - PW - EPS : hit + 1 + EPS;
  }

  function moveY(dist) {
    if (dist === 0) return;
    p.y += dist;
    let hit = null;
    const x0 = Math.floor(p.x), x1 = Math.floor(p.x + PW - EPS);
    const y0 = Math.floor(p.y), y1 = Math.floor(p.y + PH - EPS);
    for (let by = y0; by <= y1; by++) {
      for (let bx = x0; bx <= x1; bx++) {
        if (!isSolid(bx, by)) continue;
        if (hit === null) hit = by;
        else hit = dist > 0 ? Math.min(hit, by) : Math.max(hit, by);
      }
    }
    if (hit !== null) {
      if (dist > 0) {
        p.y = hit - PH - EPS;
        p.onGround = true;
      } else {
        p.y = hit + 1 + EPS;
      }
      p.vy = 0;
    }
  }

  function step(dt) {
    p.vx = ((held.right ? 1 : 0) - (held.left ? 1 : 0)) * RUN_V;
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);
    const grounded = p.onGround;
    p.onGround = false;
    if (jumpQueued && grounded) p.vy = -JUMP_V;
    jumpQueued = false;
    moveX(p.vx * dt);
    moveY(p.vy * dt);
  }

  // Stage and controls
  const area = document.getElementById('canvas-area');
  document.querySelector('.welcome').hidden = true;
  area.innerHTML = `
    <div class="stage" tabindex="0">
      <canvas></canvas>
      <div class="pad">
        <div class="pad-group">
          <button type="button" data-k="left" aria-label="Gå vänster">◀</button>
          <button type="button" data-k="right" aria-label="Gå höger">▶</button>
        </div>
        <div class="pad-group">
          <button type="button" data-k="jump" aria-label="Hoppa">⤒</button>
        </div>
      </div>
    </div>`;
  const stage = area.querySelector('.stage');
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  stage.addEventListener('keydown', e => {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (k === 'jump') { if (!e.repeat) jumpQueued = true; }
    else held[k] = true;
  });
  stage.addEventListener('keyup', e => {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (k !== 'jump') held[k] = false;
  });
  stage.addEventListener('blur', () => { held.left = false; held.right = false; });

  stage.querySelectorAll('.pad button').forEach(btn => {
    const k = btn.dataset.k;
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      btn.setPointerCapture(e.pointerId);
      if (k === 'jump') jumpQueued = true;
      else held[k] = true;
    });
    const release = () => { if (k !== 'jump') held[k] = false; };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
  });

  // Tap or click a block within reach to break it
  canvas.addEventListener('pointerdown', e => {
    stage.focus({ preventScroll: true });
    const r = canvas.getBoundingClientRect();
    const cam = camera();
    const bx = Math.floor((e.clientX - r.left + cam.x) / BS);
    const by = Math.floor((e.clientY - r.top + cam.y) / BS);
    if (bx < 0 || bx >= WORLD_W || by < 0 || by >= WORLD_H - 1) return;
    if (world[by * WORLD_W + bx] === AIR) return;
    if (Math.hypot(bx + 0.5 - (p.x + PW / 2), by + 0.5 - (p.y + PH / 2)) > REACH) return;
    world[by * WORLD_W + bx] = AIR;
  });

  // Sizing and camera
  let W = 0, H = 0, dpr = 1, BS = 32;
  function resize() {
    const r = stage.getBoundingClientRect();
    W = r.width;
    H = r.height;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    BS = Math.max(16, Math.min(80, Math.floor(Math.min(W / 16, H / 9))));
  }

  function clampCam(v, worldPx, view) {
    return worldPx <= view ? (worldPx - view) / 2 : Math.min(Math.max(v, 0), worldPx - view);
  }

  function camera() {
    return {
      x: clampCam(p.x * BS + PW * BS / 2 - W / 2, WORLD_W * BS, W),
      y: clampCam(p.y * BS + PH * BS / 2 - H / 2, WORLD_H * BS, H),
    };
  }

  function draw() {
    const cam = camera();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5fb3ff');
    sky.addColorStop(1, '#bfe6ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const x0 = Math.max(0, Math.floor(cam.x / BS)), x1 = Math.min(WORLD_W - 1, Math.floor((cam.x + W) / BS));
    const y0 = Math.max(0, Math.floor(cam.y / BS)), y1 = Math.min(WORLD_H - 1, Math.floor((cam.y + H) / BS));
    const shade = Math.max(2, BS * 0.12);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = world[y * WORLD_W + x];
        if (t === AIR) continue;
        const sx = x * BS - cam.x, sy = y * BS - cam.y;
        ctx.fillStyle = COLORS[t];
        ctx.fillRect(sx, sy, BS + 0.5, BS + 0.5);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(sx, sy + BS - shade, BS + 0.5, shade);
      }
    }

    const px = p.x * BS - cam.x, py = p.y * BS - cam.y;
    const w = PW * BS, h = PH * BS;
    ctx.fillStyle = '#e0ac7e';
    ctx.fillRect(px, py, w, w);
    ctx.fillStyle = '#000';
    ctx.fillRect(px + w * 0.2, py + w * 0.4, BS * 0.1, BS * 0.1);
    ctx.fillRect(px + w * 0.7, py + w * 0.4, BS * 0.1, BS * 0.1);
    ctx.fillStyle = '#3b5bdb';
    ctx.fillRect(px, py + w, w, h * 0.4);
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(px, py + w + h * 0.4, w, h - w - h * 0.4);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  stage.focus({ preventScroll: true });
  requestAnimationFrame(frame);
})();
