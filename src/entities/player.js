import { resolveCircle } from '../world/level.js';

const SPEED = 168;

export function createPlayer(x, y) {
  return {
    x,
    y,
    r: 12,
    angle: -Math.PI / 2,
    alive: true,
    weapon: 'bat',
    ammo: 0,
    attackCD: 0,
    swing: 0, // >0 while a melee swing is animating / counts as "acting"
  };
}

// Player moves at real (unscaled) dt so the stick always feels 1:1 responsive;
// the world is what slows down around them.
export function updatePlayer(p, move, dt, level) {
  p.x += move.x * SPEED * dt;
  p.y += move.y * SPEED * dt;
  resolveCircle(level, p);

  if (move.x || move.y) p.angle = Math.atan2(move.y, move.x);

  if (p.attackCD > 0) p.attackCD -= dt;
  if (p.swing > 0) p.swing -= dt;
}
