import { circleRect, segRect } from '../util.js';

// Hand-authored single floor: three rooms connected by doorways, player in
// the bottom-left, exit in the far room. buildLevel() returns a fresh copy
// every call so an instant retry fully resets the world.
export function buildLevel() {
  const W = 1200;
  const H = 800;
  const t = 24; // wall thickness

  const walls = [
    // outer border
    { x: 0, y: 0, w: W, h: t },
    { x: 0, y: H - t, w: W, h: t },
    { x: 0, y: 0, w: t, h: H },
    { x: W - t, y: 0, w: t, h: H },
    // partition between room A and B, doorway at y 300..480
    { x: 388, y: t, w: t, h: 276 },
    { x: 388, y: 480, w: t, h: H - 480 - t },
    // partition between room B and C, doorway at y 250..520
    { x: 788, y: t, w: t, h: 226 },
    { x: 788, y: 520, w: t, h: H - 520 - t },
  ];

  const enemies = [
    { type: 'thug', x: 260, y: 200 },
    { type: 'pistol', x: 600, y: 120 },
    { type: 'thug', x: 600, y: 440 },
    { type: 'pistol', x: 1000, y: 180 },
    { type: 'thug', x: 1000, y: 640 },
  ];

  return {
    bounds: { w: W, h: H },
    walls,
    playerStart: { x: 120, y: 680 },
    exit: { x: 1030, y: 360, w: 110, h: 90 },
    enemies,
  };
}

// Push a circle entity { x, y, r } out of every wall it overlaps.
export function resolveCircle(level, c) {
  for (const w of level.walls) {
    const push = circleRect(c.x, c.y, c.r, w.x, w.y, w.w, w.h);
    if (push) {
      c.x += push.x;
      c.y += push.y;
    }
  }
}

// Is line of sight from (x1,y1) to (x2,y2) blocked by a wall?
export function blocked(level, x1, y1, x2, y2) {
  for (const w of level.walls) {
    if (segRect(x1, y1, x2, y2, w.x, w.y, w.w, w.h)) return true;
  }
  return false;
}
