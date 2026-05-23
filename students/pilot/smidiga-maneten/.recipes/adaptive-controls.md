# Adaptive controls — touch + keyboard

## When to use

The project has both **on-screen buttons** *and* **keyboard input** (or
*could* — most games can be played either way). Default to mobile-first
controls and let desktop users get smaller targets, hover, and keyboard
focus rings for free.

If the project is touch-only (a tap-to-paint canvas) or keyboard-only
(a typing game), you don't need this — just style for that one mode.

## Minimal working example — D-pad + arrow keys

```html
<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>flytta rutan</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #1e1e2e;
         color: white; min-height: 100vh; display: flex; flex-direction: column;
         align-items: center; }
  #stage  { position: relative; width: min(90vw, 400px); aspect-ratio: 1;
            background: #2a2a3e; margin: 1rem; }
  #player { position: absolute; width: 32px; height: 32px; background: #ffd86b;
            border-radius: 6px; left: 50%; top: 50%;
            transform: translate(-50%, -50%); transition: left .1s, top .1s; }

  /* Touch-first defaults: D-pad visible, 44px+ tap targets */
  .dpad { display: grid; gap: 4px;
          grid-template: repeat(3, 56px) / repeat(3, 56px); }
  .dpad button { font-size: 1.5rem; background: #444; color: white;
                 border: 0; border-radius: 8px;
                 min-height: 44px; min-width: 44px;
                 touch-action: manipulation; cursor: pointer; }
  .dpad button:active { background: #666; }
  .dpad .up    { grid-area: 1 / 2; }
  .dpad .left  { grid-area: 2 / 1; }
  .dpad .right { grid-area: 2 / 3; }
  .dpad .down  { grid-area: 3 / 2; }
  .key-hint { display: none; opacity: .7; font-size: .9rem; }

  /* Desktop refinement: smaller targets, hover affordance */
  @media (pointer: fine) {
    .dpad button { min-height: 36px; min-width: 36px; }
    .dpad button:hover { background: #555; }
  }
  /* Focus ring only when keyboard navigation actually needs it */
  .dpad button:focus-visible { outline: 3px solid #ffd86b; outline-offset: 2px; }

  /* Live swap: hide D-pad, show hint when user is on keyboard */
  html[data-input="keyboard"] .dpad     { display: none; }
  html[data-input="keyboard"] .key-hint { display: block; }
</style>
</head>
<body>
  <div id="stage"><div id="player"></div></div>

  <div class="dpad" aria-label="Styrkors">
    <button class="up"    data-dir="up"    aria-label="Upp">↑</button>
    <button class="left"  data-dir="left"  aria-label="Vänster">←</button>
    <button class="right" data-dir="right" aria-label="Höger">→</button>
    <button class="down"  data-dir="down"  aria-label="Ner">↓</button>
  </div>
  <p class="key-hint">Använd piltangenterna ← ↑ → ↓</p>

  <script>
    // Input modality tracker — toggles <html data-input="touch|mouse|keyboard">
    const root = document.documentElement;
    const setInput = (k) => { if (root.dataset.input !== k) root.dataset.input = k; };
    addEventListener("pointerdown", (e) =>
      setInput(e.pointerType === "touch" ? "touch" : "mouse"),
      { passive: true, capture: true });
    addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;  // ignore shortcuts
      setInput("keyboard");
    }, { capture: true });
    setInput(matchMedia("(pointer: coarse)").matches ? "touch" : "mouse");

    // Game logic
    const player = document.getElementById("player");
    const stage  = document.getElementById("stage");
    const step   = 24;
    const move = (dir) => {
      const r = stage.getBoundingClientRect();
      const cs = getComputedStyle(player);
      let x = parseFloat(cs.left), y = parseFloat(cs.top);
      if (dir === "up")    y -= step;
      if (dir === "down")  y += step;
      if (dir === "left")  x -= step;
      if (dir === "right") x += step;
      x = Math.max(16, Math.min(r.width  - 16, x));
      y = Math.max(16, Math.min(r.height - 16, y));
      player.style.left = x + "px";
      player.style.top  = y + "px";
    };
    document.querySelectorAll(".dpad button").forEach((b) => {
      b.addEventListener("click", () => move(b.dataset.dir));
    });
    addEventListener("keydown", (e) => {
      const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    });
  </script>
</body>
</html>
```

## Pitfalls

- **`@media (pointer: fine)` reports *capability*, not *current use*.** A
  laptop with a touchscreen reports `pointer: coarse` even when the user
  is on the trackpad. That's exactly why the `[data-input]` JS shim
  exists alongside the media query — the media query picks the floor,
  the shim tracks live behaviour.
- **`min-height: 44px` is the floor for touch targets.** Apple's HIG
  minimum; below this, fingers miss. Refine smaller (`36px`) only inside
  `@media (pointer: fine)`.
- **`touch-action: manipulation` on buttons** removes the 300 ms
  iOS double-tap-zoom delay. Without it, on-screen buttons feel
  laggy on iPhone.
- **Use `:focus-visible`, not `:focus`, for focus rings.** Plain
  `:focus` leaves ugly outlines after every mouse click;
  `:focus-visible` only fires when the browser thinks a focus
  indicator helps (= keyboard navigation).
- **Don't `outline: none` globally.** Kids' keyboard-using friends
  lose all visible focus. If you must hide the default outline, add
  a `:focus-visible` outline back in the same rule.
- **`[data-input]` switches live.** A user can pair a Bluetooth mouse
  to their iPad mid-session and the UI updates on the first click.
  Don't cache the value into a variable at page-load.
- **`data-input` starts as a guess.** The initial value comes from
  `matchMedia("(pointer: coarse)")`, so on first paint we don't know if
  a keyboard user is about to Tab in. Acceptable — the first keypress
  flips it. Don't try to "wait for the first input" before showing UI;
  the page looks broken until then.
- **iOS Full Keyboard Support sends pointer events for arrow keys.**
  On iPad with a paired Bluetooth keyboard, arrow-key navigation
  emits *both* `keydown` and pointer events. The shim above handles
  this fine (each event sets the attribute independently), but don't
  build mutual-exclusion logic that assumes "if keyboard then no
  touch ever again".
- **One handler per event, not both.** If you add `click` AND
  `pointerdown` to the same button, mobile fires both and the button
  triggers twice. Pick one; `click` is fine for buttons.
- **An analog joystick is a different beast.** This recipe gives
  discrete 4-direction input. If the kid wants drag-and-hold with
  force and angle (proper analog stick), say so — that wants a
  different MWE built around `pointermove` deltas, not buttons.
