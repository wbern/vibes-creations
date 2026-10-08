// Rita en hund!

const canvas = document.getElementById('dog-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 120;
  draw();
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Centrera hunden
  const cx = w / 2;
  const cy = h / 2 + 20;
  const s = Math.min(w, h) * 0.28; // skala

  // Bakgrund — ljusblå himmel
  ctx.fillStyle = '#d0eeff';
  ctx.fillRect(0, 0, w, h);

  // Gräs
  ctx.fillStyle = '#7ec850';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Kropp
  ctx.fillStyle = '#c8853a';
  roundRect(cx - s * 0.55, cy - s * 0.3, s * 1.1, s * 0.7, s * 0.18);

  // Huvud
  ctx.fillStyle = '#c8853a';
  roundRect(cx + s * 0.3, cy - s * 0.75, s * 0.65, s * 0.6, s * 0.15);

  // Öra (hängande)
  ctx.fillStyle = '#a0612a';
  roundRect(cx + s * 0.72, cy - s * 0.72, s * 0.18, s * 0.38, s * 0.09);

  // Öga
  ctx.fillStyle = '#1a1a1a';
  circle(cx + s * 0.71, cy - s * 0.48, s * 0.06);

  // Näsa
  ctx.fillStyle = '#1a1a1a';
  roundRect(cx + s * 0.82, cy - s * 0.28, s * 0.14, s * 0.09, s * 0.04);

  // Mun (leende)
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = s * 0.03;
  ctx.beginPath();
  ctx.arc(cx + s * 0.84, cy - s * 0.16, s * 0.1, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Ben (4 st)
  ctx.fillStyle = '#c8853a';
  leg(cx - s * 0.38, cy + s * 0.35, s);
  leg(cx - s * 0.12, cy + s * 0.35, s);
  leg(cx + s * 0.15, cy + s * 0.35, s);
  leg(cx + s * 0.38, cy + s * 0.35, s);

  // Svans (böjd upp)
  ctx.strokeStyle = '#a0612a';
  ctx.lineWidth = s * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.55, cy - s * 0.05);
  ctx.quadraticCurveTo(cx - s * 0.85, cy - s * 0.15, cx - s * 0.75, cy - s * 0.52);
  ctx.stroke();
}

function leg(x, y, s) {
  ctx.fillStyle = '#c8853a';
  roundRect(x - s * 0.08, y, s * 0.16, s * 0.3, s * 0.06);
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

window.addEventListener('resize', resize);
resize();
