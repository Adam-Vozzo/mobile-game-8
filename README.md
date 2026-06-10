# mobile-game-8

A top-down, one-hit-kill action game in the spirit of Hotline Miami — playable
in a phone browser, served as a static GitHub Page from `main`.

**Signature twist:** time moves when you move. **Controls:** virtual stick +
auto-aim. **Stack:** zero-build vanilla JS + Canvas2D (native ES modules), so it
deploys straight off `main` with no build step.

See [`PLAN.md`](./PLAN.md) for the full crawl / walk / run build plan.

## Status

**Crawl milestone — playable.** One hand-authored floor with the core loop:
one-hit-kill both ways, the time-moves-when-you-move mechanic, stick + auto-aim
controls, melee + a droppable pistol, alerting enemies, instant retry, and a
score/best-time on clear.

## Play

- **Live (GitHub Pages):** point Pages at `main` (root) — `index.html` runs directly, no build step.
- **Locally:** serve the folder over HTTP (ES modules don't load from `file://`):
  ```bash
  python3 -m http.server 8000
  # then open http://localhost:8000
  ```

### Controls

- **Move:** left thumb (a floating virtual stick) — or `WASD` / arrow keys.
- **Attack:** tap the right half of the screen — or `Space`. Attacks auto-aim at
  the best visible enemy, so there's no separate aiming.
- **Goal:** clear every enemy, then reach the green **EXIT**. One hit kills you;
  tap to retry instantly.
- Time only flows while you move or attack — stand still to read the room.

## Layout

```
index.html            # canvas + module entry; deploys as-is to Pages
src/
  main.js             # bootstrap, game loop, state machine
  time.js             # time-when-you-move scaler
  util.js             # math + collision/line-of-sight geometry
  input/touch.js      # virtual stick + tap-to-attack/retry (+ keyboard)
  entities/player.js
  entities/enemy.js   # patrol / vision / chase / shoot AI
  combat/autoaim.js
  combat/weapons.js   # melee, bullets, pickups
  world/level.js      # hand-authored rooms + collision + LOS
  render/draw.js      # canvas rendering + juice (shake, flash, blood)
  audio/sfx.js        # WebAudio synth (no asset files)
```
