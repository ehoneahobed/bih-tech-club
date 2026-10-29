// Session 1 — Meet Your Computer: explore desktop vs laptop parts and watch
// Input -> Process -> Output travel through the machine.
import { THREE, COLORS, box, mat, label } from './runtime.js';

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

export default function computerLab(stage, ui) {
  const { scene } = stage;
  const parts = {};

  // ---------- Desktop ----------
  const desktop = new THREE.Group();
  scene.add(desktop);

  const desk = box(9, 0.3, 4.5, 0xc8a27a);
  desk.position.y = 1.85;
  desktop.add(desk);
  for (const [x, z] of [[-4.2, -2], [4.2, -2], [-4.2, 2], [4.2, 2]]) {
    const leg = box(0.25, 1.85, 0.25, 0x8d6e4c);
    leg.position.set(x, 0.92, z);
    desktop.add(leg);
  }
  const top = 2.0;

  const monitor = new THREE.Group();
  const bezel = box(4.2, 2.6, 0.18, COLORS.dark);
  bezel.position.y = 1.9;
  const screenMat = mat(0x0b0b14, { emissive: 0x000000, roughness: 0.2 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 2.3), screenMat);
  screen.position.set(0, 1.9, 0.095);
  const neck = box(0.25, 0.7, 0.2, 0x444450);
  neck.position.y = 0.35;
  const foot = box(1.4, 0.08, 0.8, 0x444450);
  monitor.add(bezel, screen, neck, foot);
  monitor.position.set(-0.4, top, -1.1);
  desktop.add(monitor);
  parts.monitor = monitor;

  const tower = new THREE.Group();
  const shell = box(1.1, 2.4, 2.4, 0x2b2d42);
  shell.position.y = 1.2;
  const pwr = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 24), mat(0x88ff99, { emissive: 0x000000 }));
  pwr.rotation.x = Math.PI / 2;
  pwr.position.set(0, 1.9, 1.21);
  tower.add(shell, pwr);
  tower.position.set(3.4, top, -0.6);
  desktop.add(tower);
  parts.tower = tower;

  const keyboard = new THREE.Group();
  keyboard.add(box(3.4, 0.12, 1.15, 0x2b2d42));
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 13; c++) {
      const k = box(0.2, 0.08, 0.2, 0xf1f3f5);
      k.position.set(-1.45 + c * 0.242, 0.1, -0.4 + r * 0.26);
      keyboard.add(k);
    }
  keyboard.position.set(-0.5, top + 0.06, 0.9);
  desktop.add(keyboard);
  parts.keyboard = keyboard;

  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16), mat(0xf1f3f5));
  mouse.scale.set(0.8, 0.45, 1.25);
  mouse.position.set(1.8, top + 0.12, 0.95);
  mouse.castShadow = true;
  desktop.add(mouse);
  parts.mouse = mouse;

  const ups = box(0.8, 0.9, 1.4, 0x111118);
  ups.position.set(3.4, 0.45, 1.0);
  desktop.add(ups);
  parts.ups = ups;

  // ---------- Laptop ----------
  const laptop = new THREE.Group();
  laptop.visible = false;
  scene.add(laptop);
  const ldesk = desk.clone();
  laptop.add(ldesk);
  desktop.children.filter((c) => c !== desk && c.geometry?.parameters?.height === 1.85).forEach((leg) => laptop.add(leg.clone()));

  const base = box(3.6, 0.16, 2.4, 0xadb5bd);
  base.position.set(0, top + 0.08, 0.3);
  laptop.add(base);
  parts.base = base;

  const lapkeys = new THREE.Group();
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 12; c++) {
      const k = box(0.2, 0.04, 0.2, 0x2b2d42);
      k.position.set(-1.33 + c * 0.242, 0, -0.45 + r * 0.25);
      lapkeys.add(k);
    }
  lapkeys.position.set(0, top + 0.18, -0.05);
  laptop.add(lapkeys);
  parts.lapkeys = lapkeys;

  const touchpad = box(1.1, 0.02, 0.6, 0xced4da);
  touchpad.position.set(0, top + 0.17, 1.05);
  laptop.add(touchpad);
  parts.touchpad = touchpad;

  const hinge = new THREE.Group();
  hinge.position.set(0, top + 0.16, -0.9);
  const lidShell = box(3.6, 2.3, 0.1, 0xadb5bd);
  lidShell.position.y = 1.15;
  const lidScreenMat = mat(0x0b0b14, { emissive: 0x000000, roughness: 0.2 });
  const lidScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.0), lidScreenMat);
  lidScreen.position.set(0, 1.15, 0.051);
  const cam = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), mat(0x111111));
  cam.position.set(0, 2.2, 0.06);
  const lid = new THREE.Group();
  lid.add(lidShell, lidScreen, cam);
  hinge.add(lid);
  hinge.rotation.x = -0.25; // slightly past vertical = open
  laptop.add(hinge);
  parts.lid = lid;

  // ---------- Labels & clicks ----------
  const tags = new THREE.Group();
  scene.add(tags);
  const tagSpec = {
    desktop: [['Monitor', [-0.4, 5.3, -1.1]], ['System Unit', [3.4, 5.0, -0.6]], ['Keyboard', [-0.5, 2.7, 1.6]], ['Mouse', [1.9, 2.7, 1.4]], ['UPS', [3.4, 1.4, 1.9]]],
    laptop: [['Screen', [0, 4.9, -1.2]], ['Keyboard', [-2.5, 2.7, 0.0]], ['Touchpad', [0, 2.6, 1.9]], ['Base + Battery', [2.7, 2.6, 0.9]]],
  };
  let mode = 'desktop';
  function drawTags() {
    tags.clear();
    for (const [t, p] of tagSpec[mode]) {
      const l = label(t, { scale: 0.42 });
      l.position.set(...p);
      tags.add(l);
    }
  }

  for (const [key, obj] of Object.entries(parts)) {
    stage.clickable(obj, () => {
      const [title, text] = PARTS[key];
      ui.info(title, `<p>${text}</p>`);
      flash(obj);
    });
  }

  function flash(obj) {
    const meshes = [];
    obj.traverse((m) => m.isMesh && meshes.push(m));
    stage.tween((k) => meshes.forEach((m) => m.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.06)), 0.5);
  }

  // ---------- Power + IPO animation ----------
  let powered = false;
  function setScreen(on) {
    const m = mode === 'desktop' ? screenMat : lidScreenMat;
    m.color.setHex(on ? 0x4361ee : 0x0b0b14);
    m.emissive.setHex(on ? 0x2a3fb0 : 0x000000);
    if (mode === 'desktop') pwr.material.emissive.setHex(on ? 0x22cc55 : 0x000000);
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
    await stage.tween((k) => m.emissive.setRGB(0.16 + Math.sin(k * Math.PI * 3) * 0.3, 0.25, 0.7), 0.9);
    ui.info('Input → Process → Output', '<p><b>3. OUTPUT</b> — the letter appears on the screen. Just like the corn mill: corn in, grinding, corn meal out!</p>');
  }

  async function power(on) {
    powered = on;
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
    mode = m;
    powered = false;
    setScreen(false);
    bPow.textContent = '⏻ Power on';
    desktop.visible = m === 'desktop';
    laptop.visible = m === 'laptop';
    hinge.rotation.x = -0.25;
    ui.toggle([bDesk, bLap], m === 'desktop' ? bDesk : bLap);
    drawTags();
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
