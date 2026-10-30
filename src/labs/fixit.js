// Session 9 — Fix-It Workshop: a computer with faults, fixed with the
// R-C-S-A habit ("Really Calm Students Ask"): Restart, Cables & power, Settings, Ask.
// 1. Fix 3 faults using R-C-S-A.
// 2. Fix one fault without skipping a step.
// 3. Write a clear help request (the 4 parts) for a fault you can't fix.
import { THREE, COLORS, rbox, mat, decal, cable, label, setLabel } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STEPS = {
  R: { word: 'Restart', icon: '🔄', what: 'Close and reopen the app, or restart the PC (save first if you can!)' },
  C: { word: 'Cables & power', icon: '🔌', what: 'Plugged in firmly, switched on, charged, in the right port?' },
  S: { word: 'Settings', icon: '⚙️', what: 'Muted? Wi-Fi off? Wrong printer, display mode or keyboard layout?' },
  A: { word: 'Ask', icon: '🙋', what: 'Still stuck? Ask a mentor and describe the problem clearly.' },
};
const ORDER = ['R', 'C', 'S', 'A'];

// Each fault: the symptom, what each step finds, and which step fixes it.
const FAULTS = [
  {
    id: 'sound', icon: '🔇', name: 'No sound', who: 'Ama', says: 'The video plays, but I hear nothing.', cause: 'S',
    R: 'You closed and reopened the video. Tested again: <b>still no sound</b>.',
    C: 'The headset is plugged in firmly, in the <b>green</b> jack, and switched on. ✓ Not the problem.',
    S: 'The speaker icon on the taskbar shows <b>🔇 muted</b>! That is the cause.',
    fixes: [['🔊 Unmute and turn the volume up', true], ['✈️ Turn Airplane mode off', false], ['🔠 Press Caps Lock', false]],
    log: 'Unmuted the sound in the taskbar',
  },
  {
    id: 'internet', icon: '🌐', name: 'No internet', who: 'Kofi', says: 'No websites will open. The network icon shows a globe.', cause: 'C',
    R: 'You closed and reopened the browser. Tested again: <b>still no internet</b>.',
    C: 'The router lights are on, but the <b>Ethernet cable has come out of the PC</b>! That is the cause.',
    S: 'Wi-Fi and Airplane mode look fine.',
    fixes: [['🔌 Click the Ethernet cable back into the PC', true], ['🖨️ Load paper in the printer', false], ['🔊 Unmute the sound', false]],
    log: 'Clicked the Ethernet cable back in',
  },
  {
    id: 'frozen', icon: '🧊', name: 'Frozen app', who: 'Esi', says: 'Paint says "Not responding" and nothing moves.', cause: 'R',
    R: 'Restart starts small: close the frozen app. Which way?',
    C: 'Cables are fine.',
    S: 'Settings are fine.',
    fixes: [['⌨️ Ctrl + Shift + Esc → Task Manager → End task, then reopen Paint', true], ['🔌 Unplug the monitor', false], ['📶 Turn Wi-Fi off', false]],
    log: 'Ended Paint in Task Manager and reopened it',
  },
  {
    id: 'drive', icon: '📦', name: 'Full drive', who: 'Yaw', says: 'The C: bar is red: 1.2 GB free. Updates will not install.', cause: 'S',
    R: 'You restarted the PC. Tested again: <b>the bar is still red</b>. A restart cannot make space.',
    C: 'This is not about cables: the cables are all fine.',
    S: 'This PC → Local Disk (C:) is nearly full: lots of old videos in the <b>Recycle Bin</b> and temporary files. That is the cause.',
    fixes: [['🗑️ Empty the Recycle Bin and remove temporary files', true], ['📂 Open more programmes', false], ['⌨️ Change the keyboard layout', false]],
    log: 'Emptied the Recycle Bin, removed temporary files',
  },
  {
    id: 'caps', icon: '🔠', name: 'CAPITALS', who: 'Naa', says: 'Everything I type comes out in CAPITALS.', cause: 'S',
    R: 'You closed and reopened Notepad. Tested again: <b>STILL CAPITALS</b>.',
    C: 'The keyboard cable is in firmly. ✓ Not the problem.',
    S: 'The <b>Caps Lock</b> light on the keyboard is on! That is the cause.',
    fixes: [['🔠 Press Caps Lock once', true], ['⊞ Press Windows + P', false], ['🛒 Buy a new keyboard', false]],
    log: 'Pressed Caps Lock once',
  },
  {
    id: 'power', icon: '🔌', name: 'Won\'t turn on', who: 'Selasi', says: 'The computer will not turn on. No lights at all.', cause: 'C', skipR: true,
    R: 'You cannot restart a computer that will not start! <b>"It won\'t turn on" skips straight to C.</b>',
    C: 'Follow the power: wall socket → <b>power strip (its light is off!)</b> → system unit. Someone switched the power strip off.',
    S: 'You cannot check settings on a computer that is off.',
    fixes: [['🧑🏾‍🏫 Ask an adult to switch the power strip on', true], ['🪛 Open the case and look inside', false], ['🔠 Press Caps Lock', false]],
    log: 'An adult switched the power strip on',
  },
  {
    id: 'printer', icon: '🖨️', name: 'Printer error', who: 'Kwabena', says: 'I clicked Print. Nothing came out and the printer light is orange.', cause: 'A',
    R: 'You closed and reopened Word and printed again. Tested: <b>still nothing</b>, light still orange.',
    C: 'The printer is on, the cable is in, there is paper in the tray. But the screen says <b>paper jam</b>. Never pull jammed paper out yourself!',
    S: 'The right printer is chosen. The print queue says: <b>Error: paper jam (0x0000)</b>.',
    fixes: [],
    log: 'Asked the mentor with a clear help request',
  },
];
const HELP = [
  { part: '1. What I did', opts: [['"I clicked Print in Word, for page 1 of my letter."', true], ['"It\'s spoilt!"', false], ['"I did nothing."', false]] },
  { part: '2. What I see', opts: [['"It\'s not working."', false], ['"Nothing came out, and the printer light is orange."', true], ['"The printer is bad."', false]] },
  { part: '3. The error', opts: [['"Some error came."', false], ['"I closed it without reading it."', false], ['"It says: Error: paper jam (0x0000)." + a screenshot', true]] },
  { part: '4. What I tried', opts: [['"I restarted Word, checked the power, cable and paper, and the printer chosen."', true], ['"Nothing."', false], ['"I pulled the jammed paper out hard."', false]] },
];

const rgeo = (w, h, d, r) => {
  const m = rbox(w, h, d, 0, r);
  m.material.dispose();
  return m.geometry;
};
const shadow = (o) => o.traverse((m) => m.isMesh && (m.castShadow = m.receiveShadow = true));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function fit(g, text, weight, size, maxW) {
  let px = size;
  do g.font = `${weight} ${px}px ${FONT}`;
  while (g.measureText(text).width > maxW && (px -= 1) > 8);
}

export default function fixitLab(stage, ui) {
  const { scene } = stage;
  const T = 1.6;

  // ---------- Desk and back wall ----------
  const desk = rbox(9.2, 0.26, 4.2, 0xc8a27a, 0.05);
  desk.position.set(0, T - 0.13, 0.4);
  scene.add(desk);
  const legGeo = rgeo(0.24, T - 0.26, 0.24, 0.03);
  const legMat = mat(0x8a6a4a);
  for (const x of [-4.35, 4.35]) for (const z of [-1.4, 2.2]) {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.set(x, (T - 0.26) / 2, z);
    scene.add(l);
  }
  const wall = rbox(10, 6.4, 0.16, 0xf4ead8, 0.04);
  wall.position.set(0, 3.2, -2.1);
  scene.add(wall);

  // ---------- The R-C-S-A poster ----------
  const poster = new THREE.Group();
  poster.position.set(-0.3, 5.15, -1.98);
  scene.add(poster);
  const pBack = rbox(7.6, 1.95, 0.08, COLORS.purple, 0.06);
  poster.add(pBack);
  const pTitle = decal(7.2, 0.36, (g, W, H) => {
    g.fillStyle = '#ffbe00';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fit(g, 'THE FIX-IT HABIT: "Really Calm Students Ask"', 700, H * 0.62, W * 0.95);
    g.fillText('THE FIX-IT HABIT: "Really Calm Students Ask"', W / 2, H * 0.55);
  }, { px: 64 });
  pTitle.position.set(0, 0.72, 0.045);
  poster.add(pTitle);
  const stepTiles = {}, stepTags = {};
  const tileGeo = rgeo(1.62, 1.2, 0.12, 0.08);
  ORDER.forEach((k, i) => {
    const t = new THREE.Mesh(tileGeo, mat(0xffffff, { roughness: 0.5 }));
    t.position.set(-2.7 + i * 1.8, -0.18, 0.08);
    const face = decal(1.5, 1.1, (g, W, H) => {
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = ['#ca1f3f', '#ffbe00', '#2a9d8f', '#5a4470'][i];
      g.beginPath(); g.arc(W * 0.2, H * 0.32, H * 0.22, 0, 7); g.fill();
      g.fillStyle = '#ffffff';
      g.font = `700 ${H * 0.3}px ${FONT}`;
      g.fillText(k, W * 0.2, H * 0.34);
      g.fillStyle = '#24182e';
      g.textAlign = 'left';
      fit(g, STEPS[k].word.toUpperCase(), 700, H * 0.16, W * 0.58);
      g.fillText(STEPS[k].word.toUpperCase(), W * 0.4, H * 0.32);
      g.font = `400 ${H * 0.1}px ${FONT}`;
      g.textAlign = 'center';
      const sub = { R: ['close & reopen,', 'or restart'], C: ['plugged in? on?', 'right port?'], S: ['muted? Wi-Fi off?', 'wrong setting?'], A: ['ask a mentor,', 'describe it clearly'] }[k];
      sub.forEach((s, j) => g.fillText(s, W / 2, H * (0.68 + j * 0.15)));
    }, { px: 128 });
    face.position.z = 0.062;
    t.add(face);
    poster.add(t);
    stepTiles[k] = t;
    const tag = label('', { scale: 0.45, bg: '#FFFFFF' });
    tag.position.set(0, -0.78, 0.1);
    t.add(tag);
    stepTags[k] = tag;
  });
  shadow(poster);

  // ---------- Monitor ----------
  const monitor = new THREE.Group();
  monitor.position.set(-0.9, T, -1.0);
  scene.add(monitor);
  const MW = 3.6, MH = 2.1;
  const mPanel = rbox(MW + 0.16, MH + 0.24, 0.12, 0x2a2232, 0.05);
  mPanel.position.y = 1.7;
  const mNeck = rbox(0.3, 0.9, 0.12, 0x3a3344, 0.04);
  mNeck.position.set(0, 0.5, -0.12);
  const mFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.74, 0.06, 32), mat(0x3a3344));
  mFoot.scale.z = 0.6;
  mFoot.position.set(0, 0.03, -0.1);
  const screen = decal(MW, MH, () => {}, { px: 360, transparent: false });
  screen.position.set(0, 1.72, 0.062);
  const monLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0x555566, { emissive: 0x000000 }));
  monLed.position.set(MW / 2 - 0.1, 0.62, 0.07);
  monitor.add(mPanel, mNeck, mFoot, screen, monLed);
  shadow(monitor);

  // ---------- System unit ----------
  const tower = new THREE.Group();
  tower.position.set(2.0, T, -0.9);
  scene.add(tower);
  const tShell = rbox(1.1, 2.4, 2.0, 0x4a3d58, 0.05);
  tShell.position.y = 1.2;
  const tFront = decal(1.0, 2.3, (g, W, H) => {
    g.fillStyle = '#2b2233';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#ffbe00';
    g.lineWidth = W * 0.05;
    g.beginPath(); g.arc(W / 2, H * 0.1, W * 0.13, -1.1, Math.PI + 1.1); g.stroke();
    g.fillStyle = '#3d3348';
    for (let i = 0; i < 14; i++) g.fillRect(W * 0.2, H * (0.3 + i * 0.045), W * 0.6, H * 0.015);
    // front audio jacks and USB
    g.fillStyle = '#2ec4b6'; g.beginPath(); g.arc(W * 0.35, H * 0.2, W * 0.05, 0, 7); g.fill();
    g.fillStyle = '#ff7eb6'; g.beginPath(); g.arc(W * 0.65, H * 0.2, W * 0.05, 0, 7); g.fill();
  }, { px: 128, transparent: false });
  tFront.position.set(0, 1.2, 1.006);
  const tLed = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(0x555566, { emissive: 0x000000 }));
  tLed.position.set(0.3, 2.15, 1.02);
  tower.add(tShell, tFront, tLed);
  shadow(tower);

  // ---------- Keyboard, mouse, headset ----------
  const keyboard = new THREE.Group();
  keyboard.position.set(-0.9, T, 0.65);
  const kBody = rbox(2.9, 0.12, 0.95, 0x2a2232, 0.04);
  kBody.position.y = 0.06;
  const keys = decal(2.8, 0.85, (g, W, H) => {
    g.fillStyle = '#2a2232';
    g.fillRect(0, 0, W, H);
    const kw = W / 15.5;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) {
      if (r === 4 && c > 3 && c < 10) continue;
      g.fillStyle = r === 2 && c === 0 ? '#ffe9a8' : '#f4f0f6';
      g.beginPath(); g.roundRect(c * kw + kw * 0.3, r * (H / 5) + 3, kw * 0.85, H / 5 - 6, 4); g.fill();
    }
    g.fillStyle = '#f4f0f6';
    g.beginPath(); g.roundRect(4 * kw + kw * 0.3, 4 * (H / 5) + 3, kw * 5.85, H / 5 - 6, 4); g.fill();
    g.fillStyle = '#24182e';
    g.font = `600 ${H * 0.09}px ${FONT}`;
    g.fillText('Caps', kw * 0.38, 2.5 * (H / 5));
  }, { px: 128 });
  keys.rotation.x = -Math.PI / 2;
  keys.position.y = 0.125;
  const capsLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0x555566, { emissive: 0x000000 }));
  capsLed.position.set(1.25, 0.13, -0.4);
  keyboard.add(kBody, keys, capsLed);
  scene.add(keyboard);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), mat(0x2a2232, { roughness: 0.4 }));
  mouse.scale.set(0.75, 0.42, 1.1);
  mouse.position.set(1.1, T + 0.09, 0.75);
  scene.add(mouse);
  const headset = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 24, Math.PI), mat(COLORS.green));
  band.position.y = 0.4;
  headset.add(band);
  for (const x of [-0.4, 0.4]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 18), mat(0x24182e));
    cup.rotation.z = Math.PI / 2;
    cup.position.set(x, 0.2, 0);
    headset.add(cup);
  }
  shadow(headset);
  headset.position.set(1.0, T + 0.01, -0.1);
  headset.rotation.y = -0.3;
  scene.add(headset);
  scene.add(cable([[1.38, T + 0.2, -0.2], [1.5, T + 0.03, 0.15], [1.75, T + 0.03, 0.3], [1.85, T + 0.4, 0.2], [1.85, T + 1.95, 0.11]], 0x24182e, 0.03));
  const soundTag = label('', { scale: 0.5 });
  soundTag.position.set(0, 0.95, 0);
  headset.add(soundTag);

  // ---------- Router with the Ethernet cable ----------
  const router = new THREE.Group();
  const rBody = rbox(1.1, 0.24, 0.7, 0xf4f0f6, 0.06);
  rBody.position.y = 0.12;
  router.add(rBody);
  for (const x of [-0.4, 0.4]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.7, 8), mat(0x24182e));
    a.position.set(x, 0.55, -0.3);
    router.add(a);
  }
  const rLeds = [0, 1, 2, 3].map((i) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0x2ec4b6, { emissive: 0x2ec4b6, emissiveIntensity: 0.8 }));
    l.position.set(-0.3 + i * 0.2, 0.2, 0.35);
    router.add(l);
    return l;
  });
  shadow(router);
  router.position.set(3.7, T, -1.2);
  scene.add(router);
  const ethIn = [[3.9, T + 0.12, -0.85], [3.6, T + 0.03, -0.3], [2.9, T + 0.03, 0.0], [2.6, T + 0.6, 0.15]];
  const ethPlugged = [...ethIn, [2.56, T + 0.9, 0.11]];
  const ethLoose = [[3.9, T + 0.12, -0.85], [3.6, T + 0.03, -0.3], [3.1, T + 0.03, 0.2], [2.8, T + 0.04, 0.45]];
  let ethCable = null;
  function drawEth(plugged) {
    if (ethCable) { scene.remove(ethCable); ethCable.geometry.dispose(); }
    ethCable = cable(plugged ? ethPlugged : ethLoose, COLORS.gold, 0.04);
    scene.add(ethCable);
  }

  // ---------- Printer ----------
  const printer = new THREE.Group();
  printer.position.set(-3.55, T, -0.6);
  printer.rotation.y = 0.35;
  const prBody = rbox(1.5, 0.7, 1.2, 0xd9d3de, 0.08);
  prBody.position.y = 0.35;
  const prTop = rbox(1.3, 0.07, 0.9, 0x5a4470, 0.03);
  prTop.position.set(0, 0.72, -0.05);
  const prTray = rbox(1.0, 0.05, 0.55, 0xffffff, 0.02);
  prTray.position.set(0, 0.28, 0.82);
  const prLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0x555566, { emissive: 0x000000 }));
  prLed.position.set(0.55, 0.58, 0.61);
  printer.add(prBody, prTop, prTray, prLed);
  shadow(printer);
  scene.add(printer);

  // ---------- Power strip on the floor ----------
  const strip = new THREE.Group();
  const sBody = rbox(1.5, 0.18, 0.4, 0xf4f0f6, 0.05);
  sBody.position.y = 0.09;
  const sSwitch = rbox(0.18, 0.1, 0.22, COLORS.red, 0.02);
  sSwitch.position.set(-0.55, 0.2, 0);
  const sLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(COLORS.red, { emissive: COLORS.red }));
  sLed.position.set(-0.3, 0.19, 0);
  strip.add(sBody, sSwitch, sLed);
  shadow(strip);
  strip.position.set(2.6, 0, 1.4);
  scene.add(strip);
  scene.add(cable([[2.95, 0.12, 1.4], [2.7, 0.05, 0.6], [2.4, 0.5, -0.4], [2.2, T + 0.3, -0.85]], 0x24182e, 0.04));

  // ---------- Fault log clipboard ----------
  const clip = new THREE.Group();
  const board = rbox(1.6, 0.05, 2.0, 0xa87b52, 0.04);
  board.position.y = 0.025;
  const sheet = decal(1.45, 1.8, () => {}, { px: 300, transparent: false });
  sheet.rotation.x = -Math.PI / 2;
  sheet.position.y = 0.052;
  const clamp = rbox(0.6, 0.08, 0.16, 0xb8bcc6, 0.03, { metalness: 0.5 });
  clamp.position.set(0, 0.07, -0.95);
  clip.add(board, sheet, clamp);
  shadow(clip);
  clip.position.set(3.2, T, 1.25);
  clip.rotation.y = -0.25;
  scene.add(clip);

  // ---------- Callouts (most important first) ----------
  stage.callout(stepTiles.C, { icon: '🧭', title: 'Fix-it habit', text: 'R-C-S-A: easy checks first, test after each.', at: [0, 0.65, 0], dx: 40, dy: -50 });
  stage.callout(monitor, { icon: '👀', title: 'Symptom', text: 'What you see or hear.', at: [-MW / 2, 1.9, 0], dx: -120, dy: 50 });
  stage.callout(clip, { icon: '📋', title: 'Fault log', text: 'Write the step that fixed it.', at: [0, 0.1, 0.4], dx: 60, dy: 100 });
  stage.callout(strip, { icon: '⚡', title: 'Power strip', text: 'Mains plugs are an adult\'s job.', at: [0.6, 0.2, 0], dx: -200, dy: 60 });
  stage.callout(router, { icon: '📶', title: 'Router', text: 'Lights on: internet is arriving.', at: [0, 0.8, 0], dx: 90, dy: -40 });

  // ======================================================================
  //  STATE
  // ======================================================================
  let cur = null; // the fault being fixed
  let checked = new Set(), skipped = false, fixedNow = false, busy = false, choosing = false;
  const fixed = new Set();
  const log = []; // { name, step, did }
  const env = { muted: false, eth: true, frozen: false, full: false, caps: false, power: true, jam: false, booting: false };

  function applyEnv() {
    const on = env.power;
    tLed.material.emissive.setHex(on ? 0x2ec4b6 : 0x000000);
    monLed.material.emissive.setHex(on ? 0x2ec4b6 : 0x000000);
    sLed.material.emissive.setHex(on ? COLORS.red : 0x000000);
    sSwitch.material.color.setHex(on ? COLORS.red : 0x8a8f99);
    capsLed.material.emissive.setHex(on && env.caps ? 0x2ec4b6 : 0x000000);
    prLed.material.emissive.setHex(env.jam ? 0xff8c00 : on ? 0x2ec4b6 : 0x000000);
    rLeds[3].material.emissive.setHex(env.eth ? 0x2ec4b6 : 0x000000);
    drawEth(env.eth);
    drawScreen();
  }
  function drawScreen(extra) {
    const c = screen.material.map.image, g = c.getContext('2d'), W = c.width, H = c.height;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    if (!env.power) { g.fillStyle = '#0b090d'; g.fillRect(0, 0, W, H); screen.material.map.needsUpdate = true; return; }
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#5a4470'); grd.addColorStop(1, '#24182e');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // the app window for the current fault
    const win = (title, body, x = W * 0.08, y = H * 0.07, w = W * 0.84, h = H * 0.74) => {
      g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill();
      g.fillStyle = '#f4f0f6'; g.fillRect(x, y, w, h * 0.12);
      g.fillStyle = '#24182e'; fit(g, title, 600, h * 0.065, w * 0.75); g.fillText(title, x + w * 0.03, y + h * 0.06);
      g.textAlign = 'right'; g.font = `500 ${h * 0.06}px ${FONT}`; g.fillText('—  ☐  ✕', x + w * 0.97, y + h * 0.06); g.textAlign = 'left';
      body(x, y + h * 0.12, w, h * 0.88);
    };
    const id = cur?.id;
    if (extra === 'restart') {
      g.fillStyle = '#1b2a6b'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = `500 ${H * 0.07}px ${FONT}`; g.fillText('Restarting…', W / 2, H / 2);
    } else if (id === 'sound') {
      win('▶ YouTube · The water cycle (song)', (x, y, w, h) => {
        g.fillStyle = '#1b1222'; g.fillRect(x + w * 0.05, y + h * 0.06, w * 0.9, h * 0.72);
        g.fillStyle = '#2ec4b6'; g.beginPath(); g.arc(x + w * 0.3, y + h * 0.4, h * 0.14, 0, 7); g.fill();
        g.fillStyle = '#ffbe00'; g.beginPath(); g.arc(x + w * 0.62, y + h * 0.3, h * 0.1, 0, 7); g.fill();
        g.fillStyle = '#ca1f3f'; g.fillRect(x + w * 0.05, y + h * 0.82, w * 0.5, h * 0.04);
        g.fillStyle = '#d9d3de'; g.fillRect(x + w * 0.55, y + h * 0.82, w * 0.4, h * 0.04);
      });
    } else if (id === 'internet') {
      win('🌐 Chrome', (x, y, w, h) => {
        g.textAlign = 'center';
        g.fillStyle = '#24182e';
        if (env.eth) { g.font = `700 ${h * 0.12}px ${FONT}`; g.fillText('Bozoma Innovation Hub', x + w / 2, y + h * 0.35); g.font = `400 ${h * 0.07}px ${FONT}`; g.fillText('✅ The page loaded!', x + w / 2, y + h * 0.55); }
        else { g.font = `${h * 0.2}px ${FONT}`; g.fillText('🦖', x + w / 2, y + h * 0.3); g.font = `700 ${h * 0.09}px ${FONT}`; g.fillText('No internet', x + w / 2, y + h * 0.55); g.font = `400 ${h * 0.06}px ${FONT}`; g.fillText('Check the network cables, modem and router', x + w / 2, y + h * 0.7); }
        g.textAlign = 'left';
      });
    } else if (id === 'frozen') {
      win(env.frozen ? 'Paint (Not responding)' : 'Paint', (x, y, w, h) => {
        g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h);
        g.strokeStyle = '#ca1f3f'; g.lineWidth = 8; g.beginPath(); g.moveTo(x + w * 0.2, y + h * 0.6); g.quadraticCurveTo(x + w * 0.4, y + h * 0.1, x + w * 0.6, y + h * 0.6); g.stroke();
        g.fillStyle = '#ffbe00'; g.beginPath(); g.arc(x + w * 0.78, y + h * 0.3, h * 0.12, 0, 7); g.fill();
        if (env.frozen) {
          g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x, y, w, h);
          g.strokeStyle = '#3b6fd4'; g.lineWidth = 6; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.12, spin, spin + 4.5); g.stroke();
        }
      });
    } else if (id === 'drive') {
      win('📁 This PC', (x, y, w, h) => {
        g.fillStyle = '#24182e'; g.font = `600 ${h * 0.08}px ${FONT}`; g.fillText('💽 Local Disk (C:)', x + w * 0.06, y + h * 0.22);
        g.fillStyle = '#e8e2ec'; g.fillRect(x + w * 0.06, y + h * 0.36, w * 0.8, h * 0.1);
        g.fillStyle = env.full ? '#ca1f3f' : '#3b6fd4'; g.fillRect(x + w * 0.06, y + h * 0.36, w * 0.8 * (env.full ? 0.995 : 0.64), h * 0.1);
        g.fillStyle = '#24182e'; g.font = `400 ${h * 0.07}px ${FONT}`; g.fillText(env.full ? '1.2 GB free of 237 GB' : '86 GB free of 237 GB', x + w * 0.06, y + h * 0.58);
        g.fillText('🗑️ Recycle Bin: ' + (env.full ? '74 GB of old videos' : 'empty'), x + w * 0.06, y + h * 0.76);
      });
    } else if (id === 'caps') {
      win('📝 Notepad', (x, y, w, h) => {
        g.fillStyle = '#24182e'; g.font = `400 ${h * 0.09}px ui-monospace, Menlo, monospace`;
        g.fillText(env.caps ? 'MY NAME IS NAA.' : 'My name is Naa.', x + w * 0.05, y + h * 0.2);
        g.fillText(env.caps ? 'I LOVE SCIENCE.' : 'I love science.', x + w * 0.05, y + h * 0.36);
      });
    } else if (id === 'printer') {
      win('📝 Word · Letter_Kwabena.docx', (x, y, w, h) => {
        g.fillStyle = '#24182e'; g.font = `400 ${h * 0.065}px ${FONT}`;
        ['Dear Headteacher,', 'I am writing to ask…'].forEach((t, i) => g.fillText(t, x + w * 0.06, y + h * (0.15 + i * 0.1)));
        g.fillStyle = '#fff6d0'; g.fillRect(x + w * 0.3, y + h * 0.45, w * 0.66, h * 0.42);
        g.strokeStyle = '#ff8c00'; g.lineWidth = 3; g.strokeRect(x + w * 0.3, y + h * 0.45, w * 0.66, h * 0.42);
        g.fillStyle = '#24182e'; g.font = `700 ${h * 0.065}px ${FONT}`; g.fillText('⚠️ Printer error', x + w * 0.33, y + h * 0.54);
        g.font = `400 ${h * 0.055}px ${FONT}`; g.fillText('Error: paper jam (0x0000)', x + w * 0.33, y + h * 0.66);
        g.fillText(env.jam ? 'Ask an adult to clear it.' : '✅ Cleared by the mentor.', x + w * 0.33, y + h * 0.78);
      });
    } else {
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = `600 ${H * 0.07}px ${FONT}`;
      g.fillText(id === 'power' ? '✅ Windows is starting' : 'Choose a fault to fix', W / 2, H * 0.42);
    }
    // taskbar with the sound and network icons
    g.textAlign = 'left';
    g.fillStyle = 'rgba(244,240,246,0.95)'; g.fillRect(0, H * 0.9, W, H * 0.1);
    g.fillStyle = '#3b6fd4';
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.fillRect(W * 0.46 + i * H * 0.03, H * 0.92 + j * H * 0.03, H * 0.026, H * 0.026);
    g.fillStyle = '#24182e'; g.font = `500 ${H * 0.045}px ${FONT}`;
    g.fillText(`${env.eth ? '🖧' : '🌐'}  ${env.muted ? '🔇' : '🔊'}   10:41`, W * 0.74, H * 0.95);
    screen.material.map.needsUpdate = true;
  }
  let spin = 0, spinT = 0;
  stage.onTick((dt) => {
    if (!env.frozen || cur?.id !== 'frozen') return;
    spin += dt * 5;
    if ((spinT += dt) > 0.12) { spinT = 0; drawScreen(); }
  });
  function drawLog() {
    const c = sheet.material.map.image, g = c.getContext('2d'), W = c.width, H = c.height;
    g.fillStyle = '#fdfcf8'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#24182e'; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.font = `700 ${H * 0.065}px ${FONT}`; g.fillText('FAULT LOG', W / 2, H * 0.08);
    g.textAlign = 'left';
    g.font = `600 ${H * 0.04}px ${FONT}`;
    g.fillText('Fault', W * 0.05, H * 0.17); g.fillText('Step', W * 0.6, H * 0.17); g.fillText('OK', W * 0.82, H * 0.17);
    g.fillStyle = '#d9d3de'; g.fillRect(W * 0.04, H * 0.2, W * 0.92, 2);
    for (let i = 0; i < 7; i++) {
      const y = H * (0.27 + i * 0.1);
      g.fillStyle = '#e8e2ec'; g.fillRect(W * 0.04, y + H * 0.04, W * 0.92, 1);
      const e = log[i];
      if (!e) continue;
      g.fillStyle = '#24182e';
      fit(g, e.name, 500, H * 0.045, W * 0.52);
      g.fillText(e.name, W * 0.05, y);
      g.fillStyle = '#ca1f3f'; g.font = `700 ${H * 0.06}px ${FONT}`; g.fillText(e.step, W * 0.63, y);
      g.fillStyle = '#2a9d8f'; g.fillText('✓', W * 0.84, y);
    }
    sheet.material.map.needsUpdate = true;
  }
  function setTile(k, state) {
    const col = { idle: 0xffffff, check: 0xffe9a8, found: 0xffe9a8, no: 0xbdb5c4, yes: 0x9be7d9, ask: 0xd6c8ff }[state];
    stepTiles[k].material.color.setHex(col);
    setLabel(stepTags[k], { idle: '', check: '🔎 checking…', found: '💡 found it!', no: '✗ not it', yes: '✓ fixed it!', ask: '🙋 asking' }[state]);
  }

  // ======================================================================
  //  SIDE PANEL
  // ======================================================================
  const faultG = ui.group('1 · Choose a fault to fix');
  const faultBtns = {};
  for (const f of FAULTS) faultBtns[f.id] = ui.button(`${f.icon} ${f.name}`, () => pickFault(f.id), { group: faultG });
  const symptom = ui.element('<div class="mail-card" aria-live="polite"><p class="crack">Each computer problem comes with a <b>symptom</b>: what someone sees or hears. Choose one above.</p></div>', faultG).firstElementChild;
  const stepG = ui.group('2 · Check in order: R → C → S → A');
  const stepBtns = {};
  for (const k of ORDER) stepBtns[k] = ui.button(`${k} · ${STEPS[k].icon} ${STEPS[k].word}`, () => doStep(k), { group: stepG });
  const choiceG = ui.group('');
  stepG.appendChild(choiceG);
  const logG = ui.group('Fault log');
  const logEl = ui.element('<p class="crack">Nothing fixed yet.</p>', logG).firstElementChild;

  function setBusy(on) {
    busy = on;
    for (const b of [...Object.values(stepBtns), ...Object.values(faultBtns)]) { b.setAttribute('aria-disabled', String(on)); b.style.opacity = on ? '0.5' : ''; }
  }
  function refreshPanel() {
    for (const f of FAULTS) {
      faultBtns[f.id].textContent = `${fixed.has(f.id) ? '✅' : f.icon} ${f.name}`;
      faultBtns[f.id].classList.toggle('active', cur?.id === f.id);
      faultBtns[f.id].setAttribute('aria-pressed', String(cur?.id === f.id));
    }
    for (const k of ORDER) stepBtns[k].textContent = `${k} · ${STEPS[k].icon} ${STEPS[k].word}${checked.has(k) ? (cur && k === cur.cause && fixedNow ? ' ✅' : ' ✗') : ''}`;
    logEl.innerHTML = log.length ? `<ol style="margin:0;padding-left:18px">${log.map((e) => `<li><b>${esc(e.name)}</b>: step <b>${e.step}</b>, ${esc(e.did)}</li>`).join('')}</ol>` : 'Nothing fixed yet.';
  }

  function resetEnv() {
    Object.assign(env, { muted: false, eth: true, frozen: false, full: false, caps: false, power: true, jam: false });
  }
  function pickFault(id) {
    if (busy) return;
    const f = FAULTS.find((x) => x.id === id);
    cur = f;
    checked = new Set();
    skipped = false;
    fixedNow = false;
    choosing = false;
    choiceG.innerHTML = '';
    ORDER.forEach((k) => setTile(k, 'idle'));
    resetEnv();
    // Plant the fault.
    ({ sound: () => (env.muted = true), internet: () => (env.eth = false), frozen: () => (env.frozen = true), drive: () => (env.full = true), caps: () => (env.caps = true), power: () => (env.power = false), printer: () => (env.jam = true) })[id]();
    applyEnv();
    stage.reveal();
    symptom.innerHTML = `<small class="mail-count">${f.icon} ${esc(f.name)}${fixed.has(id) ? ' · fixed before, try again!' : ''}</small><p style="margin:6px 0"><b>${esc(f.who)} says:</b> “${esc(f.says)}”</p><small class="mail-count">Which step do you check first?</small>`;
    refreshPanel();
    ui.info(`${f.icon} ${f.name}`, `<p><b>${esc(f.who)} says:</b> “${esc(f.says)}”</p><p>Stay calm and check in order: <b>R</b>estart, <b>C</b>ables & power, <b>S</b>ettings, then <b>A</b>sk. After each step, <b>test again</b>.</p>${f.skipR ? '' : ''}`);
    stepBtns.R.focus();
  }

  async function doStep(k) {
    if (busy) return;
    if (!cur) { ui.info('👆 Choose a fault first', '<p>Pick one of the faults in <b>1 · Choose a fault to fix</b>.</p>'); return; }
    if (fixedNow) { ui.info('✅ Already fixed', '<p>This one works now. Choose another fault.</p>'); return; }
    if (choosing && k === cur.cause) return;
    const f = cur;
    // "Ask" too early: try R, C and S first.
    const need = ORDER.slice(0, 3).filter((s) => !(f.skipR && s === 'R') && !checked.has(s));
    if (k === 'A' && need.length) { ui.info('🙋 Not yet!', `<p>A mentor would ask: <b>"Which of R, C and S did you try?"</b> Check ${need.map((s) => `<b>${s}</b>`).join(', ')} first. Most problems are fixed before you need to ask.</p>`); return; }
    if (checked.has(k)) { ui.info(`${k} already checked`, `<p>${f[k]}</p><p>Try the next step.</p>`); return; }
    // Restart on a computer that won't start: explain, but it is not a skipped step.
    if (k === 'R' && f.skipR) {
      ui.info('🔄 Restart? Not possible!', `<p>${f.R}</p>`);
      setTile('R', 'no');
      checked.add('R');
      refreshPanel();
      return;
    }
    // Did the pupil skip an easier step?
    const expected = ORDER.filter((s) => !(f.skipR && s === 'R')).find((s) => !checked.has(s));
    const skippedNow = k !== expected;
    if (skippedNow) skipped = true;
    setBusy(true);
    stage.reveal();
    setTile(k, 'check');
    choiceG.innerHTML = '';
    await checkAnim(k);
    setBusy(false);
    checked.add(k);
    const skipNote = skippedNow ? `<p>⚠️ You skipped <b>${expected}</b>. Checking from easiest to hardest saves time: next time start with ${expected}.</p>` : '';
    if (k === 'A') { setTile('A', 'ask'); refreshPanel(); helpRequest(); return; }
    if (k !== f.cause) {
      setTile(k, 'no');
      const nxt = ORDER.filter((s) => !(f.skipR && s === 'R')).find((s) => !checked.has(s));
      ui.info(`${k} · ${STEPS[k].word}: not it`, `<p>${f[k]}</p><p>That is still progress: <b>${k}</b> is ruled out.${nxt ? ` Next: <b>${nxt} · ${STEPS[nxt].word}</b>.` : ''}</p>${skipNote}`);
      refreshPanel();
      return;
    }
    // Found the cause: choose the right fix.
    choosing = true;
    setTile(k, 'found');
    refreshPanel();
    ui.info(`${k} · ${STEPS[k].word}: found it!`, `<p>${f[k]}</p><p>How do you fix it? Choose below.</p>${skipNote}`);
    choiceG.innerHTML = '<span class="lab-group-title">How do you fix it?</span>';
    for (const [t, good] of f.fixes) {
      const b = ui.button(t, () => applyFix(good, t), { group: choiceG });
      b.style.textAlign = 'left';
    }
    choiceG.querySelector('button')?.focus();
  }

  async function checkAnim(k) {
    const f = cur;
    if (k === 'R' && f.id !== 'frozen') {
      drawScreen('restart');
      await stage.wait(0.9);
      drawScreen();
    } else if (k === 'C') {
      const obj = { sound: headset, internet: router, power: strip, printer, caps: keyboard, drive: tower }[f.id] ?? tower;
      stage.highlight(obj, true);
      const y0 = obj.position.y;
      await stage.tween((q) => (obj.position.y = y0 + Math.sin(q * Math.PI * 2) * 0.06), 0.9);
      stage.highlight(obj, false);
    } else if (k === 'S') {
      const obj = f.id === 'caps' ? keyboard : monitor;
      stage.highlight(obj, true);
      await stage.wait(0.8);
      stage.highlight(obj, false);
    } else await stage.wait(0.5);
  }

  async function applyFix(good, t) {
    if (!choosing || busy) return;
    const f = cur;
    if (!good) {
      ui.info('🤔 That fixes a different problem', `<p>“${esc(t.replace(/^\S+\s/, ''))}” will not help here. ${f.id === 'power' && /case/.test(t) ? '<b>Never open a computer case</b>: there is mains electricity inside!' : 'Read what the step found, and choose again.'}</p>`);
      return;
    }
    choosing = false;
    choiceG.innerHTML = '';
    setBusy(true);
    // The fix happens.
    if (f.id === 'sound') env.muted = false;
    if (f.id === 'internet') env.eth = true;
    if (f.id === 'frozen') { env.frozen = false; drawScreen('restart'); await stage.wait(0.6); }
    if (f.id === 'drive') env.full = false;
    if (f.id === 'caps') env.caps = false;
    if (f.id === 'power') { env.power = true; }
    applyEnv();
    if (f.id === 'sound') { for (const s of ['🎵', '🎵 ♪', '🎵 ♪ ♫']) { setLabel(soundTag, s); await stage.wait(0.3); } setLabel(soundTag, ''); }
    else await stage.wait(0.5);
    setBusy(false);
    finishFault(f.cause);
  }

  function finishFault(step) {
    const f = cur;
    fixedNow = true;
    setTile(step, step === 'A' ? 'ask' : 'yes');
    fixed.add(f.id);
    log.push({ name: f.name, step, did: f.log });
    if (log.length > 7) log.shift();
    drawLog();
    refreshPanel();
    const fixCount = [...fixed].filter((id) => id !== 'printer').length;
    const inOrder = !skipped;
    if (fixCount >= 3) ui.complete('three');
    if (inOrder && step !== 'A') ui.complete('order');
    if (step === 'A') return;
    ui.info(`✅ Fixed at step ${step}!`, `<p><b>${esc(f.name)}</b>: ${esc(f.log)}. Tested again: it works!</p><p>${inOrder ? '👏 You checked every step <b>in order</b>, testing after each one.' : 'Next time, try not to skip a step: easy checks first.'}</p><p>Fault log: <b>step ${step}</b>. Faults fixed: <b>${fixCount}</b>${fixCount < 3 ? ' (fix 3 for the mission)' : ''}.</p>`);
  }

  // ---------- Step A: a clear help request ----------
  function helpRequest() {
    const f = cur;
    const picks = HELP.map(() => null);
    choiceG.innerHTML = '';
    const head = ui.element(`<span class="lab-group-title">Write your help request to the mentor</span>`, choiceG);
    void head;
    const out = ui.element('<div class="mail-card" aria-live="polite"></div>', choiceG).firstElementChild;
    const draw = () => {
      out.innerHTML = picks.map((p, i) => `<div class="mail-row"><b>${esc(HELP[i].part)}:</b> ${p == null ? '<span style="color:#9b91a4">choose below…</span>' : esc(HELP[i].opts[p][0])}</div>`).join('');
    };
    HELP.forEach((h, i) => {
      const g = ui.group(h.part);
      choiceG.appendChild(g);
      h.opts.forEach(([t, good], j) => {
        const b = ui.button(t, () => {
          picks[i] = j;
          [...g.querySelectorAll('button')].forEach((x, xi) => { x.classList.toggle('active', xi === j); x.setAttribute('aria-pressed', String(xi === j)); });
          draw();
          if (!good) ui.info('🤔 Could be clearer', `<p>The helper cannot see inside your head. ${i === 3 && j === 2 ? 'And <b>never</b> pull jammed paper out: tell an adult.' : 'Give the exact facts: what you did, what you see, the exact error and what you tried.'}</p>`);
          else ui.info('👍 Clear!', '<p>That part tells the helper exactly what they need.</p>');
        }, { group: g });
        b.style.textAlign = 'left';
      });
    });
    const send = ui.button('📨 Send the help request', () => {
      if (picks.some((p) => p == null)) { ui.info('Fill in all 4 parts', '<p>Choose one answer for each of the four parts.</p>'); return; }
      const bad = picks.map((p, i) => (HELP[i].opts[p][1] ? null : HELP[i].part)).filter(Boolean);
      if (bad.length) { ui.info('🔁 Make it clearer', `<p>Change: ${bad.map((b) => `<b>${esc(b)}</b>`).join(', ')}. A clear request has <b>what I did, what I see, the exact error and what I tried</b>.</p>`); return; }
      env.jam = false;
      applyEnv();
      choiceG.innerHTML = '';
      finishFault('A');
      ui.complete('ask');
      ui.info('📨 A clear help request!', `<p>The mentor knew exactly what to do and cleared the paper jam safely. ✅</p><div class="mail-card">${picks.map((p, i) => `<div class="mail-row"><b>${esc(HELP[i].part)}:</b> ${esc(HELP[i].opts[p][0])}</div>`).join('')}</div><p>📸 Tip: take a screenshot of the error with <b>Windows + Shift + S</b> before you close it.</p>`);
    }, { primary: true, group: choiceG });
    void send;
    draw();
    ui.info('🙋 Step A: Ask', `<p>You tried <b>R</b>, <b>C</b> and <b>S</b>, and it is still broken: a paper jam is a job for an adult. Now ask for help <b>well</b>.</p><p>"It\'s not working!" is not enough. Build your request from the <b>4 parts</b> below.</p>`);
    void f;
  }

  // ---------- 3D clicks ----------
  for (const k of ORDER) stage.clickable(stepTiles[k], () => doStep(k));
  stage.clickable(strip, () => ui.info('⚡ The power strip', '<p>Mains plugs, power strips and UPS units are an <b>adult\'s job</b>. You can look for its light, and tell an adult if it is off.</p>'));

  applyEnv();
  drawLog();
  refreshPanel();
  ui.info('🛠️ Fix-It Workshop', '<p>Think like a fitter at <b>Suame Magazine</b>: easy checks first. Every fault here is fixed with the <b>R-C-S-A</b> habit: <b>R</b>estart, <b>C</b>ables & power, <b>S</b>ettings, <b>A</b>sk. <i>"Really Calm Students Ask!"</i></p><p>Choose a fault, then check the steps <b>in order</b>. Say them out loud: "R… C… S…"</p>');
}

export const missions = [
  { id: 'three', text: 'Fix 3 faults using R-C-S-A.', hint: 'Choose a fault, then press R, C, S in order until one finds the cause.' },
  { id: 'order', text: 'Fix a fault without skipping a step.', hint: 'Start at R (or C if it won\'t turn on), and check each step in turn.' },
  { id: 'ask', text: 'Write a clear help request (all 4 parts) for the printer you can\'t fix.', hint: 'Try R, C and S on the printer error first. Then press A.' },
];

export const config = { camera: [3, 8, 13], target: [0, 3.2, -0.4], shadowSize: 10, frame: 0.95, minDistance: 4 };
