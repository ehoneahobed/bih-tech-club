// Session 2 — Keyboard Mastery: a 3D keyboard that reacts to the learner's real
// key presses, shows the four zones (as in workbook Figure 2.0), finger map and a home-row typing drill.
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE, mat, rbox, cable, decal } from './runtime.js';

// The four zones from workbook Figure 2.0. This keyboard is laptop-sized, so it has no numeric keypad.
const ZONES = {
  fn: { name: 'Function zone', color: 0xca1f3f },
  main: { name: 'Main alphanumeric zone', color: 0x5a4470 },
  nav: { name: 'Navigation zone', color: 0x2ec4b6 },
  pad: { name: 'Numeric keypad (desktop keyboards only, not on this one)', color: 0xadb5bd },
};
// Each key's kind: which zone it is in and what to say about it.
const KINDS = {
  fn: { zone: 'fn', text: 'F1–F12 and Esc. Shortcut buttons: F1 often opens Help, F2 renames a file, F5 refreshes.' },
  num: { zone: 'main', text: 'A top-row number key, part of the main zone. Hold Shift to type the symbol above it, like ! @ #.' },
  alpha: { zone: 'main', text: 'A letter or punctuation key in the main zone. Your fingers rest on the home row: A S D F and J K L ;' },
  ctrl: { zone: 'main', text: 'A command key in the main zone (Shift, Ctrl, Alt, Tab, Caps Lock, Enter, Backspace, Space). It changes what other keys do or controls your writing.' },
  nav: { zone: 'nav', text: 'Move the cursor without the mouse: ← ↑ ↓ →.' },
};

// [label, code, width, kind]
const ROWS = [
  [['Esc', 'Escape', 1, 'fn'], ...Array.from({ length: 12 }, (_, i) => [`F${i + 1}`, `F${i + 1}`, 1, 'fn'])],
  [['`', 'Backquote', 1, 'num'], ...'1234567890'.split('').map((d) => [d, `Digit${d}`, 1, 'num']), ['-', 'Minus', 1, 'num'], ['=', 'Equal', 1, 'num'], ['⌫ Back', 'Backspace', 2, 'ctrl']],
  [['Tab', 'Tab', 1.5, 'ctrl'], ...'QWERTYUIOP'.split('').map((c) => [c, `Key${c}`, 1, 'alpha']), ['[', 'BracketLeft', 1, 'alpha'], [']', 'BracketRight', 1, 'alpha'], ['\\', 'Backslash', 1.5, 'alpha']],
  [['Caps', 'CapsLock', 1.8, 'ctrl'], ...'ASDFGHJKL'.split('').map((c) => [c, `Key${c}`, 1, 'alpha']), [';', 'Semicolon', 1, 'alpha'], ["'", 'Quote', 1, 'alpha'], ['Enter ↵', 'Enter', 2.2, 'ctrl']],
  [['Shift', 'ShiftLeft', 2.3, 'ctrl'], ...'ZXCVBNM'.split('').map((c) => [c, `Key${c}`, 1, 'alpha']), [',', 'Comma', 1, 'alpha'], ['.', 'Period', 1, 'alpha'], ['/', 'Slash', 1, 'alpha'], ['Shift', 'ShiftRight', 2.7, 'ctrl']],
  [['Ctrl', 'ControlLeft', 1.5, 'ctrl'], ['Alt', 'AltLeft', 1.3, 'ctrl'], ['Space', 'Space', 5.4, 'ctrl'], ['Alt', 'AltRight', 1.3, 'ctrl'], ['Ctrl', 'ControlRight', 1.5, 'ctrl'], ['←', 'ArrowLeft', 1, 'nav'], ['↓', 'ArrowDown', 1, 'nav'], ['↑', 'ArrowUp', 1, 'nav'], ['→', 'ArrowRight', 1, 'nav']],
];

// Which finger owns which key on a touch-typing keyboard.
const FINGERS = [
  { name: 'Left little', color: 0xff6b6b, keys: '`1QAZ' },
  { name: 'Left ring', color: 0xffa94d, keys: '2WSX' },
  { name: 'Left middle', color: 0xffd43b, keys: '3EDC' },
  { name: 'Left index', color: 0x69db7c, keys: '45RTFGVB' },
  { name: 'Right index', color: 0x38d9a9, keys: '67YUHJNM' },
  { name: 'Right middle', color: 0x4dabf7, keys: '8IK,' },
  { name: 'Right ring', color: 0x9775fa, keys: '9OL.' },
  { name: 'Right little', color: 0xf783ac, keys: "0P;/-=[]'\\" },
];

const DRILLS = ['asdf jkl;', 'fjfj dkdk', 'sad lad', 'a lad asks', 'add salad', 'flask', 'ask dad'];

// The symbol printed above each top-row key (typed with Shift).
const SHIFTED = { '`': '~', 1: '!', 2: '@', 3: '#', 4: '$', 5: '%', 6: '^', 7: '&', 8: '*', 9: '(', 0: ')', '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"', ',': '<', '.': '>', '/': '?' };

// Regroups a box geometry into two parts, sides (material 0) and top (material 1),
// so each key costs two draw calls instead of six.
function topAndSides(geo) {
  const idx = geo.index ? Array.from(geo.index.array) : Array.from({ length: geo.attributes.position.count }, (_, i) => i);
  const groups = geo.groups;
  const sides = groups.filter((g, i) => i !== 2).flatMap((g) => idx.slice(g.start, g.start + g.count));
  const top = idx.slice(groups[2].start, groups[2].start + groups[2].count);
  geo.setIndex([...sides, ...top]);
  geo.clearGroups();
  geo.addGroup(0, sides.length, 0);
  geo.addGroup(sides.length, top.length, 1);
  return geo;
}

// The printed top of a keycap: a softly dished face with its legend (and Shift symbol).
function keyTop(text, w) {
  // Keep the texture in the key's shape (so wide keys are not stretched), at most 1024px.
  const c = document.createElement('canvas');
  c.width = Math.round(Math.min(1024, 256 * w));
  c.height = Math.round(c.width / w);
  const g = c.getContext('2d');
  g.scale(c.height / 256, c.height / 256);
  const W = 256 * w;
  const grd = g.createRadialGradient(W / 2, 110, 20, W / 2, 128, W * 0.7);
  grd.addColorStop(0, '#FFFFFF');
  grd.addColorStop(1, '#E4E1E8');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, 256);
  g.fillStyle = '#24182E';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const up = SHIFTED[text];
  let px = up ? 100 : text.length > 2 ? 64 : 110;
  do g.font = `bold ${px}px Rubik, system-ui, sans-serif`;
  while (g.measureText(text).width > W - 60 && (px -= 2) > 20);
  if (up) {
    g.fillText(text, W / 2, 176);
    g.fillStyle = '#5A4470';
    g.font = 'bold 88px Rubik, system-ui, sans-serif';
    g.fillText(up, W / 2, 76);
  } else g.fillText(text, W / 2, 132);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export default function keyboardLab(stage, ui, host) {
  const { scene } = stage;
  const U = 0.62; // one key unit
  const keys = new Map(); // code -> { mesh, zone, label, baseY }
  const board = new THREE.Group();
  scene.add(board);

  // Case: a rounded shell with a darker key plate, a Caps Lock light, feet and a cable.
  const CW = 15 * U + 0.5;
  const CD = 6 * U + 0.6;
  const caseMesh = rbox(CW, 0.35, CD, 0x3a2b47, 0.1);
  caseMesh.position.y = 0.17;
  const plate = rbox(15 * U + 0.12, 0.04, 6 * U + 0.2, 0x24182e, 0.03);
  plate.position.set(0, 0.34, -0.06);
  board.add(caseMesh, plate);
  const capsLed = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), mat(0x6b587c, { emissive: 0x000000 }));
  capsLed.position.set(4.4, 0.36, -2.5 * U - 0.12);
  const ledTag = decal(0.6, 0.16, (g, W, H) => {
    g.fillStyle = '#D9D3DE';
    g.font = `600 ${H * 0.62}px Rubik, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    g.fillText('Caps Lock', 0, H / 2);
  }, { px: 48 });
  ledTag.rotation.x = -Math.PI / 2;
  ledTag.position.set(3.82, 0.362, -2.5 * U - 0.12);
  board.add(capsLed, ledTag);
  for (const [x, z, h] of [[-CW / 2 + 0.5, -CD / 2 + 0.3, 0.26], [CW / 2 - 0.5, -CD / 2 + 0.3, 0.26], [-CW / 2 + 0.5, CD / 2 - 0.3, 0.04], [CW / 2 - 0.5, CD / 2 - 0.3, 0.04]]) {
    const foot = rbox(0.5, h, 0.3, 0x1b1322, 0.03);
    foot.position.set(x, -h / 2 + 0.01, z);
    board.add(foot);
  }
  board.add(cable([[1.2, 0.2, -CD / 2 + 0.02], [1.25, 0.14, -CD / 2 - 0.2], [1.8, 0.04, -CD / 2 - 0.45], [3.5, 0.03, -CD / 2 - 0.55], [6, 0.03, -CD / 2 - 0.4]], 0x24182e, 0.045));
  // Tilt it on its back feet, like a real keyboard on a desk.
  board.rotation.x = 0.06;
  board.position.y = 0.13;

  ROWS.forEach((row, r) => {
    let x = -7.5 * U;
    for (const [text, code, w, zone] of row) {
      // Rounded keycap; its top face (material 2) carries the legend, the sides show the colour.
      // (Two edge segments, not three, to keep the triangle count low for software rendering.)
      const shape = new RoundedBoxGeometry(w * U - 0.08, 0.28, U - 0.08, 2, 0.06);
      const top = new THREE.MeshStandardMaterial({ map: keyTop(text, w), roughness: 0.6 });
      const side = mat(0xdee2e6);
      const mesh = new THREE.Mesh(topAndSides(shape), [side, top]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(x + (w * U) / 2, 0.48, (r - 2.5) * U + (r === 0 ? -0.12 : 0));
      board.add(mesh);
      keys.set(code, { mesh, zone, text, side, top, baseY: 0.48 });
      if (code === 'KeyF' || code === 'KeyJ') {
        const bump = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.12, 4, 8), mat(0x495057));
        bump.rotation.z = Math.PI / 2;
        bump.position.set(0, 0.145, 0.15);
        mesh.add(bump);
      }
      stage.clickable(mesh, () => press(code));
      x += w * U;
    }
  });

  let colouring = 'zones';
  function paint() {
    for (const [code, k] of keys) {
      let c = 0xdee2e6;
      if (colouring === 'zones') c = ZONES[KINDS[k.zone].zone].color;
      if (colouring === 'fingers') {
        const f = FINGERS.find((f) => f.keys.includes(k.text.length === 1 ? k.text : '§'));
        c = f ? f.color : 0xadb5bd;
        if (code === 'Space') c = 0xced4da;
      }
      k.side.color.setHex(c);
    }
  }

  // ---------- Pressing ----------
  let drill = null;
  const homeBumps = new Set();
  let capsOn = false;
  function press(code) {
    const k = keys.get(code);
    if (!k) return;
    ui.complete('press-any');
    if (code === 'KeyF' || code === 'KeyJ') homeBumps.add(code);
    if (homeBumps.size === 2) ui.complete('bumps');
    if (code === 'Backspace') ui.complete('backspace');
    if (code === 'CapsLock') {
      capsOn = !capsOn;
      capsLed.material.emissive.setHex(capsOn ? 0x22cc55 : 0x000000);
    }
    if (homeBumps.has(code) || code === 'Backspace') cards[code]?.card.classList.add('done');
    k.mesh.position.y = k.baseY - 0.12;
    k.top.emissive.setHex(0x553300);
    setTimeout(() => {
      k.mesh.position.y = k.baseY;
      k.top.emissive.setHex(drill && isTarget(code) ? 0x996600 : 0x000000);
    }, 140);
    if (drill) return drillKey(code);
    const kind = KINDS[k.zone];
    const f = FINGERS.find((f) => f.keys.includes(k.text));
    ui.info(`${k.text} — ${ZONES[kind.zone].name}`, `<p>${kind.text}</p>${f ? `<p>👆 Type it with your <b>${f.name.toLowerCase()}</b> finger.</p>` : ''}`);
  }

  // Listen only while the lab has focus so the rest of the page still types normally.
  host.tabIndex = 0;
  host.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    // Space and Enter on a focused button (a card or a control) should press that button.
    if (e.target.closest('button') && (e.code === 'Space' || e.code === 'Enter')) return;
    if (keys.has(e.code)) {
      if (e.code !== 'Tab') e.preventDefault(); // never trap keyboard users inside the lab
      press(e.code);
    }
  });
  host.addEventListener('pointerdown', () => host.focus({ preventScroll: true }));

  // ---------- Home row drill ----------
  const codeFor = (ch) => (ch === ' ' ? 'Space' : ch === ';' ? 'Semicolon' : `Key${ch.toUpperCase()}`);
  const isTarget = (code) => drill && codeFor(drill.word[drill.i]) === code;
  function highlightTarget() {
    for (const k of keys.values()) k.top.emissive.setHex(0x000000);
    if (!drill) return;
    keys.get(codeFor(drill.word[drill.i]))?.top.emissive.setHex(0x996600);
    const done = drill.word.slice(0, drill.i);
    const next = drill.word[drill.i] === ' ' ? '␣' : drill.word[drill.i];
    const rest = drill.word.slice(drill.i + 1);
    ui.info(
      `Home-row drill ${drill.n + 1}/${DRILLS.length}`,
      `<p class="drill"><span class="ok">${done}</span><mark>${next}</mark>${rest}</p><p>Fingers on <b>A S D F</b> and <b>J K L ;</b>. Feel the bumps on F and J. Eyes on the screen! Accuracy: <b>${accuracy()}%</b></p>`
    );
  }
  const accuracy = () => (drill.correct + drill.mistakes === 0 ? 100 : Math.round((drill.correct / (drill.correct + drill.mistakes)) * 100));
  function drillKey(code) {
    if (code === codeFor(drill.word[drill.i])) {
      drill.i++;
      drill.correct++;
      if (drill.i >= drill.word.length) {
        drill.n++;
        if (drill.n >= DRILLS.length) {
          const acc = accuracy();
          drill = null;
          highlightTarget();
          ui.complete('drill');
          ui.info('🎉 Drill complete!', `<p>Accuracy: <b>${acc}%</b>. Remember: <b>accuracy before speed</b>. Try again tomorrow and see if you can keep your eyes off the keys.</p>`);
          return;
        }
        drill.word = DRILLS[drill.n];
        drill.i = 0;
      }
    } else drill.mistakes++;
    highlightTarget();
  }

  // ---------- Callouts ----------
  // Cards on the zones and the keys the missions ask for. Clicking a card presses its key.
  const CALLOUTS = [
    ['Backquote', '🔤', 'Main zone', 'Letters, numbers and command keys', [0, 0.14, -0.2], -40, -130],
    ['F7', '🎛️', 'Function zone', 'Esc and F1–F12: shortcut keys', [0, 0.14, -0.2], 0, -95],
    ['Backspace', '⌫', 'Backspace', 'Rubs out the letter to the left', [0.45, 0.14, -0.15], 60, -140],
    ['KeyF', '👆', 'F bump', 'Left index finger rests here', [0, 0.14, 0.12], -70, 150],
    ['KeyJ', '👆', 'J bump', 'Right index finger rests here', [0, 0.14, 0.12], 70, 150],
    ['ArrowUp', '🧭', 'Navigation zone', 'Arrow keys move the cursor', [0, 0.14, 0.22], 70, 95],
  ];
  const cards = {};
  for (const [code, icon, title, text, at, dx, dy] of CALLOUTS) {
    cards[code] = stage.callout(keys.get(code).mesh, { icon, title, text, at, dx, dy, onClick: () => press(code) });
  }
  if (ui.isDone('bumps')) ['KeyF', 'KeyJ'].forEach((c) => cards[c].card.classList.add('done'));
  if (ui.isDone('backspace')) cards.Backspace.card.classList.add('done');

  // ---------- Controls ----------
  const g = ui.group('Colour the keys by');
  const bz = ui.button('Zones', () => setColouring('zones', bz), { group: g });
  const bf = ui.button('Fingers', () => setColouring('fingers', bf), { group: g });
  const bp = ui.button('Plain', () => setColouring('plain', bp), { group: g });
  function setColouring(c, b) {
    colouring = c;
    paint();
    ui.toggle([bz, bf, bp], b);
    if (c === 'zones') ui.info('The four keyboard zones', Object.values(ZONES).map((z) => `<p><span class="swatch" style="background:#${z.color.toString(16).padStart(6, '0')}"></span><b>${z.name}</b></p>`).join(''));
    if (c === 'fingers') ui.complete('fingers');
    if (c === 'fingers') ui.info('Which finger presses which key?', FINGERS.map((f) => `<span class="chip"><span class="swatch" style="background:#${f.color.toString(16).padStart(6, '0')}"></span>${f.name}</span>`).join(' ') + '<p>Thumbs share the Space bar.</p>');
  }
  const d = ui.group('Practise');
  ui.button('⌨️ Start home-row drill', () => {
    drill = { word: DRILLS[0], i: 0, n: 0, mistakes: 0, correct: 0 };
    host.focus({ preventScroll: true });
    highlightTarget();
  }, { primary: true, group: d });

  setColouring('zones', bz);
  ui.info('Press any key!', '<p><b>Click the keyboard</b>, then press keys on your real keyboard. Watch the 3D key go down and find out its zone and which finger should press it.</p>');
}

export const config = { camera: [0, 7, 6.5], target: [0, 0, 0.3], frame: 1.3, ground: true, minDistance: 4, shadowSize: 7 };

export const missions = [
  { id: 'press-any', text: 'Click the 3D keyboard, then press any key on your real keyboard.', hint: 'Watch the same key go down on the screen.' },
  { id: 'bumps', text: 'Find the two keys with little bumps and press them: F and J.', hint: 'Feel for the bumps with your index fingers. They help you find home row without looking.' },
  { id: 'backspace', text: 'Press Backspace.', hint: 'Backspace rubs out the letter to the LEFT of the cursor.' },
  { id: 'fingers', text: 'Colour the keys by "Fingers".', hint: 'Each colour shows which finger should press that key.' },
  { id: 'drill', text: 'Finish the home-row drill.', hint: 'Press "Start home-row drill" and type the glowing letters. Go slowly; accuracy matters more than speed.' },
];
