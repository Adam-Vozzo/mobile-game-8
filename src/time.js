import { clamp } from './util.js';

// The signature mechanic: time only flows when the player is acting.
// While idle, the world creeps along at IDLE_SCALE so a room reads as a
// near-frozen puzzle; committing to a move ramps it back to full speed.
export const IDLE_SCALE = 0.12;

export class TimeScale {
  constructor() {
    this.value = IDLE_SCALE;
  }

  // active = player is moving or mid-attack.
  update(active, dt) {
    const target = active ? 1 : IDLE_SCALE;
    const k = clamp(dt * 18, 0, 1); // reach the target in ~50ms
    this.value += (target - this.value) * k;
  }
}
