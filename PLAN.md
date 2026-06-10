# Hotline Miami–style Mobile Web Game — Build Plan

A top-down, one-hit-kill action game, playable in a phone browser, served as a
static GitHub Page from `main`.

## Locked decisions

| Decision | Choice | Why |
| --- | --- | --- |
| **Signature twist** | **Time moves when you move** (SUPERHOT × Hotline Miami) | Removes the twitch-reflex demand that touch controls struggle with; turns each room into a deliberate lethal puzzle while keeping the one-hit identity. Big differentiator, low art cost. |
| **Controls** | **Virtual stick + auto-aim** | Left stick moves; attacks auto-target the nearest enemy in the facing cone. Defers the hard problem of precise aiming on glass. |
| **Stack** | **Zero-build vanilla JS + Canvas2D, organized as native ES modules** | The product is "ship off `main` to Pages." A build step adds a compile→publish gap between us and a live URL. ES modules give clean file separation with no build. Browser loads them directly from Pages. Migrate to Vite+TS at Walk only if complexity demands; that migration is mechanical. |

## What makes Hotline Miami fun (design pillars — non-negotiable)

1. **Symmetric lethality** — one hit kills them, one hit kills you. Every room is a lethal puzzle.
2. **Instant, frictionless retry** — death → tap → back in, zero load/penalty. The "one more try" loop. Failure is cheap, so experimentation is free.
3. **Plan-then-execute flow** — peek a room, read positions, clear it in one fast burst. Dying *teaches* the room.
4. **Tactile brutality (juice)** — screen shake, hit-flash, blood, slow-mo on the last kill, chunky SFX. Violence feels heavy and stylish.
5. **Sound as a mechanic** — guns are loud and pull enemies; melee is silent. Noise is a resource.
6. **Aesthetic + music** — neon, synthwave, retro pixels, woozy transitions. The soundtrack is the pacing engine.
7. **Masks / loadouts** — small rule-changing modifiers that recontextualize the same levels and drive replay.
8. **Scoring & mastery** — combos, boldness, speed → letter grades. The reason to replay a level you already beat.

### How the twist interacts with the pillars
Time-when-you-move *amplifies* "plan-then-execute": the room freezes when you
hold still, so reading it is built into the mechanic. We must preserve the
feeling of speed — when you commit to a move, time and violence move *fast*. The
risk to watch: it must never feel like turn-based tactics. Tune the "time scale
while idle" to a low non-zero crawl (e.g. ~5–10% speed) rather than a hard
pause, so there's still pressure.

## Mobile + GitHub Pages constraints

- **Static hosting only.** No backend on Pages — everything is client-side.
  Anything online (leaderboards, ghosts) needs a free third-party service
  (Supabase / Firebase / Cloudflare Worker) bolted on at Run. Local-only until then.
- **Controls are the whole ballgame on touch** — addressed by stick + auto-aim.
- **Keep it light** — Canvas2D, small assets, target 60fps on a mid phone.
- **PWA later** — installable, fullscreen, landscape lock, offline, haptics via `navigator.vibrate`.

## The core game loop

```
spawn → read room (time near-frozen while idle) → commit to a move
   → time + violence surge → kill or die
   → die: tap to instantly restart the level
   → clear all enemies: reach exit → score/grade screen → next level
```

---

## CRAWL — prove the loop is fun on a phone

Goal: one playable level, shipped to Pages, that you *want* to retry.

- [ ] Single HTML canvas, top-down 2D, camera follows player.
- [ ] One hand-authored floor (a few connected rooms + an exit).
- [ ] Player: move, face a direction, attack. **One-hit-kill both ways.**
- [ ] **Time-when-you-move:** global time scale driven by player input/velocity
      (idle ≈ slow crawl, moving/acting ≈ full speed).
- [ ] **Touch controls:** left virtual stick = move; attack auto-aims at nearest
      enemy in facing cone.
- [ ] Enemies: patrol → see player → chase → kill on contact. One melee thug + one pistol guy.
- [ ] Weapons: starting melee (bat/knife) + pick up a dropped pistol with limited ammo.
- [ ] Win = clear enemies, reach exit. Lose = one hit → **tap to instantly restart.**
- [ ] Minimum juice: screen shake, hit flash, blood decals, one synth loop, hit SFX.
- [ ] `localStorage` best-time. No build step — `index.html` + ES modules.

**Gate:** if clearing this one room and instantly retrying isn't satisfying, fix
*feel* before adding anything else.

## WALK — make it unmistakably Hotline Miami

- [ ] Several levels + level select; exit-based level structure.
- [ ] **Weapon variety:** knife, bat, pistol, shotgun, SMG; loud vs silent; throwing weapons; weapons run dry/break → drop & grab.
- [ ] **Enemy variety:** thug, pistol, shotgunner, fast dog, tougher 2-hit bruiser.
- [ ] **Smarter AI:** vision cones, hearing (gunshots draw enemies), alerted states.
- [ ] **Score system:** combo timer, boldness/flexibility/speed bonuses → letter grade.
- [ ] **Juice pass:** slow-mo final kill, door-bash stun/kill, music swap per level, woozy transitions, haptics.
- [ ] **Masks/loadout:** 3–5 modifiers (faster, lethal fists, extra ammo, full-room vision, dog companion). Each should interact interestingly with the time twist.
- [ ] Pause/settings (audio, **left-handed mode**, control scheme), PWA install + landscape lock.
- [ ] Re-evaluate stack: migrate to Vite + TS here *only* if the module count / state complexity warrants it.

## RUN — polish, content, retention, twist fully realized

- [ ] Full campaign: 8–15 levels with a difficulty curve + 1–2 setpiece/boss rooms.
- [ ] Story framing: cryptic intro/outro screens, the "are you enjoying this?" meta layer.
- [ ] **Replay engine:** seeded daily run and/or remixable levels.
- [ ] **Online leaderboards** via a free serverless tier (the one piece needing off-Pages infra) + weekly seeded challenge.
- [ ] Optional **level editor + share-by-URL** (very HM2, huge for longevity).
- [ ] Art/audio direction, CRT/palette shader, accessibility, perf hardening.

---

## Roads not taken (other twists, kept on file)

These shared the same Crawl and can be layered later or pivoted to:

- **Roguelike run** — procedural floors, permadeath, perks between rooms. Best retention; natural fit for daily seeds + leaderboards. *Strong candidate to layer at Run.*
- **Score-attack arena** — endless waves, combo-chaser, leaderboard. Cheapest, most immediately addictive. *Strong candidate to layer at Run.*
- **Stealth-ghost** — silent takedowns, hearing/distraction, loud = high-risk.
- **Aesthetic reskin** — same loop, own the look (cyberpunk / zombie / samurai / heist) to sidestep the "HM clone" feel.

## Proposed repo layout (Crawl)

```
index.html            # canvas + module entry, deploys as-is to Pages
src/
  main.js             # bootstrap, game loop (requestAnimationFrame)
  time.js             # the time-when-you-move scaler
  input/touch.js      # virtual stick + tap-to-retry
  entities/player.js
  entities/enemy.js
  combat/autoaim.js
  combat/weapons.js
  world/level.js      # hand-authored room data + collision
  render/draw.js      # canvas drawing + juice (shake, flash, blood)
  audio/sfx.js
assets/               # sprites, sfx, music
```

GitHub Pages: point at `main` root; `index.html` serves directly, no build step.
