# A-Frame

## When to use

A 3D *place* the kid can describe — a room, a planet's surface, a
scene with a few objects to look at, a VR-ready experience. Reads like
HTML, hides the camera/lighting/math behind sensible defaults. Built on
three.js, so escape hatches exist when needed.

## Minimal working example

```html
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <title>liten värld</title>
  <script src="https://aframe.io/releases/1.7.1/aframe.min.js"></script>
</head>
<body>
  <a-scene background="color: #87CEEB">
    <a-box      position="-1 0.5 -3" rotation="0 45 0" color="tomato"></a-box>
    <a-sphere   position="0 1.25 -5" radius="1.25"     color="gold"></a-sphere>
    <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="forestgreen"></a-cylinder>
    <a-plane    position="0 0 -4"    rotation="-90 0 0" width="20" height="20" color="lightgray"></a-plane>
    <a-sky color="#87CEEB"></a-sky>
  </a-scene>
</body>
</html>
```

## Pitfalls

- **The default camera sits at `0 1.6 0`** (eye height). Anything
  placed at `0 0 0` is at the kid's feet, behind them, or inside their
  head. Push objects forward and a bit up: `position="x ~1 -3"`.
- **Component values are space-separated, not comma-separated.**
  `position="1 2 3"`, never `"1, 2, 3"`. Wrong separator → silent parse
  failure → object at default position.
- **Loading `.glb` models:** relative paths only. Use an
  `<a-asset-item>` so loading completes before the scene renders:

  ```html
  <a-assets>
    <a-asset-item id="cat" src="models/cat.glb"></a-asset-item>
  </a-assets>
  <a-entity gltf-model="#cat" position="0 1 -3"></a-entity>
  ```

  Absolute `src="/models/cat.glb"` 404s under the preview subpath.
- **`<a-scene>` fills the viewport** and absorbs all mouse input. If
  the kid wants a normal page with a small 3D embed somewhere on it,
  add `embedded` to `<a-scene>` and size the parent element.
- **WebXR / VR button** shows up automatically on capable devices. On a
  tablet that's harmless; on iPad Safari it currently does nothing
  (Safari doesn't expose WebXR yet) — don't promise VR until tested on
  the actual hardware.
- **First load is heavy** (~800 KB minified). On a slow connection the
  scene appears empty for a beat. If the preview looks blank, give it
  a few seconds before assuming something's wrong.
