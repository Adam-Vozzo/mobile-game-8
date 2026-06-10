// Unified input: left half of the screen is a floating virtual stick, right
// half is the attack button (attacks auto-aim, so no aiming needed). Keyboard
// (WASD/arrows + space) mirrors it for desktop testing. Any tap also advances
// menu / death / win screens.
export class Input {
  constructor(canvas) {
    this.move = { x: 0, y: 0 };
    this.attack = false; // edge-triggered
    this.tap = false; // edge-triggered (menus / retry)
    this.joy = null; // { id, ox, oy, cx, cy }
    this.keys = new Set();
    this._bind(canvas);
  }

  _bind(c) {
    const down = (id, x, y) => {
      if (x < window.innerWidth * 0.5 && !this.joy) {
        this.joy = { id, ox: x, oy: y, cx: x, cy: y };
      } else {
        this.attack = true;
      }
      this.tap = true;
    };
    const moveP = (id, x, y) => {
      if (this.joy && this.joy.id === id) {
        this.joy.cx = x;
        this.joy.cy = y;
      }
    };
    const up = (id) => {
      if (this.joy && this.joy.id === id) this.joy = null;
    };

    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      down(e.pointerId, e.clientX, e.clientY);
    });
    c.addEventListener('pointermove', (e) => moveP(e.pointerId, e.clientX, e.clientY));
    c.addEventListener('pointerup', (e) => up(e.pointerId));
    c.addEventListener('pointercancel', (e) => up(e.pointerId));
    c.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === ' ' || k === 'enter') {
        this.attack = true;
        this.tap = true;
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  // Resolve the current movement vector (magnitude <= 1).
  sample() {
    let mx = 0;
    let my = 0;
    if (this.joy) {
      const dx = this.joy.cx - this.joy.ox;
      const dy = this.joy.cy - this.joy.oy;
      const max = 70;
      const len = Math.hypot(dx, dy) || 1;
      const m = Math.min(len, max) / max;
      mx = (dx / len) * m;
      my = (dy / len) * m;
    } else {
      const k = this.keys;
      if (k.has('a') || k.has('arrowleft')) mx -= 1;
      if (k.has('d') || k.has('arrowright')) mx += 1;
      if (k.has('w') || k.has('arrowup')) my -= 1;
      if (k.has('s') || k.has('arrowdown')) my += 1;
      const l = Math.hypot(mx, my);
      if (l > 1) {
        mx /= l;
        my /= l;
      }
    }
    this.move.x = mx;
    this.move.y = my;
    return this.move;
  }

  consumeAttack() {
    const a = this.attack;
    this.attack = false;
    return a;
  }

  consumeTap() {
    const t = this.tap;
    this.tap = false;
    return t;
  }
}
