# three.js

## When to use

A spinning 3D model, custom geometry, particle field, a scene that
needs lighting or shaders. If the kid is describing a *place* they walk
around in rather than a model they look at, `aframe.md` is usually a
better fit — less boilerplate, declarative HTML.

## Minimal working example (avoids the "black screen" trap)

```html
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <title>kub</title>
  <style>html,body{margin:0;height:100%;overflow:hidden}</style>
  <script type="importmap">
  {
    "imports": {
      "three":          "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js",
      "three/addons/":  "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/"
    }
  }
  </script>
</head>
<body>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202030);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(3, 2, 4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 5, 5);
scene.add(dir);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff6688 })
);
scene.add(cube);

const controls = new OrbitControls(camera, renderer.domElement);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => {
  cube.rotation.x += 0.005;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
});
</script>
</body>
</html>
```

## Pitfalls — the canonical "black screen" set

- **Camera inside the mesh.** Camera at `(0,0,0)` with a cube at
  `(0,0,0)` puts the camera *inside* the cube → black screen. Move the
  camera back (`camera.position.set(3, 2, 4)`) and `lookAt(0, 0, 0)`.
- **`MeshStandardMaterial` with no light → invisible.** Always add at
  least an `AmbientLight`. If the kid doesn't want to think about
  lighting yet, use `MeshBasicMaterial` (looks the same in any light)
  — but normals/shading are flat.
- **No render loop → static scene.** Use
  `renderer.setAnimationLoop(fn)` — it's the modern replacement for
  `requestAnimationFrame` (and works with WebXR for free).
- **Missing resize handler.** Without it, the renderer is stuck at the
  initial size when the iframe layout shifts; aspect ratio stretches.
- **Loading `.glb` models with `GLTFLoader`:** relative path only.
  `loader.load("models/cat.glb", …)` — never `"/models/cat.glb"`. The
  preview is served from `/<classroom>/<student>/preview/` and absolute
  paths 404. Wrap the model load in `loader.load(url, onLoad, onProgress, onError)`
  and log errors — silent 404s are the second most common "nothing
  appeared" cause after black-screen-from-camera.
- **OrbitControls path is `three/addons/controls/OrbitControls.js`.**
  A typo here shows up as "failed to resolve module specifier" in the
  console, not as a render bug. Check the browser console first when
  the page is fully blank, before debugging scene geometry.
- **Importmap script must come before any module script that imports
  three.** If a `<script type="module">` runs before the importmap is
  parsed, the bare specifier `"three"` won't resolve.
