import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Scenen: rummet vår banan lever i.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d2b17);
// Fog = dis. Saker längre bort blir suddigare och smälter in i
// bakgrunden, precis som riktig djungeldimma.
scene.fog = new THREE.Fog(0x0d2b17, 4, 13);

// Kameran: vårt öga in i scenen. Flyttad bakåt så vi inte hamnar INUTI bananen.
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1, 6);
camera.lookAt(0, 0, 0);

// Renderaren ritar ut scenen i webbläsaren.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Ljus — utan det syns inte gul färg på bananen alls.
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(4, 6, 5);
scene.add(dirLight);

// --- Bygg bananen ---
// Vi ritar en böjd kurva (som ett halvt leende) och "sveper" en
// kantig form längs den, som att dra en stjärnformad pastafabrik
// längs en båge. Formen blir smalare mot ändarna, precis som en
// riktig banan — det är det en enkel rund cylinder inte klarar.
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.6, -0.6, 0),
  new THREE.Vector3(-0.8, 0.1, 0),
  new THREE.Vector3(0, 0.35, 0),
  new THREE.Vector3(0.8, 0.1, 0),
  new THREE.Vector3(1.6, -0.5, 0),
]);

// Bygger en egen bananform: går längs kurvan steg för steg och ritar
// en "stjärna" (5 hörn = bananens naturliga kanter) runt varje punkt.
function buildBananaGeometry(curve, segments = 60, ridges = 5) {
  const positions = [];
  const indices = [];
  const ringVerts = ridges; // antal hörn runt varje snitt

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    // Bygg ett lokalt koordinatsystem (upp/sida) vinkelrätt mot kurvan.
    let up = Math.abs(tangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, side).normalize();

    // Tunnare i båda ändarna, tjockast i mitten.
    const radius = 0.08 + 0.28 * Math.sin(Math.PI * t);

    for (let j = 0; j < ringVerts; j++) {
      const angle = (j / ringVerts) * Math.PI * 2;
      // Lite extra bula på hörnen så det blir kantiga "ås"-linjer.
      const bump = 1 + 0.18 * Math.cos(ringVerts * angle * 0);
      const r = radius * bump;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const vertex = point.clone()
        .addScaledVector(side, x)
        .addScaledVector(normal, y);
      positions.push(vertex.x, vertex.y, vertex.z);
    }
  }

  // Koppla ihop varje ring med nästa ring med trianglar (som en strumpa).
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < ringVerts; j++) {
      const a = i * ringVerts + j;
      const b = i * ringVerts + ((j + 1) % ringVerts);
      const c = (i + 1) * ringVerts + j;
      const d = (i + 1) * ringVerts + ((j + 1) % ringVerts);
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const bananaGeo = buildBananaGeometry(curve, 60, 5);
const bananaMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.55, flatShading: true, side: THREE.DoubleSide });
const banana = new THREE.Group();
const body = new THREE.Mesh(bananaGeo, bananaMat);
banana.add(body);

// Två små bruna "ändar" så det verkligen ser ut som en banan.
const tipMat = new THREE.MeshStandardMaterial({ color: 0x6b4423 });
const tip1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), tipMat);
tip1.position.copy(curve.getPoint(0));
tip1.rotation.z = 1.0;
banana.add(tip1);

const tip2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 8), tipMat);
tip2.position.copy(curve.getPoint(1));
tip2.rotation.z = -1.3;
banana.add(tip2);

scene.add(banana);

// --- Djungelblad ---
// Enkla platta löv (ihoptryckta klot) i olika gröna nyanser, spridda
// runt bananen. Ju längre bort desto mer suddar dimman ut dem.
function makeLeaf(x, y, z, scale, hue) {
  const leafGeo = new THREE.SphereGeometry(0.6, 8, 6);
  leafGeo.scale(1, 0.25, 0.5); // platta till klotet till ett blad
  const leafMat = new THREE.MeshStandardMaterial({ color: hue, roughness: 0.8 });
  const leaf = new THREE.Mesh(leafGeo, leafMat);
  leaf.position.set(x, y, z);
  leaf.rotation.z = Math.random() * Math.PI;
  leaf.rotation.y = Math.random() * Math.PI;
  leaf.scale.setScalar(scale);
  return leaf;
}

const leafColors = [0x2f8f3e, 0x1f6b2b, 0x3fae4f, 0x256b32];
for (let i = 0; i < 18; i++) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 3 + Math.random() * 6;
  const x = Math.cos(angle) * dist;
  const z = -Math.abs(Math.sin(angle) * dist) - 1; // mest bakom bananen
  const y = -1.5 + Math.random() * 4;
  const color = leafColors[i % leafColors.length];
  scene.add(makeLeaf(x, y, z, 0.8 + Math.random() * 1.2, color));
}

// Du kan dra med musen/fingret för att rotera vyn själv också.
const controls = new OrbitControls(camera, renderer.domElement);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Rörelseloopen — körs om och om igen, ~60 gånger per sekund.
renderer.setAnimationLoop(() => {
  banana.rotation.y += 0.006; // snurra runt sin egen axel, lugnt tempo
  controls.update();
  renderer.render(scene, camera);
});
