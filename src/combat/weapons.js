import { dist } from '../util.js';
import { blocked } from '../world/level.js';

export const WEAPONS = {
  bat: { kind: 'melee', range: 46, arc: 1.3, cooldown: 0.32, name: 'BAT' },
  pistol: { kind: 'gun', cooldown: 0.34, bulletSpeed: 540, ammo: 7, name: 'PISTOL' },
};

export function spawnBullet(bullets, x, y, angle, fromPlayer, speed) {
  bullets.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    fromPlayer,
    r: 4,
    life: 2.2,
    alive: true,
  });
}

// Advance bullets at world (scaled) dt. One hit is lethal either way, so
// when the player holds still and time crawls, incoming fire is dodgeable.
export function updateBullets(bullets, dt, level, player, enemies, fx, sfx) {
  for (const b of bullets) {
    if (!b.alive) continue;
    const nx = b.x + b.vx * dt;
    const ny = b.y + b.vy * dt;
    if (blocked(level, b.x, b.y, nx, ny)) {
      b.alive = false;
      continue;
    }
    b.x = nx;
    b.y = ny;
    b.life -= dt;
    if (b.life <= 0) {
      b.alive = false;
      continue;
    }
    if (b.fromPlayer) {
      for (const e of enemies) {
        if (e.alive && dist(b.x, b.y, e.x, e.y) < e.r) {
          e.alive = false;
          b.alive = false;
          fx.blood(e.x, e.y);
          fx.shake(6);
          sfx.hit();
          break;
        }
      }
    } else if (player.alive && dist(b.x, b.y, player.x, player.y) < player.r) {
      b.alive = false;
      player.alive = false; // death handled by the main loop
    }
  }
}
