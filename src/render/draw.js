import { clamp, rand } from '../util.js';
import { IDLE_SCALE } from '../time.js';

let canvas;
let ctx;
let vw = 0;
let vh = 0;
let dpr = 1;
let zoom = 1;

const cam = { x: 0, y: 0 };
let shake = 0;
let flash = 0;
const bloods = [];

export function initRenderer(cnv) {
  canvas = cnv;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  vw = window.innerWidth;
  vh = window.innerHeight;
  canvas.width = Math.floor(vw * dpr);
  canvas.height = Math.floor(vh * dpr);
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  zoom = clamp(Math.min(vw, vh) / 460, 0.6, 2);
}

// Visual feedback hooks called by the simulation.
export const fx = {
  shake(a) {
    shake = Math.max(shake, a);
  },
  blood(x, y) {
    for (let i = 0; i < 6; i++) {
      bloods.push({ x: x + rand(-7, 7), y: y + rand(-7, 7), r: rand(3, 8) });
    }
    if (bloods.length > 260) bloods.splice(0, bloods.length - 260);
  },
  flash() {
    flash = 1;
  },
  clear() {
    bloods.length = 0;
    shake = 0;
    flash = 0;
  },
};

export function updateFx(dt) {
  shake = Math.max(0, shake - dt * 40);
  flash = Math.max(0, flash - dt * 4);
}

function clampCam(level) {
  const halfW = vw / (2 * zoom);
  const halfH = vh / (2 * zoom);
  const { w, h } = level.bounds;
  cam.x = w <= halfW * 2 ? w / 2 : clamp(cam.x, halfW, w - halfW);
  cam.y = h <= halfH * 2 ? h / 2 : clamp(cam.y, halfH, h - halfH);
}

const circle = (x, y, r) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

function drawFloor(level) {
  const { w, h } = level.bounds;
  ctx.fillStyle = '#14141f';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (const wl of level.walls) {
    ctx.fillStyle = '#2b2b44';
    ctx.fillRect(wl.x, wl.y, wl.w, wl.h);
    ctx.fillStyle = 'rgba(123,140,255,0.25)';
    ctx.fillRect(wl.x, wl.y, wl.w, 3);
  }
}

function drawBlood() {
  ctx.fillStyle = 'rgba(150,12,30,0.5)';
  for (const b of bloods) circle(b.x, b.y, b.r);
}

function drawExit(level, cleared) {
  const e = level.exit;
  ctx.save();
  ctx.fillStyle = cleared ? 'rgba(57,255,136,0.18)' : 'rgba(255,255,255,0.04)';
  ctx.strokeStyle = cleared ? '#39ff88' : 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 3;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = cleared ? '#39ff88' : 'rgba(255,255,255,0.3)';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2);
  ctx.restore();
}

function drawPickups(pickups) {
  for (const pk of pickups) {
    if (pk.taken) continue;
    ctx.fillStyle = '#ffd24a';
    circle(pk.x, pk.y, 7);
    ctx.fillStyle = '#0a0a12';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', pk.x, pk.y + 0.5);
  }
}

function drawEnemy(e) {
  if (!e.alive) return;
  if (!e.alerted) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.arc(e.x, e.y, e.view * 0.5, e.angle - e.fov / 2, e.angle + e.fov / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = e.color;
  circle(e.x, e.y, e.r);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(e.x + Math.cos(e.angle) * e.r, e.y + Math.sin(e.angle) * e.r);
  ctx.stroke();
  if (e.alerted) {
    ctx.fillStyle = '#ff3b3b';
    circle(e.x, e.y - e.r - 8, 3);
  }
}

function drawBullet(b) {
  ctx.strokeStyle = b.fromPlayer ? '#fff2a8' : '#ff7b7b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
  ctx.stroke();
}

function drawPlayer(p) {
  if (!p.alive) return;
  if (p.swing > 0 && p.weapon === 'bat') {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30, p.angle - 0.7, p.angle + 0.7);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffe1ea';
  circle(p.x, p.y, p.r);
  ctx.strokeStyle = '#ff3b6b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.angle) * (p.r + 6), p.y + Math.sin(p.angle) * (p.r + 6));
  ctx.stroke();
}

function drawVignette(ts) {
  const g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.3, vw / 2, vh / 2, Math.max(vw, vh) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, vw, vh);
  // Cool blue wash telegraphs how slow time is running.
  const slow = 1 - (ts - IDLE_SCALE) / (1 - IDLE_SCALE);
  if (slow > 0.02) {
    ctx.fillStyle = `rgba(40,90,200,${0.12 * slow})`;
    ctx.fillRect(0, 0, vw, vh);
  }
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,0,40,${0.5 * flash})`;
    ctx.fillRect(0, 0, vw, vh);
  }
}

function drawJoystick(input) {
  if (!input || !input.joy) return;
  const j = input.joy;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(j.ox, j.oy, 46, 0, Math.PI * 2);
  ctx.stroke();
  const dx = j.cx - j.ox;
  const dy = j.cy - j.oy;
  const len = Math.hypot(dx, dy) || 1;
  const m = Math.min(len, 70);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(j.ox + (dx / len) * m, j.oy + (dy / len) * m, 22, 0, Math.PI * 2);
  ctx.fill();
}

const fmt = (ms) => (ms / 1000).toFixed(2) + 's';

function drawHUD(hud) {
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`KILLS ${hud.kills}/${hud.total}`, 14, 12);

  ctx.textAlign = 'center';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(fmt(hud.timeMs), vw / 2, 10);
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(hud.best ? `BEST ${fmt(hud.best)}` : 'BEST --', vw / 2, 36);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd24a';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(hud.weapon === 'pistol' ? `PISTOL ${hud.ammo}` : 'BAT', vw - 14, 12);
}

function drawCenter(title, sub, color) {
  ctx.fillStyle = 'rgba(5,5,10,0.55)';
  ctx.fillRect(0, 0, vw, vh);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = 'bold 34px monospace';
  ctx.fillText(title, vw / 2, vh / 2 - 14);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '14px monospace';
  ctx.fillText(sub, vw / 2, vh / 2 + 22);
}

export function renderGame(view) {
  const { state, world, hud, input } = view;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, vw, vh);

  if (world) {
    const p = world.player;
    cam.x = p.x;
    cam.y = p.y;
    clampCam(world.level);
    const cleared = world.enemies.every((e) => !e.alive);

    ctx.save();
    ctx.translate(vw / 2, vh / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cam.x + rand(-shake, shake), -cam.y + rand(-shake, shake));

    drawFloor(world.level);
    drawBlood();
    drawExit(world.level, cleared);
    drawPickups(world.pickups);
    for (const e of world.enemies) drawEnemy(e);
    for (const b of world.bullets) if (b.alive) drawBullet(b);
    drawPlayer(p);

    ctx.restore();
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawVignette(view.timescale);
  drawJoystick(input);
  if (world) drawHUD(hud);

  if (state === 'title') {
    drawCenter('HOTLINE // CRAWL', 'move: left thumb   ·   attack: right tap   ·   tap to enter', '#ff3b6b');
  } else if (state === 'dead') {
    drawCenter('YOU DIED', 'tap to retry', '#ff3b3b');
  } else if (state === 'won') {
    const best = hud.best ? fmt(hud.best) : '--';
    drawCenter('FLOOR CLEAR', `time ${fmt(hud.timeMs)}   best ${best}   ·   tap to replay`, '#39ff88');
  }
}
