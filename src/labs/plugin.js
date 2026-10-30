// Session 7 — Plug It In: connect devices to the right ports, pair a Bluetooth
// headset and set up a projector with Windows + P.
// 1. Connect 5 devices to the right ports.
// 2. Pair the Bluetooth headset.
// 3. Set the projector to Duplicate for a presentation, and explain Extend.
import { THREE, COLORS, box, rbox, mat, decal, cable, label, setLabel } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The ports on the back of the system unit: [id, kind, label, x, y, w, h] (local to the back panel).
const PORTS = [
  ['usb1', 'usba', 'USB-A 1', -0.62, 3.1, 0.3, 0.12],
  ['usb2', 'usba', 'USB-A 2', -0.24, 3.1, 0.3, 0.12],
  ['usb3', 'usba', 'USB-A 3', -0.62, 2.72, 0.3, 0.12],
  ['usb4', 'usba', 'USB-A 4', -0.24, 2.72, 0.3, 0.12],
  ['usbc', 'usbc', 'USB-C', 0.18, 3.1, 0.2, 0.08],
  ['hdmi', 'hdmi', 'HDMI', 0.58, 3.1, 0.36, 0.13],
  ['vga', 'vga', 'VGA', 0.42, 2.72, 0.56, 0.2],
  ['eth', 'eth', 'Ethernet', -0.5, 2.3, 0.3, 0.26],
  ['green', 'audio', 'Audio (green)', 0.18, 2.3, 0.14, 0.14],
  ['pink', 'mic', 'Mic (pink)', 0.52, 2.3, 0.14, 0.14],
  ['power', 'power', 'Power', 0.35, 0.55, 0.46, 0.3],
];
const PORT_NAMES = { usba: 'USB-A', usbc: 'USB-C', hdmi: 'HDMI', vga: 'VGA', eth: 'Ethernet', audio: 'audio jack (green)', mic: 'microphone jack (pink)', power: 'power socket' };
const PLUG_TIPS = {
  usba: 'A <b>USB-A</b> plug is a flat rectangle that only fits one way up. It goes in a <b>USB-A</b> port.',
  usbc: 'A <b>USB-C</b> plug is a small oval that fits either way up. It goes in the <b>USB-C</b> port.',
  hdmi: 'An <b>HDMI</b> plug is wide with two cut corners. It goes in the <b>HDMI</b> port.',
  vga: 'A <b>VGA</b> plug is blue, with 15 pins and 2 screws. It goes in the blue <b>VGA</b> port.',
  eth: 'An <b>Ethernet</b> plug is square-ish and clicks in. It goes in the <b>Ethernet</b> (network) port.',
  audio: 'A headset plug is a thin round <b>3.5 mm</b> pin. Sound goes out through the <b>green</b> jack.',
  power: 'The <b>power cable</b> fits only the power socket. Plug it in with dry hands, and let an adult handle the wall socket.',
};
// Devices and their cables.
const DEVS = {
  power: { name: 'Power cable', icon: '🔌', plug: 'power', color: 0x24182e, kind: 'Power', why: 'Without power nothing works! The power cable goes in the <b>power socket</b> at the bottom, where the power supply is.' },
  monitor: { name: 'Monitor', icon: '🖥️', plug: 'hdmi', color: 0x24182e, kind: 'Output', why: 'The monitor is an <b>output</b> device. Its <b>HDMI</b> cable carries picture and sound.' },
  keyboard: { name: 'Keyboard', icon: '⌨️', plug: 'usba', color: 0x24182e, kind: 'Input', why: 'The keyboard is an <b>input</b> device. It uses a <b>USB-A</b> port, the most common port of all.' },
  mouse: { name: 'Mouse', icon: '🖱️', plug: 'usba', color: 0x24182e, kind: 'Input', why: 'The mouse is an <b>input</b> device on a <b>USB-A</b> port.' },
  printer: { name: 'Printer', icon: '🖨️', plug: 'usba', color: 0x8a8f99, kind: 'Output', why: 'The printer is an <b>output</b> device. Its cable has a USB-A plug at the computer end.' },
  webcam: { name: 'Webcam', icon: '📷', plug: 'usba', color: 0x24182e, kind: 'Input', why: 'The webcam is an <b>input</b> device (pictures go in). It uses <b>USB-A</b>, and sits on top of the monitor.' },
  headset: { name: 'Wired headset', icon: '🎧', plug: 'audio', color: 0x2ec4b6, kind: 'Input & output', why: 'Sound goes <b>out</b> through the <b>green</b> audio jack. (A headset with a microphone does both input and output.)' },
  drive: { name: 'External drive', icon: '💾', plug: 'usbc', color: 0x24182e, kind: 'Storage', why: 'The external drive is a <b>storage</b> device. Its newer cable has a <b>USB-C</b> plug, which fits either way up.' },
  projector: { name: 'Projector', icon: '📽️', plug: 'vga', color: 0x3b6fd4, kind: 'Output', why: 'The projector is an <b>output</b> device. School projectors often use the blue <b>VGA</b> cable (picture only).' },
  network: { name: 'Network cable', icon: '🌐', plug: 'eth', color: 0xffbe00, kind: 'Network', why: 'The <b>Ethernet</b> cable from the router gives steadier internet than Wi-Fi. The plug clicks in.' },
};
const DEV_IDS = Object.keys(DEVS);
const MODES = {
  pc: { name: 'PC screen only', what: 'Only your own screen shows the picture. The projector is <b>blank</b>.' },
  dup: { name: 'Duplicate', what: 'The <b>same picture</b> on both screens. Best for showing the class: what you see, they see.' },
  ext: { name: 'Extend', what: 'One <b>big desktop</b> across both screens. You can drag a window across to the projector and keep your <b>notes on your own screen</b>, where the class cannot see them.' },
  second: { name: 'Second screen only', what: 'Only the <b>projector</b> shows the picture. Your own screen goes <b>black</b>.' },
};

// Set a font no bigger than size, and small enough for text to fit in maxW.
function fit(g, text, weight, size, maxW) {
  let px = size;
  do g.font = `${weight} ${px}px ${FONT}`;
  while (g.measureText(text).width > maxW && (px -= 1) > 8);
}
const rgeo = (w, h, d, r) => {
  const m = rbox(w, h, d, 0, r);
  m.material.dispose();
  return m.geometry;
};
const shadow = (o) => o.traverse((m) => m.isMesh && (m.castShadow = m.receiveShadow = true));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export default function plugLab(stage, ui) {
  const { scene } = stage;
  const T = 1.6; // desk top

  // ---------- Desk ----------
  const desk = rbox(9.4, 0.26, 4.8, 0xc8a27a, 0.05);
  desk.position.y = T - 0.13;
  scene.add(desk);
  const grain = decal(9.3, 4.7, (g, W, H) => {
    g.fillStyle = '#c8a27a';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,80,40,0.16)';
    g.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      const y = (i + 0.5) * (H / 22);
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x / 90 + i * 1.7) * 5);
      g.stroke();
    }
  }, { px: 256, transparent: false });
  grain.material.color.setScalar(0.85);
  grain.rotation.x = -Math.PI / 2;
  grain.position.y = T + 0.002;
  scene.add(grain);
  const legGeo = rgeo(0.24, T - 0.26, 0.24, 0.03);
  const legMat = mat(0x8a6a4a);
  for (const x of [-4.4, 4.4]) for (const z of [-2.1, 2.1]) {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.set(x, (T - 0.26) / 2, z);
    l.castShadow = true;
    scene.add(l);
  }

  // ---------- System unit, turned so its back (the ports) faces us ----------
  const tower = new THREE.Group();
  tower.position.set(2.75, T, -0.7);
  scene.add(tower);
  const TW = 1.9, TH = 3.6, TD = 2.2;
  const shell = rbox(TW, TH, TD, 0x4a3d58, 0.05, { roughness: 0.5, metalness: 0.15 });
  shell.position.y = TH / 2;
  tower.add(shell);
  const back = decal(TW - 0.1, TH - 0.1, (g, W, H) => {
    const s = W / (TW - 0.1);
    const X = (x) => (x + (TW - 0.1) / 2) * s, Y = (y) => (TH - 0.1 - y + 0.05) * s;
    g.fillStyle = '#3d3149';
    g.fillRect(0, 0, W, H);
    // The I/O shield
    g.fillStyle = '#b8bcc6';
    g.beginPath(); g.roundRect(X(-0.86), Y(3.4), 1.72 * s, 1.4 * s, 8); g.fill();
    g.fillStyle = '#24182e';
    g.font = `700 ${s * 0.085}px ${FONT}`;
    g.textAlign = 'center';
    for (const [, , name, x, y, , h] of PORTS) {
      if (name === 'Power') continue;
      g.fillText(name.replace(' (green)', '').replace(' (pink)', ''), X(x), Y(y - h / 2 - 0.08));
    }
    // Vents and the power supply area
    g.fillStyle = '#2b2233';
    for (let i = 0; i < 9; i++) g.fillRect(X(-0.75), Y(1.75 - i * 0.09), 1.5 * s, 0.035 * s);
    g.fillStyle = '#2b2233';
    g.beginPath(); g.roundRect(X(-0.86), Y(1.0), 1.72 * s, 0.85 * s, 8); g.fill();
    g.strokeStyle = '#5d4f6c';
    g.lineWidth = 3;
    g.beginPath(); g.arc(X(-0.4), Y(0.58), 0.3 * s, 0, 7); g.stroke();
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(X(-0.68), Y(0.58 + i * 0.1)); g.lineTo(X(-0.12), Y(0.58 + i * 0.1)); g.stroke(); }
    g.fillStyle = '#ffbe00';
    g.font = `700 ${s * 0.08}px ${FONT}`;
    g.fillText('POWER', X(0.35), Y(0.22));
  }, { px: 512, transparent: false });
  back.position.set(0, TH / 2, TD / 2 + 0.006);
  tower.add(back);
  // Port sockets (clickable)
  const portMeshes = {};
  const portColor = { usba: 0x120c18, usbc: 0x120c18, hdmi: 0x120c18, vga: 0x3b6fd4, eth: 0x120c18, audio: 0x2ec4b6, mic: 0xff7eb6, power: 0x120c18 };
  const tongue = mat(0x4a90d9);
  for (const [id, kind, , x, y, w, h] of PORTS) {
    const round = kind === 'audio' || kind === 'mic';
    const m = round
      ? new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.06, 18), mat(portColor[kind]))
      : new THREE.Mesh(rgeo(w, h, 0.06, kind === 'usbc' ? h / 2 : 0.015), mat(portColor[kind], { roughness: 0.4 }));
    if (round) {
      m.rotation.x = Math.PI / 2;
      const hole = new THREE.Mesh(new THREE.CircleGeometry(w * 0.22, 12), mat(0x0b090d));
      hole.position.y = 0.031;
      hole.rotation.x = -Math.PI / 2;
      m.add(hole);
    }
    if (kind === 'usba') {
      const t = box(w * 0.75, h * 0.28, 0.02, 0x4a90d9);
      t.material = tongue;
      t.position.set(0, h * 0.14, 0.025);
      t.userData.noInk = true;
      m.add(t);
    }
    m.position.set(x, y, TD / 2 + 0.03);
    m.userData.port = id;
    tower.add(m);
    portMeshes[id] = m;
  }
  const portWorld = (id) => portMeshes[id].getWorldPosition(new THREE.Vector3()).add(V(0, 0, 0.06));
  const towerLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(0x555566, { emissive: 0x000000 }));
  towerLed.position.set(0.7, TH - 0.2, TD / 2 + 0.02);
  tower.add(towerLed);

  // ---------- Monitor ----------
  const monitor = new THREE.Group();
  monitor.position.set(-0.6, T, -1.5);
  scene.add(monitor);
  const MW = 3.6, MH = 2.15;
  const mPanel = rbox(MW + 0.16, MH + 0.24, 0.12, 0x2a2232, 0.05);
  mPanel.position.y = 1.75;
  const mNeck = rbox(0.3, 1.0, 0.12, 0x3a3344, 0.04);
  mNeck.position.set(0, 0.55, -0.12);
  const mFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.74, 0.06, 32), mat(0x3a3344));
  mFoot.scale.z = 0.6;
  mFoot.position.set(0, 0.03, -0.1);
  const monScreen = decal(MW, MH, () => {}, { px: 360, transparent: false });
  monScreen.position.set(0, 1.77, 0.062);
  monitor.add(mPanel, mNeck, mFoot, monScreen);
  shadow(monitor);

  // ---------- Keyboard, mouse ----------
  const keyboard = new THREE.Group();
  keyboard.position.set(-0.6, T, 0.75);
  const kBody = rbox(2.9, 0.12, 0.95, 0x2a2232, 0.04);
  kBody.position.y = 0.06;
  const keys = decal(2.8, 0.85, (g, W, H) => {
    g.fillStyle = '#2a2232';
    g.fillRect(0, 0, W, H);
    const kw = W / 15.5;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) {
      if (r === 4 && c > 3 && c < 10) continue;
      g.fillStyle = '#f4f0f6';
      g.beginPath(); g.roundRect(c * kw + kw * 0.3, r * (H / 5) + 3, kw * 0.85, H / 5 - 6, 4); g.fill();
    }
    g.fillStyle = '#f4f0f6';
    g.beginPath(); g.roundRect(4 * kw + kw * 0.3, 4 * (H / 5) + 3, kw * 5.85, H / 5 - 6, 4); g.fill();
  }, { px: 128 });
  keys.rotation.x = -Math.PI / 2;
  keys.position.y = 0.125;
  keyboard.add(kBody, keys);
  scene.add(keyboard);
  const mouse = new THREE.Group();
  mouse.position.set(1.3, T, 0.85);
  const mBody = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), mat(0x2a2232, { roughness: 0.4 }));
  mBody.scale.set(0.75, 0.42, 1.1);
  mBody.position.y = 0.09;
  mouse.add(mBody);
  scene.add(mouse);

  // ---------- Printer (left end of the desk) ----------
  const printer = new THREE.Group();
  printer.position.set(-3.5, T, -1.2);
  printer.rotation.y = 0.35;
  const pBody = rbox(1.7, 0.75, 1.3, 0xd9d3de, 0.08);
  pBody.position.y = 0.375;
  const pTop = rbox(1.5, 0.08, 1.0, 0x5a4470, 0.03);
  pTop.position.set(0, 0.78, -0.05);
  const pTray = rbox(1.1, 0.05, 0.6, 0xf9f9f9, 0.02);
  pTray.position.set(0, 0.3, 0.85);
  const paper = rbox(0.9, 0.03, 0.5, 0xffffff, 0.01);
  paper.position.set(0, 0.34, 0.85);
  const printerLed = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(0x555566, { emissive: 0x000000 }));
  printerLed.position.set(0.6, 0.6, 0.66);
  printer.add(pBody, pTop, pTray, paper, printerLed);
  shadow(printer);
  scene.add(printer);

  // ---------- Projector and its screen ----------
  const projector = new THREE.Group();
  projector.position.set(-3.3, T, 1.05);
  const prBody = rbox(1.2, 0.42, 1.0, 0xf4f0f6, 0.08);
  prBody.position.y = 0.21;
  const lensRing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 20), mat(0x24182e));
  lensRing.rotation.x = Math.PI / 2;
  lensRing.position.set(-0.3, 0.22, -0.52);
  const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.14, 18), mat(0x5aa0ff, { emissive: 0x000000, roughness: 0.1 }));
  lensGlass.position.set(-0.3, 0.22, -0.585);
  lensGlass.rotation.y = Math.PI;
  const prLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), mat(0x555566, { emissive: 0x000000 }));
  prLed.position.set(0.4, 0.43, 0.3);
  projector.add(prBody, lensRing, lensGlass, prLed);
  shadow(projector);
  scene.add(projector);
  // Screen on a stand, behind the desk on the left.
  const scr = new THREE.Group();
  scr.position.set(-6.1, 0, -1.3);
  scr.rotation.y = 0.8;
  // Point the projector's lens (its -z side) at the screen.
  projector.rotation.y = Math.atan2(-(scr.position.x - projector.position.x), -(scr.position.z - projector.position.z));
  const SW = 3.6, SH = 2.1;
  const casing = rbox(SW + 0.3, 0.16, 0.16, 0x5a4470, 0.06);
  casing.position.y = 3.25 + SH + 0.08;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.3 + SH, 10), mat(0x24182e));
  pole.position.set(0, (3.3 + SH) / 2, -0.06);
  const tripod = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.4, 3), mat(0x24182e));
  tripod.position.y = 0.2;
  const cloth = decal(SW, SH, () => {}, { px: 300, transparent: false });
  cloth.position.set(0, 3.25, 0.02);
  const clothBack = rbox(SW + 0.08, SH + 0.08, 0.03, 0xf9f9f9, 0.01);
  clothBack.position.set(0, 3.25, 0);
  scr.add(casing, pole, tripod, clothBack, cloth);
  shadow(scr);
  scene.add(scr);
  // The light beam from the lens to the screen (only when projecting).
  const beamGeo = new THREE.BufferGeometry();
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffbe00, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.userData.noInk = true;
  beam.visible = false;
  scene.add(beam);
  function buildBeam() {
    scene.updateMatrixWorld(true);
    const p = lensGlass.getWorldPosition(new THREE.Vector3());
    const c = [[-SW / 2, SH / 2], [SW / 2, SH / 2], [SW / 2, -SH / 2], [-SW / 2, -SH / 2]].map(([x, y]) => cloth.localToWorld(V(x * 0.98, y * 0.98, 0.01)));
    const pos = [];
    for (let i = 0; i < 4; i++) pos.push(p.x, p.y, p.z, c[i].x, c[i].y, c[i].z, c[(i + 1) % 4].x, c[(i + 1) % 4].y, c[(i + 1) % 4].z);
    beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    beamGeo.computeVertexNormals();
  }

  // ---------- Headsets, webcam, drive ----------
  const headset = new THREE.Group();
  const bandGeo = new THREE.TorusGeometry(0.42, 0.05, 8, 24, Math.PI);
  const cupGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 18);
  const makeHeadset = (g, color) => {
    const m = mat(color);
    const band = new THREE.Mesh(bandGeo, m);
    band.position.y = 0.42;
    g.add(band);
    for (const x of [-0.42, 0.42]) {
      const cup = new THREE.Mesh(cupGeo, mat(0x24182e));
      cup.rotation.z = Math.PI / 2;
      cup.position.set(x, 0.2, 0);
      g.add(cup);
    }
    shadow(g);
  };
  makeHeadset(headset, 0x2ec4b6);
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), mat(0x24182e));
  mic.position.set(0.32, 0.08, 0.2);
  mic.rotation.set(1.2, 0, 0.6);
  headset.add(mic);
  headset.position.set(1.25, T + 0.01, -1.4);
  headset.rotation.y = -0.3;
  scene.add(headset);
  const bt = new THREE.Group();
  makeHeadset(bt, COLORS.red);
  const btLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(0x555566, { emissive: 0x000000 }));
  btLed.position.set(0.5, 0.22, 0);
  bt.add(btLed);
  bt.position.set(-1.45, T + 0.01, 1.85);
  bt.rotation.y = 0.4;
  scene.add(bt);
  const btTag = label('', { scale: 0.45, bg: '#24182E', color: '#FFBE00' });
  btTag.position.set(0, 0.9, 0);
  bt.add(btTag);

  const webcam = new THREE.Group();
  const wcBody = rbox(0.6, 0.26, 0.26, 0x24182e, 0.1);
  wcBody.position.y = 0.2;
  const wcLens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), mat(0x3b6fd4, { roughness: 0.1 }));
  wcLens.rotation.x = Math.PI / 2;
  wcLens.position.set(0, 0.2, 0.135);
  const wcLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(0x555566, { emissive: 0x000000 }));
  wcLed.position.set(0.18, 0.2, 0.135);
  const wcClip = rbox(0.3, 0.08, 0.3, 0x24182e, 0.02);
  wcClip.position.y = 0.04;
  webcam.add(wcBody, wcLens, wcLed, wcClip);
  shadow(webcam);
  const webcamHome = V(0.35, T, 0.0);
  webcam.position.copy(webcamHome);
  scene.add(webcam);

  const drive = new THREE.Group();
  const dBody = rbox(0.6, 0.16, 0.9, 0x24182e, 0.06);
  dBody.position.y = 0.08;
  const dTop = decal(0.5, 0.8, (g, W, H) => {
    g.fillStyle = '#24182e';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffbe00';
    g.textAlign = 'center';
    g.font = `700 ${W * 0.18}px ${FONT}`;
    g.fillText('1 TB', W / 2, H * 0.45);
    g.fillStyle = '#d9d3de';
    g.font = `500 ${W * 0.12}px ${FONT}`;
    g.fillText('USB-C', W / 2, H * 0.62);
  }, { px: 96 });
  dTop.rotation.x = -Math.PI / 2;
  dTop.position.y = 0.162;
  const dLed = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0x555566, { emissive: 0x000000 }));
  dLed.position.set(0.2, 0.16, 0.4);
  drive.add(dBody, dTop, dLed);
  shadow(drive);
  drive.position.set(2.05, T, 1.45);
  drive.rotation.y = 0.3;
  scene.add(drive);

  // ---------- Router and power strip (where the network and power cables come from) ----------
  const router = new THREE.Group();
  const rBody = rbox(1.1, 0.24, 0.7, 0xf4f0f6, 0.06);
  rBody.position.y = 0.12;
  router.add(rBody);
  for (const x of [-0.4, 0.4]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.7, 8), mat(0x24182e));
    a.position.set(x, 0.55, -0.3);
    router.add(a);
  }
  const routerLeds = [];
  for (let i = 0; i < 4; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(i < 2 ? 0x2ec4b6 : 0x555566, { emissive: i < 2 ? 0x2ec4b6 : 0x000000, emissiveIntensity: 0.8 }));
    l.position.set(-0.3 + i * 0.2, 0.2, 0.35);
    router.add(l);
    routerLeds.push(l);
  }
  shadow(router);
  router.position.set(4.0, T, -1.9);
  scene.add(router);
  const strip = rbox(1.4, 0.16, 0.34, 0xf4f0f6, 0.05);
  strip.position.set(3.7, 0.08, 1.4);
  scene.add(strip);
  const stripLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.8 }));
  stripLed.position.set(3.15, 0.18, 1.4);
  scene.add(stripLed);

  // Where each device's cable starts, and where its loose plug lies before it is connected.
  const anchors = {
    power: () => V(3.4, 0.16, 1.4),
    monitor: () => monitor.localToWorld(V(0.3, 1.3, -0.12)),
    keyboard: () => keyboard.localToWorld(V(0.9, 0.08, -0.48)),
    mouse: () => mouse.localToWorld(V(0, 0.06, -0.24)),
    printer: () => printer.localToWorld(V(0.5, 0.3, -0.66)),
    webcam: () => webcam.localToWorld(V(0.3, 0.2, 0)),
    headset: () => headset.localToWorld(V(0.42, 0.15, 0)),
    drive: () => drive.localToWorld(V(0, 0.08, -0.45)),
    projector: () => projector.localToWorld(V(0.6, 0.2, 0.2)),
    network: () => router.localToWorld(V(0.3, 0.12, 0.35)),
  };
  const loose = {
    power: V(3.9, T + 0.05, 0.75), monitor: V(0.4, T + 0.05, -1.25), keyboard: V(0.75, T + 0.05, 0.3), mouse: V(1.35, T + 0.05, 0.35),
    printer: V(-2.6, T + 0.05, -0.75), webcam: V(0.75, T + 0.05, 0.1), headset: V(1.75, T + 0.05, -1.0), drive: V(2.45, T + 0.05, 1.15),
    projector: V(-2.05, T + 0.05, 1.25), network: V(3.75, T + 0.05, -1.1),
  };
  // Each device has a plug and a cable (redrawn when it moves).
  const plugGeo = {
    usba: rgeo(0.2, 0.1, 0.24, 0.02), usbc: rgeo(0.14, 0.07, 0.22, 0.03), hdmi: rgeo(0.3, 0.12, 0.26, 0.02), vga: rgeo(0.46, 0.18, 0.24, 0.03),
    eth: rgeo(0.22, 0.2, 0.26, 0.02), audio: new THREE.CylinderGeometry(0.05, 0.05, 0.26, 10).rotateX(Math.PI / 2), power: rgeo(0.4, 0.26, 0.28, 0.04),
  };
  const plugs = {}, cables = {};
  for (const id of DEV_IDS) {
    const d = DEVS[id];
    const p = new THREE.Mesh(plugGeo[d.plug], mat(d.plug === 'vga' ? 0x3b6fd4 : d.plug === 'eth' ? 0xffbe00 : 0x24182e, { roughness: 0.45 }));
    p.castShadow = true;
    p.position.copy(loose[id]);
    p.position.y += d.plug === 'power' ? 0.13 : 0.06;
    scene.add(p);
    plugs[id] = p;
  }
  function drawCable(id) {
    if (cables[id]) { scene.remove(cables[id]); cables[id].geometry.dispose(); }
    const a = anchors[id](), b = plugs[id].position.clone();
    const tail = b.clone().add(V(0, 0, 0.16));
    const pts = [a, a.clone().lerp(b, 0.3).setY(Math.min(a.y, T) + 0.04), b.clone().lerp(a, 0.25).setY(Math.min(b.y, T) + 0.04), tail.clone().add(V(0, 0, 0.25)), tail];
    if (connected[id] == null) pts.splice(3, 2, b.clone().add(V(0, 0, 0)));
    const c = cable(pts.map((v) => v.toArray()), DEVS[id].color, 0.035);
    c.userData.noInk = true;
    scene.add(c);
    cables[id] = c;
  }

  // ---------- Callouts (most important first) ----------
  const portsSpot = new THREE.Object3D();
  portsSpot.position.set(-0.7, 2.9, TD / 2);
  tower.add(portsSpot);
  stage.callout(portsSpot, { icon: '🔌', title: 'Ports', text: 'Each plug fits only its own port.', dx: 40, dy: -150 });
  stage.callout(projector, { icon: '📽️', title: 'Projector', text: 'Windows + P chooses what it shows.', at: [0, 0.5, 0], dx: -60, dy: 110 });
  stage.callout(bt, { icon: '🔵', title: 'Bluetooth headset', text: 'No cable: pair it once.', at: [0, 0.8, 0], dx: 110, dy: 90 });
  stage.callout(monitor, { icon: '🖥️', title: 'Monitor', text: 'Output: shows the picture.', at: [-0.9, 2.85, 0], dx: -40, dy: -150 });
  stage.callout(printer, { icon: '🖨️', title: 'Printer', text: 'USB cable, or Wi-Fi for the whole room.', at: [-0.5, 0.8, 0], dx: -10, dy: 150 });

  // ======================================================================
  //  STATE AND SCREENS
  // ======================================================================
  const connected = {}; // device id -> port id
  const usedBy = {}; // port id -> device id
  const correct = new Set();
  let selected = null, busy = false;
  const bt$ = { pairing: false, on: false, searching: false, list: null, connected: false, stage: 'off' };
  let screenApp = 'desktop'; // desktop | settings | winp
  let mode = 'pc', projOn = false, projInput = 'VGA', extOk = false, winpOpen = false;
  const hasPower = () => connected.power === 'power';
  const monOn = () => hasPower() && connected.monitor === 'hdmi';
  const projSignal = () => hasPower() && projOn && connected.projector && PORTS.find((p) => p[0] === connected.projector)[1] === projInput.toLowerCase();

  const sg = (decalMesh) => { const c = decalMesh.material.map.image; return [c.getContext('2d'), c.width, c.height]; };
  function drawDesktop(g, W, H, opts = {}) {
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#5a4470');
    grd.addColorStop(1, '#24182e');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    // A slide window
    const slide = opts.slideOnly;
    const x = slide ? 0 : W * 0.12, y = slide ? 0 : H * 0.1, w = slide ? W : W * 0.76, h = slide ? H : H * 0.66;
    if (!slide) { g.fillStyle = '#f4f0f6'; g.fillRect(x, y, w, h * 0.09); g.fillStyle = '#24182e'; g.font = `500 ${h * 0.05}px ${FONT}`; g.textBaseline = 'middle'; g.fillText('Water_Project.pptx', x + w * 0.03, y + h * 0.045); }
    const sy = slide ? 0 : y + h * 0.09, sh = slide ? H : h * 0.91;
    g.fillStyle = '#ffffff';
    g.fillRect(x, sy, w, sh);
    g.fillStyle = '#ca1f3f';
    g.fillRect(x, sy, w, sh * 0.06);
    g.fillStyle = '#24182e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fit(g, 'Clean Water for Our Community', 700, sh * 0.13, w * 0.9);
    g.fillText('Clean Water for Our Community', x + w / 2, sy + sh * 0.3);
    fit(g, 'JHS 1 Science · Bozoma Model JHS', 400, sh * 0.08, w * 0.85);
    g.fillText('JHS 1 Science · Bozoma Model JHS', x + w / 2, sy + sh * 0.48);
    g.fillStyle = '#2ec4b6';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + w * (0.35 + i * 0.15), sy + sh * 0.72, sh * 0.08, 0, 7); g.fill(); }
    g.textAlign = 'left';
    if (!slide) {
      // Taskbar
      g.fillStyle = 'rgba(244,240,246,0.92)';
      g.fillRect(0, H * 0.9, W, H * 0.1);
      g.fillStyle = '#3b6fd4';
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.fillRect(W * 0.44 + i * H * 0.035, H * 0.92 + j * H * 0.035, H * 0.03, H * 0.03);
      g.fillStyle = '#24182e';
      g.font = `500 ${H * 0.04}px ${FONT}`;
      g.fillText(opts.tray ?? '', W * 0.78, H * 0.95);
    }
  }
  function drawMonitor() {
    const [g, W, H] = sg(monScreen);
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    if (!hasPower() || !connected.monitor) {
      g.fillStyle = '#0b090d';
      g.fillRect(0, 0, W, H);
      if (hasPower()) { g.fillStyle = '#9b91a4'; g.font = `500 ${H * 0.06}px ${FONT}`; g.textAlign = 'center'; g.fillText('No signal: is the monitor cable plugged in?', W / 2, H / 2); }
      monScreen.material.map.needsUpdate = true;
      return;
    }
    const tray = [connected.network ? '🖧' : '📶', bt$.connected ? '🎧' : '', connected.drive ? '💾 E:' : ''].join(' ');
    const projecting = projSignal();
    if (projecting && mode === 'second') { g.fillStyle = '#0b090d'; g.fillRect(0, 0, W, H); }
    else if (projecting && mode === 'ext' && screenApp === 'desktop') {
      // Extend: your notes stay on your own screen.
      g.fillStyle = '#f4f0f6';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#24182e';
      fit(g, '📝 My notes (only I can see these)', 700, H * 0.07, W * 0.9);
      g.fillText('📝 My notes (only I can see these)', W * 0.05, H * 0.12);
      g.font = `400 ${H * 0.055}px ${FONT}`;
      ['• Say hello and give my name', '• Ask: who has walked to fetch water?', '• Slide 2: the water cycle', '• Thank the class'].forEach((t, i) => g.fillText(t, W * 0.07, H * (0.3 + i * 0.12)));
      g.fillStyle = '#5a4470';
      fit(g, 'Desktop 1 · drag a window right → it moves onto the projector', 500, H * 0.045, W * 0.9);
      g.fillText('Desktop 1 · drag a window right → it moves onto the projector', W * 0.05, H * 0.86);
    } else drawDesktop(g, W, H, { tray });
    if (screenApp === 'settings') drawSettings(g, W, H);
    if (winpOpen && mode !== 'second') drawWinP(g, W, H);
    monScreen.material.map.needsUpdate = true;
  }
  function drawSettings(g, W, H) {
    const x = W * 0.08, y = H * 0.06, w = W * 0.84, h = H * 0.8;
    g.fillStyle = '#f9f9f9';
    g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill();
    g.fillStyle = '#e8e2ec';
    g.fillRect(x, y, w * 0.28, h);
    g.fillStyle = '#24182e';
    g.font = `600 ${H * 0.045}px ${FONT}`;
    g.textAlign = 'left';
    g.fillText('Settings', x + w * 0.03, y + h * 0.08);
    g.font = `500 ${H * 0.035}px ${FONT}`;
    ['System', 'Bluetooth & devices', 'Network & internet'].forEach((t, i) => {
      if (i === 1) { g.fillStyle = '#ffbe00'; g.fillRect(x + w * 0.01, y + h * (0.18 + i * 0.09) - H * 0.025, w * 0.26, H * 0.05); }
      g.fillStyle = '#24182e';
      g.fillText(t, x + w * 0.03, y + h * (0.18 + i * 0.09));
    });
    const cx = x + w * 0.32;
    g.font = `700 ${H * 0.055}px ${FONT}`;
    g.fillText('Bluetooth & devices', cx, y + h * 0.1);
    g.font = `500 ${H * 0.042}px ${FONT}`;
    g.fillText('Bluetooth', cx, y + h * 0.24);
    // toggle
    g.fillStyle = bt$.on ? '#3b6fd4' : '#9b91a4';
    g.beginPath(); g.roundRect(x + w * 0.82, y + h * 0.24 - H * 0.025, W * 0.07, H * 0.05, H * 0.025); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(bt$.on ? x + w * 0.82 + W * 0.055 : x + w * 0.82 + W * 0.015, y + h * 0.24, H * 0.018, 0, 7); g.fill();
    g.fillStyle = '#24182e';
    g.fillText(bt$.on ? 'On' : 'Off', x + w * 0.72, y + h * 0.24);
    // the device box
    g.strokeStyle = '#d9d3de';
    g.lineWidth = 2;
    g.beginPath(); g.roundRect(cx, y + h * 0.34, w * 0.64, h * 0.6, 8); g.stroke();
    let lines;
    if (bt$.stage === 'ready') lines = ['✅ Your device is ready to go!', '🎧 Selasi\'s headset · Connected', '', '[ Done ]'];
    else if (bt$.stage === 'done') lines = ['Devices', '🎧 Selasi\'s headset · Connected', '🖱️ Mouse · Connected', ''];
    else if (bt$.stage === 'connecting') lines = ['Add a device', 'Connecting to Selasi\'s headset…', '', ''];
    else if (bt$.list) lines = ['Add a device · Bluetooth', ...bt$.list.map((d) => d.label), bt$.list.length < 3 ? 'searching…' : ''];
    else lines = ['➕ Add device', bt$.on ? 'Press Add device → Bluetooth' : 'Turn Bluetooth on first', '', ''];
    lines.forEach((t, i) => {
      g.font = `${i === 0 ? 700 : 500} ${H * 0.042}px ${FONT}`;
      g.fillStyle = '#24182e';
      g.fillText(t, cx + w * 0.03, y + h * (0.42 + i * 0.12));
    });
  }
  function drawWinP(g, W, H) {
    const x = W * 0.68, w = W * 0.3;
    g.fillStyle = 'rgba(36,24,46,0.95)';
    g.fillRect(x, 0, w, H * 0.9);
    g.fillStyle = '#ffffff';
    g.font = `700 ${H * 0.05}px ${FONT}`;
    g.textAlign = 'left';
    g.fillText('Project', x + w * 0.08, H * 0.08);
    Object.entries(MODES).forEach(([id, m], i) => {
      const y = H * (0.18 + i * 0.17);
      if (id === mode) { g.fillStyle = '#ffbe00'; g.fillRect(x + w * 0.04, y - H * 0.06, w * 0.92, H * 0.13); }
      g.fillStyle = id === mode ? '#24182e' : '#ffffff';
      g.font = `500 ${H * 0.042}px ${FONT}`;
      g.fillText(m.name, x + w * 0.1, y);
    });
  }
  function drawCloth() {
    const [g, W, H] = sg(cloth);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (!projOn || !hasPower() || !connected.projector) {
      g.fillStyle = '#f4f2ee';
      g.fillRect(0, 0, W, H);
    } else if (!projSignal()) {
      g.fillStyle = '#1b2a6b';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffffff';
      g.font = `600 ${H * 0.08}px ${FONT}`;
      g.fillText(`No signal on ${projInput}`, W / 2, H * 0.45);
      g.font = `400 ${H * 0.055}px ${FONT}`;
      g.fillText('Check the cable and the projector input', W / 2, H * 0.6);
    } else if (mode === 'pc') {
      g.fillStyle = '#20202a';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#9b91a4';
      g.font = `500 ${H * 0.07}px ${FONT}`;
      g.fillText('(nothing: PC screen only)', W / 2, H / 2);
    } else if (mode === 'ext') {
      drawDesktop(g, W, H, { slideOnly: true });
      g.fillStyle = 'rgba(36,24,46,0.8)';
      g.fillRect(0, H * 0.9, W, H * 0.1);
      g.fillStyle = '#ffffff';
      g.font = `500 ${H * 0.05}px ${FONT}`;
      g.fillText('Desktop 2 (extended)', W / 2, H * 0.95);
    } else if (screenApp === 'settings' && mode !== 'second') {
      drawDesktop(g, W, H, {});
      drawSettings(g, W, H);
    } else drawDesktop(g, W, H, mode === 'dup' || mode === 'second' ? { slideOnly: screenApp === 'desktop' } : {});
    if (winpOpen && (mode === 'dup' || mode === 'second')) drawWinP(g, W, H);
    cloth.material.map.needsUpdate = true;
    const lit = projOn && hasPower() && !!connected.projector;
    beam.visible = lit;
    prLed.material.emissive.setHex(lit ? 0x2ec4b6 : hasPower() && connected.projector ? 0xca1f3f : 0x000000);
    lensGlass.material.emissive.setHex(lit ? 0xfff6d0 : 0x000000);
  }
  function refreshLights() {
    towerLed.material.emissive.setHex(hasPower() ? 0x2ec4b6 : 0x000000);
    stripLed.material.emissive.setHex(COLORS.red);
    printerLed.material.emissive.setHex(hasPower() && connected.printer ? 0x2ec4b6 : 0x000000);
    wcLed.material.emissive.setHex(hasPower() && connected.webcam ? 0x2ec4b6 : 0x000000);
    dLed.material.emissive.setHex(hasPower() && connected.drive ? 0x3b6fd4 : 0x000000);
    routerLeds[3].material.emissive.setHex(connected.network ? 0x2ec4b6 : 0x000000);
    drawMonitor();
    drawCloth();
  }

  // ======================================================================
  //  SIDE PANEL
  // ======================================================================
  const devGroup = ui.group('1 · Pick a device');
  const devBtns = {};
  for (const id of DEV_IDS) devBtns[id] = ui.button(`${DEVS[id].icon} ${DEVS[id].name}`, () => pick(id), { group: devGroup });
  const portGroup = ui.group('Then choose its port');
  const portHint = ui.element('<p class="crack" aria-live="polite">Pick a device first.</p>', portGroup).firstElementChild;
  const portBtns = {};
  for (const [id, , name] of PORTS) portBtns[id] = ui.button(name, () => plugInto(id), { group: portGroup });
  const unplugBtn = ui.button('↩ Unplug it', () => unplug(selected), { group: portGroup });
  unplugBtn.style.display = 'none';

  const btGroup = ui.group('2 · Pair a Bluetooth headset');
  const btBtns = {
    pair: ui.button('🔵 Hold the headset\'s button (pairing mode)', () => pairingMode(), { group: btGroup }),
    open: ui.button('⚙️ Start → Settings → Bluetooth & devices', () => openSettings(), { group: btGroup }),
    toggle: ui.button('Bluetooth: Off', () => toggleBt(), { group: btGroup }),
    add: ui.button('➕ Add device → Bluetooth', () => addDevice(), { group: btGroup }),
  };
  const btList = ui.group('');
  btGroup.appendChild(btList);

  const prGroup = ui.group('3 · Set up the projector');
  const prOnBtn = ui.button('🔌 Switch the projector on', () => projectorPower(), { group: prGroup });
  const prInBtn = ui.button('Projector input: VGA', () => projectorInput(), { group: prGroup });
  const winpBtn = ui.button('⊞ Windows + P', () => winP(), { primary: true, group: prGroup });
  const modeRow = ui.group('');
  prGroup.appendChild(modeRow);
  const modeBtns = {};
  for (const [id, m] of Object.entries(MODES)) modeBtns[id] = ui.button(m.name, () => setMode(id), { group: modeRow });
  modeRow.style.display = 'none';
  const quizRow = ui.group('');
  prGroup.appendChild(quizRow);

  function setBusy(on) {
    busy = on;
    for (const b of [...Object.values(portBtns), unplugBtn]) {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.5' : '';
    }
  }
  function refreshButtons() {
    for (const id of DEV_IDS) {
      devBtns[id].classList.toggle('active', id === selected);
      devBtns[id].setAttribute('aria-pressed', String(id === selected));
      devBtns[id].textContent = `${correct.has(id) ? '✅' : DEVS[id].icon} ${DEVS[id].name}`;
    }
    for (const [id, , name] of PORTS) portBtns[id].textContent = usedBy[id] ? `${name} · ${DEVS[usedBy[id]].icon}` : name;
    unplugBtn.style.display = selected && connected[selected] ? '' : 'none';
    portHint.innerHTML = selected ? (connected[selected] ? `${DEVS[selected].icon} <b>${esc(DEVS[selected].name)}</b> is plugged into <b>${esc(portName(connected[selected]))}</b>.` : `Where does the <b>${esc(DEVS[selected].name)}</b> plug in? Look at its plug.`) : 'Pick a device first.';
    btBtns.toggle.textContent = `Bluetooth: ${bt$.on ? 'On' : 'Off'}`;
    btBtns.toggle.classList.toggle('active', bt$.on);
    btBtns.toggle.setAttribute('aria-pressed', String(bt$.on));
    prOnBtn.textContent = projOn ? '🔌 Switch the projector off' : '🔌 Switch the projector on';
    prInBtn.textContent = `Projector input: ${projInput}`;
    for (const id of Object.keys(MODES)) { modeBtns[id].classList.toggle('active', id === mode); modeBtns[id].setAttribute('aria-pressed', String(id === mode)); }
  }
  const portName = (pid) => PORTS.find((p) => p[0] === pid)[2];

  // ---------- Connecting ----------
  function pick(id) {
    selected = id;
    refreshButtons();
    stage.highlight(groupOf(id), true);
    setTimeout(() => stage.highlight(groupOf(id), false), 700);
    ui.info(`${DEVS[id].icon} ${DEVS[id].name}`, `<p><b>${esc(DEVS[id].kind)}</b> device. ${connected[id] ? 'It is already connected. Press <b>↩ Unplug it</b> to try again.' : 'Look at the shape of its plug, then choose a port below (or press a port on the back of the system unit).'}</p>`);
    portGroup.querySelector('button')?.focus();
  }
  const groupOf = (id) => ({ power: plugs.power, monitor, keyboard, mouse, printer, webcam, headset, drive, projector, network: router })[id];
  async function plugInto(pid) {
    if (busy) return;
    if (!selected) { ui.info('👆 Pick a device first', '<p>Choose a device in <b>1 · Pick a device</b>, then the port it goes in.</p>'); return; }
    const id = selected, d = DEVS[id];
    if (connected[id]) { ui.info('Already connected', `<p>The ${esc(d.name)} is in <b>${esc(portName(connected[id]))}</b>. Press <b>↩ Unplug it</b> first.</p>`); return; }
    if (usedBy[pid]) { ui.info('🚫 That port is taken', `<p>The <b>${esc(DEVS[usedBy[pid]].name)}</b> is already in <b>${esc(portName(pid))}</b>. Choose another one.</p>`); return; }
    const kind = PORTS.find((p) => p[0] === pid)[1];
    setBusy(true);
    stage.reveal();
    if (id === 'webcam') await moveWebcam(true);
    const p = plugs[id], from = p.position.clone(), to = portWorld(pid).add(V(0, 0, 0.12));
    p.rotation.set(0, 0, 0);
    const near = to.clone().add(V(0, 0, 0.35));
    await stage.tween((k) => { p.position.lerpVectors(from, near, k); p.position.y += Math.sin(k * Math.PI) * 0.5; drawCable(id); }, 0.6);
    const fits = kind === d.plug;
    const micMix = d.plug === 'audio' && kind === 'mic';
    if (fits) {
      await stage.tween((k) => { p.position.lerpVectors(near, to, k); drawCable(id); }, 0.25);
      connected[id] = pid;
      usedBy[pid] = id;
      correct.add(id);
      drawCable(id);
      refreshLights();
      const n = correct.size;
      const extra = id === 'power' ? '<p>The power light is on. Now the computer can run!</p>' : !hasPower() ? '<p>Tip: nothing will light up until the <b>🔌 Power cable</b> is in.</p>' : '';
      ui.info(`✅ ${d.name} connected`, `<p>${d.why}</p>${extra}<p><b>${n}</b> device${n > 1 ? 's' : ''} connected correctly${n < 5 ? ` (${5 - n} more for the mission)` : ''}.</p>`);
      if (n >= 5) ui.complete('connect');
      selected = null;
    } else {
      // A friendly "doesn't fit" shake, then the plug goes back.
      const s = p.position.clone();
      await stage.tween((k) => { p.position.x = s.x + Math.sin(k * Math.PI * 8) * 0.08 * (1 - k); drawCable(id); }, 0.5, (k) => k);
      await stage.tween((k) => { p.position.lerpVectors(s, from, k); p.position.y += Math.sin(k * Math.PI) * 0.5; drawCable(id); }, 0.5);
      if (id === 'webcam') await moveWebcam(false);
      drawCable(id);
      if (micMix) ui.info('🤔 It fits, but you will hear nothing', `<p>The plug is the right shape, but the <b>pink</b> jack is for a <b>microphone</b>. Sound comes <b>out</b> of the <b>green</b> jack.</p>`);
      else ui.info('🙅 Doesn\'t fit!', `<p>That plug does not fit the <b>${esc(PORT_NAMES[kind])}</b> port, and that is good: the shapes stop you using the wrong port.</p><p>💡 ${PLUG_TIPS[d.plug]}</p><p>🚨 Never force a plug. If it does not slide in gently, it is the wrong port or upside down.</p>`);
    }
    setBusy(false);
    refreshButtons();
  }
  async function unplug(id) {
    if (busy || !id || !connected[id]) return;
    setBusy(true);
    const pid = connected[id];
    delete usedBy[pid];
    delete connected[id];
    if (id === 'monitor' || id === 'power') { winpOpen = false; modeRow.style.display = 'none'; }
    const p = plugs[id], from = p.position.clone(), to = loose[id].clone().add(V(0, DEVS[id].plug === 'power' ? 0.13 : 0.06, 0));
    await stage.tween((k) => { p.position.lerpVectors(from, to, k); p.position.y += Math.sin(k * Math.PI) * 0.5; drawCable(id); }, 0.5);
    if (id === 'webcam') await moveWebcam(false);
    drawCable(id);
    refreshLights();
    setBusy(false);
    refreshButtons();
    ui.info('↩ Unplugged', `<p>The ${esc(DEVS[id].name)} is unplugged. Pick a port for it again whenever you like.</p>`);
  }
  async function moveWebcam(onMonitor) {
    const to = onMonitor ? monitor.localToWorld(V(0.9, 2.94, -0.05)) : webcamHome;
    if (webcam.position.distanceTo(to) < 0.01) return;
    const a = webcam.position.clone();
    await stage.tween((k) => { webcam.position.lerpVectors(a, to, k); webcam.position.y += Math.sin(k * Math.PI) * 0.6; drawCable('webcam'); }, 0.5);
  }

  // ---------- Bluetooth ----------
  const needScreen = () => {
    if (monOn()) return false;
    ui.info('🖥️ First, see Windows', `<p>To change settings you need to see the screen. Connect the <b>🔌 Power cable</b>${connected.monitor ? '' : ' and the <b>🖥️ Monitor</b>'} first (part 1).</p>`);
    return true;
  };
  function pairingMode() {
    bt$.pairing = true;
    stage.reveal();
    setLabel(btTag, 'Pairing mode… 🔵');
    ui.info('🔵 Pairing mode', '<p>You held the headset\'s button until its light <b>flashes blue</b>. Now it is saying: <i>"Is anyone looking for me? I am Selasi\'s headset."</i></p><p>Next, open <b>Settings → Bluetooth & devices</b> on the computer.</p>');
  }
  function openSettings() {
    if (needScreen()) return;
    screenApp = 'settings';
    winpOpen = false;
    refreshLights();
    stage.reveal();
    ui.info('⚙️ Bluetooth & devices', `<p>This is where Windows keeps Bluetooth. ${bt$.on ? 'Bluetooth is <b>On</b>.' : 'Bluetooth is <b>Off</b>: turn it <b>On</b> first.'}</p>`);
  }
  function toggleBt() {
    if (needScreen()) return;
    if (screenApp !== 'settings') openSettings();
    bt$.on = !bt$.on;
    if (!bt$.on) { bt$.list = null; bt$.connected = false; bt$.stage = 'off'; btList.innerHTML = ''; }
    refreshLights();
    refreshButtons();
    ui.info(`Bluetooth ${bt$.on ? 'On' : 'Off'}`, bt$.on ? '<p>Now press <b>➕ Add device → Bluetooth</b>.</p>' : '<p>With Bluetooth off, no wireless headset can connect.</p>');
  }
  async function addDevice() {
    if (needScreen()) return;
    if (screenApp !== 'settings') openSettings();
    if (!bt$.on) { ui.info('Bluetooth is off', '<p>Turn <b>Bluetooth: On</b> first. Then the computer can look for devices.</p>'); return; }
    if (bt$.searching) return;
    bt$.searching = true;
    bt$.stage = 'list';
    bt$.list = [];
    btList.innerHTML = '';
    refreshLights();
    stage.reveal();
    const found = [{ id: 'phone', label: '📱 Kofi\'s phone' }, { id: 'speaker', label: '🔊 Classroom speaker' }];
    if (bt$.pairing) found.splice(1, 0, { id: 'headset', label: '🎧 Selasi\'s headset' });
    ui.info('🔎 Searching…', '<p>The computer asks: <i>"Is anyone there?"</i> Devices in pairing mode answer.</p>');
    for (const f of found) {
      await stage.wait(0.6);
      bt$.list.push(f);
      refreshLights();
      ui.button(f.label, () => choose(f.id), { group: btList });
    }
    bt$.searching = false;
    if (!bt$.pairing) ui.info('🤔 Where is the headset?', '<p>Your headset is not in the list. It only answers when it is in <b>pairing mode</b>. Press <b>🔵 Hold the headset\'s button</b>, then <b>➕ Add device</b> again.</p>');
    else ui.info('🎧 Found it!', '<p>Choose <b>Selasi\'s headset</b> from the list. (Only connect devices you know!)</p>');
  }
  async function choose(id) {
    if (bt$.stage !== 'list') return;
    if (id !== 'headset') { ui.info('🚫 Not your headset', `<p>That is ${id === 'phone' ? 'Kofi\'s phone' : 'the classroom speaker'}, not your headset. Only connect devices you know.</p>`); return; }
    bt$.stage = 'connecting';
    btList.innerHTML = '';
    refreshLights();
    await stage.wait(0.9);
    bt$.stage = 'ready';
    bt$.connected = true;
    bt$.pairing = false;
    setLabel(btTag, 'Connected ✅');
    btLed.material.emissive.setHex(0x3b6fd4);
    refreshLights();
    ui.button('Done', () => btDone(), { primary: true, group: btList });
    ui.button('🔊 Play a test sound', () => testSound(), { group: btList });
    ui.info('✅ Your device is ready to go', '<p>The computer and the headset are <b>paired</b>: next time they will find each other by themselves. Press <b>Done</b>, then play a sound to test it.</p>');
  }
  function btDone() {
    bt$.stage = 'done';
    refreshLights();
    ui.complete('bluetooth');
    ui.info('🎧 Paired!', '<p>You paired a Bluetooth headset: <b>pairing mode → Add device → choose it → Done</b>.</p><p>🔋 Wireless trouble later? Check the <b>battery</b> first. To disconnect, switch the headset off.</p>');
  }
  async function testSound() {
    setLabel(btTag, '🎵 ♪ ♫');
    await stage.wait(1.5);
    setLabel(btTag, 'Connected ✅');
  }

  // ---------- Projector ----------
  function projectorPower() {
    if (!connected.projector) { ui.info('📽️ Connect it first', '<p>Plug the projector\'s <b>blue VGA</b> cable into the computer (part 1), then switch it on.</p>'); return; }
    projOn = !projOn;
    refreshLights();
    refreshButtons();
    stage.reveal();
    if (projOn) ui.info('📽️ Projector on', `<p>The lamp is warming up. ${projSignal() ? 'It is showing the computer\'s picture.' : `It is looking for a picture on its <b>${projInput}</b> input.`} Now press <b>⊞ Windows + P</b> to choose what it shows.</p>`);
  }
  function projectorInput() {
    projInput = projInput === 'VGA' ? 'HDMI' : 'VGA';
    refreshLights();
    refreshButtons();
    ui.info(`Projector input: ${projInput}`, `<p>A projector shows the picture from <b>one input</b> at a time. ${projSignal() ? 'This input has the cable: picture! ✅' : 'No cable on this input, so: <b>No signal</b>. Choose the input your cable is plugged into.'}</p>`);
  }
  function winP() {
    if (needScreen()) return;
    winpOpen = true;
    screenApp = 'desktop';
    modeRow.style.display = '';
    refreshLights();
    stage.reveal();
    ui.info('⊞ Windows + P', `<p>The <b>Project</b> menu opens on the right of the screen. Try each mode and watch both screens.${projSignal() ? '' : ' (Connect the projector and switch it on to see it on the big screen.)'}</p><p><b>End on Duplicate</b> to show the class.</p>`);
    modeBtns[mode].focus();
  }
  function setMode(id) {
    mode = id;
    refreshLights();
    refreshButtons();
    stage.reveal();
    const ok = projSignal();
    ui.info(`${MODES[id].name}`, `<p>${MODES[id].what}</p>${ok ? '' : '<p>The projector is not showing anything yet: is it <b>connected</b>, <b>switched on</b> and on the right <b>input</b>?</p>'}`);
    if (id === 'dup') askExtend();
    checkProjector();
  }
  function askExtend() {
    if (extOk) return;
    quizRow.innerHTML = '<span class="lab-group-title">Quick check: what does Extend do?</span>';
    const opts = [
      ['Shows the same picture on both screens', false, 'That is <b>Duplicate</b>.'],
      ['Makes one big desktop across both screens, so my notes can stay on my screen', true, ''],
      ['Switches the projector off', false, 'No: in Extend the projector shows part of your desktop.'],
    ];
    for (const [t, good, why] of opts) {
      const b = ui.button(t, () => {
        if (good) { extOk = true; quizRow.innerHTML = '<p class="crack">✅ Extend = one big desktop across both screens.</p>'; ui.info('✅ That\'s Extend', '<p>In <b>Extend</b> the projector becomes a <b>second desktop</b>. A presenter can drag the slides onto it and keep notes on their own screen. That is a presenter\'s secret!</p>'); checkProjector(); }
        else ui.info('🤔 Not quite', `<p>${why} Try <b>Extend</b> with the mode buttons and watch both screens.</p>`);
      }, { group: quizRow });
      b.style.textAlign = 'left';
    }
  }
  function checkProjector() {
    if (ui.isDone('projector')) return;
    if (extOk && mode === 'dup' && projSignal()) {
      ui.complete('projector');
      ui.info('🏆 Ready to present!', '<p>The projector is connected, switched on, on the right input and set to <b>Duplicate</b>: the class sees exactly what you see. And you know the presenter\'s secret: <b>Extend</b> keeps your notes on your own screen.</p>');
    } else if (extOk && !(mode === 'dup' && projSignal())) {
      ui.info('Almost: end on Duplicate', `<p>You know what Extend does. Now set the projector up for the class: ${projSignal() ? '' : 'make sure it is <b>connected, on and on the right input</b>, then '}choose <b>Duplicate</b>.</p>`);
    }
  }

  // ---------- 3D clicks ----------
  for (const id of DEV_IDS) {
    const obj = groupOf(id);
    stage.clickable(obj, () => pick(id));
    if (obj !== plugs[id]) stage.clickable(plugs[id], () => pick(id));
  }
  stage.clickable(bt, () => pairingMode());
  for (const [id] of PORTS) stage.clickable(portMeshes[id], () => plugInto(id));

  // Idle: the pairing light flashes, the power strip glows.
  stage.onTick((dt, t) => {
    if (bt$.pairing) btLed.material.emissive.setHex(Math.sin(t * 10) > 0 ? 0x3b6fd4 : 0x000000);
  });

  buildBeam();
  for (const id of DEV_IDS) drawCable(id);
  refreshLights();
  refreshButtons();
  setLabel(btTag, 'Bluetooth · off');
  ui.info('🔌 Plug It In', '<p>Like trotros at Kaneshie station, every device has its own <b>lane</b>: the right <b>port</b>. Each port has its own shape, so the wrong plug will not fit.</p><p>Pick a device, then choose the port its plug fits. Start with the <b>🔌 Power cable</b> and the <b>🖥️ Monitor</b>, so you can see Windows.</p>');
}

export const missions = [
  { id: 'connect', text: 'Connect 5 devices to the right ports.', hint: 'Look at each plug\'s shape. Start with the power cable and the monitor.' },
  { id: 'bluetooth', text: 'Pair the Bluetooth headset with the computer.', hint: 'Pairing mode first, then Settings → Bluetooth & devices → Add device.' },
  { id: 'projector', text: 'Set up the projector for a presentation (Duplicate) and explain Extend.', hint: 'Plug in the blue VGA cable, switch it on, press Windows + P.' },
];

export const config = { camera: [4, 8.5, 12], target: [-0.9, 2.5, -0.3], shadowSize: 11, frame: 0.92, minDistance: 4 };
