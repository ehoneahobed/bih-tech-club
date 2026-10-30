// Session 1 — Meet Your Computer: explore desktop vs laptop parts and watch
// Input -> Process -> Output travel through the machine.
import { THREE, COLORS, box, mat, rbox, cable, decal } from './runtime.js';

const PARTS = {
  monitor: ['Monitor (Output)', 'The screen that <b>shows</b> words, pictures and actions. It is an <b>output</b> device — the corn meal pouring into your basin.'],
  tower: ['System Unit (Process)', 'The box that holds the <b>processor (CPU)</b>, memory and storage. This is where the "grinding" happens — the <b>process</b> step.'],
  keyboard: ['Keyboard (Input)', 'Keys used to <b>enter</b> letters, numbers and commands. An <b>input</b> device — the corn you pour into the hopper.'],
  mouse: ['Mouse (Input)', 'A pointing device used to move, select and open items. Left-click to select, right-click for more options.'],
  ups: ['UPS (Power backup)', 'The <b>Uninterruptible Power Supply</b> keeps a desktop running for a few minutes during "lights out" so you can save your work and shut down safely.'],
  lid: ['Laptop Screen (Output)', 'The hinged lid. Open it gently <b>from the centre</b> — never from one corner. The webcam sits at the top.'],
  base: ['Laptop Base (Process + Battery)', 'The processor, storage and rechargeable <b>battery</b> are packed flat under the keyboard. Keep the vents underneath clear — always use a hard, flat desk.'],
  lapkeys: ['Built-in Keyboard (Input)', 'The same letters as a desktop keyboard, squeezed into a smaller space. Many laptops have no separate number pad.'],
  touchpad: ['Touchpad (Input)', 'The flat pad that acts as the mouse. One finger moves the pointer; a tap is a click; two fingers can scroll.'],
};

// Keyboard layouts: each row is { h (row depth in keys), parts: [[x start, 'keys']] }.
// A key is "label:width:rows" (width and rows default to 1); "_n" is an empty gap; "~" is a blank key.
const DESK_KEYS = [
  { h: 1, parts: [[0, 'Esc _1 F1 F2 F3 F4 _.5 F5 F6 F7 F8 _.5 F9 F10 F11 F12'], [15.4, 'Prt Scr Pse']] },
  { gap: 0.3, h: 1, parts: [[0, '` 1 2 3 4 5 6 7 8 9 0 - = Backspace:2'], [15.4, 'Ins Home PgUp'], [18.7, 'Num / * -']] },
  { h: 1, parts: [[0, 'Tab:1.5 Q W E R T Y U I O P [ ] \\:1.5'], [15.4, 'Del End PgDn'], [18.7, '7 8 9 +:1:2']] },
  { h: 1, parts: [[0, 'Caps:1.75 A S D F G H J K L ; \' Enter:2.25'], [18.7, '4 5 6']] },
  { h: 1, parts: [[0, 'Shift:2.25 Z X C V B N M , . / Shift:2.75'], [16.4, '↑'], [18.7, '1 2 3 Ent:1:2']] },
  { h: 1, parts: [[0, 'Ctrl:1.25 ◆:1.25 Alt:1.25 ~:6.25 Alt:1.25 Fn:1.25 ☰:1.25 Ctrl:1.25'], [15.4, '← ↓ →'], [18.7, '0:2 .']] },
];
const LAP_KEYS = [
  { h: 0.62, parts: [[0, 'Esc F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 Ins Del']] },
  { gap: 0.08, h: 1, parts: [[0, '` 1 2 3 4 5 6 7 8 9 0 - = Backspace:2']] },
  { h: 1, parts: [[0, 'Tab:1.5 Q W E R T Y U I O P [ ] \\:1.5']] },
  { h: 1, parts: [[0, 'Caps:1.75 A S D F G H J K L ; \' Enter:2.25']] },
  { h: 1, parts: [[0, 'Shift:2.25 Z X C V B N M , . / Shift:2.75']] },
  { h: 1, parts: [[0, 'Ctrl:1.25 Fn ◆ Alt:1.25 ~:5.5 Alt ← ↑ ↓ →']] },
];

// All keycaps of a keyboard as ONE mesh (one draw call), with every legend on one decal.
function keycaps(rows, { u, h, color, modColor, legend = '#24182E' }) {
  const keys = [];
  let z = 0;
  for (const row of rows) {
    z += (row.gap ?? 0);
    for (const [x0, str] of row.parts) {
      let x = x0;
      for (const tok of str.split(' ')) {
        if (tok.startsWith('_')) { x += Number(tok.slice(1)); continue; }
        const [label, w = 1, r = 1] = tok.split(':');
        const kw = Number(w), kd = Number(r) * row.h;
        keys.push({ label: label === '~' ? '' : label, x: x + kw / 2, z: z + kd / 2, w: kw, d: kd, mod: label.length > 1 && !/^F\d|^\d/.test(label) });
        x += kw;
      }
    }
    z += row.h;
  }
  const W = Math.max(...keys.map((k) => k.x + k.w / 2));
  const D = z;
  const geos = keys.map((k) => {
    const g = new THREE.BoxGeometry(k.w * u - 0.13 * u, h, k.d * u - 0.13 * u);
    // Taper the top face a little, like a real sculpted keycap.
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++)
      if (p.getY(i) > 0) p.setXYZ(i, p.getX(i) - Math.sign(p.getX(i)) * 0.09 * u, h / 2, p.getZ(i) - Math.sign(p.getZ(i)) * 0.09 * u);
    g.computeVertexNormals();
    g.translate((k.x - W / 2) * u, h / 2, (k.z - D / 2) * u);
    const c = new THREE.Color(k.mod ? modColor : color);
    g.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: p.count }, () => [c.r, c.g, c.b]).flat(), 3));
    return g;
  });
  const mesh = new THREE.Mesh(merge(geos), mat(0xffffff, { vertexColors: true, roughness: 0.6 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const px = Math.floor((1024 * D) / W);
  const legends = decal(W * u, D * u, (g, CW, CH) => {
    const s = CW / W;
    g.fillStyle = legend;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const k of keys) {
      if (!k.label) continue;
      let f = k.label.length === 1 ? s * 0.42 : s * 0.24;
      do g.font = `600 ${f}px Rubik, system-ui, sans-serif`;
      while (g.measureText(k.label).width > (k.w - 0.3) * s && (f -= 1) > 6);
      g.fillText(k.label, k.x * s, k.z * s * (CH / (D * s)));
    }
    // Little home-row bumps on F and J.
    for (const k of keys.filter((k) => k.label === 'F' || k.label === 'J')) g.fillRect((k.x - 0.15) * s, (k.z + 0.3) * s, 0.3 * s, Math.max(1.5, 0.05 * s));
  }, { px });
  legends.rotation.x = -Math.PI / 2;
  legends.position.y = h + 0.003;
  const group = new THREE.Group();
  group.add(mesh, legends);
  return { group, width: W * u, depth: D * u };
}

// Joins several geometries (same attributes) into one, so many small parts cost one draw call.
function merge(geos) {
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'color']) out.setAttribute(name, new THREE.Float32BufferAttribute(geos.flatMap((g) => Array.from(g.attributes[name].array)), 3));
  let off = 0;
  const index = [];
  for (const g of geos) {
    for (const i of g.index.array) index.push(i + off);
    off += g.attributes.position.count;
  }
  out.setIndex(index);
  geos.forEach((g) => g.dispose());
  return out;
}

const at = (m, x, y, z) => (m.position.set(x, y, z), m);
function rr(g, x, y, w, h, r, fill) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) (g.fillStyle = fill), g.fill();
}
// A USB-A port (dark slot with a tongue) drawn on a canvas.
function usbPort(g, x, y, w, h, flip) {
  rr(g, x, y, w, h, h * 0.15, '#120c18');
  g.fillStyle = '#4a90d9';
  g.fillRect(x + w * 0.12, y + (flip ? h * 0.55 : h * 0.2), w * 0.76, h * 0.25);
}
function jack(g, x, y, r, ring) {
  g.fillStyle = ring;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#120c18';
  g.beginPath();
  g.arc(x, y, r * 0.55, 0, Math.PI * 2);
  g.fill();
}
function slots(g, x, y, w, h, n, color) {
  g.fillStyle = color;
  for (let i = 0; i < n; i++) rr(g, x, y + (i * h) / n, w, (h / n) * 0.45, 3, color);
}

function makeDesk(group) {
  const top = rbox(9, 0.3, 4.5, 0xc8a27a, 0.05);
  top.position.y = 1.85;
  group.add(top);
  // Wood grain on the desk top.
  const grain = decal(9, 4.5, (g, W, H) => {
    g.strokeStyle = 'rgba(120,80,40,0.16)';
    g.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      const y = (i + 0.5) * (H / 22);
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x / 90 + i * 1.7) * 5);
      g.stroke();
    }
  }, { px: 256 });
  grain.rotation.x = -Math.PI / 2;
  grain.position.y = 2.002;
  group.add(grain);
  for (const [x, z] of [[-4.2, -2], [4.2, -2], [-4.2, 2], [4.2, 2]]) group.add(at(rbox(0.25, 1.85, 0.25, 0x8d6e4c, 0.03), x, 0.92, z));
  // A rail joining the legs under the top, and a foot bar at the back.
  group.add(at(box(8.2, 0.22, 0.08, 0x8d6e4c), 0, 1.6, 2), at(box(8.2, 0.22, 0.08, 0x8d6e4c), 0, 1.6, -2), at(box(8.2, 0.1, 0.1, 0x8d6e4c), 0, 0.3, -2));
  return top;
}

export default function computerLab(stage, ui) {
  const { scene } = stage;
  const parts = {};
  const top = 2.0; // the desk surface

  // ---------- Desktop ----------
  const desktop = new THREE.Group();
  scene.add(desktop);
  makeDesk(desktop);

  // Monitor: thin bezel, a wider chin with a power light, a neck and a round base.
  const monitor = new THREE.Group();
  const panel = rbox(4.2, 2.62, 0.12, 0x2a2232, 0.05);
  panel.position.y = 1.92;
  const backBox = at(rbox(2.4, 1.5, 0.22, 0x3a3344, 0.08), 0, 1.85, -0.14);
  const screenMat = mat(0x0b0b14, { emissive: 0x000000, roughness: 0.2 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.25), screenMat);
  screen.position.set(0, 1.985, 0.062);
  const monLed = at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), mat(0x555566, { emissive: 0x000000 })), 1.85, 0.735, 0.062);
  monLed.rotation.x = Math.PI / 2;
  const chin = at(decal(4.0, 0.2, (g, W, H) => {
    // Small menu buttons on the chin, right side.
    for (let i = 0; i < 4; i++) rr(g, W * 0.79 + i * W * 0.03, H * 0.38, W * 0.016, H * 0.24, 4, 'rgba(255,255,255,0.28)');
  }, { px: 64 }), 0, 0.735, 0.062);
  const neck = at(rbox(0.32, 1.15, 0.12, 0x3a3344, 0.04), 0, 0.6, -0.26);
  neck.rotation.x = 0.1;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.06, 40), mat(0x3a3344));
  foot.scale.z = 0.62;
  foot.position.set(0, 0.03, -0.2);
  foot.castShadow = true;
  monitor.add(panel, backBox, screen, monLed, chin, neck, foot);
  monitor.position.set(-0.4, top, -1.1);
  desktop.add(monitor);
  parts.monitor = monitor;

  // System unit: front panel with power and reset buttons, a drive bay, USB and audio, vents.
  const tower = new THREE.Group();
  const shell = rbox(1.1, 2.4, 2.4, 0x4a3a5c, 0.05);
  shell.position.y = 1.2;
  const bezelFront = at(rbox(1.04, 2.34, 0.06, 0x2c2036, 0.03), 0, 1.2, 1.19);
  const front = at(decal(1.0, 2.3, (g, W, H) => {
    const Y = (y) => ((2.35 - y) / 2.3) * H; // tower height -> canvas
    // Drive bay
    rr(g, W * 0.08, Y(2.27), W * 0.84, H * 0.07, 6, '#3d3049');
    g.fillStyle = '#120c18';
    g.fillRect(W * 0.14, Y(2.17), W * 0.62, 3);
    rr(g, W * 0.8, Y(2.2), W * 0.08, H * 0.012, 3, '#5a4470');
    // Two USB ports and two audio jacks
    usbPort(g, W * 0.18, Y(1.66), W * 0.26, H * 0.025);
    usbPort(g, W * 0.56, Y(1.66), W * 0.26, H * 0.025);
    jack(g, W * 0.36, Y(1.48), W * 0.05, '#7ccf6a');
    jack(g, W * 0.64, Y(1.48), W * 0.05, '#ff8fb1');
    // Vent holes
    g.fillStyle = '#1b1322';
    for (let r = 0; r < 26; r++)
      for (let c = 0; c < 9; c++) {
        g.beginPath();
        g.arc(W * (0.14 + c * 0.09 + (r % 2) * 0.045), Y(1.25) + r * H * 0.018, W * 0.018, 0, Math.PI * 2);
        g.fill();
      }
  }, { px: 445 }), 0, 1.2, 1.222);
  const pwrCap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 28), mat(0x4a3d58, { roughness: 0.4 }));
  pwrCap.rotation.x = Math.PI / 2;
  pwrCap.position.set(-0.1, 1.9, 1.23);
  // The ring around the power button lights green when the computer is on.
  const pwr = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.022, 10, 32), mat(0xb9b0c4, { emissive: 0x000000 }));
  pwr.position.set(-0.1, 1.9, 1.225);
  const reset = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16), mat(0x5a4470));
  reset.rotation.x = Math.PI / 2;
  reset.position.set(0.25, 1.9, 1.225);
  // Side panel: a seam around the removable panel, and a fan grille.
  const side = at(decal(2.4, 2.4, (g, W) => {
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    g.lineWidth = 3;
    g.strokeRect(W * 0.04, W * 0.04, W * 0.86, W * 0.92);
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.lineWidth = 4;
    for (let r = 0.04; r < 0.17; r += 0.035) {
      g.beginPath();
      g.arc(W * 0.6, W * 0.3, r * W, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(W * 0.6 - 2, W * 0.13, 4, W * 0.34);
    g.fillRect(W * 0.43, W * 0.3 - 2, W * 0.34, 4);
    g.fillStyle = '#5a4470';
    for (const y of [0.1, 0.9]) rr(g, W * 0.06, W * y, W * 0.03, W * 0.03, 6, '#6b587c');
  }, { px: 256 }), 0.552, 1.2, 0);
  side.rotation.y = Math.PI / 2;
  const tfeet = [-0.9, 0.9].flatMap((z) => [-0.4, 0.4].map((x) => at(box(0.16, 0.05, 0.22, 0x1b1322), x, 0.0, z)));
  tower.add(shell, bezelFront, front, pwrCap, pwr, reset, side, ...tfeet);
  tower.position.set(3.4, top + 0.03, -0.6);
  desktop.add(tower);
  parts.tower = tower;

  // Keyboard: a full-size board with keycaps, legends, lock lights and a cable.
  const keyboard = new THREE.Group();
  const kb = keycaps(DESK_KEYS, { u: 0.14, h: 0.055, color: 0xf3f1f5, modColor: 0xd9d3de });
  const kcase = rbox(kb.width + 0.24, 0.1, kb.depth + 0.26, 0x3a2b47, 0.04);
  kcase.position.y = -0.01;
  kb.group.position.set(0, 0.04, 0.02);
  const lights = at(decal(0.5, 0.1, (g, W, H) => {
    ['#7ccf6a', '#7ccf6a', '#555'].forEach((c, i) => jack(g, W * (0.2 + i * 0.3), H * 0.5, H * 0.22, c));
  }, { px: 48 }), 1.32, 0.042, -0.44);
  lights.rotation.x = -Math.PI / 2;
  keyboard.add(kcase, kb.group, lights);
  keyboard.position.set(-0.5, top + 0.06, 0.9);
  desktop.add(keyboard);
  parts.keyboard = keyboard;

  // Mouse: a dome with a left and right button, a scroll wheel and a cable.
  const mouse = new THREE.Group();
  const shellM = new THREE.Mesh(new THREE.SphereGeometry(0.26, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf1f3f5, { roughness: 0.4 }));
  shellM.scale.set(0.8, 0.68, 1.25);
  shellM.castShadow = true;
  const soleM = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.25, 0.025, 28), mat(0x5a4470));
  soleM.scale.set(0.8, 1, 1.25);
  soleM.position.y = 0.0;
  const a = 0.208, b = 0.177, c = 0.325;
  const surf = (x, z) => b * Math.sqrt(Math.max(0, 1 - (x / a) ** 2 - (z / c) ** 2));
  const split = cable(Array.from({ length: 6 }, (_, i) => { const zz = -c * 0.95 + i * c * 0.17; return [0, surf(0, zz) + 0.002, zz]; }), 0x8d8496, 0.005);
  const zx = -0.05;
  const across = cable(Array.from({ length: 7 }, (_, i) => { const xx = (i / 6 - 0.5) * 2 * a * 0.93 * Math.sqrt(1 - (zx / c) ** 2); return [xx, surf(xx, zx) + 0.002, zx]; }), 0x8d8496, 0.005);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.028, 18), mat(0x3a2b47));
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, surf(0, -0.17) - 0.01, -0.17);
  mouse.add(shellM, soleM, split, across, wheel);
  mouse.position.set(1.8, top + 0.015, 0.95);
  desktop.add(mouse);
  parts.mouse = mouse;

  // UPS under the desk: status lights and a screen on the front, sockets on the side.
  const ups = new THREE.Group();
  ups.add(rbox(0.8, 0.9, 1.4, 0x1d1a24, 0.05));
  const upsFront = at(decal(0.8, 0.9, (g, W, H) => {
    rr(g, W * 0.18, H * 0.14, W * 0.64, H * 0.2, 6, '#9fd3a8');
    g.fillStyle = '#1d3a24';
    for (let i = 0; i < 4; i++) g.fillRect(W * (0.24 + i * 0.14), H * 0.19, W * 0.1, H * 0.1);
    jack(g, W * 0.5, H * 0.5, W * 0.09, '#3a3344');
    g.strokeStyle = '#ffbe00';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(W * 0.5, H * 0.5, W * 0.05, -Math.PI * 0.3, Math.PI * 1.3);
    g.moveTo(W * 0.5, H * 0.43);
    g.lineTo(W * 0.5, H * 0.5);
    g.stroke();
    jack(g, W * 0.3, H * 0.66, W * 0.03, '#2ec46b');
    jack(g, W * 0.7, H * 0.66, W * 0.03, '#ffbe00');
    slots(g, W * 0.15, H * 0.76, W * 0.7, H * 0.18, 5, '#0d0b12');
  }, { px: 256 }), 0, 0, 0.702);
  const upsSide = at(decal(1.4, 0.9, (g, W, H) => {
    // Two square-pin wall sockets.
    for (const x of [0.3, 0.7]) {
      rr(g, W * x - H * 0.26, H * 0.24, H * 0.52, H * 0.52, 10, '#f1f3f5');
      g.fillStyle = '#24182e';
      g.fillRect(W * x - H * 0.03, H * 0.31, H * 0.06, H * 0.13);
      g.fillRect(W * x - H * 0.17, H * 0.54, H * 0.12, H * 0.05);
      g.fillRect(W * x + H * 0.05, H * 0.54, H * 0.12, H * 0.05);
    }
  }, { px: 180 }), 0.402, 0, 0);
  upsSide.rotation.y = Math.PI / 2;
  ups.add(upsFront, upsSide);
  ups.position.set(3.4, 0.45, 1.0);
  desktop.add(ups);
  parts.ups = ups;

  // Cables: every device plugs into the back of the system unit; the system unit into the UPS.
  const tb = -0.6 - 1.2; // back of the system unit
  desktop.add(
    cable([[-0.4, top + 1.3, -1.36], [-0.35, top + 0.6, -1.5], [0.2, top + 0.03, -1.85], [2.0, top + 0.03, -2.05], [2.95, top + 0.9, tb - 0.15], [3.1, top + 1.4, tb - 0.02]], 0x2a2232, 0.035),
    cable([[-0.5, top + 0.06, 0.32], [-0.3, top + 0.03, -0.1], [1.1, top + 0.03, -0.7], [2.5, top + 0.03, -2.0], [3.3, top + 0.9, tb - 0.12], [3.4, top + 1.05, tb - 0.02]], 0x3a2b47, 0.025),
    cable([[1.8, top + 0.03, 0.62], [1.8, top + 0.03, 0.4], [2.2, top + 0.03, -0.2], [2.5, top + 0.03, -1.7], [3.2, top + 0.7, tb - 0.15], [3.5, top + 0.95, tb - 0.02]], 0xd9d3de, 0.02),
    cable([[3.7, top + 0.5, tb - 0.02], [3.7, top + 0.2, tb - 0.25], [3.7, top - 0.1, -2.35], [3.6, 0.9, -2.3], [3.5, 0.7, -0.3], [3.4, 0.7, 0.28]], 0x111118, 0.04),
    cable([[3.2, 0.3, 0.29], [3.1, 0.03, 0.0], [2.6, 0.03, -1.4], [2.0, 0.03, -2.6]], 0x111118, 0.04)
  );

  // ---------- Laptop ----------
  const laptop = new THREE.Group();
  laptop.visible = false;
  scene.add(laptop);
  makeDesk(laptop);

  const base = rbox(3.6, 0.16, 2.4, 0xadb5bd, 0.06);
  base.position.set(0, top + 0.08, 0.3);
  laptop.add(base);
  parts.base = base;
  // Deck: speaker grilles beside the keys and a battery light.
  const deck = at(decal(3.6, 2.4, (g, W, H) => {
    rr(g, W * 0.07, H * 0.05, W * 0.86, H * 0.5, 10, 'rgba(36,24,46,0.12)');
    g.fillStyle = 'rgba(36,24,46,0.35)';
    for (const sx of [0.035, 0.95])
      for (let r = 0; r < 16; r++)
        for (let c2 = 0; c2 < 2; c2++) {
          g.beginPath();
          g.arc(W * (sx + c2 * 0.012), H * (0.08 + r * 0.028), 2.2, 0, Math.PI * 2);
          g.fill();
        }
    jack(g, W * 0.9, H * 0.94, 5, '#2ec46b');
  }, { px: 512 }), 0, top + 0.162, 0.3);
  deck.rotation.x = -Math.PI / 2;
  // Ports on the right side: charger, USB, HDMI and an audio jack.
  const ports = at(decal(2.4, 0.16, (g, W, H) => {
    jack(g, W * 0.12, H * 0.5, H * 0.26, '#3a3344');
    usbPort(g, W * 0.24, H * 0.3, W * 0.07, H * 0.4);
    usbPort(g, W * 0.34, H * 0.3, W * 0.07, H * 0.4);
    g.fillStyle = '#120c18';
    g.beginPath();
    g.moveTo(W * 0.45, H * 0.3); g.lineTo(W * 0.54, H * 0.3); g.lineTo(W * 0.53, H * 0.7); g.lineTo(W * 0.46, H * 0.7);
    g.fill();
    jack(g, W * 0.62, H * 0.5, H * 0.2, '#3a3344');
    slots(g, W * 0.72, H * 0.2, W * 0.2, H * 0.7, 3, 'rgba(0,0,0,0.35)');
  }, { px: 64 }), 1.802, top + 0.08, 0.3);
  ports.rotation.y = Math.PI / 2;
  laptop.add(deck, ports);

  const lapkeys = new THREE.Group();
  const lk = keycaps(LAP_KEYS, { u: 0.2, h: 0.028, color: 0x2b2233, modColor: 0x2b2233, legend: '#F1F3F5' });
  lapkeys.add(lk.group);
  lapkeys.position.set(0, top + 0.16, -0.08);
  laptop.add(lapkeys);
  parts.lapkeys = lapkeys;

  const touchpad = new THREE.Group();
  touchpad.add(rbox(1.1, 0.02, 0.62, 0xc3c9cf, 0.01));
  const tpLine = at(decal(1.1, 0.62, (g, W, H) => {
    g.fillStyle = 'rgba(36,24,46,0.25)';
    g.fillRect(W * 0.04, H * 0.78, W * 0.92, 2);
    g.fillRect(W * 0.5 - 1, H * 0.78, 2, H * 0.18);
  }, { px: 128 }), 0, 0.012, 0);
  tpLine.rotation.x = -Math.PI / 2;
  touchpad.add(tpLine);
  touchpad.position.set(0, top + 0.162, 1.05);
  laptop.add(touchpad);
  parts.touchpad = touchpad;

  // Hinge, and the lid: silver back, dark bezel, screen and webcam.
  laptop.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.1, 20), mat(0x6c757d)), 0, top + 0.2, -0.87));
  laptop.children.at(-1).rotation.z = Math.PI / 2;
  const hinge = new THREE.Group();
  hinge.position.set(0, top + 0.23, -0.87);
  const lidShell = rbox(3.6, 2.3, 0.08, 0xadb5bd, 0.05);
  lidShell.position.y = 1.15;
  const lidBezel = at(rbox(3.5, 2.22, 0.02, 0x1d1724, 0.03), 0, 1.16, 0.035);
  const lidScreenMat = mat(0x0b0b14, { emissive: 0x000000, roughness: 0.2 });
  const lidScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.95), lidScreenMat);
  lidScreen.position.set(0, 1.18, 0.047);
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 16), mat(0x111111, { roughness: 0.1 }));
  cam.rotation.x = Math.PI / 2;
  cam.position.set(0, 2.2, 0.048);
  const camLed = at(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8), mat(0x2ec46b, { emissive: 0x000000 })), 0.1, 2.2, 0.048);
  camLed.rotation.x = Math.PI / 2;
  // A plain emblem on the back of the lid (seen when it is closed).
  const emblem = at(decal(0.4, 0.4, (g, W) => {
    g.strokeStyle = '#5a4470';
    g.lineWidth = W * 0.08;
    g.beginPath();
    g.arc(W / 2, W / 2, W * 0.32, 0, Math.PI * 2);
    g.stroke();
    jack(g, W / 2, W / 2, W * 0.1, '#ca1f3f');
  }, { px: 64 }), 0, 1.15, -0.042);
  emblem.rotation.y = Math.PI;
  const lid = new THREE.Group();
  lid.add(lidShell, lidBezel, lidScreen, cam, camLed, emblem);
  hinge.add(lid);
  hinge.rotation.x = -0.25; // slightly past vertical = open
  laptop.add(hinge);
  parts.lid = lid;

  // Charger: from the side port to a power brick, then off the back of the desk.
  laptop.add(
    cable([[1.8, top + 0.08, -0.05], [2.05, top + 0.05, -0.1], [2.6, top + 0.03, -0.5], [3.0, top + 0.03, -1.05], [3.25, top + 0.05, -1.3]], 0x24182e, 0.025),
    at(rbox(0.5, 0.14, 0.32, 0x24182e, 0.04), 3.4, top + 0.07, -1.5),
    cable([[3.55, top + 0.05, -1.7], [3.7, top + 0.03, -2.1], [3.8, top - 0.1, -2.32], [3.8, 0.8, -2.35], [3.6, 0.03, -2.6]], 0x24182e, 0.03)
  );
  laptop.children.at(-2).rotation.y = 0.6;

  // ---------- Callouts & clicks ----------
  // Cards pinned to each part. Clicking a card does the same as clicking the part.
  const CALLOUTS = {
    desktop: [
      ['monitor', '🖥️', 'Monitor', 'Output: shows you the results', [0, 3.2, 0], -170, -40],
      ['tower', '🗄️', 'System unit', 'Process: the computer\'s brain', [0, 2.4, 0], 150, -60],
      ['keyboard', '⌨️', 'Keyboard', 'Input: type letters and numbers', [-1.4, 0.1, 0.3], -150, 80],
      ['mouse', '🖱️', 'Mouse', 'Input: point and click', [0, 0.1, 0], 60, 150],
      ['ups', '🔋', 'UPS', 'Keeps power on in "lights out"', [0, 0.3, 0.7], 170, -10],
    ],
    laptop: [
      ['lid', '💻', 'Screen', 'Output: folds over the keys', [0, 2.3, 0], -150, -50],
      ['lapkeys', '⌨️', 'Keyboard', 'Input: built in', [-1.2, 0, -0.3], -170, 70],
      ['touchpad', '👆', 'Touchpad', 'Input: the built-in mouse', [0, 0, 0.3], 60, 110],
      ['base', '🔋', 'Base', 'Processor and battery inside', [1.8, 0.08, 0.4], 160, 30],
    ],
  };
  let mode = 'desktop';
  const cards = {};
  function drawCallouts() {
    Object.values(cards).forEach((c) => c.remove());
    for (const [key, icon, title, text, at, dx, dy] of CALLOUTS[mode]) {
      cards[key] = stage.callout(parts[key], { icon, title, text, at, dx, dy, onClick: () => select(key) });
      if (ui.isDone('part-' + key)) cards[key].card.classList.add('done');
    }
  }

  function select(key) {
    const [title, text] = PARTS[key];
    ui.info(title, `<p>${text}</p>`);
    flash(parts[key]);
    ui.complete('part-' + key);
    cards[key]?.card.classList.add('done');
  }
  for (const key of Object.keys(parts)) stage.clickable(parts[key], () => select(key));

  // A quick "pop" of every piece of the part (each keeps its own shape).
  function flash(obj) {
    const meshes = [];
    obj.traverse((m) => {
      if (!m.isMesh || m.userData.isInk) return;
      m.userData.s0 ??= m.scale.clone();
      meshes.push(m);
    });
    stage.tween((k) => meshes.forEach((m) => m.scale.copy(m.userData.s0).multiplyScalar(1 + Math.sin(k * Math.PI) * 0.06)), 0.5);
  }

  // ---------- Power + IPO animation ----------
  let powered = false;
  // A tiny desktop drawn on the screen when the computer is on.
  const deskTex = (() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 288;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 512, 288);
    grd.addColorStop(0, '#24182E');
    grd.addColorStop(1, '#5A4470');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 288);
    g.fillStyle = 'rgba(255,190,0,0.9)';
    g.beginPath();
    g.arc(410, 90, 40, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(202,31,63,0.5)';
    g.beginPath();
    g.moveTo(0, 250); g.quadraticCurveTo(180, 170, 360, 230); g.quadraticCurveTo(450, 255, 512, 210); g.lineTo(512, 288); g.lineTo(0, 288);
    g.fill();
    ['#E9C46A', '#4361EE', '#F77F00', '#2EC4B6'].forEach((col, i) => {
      rr(g, 20, 16 + i * 52, 34, 28, 5, col);
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.fillRect(18, 48 + i * 52, 38, 4);
    });
    // A small window, and the taskbar with a start button and clock.
    rr(g, 140, 40, 220, 140, 6, '#F8F9FA');
    rr(g, 140, 40, 220, 20, 6, '#E9ECEF');
    g.fillStyle = '#E63946';
    g.fillRect(336, 40, 24, 20);
    g.fillStyle = '#adb5bd';
    for (let i = 0; i < 6; i++) g.fillRect(156, 74 + i * 16, 150 + ((i * 37) % 40), 6);
    g.fillStyle = 'rgba(36,24,46,0.85)';
    g.fillRect(0, 262, 512, 26);
    rr(g, 8, 266, 18, 18, 4, '#FFBE00');
    g.fillStyle = '#fff';
    g.font = '600 13px system-ui, sans-serif';
    g.fillText('10:30', 466, 280);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  // A switched-off screen: dark glass with a soft reflection.
  const offTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 128, 128);
    grd.addColorStop(0, '#15121c');
    grd.addColorStop(0.42, '#2a2535');
    grd.addColorStop(0.5, '#15121c');
    grd.addColorStop(1, '#0b0b14');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  screenMat.map = lidScreenMat.map = offTex;
  screenMat.color.setHex(0xffffff);
  lidScreenMat.color.setHex(0xffffff);
  function setScreen(on) {
    const m = mode === 'desktop' ? screenMat : lidScreenMat;
    m.map = on ? deskTex : offTex;
    m.color.setHex(0xffffff);
    m.emissive.setHex(on ? 0x1a1424 : 0x000000);
    m.needsUpdate = true;
    if (mode === 'desktop') {
      pwr.material.emissive.setHex(on ? 0x22cc55 : 0x000000);
      monLed.material.emissive.setHex(on ? 0x2266ff : 0x000000);
    } else camLed.material.emissive.setHex(on ? 0x22cc55 : 0x000000);
  }

  const packet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 14), mat(COLORS.gold, { emissive: COLORS.gold, emissiveIntensity: 0.8 }));
  packet.visible = false;
  scene.add(packet);

  async function travel(points, stepLabel) {
    packet.visible = true;
    for (let i = 0; i < points.length - 1; i++) {
      const a = new THREE.Vector3(...points[i]);
      const b = new THREE.Vector3(...points[i + 1]);
      ui.info('Input → Process → Output', stepLabel[i]);
      await stage.tween((k) => {
        packet.position.lerpVectors(a, b, k);
        packet.position.y += Math.sin(k * Math.PI) * 0.8;
      }, 1.1);
    }
    packet.visible = false;
  }

  async function runIPO() {
    stage.reveal();
    if (!powered) await power(true);
    const steps = [
      '<p><b>1. INPUT</b> — you press a key. The signal leaves the keyboard…</p>',
      '<p><b>2. PROCESS</b> — the processor works out what the key means…</p>',
    ];
    const pts =
      mode === 'desktop'
        ? [[-0.5, 2.2, 0.9], [3.4, 3.6, -0.6], [-0.4, 3.9, -1.0]]
        : [[0, 2.3, 0.0], [0, 2.1, 0.3], [0, 3.3, -1.0]];
    await travel(pts, steps);
    setScreen(true);
    const m = mode === 'desktop' ? screenMat : lidScreenMat;
    await stage.tween((k) => m.emissive.setRGB(0.1 + Math.abs(Math.sin(k * Math.PI * 3)) * 0.35, 0.08 + Math.abs(Math.sin(k * Math.PI * 3)) * 0.25, 0.1), 0.9);
    m.emissive.setHex(0x1a1424);
    ui.complete('ipo');
    ui.info('Input → Process → Output', '<p><b>3. OUTPUT</b> — the letter appears on the screen. Just like the corn mill: corn in, grinding, corn meal out!</p>');
  }

  async function power(on) {
    powered = on;
    if (!on) ui.complete('shutdown');
    if (mode === 'laptop') {
      const from = hinge.rotation.x;
      const to = on ? -0.25 : Math.PI / 2 - 0.06; // closed = folded down onto the keyboard
      await stage.tween((k) => (hinge.rotation.x = from + (to - from) * k), 0.9);
    }
    setScreen(on);
    ui.info(
      on ? 'Safe startup' : 'Safe shutdown',
      on
        ? mode === 'desktop'
          ? '<p>Wall switch → UPS → System Unit power button → monitor. Then <b>wait 30–60 seconds</b> with hands off.</p>'
          : '<p>Lift the lid gently from the centre, check the charger if the battery is low, press the power key once and wait.</p>'
        : '<p>Always use <b>Start → Power → Shut down</b>. Never switch off at the wall while the computer is working.</p>'
    );
  }

  // ---------- Controls ----------
  const modeGroup = ui.group('Machine');
  const bDesk = ui.button('🖥️ Desktop', () => setMode('desktop'), { group: modeGroup });
  const bLap = ui.button('💻 Laptop', () => setMode('laptop'), { group: modeGroup });
  const act = ui.group('Try it');
  const bPow = ui.button('⏻ Power on', () => power(!powered).then(() => (bPow.textContent = powered ? '⏻ Shut down' : '⏻ Power on')), { group: act });
  ui.button('▶ Input → Process → Output', () => runIPO().then(() => (bPow.textContent = '⏻ Shut down')), { primary: true, group: act });

  function setMode(m) {
    if (mode !== m) setScreen(false); // switch off the machine we are leaving
    mode = m;
    powered = false;
    setScreen(false);
    bPow.textContent = '⏻ Power on';
    desktop.visible = m === 'desktop';
    laptop.visible = m === 'laptop';
    hinge.rotation.x = -0.25;
    ui.toggle([bDesk, bLap], m === 'desktop' ? bDesk : bLap);
    drawCallouts();
    ui.info(
      m === 'desktop' ? 'Desktop computer' : 'Laptop computer',
      m === 'desktop'
        ? '<p>Four separate units joined by cables: monitor, system unit, keyboard and mouse. <b>Click any part</b> to learn its job.</p>'
        : '<p>Everything is built together. The screen folds over the keyboard and a touchpad replaces the mouse. <b>Click any part</b>.</p>'
    );
  }
  setMode('desktop');
}

export const config = { camera: [6, 7, 10], target: [0.5, 3, 0], shadowSize: 8 };

export const missions = [
  { id: 'part-monitor', text: 'Click the monitor (the screen).', hint: 'It is an OUTPUT device: it shows you the results.' },
  { id: 'part-keyboard', text: 'Click the keyboard.', hint: 'It is an INPUT device: you put information in.' },
  { id: 'part-tower', text: 'Click the system unit (the tall box).', hint: 'This is where the PROCESSING happens, like the grinding in a corn mill.' },
  { id: 'ipo', text: 'Press the red "Input → Process → Output" button and watch.', hint: 'Follow the glowing ball from the keyboard to the screen.' },
  { id: 'part-touchpad', text: 'Switch to the Laptop and click its touchpad.', hint: 'Use the "Laptop" button first.' },
  { id: 'shutdown', text: 'Shut the computer down the safe way.', hint: 'Power it on first, then press "Shut down".' },
];
