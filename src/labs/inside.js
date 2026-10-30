// Session 6 — Inside the Box: open a system unit, lift out its parts, then run
// the chop bar kitchen (cook = processor, worktable = RAM, storeroom = storage).
// 1. Open the case and name 4 parts.
// 2. Overload the worktable and watch the orders slow down.
// 3. Fix it (close programmes or a bigger table) and compare the speed.
import { THREE, COLORS, box, rbox, mat, decal, cable, label, setLabel } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- The parts in the box ----------
const PARTS = {
  cpu: {
    name: 'Processor (CPU)', btn: '🧑‍🍳 Processor', kitchen: 'the cook',
    title: '🧑‍🍳 Processor (CPU) + cooler',
    text: '<p>The <b>cook</b> of the chop bar kitchen: the "brain" that follows instructions and does every calculation, <b>billions per second</b>.</p><p>It gets hot, so a <b>cooler</b> (metal fins and a fan) sits on top of it. You might see it written as <b>Intel Core i5</b>, <b>AMD Ryzen 5</b> or <b>Intel Celeron</b>.</p>',
  },
  ram: {
    name: 'Memory (RAM)', btn: '🍲 Memory (RAM)', kitchen: 'the worktable',
    title: '🍲 Memory (RAM)',
    text: '<p>The <b>worktable</b>: very fast, but small (usually <b>4 to 16 GB</b>). It holds the programmes and files you are using <b>right now</b>.</p><p>It is <b>temporary</b>: wiped clean when the computer shuts down or the power goes off. That is why dumsor eats unsaved work.</p>',
  },
  ssd: {
    name: 'Storage (SSD)', btn: '📦 SSD', kitchen: 'the storeroom',
    title: '📦 Storage: SSD',
    text: '<p>The <b>storeroom</b>: it keeps Windows, your programmes and your saved files, <b>even when the power is off</b>.</p><p>An <b>SSD</b> (solid-state drive) uses memory chips with no moving parts, so it is <b>very fast</b>. You might see <b>256 GB SSD</b>.</p>',
  },
  psu: {
    name: 'Power supply', btn: '⚡ Power supply', kitchen: 'the kitchen\'s gas and lights',
    title: '⚡ Power supply',
    text: '<p>Takes electricity from the wall socket and turns it into the small, safe amounts each part needs. Its fan keeps it cool.</p><p>Never open a power supply or a computer case: there is <b>mains electricity</b> inside.</p>',
  },
  mobo: {
    name: 'Motherboard', btn: '🟩 Motherboard', kitchen: 'the kitchen floor that joins it all',
    title: '🟩 Motherboard',
    text: '<p>The big board that every part plugs into. Its tiny copper lines carry messages between the <b>cook</b> (processor), the <b>worktable</b> (RAM) and the <b>storeroom</b> (storage).</p>',
  },
  hdd: {
    name: 'Hard drive', btn: '💿 Hard drive', kitchen: 'a bigger, slower storeroom',
    title: '💿 Storage: hard drive (HDD)',
    text: '<p>Another kind of <b>storeroom</b>: spinning metal discs inside older and cheaper PCs. <b>Big and cheap</b>, but <b>slow</b>, and it can break if knocked. You might see <b>1 TB hard drive</b>.</p>',
  },
};
const PART_IDS = Object.keys(PARTS);

// ---------- The kitchen: programmes are dishes on the worktable ----------
const PROGS = [
  { id: 'win', icon: '🪟', name: 'Windows', gb: 1, color: 0x5a4470, fixed: true },
  { id: 'word', icon: '📝', name: 'Word', gb: 1, color: 0x3b6fd4 },
  { id: 'chrome', icon: '🌐', name: 'Chrome, 10 tabs', short: 'Chrome', gb: 2, color: 0x2ec4b6 },
  { id: 'paint', icon: '🎨', name: 'Paint', gb: 1, color: 0xff8c42 },
  { id: 'music', icon: '🎵', name: 'Music', gb: 1, color: 0xca1f3f },
  { id: 'game', icon: '🎮', name: 'A game', short: 'Game', gb: 3, color: 0xffbe00 },
  { id: 'call', icon: '📹', name: 'Video call', short: 'Call', gb: 2, color: 0x7b5ea7 },
];
const SIZES = [4, 8, 16];
const ORDERS = ['One fufu and light soup!', 'Two waakye!', 'Jollof and chicken!', 'Banku and tilapia!', 'One kenkey, extra pepper!', 'Red red and plantain!', 'Omo tuo and groundnut soup!'];

// A rounded-box shape to share between meshes with their own material.
const rgeo = (w, h, d, r) => {
  const m = rbox(w, h, d, 0, r);
  m.material.dispose();
  return m.geometry;
};
const shadow = (o) => o.traverse((m) => m.isMesh && (m.castShadow = m.receiveShadow = true));

export default function insideLab(stage, ui) {
  const { scene } = stage;

  // ======================================================================
  //  PART A · THE SYSTEM UNIT
  // ======================================================================
  const boxView = new THREE.Group();
  scene.add(boxView);
  const L = 4.6, H = 4.6, D = 2.0, Y0 = 0.16; // case length (x), height, depth (z), feet height
  const caseMat = mat(0x4a3d58, { roughness: 0.5, metalness: 0.15 });
  const innerMat = mat(0xcfc7d6, { roughness: 0.6 });
  const shell = new THREE.Group();
  shell.position.y = Y0;
  boxView.add(shell);
  const wall = (w, h, d, x, y, z, m = caseMat) => {
    const s = new THREE.Mesh(rgeo(w, h, d, 0.03), m);
    s.position.set(x, y, z);
    shell.add(s);
    return s;
  };
  wall(L, H, 0.08, 0, H / 2, -D / 2 + 0.04, innerMat); // far side panel (inside face shows)
  wall(L, 0.1, D, 0, 0.05, 0); // floor
  wall(L, 0.1, D, 0, H - 0.05, 0); // roof
  wall(0.1, H, D, -L / 2 + 0.05, H / 2, 0, innerMat); // rear (ports)
  const bezel = wall(0.26, H, D + 0.06, L / 2 + 0.08, H / 2, 0, mat(0x1b1222, { roughness: 0.4 })); // front
  const front = decal(D - 0.1, H - 0.2, (g, W, Hh) => {
    g.fillStyle = '#1b1222';
    g.fillRect(0, 0, W, Hh);
    g.strokeStyle = '#ffbe00';
    g.lineWidth = W * 0.05;
    g.beginPath(); g.arc(W / 2, Hh * 0.09, W * 0.12, -1.1, Math.PI + 1.1); g.stroke();
    g.fillRect(W / 2 - W * 0.025, Hh * 0.04, W * 0.05, Hh * 0.05);
    g.fillStyle = '#3d3348';
    for (const x of [0.32, 0.68]) g.fillRect(W * x - W * 0.08, Hh * 0.17, W * 0.16, Hh * 0.025);
    g.fillStyle = '#2a2131';
    for (let i = 0; i < 16; i++) g.fillRect(W * 0.18, Hh * (0.3 + i * 0.04), W * 0.64, Hh * 0.012);
    g.fillStyle = '#ffbe00';
    g.font = `700 ${W * 0.12}px ${FONT}`;
    g.textAlign = 'center';
    g.fillText('BIH', W / 2, Hh * 0.96);
  }, { px: 128, transparent: false });
  front.rotation.y = Math.PI / 2;
  front.position.set(0.132, 0, 0);
  bezel.add(front);
  const powerLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(0x2ec4b6, { emissive: 0x2ec4b6, emissiveIntensity: 0.9 }));
  powerLed.position.set(0.14, H / 2 - 0.2 - 0.25, -D / 2 + 0.35);
  bezel.add(powerLed);
  const footGeo = new THREE.CylinderGeometry(0.12, 0.14, Y0, 12);
  const footMat = mat(0x0b090d);
  for (const x of [-1.9, 1.9]) for (const z of [-0.7, 0.7]) {
    const f = new THREE.Mesh(footGeo, footMat);
    f.position.set(x, Y0 / 2, z);
    boxView.add(f);
  }

  // The side panel (folds down flat in front, like a tray).
  const hinge = new THREE.Group();
  hinge.position.set(0, Y0, D / 2);
  boxView.add(hinge);
  const panel = new THREE.Mesh(rgeo(L, H, 0.07, 0.03), caseMat);
  panel.position.set(0, H / 2, 0.035);
  hinge.add(panel);
  const panelArt = decal(L - 0.3, H - 0.3, (g, W, Hh) => {
    g.fillStyle = '#4a3d58';
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#5f5070';
    for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) {
      g.beginPath(); g.arc(W * (0.58 + c * 0.045), Hh * (0.14 + r * 0.05), W * 0.012, 0, 7); g.fill();
    }
    g.fillStyle = '#ffbe00';
    g.fillRect(W * 0.06, Hh * 0.82, W * 0.3, Hh * 0.012);
    g.fillStyle = '#d9d3de';
    g.font = `600 ${W * 0.045}px ${FONT}`;
    g.fillText('System unit', W * 0.06, Hh * 0.9);
    g.font = `400 ${W * 0.03}px ${FONT}`;
    g.fillText('Real cases stay closed!', W * 0.06, Hh * 0.95);
  }, { px: 256, transparent: false });
  panelArt.position.set(0, H / 2, 0.072);
  hinge.add(panelArt);
  const screw = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10);
  for (const y of [0.35, H - 0.35]) {
    const s = new THREE.Mesh(screw, mat(0xd9d3de, { metalness: 0.6, roughness: 0.3 }));
    s.rotation.x = Math.PI / 2;
    s.position.set(-L / 2 + 0.2, y, 0.08);
    hinge.add(s);
  }

  // The insides (hidden until the case is opened).
  const insides = new THREE.Group();
  insides.position.y = Y0;
  insides.visible = false;
  boxView.add(insides);
  const parts = {};
  const part = (id, x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.userData.home = g.position.clone();
    insides.add(g);
    parts[id] = g;
    return g;
  };

  // Motherboard
  const mobo = part('mobo', -0.35, 2.85, -D / 2 + 0.12);
  const MW = 3.3, MH = 3.4;
  const board = new THREE.Mesh(rgeo(MW, MH, 0.06, 0.02), mat(0x1f6f5c, { roughness: 0.6 }));
  mobo.add(board);
  const traces = decal(MW - 0.04, MH - 0.04, (g, W, Hh) => {
    g.fillStyle = '#1f6f5c';
    g.fillRect(0, 0, W, Hh);
    g.strokeStyle = 'rgba(255,214,120,0.55)';
    g.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const y = Hh * (0.05 + i * 0.035);
      g.beginPath(); g.moveTo(W * 0.05, y); g.lineTo(W * (0.3 + (i % 5) * 0.05), y); g.lineTo(W * (0.36 + (i % 5) * 0.05), y + 14); g.lineTo(W * 0.95, y + 14); g.stroke();
    }
    g.fillStyle = '#0f3b31';
    g.fillRect(W * 0.62, Hh * 0.62, W * 0.2, Hh * 0.16);
    g.fillStyle = '#e8e2ec';
    g.font = `600 ${W * 0.04}px ${FONT}`;
    g.fillText('BIH-B450 MOTHERBOARD', W * 0.06, Hh * 0.96);
    g.fillStyle = '#c9a227';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(W * (0.08 + i * 0.03), Hh * 0.86, 5, 0, 7); g.fill(); }
  }, { px: 384, transparent: false });
  traces.position.z = 0.032;
  mobo.add(traces);

  // Processor + cooler
  const cpu = part('cpu', -0.75, 3.55, -D / 2 + 0.2);
  const chip = new THREE.Mesh(rgeo(0.7, 0.7, 0.06, 0.02), mat(0xc9a227, { metalness: 0.6, roughness: 0.35 }));
  chip.add(decal(0.6, 0.6, (g, W, Hh) => {
    g.fillStyle = '#d8b84a';
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#24182e';
    g.textAlign = 'center';
    g.font = `700 ${W * 0.2}px ${FONT}`;
    g.fillText('CPU', W / 2, Hh * 0.45);
    g.font = `500 ${W * 0.1}px ${FONT}`;
    g.fillText('Core i5', W / 2, Hh * 0.66);
  }, { px: 128, transparent: false }));
  chip.children[0].position.z = 0.032;
  cpu.add(chip);
  const cooler = new THREE.Group();
  cooler.position.z = 0.45;
  const finMat = mat(0xb8bcc6, { metalness: 0.6, roughness: 0.3 });
  const finGeo = rgeo(1.1, 0.06, 0.62, 0.01);
  for (let i = 0; i < 8; i++) {
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.y = -0.5 + i * 0.143;
    cooler.add(fin);
  }
  const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.06, 8, 28), mat(0x24182e));
  fanRing.position.z = 0.36;
  const blades = decal(0.86, 0.86, (g, W, Hh) => {
    g.translate(W / 2, Hh / 2);
    g.fillStyle = '#5a4470';
    for (let i = 0; i < 7; i++) {
      g.rotate((Math.PI * 2) / 7);
      g.beginPath(); g.ellipse(W * 0.22, 0, W * 0.2, W * 0.07, 0.5, 0, 7); g.fill();
    }
    g.fillStyle = '#ffbe00';
    g.beginPath(); g.arc(0, 0, W * 0.12, 0, 7); g.fill();
  }, { px: 128 });
  blades.position.z = 0.37;
  cooler.add(fanRing, blades);
  cpu.add(cooler);

  // RAM sticks
  const ram = part('ram', 0.45, 3.3, -D / 2 + 0.3);
  const ramGeo = rgeo(0.07, 1.7, 0.4, 0.01);
  const ramMat = mat(0x1f6f5c);
  const slotGeo = rgeo(0.14, 1.85, 0.12, 0.01);
  const slotMat = mat(0x0b090d);
  const ramFace = (g, W, Hh) => {
    g.fillStyle = '#24182e';
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#ffbe00';
    g.fillRect(0, 0, W, Hh * 0.06);
    g.fillStyle = '#d9d3de';
    g.font = `700 ${Hh * 0.08}px ${FONT}`;
    g.save(); g.translate(W * 0.6, Hh * 0.5); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('8 GB DDR4', 0, 0); g.restore();
  };
  for (const x of [0, 0.3]) {
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.set(x, 0, -0.18);
    ram.add(slot);
    const stick = new THREE.Mesh(ramGeo, ramMat);
    stick.position.set(x, 0, 0.05);
    const face = decal(0.38, 1.62, ramFace, { px: 160, transparent: false });
    face.rotation.y = Math.PI / 2;
    face.position.x = 0.037;
    stick.add(face);
    ram.add(stick);
  }

  // Power supply
  const psu = part('psu', -1.3, 0.62, 0);
  const psuBody = new THREE.Mesh(rgeo(1.7, 1.0, 1.7, 0.04), mat(0x3b3f46, { metalness: 0.3, roughness: 0.45 }));
  psu.add(psuBody);
  const psuFace = decal(1.6, 0.9, (g, W, Hh) => {
    g.fillStyle = '#3b3f46';
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#ffbe00';
    g.fillRect(W * 0.05, Hh * 0.12, W * 0.5, Hh * 0.3);
    g.fillStyle = '#24182e';
    g.font = `700 ${Hh * 0.13}px ${FONT}`;
    g.fillText('POWER SUPPLY', W * 0.08, Hh * 0.25);
    g.font = `500 ${Hh * 0.11}px ${FONT}`;
    g.fillText('500 W · 230 V', W * 0.08, Hh * 0.37);
    g.fillStyle = '#ca1f3f';
    g.font = `700 ${Hh * 0.1}px ${FONT}`;
    g.fillText('⚠ DO NOT OPEN', W * 0.06, Hh * 0.62);
    g.strokeStyle = '#24182e';
    g.lineWidth = 3;
    g.beginPath(); g.arc(W * 0.78, Hh * 0.5, Hh * 0.36, 0, 7); g.stroke();
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(W * 0.78 - Hh * 0.33, Hh * 0.5 + i * Hh * 0.09); g.lineTo(W * 0.78 + Hh * 0.33, Hh * 0.5 + i * Hh * 0.09); g.stroke(); }
  }, { px: 200, transparent: false });
  psuFace.position.z = 0.852;
  psu.add(psuFace);

  // Drives: an SSD on top of a hard drive in the drive cage
  const cageMat = mat(0x5a4470, { roughness: 0.5 });
  const cage = new THREE.Mesh(rgeo(1.25, 1.1, 1.6, 0.03), cageMat);
  cage.position.set(1.45, 0.62, -0.1);
  cage.scale.set(1, 1, 1);
  insides.add(cage);
  const cageHole = box(1.12, 0.96, 0.02, 0x1b1222);
  cageHole.position.set(1.45, 0.62, 0.71);
  cageHole.userData.noInk = true;
  insides.add(cageHole);
  const hdd = part('hdd', 1.45, 0.38, 0.35);
  const hddBody = new THREE.Mesh(rgeo(1.0, 0.28, 1.4, 0.03), mat(0xb8bcc6, { metalness: 0.55, roughness: 0.35 }));
  hdd.add(hddBody);
  const hddTop = decal(0.94, 1.34, (g, W, Hh) => {
    g.fillStyle = '#c5c9d2';
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#ffffff';
    g.fillRect(W * 0.08, Hh * 0.06, W * 0.84, Hh * 0.3);
    g.fillStyle = '#24182e';
    g.textAlign = 'center';
    g.font = `700 ${W * 0.13}px ${FONT}`;
    g.fillText('HARD DRIVE', W / 2, Hh * 0.17);
    g.font = `700 ${W * 0.16}px ${FONT}`;
    g.fillText('1 TB', W / 2, Hh * 0.3);
    g.strokeStyle = '#9aa0ab';
    g.lineWidth = 4;
    g.beginPath(); g.arc(W / 2, Hh * 0.66, W * 0.3, 0, 7); g.stroke();
    g.beginPath(); g.arc(W / 2, Hh * 0.66, W * 0.06, 0, 7); g.stroke();
  }, { px: 160, transparent: false });
  hddTop.rotation.x = -Math.PI / 2;
  hddTop.position.y = 0.142;
  hdd.add(hddTop);
  const ssd = part('ssd', 1.45, 0.82, 0.35);
  const ssdBody = new THREE.Mesh(rgeo(0.8, 0.1, 1.05, 0.02), mat(COLORS.purple, { roughness: 0.4 }));
  ssd.add(ssdBody);
  const ssdTop = decal(0.74, 0.99, (g, W, Hh) => {
    g.fillStyle = '#24182e';
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#ffbe00';
    g.fillRect(0, Hh * 0.7, W, Hh * 0.08);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = `700 ${W * 0.22}px ${FONT}`;
    g.fillText('SSD', W / 2, Hh * 0.35);
    g.font = `600 ${W * 0.14}px ${FONT}`;
    g.fillText('256 GB', W / 2, Hh * 0.55);
  }, { px: 128, transparent: false });
  ssdTop.rotation.x = -Math.PI / 2;
  ssdTop.position.y = 0.052;
  ssd.add(ssdTop);

  // Cables from the power supply (they stay in the box when parts lift out).
  const wires = new THREE.Group();
  wires.add(
    cable([[-0.8, 1.1, 0.4], [-0.4, 1.6, 0.55], [0.6, 1.6, 0.4], [1.1, 1.2, -0.6], [1.2, 1.9, -0.8]], 0x24182e, 0.05),
    cable([[-0.6, 1.1, 0.2], [0.1, 1.35, 0.45], [0.95, 1.05, 0.5], [1.05, 0.85, 0.45]], COLORS.red, 0.03),
    cable([[-0.9, 1.1, -0.2], [-1.2, 2.4, -0.5], [-1.7, 3.8, -0.8]], COLORS.gold, 0.035),
  );
  insides.add(wires);
  shadow(boxView);

  // ======================================================================
  //  PART B · THE CHOP BAR KITCHEN
  // ======================================================================
  const kitchen = new THREE.Group();
  kitchen.visible = false;
  scene.add(kitchen);
  const tiles = decal(10, 6.6, (g, W, Hh) => {
    const n = 16, s = W / n;
    for (let r = 0; r < Math.ceil(Hh / s); r++) for (let c = 0; c < n; c++) {
      g.fillStyle = (r + c) % 2 ? '#e7c8a8' : '#d9b08c';
      g.fillRect(c * s, r * s, s, s);
    }
  }, { px: 256, transparent: false });
  tiles.rotation.x = -Math.PI / 2;
  tiles.position.y = 0.005;
  tiles.receiveShadow = true;
  kitchen.add(tiles);
  // Back wall with the chop bar sign and the order board.
  const backWall = rbox(10, 3.4, 0.2, 0xf4ead8, 0.03);
  backWall.position.set(0, 1.7, -3.3);
  kitchen.add(backWall);
  const kente = decal(10, 0.32, (g, W, Hh) => {
    const cols = ['#ffbe00', '#2a9d8f', '#ca1f3f', '#24182e'];
    for (let i = 0; i < 40; i++) { g.fillStyle = cols[i % 4]; g.fillRect((i * W) / 40, 0, W / 40 + 1, Hh); }
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 80; i++) g.fillRect((i * W) / 80, Hh * 0.45, W / 160, Hh * 0.1);
  }, { px: 64, transparent: false });
  kente.position.set(0, 3.22, -3.19);
  kitchen.add(kente);
  const sign = decal(3.4, 0.75, (g, W, Hh) => {
    g.fillStyle = '#24182e';
    g.beginPath(); g.roundRect(0, 0, W, Hh, 24); g.fill();
    g.fillStyle = '#ffbe00';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${Hh * 0.36}px ${FONT}`;
    g.fillText('AUNTIE ESI\'S CHOP BAR', W / 2, Hh * 0.38);
    g.fillStyle = '#ffffff';
    g.font = `500 ${Hh * 0.2}px ${FONT}`;
    g.fillText('Kitchen · staff only', W / 2, Hh * 0.75);
  }, { px: 128 });
  sign.position.set(0.3, 2.6, -3.19);
  kitchen.add(sign);
  // The chalkboard shows how fast orders go out.
  const chalk = decal(2.2, 1.3, () => {}, { px: 200, transparent: false });
  chalk.position.set(3.4, 1.85, -3.19);
  kitchen.add(chalk);
  const chalkFrame = rbox(2.34, 1.44, 0.06, 0x8a6a4a, 0.03);
  chalkFrame.position.set(3.4, 1.85, -3.22);
  kitchen.add(chalkFrame);

  // Storeroom shelves (left back)
  const store = new THREE.Group();
  store.position.set(-3.6, 0, -2.3);
  kitchen.add(store);
  const wood = mat(0xa87b52, { roughness: 0.7 });
  const sideGeo = rgeo(0.12, 2.8, 1.2, 0.02);
  for (const x of [-1.15, 1.15]) {
    const s = new THREE.Mesh(sideGeo, wood);
    s.position.set(x, 1.4, 0);
    store.add(s);
  }
  const shelfGeo = rgeo(2.4, 0.1, 1.2, 0.02);
  for (const y of [0.2, 1.1, 2.0, 2.75]) {
    const s = new THREE.Mesh(shelfGeo, wood);
    s.position.set(0, y, 0);
    store.add(s);
  }
  const sackGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.62, 14);
  const sackMat = mat(0xe8dcc0, { roughness: 0.9 });
  const jarGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.42, 14);
  const jarMats = [mat(0xca1f3f), mat(0xffbe00), mat(0x2a9d8f)];
  [[-0.6, 0.56], [0.1, 0.56], [0.75, 0.56]].forEach(([x, y]) => {
    const s = new THREE.Mesh(sackGeo, sackMat);
    s.position.set(x, y, 0.05);
    store.add(s);
  });
  [-0.8, -0.35, 0.1, 0.55].forEach((x, i) => {
    const j = new THREE.Mesh(jarGeo, jarMats[i % 3]);
    j.position.set(x, 1.36, 0.1);
    store.add(j);
  });
  const yamGeo = new THREE.CapsuleGeometry(0.11, 0.42, 4, 8);
  const yamMat = mat(0x7a4a2e);
  for (let i = 0; i < 4; i++) {
    const y = new THREE.Mesh(yamGeo, yamMat);
    y.rotation.z = Math.PI / 2;
    y.position.set(-0.6 + i * 0.28, 2.17, (i % 2) * 0.2 - 0.1);
    store.add(y);
  }
  const storeSign = decal(1.9, 0.4, (g, W, Hh) => {
    g.fillStyle = '#ffbe00';
    g.beginPath(); g.roundRect(0, 0, W, Hh, 14); g.fill();
    g.fillStyle = '#24182e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${Hh * 0.55}px ${FONT}`;
    g.fillText('STOREROOM', W / 2, Hh * 0.55);
  }, { px: 64 });
  storeSign.position.set(0, 3.1, 0.62);
  store.add(storeSign);
  // Dishes that do not fit wait on the storeroom bench.
  const bench = rbox(2.2, 0.5, 0.9, 0xa87b52, 0.03);
  bench.position.set(-3.6, 0.25, -0.95);
  kitchen.add(bench);

  // The worktable (its top grows with the RAM size)
  const table = new THREE.Group();
  table.position.set(0.5, 0, 0.6);
  kitchen.add(table);
  const top = new THREE.Mesh(rgeo(1, 0.16, 1, 0.03), mat(0xc8a27a, { roughness: 0.6 }));
  top.position.y = 1.32;
  table.add(top);
  const spots = decal(1, 1, () => {}, { px: 512 });
  spots.rotation.x = -Math.PI / 2;
  spots.position.y = 1.412;
  table.add(spots);
  const legGeo = rgeo(0.16, 1.24, 0.16, 0.03);
  const legMat = mat(0x8a6a4a);
  const legs = [0, 1, 2, 3].map(() => {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.y = 0.62;
    table.add(l);
    return l;
  });
  const tableTag = label('', { scale: 0.55, bg: '#24182E', color: '#FFBE00' });
  table.add(tableTag);
  const SPOT = 0.64;
  let tw = 0, td = 0, cols = 0;
  function layoutTable(gb) {
    cols = gb === 16 ? 8 : 4;
    const rows = gb === 4 ? 1 : 2;
    tw = cols * SPOT + 0.3;
    td = rows * SPOT + 0.3;
    top.scale.set(tw, 1, td);
    spots.scale.set(tw, td, 1);
    legs.forEach((l, i) => l.position.set((i % 2 ? 1 : -1) * (tw / 2 - 0.16), 0.62, (i < 2 ? 1 : -1) * (td / 2 - 0.16)));
    tableTag.position.set(0, 0.3, td / 2 + 0.05);
    const c = spots.material.map.image, g = c.getContext('2d');
    c.width = Math.round(140 * tw);
    c.height = Math.round(140 * td);
    const s = c.width / tw;
    g.fillStyle = '#c8a27a';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(90,60,30,0.45)';
    g.setLineDash([10, 8]);
    g.lineWidth = 3;
    g.fillStyle = 'rgba(90,60,30,0.45)';
    g.font = `600 ${s * 0.16}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 0; i < gb; i++) {
      const [x, z] = spotXZ(i);
      const px = (x + tw / 2) * s, pz = (z + td / 2) * s;
      g.beginPath(); g.roundRect(px - SPOT * s * 0.45, pz - SPOT * s * 0.45, SPOT * s * 0.9, SPOT * s * 0.9, 12); g.stroke();
      g.fillText('1 GB', px, pz);
    }
    spots.material.map.dispose();
    spots.material.map = new THREE.CanvasTexture(c);
    spots.material.map.colorSpace = THREE.SRGBColorSpace;
    spots.material.needsUpdate = true;
  }
  // Spot i on the table: rows fill from the front, left to right.
  function spotXZ(i) {
    const r = Math.floor(i / cols), c = i % cols;
    const rows = Math.round((td - 0.3) / SPOT);
    return [(c - (cols - 1) / 2) * SPOT, ((rows - 1) / 2 - r) * SPOT];
  }

  // Dishes: every GB a programme needs is one plate on the worktable.
  const bowlGeo = new THREE.SphereGeometry(0.2, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const soupGeo = new THREE.CircleGeometry(0.18, 14);
  const soupMat = mat(0xd9632b);
  const bowlMat = mat(0xf9f9f9, { side: THREE.DoubleSide });
  const plateGeo = rgeo(SPOT - 0.1, 0.06, SPOT - 0.1, 0.02);
  const dishes = {};
  for (const p of PROGS) {
    const plateMat = mat(p.color, { roughness: 0.5 });
    const plates = [];
    for (let k = 0; k < p.gb; k++) {
      const g = new THREE.Group();
      const tray = new THREE.Mesh(plateGeo, plateMat);
      tray.position.y = 0.03;
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.rotation.x = Math.PI;
      bowl.position.y = 0.26;
      const soup = new THREE.Mesh(soupGeo, soupMat);
      soup.rotation.x = -Math.PI / 2;
      soup.position.y = 0.24;
      g.add(tray, bowl, soup);
      g.visible = false;
      shadow(g);
      kitchen.add(g);
      plates.push(g);
    }
    const t = label(`${p.icon} ${p.short ?? p.name}`, { scale: 0.42 });
    t.position.set(0, 0.6, 0);
    plates[0].add(t);
    plates.tag = t;
    dishes[p.id] = plates;
  }

  // The cook
  const cook = new THREE.Group();
  const skin = mat(0x6b4226);
  const whiteMat = mat(0xf9f9f9);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.7, 4, 14), whiteMat);
  torso.position.y = 1.45;
  const apron = new THREE.Mesh(rgeo(0.62, 0.8, 0.08, 0.03), mat(COLORS.red));
  apron.position.set(0, 1.3, 0.34);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12), skin);
  head.position.y = 2.25;
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.22, 16), whiteMat);
  hatBand.position.y = 2.55;
  const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 10), whiteMat);
  hatTop.position.y = 2.75;
  hatTop.scale.y = 0.7;
  const eyeGeo = new THREE.SphereGeometry(0.04, 8, 6);
  const eyeMat = mat(0x0b090d);
  for (const x of [-0.1, 0.1]) {
    const e = new THREE.Mesh(eyeGeo, eyeMat);
    e.position.set(x, 2.3, 0.27);
    cook.add(e);
  }
  const legGeoC = new THREE.CapsuleGeometry(0.12, 0.55, 4, 8);
  const trouser = mat(0x24182e);
  const legL = new THREE.Mesh(legGeoC, trouser);
  const legR = new THREE.Mesh(legGeoC, trouser);
  legL.position.set(-0.15, 0.45, 0);
  legR.position.set(0.15, 0.45, 0);
  const armGeo = new THREE.CapsuleGeometry(0.1, 0.55, 4, 8);
  const armL = new THREE.Group(), armR = new THREE.Group();
  for (const [a, x] of [[armL, -0.44], [armR, 0.44]]) {
    const m = new THREE.Mesh(armGeo, whiteMat);
    m.position.y = -0.35;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), skin);
    hand.position.y = -0.72;
    a.add(m, hand);
    a.position.set(x, 1.85, 0);
    cook.add(a);
  }
  const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), mat(0xa87b52));
  spoon.position.set(0, -0.85, 0.2);
  spoon.rotation.x = 0.6;
  armR.add(spoon);
  const crate = rbox(0.5, 0.3, 0.4, 0xa87b52, 0.03);
  crate.position.set(0, 1.25, 0.5);
  crate.visible = false;
  cook.add(torso, apron, head, hatBand, hatTop, legL, legR, crate);
  shadow(cook);
  const cookHome = new THREE.Vector3(0.5, 0, -0.75);
  const storeSpot = new THREE.Vector3(-2.1, 0, -1.65);
  cook.position.copy(cookHome);
  kitchen.add(cook);
  const cookTag = label('', { scale: 0.5, bg: '#FFBE00' });
  cookTag.position.set(0, 3.25, 0);
  cook.add(cookTag);

  // Ticket rail of orders and the serving hatch
  const tickets = decal(2.4, 0.7, () => {}, { px: 160 });
  tickets.position.set(-0.9, 1.8, -3.19);
  kitchen.add(tickets);
  const hatch = rbox(1.6, 1.0, 1.1, 0x5a4470, 0.04);
  hatch.position.set(4.4, 0.5, 1.0);
  kitchen.add(hatch);
  const hatchTop = rbox(1.8, 0.1, 1.3, 0xc8a27a, 0.03);
  hatchTop.position.set(4.4, 1.05, 1.0);
  kitchen.add(hatchTop);
  const served = [];
  const servedGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.16, 14);
  const servedMat = mat(0xf9f9f9);
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(servedGeo, servedMat);
    b.position.set(3.92 + (i % 3) * 0.48, 1.18, 0.75 + Math.floor(i / 3) * 0.5);
    b.visible = false;
    b.castShadow = true;
    kitchen.add(b);
    served.push(b);
  }
  const hatchTag = label('Orders out: 0', { scale: 0.5 });
  hatchTag.position.set(4.4, 1.7, 1.0);
  kitchen.add(hatchTag);
  shadow(kitchen);
  tiles.castShadow = false;

  // ---------- Callouts (most important first: phones show only four) ----------
  const closedSpot = new THREE.Object3D();
  closedSpot.position.set(0.4, Y0 + H * 0.65, D / 2 + 0.1);
  boxView.add(closedSpot);
  stage.callout(closedSpot, { icon: '🖥️', title: 'System unit', text: 'Open the case to see the parts inside.', dx: 170, dy: -60 });
  const cards = {
    cpu: stage.callout(cpu, { icon: '🧑‍🍳', title: 'Processor', text: 'The cook: follows every instruction.', at: [0, 0.4, 0.5], dx: -150, dy: -70, onClick: () => pickPart('cpu') }),
    ram: stage.callout(ram, { icon: '🍲', title: 'Memory (RAM)', text: 'The worktable: holds what is open now.', at: [0.15, 0.8, 0.2], dx: 150, dy: -80, onClick: () => pickPart('ram') }),
    ssd: stage.callout(ssd, { icon: '📦', title: 'Storage (SSD)', text: 'The storeroom: keeps files with the power off.', at: [0.3, 0.06, 0], dx: 180, dy: -10, onClick: () => pickPart('ssd') }),
    psu: stage.callout(psu, { icon: '⚡', title: 'Power supply', text: 'Turns mains power into safe power.', at: [-0.5, 0.2, 0.85], dx: -150, dy: 60, onClick: () => pickPart('psu') }),
    mobo: stage.callout(mobo, { icon: '🟩', title: 'Motherboard', text: 'The board that joins every part.', at: [-1.2, -0.9, 0.05], dx: -170, dy: -20, onClick: () => pickPart('mobo') }),
    hdd: stage.callout(hdd, { icon: '💿', title: 'Hard drive', text: 'A bigger, slower storeroom.', at: [0.4, 0, 0.5], dx: 150, dy: 70, onClick: () => pickPart('hdd') }),
  };
  const kCards = [
    stage.callout(cook, { icon: '🧑‍🍳', title: 'The cook', text: '= the processor (CPU).', at: [0, 2.9, 0], dx: -120, dy: -50 }),
    stage.callout(table, { icon: '🍲', title: 'The worktable', text: '= memory (RAM): fast but small.', at: [0, 1.45, 0.4], dx: 150, dy: 90 }),
    stage.callout(store, { icon: '📦', title: 'The storeroom', text: '= storage: big, but a walk away.', at: [0, 2.4, 0.3], dx: -60, dy: -90 }),
    stage.callout(tickets, { icon: '🧾', title: 'Orders', text: 'The jobs you give the computer.', at: [0, 0.3, 0], dx: 90, dy: -80 }),
  ];
  void kCards;
  for (const id of PART_IDS) stage.clickable(parts[id], () => (quiz ? null : pickPart(id)));
  stage.clickable(hinge, () => setOpen(!open));
  stage.clickable(shell, () => setOpen(!open));

  // ======================================================================
  //  SIDE PANEL
  // ======================================================================
  const modeGroup = ui.group('Choose a view');
  const modeBtns = [
    ui.button('🖥️ Inside the box', () => setMode('box'), { group: modeGroup }),
    ui.button('🍲 Chop bar kitchen', () => setMode('kitchen'), { group: modeGroup }),
  ];
  // Box controls
  const boxCtl = ui.group('1 · Open the system unit');
  const openBtn = ui.button('🔧 Open the case', () => setOpen(!open), { primary: true, group: boxCtl });
  const apartBtn = ui.button('✨ Lift all the parts apart', () => setApart(!apart), { group: boxCtl });
  const partCtl = ui.group('Lift out one part');
  const partBtns = PART_IDS.map((id) => ui.button(PARTS[id].btn, () => pickPart(id), { group: partCtl }));
  const quizCtl = ui.group('2 · Name the parts');
  const quizBox = ui.element('<div class="mail-card" aria-live="polite"><p class="crack">Open the case, then test yourself: the lab lights up a part and you name it.</p></div>', quizCtl).firstElementChild;
  const quizRow = ui.group('');
  quizCtl.appendChild(quizRow);
  const quizBtn = ui.button('🔎 Start: name the parts', () => startQuiz(), { primary: true, group: quizRow });
  // Kitchen controls
  const kitCtl = ui.group('Open programmes (dishes on the worktable)');
  const progBtns = {};
  for (const p of PROGS.filter((x) => !x.fixed)) {
    progBtns[p.id] = ui.button(`${p.icon} ${p.name} · ${p.gb} GB`, () => toggleProg(p.id), { group: kitCtl });
  }
  const meterEl = ui.element('<div><div class="meter" aria-hidden="true"><span></span></div><p class="crack ram-use" aria-live="polite" style="margin-top:6px"></p></div>', kitCtl).firstElementChild;
  const sizeCtl = ui.group('Worktable size (RAM)');
  const sizeBtns = SIZES.map((gb) => ui.button(`${gb} GB`, () => setSize(gb), { group: sizeCtl }));
  const extraCtl = ui.group('');
  ui.button('🧹 Close all programmes', () => closeAll(), { group: extraCtl });
  const dumsorBtn = ui.button('⚡ Lights off (dumsor)!', () => dumsor(), { group: extraCtl });

  // ======================================================================
  //  BOX LOGIC
  // ======================================================================
  let open = false, apart = false, busy = false, lifted = null;
  const LIFT = {
    cpu: [-1.7, 6.3, 0.6], ram: [0.9, 6.6, 0.4], ssd: [3.8, 4.5, 0.6], psu: [-3.9, 1.2, 1.6], mobo: [-0.35, 2.85 + Y0, -D / 2 + 0.12], hdd: [3.8, 1.5, 1.4],
  };
  function setBusy(on) {
    busy = on;
    for (const b of [openBtn, apartBtn, ...partBtns]) {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.5' : '';
    }
  }
  async function setOpen(v) {
    if (busy || quiz || mode !== 'box' || v === open) return;
    setBusy(true);
    if (!v) { await setApart(false, true); await putBack(); }
    open = v;
    closedSpot.visible = !v;
    openBtn.textContent = v ? '🔧 Close the case' : '🔧 Open the case';
    openBtn.setAttribute('aria-pressed', String(v));
    if (v) insides.visible = true;
    const a = hinge.rotation.x, b = v ? Math.PI / 2 : 0;
    stage.reveal();
    await stage.tween((k) => (hinge.rotation.x = a + (b - a) * k), 0.8);
    if (!v) insides.visible = false;
    setBusy(false);
    if (v) ui.info('🔧 The case is open', '<p>Here are the parts that do the real work. Press a part (or its button) to <b>lift it out</b> and read what it does, or press <b>✨ Lift all the parts apart</b>.</p><p>Remember the chop bar kitchen: the <b>cook</b> is the processor, the <b>worktable</b> is the memory (RAM) and the <b>storeroom</b> is the storage.</p><p>⚠️ This is only safe in 3D. <b>Never open a real computer case</b>: there is mains electricity inside.</p>');
    else ui.info('🖥️ Case closed', '<p>Good habit: real cases stay closed. Open it again here whenever you like.</p>');
  }
  const moveTo = (g, to, d = 0.6) => {
    const a = g.position.clone();
    return stage.tween((k) => g.position.lerpVectors(a, to, k), d);
  };
  async function putBack() {
    if (!lifted) return;
    const id = lifted;
    lifted = null;
    stage.highlight(parts[id], false);
    await Promise.all([moveTo(parts[id], parts[id].userData.home), id === 'cpu' ? stage.tween((k) => (cooler.position.z = 0.45 + 0.7 * (1 - k)), 0.6) : null]);
  }
  async function setApart(v, quiet = false) {
    if (v === apart) return;
    if (!quiet && (busy || quiz)) return;
    if (!open) { if (!quiet) ui.info('🔧 Open the case first', '<p>Press <b>🔧 Open the case</b>, then you can lift the parts apart.</p>'); return; }
    if (!quiet) setBusy(true);
    await putBack();
    apart = v;
    apartBtn.textContent = v ? '📥 Put the parts back' : '✨ Lift all the parts apart';
    apartBtn.setAttribute('aria-pressed', String(v));
    stage.reveal();
    await Promise.all([
      ...PART_IDS.map((id) => moveTo(parts[id], v ? new THREE.Vector3(...LIFT[id]).sub(new THREE.Vector3(0, Y0, 0)) : parts[id].userData.home, 0.9)),
      stage.tween((k) => (cooler.position.z = 0.45 + 0.7 * (v ? k : 1 - k)), 0.9),
    ]);
    if (!quiet) {
      setBusy(false);
      if (v) ui.info('✨ All the parts, lifted apart', '<p>Every part has a card. The three that do the real work are the <b>processor</b> (the cook), the <b>memory</b> (the worktable) and the <b>storage</b> (the storeroom: an SSD and a hard drive here).</p><p>The <b>motherboard</b> joins them, and the <b>power supply</b> feeds them all.</p>');
    }
  }
  async function pickPart(id) {
    if (busy || quiz || mode !== 'box') return;
    if (!open) { ui.info('🔧 Open the case first', '<p>Press <b>🔧 Open the case</b> to look inside.</p>'); return; }
    ui.info(PARTS[id].title, `${PARTS[id].text}<p><b>In the kitchen:</b> ${esc(PARTS[id].kitchen)}.</p>`);
    if (apart || id === 'mobo') { stage.highlight(parts[id], true); setTimeout(() => stage.highlight(parts[id], false), 900); return; }
    setBusy(true);
    const again = lifted === id;
    await putBack();
    if (!again) {
      lifted = id;
      stage.highlight(parts[id], true);
      stage.reveal();
      await Promise.all([moveTo(parts[id], new THREE.Vector3(...LIFT[id]).sub(new THREE.Vector3(0, Y0, 0))), id === 'cpu' ? stage.tween((k) => (cooler.position.z = 0.45 + 0.7 * k), 0.6) : null]);
    }
    setBusy(false);
  }

  // ---------- Name the parts (quiz) ----------
  let quiz = null; // { id }
  const named = new Set();
  async function startQuiz() {
    if (busy || mode !== 'box') return;
    if (!open) await setOpen(true);
    if (!open) return;
    const left = PART_IDS.filter((id) => !named.has(id));
    const pool = left.length ? left : PART_IDS;
    const id = pool[Math.floor(Math.random() * pool.length)];
    if (quiz) stage.highlight(parts[quiz.id], false);
    quiz = { id };
    cards[id].card.style.visibility = 'hidden';
    stage.highlight(parts[id], true);
    stage.reveal();
    quizBox.innerHTML = `<small class="mail-count">Named so far: ${named.size} of 4</small><p style="margin:6px 0"><b>Which part is glowing gold?</b> (Its card is hidden.)</p>`;
    quizRow.innerHTML = '';
    for (const pid of PART_IDS) ui.button(PARTS[pid].name, () => answer(pid), { group: quizRow });
    quizRow.querySelector('button')?.focus();
    ui.info('🔎 Name the part', '<p>One part is <b>glowing gold</b> and its card is hidden. Which part is it? Look at its shape and where it sits.</p>');
  }
  function answer(pid) {
    if (!quiz) return;
    const id = quiz.id;
    stage.highlight(parts[id], false);
    cards[id].card.style.visibility = '';
    quiz = null;
    quizRow.innerHTML = '';
    if (pid === id) {
      named.add(id);
      ui.info(`✅ Yes! That is the ${PARTS[id].name}`, `${PARTS[id].text}<p><b>In the kitchen:</b> ${esc(PARTS[id].kitchen)}.</p>`);
      if (named.size >= 4) ui.complete('parts');
    } else {
      ui.info('🤔 Not quite', `<p>That was not the <b>${esc(PARTS[pid].name)}</b>. Look again at the glowing part: ${hintFor(id)} You will get another go at it.</p>`);
    }
    quizBox.innerHTML = `<small class="mail-count">Named so far: ${named.size} of 4${named.size >= 4 ? ' ✅' : ''}</small><p class="crack" style="margin-top:4px">${named.size >= 4 ? 'Brilliant! Keep going, or open the 🍲 kitchen.' : 'Press the button for the next part.'}</p>`;
    ui.button(named.size >= 4 ? '🔎 Name another part' : '🔎 Next part', () => startQuiz(), { primary: true, group: quizRow });
  }
  const hintFor = (id) => ({
    cpu: 'it has metal fins and a fan on top, because it gets hot.',
    ram: 'thin sticks standing in slots, beside the processor.',
    ssd: 'a small, thin, flat box: memory chips, no moving parts.',
    psu: 'a heavy metal box with a fan and a warning label, where the cables come from.',
    mobo: 'the big green board that everything plugs into.',
    hdd: 'a silver metal box with a spinning disc inside.',
  })[id];

  // ======================================================================
  //  KITCHEN LOGIC
  // ======================================================================
  let mode = 'box';
  let size = 4;
  const openProgs = ['win']; // in the order they were opened
  let gen = 0, ordersOut = 0, orderIdx = 0;
  let slowRate = null, slowSeen = false, fixedHow = '';
  const used = () => openProgs.reduce((s, id) => s + PROGS.find((p) => p.id === id).gb, 0);
  const over = () => Math.max(0, used() - size);
  const cycle = () => (over() ? 2 * (0.9 + 0.25 * over()) + 0.8 : 1.0);
  const rate = () => Math.round(60 / cycle());

  function setMode(m) {
    if (busy) return;
    mode = m;
    ui.toggle(modeBtns, modeBtns[m === 'box' ? 0 : 1]);
    modeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String((i === 0) === (m === 'box'))));
    boxView.visible = m === 'box';
    kitchen.visible = m === 'kitchen';
    for (const g of [boxCtl, partCtl, quizCtl]) g.style.display = m === 'box' ? '' : 'none';
    for (const g of [kitCtl, sizeCtl, extraCtl]) g.style.display = m === 'kitchen' ? '' : 'none';
    if (quiz) { stage.highlight(parts[quiz.id], false); cards[quiz.id].card.style.visibility = ''; quiz = null; quizRow.innerHTML = ''; ui.button('🔎 Start: name the parts', () => startQuiz(), { primary: true, group: quizRow }); }
    gen++;
    if (m === 'kitchen') {
      cook.position.copy(cookHome);
      crate.visible = false;
      refreshKitchen();
      runKitchen(gen);
      ui.info('🍲 The chop bar kitchen', '<p>Orders keep coming in: <b>"One fufu and light soup! Two waakye!"</b></p><ul><li>🧑‍🍳 The <b>cook</b> = the <b>processor</b>. It does the work.</li><li>🍲 The <b>worktable</b> = <b>memory (RAM)</b>. Every open programme is a dish on it.</li><li>📦 The <b>storeroom</b> = <b>storage</b>. Big, but a walk away.</li></ul><p>The table is only <b>4 GB</b>, and Windows itself always needs a space. Open programmes until the table is <b>too full</b>, and watch the orders.</p>');
    } else {
      ui.info('🖥️ Inside the box', '<p>Press <b>🔧 Open the case</b> to look inside the system unit. Lift out each part, then test yourself with <b>🔎 Name the parts</b>.</p>');
    }
  }

  // Which programmes fit on the table: the newest stay, older ones go back to the storeroom.
  function fitting() {
    const fit = new Set(['win']);
    let room = size - 1;
    for (const id of [...openProgs].reverse()) {
      const p = PROGS.find((x) => x.id === id);
      if (id !== 'win' && p.gb <= room) { fit.add(id); room -= p.gb; }
    }
    return fit;
  }
  function placeDishes(animate) {
    const fit = fitting();
    let spot = 0, bench = 0;
    for (const p of PROGS) {
      const isOpen = openProgs.includes(p.id);
      if (!isOpen) dishes[p.id].forEach((d) => (d.visible = false));
    }
    let n = 0;
    for (const id of openProgs) {
      // Stagger the name tags so neighbouring dishes do not hide each other.
      dishes[id].tag.position.y = 0.55 + (n++ % 2) * 0.4;
      for (const d of dishes[id]) {
        let to;
        if (fit.has(id)) {
          const [x, z] = spotXZ(spot++);
          to = new THREE.Vector3(table.position.x + x, 1.4, table.position.z + z);
        } else {
          const b = bench++;
          to = new THREE.Vector3(-4.35 + (b % 4) * 0.58, 0.5 + Math.floor(b / 8) * 0.32, -1.2 + (Math.floor(b / 4) % 2) * 0.5);
        }
        move(d, to, animate);
      }
    }
  }
  function move(d, to, animate) {
    if (!d.visible || !animate) { d.visible = true; d.position.copy(to); return; }
    const a = d.position.clone();
    stage.tween((k) => { d.position.lerpVectors(a, to, k); d.position.y += Math.sin(k * Math.PI) * 0.6; }, 0.5);
  }

  function refreshKitchen(animate = false) {
    const u = used(), o = over();
    placeDishes(animate);
    for (const p of PROGS.filter((x) => !x.fixed)) {
      const on = openProgs.includes(p.id);
      progBtns[p.id].classList.toggle('active', on);
      progBtns[p.id].setAttribute('aria-pressed', String(on));
    }
    ui.toggle(sizeBtns, sizeBtns[SIZES.indexOf(size)]);
    sizeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(SIZES[i] === size)));
    const pct = Math.min(100, (u / size) * 100);
    const bar = meterEl.querySelector('.meter span');
    bar.style.width = pct + '%';
    bar.style.background = o ? '#ca1f3f' : pct > 75 ? '#ffbe00' : '#2ec4b6';
    meterEl.querySelector('.ram-use').innerHTML = `Worktable: <b>${u} GB</b> needed, <b>${size} GB</b> table${o ? ` · <b style="color:#ca1f3f">${o} GB too much!</b>` : ' · it all fits ✅'}<br>Orders per minute: <b>${rate()}</b>`;
    setLabel(tableTag, `RAM worktable · ${size} GB`);
    drawChalk();
    drawTickets();
  }
  function drawChalk() {
    const c = chalk.material.map.image, g = c.getContext('2d'), W = c.width, Hh = c.height;
    g.fillStyle = '#24312b';
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#f4f0f6';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `600 ${Hh * 0.13}px ${FONT}`;
    g.fillText('ORDERS PER MINUTE', W / 2, Hh * 0.18);
    const r = rate();
    g.fillStyle = over() ? '#ff8a8a' : '#9be7d9';
    g.font = `700 ${Hh * 0.42}px ${FONT}`;
    g.fillText(String(r), W / 2, Hh * 0.52);
    g.fillStyle = '#f4f0f6';
    g.font = `500 ${Hh * 0.12}px ${FONT}`;
    g.fillText(over() ? 'Too slow! Running to the storeroom' : 'Fast: it all fits on the table', W / 2, Hh * 0.85);
    chalk.material.map.needsUpdate = true;
  }
  function drawTickets() {
    const c = tickets.material.map.image, g = c.getContext('2d'), W = c.width, Hh = c.height;
    g.clearRect(0, 0, W, Hh);
    g.fillStyle = '#8a6a4a';
    g.fillRect(0, 0, W, Hh * 0.08);
    g.font = `600 ${Hh * 0.11}px ${FONT}`;
    g.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      const x = W * (0.02 + i * 0.33);
      g.fillStyle = i === 0 ? '#fff6d0' : '#ffffff';
      g.beginPath(); g.roundRect(x, Hh * 0.1, W * 0.3, Hh * 0.85, 8); g.fill();
      g.fillStyle = '#24182e';
      const words = ORDERS[(orderIdx + i) % ORDERS.length].split(' ');
      let line = '', y = Hh * 0.3;
      for (const w of words) {
        if (g.measureText(line + ' ' + w).width > W * 0.26 && line) { g.fillText(line, x + W * 0.02, y); line = w; y += Hh * 0.17; } else line = line ? line + ' ' + w : w;
      }
      g.fillText(line, x + W * 0.02, y);
    }
    tickets.material.map.needsUpdate = true;
  }

  const walk = (to, d) => {
    const a = cook.position.clone();
    const dir = to.clone().sub(a);
    if (dir.lengthSq() > 0.01) cook.rotation.y = Math.atan2(dir.x, dir.z);
    return stage.tween((k) => {
      cook.position.lerpVectors(a, to, k);
      cook.position.y = Math.abs(Math.sin(k * Math.PI * 6)) * 0.12;
      legL.rotation.x = Math.sin(k * Math.PI * 6) * 0.5;
      legR.rotation.x = -legL.rotation.x;
    }, d, (k) => k);
  };
  async function runKitchen(g) {
    let busyLight = false;
    while (g === gen) {
      if (power === false) { await stage.wait(0.3); continue; }
      const o = over(), r = rate();
      if (o) {
        setLabel(cookTag, '🏃 Fetching from the storeroom…');
        await walk(storeSpot, 0.9 + 0.25 * o);
        if (g !== gen) return;
        crate.visible = true;
        await stage.wait(0.4);
        await walk(cookHome, 0.9 + 0.25 * o);
        crate.visible = false;
        cook.rotation.y = 0;
        if (g !== gen) return;
        await stir(0.4);
      } else {
        setLabel(cookTag, busyLight ? '🍲 Cooking…' : '😀 Everything is to hand!');
        busyLight = !busyLight;
        await stir(1.0);
      }
      if (g !== gen) return;
      serve(o, r);
    }
  }
  const stir = (d) => stage.tween((k) => { armR.rotation.x = -0.9 + Math.sin(k * Math.PI * 4) * 0.35; armR.rotation.z = Math.sin(k * Math.PI * 4) * 0.3; }, d, (k) => k).then(() => { armR.rotation.set(0, 0, 0); });

  function serve(o, r) {
    ordersOut++;
    orderIdx++;
    served.forEach((b, i) => (b.visible = i < ((ordersOut - 1) % 6) + 1));
    setLabel(hatchTag, `Orders out: ${ordersOut}`);
    drawTickets();
    if (o) {
      slowRate = r;
      if (!slowSeen) {
        slowSeen = true;
        ui.complete('slow');
        ui.info('🐢 The worktable is too full!', `<p>The programmes need <b>${used()} GB</b> but the table is only <b>${size} GB</b>. The dishes that do not fit go back to the <b>storeroom</b>, so the cook keeps <b>running back and forth</b> to fetch them.</p><p>Orders per minute fell to <b>${slowRate}</b>, even with a fast cook! A computer with too little RAM does the same: it keeps swapping things to the storage drive, and everything feels slow.</p><p><b>Now fix it:</b> close programmes you are not using, or try a <b>bigger worktable</b> (more RAM).</p>`);
      }
    } else if (slowSeen && slowRate && !ui.isDone('fix')) {
      ui.complete('fix');
      ui.info('🚀 Fast again!', `<p>You ${esc(fixedHow || 'made everything fit on the table')}. Compare:</p><ul><li>Too full: <b>${slowRate}</b> orders per minute 🐢</li><li>Now: <b>${r}</b> orders per minute 🚀</li></ul><p>When everything fits on the worktable, the cook never has to run to the storeroom. That is why <b>closing programmes you are not using</b> (or a computer with <b>more RAM</b>) makes a slow PC faster.</p><p>A bigger <b>storeroom</b> (storage) would not help: the cook still works only on what is on the table!</p>`);
    }
  }

  function toggleProg(id) {
    if (power === false) return;
    const wasOver = over();
    const i = openProgs.indexOf(id);
    const p = PROGS.find((x) => x.id === id);
    if (i >= 0) openProgs.splice(i, 1);
    else openProgs.push(id);
    if (wasOver && !over()) fixedHow = 'closed programmes you were not using';
    if (!wasOver && over()) fixedHow = '';
    refreshKitchen(true);
    stage.reveal();
    if (i < 0 && over() && !slowSeen) ui.info(`${p.icon} ${p.name} is open`, `<p>The table needs <b>${used()} GB</b> but has only <b>${size} GB</b>. Watch the cook…</p>`);
    else if (i < 0 && !over()) ui.info(`${p.icon} ${p.name} is open`, `<p>${esc(p.name)} takes <b>${p.gb} GB</b> of the worktable. Used: <b>${used()} of ${size} GB</b>. ${used() === size ? 'The table is full now. One more programme will not fit!' : 'There is still room.'}</p>`);
    else if (i >= 0) ui.info(`${p.icon} ${p.name} closed`, `<p>Closing a programme <b>clears its space</b> on the worktable. Used now: <b>${used()} of ${size} GB</b>.</p>`);
  }
  function setSize(gb) {
    if (power === false) return;
    const wasOver = over();
    const was = size;
    size = gb;
    layoutTable(gb);
    if (wasOver && !over()) fixedHow = `gave the cook a bigger worktable (${was} GB → ${gb} GB of RAM)`;
    refreshKitchen(true);
    stage.reveal();
    ui.info(`🍲 A ${gb} GB worktable`, `<p>More <b>RAM</b> is a bigger worktable: more programmes can be open at once without the cook running to the storeroom. Used: <b>${used()} of ${size} GB</b>.</p>`);
  }
  function closeAll() {
    if (power === false) return;
    const wasOver = over();
    openProgs.splice(1);
    if (wasOver) fixedHow = 'closed the programmes you were not using';
    refreshKitchen(true);
    ui.info('🧹 Everything closed', '<p>Only Windows is left on the worktable. Plenty of room!</p>');
  }
  let power = true;
  async function dumsor() {
    if (power === false) return;
    power = false;
    dumsorBtn.setAttribute('aria-disabled', 'true');
    const had = openProgs.length - 1;
    openProgs.splice(0);
    for (const p of PROGS) dishes[p.id].forEach((d) => (d.visible = false));
    setLabel(cookTag, '😱 Lights off!');
    ui.info('⚡ Dumsor! The lights went off', `<p>The worktable (RAM) was <b>wiped clean</b>: all ${had ? had + ' open programme' + (had > 1 ? 's' : '') + ' and' : ''} anything not saved is <b>gone</b>.</p><p>The storeroom (storage) is fine: whatever you <b>saved</b> is still safe there. That is why you press <b>Ctrl + S</b> every 5 minutes!</p>`);
    stage.reveal();
    await stage.wait(2.2);
    openProgs.push('win');
    power = true;
    dumsorBtn.setAttribute('aria-disabled', 'false');
    refreshKitchen(true);
    setLabel(cookTag, '💡 Power is back');
  }

  // Idle animation: fans spin, the cook breathes.
  stage.onTick((dt, t) => {
    if (boxView.visible) blades.rotation.z -= dt * 6;
    // The part to name pulses gold, so it is easy to spot.
    if (quiz) {
      const p = 0.5 + 0.5 * Math.sin(t * 6);
      parts[quiz.id].traverse((m) => m.isMesh && m.material?.emissive && m.material.emissive.setRGB(0.55 * p, 0.38 * p, 0));
    }
    if (kitchen.visible) {
      torso.scale.y = 1 + Math.sin(t * 2) * 0.015;
      const small = stage.renderer.domElement.clientWidth < 520;
      cards.mobo.dx = small ? -60 : -170;
    }
  });

  layoutTable(4);
  setMode('box');
  ui.info('💾 Inside the Box', '<p>Today we open a system unit (only in 3D: <b>real cases stay closed!</b>) and meet the three parts that do the real work.</p><p>Press <b>🔧 Open the case</b> to start. Later, switch to the <b>🍲 Chop bar kitchen</b> to see why too little memory makes a computer slow.</p>');
}

export const missions = [
  { id: 'parts', text: 'Open the case and name 4 parts.', hint: 'Press 🔎 Start: name the parts. A part glows gold: pick its name.' },
  { id: 'slow', text: 'In the kitchen, overload the worktable and watch the orders slow down.', hint: 'Open programmes until they need more than 4 GB. Watch the cook run to the storeroom.' },
  { id: 'fix', text: 'Fix the slow kitchen (close programmes or a bigger table) and compare the speed.', hint: 'Close what you are not using, or choose an 8 GB or 16 GB worktable.' },
];

export const config = { camera: [5, 7.5, 12], target: [0, 2.2, 0.6], shadowSize: 9, frame: 0.95, minDistance: 4 };
