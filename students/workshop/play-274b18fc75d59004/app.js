// Spökets Långa Film: en lång berättelse i scener, med ett spöke som reser runt.
const area = document.getElementById('canvas-area');
const canvas = document.createElement('canvas');
canvas.style.display = 'block';
canvas.style.width = '100%';
canvas.style.touchAction = 'manipulation';
canvas.style.userSelect = 'none';
canvas.style.webkitUserSelect = 'none';
canvas.style.webkitTouchCallout = 'none';
area.appendChild(canvas);
const ctx = canvas.getContext('2d');

const button = document.createElement('button');
button.textContent = 'Nästa scen';
button.style.cssText = 'margin-top:0.75rem;padding:0.6rem 1.2rem;font-size:1rem;border:none;border-radius:999px;background:#f97316;color:#fff;cursor:pointer;touch-action:manipulation;';
area.appendChild(button);

const SCENE_MS = 6000;
const scenes = [
  { sky: '#1e1b4b', ground: '#312e81', text: 'Spöket vaknar i ett gammalt slott.', props: ['moon', 'castle'] },
  { sky: '#0f172a', ground: '#1e293b', text: 'Det vill ut och se världen.', props: ['moon', 'tree', 'tree'] },
  { sky: '#172554', ground: '#1e3a8a', text: 'Ett fladdermus flyger förbi.', props: ['bat', 'tree', 'bat'] },
  { sky: '#2e1065', ground: '#4c1d95', text: 'Nere i dalen finns en by.', props: ['castle', 'pumpkin'] },
  { sky: '#1c1917', ground: '#292524', text: 'På kyrkogården hälsar en gammal grav.', props: ['grave', 'grave', 'moon'] },
  { sky: '#0c0a09', ground: '#1c1917', text: 'Spöket hittar en pumpa som ler.', props: ['pumpkin', 'grave', 'pumpkin'] },
  { sky: '#1e1b4b', ground: '#312e81', text: 'Nu kommer en lång, mörk skog.', props: ['tree', 'tree', 'tree'] },
  { sky: '#172554', ground: '#1e3a8a', text: 'Fladdermössen sjunger en sång.', props: ['bat', 'moon', 'bat'] },
  { sky: '#2e1065', ground: '#4c1d95', text: 'Spöket möter en katt med gröna ögon.', props: ['tree', 'pumpkin'] },
  { sky: '#0f172a', ground: '#1e293b', text: 'Vinden blåser och spöket flyger högre.', props: ['bat', 'bat', 'castle'] },
  { sky: '#0c0a09', ground: '#1c1917', text: 'Vid midnatt ringer klockan i tornet.', props: ['castle', 'moon', 'grave'] },
  { sky: '#1e1b4b', ground: '#312e81', text: 'Spöket ler, för äventyret är inte slut än.', props: ['moon', 'pumpkin', 'tree'] }
];

let W = 0;
let H = 0;
let sceneIndex = 0;
let sceneStart = performance.now();
let finished = false;
let audio = null;

function getAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

function playBoo() {
  if (!audio) return;
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.6);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + 0.7);
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = area.clientWidth;
  H = Math.max(320, window.innerHeight * 0.7);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawGhost(x, y, now) {
  const bob = Math.sin(now / 400) * 8;
  const w = 40;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(0, 0, w, Math.PI, 0);
  ctx.lineTo(w, 50);
  for (let i = 0; i < 4; i++) {
    const x1 = w - (i + 0.5) * (w);
    const x2 = w - (i + 1) * (w);
    ctx.quadraticCurveTo(x1, 70, x2, 50);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(-14, -5, 4, 0, Math.PI * 2);
  ctx.arc(14, -5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProp(kind, x, groundY, now) {
  ctx.save();
  if (kind === 'moon') {
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(x, 70, 28, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'castle') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 40, groundY - 90, 80, 90);
    ctx.fillRect(x - 50, groundY - 120, 24, 120);
    ctx.fillRect(x + 26, groundY - 120, 24, 120);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x - 8, groundY - 50, 16, 20);
  } else if (kind === 'tree') {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x - 6, groundY - 80, 12, 80);
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.moveTo(x - 36, groundY - 60);
    ctx.lineTo(x, groundY - 150);
    ctx.lineTo(x + 36, groundY - 60);
    ctx.fill();
  } else if (kind === 'pumpkin') {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(x, groundY - 18, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(x - 12, groundY - 22);
    ctx.lineTo(x - 6, groundY - 30);
    ctx.lineTo(x, groundY - 22);
    ctx.lineTo(x + 6, groundY - 30);
    ctx.lineTo(x + 12, groundY - 22);
    ctx.lineTo(x, groundY - 14);
    ctx.fill();
  } else if (kind === 'grave') {
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.moveTo(x - 14, groundY);
    ctx.lineTo(x - 14, groundY - 36);
    ctx.arc(x, groundY - 36, 14, Math.PI, 0);
    ctx.lineTo(x + 14, groundY);
    ctx.fill();
  } else if (kind === 'bat') {
    const flap = Math.sin(now / 150) * 10;
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(x, 130);
    ctx.quadraticCurveTo(x - 20, 110 + flap, x - 30, 124 + flap);
    ctx.quadraticCurveTo(x - 12, 130, x, 136);
    ctx.quadraticCurveTo(x + 12, 130, x + 30, 124 + flap);
    ctx.quadraticCurveTo(x + 20, 110 + flap, x, 130);
    ctx.fill();
  }
  ctx.restore();
}

function drawScene(now) {
  const scene = scenes[sceneIndex];
  const p = Math.min(1, (now - sceneStart) / SCENE_MS);
  ctx.fillStyle = scene.sky;
  ctx.fillRect(0, 0, W, H);
  const groundY = H * 0.78;
  ctx.fillStyle = scene.ground;
  ctx.fillRect(0, groundY, W, H - groundY);

  scene.props.forEach((kind, i) => {
    const baseX = (W / (scene.props.length + 1)) * (i + 1);
    const x = baseX - p * W * 0.4 + W * 0.2;
    drawProp(kind, x, groundY, now);
  });

  drawGhost(W * 0.3, H * 0.5, now);

  ctx.font = `${Math.max(16, Math.min(22, W / 26))}px sans-serif`;
  ctx.textAlign = 'center';
  const words = scene.text.split(' ');
  const count = Math.max(0, Math.min(words.length, Math.floor((now - sceneStart) / 350) + 1));
  const shown = words.slice(0, count).join(' ');
  const textWidth = Math.min(W - 40, ctx.measureText(shown).width + 32);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect((W - textWidth) / 2, H - 70, textWidth, 44, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(shown, W / 2, H - 42);

  if (p >= 1 && sceneIndex === scenes.length - 1 && !finished) {
    finished = true;
    button.textContent = 'Spela om';
  }
}

function nextScene() {
  if (finished) {
    sceneIndex = 0;
    finished = false;
    button.textContent = 'Nästa scen';
  } else if (sceneIndex < scenes.length - 1) {
    sceneIndex += 1;
  }
  sceneStart = performance.now();
  playBoo();
}

function frame(now) {
  if (!finished && now - sceneStart >= SCENE_MS && sceneIndex < scenes.length - 1) {
    nextScene();
  }
  ctx.clearRect(0, 0, W, H);
  drawScene(now);
  requestAnimationFrame(frame);
}

button.addEventListener('click', () => { getAudio(); nextScene(); });
canvas.addEventListener('pointerdown', () => { getAudio(); nextScene(); });
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
