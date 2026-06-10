// Tiny WebAudio synth — no asset files, just oscillator + noise bursts.
// Lazily created and resumed on the first user gesture (mobile autoplay rules).

let actx = null;

function ac() {
  if (!actx) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      actx = null;
    }
  }
  return actx;
}

function tone(freq, dur, type = 'square', vol = 0.15, slideTo = null) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

function noise(dur, vol = 0.2) {
  const a = ac();
  if (!a) return;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  resume() {
    const a = ac();
    if (a && a.state === 'suspended') a.resume();
  },
  shoot() {
    tone(420, 0.12, 'square', 0.1, 140);
    noise(0.08, 0.1);
  },
  melee() {
    tone(180, 0.09, 'sawtooth', 0.1, 90);
  },
  hit() {
    noise(0.16, 0.28);
    tone(90, 0.18, 'square', 0.14, 50);
  },
  death() {
    noise(0.4, 0.35);
    tone(70, 0.5, 'sawtooth', 0.2, 30);
  },
  pickup() {
    tone(660, 0.07, 'square', 0.12, 990);
    tone(990, 0.08, 'square', 0.1, 1320);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'square', 0.12), i * 110));
  },
};
