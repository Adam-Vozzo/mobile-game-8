import { dist, angleDiff } from '../util.js';
import { blocked } from '../world/level.js';

// Touch can't aim precisely, so attacks target the best visible enemy:
// nearest wins, with a bias toward whoever the player is already facing.
export function pickTarget(player, enemies, level, maxRange) {
  let best = null;
  let bestScore = Infinity;
  for (const e of enemies) {
    if (!e.alive) continue;
    const d = dist(player.x, player.y, e.x, e.y);
    if (d > maxRange) continue;
    if (blocked(level, player.x, player.y, e.x, e.y)) continue;
    const a = Math.atan2(e.y - player.y, e.x - player.x);
    const off = Math.abs(angleDiff(player.angle, a));
    const score = d + off * 120;
    if (score < bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return best;
}
