import { angleDiff, rand, TAU } from '../util.js';
import { resolveCircle, blocked } from '../world/level.js';
import { spawnBullet } from '../combat/weapons.js';

const TYPES = {
  thug: { r: 13, speed: 120, view: 340, fov: 1.7, color: '#7a8cff' },
  pistol: { r: 13, speed: 92, view: 440, fov: 1.5, color: '#ff9d5c', shootRange: 380, cooldown: 1.1 },
};

export function createEnemy(def) {
  const t = TYPES[def.type];
  const angle = def.angle ?? rand(0, TAU);
  return {
    type: def.type,
    x: def.x,
    y: def.y,
    r: t.r,
    color: t.color,
    speed: t.speed,
    view: t.view,
    fov: t.fov,
    shootRange: t.shootRange || 0,
    cooldown: t.cooldown || 0,
    cool: 0,
    angle,
    tdir: angle,
    alive: true,
    alerted: false,
    tx: def.x,
    ty: def.y,
    wander: 0,
    drops: def.type === 'pistol' ? 'pistol' : null,
    dropped: false,
  };
}

// Updated at world (scaled) dt — enemies, like bullets, crawl while the
// player holds still and snap to full speed the instant the player commits.
export function updateEnemy(e, p, dt, level, bullets, sfx) {
  if (!e.alive) return;
  if (e.cool > 0) e.cool -= dt;

  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const ang = Math.atan2(dy, dx);

  let see = false;
  if (p.alive && d < e.view && !blocked(level, e.x, e.y, p.x, p.y)) {
    if (e.alerted || Math.abs(angleDiff(e.angle, ang)) < e.fov / 2) see = true;
  }
  if (see) {
    e.alerted = true;
    e.tx = p.x;
    e.ty = p.y;
  }

  if (e.alerted) {
    const toTarget = Math.atan2(e.ty - e.y, e.tx - e.x);
    e.angle += angleDiff(e.angle, toTarget) * Math.min(1, dt * 10);

    if (e.type === 'pistol' && see && d < e.shootRange) {
      if (e.cool <= 0) {
        spawnBullet(bullets, e.x + Math.cos(ang) * e.r, e.y + Math.sin(ang) * e.r, ang + rand(-0.05, 0.05), false, 520);
        e.cool = e.cooldown;
        sfx.shoot();
      }
    } else {
      const mvx = e.tx - e.x;
      const mvy = e.ty - e.y;
      const ml = Math.hypot(mvx, mvy) || 1;
      e.x += (mvx / ml) * e.speed * dt;
      e.y += (mvy / ml) * e.speed * dt;
      resolveCircle(level, e);
    }
  } else {
    // Idle patrol: drift and turn until something draws attention.
    e.wander -= dt;
    if (e.wander <= 0) {
      e.wander = rand(1.2, 2.8);
      e.tdir = e.angle + rand(-1.5, 1.5);
    }
    e.angle += angleDiff(e.angle, e.tdir) * Math.min(1, dt * 2);
    e.x += Math.cos(e.angle) * e.speed * 0.32 * dt;
    e.y += Math.sin(e.angle) * e.speed * 0.32 * dt;
    resolveCircle(level, e);
  }
}
