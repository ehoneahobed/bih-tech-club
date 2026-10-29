// Session 2 — Keyboard Mastery: a 3D keyboard that reacts to the learner's real
// key presses, shows the five zones, finger map and a home-row typing drill.
import { THREE, COLORS, box, mat, textCanvas } from './runtime.js';

const ZONES = {
  fn: { name: 'Function keys', color: 0x7209b7, text: 'F1–F12 and Esc. Shortcut buttons — F1 often opens Help, F2 renames a file, F5 refreshes.' },
  num: { name: 'Number keys', color: 0xf77f00, text: 'The row of numbers. Hold Shift to type the symbols above them, like ! @ #.' },
  alpha: { name: 'Alphabet (typing) keys', color: 0x4361ee, text: 'The letters. Your fingers rest on the home row: A S D F and J K L ;' },
  ctrl: { name: 'Control keys', color: 0xe63946, text: 'Shift, Ctrl, Alt, Tab, Caps Lock, Enter, Backspace and Space. They change what other keys do or control your writing.' },
  nav: { name: 'Navigation (arrow) keys', color: 0x2ec4b6, text: 'Move the cursor without the mouse: ← ↑ ↓ →.' },
};

// [label, code, width, zone]
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

export default function keyboardLab(stage, ui, host) {
  const { scene } = stage;
  const U = 0.62; // one key unit
  const keys = new Map(); // code -> { mesh, zone, label, baseY }
  const board = new THREE.Group();
  scene.add(board);

  const caseMesh = box(15 * U + 0.5, 0.35, 6 * U + 0.6, 0x2b2d42);
  caseMesh.position.y = 0.17;
  board.add(caseMesh);

  ROWS.forEach((row, r) => {
    let x = -7.5 * U;
    for (const [text, code, w, zone] of row) {
      const geo = new THREE.BoxGeometry(w * U - 0.07, 0.28, U - 0.07);
      const top = new THREE.MeshStandardMaterial({ map: textCanvas(text, { width: 256 * Math.min(w, 2.5), height: 256, bg: '#F8F9FA', font: `bold ${text.length > 2 ? 64 : 110}px system-ui, sans-serif`, radius: 30 }), roughness: 0.6 });
      const side = mat(0xdee2e6);
      const mesh = new THREE.Mesh(geo, [side, side, top, side, side, side]);
      mesh.castShadow = true;
      mesh.position.set(x + (w * U) / 2, 0.48, (r - 2.5) * U + (r === 0 ? -0.12 : 0));
      board.add(mesh);
      keys.set(code, { mesh, zone, text, side, top, baseY: 0.48 });
      if (code === 'KeyF' || code === 'KeyJ') {
        const bump = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.12, 4, 8), mat(0x495057));
        bump.rotation.z = Math.PI / 2;
        bump.position.set(0, 0.15, 0.16);
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
      if (colouring === 'zones') c = ZONES[k.zone].color;
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
  function press(code) {
    const k = keys.get(code);
    if (!k) return;
    k.mesh.position.y = k.baseY - 0.12;
    k.top.emissive.setHex(0x553300);
    setTimeout(() => {
      k.mesh.position.y = k.baseY;
      k.top.emissive.setHex(drill && isTarget(code) ? 0x996600 : 0x000000);
    }, 140);
    if (drill) return drillKey(code);
    const z = ZONES[k.zone];
    const f = FINGERS.find((f) => f.keys.includes(k.text));
    ui.info(`${k.text} — ${z.name}`, `<p>${z.text}</p>${f ? `<p>👆 Type it with your <b>${f.name.toLowerCase()}</b> finger.</p>` : ''}`);
  }

  // Listen only while the lab has focus so the rest of the page still types normally.
  host.tabIndex = 0;
  host.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
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
          ui.info('🎉 Drill complete!', `<p>Accuracy: <b>${acc}%</b>. Remember: <b>accuracy before speed</b>. Try again tomorrow and see if you can keep your eyes off the keys.</p>`);
          return;
        }
        drill.word = DRILLS[drill.n];
        drill.i = 0;
      }
    } else drill.mistakes++;
    highlightTarget();
  }

  // ---------- Controls ----------
  const g = ui.group('Colour the keys by');
  const bz = ui.button('Zones', () => setColouring('zones', bz), { group: g });
  const bf = ui.button('Fingers', () => setColouring('fingers', bf), { group: g });
  const bp = ui.button('Plain', () => setColouring('plain', bp), { group: g });
  function setColouring(c, b) {
    colouring = c;
    paint();
    ui.toggle([bz, bf, bp], b);
    if (c === 'zones') ui.info('The five keyboard zones', Object.values(ZONES).map((z) => `<p><span class="swatch" style="background:#${z.color.toString(16).padStart(6, '0')}"></span><b>${z.name}</b></p>`).join(''));
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

export const config = { camera: [0, 7, 6.5], target: [0, 0, 0.3], ground: true, minDistance: 4, shadowSize: 7 };
