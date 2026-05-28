// Super Mario — KAPLAY 3001  (eldblomma + fireballs)

// ── Web Audio ─────────────────────────────────────────────────────────────
const AC = new (window.AudioContext || window.webkitAudioContext)();
function unlockAudio() { if (AC.state === "suspended") AC.resume(); }
document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("keydown",     unlockAudio, { once: true });
function beep(freq, type, dur, vol = 0.18, delay = 0) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.connect(g); g.connect(AC.destination);
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, AC.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + delay + dur);
  o.start(AC.currentTime + delay); o.stop(AC.currentTime + delay + dur);
}
function sfxJump()     { beep(380,"square",.12); beep(520,"square",.12,.14,.06); }
function sfxCoin()     { beep(880,"sine",.08); beep(1100,"sine",.12,.18,.06); }
function sfxStomp()    { beep(120,"square",.15,.3); }
function sfxDie()      { [400,300,200,150].forEach((f,i)=>beep(f,"square",.1,.2,i*.08)); }
function sfxWin()      { [523,659,784,1047].forEach((f,i)=>beep(f,"sine",.18,.22,i*.14)); }
function sfxBump()     { beep(200,"square",.08,.25); }
function sfxPowerup()  { [261,329,392,523].forEach((f,i)=>beep(f,"square",.15,.2,i*.1)); }
function sfxFireball() { beep(600,"square",.05,.18); beep(900,"square",.04,.12,.04); }
function sfxLosePower(){ [523,392,329,261].forEach((f,i)=>beep(f,"square",.1,.2,i*.08)); }

// ── Pixel-sprite helper ───────────────────────────────────────────────────
function makeSprite(rows, palette) {
  const h = rows.length, w = rows[0].length;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  rows.forEach((row, y) => row.forEach((p, x) => {
    if (!p) return;
    ctx.fillStyle = palette[p];
    ctx.fillRect(x, y, 1, 1);
  }));
  return cv.toDataURL();
}

// ── Sprites ───────────────────────────────────────────────────────────────

const SPR_MARIO = makeSprite([
  [0,0,0,1,1,1,1,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,0,0,0,0],
  [0,0,4,4,2,2,2,4,4,0,0,0],
  [0,4,2,4,2,2,2,4,2,4,0,0],
  [0,4,2,2,2,2,2,2,2,4,0,0],
  [0,0,2,4,4,4,4,2,0,0,0,0],
  [0,2,1,3,1,1,3,1,2,0,0,0],
  [0,1,1,3,3,3,3,3,1,1,0,0],
  [1,1,1,3,3,3,3,3,1,1,1,0],
  [0,1,3,3,3,3,3,3,3,1,0,0],
  [0,0,3,3,0,0,3,3,0,0,0,0],
  [0,4,4,4,0,0,4,4,4,0,0,0],
  [4,4,4,4,0,0,4,4,4,4,0,0],
  [4,4,4,4,0,0,0,4,4,4,0,0],
  [4,4,4,0,0,0,0,4,4,4,0,0],
  [0,4,4,0,0,0,0,0,4,4,0,0],
], ['','#e03020','#ffa060','#3060d0','#604020']);

const SPR_GROUND = makeSprite([
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,3,4,3,3,3,4,3,3,3,3,4,3,3,3,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,4,3,3,3,3,3,3,4,3,3,3,3,3,4,3],
  [3,3,3,3,3,4,3,3,3,3,3,3,3,3,3,3],
  [3,3,3,3,3,3,3,3,3,3,4,3,3,3,3,3],
  [3,3,3,4,3,3,3,3,3,3,3,3,3,4,3,3],
  [3,3,3,3,3,3,3,4,3,3,3,3,3,3,3,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,4,3,3,3,3,3,3,3,3,3,3,4,3,3,4],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,3,3,3,4,3,3,3,3,4,3,3,3,3,3,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,3,4,3,3,3,3,3,3,3,3,4,3,3,3,3],
], ['','#6abf30','#4a9f10','#b87840','#8b5a28']);

const SPR_BRICK = makeSprite([
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,1,1,1,1,1,3,1,1,1,1,1,1,1,1,3],
  [3,1,1,1,1,1,3,1,1,1,1,1,1,1,1,3],
  [3,2,1,1,1,2,3,2,1,1,1,1,1,1,2,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [1,1,1,3,1,1,1,1,1,3,1,1,1,1,3,1],
  [1,1,1,3,1,1,1,1,1,3,1,1,1,1,3,1],
  [2,1,1,3,1,1,2,1,1,3,1,1,2,1,3,2],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,1,1,1,1,1,3,1,1,1,1,1,1,1,1,3],
  [3,1,1,1,1,1,3,1,1,1,1,1,1,1,1,3],
  [3,2,1,1,1,2,3,2,1,1,1,1,1,1,2,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [1,1,1,3,1,1,1,1,1,3,1,1,1,1,3,1],
  [1,1,1,3,1,1,1,1,1,3,1,1,1,1,3,1],
  [2,1,1,3,1,1,2,1,1,3,1,1,2,1,3,2],
], ['','#c87040','#804020','#e0b870']);

const SPR_COIN = makeSprite([
  [0,0,1,1,1,1,1,1,0,0],
  [0,1,2,2,2,1,1,1,1,0],
  [1,1,2,1,1,2,1,1,1,1],
  [1,1,2,1,1,1,2,1,1,1],
  [1,1,1,1,1,1,3,1,1,1],
  [1,1,1,1,1,3,3,1,1,1],
  [1,1,3,1,3,3,1,1,1,1],
  [1,1,3,3,3,1,1,1,1,0],
  [0,1,1,3,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,0,0,0],
], ['','#ffd700','#fff8a0','#c89000']);

const SPR_GOOMBA = makeSprite([
  [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,1,2,2,2,2,2,2,2,1,0,0,0],
  [0,1,2,2,2,2,2,2,2,2,2,1,0,0],
  [1,2,3,4,2,2,2,2,4,3,2,2,1,0],
  [1,2,3,3,3,2,2,3,3,3,2,2,1,0],
  [1,2,2,2,2,2,2,2,2,2,2,2,1,0],
  [1,2,2,3,3,3,3,3,3,2,2,2,1,0],
  [0,1,2,2,3,2,2,3,2,2,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,2,4,4,2,0,0,2,4,4,2,0,0,0],
  [2,4,4,4,2,0,0,2,4,4,4,2,0,0],
  [2,4,4,4,0,0,0,0,4,4,4,2,0,0],
], ['','#8b4513','#c87840','#000000','#ffffff']);

const SPR_QBLOCK = makeSprite([
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3],
  [3,1,2,2,2,2,2,2,2,2,2,2,2,2,1,3],
  [3,2,2,2,2,5,5,5,5,5,2,2,2,2,2,3],
  [3,2,2,2,5,2,2,2,2,2,5,2,2,2,2,3],
  [3,2,2,2,2,2,2,2,2,5,2,2,2,2,2,3],
  [3,2,2,2,2,2,2,2,5,2,2,2,2,2,2,3],
  [3,2,2,2,2,2,2,5,2,2,2,2,2,2,2,3],
  [3,2,2,2,2,2,2,5,2,2,2,2,2,2,2,3],
  [3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3],
  [3,2,2,2,2,2,5,5,2,2,2,2,2,2,2,3],
  [3,2,2,2,2,2,5,5,2,2,2,2,2,2,2,3],
  [3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3],
  [3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,3],
  [3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
], ['','#fff0a0','#f0a000','#000000','#a06000','#ffffff']);

// Blomma (grön, mark-dekoration) 8×12
const SPR_FLOWER = makeSprite([
  [0,0,0,2,2,0,0,0],
  [0,0,2,3,3,2,0,0],
  [0,2,3,3,3,3,2,0],
  [2,3,3,3,3,3,3,2],
  [0,2,3,3,3,3,2,0],
  [0,0,2,3,3,2,0,0],
  [0,0,0,2,2,0,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,4,1,1,0,0,0],
  [0,0,0,1,1,4,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,1,1,0,0,0],
], ['','#3a9f10','#ff3333','#ffdd00','#4abf20']);

// Eldblomma (vit+orange, i ?-lådan) 8×12
const SPR_FIREFLOWER = makeSprite([
  [0,0,0,1,1,0,0,0],
  [0,0,1,2,2,1,0,0],
  [0,1,2,3,3,2,1,0],
  [1,2,3,3,3,3,2,1],
  [0,1,2,3,3,2,1,0],
  [0,0,1,2,2,1,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,4,4,0,0,0],
  [0,0,5,4,4,0,0,0],
  [0,0,0,4,4,5,0,0],
  [0,0,0,4,4,0,0,0],
  [0,0,0,4,4,0,0,0],
], ['','#ffffff','#ff8800','#ff3300','#3a9f10','#4abf20']);

// Fireball 6×5
const SPR_FIREBALL = makeSprite([
  [0,1,1,0,0,0],
  [1,2,2,1,0,0],
  [1,2,3,1,0,0],
  [1,2,2,1,0,0],
  [0,1,1,0,0,0],
], ['','#ff4000','#ff9000','#ffffff']);

// ── KAPLAY init ───────────────────────────────────────────────────────────
const k = kaplay({
  width: 480, height: 270,
  letterbox: true,
  background: [107, 185, 240],
  pixelDensity: Math.min(window.devicePixelRatio, 2),
});

k.loadSprite("mario",       SPR_MARIO);
k.loadSprite("ground",      SPR_GROUND);
k.loadSprite("brick",       SPR_BRICK);
k.loadSprite("coin",        SPR_COIN);
k.loadSprite("goomba",      SPR_GOOMBA);
k.loadSprite("qblock",      SPR_QBLOCK);
k.loadSprite("flower",      SPR_FLOWER);
k.loadSprite("fireflower",  SPR_FIREFLOWER);
k.loadSprite("fireball",    SPR_FIREBALL);

// ── Globalt state ─────────────────────────────────────────────────────────
let SCORE = 0, LIVES = 3;

// ── Banlayouter — ? = myntlåda, ! = eldblomslåda, f = blomma ─────────────
const LEVELS = [
  [
    "                                        ",
    "                                        ",
    "                                        ",
    "     ? !^^   ?                          ",
    "                   ^^^          F       ",
    "         @@@              @@@   =       ",
    "  G  f f        G    f  f               ",
    "========================================",
  ],
  [
    "                                        ",
    "                                        ",
    "        ? !^^    ? ^^^                  ",
    "                                  F     ",
    "    @@@         @@@         @@@   =     ",
    "  G  f    G   f       G   f       G    ",
    "========================================",
  ],
  [
    "                                        ",
    "     ? !^^   ^^^   ^^! ?                ",
    "                          ^^^     F     ",
    "  @@@      @@@      @@@         @ =     ",
    "      @@@      @@@      @@@   @         ",
    "  G  f G  G f     G  G      f G   f G  ",
    "========================================",
  ],
];
const TILE = 16;

// ── Scen: SPEL ────────────────────────────────────────────────────────────
k.scene("game", (lvlIndex) => {
  k.setGravity(1200);
  const layout = LEVELS[lvlIndex - 1];
  const skyColors = [[107,185,240],[60,120,200],[20,20,60]];
  k.setBackground(...skyColors[lvlIndex - 1]);

  // Moln
  [[50,30],[160,18],[300,40],[400,22]].forEach(([cx,cy]) => {
    k.add([k.rect(52,18), k.color(255,255,255), k.pos(cx,cy),      k.opacity(0.9), k.fixed(), k.z(0)]);
    k.add([k.rect(36,14), k.color(255,255,255), k.pos(cx-8,cy+10), k.opacity(0.9), k.fixed(), k.z(0)]);
  });

  const levelObj = k.addLevel(layout, {
    tileWidth: TILE, tileHeight: TILE,
    pos: k.vec2(0, k.height() - layout.length * TILE),
    tiles: {
      "=": () => [k.sprite("ground"),  k.area(), k.body({ isStatic: true }), "ground"],
      "@": () => [k.sprite("brick"),   k.area(), k.body({ isStatic: true }), "ground"],
      "^": () => [k.sprite("coin"),    k.pos(3,3), k.area({ shape: new k.Rect(k.vec2(0),10,10) }), "coin"],
      "G": () => [k.sprite("goomba"),  k.pos(1,4), k.area({ shape: new k.Rect(k.vec2(0),14,12) }),
                  k.body(), k.move(k.LEFT,36), "enemy", { used: false }],
      "F": () => [k.rect(4,TILE*3), k.color(34,204,68), k.pos(6,-TILE*2),
                  k.area({ shape: new k.Rect(k.vec2(0),4,TILE*3) }), "flag"],
      "?": () => [k.sprite("qblock"),  k.area(), k.body({ isStatic:true }), "ground","qblock",
                  { used:false, gives:"coin" }],
      "!": () => [k.sprite("qblock"),  k.area(), k.body({ isStatic:true }), "ground","qblock",
                  { used:false, gives:"fireflower" }],
      "f": () => [k.sprite("flower"),  k.pos(4,-4), k.z(1)],
    },
  });

  // ── Mario ───────────────────────────────────────────────────────────
  const mario = k.add([
    k.sprite("mario"),
    k.color(255,255,255),   // vit = normal tint
    k.pos(24, k.height() - layout.length * TILE - 20),
    k.area({ shape: new k.Rect(k.vec2(0),12,16) }),
    k.body({ jumpForce: 520 }),
    k.z(5), "mario",
    { powered: false },
  ]);

  let facingRight = true;
  function setFacing(r) { if (facingRight!==r) { facingRight=r; mario.flipX=!r; } }

  // ── Kamera ──────────────────────────────────────────────────────────
  k.onUpdate(() => k.setCamPos(Math.max(k.width()/2, mario.pos.x+6), k.height()/2));

  // ── Kontroller ──────────────────────────────────────────────────────
  const SPEED = 120;
  const touching = { left:false, right:false };

  k.onKeyDown("left",  () => { mario.move(-SPEED,0); setFacing(false); });
  k.onKeyDown("right", () => { mario.move( SPEED,0); setFacing(true);  });
  k.onKeyPress("up",    doJump);
  k.onKeyPress("space", doJump);
  k.onKeyPress("z",     shootFire);
  k.onKeyPress("x",     shootFire);

  // Backup-lyssnare direkt på fönstret (om iframe-focus saknas)
  const keyHandler = (e) => {
    if (e.key === "ArrowLeft")  { mario.move(-SPEED,0); setFacing(false); }
    if (e.key === "ArrowRight") { mario.move( SPEED,0); setFacing(true);  }
    if (e.key === "ArrowUp" || e.key === " ") doJump();
    if (e.key === "z" || e.key === "x" || e.key === "Z" || e.key === "X") shootFire();
  };
  window.addEventListener("keydown", keyHandler);
  k.onSceneLeave(() => window.removeEventListener("keydown", keyHandler));

  const btnL    = document.getElementById("btn-left");
  const btnR    = document.getElementById("btn-right");
  const btnU    = document.getElementById("btn-up");
  const btnFire = document.getElementById("btn-fire");
  const stopL = () => { touching.left  = false; };
  const stopR = () => { touching.right = false; };
  btnL.addEventListener("pointerdown", () => { touching.left  = true; });
  btnL.addEventListener("pointerup",   stopL); btnL.addEventListener("pointercancel", stopL);
  btnR.addEventListener("pointerdown", () => { touching.right = true; });
  btnR.addEventListener("pointerup",   stopR); btnR.addEventListener("pointercancel", stopR);
  btnU.addEventListener("pointerdown",    doJump);
  btnFire.addEventListener("pointerdown", shootFire);

  k.onUpdate(() => {
    if (touching.left)  { mario.move(-SPEED,0); setFacing(false); }
    if (touching.right) { mario.move( SPEED,0); setFacing(true);  }
  });

  function doJump()   { if (mario.isGrounded()) { mario.jump(); sfxJump(); } }

  // ── Fireball ────────────────────────────────────────────────────────
  function shootFire() {
    if (!mario.powered) return;
    if (k.get("fireball").length >= 2) return;  // max 2 åt gången
    sfxFireball();
    const fb = k.add([
      k.sprite("fireball"),
      k.pos(mario.pos.x + (facingRight ? 13 : -6), mario.pos.y + 7),
      k.area({ shape: new k.Rect(k.vec2(0),6,5) }),
      k.move(facingRight ? k.RIGHT : k.LEFT, 220),
      k.z(7), "fireball",
    ]);
    // Fireball försvinner vid krock med mark eller efter 2 sek
    fb.onCollide("ground",   () => { if (fb.exists()) fb.destroy(); });
    k.wait(2, () => { if (fb.exists()) fb.destroy(); });
  }

  // Fireballs träffar fiender
  k.onCollide("fireball","enemy", (fb, e) => {
    if (!fb.exists() || !e.exists()) return;  // förhindra dubbel-trigger
    // Liten explosion — använd fb.pos (världskoordinat, inte lokal)
    const boom = k.add([k.rect(12,12), k.color(255,160,0), k.pos(fb.pos.clone()), k.z(9), k.opacity(1)]);
    k.wait(0.3, () => { if (boom.exists()) boom.destroy(); });
    e.destroy();
    fb.destroy();
    SCORE += 100; sfxStomp(); updateHUD();
  });

  // ── ?-låda träffad underifrån ────────────────────────────────────────
  let prevVelY = 0;
  k.onUpdate(() => { prevVelY = mario.vel.y; });

  mario.onCollide("qblock", (q) => {
    if (q.used) return;
    if ((q.pos.y + levelObj.pos.y) < mario.pos.y && prevVelY < 0) {
      q.used = true;
      sfxBump();
      // q.pos är lokal (relativ till levelObj) — omvandla till världskoordinat
      const p = q.pos.add(levelObj.pos);
      const gives = q.gives;
      q.destroy();
      // Grått "använt" block
      k.add([k.rect(TILE,TILE), k.color(k.rgb(130,120,110)),
             k.pos(p), k.area(), k.body({isStatic:true}), "ground"]);

      if (gives === "fireflower") {
        spawnFireFlower(p);
      } else {
        // Mynt-pop
        SCORE += 10; sfxCoin(); updateHUD();
        const pop = k.add([k.sprite("coin"), k.pos(p.x+3, p.y-6), k.z(8)]);
        let t=0;
        const u = k.onUpdate(()=>{ t+=k.dt(); pop.pos.y-=80*k.dt(); pop.opacity=1-t*2; if(t>.5){pop.destroy();u.cancel();} });
      }
    }
  });

  function spawnFireFlower(p) {
    const ff = k.add([
      k.sprite("fireflower"),
      k.pos(p.x+4, p.y),
      k.area({ shape: new k.Rect(k.vec2(0),8,12) }),
      k.z(6), "pickup",
    ]);
    // Blomman glider upp ur lådan
    let t=0;
    const u = k.onUpdate(()=>{ t+=k.dt(); ff.pos.y = p.y - t*30; if(t>0.5) u.cancel(); });

    ff.onCollide("mario", () => {
      ff.destroy();
      mario.powered = true;
      mario.color = k.rgb(255, 170, 60);  // orange tint = eld-Mario
      sfxPowerup();
      updateHUD();
    });
  }

  // ── Fiender vänder ──────────────────────────────────────────────────
  const maxX = layout[0].length * TILE - 4;
  k.onUpdate("enemy", (e) => {
    if (e.pos.x < 4)    { e.unuse("move"); e.use(k.move(k.RIGHT,36)); }
    if (e.pos.x > maxX) { e.unuse("move"); e.use(k.move(k.LEFT, 36)); }
  });

  // ── Kollisioner ──────────────────────────────────────────────────────
  mario.onCollide("coin",  (c) => { c.destroy(); SCORE+=10; sfxCoin();  updateHUD(); });
  mario.onCollide("flag",  ()  => levelComplete());
  mario.onCollide("enemy", (e) => {
    if (mario.vel.y > 20) {
      e.destroy(); SCORE+=50; sfxStomp(); mario.jump(280); updateHUD();
    } else if (mario.powered) {
      // Förlorar eldkraft istället för att dö
      mario.powered = false;
      mario.color = k.rgb(255,255,255);
      sfxLosePower(); updateHUD();
    } else {
      hitByEnemy();
    }
  });

  k.onUpdate("mario", () => { if (mario.pos.y > k.height()+60) hitByEnemy(); });

  // ── HUD ──────────────────────────────────────────────────────────────
  const hudScore = k.add([k.text("",{size:11}), k.pos(4, 2), k.fixed(), k.z(20)]);
  const hudLives = k.add([k.text("",{size:11}), k.pos(4,16), k.fixed(), k.z(20)]);
  const hudLevel = k.add([k.text("",{size:11}), k.pos(4,30), k.fixed(), k.z(20)]);
  const hudPower = k.add([k.text("",{size:11}), k.pos(4,44), k.fixed(), k.z(20), k.color(255,170,60)]);
  function updateHUD() {
    hudScore.text = `POÄNG: ${SCORE}`;
    hudLives.text = `LIV: ${LIVES}`;
    hudLevel.text = `BANA: ${lvlIndex}/3`;
    hudPower.text = mario.powered ? "🔥 ELD-MARIO" : "";
  }
  updateHUD();

  function hitByEnemy() {
    LIVES--; sfxDie();
    k.go(LIVES <= 0 ? "gameover" : "game", LIVES <= 0 ? undefined : lvlIndex);
  }
  function levelComplete() {
    sfxWin();
    k.go(lvlIndex < 3 ? "levelclear" : "win", lvlIndex);
  }
});

// ── Scen: BANA KLAR ───────────────────────────────────────────────────────
k.scene("levelclear", (lvlIndex) => {
  k.setBackground(20,20,20);
  k.add([k.text(`Bana ${lvlIndex} klar! 🎉`,{size:28}), k.pos(k.width()/2,k.height()/2-30), k.anchor("center")]);
  k.add([k.text(`Poäng: ${SCORE}`,          {size:16}), k.pos(k.width()/2,k.height()/2+10), k.anchor("center")]);
  k.add([k.text("↑ / Space",                {size:11}), k.pos(k.width()/2,k.height()/2+38), k.anchor("center"), k.color(180,180,180)]);
  const next = () => k.go("game", lvlIndex+1);
  k.onKeyPress("space",next); k.onKeyPress("up",next);
  document.getElementById("btn-up").addEventListener("pointerdown", next, {once:true});
});

// ── Scen: VANN ────────────────────────────────────────────────────────────
k.scene("win", () => {
  k.setBackground(10,60,10);
  k.add([k.text("Du vann! 🏆",           {size:32}), k.pos(k.width()/2,k.height()/2-40), k.anchor("center")]);
  k.add([k.text(`Slutpoäng: ${SCORE}`,   {size:18}), k.pos(k.width()/2,k.height()/2+  5), k.anchor("center")]);
  k.add([k.text("↑ / Space = igen",      {size:10}), k.pos(k.width()/2,k.height()/2+ 38), k.anchor("center"), k.color(180,220,180)]);
  const restart = () => { SCORE=0; LIVES=3; k.go("game",1); };
  k.onKeyPress("space",restart); k.onKeyPress("up",restart);
  document.getElementById("btn-up").addEventListener("pointerdown", restart, {once:true});
});

// ── Scen: GAME OVER ───────────────────────────────────────────────────────
k.scene("gameover", () => {
  k.setBackground(60,10,10);
  k.add([k.text("GAME OVER",              {size:32}), k.pos(k.width()/2,k.height()/2-30), k.anchor("center"), k.color(255,80,80)]);
  k.add([k.text(`Poäng: ${SCORE}`,        {size:16}), k.pos(k.width()/2,k.height()/2+10), k.anchor("center")]);
  k.add([k.text("↑ / Space = försök igen",{size:10}), k.pos(k.width()/2,k.height()/2+38), k.anchor("center"), k.color(200,150,150)]);
  const restart = () => { SCORE=0; LIVES=3; k.go("game",1); };
  k.onKeyPress("space",restart); k.onKeyPress("up",restart);
  document.getElementById("btn-up").addEventListener("pointerdown", restart, {once:true});
});

k.go("game", 1);
