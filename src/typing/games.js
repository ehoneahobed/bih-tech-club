// Two typing games drawn with plain Canvas 2D, light enough for old school PCs:
// "Trotro Race" (Kaneshie to Circle) and "Falling Mangoes".
// Both pause when the page loses focus, respect reduced motion, and are silent unless sound is switched on.
import { typer, keyInput } from './typer.js';
import { raceText, mangoWords } from './text.js';

export const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT = '"Outfit", "Rubik", "Segoe UI", Arial, sans-serif';

// ---------- Sound (off by default) ----------
let audio;
export const sound = {
  on: false,
  play(notes) {
    if (!this.on) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      let t = audio.currentTime;
      for (const [freq, dur, type = 'triangle', vol = 0.08] of notes) {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(audio.destination);
        o.start(t); o.stop(t + dur);
        t += dur * 0.8;
      }
    } catch (e) {}
  },
  word() { this.play([[880, 0.07]]); },
  good() { this.play([[660, 0.08], [990, 0.12]]); },
  bad() { this.play([[150, 0.18, 'sawtooth', 0.05]]); },
  win() { this.play([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3]]); },
  lose() { this.play([[392, 0.2], [330, 0.2], [262, 0.4]]); },
};
export function soundButton(btn, store, save) {
  const paint = () => { btn.textContent = sound.on ? '🔊 Sound on' : '🔇 Sound off'; btn.setAttribute('aria-pressed', sound.on); };
  sound.on = !!store.sound;
  paint();
  btn.addEventListener('click', () => { sound.on = !sound.on; store.sound = sound.on; save(); paint(); if (sound.on) sound.word(); });
}

// ---------- Canvas helper ----------
// Sizes the canvas to its box (at most 1.5x pixels, to spare old PCs) and runs a frame loop.
function stageOf(canvas, ratio, minH, maxH, draw) {
  const ctx = canvas.getContext('2d');
  const view = { w: 0, h: 0, s: 1, ctx };
  const resize = () => {
    const w = canvas.parentElement.clientWidth || 600;
    const h = Math.round(Math.max(minH, Math.min(maxH, w * ratio)));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Object.assign(view, { w, h, s: h / 300 });
    view.onResize?.();
  };
  resize();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  ro ? ro.observe(canvas.parentElement) : window.addEventListener('resize', resize);
  let last = 0;
  let raf = 0;
  const frame = (t) => {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0);
    last = t;
    draw(dt);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  view.stop = () => { cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', resize); };
  return view;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function pill(ctx, text, x, y, s, { bg = '#fff', fg = '#24182e', border, size = 13 } = {}) {
  ctx.font = `600 ${size * s}px ${FONT}`;
  const w = ctx.measureText(text).width + 16 * s;
  const h = (size + 10) * s;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = bg; ctx.fill();
  if (border) { ctx.lineWidth = 2 * s; ctx.strokeStyle = border; ctx.stroke(); }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5 * s);
}

// Bring the whole game (canvas and typing box) into view when it starts.
const inView = (el) => { const r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight) el.scrollIntoView({ block: 'start', behavior: REDUCED ? 'auto' : 'smooth' }); };

// Pause on blur: the window, the tab and the typing box all count.
function pauseOn(input, pause) {
  const onBlur = () => pause();
  const onVis = () => { if (document.hidden) pause(); };
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVis);
  input.addEventListener('blur', onBlur);
  return () => { window.removeEventListener('blur', onBlur); document.removeEventListener('visibilitychange', onVis); };
}

// ======================================================================
// Trotro Race: your trotro against a pace trotro from Kaneshie to Circle.
// Every word you type correctly moves you on. The pace levels match the badge speeds.
// ======================================================================
export const PACES = [
  { wpm: 15, name: 'Starter', note: 'Bronze target' },
  { wpm: 20, name: '20 wpm', note: 'first badge' },
  { wpm: 30, name: '30 wpm', note: 'second badge' },
  { wpm: 40, name: '40 wpm', note: 'top badge' },
];

export function trotroRace(root, { data, save, stage, done }) {
  let pace = PACES[Math.min(data.racePace ?? 1, PACES.length - 1)];
  root.innerHTML = `<div class="tt-game">
    <div class="tt-gamebar">
      <div class="tt-seg" role="group" aria-label="Pace trotro speed">${PACES.map((p, i) => `<button type="button" data-pace="${i}" aria-pressed="${p === pace}">${p.wpm} wpm<small>${p.note}</small></button>`).join('')}</div>
      <button type="button" class="btn btn-outline btn-small" data-sound></button>
    </div>
    <div class="tt-canvas"><canvas aria-label="Trotro race from Kaneshie to Circle"></canvas><div class="tt-over" aria-live="polite"></div></div>
    <div class="tt-race-stats"><span>⏱️ <b data-time>0:00</b></span><span>⚡ <b data-wpm>0</b> wpm</span><span>🎯 <b data-acc>100</b>% accuracy</span></div>
    <div class="tt-race-box"></div>
    <p class="tt-hint" data-hint></p>
  </div>`;
  const canvas = root.querySelector('canvas');
  const over = root.querySelector('.tt-over');
  const hint = root.querySelector('[data-hint]');
  soundButton(root.querySelector('[data-sound]'), data, save);

  let state = 'ready'; // ready, count, race, paused, done
  let countT = 0;
  let raceT = 0;
  let you = 0, youShown = 0, paceP = 0, youDone = null, paceDone = null;
  let wheel = 0;
  const dust = [];
  const t = typer(root.querySelector('.tt-race-box'), {
    text: raceText(stage), hint,
    locked: () => state !== 'race',
    onWord: (st) => { you = st.chars / t.text.length; sound.word(); },
    onDone: (st) => finish(st),
    onSpecial: (e) => { if (e.key === 'Enter' && (state === 'ready' || state === 'done')) { begin(); return false; } },
  });

  root.querySelectorAll('[data-pace]').forEach((b) => b.addEventListener('click', () => {
    pace = PACES[+b.dataset.pace]; data.racePace = +b.dataset.pace; save();
    root.querySelectorAll('[data-pace]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    if (state === 'race' || state === 'count') return;
    showReady();
  }));

  function showReady() {
    state = 'ready';
    over.innerHTML = `<div class="tt-over-card"><b>🚐 Trotro Race</b><p>Type the words below to drive your trotro from <b>Kaneshie</b> to <b>Circle</b>. Each word you get right moves you on. Beat the pace trotro at <b>${pace.wpm} wpm</b>!</p><button type="button" class="btn btn-primary" data-go>Start the race (Enter)</button></div>`;
    over.hidden = false;
    over.querySelector('[data-go]').addEventListener('click', begin);
  }
  function begin() {
    if (state === 'done') t.setText(raceText(stage));
    you = youShown = paceP = 0; youDone = paceDone = null; raceT = 0;
    state = 'count'; countT = 3;
    over.hidden = true;
    t.focus();
    inView(root);
  }
  function finish(st) {
    youDone = raceT;
    const won = paceDone == null || youDone < paceDone;
    state = 'done';
    (won ? sound.win : sound.lose).call(sound);
    const r = done({ won, pace: pace.wpm, ...st });
    over.innerHTML = `<div class="tt-over-card ${won ? 'win' : ''}"><b>${won ? '🏆 You reached Circle first!' : '🚐 The pace trotro won this time'}</b>
      <p>You typed at <b>${st.wpm} wpm</b> with <b>${Math.round(st.acc)}%</b> accuracy.${won ? (pace.wpm < 40 ? ' Try a faster pace next.' : ' That is top speed. Superb!') : ' Keep practising and race again. Steady fingers win.'}</p>
      ${r?.badge ? `<p class="tt-new-badge">${r.badge.icon} New badge: <b>${esc(r.badge.name)}</b></p>` : ''}
      <button type="button" class="btn btn-primary" data-go>Race again (Enter)</button></div>`;
    over.hidden = false;
    over.querySelector('[data-go]').addEventListener('click', begin);
    t.focus();
  }
  const pause = () => {
    if (state !== 'race' && state !== 'count') return;
    state = 'paused';
    over.innerHTML = '<div class="tt-over-card"><b>⏸ Paused</b><p>Click here to carry on racing.</p><button type="button" class="btn btn-primary" data-go>Carry on</button></div>';
    over.hidden = false;
    over.querySelector('[data-go]').addEventListener('click', () => { over.hidden = true; state = countT > 0 ? 'count' : 'race'; t.focus(); });
  };
  const unPause = pauseOn(root.querySelector('.tt-input'), pause);

  // ----- Scenery, made once per size -----
  let sky, city = [], props = [];
  const ROAD_LEN = 3200;
  const view = stageOf(canvas, 0.36, 270, 360, draw);
  view.onResize = () => {
    const { ctx, h } = view;
    sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#9fd8f5'); sky.addColorStop(1, '#fff1d2');
    city = [];
    for (let x = -100; x < ROAD_LEN + 2000; x += 40 + Math.random() * 50) city.push({ x, w: 30 + Math.random() * 46, h: 30 + Math.random() * 70, c: ['#cbbfd6', '#bfb2cc', '#d8cde0', '#c5b8d1'][Math.floor(Math.random() * 4)] });
    props = [];
    const kinds = ['palm', 'kiosk', 'palm', 'kiosk', 'tree', 'kiosk'];
    for (let x = 260, i = 0; x < ROAD_LEN + 600; x += 150 + Math.random() * 120, i++) props.push({ x, kind: kinds[i % kinds.length], c: ['#ca1f3f', '#ffbe00', '#1f8a70', '#3b82f6', '#f59e0b'][i % 5] });
  };
  view.onResize();
  showReady();

  function trotro(ctx, x, y, s, main, stripe, label, rack, bob) {
    const W = 118 * s, H = 50 * s;
    ctx.save();
    ctx.translate(x, y + bob);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(W / 2, 2 * s, W * 0.55, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    if (rack) { // roof rack with luggage
      ctx.fillStyle = '#3b3343'; ctx.fillRect(10 * s, -H - 6 * s, W * 0.62, 3 * s);
      [['#1f8a70', 14, 16], ['#ffbe00', 34, 12], ['#ca1f3f', 50, 18]].forEach(([c, bx, bw]) => { ctx.fillStyle = c; roundRect(ctx, bx * s, -H - 15 * s, bw * s, 10 * s, 2 * s); ctx.fill(); });
    }
    // body
    ctx.beginPath();
    ctx.moveTo(4 * s, -6 * s); ctx.lineTo(4 * s, -H + 6 * s); ctx.quadraticCurveTo(4 * s, -H, 12 * s, -H);
    ctx.lineTo(W * 0.74, -H); ctx.quadraticCurveTo(W * 0.8, -H, W * 0.84, -H * 0.86);
    ctx.lineTo(W * 0.98, -H * 0.46); ctx.quadraticCurveTo(W, -H * 0.4, W, -H * 0.3); ctx.lineTo(W, -6 * s);
    ctx.quadraticCurveTo(W, 0, W - 6 * s, 0); ctx.lineTo(10 * s, 0); ctx.quadraticCurveTo(4 * s, 0, 4 * s, -6 * s);
    ctx.fillStyle = main; ctx.fill();
    ctx.lineWidth = 1.6 * s; ctx.strokeStyle = 'rgba(36,24,46,0.55)'; ctx.stroke();
    // windows
    ctx.fillStyle = '#d4ecf8';
    for (let i = 0; i < 4; i++) { roundRect(ctx, (10 + i * 19) * s, -H + 7 * s, 15 * s, 15 * s, 3 * s); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(W * 0.73, -H + 7 * s); ctx.lineTo(W * 0.8, -H + 7 * s); ctx.lineTo(W * 0.93, -H * 0.5); ctx.lineTo(W * 0.73, -H * 0.5); ctx.closePath(); ctx.fill();
    // stripe and name
    ctx.fillStyle = stripe; ctx.fillRect(4 * s, -H * 0.42, W - 4 * s, 7 * s);
    ctx.fillStyle = 'rgba(36,24,46,0.85)'; ctx.font = `700 ${8 * s}px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 12 * s, -H * 0.2);
    // lights
    ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(W - 3 * s, -H * 0.24, 3 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ca1f3f'; ctx.fillRect(3 * s, -H * 0.3, 3 * s, 6 * s);
    // wheels
    for (const wx of [W * 0.22, W * 0.8]) {
      ctx.fillStyle = '#24182e'; ctx.beginPath(); ctx.arc(wx, 0, 10 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b9b2c0'; ctx.beginPath(); ctx.arc(wx, 0, 4.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b9b2c0'; ctx.lineWidth = 1.5 * s;
      for (let k = 0; k < 3; k++) { const a = wheel + (k * Math.PI * 2) / 3; ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx + Math.cos(a) * 8 * s, Math.sin(a) * 8 * s); ctx.stroke(); }
    }
    ctx.restore();
    return W;
  }

  function sign(ctx, x, y, s, text, finish) {
    ctx.fillStyle = '#5a4470'; ctx.fillRect(x - 2 * s, y - 70 * s, 4 * s, 70 * s);
    pill(ctx, text, x, y - 78 * s, s, { bg: finish ? '#ca1f3f' : '#1f8a70', fg: '#fff', size: 13 });
  }

  function draw(dt) {
    const { ctx, w, h, s } = view;
    if (state === 'count') {
      countT -= dt;
      if (countT <= -0.6) state = 'race';
    }
    if (state === 'race' || (state === 'count' && countT <= 0)) {
      raceT += dt;
      paceP = Math.min(1, (raceT * pace.wpm * 5) / 60 / t.text.length);
      if (paceP >= 1 && paceDone == null) paceDone = raceT;
    }
    const k = REDUCED ? 1 : Math.min(1, dt * 6);
    const before = youShown;
    youShown += (you - youShown) * k;
    if (state === 'done' && youDone != null) youShown = you;
    const moving = youShown - before > 0.0004;
    if (!REDUCED) wheel += (youShown - before) * ROAD_LEN / (10 * s);

    const roadTop = h * 0.6, laneA = h * 0.74, laneB = h * 0.9;
    const worldX = (p) => 150 + p * (ROAD_LEN - 150);
    const lead = Math.max(youShown, Math.min(paceP, youShown + 0.12));
    const cam = Math.max(0, worldX(lead) - w * 0.42);
    // sky, sun, city
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, roadTop);
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(w * 0.86, h * 0.17, 22 * s, 0, Math.PI * 2); ctx.fill();
    const farCam = cam * 0.25;
    for (const b of city) {
      const x = b.x - farCam;
      if (x + b.w < 0 || x > w) continue;
      ctx.fillStyle = b.c; ctx.fillRect(x, roadTop - b.h * s, b.w, b.h * s);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      for (let wy = roadTop - b.h * s + 8 * s; wy < roadTop - 8 * s; wy += 14 * s) for (let wx = x + 6; wx < x + b.w - 8; wx += 12) ctx.fillRect(wx, wy, 5, 6 * s);
    }
    // verge and roadside things
    ctx.fillStyle = '#8fbf5a'; ctx.fillRect(0, roadTop - 8 * s, w, 10 * s);
    for (const p of props) {
      const x = p.x - cam;
      if (x < -80 || x > w + 80) continue;
      const by = roadTop - 4 * s;
      if (p.kind === 'palm') {
        ctx.strokeStyle = '#8a5c00'; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(x + 8 * s, by - 40 * s, x + 4 * s, by - 72 * s); ctx.stroke();
        ctx.strokeStyle = '#1f8a70'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
        for (const a of [-2.6, -2, -1.2, -0.5, 0.1]) { ctx.beginPath(); ctx.moveTo(x + 4 * s, by - 72 * s); ctx.quadraticCurveTo(x + 4 * s + Math.cos(a) * 18 * s, by - 80 * s + Math.sin(a) * 10 * s, x + 4 * s + Math.cos(a) * 30 * s, by - 66 * s + Math.sin(a) * 18 * s); ctx.stroke(); }
        ctx.lineCap = 'butt';
      } else if (p.kind === 'tree') {
        ctx.fillStyle = '#8a5c00'; ctx.fillRect(x - 3 * s, by - 34 * s, 6 * s, 34 * s);
        ctx.fillStyle = '#3f8f4f'; ctx.beginPath(); ctx.arc(x, by - 44 * s, 20 * s, 0, Math.PI * 2); ctx.arc(x + 14 * s, by - 36 * s, 14 * s, 0, Math.PI * 2); ctx.arc(x - 14 * s, by - 36 * s, 14 * s, 0, Math.PI * 2); ctx.fill();
      } else { // kiosk with a striped awning
        ctx.fillStyle = '#f4f0f6'; ctx.fillRect(x - 22 * s, by - 34 * s, 44 * s, 34 * s);
        ctx.fillStyle = '#5a4470'; ctx.fillRect(x - 8 * s, by - 22 * s, 16 * s, 22 * s);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fff' : p.c; ctx.fillRect(x - 26 * s + i * 13 * s, by - 44 * s, 13 * s, 10 * s); }
      }
    }
    // road
    ctx.fillStyle = '#4a4452'; ctx.fillRect(0, roadTop, w, h - roadTop);
    const kerb = 24 * s;
    for (let x = -((cam % (kerb * 2)) + kerb * 2); x < w; x += kerb * 2) { ctx.fillStyle = '#ffbe00'; ctx.fillRect(x, roadTop, kerb, 5 * s); ctx.fillStyle = '#24182e'; ctx.fillRect(x + kerb, roadTop, kerb, 5 * s); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const dash = 34 * s;
    for (let x = -(cam % (dash * 2)); x < w; x += dash * 2) ctx.fillRect(x, (laneA + laneB) / 2 - 8 * s, dash, 3 * s);
    ctx.fillStyle = '#c96f4a'; ctx.fillRect(0, h - 6 * s, w, 6 * s);
    // start and finish
    sign(ctx, 110 - cam, roadTop - 2 * s, s, 'Kaneshie');
    const fx = worldX(1) + 118 * s - cam;
    if (fx > -40 && fx < w + 40) {
      const sq = 8 * s;
      for (let y = roadTop + 5 * s, r = 0; y < h - 6 * s; y += sq, r++) for (let c = 0; c < 2; c++) { ctx.fillStyle = (r + c) % 2 ? '#fff' : '#24182e'; ctx.fillRect(fx + c * sq, y, sq, sq); }
      sign(ctx, fx + sq, roadTop - 2 * s, s, '🏁 Circle', true);
    }
    // dust behind your trotro
    const yx = worldX(youShown) - cam;
    if (!REDUCED && moving && Math.random() < 0.6) dust.push({ x: yx, y: laneB - 4 * s, r: 3 * s, life: 0.6 });
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i]; d.life -= dt; d.x -= 20 * dt * s; d.r += 14 * dt * s;
      if (d.life <= 0) { dust.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(201,111,74,${d.life * 0.5})`; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    // the two trotros
    const px = worldX(paceP) - cam;
    const bob = (on) => (REDUCED || !on ? 0 : Math.sin(performance.now() / 70) * 0.8 * s);
    trotro(ctx, px, laneA, s * 0.9, '#ffffff', '#5a4470', 'PACE', false, bob(state === 'race'));
    pill(ctx, `Pace ${pace.wpm} wpm`, px + 53 * s, laneA - 66 * s, s, { bg: '#5a4470', fg: '#fff', size: 11 });
    trotro(ctx, yx, laneB, s, '#ffbe00', '#ca1f3f', 'BIH EXPRESS', true, bob(moving));
    pill(ctx, 'You', yx + 59 * s, laneB - 76 * s, s, { bg: '#ca1f3f', fg: '#fff', size: 12 });
    // route bar
    const bx = 16 * s, bw = Math.min(w - 32 * s, 340 * s), by2 = 18 * s;
    roundRect(ctx, bx - 8 * s, by2 - 12 * s, bw + 16 * s, 24 * s, 12 * s); ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fill();
    ctx.fillStyle = '#e8e3ec'; ctx.fillRect(bx + 56 * s, by2 - 2 * s, bw - 112 * s, 4 * s);
    ctx.font = `600 ${10 * s}px ${FONT}`; ctx.fillStyle = '#24182e'; ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillText('Kaneshie', bx, by2); ctx.textAlign = 'right'; ctx.fillText('Circle', bx + bw, by2);
    const dot = (p, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx + 56 * s + p * (bw - 112 * s), by2, 5 * s, 0, Math.PI * 2); ctx.fill(); };
    dot(paceP, '#5a4470'); dot(youShown, '#ca1f3f');
    // countdown
    if (state === 'count') {
      const n = Math.ceil(countT);
      const label = countT > 0 ? String(n) : 'Go!';
      ctx.fillStyle = 'rgba(36,24,46,0.35)'; ctx.fillRect(0, 0, w, h);
      ctx.font = `700 ${70 * s}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = countT > 0 ? '#fff' : '#ffbe00'; ctx.fillText(label, w / 2, h * 0.45);
    }
    // live numbers
    if (state === 'race') {
      const st = t.stats();
      root.querySelector('[data-time]').textContent = `${Math.floor(raceT / 60)}:${String(Math.floor(raceT % 60)).padStart(2, '0')}`;
      root.querySelector('[data-wpm]').textContent = Math.round(st.correct / 5 / (Math.max(raceT, 1) / 60));
      root.querySelector('[data-acc]').textContent = Math.round(st.acc);
    }
  }
  return { stop() { view.stop(); unPause(); state = 'done'; } };
}

// ======================================================================
// Falling Mangoes: type the word on a mango to catch it before it lands.
// Three lives; the mangoes fall a little faster as you go.
// ======================================================================
export function fallingMangoes(root, { data, save, stage, done }) {
  root.innerHTML = `<div class="tt-game">
    <div class="tt-gamebar">
      <div class="tt-hud"><span>🥭 <b data-score>0</b> caught</span><span data-lives aria-label="Lives">❤️❤️❤️</span><span>Level <b data-level>1</b></span><span class="tt-muted">Best: <b data-best>${data.best.mango || 0}</b></span></div>
      <button type="button" class="btn btn-outline btn-small" data-sound></button>
    </div>
    <div class="tt-canvas mango"><canvas aria-label="Falling Mangoes game"></canvas><div class="tt-over" aria-live="polite"></div>
      <input class="tt-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type the word on a mango"></div>
    <p class="tt-hint">Type the word on any mango to catch it. <b>Backspace</b> rubs out a letter, <b>Space</b> lets go of a mango, <b>Esc</b> pauses.</p>
  </div>`;
  const canvas = root.querySelector('canvas');
  const over = root.querySelector('.tt-over');
  const input = root.querySelector('.tt-input');
  const $ = (q) => root.querySelector(q);
  soundButton($('[data-sound]'), data, save);

  const words = mangoWords(stage);
  let state = 'ready';
  let mangoes = [], bits = [];
  let target = null, score = 0, lives = 3, level = 1, spawnT = 0, playT = 0, right = 0, wrong = 0, shake = 0;
  let basketPop = 0;
  const misses = {};

  const view = stageOf(canvas, 0.5, 300, 430, draw);
  let tree;
  view.onResize = () => {
    // The tree canopy is drawn once into its own canvas.
    const { w, h, s } = view;
    tree = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    tree.width = w * dpr; tree.height = h * dpr;
    const g = tree.getContext('2d');
    g.scale(dpr, dpr);
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#bfe6fb'); sky.addColorStop(1, '#fff4dc');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b5d98a'; g.beginPath(); g.ellipse(w * 0.25, h * 0.92, w * 0.5, h * 0.2, 0, 0, Math.PI * 2); g.ellipse(w * 0.8, h * 0.94, w * 0.45, h * 0.18, 0, 0, Math.PI * 2); g.fill();
    // trunk
    g.fillStyle = '#7a4a1e';
    g.beginPath(); g.moveTo(w * 0.07, h); g.quadraticCurveTo(w * 0.1, h * 0.5, w * 0.05, h * 0.12); g.lineTo(w * 0.12, h * 0.12); g.quadraticCurveTo(w * 0.15, h * 0.55, w * 0.14, h); g.fill();
    // canopy
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const greens = ['#2f7d4a', '#3c9157', '#2a6e41', '#4aa063'];
    for (let i = 0; i < 70; i++) {
      g.fillStyle = greens[i % 4];
      g.beginPath(); g.arc(rnd() * w * 1.05 - w * 0.02, rnd() * h * 0.16 + h * 0.02, (26 + rnd() * 34) * s, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 9; i++) { const x = rnd() * w, y = h * (0.1 + rnd() * 0.08); drawMango(g, x, y, s * 0.7, 0, '#9cc94a'); }
    // ground
    g.fillStyle = '#c96f4a'; g.fillRect(0, h - 26 * s, w, 26 * s);
    g.fillStyle = '#8fbf5a';
    for (let x = 0; x < w; x += 14 * s) { g.beginPath(); g.moveTo(x, h - 26 * s); g.lineTo(x + 4 * s, h - 34 * s); g.lineTo(x + 8 * s, h - 26 * s); g.fill(); }
  };
  view.onResize();

  function drawMango(g, x, y, s, rot, col = '#f6b026') {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 15 * s, 19 * s, 0.35, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(202,31,63,0.35)'; g.beginPath(); g.ellipse(-5 * s, -5 * s, 7 * s, 9 * s, 0.35, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(5 * s, -7 * s, 3 * s, 5 * s, 0.35, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#5a3a16'; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(-4 * s, -18 * s); g.lineTo(-6 * s, -24 * s); g.stroke();
    g.fillStyle = '#2f7d4a'; g.beginPath(); g.ellipse(2 * s, -24 * s, 8 * s, 3.5 * s, -0.4, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  const fallTime = () => Math.max(4.2, 10 - (level - 1) * 0.75);
  const spawnEvery = () => Math.max(1.1, 3.2 - (level - 1) * 0.28);
  function spawn() {
    const { w, h, s } = view;
    const used = new Set(mangoes.filter((m) => m.state === 'fall').map((m) => m.word[0]));
    let word = words[Math.floor(Math.random() * words.length)];
    for (let i = 0; i < 12 && used.has(word[0]); i++) word = words[Math.floor(Math.random() * words.length)];
    const margin = 60 * s;
    mangoes.push({ word, typed: 0, x: margin + Math.random() * (w - margin * 2), y: h * 0.14, vy: (h * 0.8) / fallTime(), rot: 0, spin: (Math.random() - 0.5) * 0.6, state: 'fall', t: 0 });
  }

  function hud() {
    $('[data-score]').textContent = score;
    $('[data-lives]').textContent = '❤️'.repeat(lives) + '🤍'.repeat(3 - lives);
    $('[data-level]').textContent = level;
  }
  function showReady() {
    state = 'ready';
    over.innerHTML = `<div class="tt-over-card"><b>🥭 Falling Mangoes</b><p>Mangoes are falling from the tree! Type the word on a mango to catch it before it lands. You have three lives. The words use the letters you have learned.</p><button type="button" class="btn btn-primary" data-go>Start (Enter)</button></div>`;
    over.hidden = false;
    $('[data-go]').addEventListener('click', begin);
  }
  function begin() {
    mangoes = []; bits = []; target = null; score = 0; lives = 3; level = 1; spawnT = 0.4; playT = 0; right = 0; wrong = 0;
    for (const k in misses) delete misses[k];
    hud();
    state = 'play'; over.hidden = true;
    input.focus({ preventScroll: true });
    inView(root);
  }
  function gameOver() {
    state = 'over';
    target = null;
    sound.lose();
    const acc = right + wrong ? Math.round((right / (right + wrong)) * 100) : 100;
    const r = done({ score, acc, misses: { ...misses } });
    $('[data-best]').textContent = data.best.mango;
    over.innerHTML = `<div class="tt-over-card"><b>Game over!</b><p>You caught <b>${score}</b> mango${score === 1 ? '' : 'es'} with <b>${acc}%</b> accuracy.${r?.best ? ' 🎉 That is your best ever!' : ''}</p>
      ${r?.badge ? `<p class="tt-new-badge">${r.badge.icon} New badge: <b>${esc(r.badge.name)}</b></p>` : ''}
      <button type="button" class="btn btn-primary" data-go>Play again (Enter)</button></div>`;
    over.hidden = false;
    $('[data-go]').addEventListener('click', begin);
    input.focus({ preventScroll: true });
  }
  const pause = () => {
    if (state !== 'play') return;
    state = 'paused';
    over.innerHTML = '<div class="tt-over-card"><b>⏸ Paused</b><p>The mangoes are waiting for you.</p><button type="button" class="btn btn-primary" data-go>Carry on</button></div>';
    over.hidden = false;
    $('[data-go]').addEventListener('click', () => { state = 'play'; over.hidden = true; input.focus({ preventScroll: true }); });
  };
  const unPause = pauseOn(input, pause);

  function bad(ch) {
    wrong++;
    if (ch) misses[ch] = (misses[ch] || 0) + 1;
    if (!REDUCED) shake = 0.25;
    sound.bad();
  }
  keyInput(input, {
    onKey(e) {
      if (e.key === 'Enter' && state !== 'play') { if (state === 'paused') { state = 'play'; over.hidden = true; } else begin(); return false; }
      if (e.key === 'Escape') { if (state === 'play') pause(); return false; }
      if (e.key === ' ' && state === 'play') { if (target) { target.typed = 0; target = null; } return false; }
    },
    onChar(c) {
      if (state !== 'play') return;
      if (!target) {
        const hits = mangoes.filter((m) => m.state === 'fall' && m.word[0] === c).sort((a, b) => b.y - a.y);
        if (!hits.length) return bad(null);
        target = hits[0];
        target.typed = 1; right++;
      } else if (target.word[target.typed] === c) { target.typed++; right++; }
      else return bad(target.word[target.typed]);
      if (target.typed >= target.word.length) {
        target.state = 'caught'; target.t = 0; target.fx = target.x; target.fy = target.y;
        score++; basketPop = 1;
        if (score % 6 === 0) level++;
        hud(); sound.good();
        if (!REDUCED) for (let i = 0; i < 10; i++) bits.push({ x: target.x, y: target.y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160, life: 0.7 });
        target = null;
      }
    },
    onBack() { if (state === 'play' && target) { target.typed--; if (target.typed <= 0) { target.typed = 0; target = null; } } },
  });
  canvas.parentElement.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) { e.preventDefault(); input.focus({ preventScroll: true }); } });
  showReady();

  function draw(dt) {
    const { ctx, w, h, s } = view;
    if (state === 'play') {
      playT += dt;
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = spawnEvery(); }
    }
    const run = state === 'play';
    ctx.save();
    if (shake > 0) { shake -= dt; ctx.translate((Math.random() - 0.5) * 6, 0); }
    ctx.drawImage(tree, 0, 0, w, h);
    // basket
    const bx = w - 70 * s, by = h - 26 * s;
    const pop = basketPop > 0 ? 1 + basketPop * 0.12 : 1;
    basketPop = Math.max(0, basketPop - dt * 3);
    ctx.save(); ctx.translate(bx, by); ctx.scale(pop, pop);
    ctx.fillStyle = '#b07a3a'; ctx.beginPath(); ctx.moveTo(-40 * s, -34 * s); ctx.lineTo(40 * s, -34 * s); ctx.lineTo(30 * s, 0); ctx.lineTo(-30 * s, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8a5c00'; ctx.lineWidth = 2 * s;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 15 * s, -34 * s); ctx.lineTo(i * 11 * s, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-36 * s, -18 * s); ctx.lineTo(36 * s, -18 * s); ctx.stroke();
    for (let i = 0; i < Math.min(score, 5); i++) drawMango(ctx, (-24 + i * 12) * s, -38 * s, s * 0.6, 0.3);
    ctx.restore();
    // mangoes
    for (let i = mangoes.length - 1; i >= 0; i--) {
      const m = mangoes[i];
      if (m.state === 'fall') {
        if (run) { m.y += m.vy * dt; if (!REDUCED) m.rot += m.spin * dt; }
        if (m.y >= h - 40 * s) {
          m.state = 'splat'; m.t = 0;
          if (target === m) target = null;
          lives--; hud(); sound.bad();
          if (lives <= 0) gameOver();
        }
      } else m.t += dt;
      if (m.state === 'caught') {
        const k = Math.min(1, m.t / (REDUCED ? 0.01 : 0.45));
        m.x = m.fx + (bx - m.fx) * k; m.y = m.fy + (by - 40 * s - m.fy) * k - Math.sin(k * Math.PI) * 60 * s;
        if (k >= 1) { mangoes.splice(i, 1); continue; }
        drawMango(ctx, m.x, m.y, s, m.rot);
        continue;
      }
      if (m.state === 'splat') {
        if (m.t > 1.2) { mangoes.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(246,176,38,${1 - m.t / 1.2})`;
        ctx.beginPath(); ctx.ellipse(m.x, h - 28 * s, 24 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      drawMango(ctx, m.x, m.y, s, m.rot);
      // word label: typed part green, the rest plum
      const size = 15 * s;
      ctx.font = `700 ${size}px ${FONT}`;
      const done = m.word.slice(0, m.typed), rest = m.word.slice(m.typed);
      const tw = ctx.measureText(m.word).width;
      const lx = Math.max(tw / 2 + 12 * s, Math.min(w - tw / 2 - 12 * s, m.x));
      const ly = m.y + 34 * s;
      roundRect(ctx, lx - tw / 2 - 9 * s, ly - size * 0.8, tw + 18 * s, size * 1.6, size * 0.8);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.lineWidth = 2.5 * s; ctx.strokeStyle = m === target ? '#ca1f3f' : 'rgba(36,24,46,0.25)'; ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1f8a70'; ctx.fillText(done, lx - tw / 2, ly + 1);
      ctx.fillStyle = '#24182e'; ctx.fillText(rest, lx - tw / 2 + ctx.measureText(done).width, ly + 1);
    }
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i]; b.life -= dt; b.vy += 400 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.life <= 0) { bits.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(255,190,0,${b.life})`; ctx.fillRect(b.x, b.y, 4 * s, 4 * s);
    }
    ctx.restore();
  }
  return { stop() { view.stop(); unPause(); state = 'over'; } };
}
