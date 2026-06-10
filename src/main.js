import { Input } from './input/touch.js';
import { TimeScale, IDLE_SCALE } from './time.js';
import { buildLevel } from './world/level.js';
import { createPlayer, updatePlayer } from './entities/player.js';
import { createEnemy, updateEnemy } from './entities/enemy.js';
import { pickTarget } from './combat/autoaim.js';
import { WEAPONS, spawnBullet, updateBullets } from './combat/weapons.js';
import { initRenderer, fx, updateFx, renderGame } from './render/draw.js';
import { sfx } from './audio/sfx.js';
import { dist, angleDiff } from './util.js';

const BEST_KEY = 'hm_crawl_best';

const canvas = document.getElementById('game');
initRenderer(canvas);
const input = new Input(canvas);
const timescale = new TimeScale();

let state = 'title'; // title | playing | dead | won
let world = null;
let timeMs = 0;
let best = Number(localStorage.getItem(BEST_KEY)) || 0;

function reset() {
  const level = buildLevel();
  world = {
    level,
    player: createPlayer(level.playerStart.x, level.playerStart.y),
    enemies: level.enemies.map(createEnemy),
    bullets: [],
    pickups: [],
  };
  timeMs = 0;
  timescale.value = IDLE_SCALE;
  fx.clear();
}

function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function doAttack(p) {
  p.attackCD = WEAPONS[p.weapon].cooldown;
  p.swing = 0.16;

  if (p.weapon === 'pistol') {
    if (p.ammo > 0) {
      const W = WEAPONS.pistol;
      const tgt = pickTarget(p, world.enemies, world.level, Infinity);
      const a = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : p.angle;
      p.angle = a;
      spawnBullet(world.bullets, p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r, a, true, W.bulletSpeed);
      p.ammo--;
      fx.shake(4);
      sfx.shoot();
      if (p.ammo <= 0) p.weapon = 'bat';
      return;
    }
    p.weapon = 'bat'; // out of ammo -> fall through to a swing
  }

  const W = WEAPONS.bat;
  const tgt = pickTarget(p, world.enemies, world.level, W.range);
  if (tgt) p.angle = Math.atan2(tgt.y - p.y, tgt.x - p.x);
  sfx.melee();
  let hit = false;
  for (const e of world.enemies) {
    if (!e.alive) continue;
    if (dist(p.x, p.y, e.x, e.y) <= W.range + e.r) {
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      if (Math.abs(angleDiff(p.angle, a)) <= W.arc / 2) {
        e.alive = false;
        hit = true;
        fx.blood(e.x, e.y);
      }
    }
  }
  if (hit) {
    fx.shake(7);
    sfx.hit();
    vibrate(12);
  }
}

function killPlayer(p) {
  if (!p.alive) return;
  p.alive = false;
  fx.blood(p.x, p.y);
  fx.shake(12);
  fx.flash();
  sfx.death();
  vibrate(40);
}

function win() {
  state = 'won';
  if (best === 0 || timeMs < best) {
    best = Math.round(timeMs);
    localStorage.setItem(BEST_KEY, String(best));
  }
  sfx.win();
}

function update(dt) {
  updateFx(dt);
  input.sample();

  if (state !== 'playing') {
    input.consumeAttack();
    if (input.consumeTap()) {
      sfx.resume();
      reset();
      state = 'playing';
    }
    return;
  }

  const p = world.player;
  const move = input.move;
  const moving = Math.hypot(move.x, move.y) > 0.08;
  timescale.update(moving || p.swing > 0, dt);
  const sdt = dt * timescale.value;

  updatePlayer(p, move, dt, world.level); // player on real dt
  timeMs += dt * 1000;

  const attacked = input.consumeAttack();
  input.consumeTap();
  if (attacked && p.attackCD <= 0) doAttack(p);

  for (const e of world.enemies) updateEnemy(e, p, sdt, world.level, world.bullets, sfx);
  updateBullets(world.bullets, sdt, world.level, p, world.enemies, fx, sfx);
  world.bullets = world.bullets.filter((b) => b.alive);

  // Bullet hit on the player is flagged in updateBullets; finalize the death here.
  if (!p.alive) {
    killPlayer(p);
    state = 'dead';
    return;
  }

  // Dropped weapons and pickups.
  for (const e of world.enemies) {
    if (!e.alive && e.drops && !e.dropped) {
      e.dropped = true;
      world.pickups.push({ x: e.x, y: e.y, r: 12, weapon: e.drops, ammo: WEAPONS[e.drops].ammo });
    }
  }
  for (const pk of world.pickups) {
    if (!pk.taken && dist(p.x, p.y, pk.x, pk.y) < p.r + pk.r) {
      pk.taken = true;
      p.weapon = pk.weapon;
      p.ammo = pk.ammo;
      sfx.pickup();
    }
  }
  world.pickups = world.pickups.filter((pk) => !pk.taken);

  // Lethal contact with any enemy.
  for (const e of world.enemies) {
    if (e.alive && dist(e.x, e.y, p.x, p.y) < e.r + p.r) {
      killPlayer(p);
      state = 'dead';
      return;
    }
  }

  // Win: clear the floor, then reach the exit.
  if (world.enemies.every((e) => !e.alive)) {
    const ex = world.level.exit;
    if (p.x > ex.x && p.x < ex.x + ex.w && p.y > ex.y && p.y < ex.y + ex.h) win();
  }
}

function buildView() {
  const p = world ? world.player : null;
  return {
    state,
    world,
    timescale: timescale.value,
    input,
    hud: {
      timeMs,
      best,
      weapon: p ? p.weapon : 'bat',
      ammo: p ? p.ammo : 0,
      kills: world ? world.enemies.filter((e) => !e.alive).length : 0,
      total: world ? world.enemies.length : 0,
    },
  };
}

reset();
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05; // clamp tab-switch / hitch gaps
  update(dt);
  renderGame(buildView());
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
