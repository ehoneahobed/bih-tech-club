// Session 28 — Photos, Audio & Video: a 3D editing desk. Pupils fix a
// sideways market photo (rotate, crop, resize, compress, Save as copy) and
// watch the file size shrink; trim the messy start and end off a voice note
// on a waveform; then cut a 30-second community video on a timeline (clips
// in storyboard order, a title, credits, music they are allowed to use) and
// export it. Consent comes along at every step: no faces, no uniforms.
import { THREE, COLORS, mat, rbox, cable, decal, label, setLabel } from './runtime.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT = 'Rubik, system-ui, sans-serif';

// ---------- Photo maths ----------
// A 4000 × 3000 phone photo is about 4 MB. Fewer pixels and lower quality
// make the file smaller (small photos keep a little more detail per pixel).
const CROPS = {
  whole: { name: 'Whole photo', r: [0, 0, 4000, 3000] },
  thirds: { name: 'Crop 4:3 (rule of thirds)', r: [900, 450, 3000, 2250] },
  square: { name: 'Crop square 1:1', r: [1000, 0, 3000, 3000] },
};
const WIDTHS = [4000, 1600, 800];
const QUALITY = {
  high: { name: 'High', f: 1 },
  medium: { name: 'Medium', f: 0.38 },
  low: { name: 'Low', f: 0.18 },
};
const photoMB = (w, h, q) => 4 * Math.pow((w * h) / 12e6, 0.85) * QUALITY[q].f;
// Session 6: 1 MB is about 1,000 KB.
const size = (mb) => (mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(10, Math.round((mb * 1000) / 10) * 10)} KB`);

// ---------- Voice note: 21 seconds as recorded ----------
const VOICE_LEN = 21;
const SEGMENTS = [
  { from: 0, to: 0.6, kind: 'quiet' },
  { from: 0.6, to: 2.2, kind: 'mess', text: 'Erm… is it on?' },
  { from: 2.2, to: 3.0, kind: 'quiet' },
  { from: 3.0, to: 5.0, kind: 'speech', text: 'Welcome to Bozoma!' },
  { from: 5.2, to: 8.2, kind: 'speech', text: 'Here are five places we love:' },
  { from: 8.5, to: 11.6, kind: 'speech', text: 'the market, our school, the river,' },
  { from: 11.9, to: 14.6, kind: 'speech', text: 'the chop bar and the Hub.' },
  { from: 14.9, to: 17.6, kind: 'speech', text: 'Come and see them with us!' },
  { from: 17.6, to: 18.4, kind: 'quiet' },
  { from: 18.4, to: 20.2, kind: 'mess', text: '*cough* …was that okay?' },
  { from: 20.2, to: 21, kind: 'quiet' },
];
const SPEECH_START = 3.0;
const SPEECH_END = 17.6;
const KB_PER_S = 16; // a typical voice-note recording

// ---------- Video clips ----------
const CLIPS = {
  market: { name: 'Market', icon: '🧺', len: 8, bg: '#E8A33C' },
  school: { name: 'School building', icon: '🏫', len: 7, bg: '#7FB2D9' },
  river: { name: 'River', icon: '🌊', len: 8, bg: '#2EC4B6' },
  chopbar: { name: 'Chop bar', icon: '🍲', len: 7, bg: '#CA1F3F' },
  hub: { name: 'The Hub', icon: '💡', len: 6, bg: '#5A4470' },
  sunset: { name: 'Sunset', icon: '🌅', len: 8, bg: '#F28C38' },
  friends: { name: 'Classmates in uniform', icon: '🧑🏾‍🤝‍🧑🏾', len: 6, bg: '#C9B8D9', bad: true },
};
const STORY = ['market', 'school', 'river', 'chopbar', 'hub', 'sunset'];
const MUSIC = {
  none: { name: 'No music' },
  free: { name: '“Sunny Day” (editor’s free library)' },
  hit: { name: 'A famous Afrobeats hit (copyright)' },
};
const RAW_MB_PER_S = 2; // straight from the phone camera
const EXPORT = { 720: 0.6, 1080: 1.0 }; // MB per second of exported video

// Screen canvas (the monitor shows the editor app).
const CW = 1280;
const CH = 736;

// Wall-clock animation for playback and export: on a slow PC (few frames a
// second) a frame-step tween would make a 5-second preview take much longer.
function play(fn, secs) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (secs * 1000));
      fn(k);
      if (k < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export default function mediaLab(stage, ui) {
  const { scene } = stage;
  const T = 1.5; // desk top

  // ---------- Room and desk ----------
  const floor = rbox(10.5, 0.12, 5.6, 0xe7e0d4, 0.05);
  floor.position.set(0, -0.06, 0);
  scene.add(floor);
  const desk = rbox(7.6, 0.16, 3.0, 0xc8a27a, 0.05);
  desk.position.set(0, T - 0.08, 0);
  scene.add(desk);
  const leg0 = rbox(0.18, T - 0.16, 0.18, 0x8a6a4a, 0.04);
  for (const x of [-3.55, 3.55]) for (const z of [-1.25, 1.25]) {
    const leg = leg0.clone();
    leg.position.set(x, (T - 0.16) / 2, z);
    scene.add(leg);
  }

  // ---------- Monitor (the editor app) ----------
  const monitor = new THREE.Group();
  monitor.position.set(0, T, -0.75);
  scene.add(monitor);
  const mBase = rbox(1.3, 0.06, 0.7, 0x2b2730, 0.03);
  mBase.position.y = 0.03;
  const mNeck = rbox(0.2, 1.0, 0.12, 0x3b3f46, 0.04);
  mNeck.position.set(0, 0.5, -0.12);
  const mFrame = rbox(4.5, 2.66, 0.14, 0x2b2730, 0.08);
  mFrame.position.set(0, 1.78, 0);
  monitor.add(mBase, mNeck, mFrame);
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = CW;
  screenCanvas.height = CH;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 4;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 2.47), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.set(0, 1.78, 0.072);
  screen.userData.noInk = true;
  monitor.add(screen);
  const sticker = decal(0.7, 0.16, (g, W, H) => {
    g.fillStyle = '#FFBE00';
    g.beginPath(); g.roundRect(0, 0, W, H, H / 2); g.fill();
    g.fillStyle = '#24182E';
    g.font = `bold ${H * 0.6}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('AKWAABA', W / 2, H * 0.55);
  }, { px: 40 });
  sticker.position.set(1.75, 0.53, 0.072);
  monitor.add(sticker);

  // Keyboard, and a mouse on a kente mousepad.
  const kb = rbox(2.5, 0.08, 0.8, 0xe9e5ec, 0.03);
  kb.position.set(-0.2, T + 0.04, 0.55);
  scene.add(kb);
  const keys = decal(2.4, 0.7, (g, W, H) => {
    g.fillStyle = '#e9e5ec';
    g.fillRect(0, 0, W, H);
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const n = 14 - (r === 4 ? 6 : 0);
      const kw = (W - 12) / 14;
      for (let k = 0; k < n; k++) {
        const w = r === 4 && k === 3 ? kw * 7 : kw;
        const x = 6 + (r === 4 && k > 3 ? k + 6 : k) * kw;
        g.fillStyle = '#ffffff';
        g.strokeStyle = '#b9b0c2';
        g.lineWidth = 2;
        g.beginPath(); g.roundRect(x + 2, 6 + r * ((H - 12) / rows) + 2, w - 4, (H - 12) / rows - 4, 5); g.fill(); g.stroke();
      }
    }
  }, { px: 128, transparent: false });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(-0.2, T + 0.082, 0.55);
  scene.add(keys);
  const pad = rbox(1.0, 0.02, 0.8, 0x24182e, 0.01);
  pad.position.set(1.75, T + 0.01, 0.6);
  scene.add(pad);
  const kente = decal(0.96, 0.76, (g, W, H) => {
    const cols = ['#FFBE00', '#2E8B57', '#CA1F3F', '#24182E'];
    const s = W / 8;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 7; j++) {
      g.fillStyle = cols[(i + j * 2) % 4];
      g.fillRect(i * s, j * s, s, s);
      g.fillStyle = cols[(i + j + 1) % 4];
      for (let k = 0; k < 3; k++) g.fillRect(i * s + 4, j * s + 6 + k * (s / 3), s - 8, s / 9);
    }
  }, { px: 128, transparent: false });
  kente.rotation.x = -Math.PI / 2;
  kente.position.set(1.75, T + 0.022, 0.6);
  scene.add(kente);
  const mouse = rbox(0.24, 0.1, 0.38, 0x2b2730, 0.05);
  mouse.position.set(1.85, T + 0.07, 0.62);
  scene.add(mouse);
  scene.add(cable([[1.85, T + 0.06, 0.42], [1.7, T + 0.02, 0.0], [1.0, T + 0.02, -0.4], [0.5, T + 0.02, -0.7]], 0x2b2730, 0.02));

  // ---------- Phone on a tripod (capture) ----------
  const tripod = new THREE.Group();
  tripod.position.set(-2.85, T, 0.55);
  tripod.rotation.y = 0.35;
  scene.add(tripod);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    tripod.add(cable([[0, 0.8, 0], [Math.sin(a) * 0.22, 0.4, Math.cos(a) * 0.22], [Math.sin(a) * 0.42, 0.01, Math.cos(a) * 0.42]], 0x3b3f46, 0.025));
  }
  const mast = rbox(0.06, 0.25, 0.06, 0x3b3f46, 0.02);
  mast.position.y = 0.9;
  tripod.add(mast);
  const phone = rbox(1.0, 0.52, 0.07, COLORS.purple, 0.07);
  phone.position.set(0, 1.28, 0);
  tripod.add(phone);
  const phoneScreen = decal(0.92, 0.45, (g, W, H) => {
    drawMarket(g, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    g.lineWidth = 2;
    for (const k of [1, 2]) {
      g.beginPath(); g.moveTo((W * k) / 3, 0); g.lineTo((W * k) / 3, H); g.stroke();
      g.beginPath(); g.moveTo(0, (H * k) / 3); g.lineTo(W, (H * k) / 3); g.stroke();
    }
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(W - 22, H / 2, 14, 0, Math.PI * 2); g.fill();
  }, { px: 128, transparent: false });
  phoneScreen.position.set(0, 1.28, 0.037);
  tripod.add(phoneScreen);

  // ---------- Printed photo in a frame (ask first) ----------
  const frame = new THREE.Group();
  frame.position.set(-2.15, T, -0.35);
  frame.rotation.y = 0.4;
  scene.add(frame);
  const fBack = rbox(0.9, 0.72, 0.06, 0x8a6a4a, 0.03);
  fBack.position.y = 0.36;
  fBack.rotation.x = -0.12;
  frame.add(fBack);
  const print = decal(0.76, 0.57, (g, W, H) => drawMarket(g, W, H), { px: 160, transparent: false });
  print.position.set(0, 0.0, 0.032);
  fBack.add(print);

  // ---------- Storyboard on a little easel ----------
  const board = new THREE.Group();
  board.position.set(-3.0, T, -0.95);
  board.rotation.y = 0.45;
  scene.add(board);
  const cork = rbox(1.25, 0.95, 0.05, 0xc8a27a, 0.03);
  cork.position.y = 0.62;
  cork.rotation.x = -0.15;
  board.add(cork);
  const sheet = decal(1.12, 0.82, (g, W, H) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#24182E';
    g.font = `bold ${H * 0.09}px ${FONT}`;
    g.textAlign = 'center';
    g.fillText('STORYBOARD', W / 2, H * 0.11);
    STORY.forEach((id, i) => {
      const x = 10 + (i % 3) * ((W - 20) / 3);
      const y = H * 0.17 + Math.floor(i / 3) * (H * 0.41);
      const w = (W - 20) / 3 - 8;
      g.strokeStyle = '#24182E';
      g.lineWidth = 2;
      g.strokeRect(x, y, w, H * 0.3);
      g.font = `${H * 0.13}px ${FONT}`;
      g.fillText(CLIPS[id].icon, x + w / 2, y + H * 0.2);
      g.font = `bold ${H * 0.065}px ${FONT}`;
      g.fillText(`${i + 1}. ${CLIPS[id].name.split(' ')[0]} · 5 s`, x + w / 2, y + H * 0.37);
    });
  }, { px: 200, transparent: false });
  sheet.position.set(0, 0, 0.03);
  cork.add(sheet);
  for (const x of [-0.4, 0.4]) {
    const leg = rbox(0.06, 0.6, 0.06, 0x8a6a4a, 0.02);
    leg.position.set(x, 0.24, 0.05);
    board.add(leg);
  }

  // ---------- Microphone (voice note) ----------
  const mic = new THREE.Group();
  mic.position.set(2.5, T, 1.05);
  scene.add(mic);
  const micBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 24), mat(0x2b2730));
  micBase.position.y = 0.03;
  micBase.castShadow = true;
  const micStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 10), mat(0x6b6f78, { metalness: 0.4 }));
  micStalk.position.y = 0.4;
  const micBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.32, 16), mat(0x3b3f46, { metalness: 0.3 }));
  micBody.position.y = 0.88;
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), mat(COLORS.gold, { roughness: 0.9 }));
  micHead.position.y = 1.12;
  const micLed = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.1 }));
  micLed.position.set(0, 0.86, 0.1);
  mic.add(micBase, micStalk, micBody, micHead, micLed);

  // ---------- Speaker (plays the voice note) ----------
  const speaker = new THREE.Group();
  speaker.position.set(2.6, T, -1.0);
  speaker.rotation.y = -0.3;
  scene.add(speaker);
  const spBox = rbox(0.5, 0.75, 0.45, 0x3b3f46, 0.06);
  spBox.position.y = 0.375;
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24), mat(0x24182e));
  cone.rotation.x = Math.PI / 2;
  cone.position.set(0, 0.32, 0.23);
  const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), mat(0x24182e));
  tweeter.rotation.x = Math.PI / 2;
  tweeter.position.set(0, 0.6, 0.23);
  speaker.add(spBox, cone, tweeter);

  // ---------- File size tower: before and after ----------
  const tower = new THREE.Group();
  tower.position.set(3.1, T, -0.3);
  tower.rotation.y = -0.3;
  scene.add(tower);
  const plinth = rbox(1.2, 0.08, 0.5, COLORS.purple, 0.03);
  plinth.position.y = 0.04;
  tower.add(plinth);
  const MAX_H = 1.9;
  const colGeo = new THREE.BoxGeometry(0.32, 1, 0.32);
  colGeo.translate(0, 0.5, 0);
  const beforeCol = new THREE.Mesh(colGeo, mat(0xb9b0c2));
  beforeCol.position.set(-0.3, 0.08, 0);
  const afterCol = new THREE.Mesh(colGeo, mat(COLORS.gold));
  afterCol.position.set(0.3, 0.08, 0);
  beforeCol.castShadow = afterCol.castShadow = true;
  beforeCol.scale.y = afterCol.scale.y = MAX_H;
  tower.add(beforeCol, afterCol);
  const beforeTag = label('', { scale: 0.5 });
  const afterTag = label('', { scale: 0.5 });
  tower.add(beforeTag, afterTag);
  const towerSign = decal(1.15, 0.14, (g, W, H) => {
    g.fillStyle = '#FFFFFF';
    g.font = `bold ${H * 0.62}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText('BEFORE', W * 0.06, H * 0.55);
    g.textAlign = 'right';
    g.fillText('AFTER', W * 0.94, H * 0.55);
  }, { px: 40 });
  towerSign.position.set(0, 0.04, 0.252);
  tower.add(towerSign);
  const towerTop = new THREE.Object3D();
  tower.add(towerTop);

  // ---------- Clapperboard (video) ----------
  const clap = new THREE.Group();
  clap.position.set(-1.55, T, 0.95);
  clap.rotation.set(0, 0.5, 0);
  scene.add(clap);
  const slate = rbox(0.7, 0.04, 0.5, 0x24182e, 0.02);
  slate.position.y = 0.02;
  const slateText = decal(0.62, 0.36, (g, W, H) => {
    g.fillStyle = '#ffffff';
    g.font = `bold ${H * 0.2}px ${FONT}`;
    g.textAlign = 'left';
    g.fillText('MY BOZOMA', 10, H * 0.32);
    g.font = `${H * 0.16}px ${FONT}`;
    g.fillText('SCENE 1 · TAKE 2', 10, H * 0.62);
    g.fillText('TEAM 3', 10, H * 0.88);
  }, { px: 96 });
  slateText.rotation.x = -Math.PI / 2;
  slateText.position.set(0, 0.042, 0.04);
  const stick = new THREE.Group();
  stick.position.set(0, 0.05, -0.25);
  const stickBar = rbox(0.7, 0.05, 0.1, 0xffffff, 0.01);
  stickBar.position.z = 0.05;
  const stripes = decal(0.7, 0.1, (g, W, H) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#24182E';
    for (let x = -H; x < W; x += H * 1.2) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H * 0.6, H); g.lineTo(x + H * 1.2, 0); g.lineTo(x + H * 0.6, 0); g.fill(); }
  }, { px: 32, transparent: false });
  stripes.rotation.x = -Math.PI / 2;
  stripes.position.set(0, 0.027, 0.05);
  stick.add(stickBar, stripes);
  stick.rotation.x = -0.35;
  clap.add(slate, slateText, stick);

  // A mug of tea, because editing takes a while.
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.3, 18), mat(COLORS.red));
  mug.position.set(-1.0, T + 0.15, -0.15);
  mug.castShadow = true;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 14), mat(COLORS.red));
  handle.position.set(-1.16, T + 0.16, -0.15);
  scene.add(mug, handle);

  // ---------- Callouts (most important first: phones show four) ----------
  const cards = {
    screen: stage.callout(screen, { icon: '🖥️', title: 'Editor', text: 'Crop, trim and cut away the bad bits.', at: [-1.6, 1.0, 0], dx: -80, dy: -60 }),
    size: stage.callout(towerTop, { icon: '📦', title: 'File size', text: 'Smaller files send faster on data.', at: [0, 0, 0], dx: 40, dy: -150 }),
    phone: stage.callout(phone, { icon: '📱', title: 'Capture', text: 'Good light, steady hands, grid on.', at: [-0.3, 0, 0], dx: -60, dy: 110 }),
    mic: stage.callout(micHead, { icon: '🎙️', title: 'Microphone', text: 'A hand’s width from your mouth.', at: [0, 0.1, 0], dx: 40, dy: 110 }),
    board: stage.callout(cork, { icon: '🎬', title: 'Storyboard', text: 'Plan six 5-second shots first.', at: [0, 0.4, 0], dx: -30, dy: -110 }),
    ask: stage.callout(fBack, { icon: '🙋🏾', title: 'Ask first', text: 'No faces or uniforms without permission.', at: [0.2, 0.2, 0.05], dx: 60, dy: 150 }),
  };

  // ---------- State ----------
  const photo = { turn: 3, crop: 'whole', width: 4000, q: 'high', saved: null };
  const voice = { start: 0, end: VOICE_LEN, trimmed: false, head: null };
  const video = { clips: [], title: false, credits: false, music: 'none', head: null, exported: null, progress: null };
  let mode = 'photo';
  let busy = false;

  const photoDims = () => {
    const [, , cw, ch] = CROPS[photo.crop].r;
    const w = Math.min(photo.width, cw);
    const h = Math.round((w * ch) / cw);
    return photo.turn % 2 ? [h, w] : [w, h];
  };
  const photoSize = () => {
    const [w, h] = photoDims();
    return photoMB(w, h, photo.q);
  };
  const videoLen = () => video.clips.reduce((s, c) => s + c.len, 0);

  // ---------- Drawing the editor screen ----------
  const market = document.createElement('canvas');
  market.width = 800;
  market.height = 600;
  drawMarket(market.getContext('2d'), 800, 600, true);
  const work = document.createElement('canvas');
  const tiny = document.createElement('canvas');

  function chrome(g, appName, file) {
    g.fillStyle = '#1E1A24';
    g.fillRect(0, 0, CW, CH);
    g.fillStyle = '#2C2534';
    g.fillRect(0, 0, CW, 58);
    g.fillStyle = '#FFBE00';
    g.font = `bold 30px ${FONT}`;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillText(appName, 24, 30);
    const x = 24 + g.measureText(appName).width + 30;
    g.fillStyle = '#D9D3DE';
    g.font = `24px ${FONT}`;
    g.fillText(file, x, 30);
    for (const [i, c] of ['#CA1F3F', '#FFBE00', '#2EC4B6'].entries()) {
      g.fillStyle = c;
      g.beginPath(); g.arc(CW - 30 - i * 30, 30, 9, 0, Math.PI * 2); g.fill();
    }
  }
  function bar(g, text, color = '#FFFFFF') {
    g.fillStyle = '#2C2534';
    g.fillRect(0, CH - 70, CW, 70);
    g.fillStyle = color;
    g.font = `bold 28px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, CW / 2, CH - 35, CW - 40);
  }

  function drawPhoto(g) {
    chrome(g, '🖼️ Photos', photo.saved === 'copy' ? 'Market_photo_copy.jpg' : 'Market_photo.jpg');
    // Make the edited picture: crop, then (if low quality) blocky.
    const [cx, cy, cw, ch] = CROPS[photo.crop].r;
    const sx = cx / 5, sy = cy / 5, sw = cw / 5, sh = ch / 5;
    work.width = Math.round(sw);
    work.height = Math.round(sh);
    const wg = work.getContext('2d');
    wg.imageSmoothingEnabled = true;
    if (photo.q === 'low' || photo.width === 800) {
      const k = photo.q === 'low' ? 14 : 3;
      tiny.width = Math.max(8, Math.round(sw / k));
      tiny.height = Math.max(6, Math.round(sh / k));
      tiny.getContext('2d').drawImage(market, sx, sy, sw, sh, 0, 0, tiny.width, tiny.height);
      wg.imageSmoothingEnabled = photo.q !== 'low';
      wg.drawImage(tiny, 0, 0, work.width, work.height);
    } else {
      wg.drawImage(market, sx, sy, sw, sh, 0, 0, work.width, work.height);
    }
    // Main view, turned the way the photo is turned.
    const areaX = 330, areaY = 80, areaW = CW - 360, areaH = CH - 170;
    const rotW = photo.turn % 2 ? work.height : work.width;
    const rotH = photo.turn % 2 ? work.width : work.height;
    const s = Math.min(areaW / rotW, areaH / rotH);
    g.save();
    g.translate(areaX + areaW / 2, areaY + areaH / 2);
    g.rotate((photo.turn * Math.PI) / 2);
    g.drawImage(work, (-work.width * s) / 2, (-work.height * s) / 2, work.width * s, work.height * s);
    if (photo.crop !== 'whole' && photo.turn === 0) {
      // Rule-of-thirds grid on the cropped picture.
      g.strokeStyle = 'rgba(255,255,255,0.75)';
      g.lineWidth = 2;
      g.setLineDash([10, 8]);
      const w = work.width * s, h = work.height * s;
      for (const k of [1, 2]) {
        g.beginPath(); g.moveTo(-w / 2 + (w * k) / 3, -h / 2); g.lineTo(-w / 2 + (w * k) / 3, h / 2); g.stroke();
        g.beginPath(); g.moveTo(-w / 2, -h / 2 + (h * k) / 3); g.lineTo(w / 2, -h / 2 + (h * k) / 3); g.stroke();
      }
      g.setLineDash([]);
    }
    g.restore();
    // Left panel: the original with the crop box, and the sizes.
    g.fillStyle = '#2C2534';
    g.fillRect(0, 58, 306, CH - 128);
    g.fillStyle = '#D9D3DE';
    g.font = `bold 22px ${FONT}`;
    g.textAlign = 'left';
    g.fillText('Original (kept safe)', 20, 92);
    g.save();
    g.translate(153, 220);
    g.rotate((photo.turn * Math.PI) / 2);
    const ts = 0.3;
    g.drawImage(market, -400 * ts, -300 * ts, 800 * ts, 600 * ts);
    g.strokeStyle = '#FFBE00';
    g.lineWidth = 4;
    g.strokeRect(-400 * ts + sx * ts, -300 * ts + sy * ts, sw * ts, sh * ts);
    g.restore();
    const [w, h] = photoDims();
    const lines = [
      ['Original', '4000 × 3000', '4.0 MB'],
      ['Your copy', `${w} × ${h}`, size(photoSize())],
    ];
    lines.forEach(([a, b, c], i) => {
      const y = 380 + i * 110;
      g.fillStyle = i ? '#FFBE00' : '#B9B0C2';
      g.font = `bold 24px ${FONT}`;
      g.fillText(a, 20, y);
      g.fillStyle = '#FFFFFF';
      g.font = `24px ${FONT}`;
      g.fillText(`${b} px`, 20, y + 34);
      g.font = `bold 34px ${FONT}`;
      g.fillText(c, 20, y + 74);
    });
    const msg = photo.turn ? '⟳ The photo is sideways: rotate it first' : photo.saved === 'copy' ? '✅ Saved as a copy. The original is still safe.' : photo.saved === 'replace' ? '⚠️ The original was replaced!' : `Crop: ${CROPS[photo.crop].name} · Quality: ${QUALITY[photo.q].name}`;
    bar(g, msg, photo.saved === 'replace' ? '#FF8FA3' : '#FFFFFF');
  }

  // A fake but believable waveform: quiet hiss, an "erm", words, a cough.
  const WAVE_N = 420;
  const wave = Array.from({ length: WAVE_N }, (_, i) => {
    const t = (i / WAVE_N) * VOICE_LEN;
    const seg = SEGMENTS.find((s) => t >= s.from && t < s.to);
    const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    if (!seg || seg.kind === 'quiet') return 0.03 + r * 0.03;
    const env = Math.sin(((t - seg.from) / (seg.to - seg.from)) * Math.PI);
    const syll = 0.55 + 0.45 * Math.abs(Math.sin(t * 9));
    return (seg.kind === 'mess' ? 0.35 : 0.85) * env * syll * (0.7 + r * 0.3) + 0.04;
  });
  function drawVoice(g) {
    chrome(g, '🎙️ Sound Recorder', voice.trimmed ? 'Voice_note_trimmed.m4a' : 'Voice_note.m4a');
    const x0 = 60, x1 = CW - 60, mid = 330, amp = 190;
    const X = (t) => x0 + ((x1 - x0) * t) / VOICE_LEN;
    // Time ruler.
    g.fillStyle = '#B9B0C2';
    g.font = `20px ${FONT}`;
    g.textAlign = 'center';
    for (let t = 0; t <= VOICE_LEN; t += 3) {
      g.fillRect(X(t) - 1, 90, 2, 14);
      g.fillText(`${t} s`, X(t), 124);
    }
    // Words over the waveform.
    for (const s of SEGMENTS) {
      if (!s.text) continue;
      g.fillStyle = s.kind === 'mess' ? '#FF8FA3' : '#7FE0D6';
      g.font = `${s.kind === 'mess' ? 'italic ' : ''}20px ${FONT}`;
      g.fillText(s.kind === 'mess' ? s.text : '“…”', (X(s.from) + X(s.to)) / 2, 158);
    }
    const bw = (x1 - x0) / WAVE_N;
    wave.forEach((a, i) => {
      const t = (i / WAVE_N) * VOICE_LEN;
      const keep = t >= voice.start && t <= voice.end;
      g.fillStyle = keep ? '#2EC4B6' : 'rgba(185,176,194,0.35)';
      g.fillRect(x0 + i * bw, mid - a * amp, Math.max(1, bw - 0.6), a * amp * 2);
    });
    // Trimmed-away parts are shaded; gold handles show the new start and end.
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(x0, mid - amp - 10, X(voice.start) - x0, amp * 2 + 20);
    g.fillRect(X(voice.end), mid - amp - 10, x1 - X(voice.end), amp * 2 + 20);
    for (const t of [voice.start, voice.end]) {
      g.fillStyle = '#FFBE00';
      g.fillRect(X(t) - 3, mid - amp - 20, 6, amp * 2 + 40);
      g.beginPath(); g.roundRect(X(t) - 14, mid + amp + 14, 28, 28, 6); g.fill();
    }
    if (voice.head !== null) {
      g.fillStyle = '#FFFFFF';
      g.fillRect(X(voice.head) - 2, mid - amp - 30, 4, amp * 2 + 60);
      const seg = SEGMENTS.find((s) => voice.head >= s.from && voice.head < s.to);
      g.font = `bold 30px ${FONT}`;
      g.fillStyle = seg?.kind === 'mess' ? '#FF8FA3' : '#FFFFFF';
      g.fillText(seg?.text ? `🔊 ${seg.text}` : '🔊 (silence)', CW / 2, 590);
    } else {
      g.fillStyle = '#D9D3DE';
      g.font = `24px ${FONT}`;
      g.fillText('Gold handles = new start and end. The grey parts get cut off.', CW / 2, 590);
    }
    const len = voice.end - voice.start;
    bar(g, `Length ${len.toFixed(1)} s (was ${VOICE_LEN} s) · ${Math.round(len * KB_PER_S)} KB (was ${VOICE_LEN * KB_PER_S} KB)${voice.trimmed ? ' · ✅ trimmed' : ''}`);
  }

  function drawVideo(g) {
    chrome(g, '🎬 Video editor', video.exported ? `TechClub_MyCommunityVideo_Team3.mp4` : 'My Bozoma (project)');
    // Preview window.
    const pw = 560, ph = 315, px = (CW - pw) / 2, py = 70;
    const at = video.head ?? 0;
    let acc = 0;
    const cur = video.clips.find((c) => (acc += c.len) > at) ?? null;
    g.fillStyle = '#000';
    g.fillRect(px, py, pw, ph);
    if (cur) {
      const c = CLIPS[cur.id];
      g.fillStyle = c.bg;
      g.fillRect(px, py, pw, ph);
      g.font = `150px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(c.icon, px + pw / 2, py + ph / 2 + 10);
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(px, py + ph - 40, pw, 40);
      g.fillStyle = '#fff';
      g.font = `bold 24px ${FONT}`;
      g.fillText(c.name, px + pw / 2, py + ph - 20);
    } else {
      g.fillStyle = '#B9B0C2';
      g.font = `26px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('Add clips to the timeline', px + pw / 2, py + ph / 2);
    }
    const total = videoLen();
    if (video.title && at < 4 && total) overlay(g, 'My Bozoma', px, py, pw, ph);
    if (video.credits && total && at >= total - 3 && video.head !== null) overlay(g, 'Made by Team 3', px, py, pw, ph);
    // Timeline: 0–40 seconds, with the 30-second limit marked.
    const tx0 = 150, tx1 = CW - 40, span = 40;
    const X = (t) => tx0 + ((tx1 - tx0) * Math.min(t, span)) / span;
    const rows = { Titles: 440, Video: 510, Music: 580 };
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.font = `bold 22px ${FONT}`;
    for (const [name, y] of Object.entries(rows)) {
      g.fillStyle = '#D9D3DE';
      g.fillText(name, 24, y + 25);
      g.fillStyle = '#2C2534';
      g.fillRect(tx0, y, tx1 - tx0, 50);
    }
    g.fillStyle = '#B9B0C2';
    g.font = `18px ${FONT}`;
    for (let t = 0; t <= span; t += 5) g.fillText(`${t}s`, X(t) - 10, 418);
    acc = 0;
    for (const c of video.clips) {
      const info = CLIPS[c.id];
      g.fillStyle = info.bg;
      g.fillRect(X(acc) + 2, rows.Video + 3, X(acc + c.len) - X(acc) - 4, 44);
      if (info.bad) { g.strokeStyle = '#FF3355'; g.lineWidth = 4; g.strokeRect(X(acc) + 3, rows.Video + 4, X(acc + c.len) - X(acc) - 6, 42); }
      g.fillStyle = '#fff';
      g.font = `bold 18px ${FONT}`;
      g.fillText(`${info.icon} ${c.len}s`, X(acc) + 8, rows.Video + 25, X(acc + c.len) - X(acc) - 12);
      acc += c.len;
    }
    if (total) {
      if (video.title) titleBlock(g, X(0), X(Math.min(4, total)), rows.Titles, 'My Bozoma');
      if (video.credits) titleBlock(g, X(Math.max(0, total - 3)), X(total), rows.Titles, 'Team 3');
      if (video.music !== 'none') {
        g.fillStyle = video.music === 'free' ? '#2E8B57' : '#CA1F3F';
        g.fillRect(X(0) + 2, rows.Music + 3, X(total) - X(0) - 4, 44);
        g.fillStyle = '#fff';
        g.font = `bold 18px ${FONT}`;
        g.fillText(video.music === 'free' ? '♪ Sunny Day (free library)' : '♪ Famous hit © — may be muted!', X(0) + 10, rows.Music + 25, X(total) - X(0) - 16);
      }
    }
    g.fillStyle = '#FF3355';
    g.fillRect(X(30) - 2, 400, 4, 240);
    g.font = `bold 18px ${FONT}`;
    g.fillText('30 s', X(30) + 6, 418);
    if (video.head !== null) {
      g.fillStyle = '#FFFFFF';
      g.fillRect(X(video.head) - 2, 430, 4, 210);
    }
    if (video.progress !== null) {
      g.fillStyle = 'rgba(20,16,26,0.85)';
      g.fillRect(340, 220, 600, 150);
      g.fillStyle = '#fff';
      g.font = `bold 28px ${FONT}`;
      g.textAlign = 'center';
      g.fillText(`Exporting… ${Math.round(video.progress * 100)}%`, CW / 2, 262);
      g.fillStyle = '#3B3346';
      g.fillRect(380, 300, 520, 30);
      g.fillStyle = '#FFBE00';
      g.fillRect(380, 300, 520 * video.progress, 30);
    }
    bar(g, `Total ${total} s ${total > 30 ? '⚠️ over 30 s!' : '(30 s or less)'} · ${video.clips.length} clips${video.exported ? ` · ✅ Exported ${video.exported.res}p, about ${video.exported.mb} MB` : ''}`, total > 30 ? '#FF8FA3' : '#FFFFFF');
  }
  function overlay(g, text, px, py, pw, ph) {
    g.fillStyle = 'rgba(36,24,46,0.7)';
    g.fillRect(px, py + ph / 2 - 45, pw, 90);
    g.fillStyle = '#FFBE00';
    g.font = `bold 52px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, px + pw / 2, py + ph / 2);
  }
  function titleBlock(g, a, b, y, text) {
    g.fillStyle = '#5A4470';
    g.fillRect(a + 2, y + 3, b - a - 4, 44);
    g.fillStyle = '#FFBE00';
    g.font = `bold 18px ${FONT}`;
    g.textAlign = 'left';
    g.fillText(`T ${text}`, a + 8, y + 25, b - a - 12);
  }

  function drawScreen() {
    const g = screenCanvas.getContext('2d');
    g.save();
    if (mode === 'photo') drawPhoto(g);
    else if (mode === 'voice') drawVoice(g);
    else drawVideo(g);
    g.restore();
    screenTex.needsUpdate = true;
  }

  // ---------- File size tower ----------
  let towerFrom = [1, 1];
  function towerValues() {
    if (mode === 'photo') return { before: 4, after: photoSize(), b: '4.0 MB', a: size(photoSize()), label: 'Photo' };
    if (mode === 'voice') {
      const kb = (voice.end - voice.start) * KB_PER_S;
      return { before: VOICE_LEN * KB_PER_S, after: kb, b: `${VOICE_LEN * KB_PER_S} KB`, a: `${Math.round(kb)} KB`, label: 'Voice note' };
    }
    const raw = Object.values(CLIPS).filter((c) => !c.bad).reduce((s, c) => s + c.len, 0) * RAW_MB_PER_S;
    const out = video.exported ? video.exported.mb : videoLen() * EXPORT[1080];
    return { before: raw, after: out, b: `${raw} MB raw`, a: `${video.exported ? '' : '≈ '}${Math.round(out)} MB`, label: 'Video' };
  }
  function updateTower() {
    const v = towerValues();
    const to = [1, Math.max(0.03, Math.min(1, v.after / v.before))];
    const from = towerFrom;
    towerFrom = to;
    setLabel(beforeTag, v.b);
    setLabel(afterTag, v.a, { bg: 'rgba(255,190,0,0.95)' });
    cards.size.set('File size', `${v.label}: ${v.b} → ${v.a}`);
    stage.tween((k) => {
      beforeCol.scale.y = MAX_H * (from[0] + (to[0] - from[0]) * k);
      afterCol.scale.y = MAX_H * (from[1] + (to[1] - from[1]) * k);
      beforeTag.position.set(-0.3, 0.08 + beforeCol.scale.y + 0.15, 0);
      afterTag.position.set(0.3, 0.08 + afterCol.scale.y + 0.15, 0);
      towerTop.position.set(-0.3, 0.08 + beforeCol.scale.y * 0.6, 0.16);
    }, 0.5);
  }

  // ---------- Side panel ----------
  const tabs = ui.group('Choose a job');
  const tabBtns = {
    photo: ui.button('🖼️ Photo', () => setMode('photo'), { group: tabs }),
    voice: ui.button('🎙️ Voice note', () => setMode('voice'), { group: tabs }),
    video: ui.button('🎬 Video', () => setMode('video'), { group: tabs }),
  };
  const pane = ui.element('<div></div>', ui.group()).firstElementChild;
  const B = (act, text, { arg = '', active = false, primary = false, title = '', small = false } = {}) => `<button type="button" class="lab-btn${active ? ' active' : ''}${primary ? ' primary' : ''}" data-act="${act}" data-arg="${esc(arg)}"${title ? ` title="${esc(title)}" aria-label="${esc(title)}"` : ''}${busy ? ' aria-disabled="true"' : ''} style="${small ? 'padding:3px 9px;font-size:12.5px;' : ''}${busy ? 'opacity:.5' : ''}">${text}</button>`;
  const T2 = (t) => `<div class="field-label">${t}</div>`;

  function renderPane() {
    const focus = document.activeElement?.closest?.('[data-act]');
    const key = focus && pane.contains(focus) ? [focus.dataset.act, focus.dataset.arg] : null;
    let h = '';
    if (mode === 'photo') {
      const [w, hh] = photoDims();
      h += `<p class="check ${photoSize() <= 0.5 ? 'good' : 'bad'}">📦 Original 4000 × 3000 · 4.0 MB → copy ${w} × ${hh} · <b>${size(photoSize())}</b></p>`;
      h += T2('1 · Rotate') + `<div class="btns-inline">${B('rot', '⟲ Rotate left', { arg: '-1' })}${B('rot', '⟳ Rotate right', { arg: '1' })}</div>`;
      h += T2('2 · Crop') + `<div class="btns-inline">${Object.entries(CROPS).map(([id, c]) => B('crop', c.name, { arg: id, active: photo.crop === id })).join('')}</div>`;
      h += T2('3 · Resize (width in pixels)') + `<div class="btns-inline">${WIDTHS.map((x) => B('width', x === 4000 ? 'Full size' : `${x} px`, { arg: String(x), active: photo.width === x })).join('')}</div>`;
      h += T2('4 · Compress (quality)') + `<div class="btns-inline">${Object.entries(QUALITY).map(([id, q]) => B('q', q.name, { arg: id, active: photo.q === id })).join('')}</div>`;
      h += T2('5 · Save') + `<div class="btns-inline">${B('save', '💾 Save as copy', { arg: 'copy', primary: true })}${B('save', 'Save (replace the original)', { arg: 'replace' })}</div>`;
      if (photo.saved === 'replace') h += `<div class="btns-inline">${B('undo', '↩ Undo: get the original back')}</div>`;
    } else if (mode === 'voice') {
      h += `<p class="check ${voice.trimmed ? 'good' : 'bad'}">⏱️ Keep ${voice.start.toFixed(1)} s → ${voice.end.toFixed(1)} s · ${(voice.end - voice.start).toFixed(1)} s long</p>`;
      h += `<label class="lab-field">✂️ New start: <b>${voice.start.toFixed(1)} s</b><input type="range" data-in="start" min="0" max="10" step="0.1" value="${voice.start}" aria-label="New start in seconds"></label>`;
      h += `<label class="lab-field">✂️ New end: <b>${voice.end.toFixed(1)} s</b><input type="range" data-in="end" min="11" max="${VOICE_LEN}" step="0.1" value="${voice.end}" aria-label="New end in seconds"></label>`;
      h += `<div class="btns-inline">${B('nudge', '◀ start', { arg: 's-', title: 'Start 0.1 s earlier' })}${B('nudge', 'start ▶', { arg: 's+', title: 'Start 0.1 s later' })}${B('nudge', '◀ end', { arg: 'e-', title: 'End 0.1 s earlier' })}${B('nudge', 'end ▶', { arg: 'e+', title: 'End 0.1 s later' })}</div>`;
      h += `<div class="btns-inline">${B('play', '▶ Play what is kept')}${B('trim', '✂️ Trim and save', { primary: true })}${B('vreset', '↺ Undo trim')}</div>`;
    } else {
      const total = videoLen();
      h += `<p class="check ${total && total <= 30 ? 'good' : 'bad'}">⏱️ Total <b>${total} s</b> ${total > 30 ? '(over 30 s: trim!)' : '(limit 30 s)'} · ${video.clips.length} clips</p>`;
      h += T2('1 · Add clips (storyboard order)') + `<div class="btns-inline">${Object.entries(CLIPS).filter(([id]) => !video.clips.some((c) => c.id === id)).map(([id, c]) => B('add', `+ ${c.icon} ${c.name} (${c.len} s)`, { arg: id })).join('') || '<span class="small-tip">All clips are on the timeline.</span>'}</div>`;
      if (video.clips.length) {
        h += T2('2 · Trim and order the timeline') + `<ol style="margin:0;padding:0;list-style:none;font-size:13px;display:grid;gap:4px">${video.clips.map((c, i) => `<li style="display:flex;align-items:center;gap:4px;${CLIPS[c.id].bad ? 'background:var(--red-tint);border-radius:8px;' : ''}"><span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i + 1}. ${CLIPS[c.id].icon} ${esc(CLIPS[c.id].name)} <b>${c.len} s</b></span>${B('len', '−1', { arg: `${i}:-1`, title: `Trim 1 second off ${CLIPS[c.id].name}`, small: true })}${B('five', '✂️ 5 s', { arg: String(i), title: `Trim ${CLIPS[c.id].name} to 5 seconds`, small: true })}${i ? B('up', '▲', { arg: String(i), title: `Move ${CLIPS[c.id].name} earlier`, small: true }) : ''}${B('del', '✕', { arg: String(i), title: `Remove ${CLIPS[c.id].name}`, small: true })}</li>`).join('')}</ol>`;
      }
      h += T2('3 · Titles and music') + `<div class="btns-inline">${B('title', `${video.title ? '✅' : '➕'} Title: “My Bozoma”`, { active: video.title })}${B('credits', `${video.credits ? '✅' : '➕'} Credits: “Made by Team 3”`, { active: video.credits })}</div>`;
      h += `<div class="btns-inline">${Object.entries(MUSIC).map(([id, m]) => B('music', m.name, { arg: id, active: video.music === id })).join('')}</div>`;
      h += T2('4 · Watch and export') + `<div class="btns-inline">${B('vplay', '▶ Preview')}${B('export', '📤 Export 720p', { arg: '720', primary: true })}${B('export', '📤 Export 1080p', { arg: '1080', primary: true })}</div>`;
    }
    pane.innerHTML = h;
    if (key) (pane.querySelector(`[data-act="${key[0]}"][data-arg="${CSS.escape(key[1])}"]`) ?? pane.querySelector('[data-act]'))?.focus();
  }

  function setMode(m) {
    if (busy) return;
    mode = m;
    ui.toggle(Object.values(tabBtns), tabBtns[m]);
    const tips = {
      photo: ['🖼️ Fix the market photo', '<p>Kofi’s photo of a tomato stall came out <b>sideways</b>, a stranger’s elbow is at the edge, and it is <b>4 MB</b>: too big for the club WhatsApp group.</p><p>Rotate it, crop it, resize and compress it, then <b>Save as copy</b>. Watch the file size tower!</p>'],
      voice: ['🎙️ Trim the voice note', '<p>Ama recorded her 15-second introduction, but it starts with <i>“Erm… is it on?”</i> and ends with a cough.</p><p>Move the gold handles so only the speech is kept, press <b>▶ Play</b> to check, then <b>Trim and save</b>.</p>'],
      video: ['🎬 Cut the community video', '<p>Six shots of 5 seconds make 30 seconds. Add the clips in <b>storyboard order</b>, trim each to about 5 s, add a title and credits, choose music you are <b>allowed</b> to use, then export.</p><p>⚠️ Check every clip: no faces or uniforms without permission.</p>'],
    };
    ui.info(...tips[m]);
    renderPane();
    drawScreen();
    updateTower();
  }

  function setBusy(on) {
    busy = on;
    for (const b of [...Object.values(tabBtns), ...pane.querySelectorAll('button, input')]) {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.5' : '';
    }
  }

  pane.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || busy) return;
    act(b.dataset.act, b.dataset.arg);
  });
  pane.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.dataset.in || busy) return;
    const v = Number(t.value);
    if (t.dataset.in === 'start') voice.start = Math.min(v, voice.end - 1);
    else voice.end = Math.max(v, voice.start + 1);
    voice.trimmed = false;
    t.previousElementSibling && (t.previousElementSibling.textContent = `${v.toFixed(1)} s`);
    drawScreen();
    updateTower();
  });
  pane.addEventListener('change', (e) => {
    if (e.target.dataset.in) renderPane();
  });

  function act(a, arg) {
    // ----- Photo -----
    if (a === 'rot') {
      photo.turn = (photo.turn + Number(arg) + 4) % 4;
      photo.saved = null;
      ui.info(photo.turn ? '⟳ Still not upright' : '✅ Standing up straight', photo.turn
        ? '<p>Keep turning until the stall stands up the right way.</p>'
        : '<p>Rotating turns the picture so it stands up straight. It does not change the file size, because no pixels are thrown away.</p><p>Next: <b>crop</b> out the stranger’s elbow.</p>');
    } else if (a === 'crop') {
      photo.crop = arg;
      photo.saved = null;
      ui.info(arg === 'whole' ? '🖼️ Back to the whole photo' : '✂️ Cropped', arg === 'whole'
        ? '<p>The stranger’s elbow is back at the edge. Cropping cuts away the edges you don’t want.</p>'
        : `<p>Cropping <b>cuts away the edges</b>: the elbow is gone and the picture shows less.${arg === 'thirds' ? ' The tomatoes now sit on a crossing point of the rule-of-thirds grid.' : ''}</p><p>Fewer pixels are left, so the file got a bit smaller: <b>${size(photoSize())}</b>. Next: <b>resize</b> it.</p>`);
    } else if (a === 'width') {
      photo.width = Number(arg);
      photo.saved = null;
      const [w, h] = photoDims();
      ui.info(`📐 Resized to ${w} × ${h}`, photo.width === 4000
        ? '<p>Full size: perfect for printing a big poster, but too heavy for WhatsApp.</p>'
        : `<p>Resizing makes the <b>whole</b> picture fewer pixels wide and high. It shows the same thing, just smaller. ${photo.width === 1600 ? '1600 pixels wide still looks sharp on any phone.' : '800 pixels is fine for a tiny thumbnail, but it looks soft on a big screen.'}</p><p>Size now: <b>${size(photoSize())}</b>. Next: <b>compress</b> it.</p>`);
    } else if (a === 'q') {
      photo.q = arg;
      photo.saved = null;
      ui.info(`🗜️ Quality: ${QUALITY[arg].name}`, {
        high: '<p>High quality keeps every detail, so the file stays big.</p>',
        medium: `<p>Compressing squeezes the file by throwing away detail your eyes hardly notice. <b>${size(photoSize())}</b> and it still looks fine on a phone!</p>`,
        low: `<p>Tiny file (<b>${size(photoSize())}</b>), but look: the photo has gone <b>blocky</b>. Too much squeezing spoils it. Medium is usually the sweet spot.</p>`,
      }[arg]);
    } else if (a === 'save') {
      photo.saved = arg;
      const mb = photoSize();
      if (arg === 'replace') {
        ui.info('⚠️ The original is gone!', '<p>“Save” wrote over the original 4 MB photo. Now you can never print it big or crop it differently. A real editor never throws away the raw ingredients.</p><p>Press <b>Undo</b>, then use <b>Save as copy</b>.</p>');
      } else {
        const problems = [];
        if (photo.turn) problems.push('it is still <b>sideways</b>');
        if (photo.crop === 'whole') problems.push('the stranger’s elbow is still in it (<b>crop</b> it)');
        if (photo.q === 'high') problems.push('it is not <b>compressed</b> yet (choose Medium quality)');
        if (mb > 0.5) problems.push(`at <b>${size(mb)}</b> it is still big for WhatsApp (resize to 1600 px and compress to Medium)`);
        if (problems.length) {
          ui.info('💾 Saved a copy, but…', `<p>The original is safe. Good! But ${problems.join(', and ')}.</p>`);
        } else {
          const [w, h] = photoDims();
          const n = Math.round(4 / mb);
          ui.info('✅ Saved as copy', `<p><b>Market_photo_copy.jpg</b>: ${w} × ${h} pixels, <b>${size(mb)}</b>. The 4 MB original is still safe.</p><p>Remember Session 6: 1 MB is about 1,000 KB. So your copy is about <b>${n} times smaller</b>. 25 photos: 25 × 4 MB = 100 MB, but 25 × ${size(mb)} ≈ ${Math.round(25 * mb)} MB. That saves a lot of data!</p>${photo.q === 'low' ? '<p>💡 It is a bit blocky, though. Medium quality looks better.</p>' : ''}`);
          ui.complete('photo');
          stage.reveal();
        }
      }
    } else if (a === 'undo') {
      photo.saved = null;
      ui.info('↩ Original restored', '<p>Phew. This time use <b>Save as copy</b>, so the original stays safe.</p>');
    }
    // ----- Voice -----
    else if (a === 'nudge') {
      const d = arg.endsWith('+') ? 0.1 : -0.1;
      if (arg[0] === 's') voice.start = Math.round(Math.max(0, Math.min(voice.end - 1, voice.start + d)) * 10) / 10;
      else voice.end = Math.round(Math.min(VOICE_LEN, Math.max(voice.start + 1, voice.end + d)) * 10) / 10;
      voice.trimmed = false;
    } else if (a === 'play') {
      playVoice();
      return;
    } else if (a === 'trim') {
      const issues = [];
      if (voice.start < 2.2) issues.push('it still starts with <i>“Erm… is it on?”</i> (move the start later)');
      if (voice.start > SPEECH_START + 1e-6) issues.push('you cut off the start of <i>“Welcome to Bozoma!”</i> (move the start earlier)');
      if (voice.end > 18.4 + 1e-6) issues.push('it still ends with a cough and <i>“…was that okay?”</i> (move the end earlier)');
      if (voice.end < SPEECH_END - 1e-6) issues.push('you cut off the end of <i>“Come and see them with us!”</i> (move the end later)');
      if (issues.length) {
        ui.info('✂️ Not quite yet', `<p>Listen again: ${issues.join('; and ')}.</p><p>Press <b>▶ Play</b> to hear exactly what is kept.</p>`);
      } else {
        voice.trimmed = true;
        const len = voice.end - voice.start;
        ui.info('✅ Voice note trimmed', `<p>Only the speech is left: <b>${len.toFixed(1)} s</b> instead of ${VOICE_LEN} s. Nobody hears “Erm… is it on?” any more.</p><p>The file is smaller too: <b>${Math.round(len * KB_PER_S)} KB</b> instead of ${VOICE_LEN * KB_PER_S} KB, because there are fewer seconds of sound to store.</p>`);
        ui.complete('voice');
        stage.reveal();
      }
    } else if (a === 'vreset') {
      Object.assign(voice, { start: 0, end: VOICE_LEN, trimmed: false });
    }
    // ----- Video -----
    else if (a === 'add') {
      video.clips.push({ id: arg, len: CLIPS[arg].len });
      video.exported = null;
      ui.info(CLIPS[arg].bad ? '⚠️ Wait: faces and uniforms!' : `🎞️ Added: ${CLIPS[arg].name}`, CLIPS[arg].bad
        ? '<p>This clip shows classmates’ <b>faces</b> in their <b>school uniforms</b>. Did they (and their parents) say yes? A uniform shows exactly which school they go to. Remove it (✕) and film places, hands and objects instead.</p>'
        : `<p>Clips straight from the phone are a little long (${CLIPS[arg].len} s), which makes trimming easy. Press <b>✂️ 5 s</b> to trim it.</p>`);
    } else if (a === 'len' || a === 'five') {
      const [i, d] = a === 'five' ? [Number(arg), null] : arg.split(':').map(Number);
      const c = video.clips[i];
      c.len = d === null ? 5 : Math.max(3, c.len + d);
      video.exported = null;
      ui.info(`✂️ ${CLIPS[c.id].name}: ${c.len} s`, `<p>Trimming drags in the edge of a clip to cut off the wobbly start or end. Total now: <b>${videoLen()} s</b>${videoLen() > 30 ? ', still over 30 s' : ''}.</p>`);
    } else if (a === 'up') {
      const i = Number(arg);
      [video.clips[i - 1], video.clips[i]] = [video.clips[i], video.clips[i - 1]];
      video.exported = null;
    } else if (a === 'del') {
      const [c] = video.clips.splice(Number(arg), 1);
      video.exported = null;
      ui.info(`✕ Removed: ${CLIPS[c.id].name}`, CLIPS[c.id].bad ? '<p>Good call. No faces or uniforms without permission: the video tells the story just as well without them.</p>' : '<p>Removed from the timeline. You can add it again.</p>');
    } else if (a === 'title') {
      video.title = !video.title;
      video.exported = null;
    } else if (a === 'credits') {
      video.credits = !video.credits;
      video.exported = null;
    } else if (a === 'music') {
      video.music = arg;
      video.exported = null;
      ui.info(MUSIC[arg].name, {
        none: '<p>No music. A little quiet music (quieter than the voices) makes a video feel finished.</p>',
        free: '<p>Music from the editor’s own <b>free library</b> is free to use in your videos. Keep it quieter than the voices.</p>',
        hit: '<p>Popular songs are protected by <b>copyright</b>, just like the pictures in Session 27. Videos with someone else’s song may be <b>muted or taken down</b>. Choose free music instead.</p>',
      }[arg]);
    } else if (a === 'vplay') {
      playVideo();
      return;
    } else if (a === 'export') {
      exportVideo(Number(arg));
      return;
    }
    renderPane();
    drawScreen();
    updateTower();
  }

  async function playVoice() {
    setBusy(true);
    const from = voice.start, to = voice.end;
    micLed.material.emissiveIntensity = 0;
    await play((k) => {
      voice.head = from + (to - from) * k;
      const s = SEGMENTS.find((x) => voice.head >= x.from && voice.head < x.to);
      const loud = s && s.kind !== 'quiet' ? 1 : 0;
      cone.scale.setScalar(1 + loud * 0.15 * Math.abs(Math.sin(k * 200)));
      drawScreen();
    }, (to - from) / 3);
    voice.head = null;
    cone.scale.setScalar(1);
    drawScreen();
    const heard = [];
    if (from < 2.2) heard.push('🙈 It starts with “Erm… is it on?”');
    if (from > SPEECH_START + 1e-6) heard.push('✂️ “Welcome to Bozoma!” is cut short');
    if (to < SPEECH_END - 1e-6) heard.push('✂️ The last words are cut off');
    if (to > 18.4 + 1e-6) heard.push('🙈 It ends with a cough');
    ui.info('🔊 Played (3× speed)', heard.length ? `<ul>${heard.map((x) => `<li>${x}</li>`).join('')}</ul><p>Move the handles and play it again.</p>` : '<p>👍 Clean: only the speech. Press <b>Trim and save</b>.</p>');
    setBusy(false);
  }

  async function playVideo() {
    const total = videoLen();
    if (!total) {
      ui.info('🎬 Nothing to play', '<p>Add some clips to the timeline first.</p>');
      return;
    }
    setBusy(true);
    stage.reveal();
    await play((k) => {
      video.head = total * k;
      drawScreen();
    }, Math.min(6, total / 5));
    video.head = null;
    drawScreen();
    setBusy(false);
  }

  function videoProblems() {
    const p = [];
    const ids = video.clips.map((c) => c.id);
    if (ids.includes('friends')) p.push('🧑🏾‍🤝‍🧑🏾 A clip shows classmates’ faces in school uniform. Remove it: no faces or uniforms without permission.');
    const good = ids.filter((id) => id !== 'friends');
    if (good.length < 5) p.push(`🎞️ Only ${good.length} clip${good.length === 1 ? '' : 's'}. Use at least 5 of the 6 storyboard shots.`);
    const order = good.map((id) => STORY.indexOf(id));
    if (order.some((v, i) => i && v < order[i - 1])) p.push('📋 The clips are not in storyboard order (market, school, river, chop bar, Hub, sunset). Use ▲ to move one earlier.');
    if (videoLen() > 30) p.push(`⏱️ It is ${videoLen()} s long. Trim the clips until it is 30 seconds or less.`);
    if (!video.title) p.push('🔤 Add the title “My Bozoma” at the start.');
    if (!video.credits) p.push('🔤 Add the credits “Made by Team 3” at the end.');
    if (video.music === 'hit') p.push('🎵 That famous song is copyright: the video may be muted or taken down. Choose the free library music.');
    if (video.music === 'none') p.push('🎵 Add quiet music from the editor’s free library.');
    return p;
  }

  async function exportVideo(res) {
    const total = videoLen();
    if (!total) {
      ui.info('📤 Nothing to export', '<p>Add clips to the timeline first.</p>');
      return;
    }
    const problems = videoProblems();
    if (problems.length) {
      ui.info('📤 Not ready to export yet', `<p>A good editor checks before exporting:</p><ul>${problems.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
      return;
    }
    setBusy(true);
    stage.reveal();
    await play((k) => {
      video.progress = k;
      drawScreen();
    }, 1.8);
    video.progress = null;
    const mb = Math.round(total * EXPORT[res]);
    video.exported = { res, mb };
    drawScreen();
    updateTower();
    renderPane();
    setBusy(false);
    ui.info(`✅ Exported at ${res}p`, `<p><b>TechClub_MyCommunityVideo_Team3.mp4</b>: ${total} seconds, about <b>${mb} MB</b>. The raw clips from the phone were about ${towerValues().b.replace(' raw', '')}.</p><p>${res === 720 ? '720p is smaller, which is kind to a small data bundle.' : '1080p is sharper on a big screen, but bigger to send. 720p would be about ' + Math.round(total * EXPORT[720]) + ' MB.'}</p><p>Ready for Premiere Time! 🍿</p>`);
    ui.complete('video');
    // A little clap of the clapperboard.
    stage.tween((k) => (stick.rotation.x = -0.35 * (1 - Math.sin(k * Math.PI))), 0.4);
  }

  // Clicking parts of the desk opens the matching job.
  stage.clickable(phone, () => setMode('photo'));
  stage.clickable(fBack, () => setMode('photo'));
  stage.clickable(mic, () => setMode('voice'));
  stage.clickable(speaker, () => setMode('voice'));
  stage.clickable(clap, () => setMode('video'));
  stage.clickable(cork, () => setMode('video'));

  stage.onTick((dt, t) => {
    micLed.material.emissiveIntensity = mode === 'voice' ? 0.5 + Math.abs(Math.sin(t * 3)) * 0.8 : 0.1;
  });

  setMode('photo');
}

// A market stall photo: striped awning, tomato piles, a sign, and a
// stranger's elbow poking in at the left edge (to be cropped out).
function drawMarket(g, W, H, elbow = false) {
  const s = W / 800;
  g.save();
  g.scale(s, H / 600);
  const sky = g.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#8EC9F0');
  sky.addColorStop(1, '#DDEFF8');
  g.fillStyle = sky;
  g.fillRect(0, 0, 800, 600);
  g.fillStyle = '#C9A27A';
  g.fillRect(0, 380, 800, 220);
  // Awning stripes.
  for (let i = 0; i < 10; i++) {
    g.fillStyle = ['#CA1F3F', '#FFBE00', '#2E8B57'][i % 3];
    g.beginPath();
    g.moveTo(150 + i * 55, 90); g.lineTo(205 + i * 55, 90); g.lineTo(215 + i * 58, 170); g.lineTo(150 + i * 58, 170);
    g.fill();
  }
  g.fillStyle = '#6B4A2E';
  g.fillRect(160, 170, 14, 260);
  g.fillRect(712, 170, 14, 260);
  // Table and produce.
  g.fillStyle = '#8A6A4A';
  g.fillRect(150, 410, 590, 30);
  g.fillRect(170, 440, 20, 120);
  g.fillRect(700, 440, 20, 120);
  const pile = (cx, cy, col, r = 22) => {
    for (let row = 0; row < 3; row++) for (let k = 0; k <= 2 - row; k++) {
      g.fillStyle = col;
      g.beginPath(); g.arc(cx + (k - (2 - row) / 2) * r * 1.9, cy - row * r * 1.5, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.beginPath(); g.arc(cx + (k - (2 - row) / 2) * r * 1.9 - r * 0.35, cy - row * r * 1.5 - r * 0.35, r * 0.3, 0, Math.PI * 2); g.fill();
    }
  };
  // The best tomatoes sit on a rule-of-thirds crossing of the 4:3 crop.
  pile(380, 388, '#D62828', 26);
  pile(530, 392, '#E85D04', 20);
  pile(650, 392, '#C9B8D9', 18);
  // Sign.
  g.fillStyle = '#FFFFFF';
  g.fillRect(420, 200, 260, 80);
  g.strokeStyle = '#24182E';
  g.lineWidth = 4;
  g.strokeRect(420, 200, 260, 80);
  g.fillStyle = '#24182E';
  g.font = `bold 30px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('FRESH TOMATOES', 550, 228);
  g.font = `bold 24px ${FONT}`;
  g.fillText('GH₵10 a bowl', 550, 262);
  if (elbow) {
    // A stranger's elbow and sleeve at the left edge.
    g.fillStyle = '#3A6EA5';
    g.beginPath(); g.ellipse(30, 330, 90, 60, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7A4B2A';
    g.beginPath(); g.ellipse(110, 300, 55, 38, -0.3, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

export const config = { camera: [3.2, 6.4, 11], target: [0, 2.3, 0], shadowSize: 7, frame: 0.66 };

export const missions = [
  { id: 'photo', text: 'Fix the market photo: rotate, crop, resize and compress it to under 500 KB, then Save as copy.', hint: 'Rotate right, crop 4:3, resize to 1600 px, choose Medium quality, then press "Save as copy". Watch the file size tower.' },
  { id: 'voice', text: 'Trim the voice note so only the speech is left: no “Erm… is it on?” at the start, no cough at the end.', hint: 'Open "Voice note". Move the start to about 2.5 s and the end to about 18 s, press Play to check, then "Trim and save".' },
  { id: 'video', text: 'Cut a video of 30 seconds or less: clips in storyboard order, a title, credits and free music. Then export it.', hint: 'Open "Video". Add the clips in storyboard order (skip the uniform clip!), trim each to 5 s, add the title, credits and free library music, then Export.' },
];
