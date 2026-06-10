// Small math + geometry helpers shared across modules.

export const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

// Shortest signed angle to rotate from a to b, in (-PI, PI].
export function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

// Circle (cx,cy,r) vs axis-aligned rect. Returns a push-out vector that
// separates the circle from the rect, or null if they don't overlap.
export function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return null;

  if (d2 === 0) {
    // Center is inside the rect: push out along the shallowest edge.
    const left = cx - rx;
    const right = rx + rw - cx;
    const top = cy - ry;
    const bottom = ry + rh - cy;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: -(r + left), y: 0 };
    if (m === right) return { x: r + right, y: 0 };
    if (m === top) return { x: 0, y: -(r + top) };
    return { x: 0, y: r + bottom };
  }

  const d = Math.sqrt(d2);
  const overlap = r - d;
  return { x: (dx / d) * overlap, y: (dy / d) * overlap };
}

function segSeg(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (d === 0) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Does segment (x1,y1)-(x2,y2) touch the axis-aligned rect?
export function segRect(x1, y1, x2, y2, rx, ry, rw, rh) {
  if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
  if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;
  const rx2 = rx + rw;
  const ry2 = ry + rh;
  return (
    segSeg(x1, y1, x2, y2, rx, ry, rx2, ry) ||
    segSeg(x1, y1, x2, y2, rx2, ry, rx2, ry2) ||
    segSeg(x1, y1, x2, y2, rx2, ry2, rx, ry2) ||
    segSeg(x1, y1, x2, y2, rx, ry2, rx, ry)
  );
}
