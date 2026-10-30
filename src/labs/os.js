// Session 8 — The Headteacher's Office: the operating system (OS) is the
// headteacher between the apps (pupils) and the hardware (classrooms, staff, store).
// 1. Send 3 app requests through the OS to the hardware.
// 2. Switch the laptop between Windows, ChromeOS and Linux: the look changes, the jobs stay.
// 3. Judge app installs with the traffic light, and rescue a frozen app with Task Manager.
import { THREE, COLORS, rbox, mat, decal, label, setLabel } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const APPS = [
  { id: 'word', icon: '📝', name: 'Word', color: '#3b6fd4', ask: 'Please may I use the printer?', hw: 'printer', verb: 'Print my letter' },
  { id: 'paint', icon: '🎨', name: 'Paint', color: '#ff8c42', ask: 'Please may I save my picture?', hw: 'storage', verb: 'Save my picture' },
  { id: 'music', icon: '🎵', name: 'Music', color: '#ca1f3f', ask: 'Please may I play a song?', hw: 'speaker', verb: 'Play a sound' },
  { id: 'game', icon: '🎮', name: 'Game', color: '#2a9d8f', ask: 'I need more memory!', hw: 'memory', verb: 'Ask for more memory' },
  { id: 'chrome', icon: '🌐', name: 'Chrome', color: '#5a4470', ask: 'Please may I use the Wi-Fi?', hw: 'wifi', verb: 'Open a web page' },
  { id: 'camera', icon: '📷', name: 'Camera (phone)', short: 'Camera', color: '#24182e', ask: 'Please may I use the camera?', hw: 'camera', verb: 'Take a photo', phone: true },
];
const HW = [
  { id: 'processor', icon: '🧠', name: 'Processor' },
  { id: 'memory', icon: '🍲', name: 'Memory' },
  { id: 'storage', icon: '📦', name: 'Storage' },
  { id: 'printer', icon: '🖨️', name: 'Printer' },
  { id: 'speaker', icon: '🔊', name: 'Speaker' },
  { id: 'wifi', icon: '📶', name: 'Wi-Fi' },
  { id: 'camera', icon: '📷', name: 'Camera' },
];
const DONE_MSG = {
  printer: 'The OS sends the letter to the <b>printer</b>, one job at a time, so two pupils never print on top of each other.',
  storage: 'The OS finds space in <b>storage</b> and saves the picture in the right folder (looking after files is one of its jobs).',
  speaker: 'The OS passes the sound to the <b>speaker</b> at the volume you set in Settings.',
  memory: 'The OS shares out the <b>memory</b> fairly: the game gets some, but not so much that the other apps starve.',
  wifi: 'The OS talks to the <b>Wi-Fi</b> hardware and fetches the web page.',
  camera: 'On the phone, <b>Android</b> is the headteacher. It checks the app is allowed to use the <b>camera</b> first.',
};
const OSES = {
  windows: { name: 'Windows', full: 'Windows 11', by: 'Microsoft' },
  chromeos: { name: 'ChromeOS', full: 'ChromeOS', by: 'Google' },
  linux: { name: 'Linux', full: 'Linux (Ubuntu)', by: 'people all over the world' },
};
const JOBS = ['Starts the computer and shows the desktop', 'Runs programmes and shares out the processor and memory', 'Looks after files and folders', 'Talks to devices: keyboard, printer, Wi-Fi, sound', 'Keeps it safe: accounts, passwords, updates, antivirus'];
const INSTALLS = [
  { t: 'Scratch, from the Microsoft Store (the "Get" button)', a: 'go', why: 'The Microsoft Store checks its apps. That is a trusted place.' },
  { t: 'FREE-FIFA-full-version.exe from free-games-4u.xyz', a: 'stop', why: 'A paid game offered "free" on a random website often hides malware that steals passwords.' },
  { t: 'Zoom, from zoom.us (the maker\'s own website)', a: 'go', why: 'The maker\'s own official website is a trusted place to get an app.' },
  { t: 'Windows asks: "Do you want to allow this app to make changes to your device?" for an app you don\'t recognise', a: 'wait', why: 'Not sure what it is? Stop and ask your mentor or a trusted adult before you click Yes.' },
  { t: 'A flashing pop-up: "YOUR PC IS INFECTED! Download cleaner now!"', a: 'stop', why: 'That is a scam. Real Windows Security never tells you to download a "cleaner" or phone a number. Close the tab.' },
  { t: 'photos.exe, sent by a stranger on WhatsApp', a: 'stop', why: 'Files from strangers often hide malware. A photo is never an .exe file!' },
];
const LIGHT = { go: '🟢 GO', wait: '🟡 WAIT', stop: '🔴 STOP' };
const PROCS = [
  { id: 'word', name: 'Word (Essay_Esi.docx)', kind: 'mine' },
  { id: 'chrome', name: 'Chrome', kind: 'mine' },
  { id: 'game', name: 'Football Game (Not responding)', kind: 'frozen' },
  { id: 'explorer', name: 'Windows Explorer', kind: 'system' },
  { id: 'security', name: 'Windows Security', kind: 'system' },
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

export default function osLab(stage, ui) {
  const { scene } = stage;
  const T = 1.6;

  // ---------- Desk ----------
  const desk = rbox(9.6, 0.26, 4.4, 0xc8a27a, 0.05);
  desk.position.set(0, T - 0.13, 0.6);
  scene.add(desk);
  const legGeo = rgeo(0.24, T - 0.26, 0.24, 0.03);
  const legMat = mat(0x8a6a4a);
  for (const x of [-4.5, 4.5]) for (const z of [-1.3, 2.5]) {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.set(x, (T - 0.26) / 2, z);
    scene.add(l);
  }

  // ---------- The school board: apps / OS / hardware ----------
  const board = new THREE.Group();
  board.position.set(0, T + 1.45, -1.9);
  scene.add(board);
  const BW = 9.2;
  const backing = rbox(BW, 6.5, 0.16, 0xf4ead8, 0.05);
  backing.position.y = 1.85;
  board.add(backing);
  const kente = decal(BW, 0.28, (g, W, H) => {
    const cols = ['#ffbe00', '#2a9d8f', '#ca1f3f', '#24182e'];
    for (let i = 0; i < 46; i++) { g.fillStyle = cols[i % 4]; g.fillRect((i * W) / 46, 0, W / 46 + 1, H); }
  }, { px: 48, transparent: false });
  kente.position.set(0, 5.0, 0.085);
  board.add(kente);
  const shelfGeo = rgeo(BW - 0.3, 0.12, 0.9, 0.03);
  const shelfMat = mat(0xa87b52, { roughness: 0.7 });
  for (const y of [3.75, 0.55]) {
    const s = new THREE.Mesh(shelfGeo, shelfMat);
    s.position.set(0, y, 0.45);
    board.add(s);
  }
  const rowLabel = (text, y, color) => {
    const d = decal(2.6, 0.32, (g, W, H) => {
      g.fillStyle = color;
      g.beginPath(); g.roundRect(0, 0, W, H, 14); g.fill();
      g.fillStyle = color === '#24182e' ? '#ffbe00' : '#24182e';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fit(g, text, 700, H * 0.5, W * 0.92);
      g.fillText(text, W / 2, H * 0.54);
    }, { px: 64 });
    d.position.set(-BW / 2 + 1.5, y, 0.09);
    board.add(d);
  };
  rowLabel('THE PUPILS: APPS', 4.7, '#ffffff');
  rowLabel('CLASSROOMS, STAFF & STORE: HARDWARE', 1.5, '#ffffff');
  // App tiles
  const tileGeo = rgeo(0.78, 0.78, 0.22, 0.12);
  const tiles = {};
  const iconDecal = (icon, name, bg, fg = '#ffffff') => decal(0.7, 0.7, (g, W, H) => {
    g.fillStyle = bg;
    g.beginPath(); g.roundRect(0, 0, W, H, 18); g.fill();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${H * 0.42}px ${FONT}`;
    g.fillText(icon, W / 2, H * 0.4);
    g.fillStyle = fg;
    fit(g, name, 600, H * 0.15, W * 0.92);
    g.fillText(name, W / 2, H * 0.82);
  }, { px: 128 });
  APPS.forEach((a, i) => {
    const t = new THREE.Mesh(tileGeo, mat(new THREE.Color(a.color).getHex(), { roughness: 0.45 }));
    t.position.set(-1.6 + i * 1.02, 4.25, 0.5);
    const face = iconDecal(a.icon, a.short ?? a.name, a.color);
    face.position.z = 0.112;
    t.add(face);
    board.add(t);
    tiles[a.id] = t;
  });
  // Installed apps appear in a little row on the right of the app shelf.
  const newApps = new THREE.Group();
  board.add(newApps);
  // Hardware tiles
  const hwTiles = {};
  const hwGeo = rgeo(0.9, 0.9, 0.4, 0.06);
  HW.forEach((h, i) => {
    const t = new THREE.Mesh(hwGeo, mat(0xd9d3de, { roughness: 0.5 }));
    t.position.set(-1.7 + i * 1.02, 1.03, 0.55);
    const face = iconDecal(h.icon, h.name, '#3d3149');
    face.position.z = 0.205;
    face.scale.setScalar(1.15);
    t.add(face);
    board.add(t);
    hwTiles[h.id] = t;
  });
  // The OS layer: a gold beam with the headteacher on it.
  const beam = new THREE.Mesh(rgeo(BW - 0.2, 0.62, 0.7, 0.06), mat(COLORS.gold, { roughness: 0.45 }));
  beam.position.set(0, 2.62, 0.5);
  board.add(beam);
  const beamText = decal(BW - 0.4, 0.5, () => {}, { px: 64 });
  beamText.position.set(0, 2.62, 0.856);
  board.add(beamText);
  function drawBeam(osName) {
    const c = beamText.material.map.image, g = c.getContext('2d'), W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#24182e';
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    fit(g, 'THE HEADTEACHER', 700, H * 0.42, W * 0.3);
    g.fillText('THE HEADTEACHER', W * 0.13, H * 0.52);
    g.textAlign = 'right';
    fit(g, `OPERATING SYSTEM: ${osName.toUpperCase()}`, 700, H * 0.42, W * 0.34);
    g.fillText(`OPERATING SYSTEM: ${osName.toUpperCase()}`, W * 0.98, H * 0.52);
    beamText.material.map.needsUpdate = true;
  }
  // The headteacher
  const head = new THREE.Group();
  const smock = mat(0x5a4470);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 12), smock);
  body.position.y = 0.55;
  const kenteSash = new THREE.Mesh(rgeo(0.12, 0.7, 0.56, 0.02), mat(COLORS.gold));
  kenteSash.position.set(0, 0.6, 0.02);
  kenteSash.rotation.z = 0.6;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(0x6b4226));
  face.position.y = 1.15;
  const glasses = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), mat(0x24182e));
  glasses.position.set(-0.08, 1.18, 0.2);
  const glasses2 = glasses.clone();
  glasses2.position.x = 0.08;
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 12), mat(COLORS.gold, { metalness: 0.5 }));
  bell.position.set(0.36, 0.55, 0.12);
  head.add(body, kenteSash, face, glasses, glasses2, bell);
  shadow(head);
  head.position.set(-3.2, 2.93, 0.6);
  board.add(head);
  const headTag = label('', { scale: 0.5, bg: '#24182E', color: '#FFBE00' });
  headTag.position.set(0, 1.65, 0);
  head.add(headTag);
  // A safety shield on the OS beam (for blocked installs).
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 6), mat(0x2ec4b6, { emissive: 0x000000 }));
  shield.rotation.x = Math.PI / 2;
  shield.position.set(3.7, 2.95, 0.9);
  board.add(shield);
  shadow(board);

  // ---------- Laptop ----------
  const laptop = new THREE.Group();
  laptop.position.set(-0.8, T, 0.9);
  scene.add(laptop);
  const LW = 3.5, LD = 2.2;
  const base = rbox(LW, 0.14, LD, 0x3d3149, 0.06, { roughness: 0.4, metalness: 0.2 });
  base.position.y = 0.07;
  const kb = decal(LW - 0.4, LD * 0.5, (g, W, H) => {
    g.fillStyle = '#2b2233';
    g.fillRect(0, 0, W, H);
    const kw = W / 14.6;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) {
      g.fillStyle = '#d9d3de';
      g.beginPath(); g.roundRect(c * kw + kw * 0.3, r * (H / 5) + 3, kw * 0.82, H / 5 - 6, 3); g.fill();
    }
  }, { px: 128 });
  kb.rotation.x = -Math.PI / 2;
  kb.position.set(0, 0.142, -0.3);
  const pad = decal(1.0, 0.55, (g, W, H) => { g.fillStyle = '#4a3d58'; g.beginPath(); g.roundRect(0, 0, W, H, 10); g.fill(); }, { px: 64 });
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.142, 0.62);
  const lid = new THREE.Group();
  lid.position.set(0, 0.14, -LD / 2);
  lid.rotation.x = -0.22;
  const lidBody = rbox(LW, 2.3, 0.08, 0x3d3149, 0.06, { roughness: 0.4, metalness: 0.2 });
  lidBody.position.y = 1.15;
  const lapScreen = decal(LW - 0.2, 2.1, () => {}, { px: 400, transparent: false });
  lapScreen.position.set(0, 1.16, 0.042);
  lid.add(lidBody, lapScreen);
  laptop.add(base, kb, pad, lid);
  shadow(laptop);

  // ---------- Phone on a stand ----------
  const phone = new THREE.Group();
  phone.position.set(2.5, T + 0.15, 0.6);
  phone.rotation.set(-0.2, -0.25, 0);
  const pBody = rbox(0.95, 1.85, 0.1, COLORS.purple, 0.12);
  pBody.position.y = 0.92;
  const phoneScreen = decal(0.85, 1.72, () => {}, { px: 220, transparent: false });
  phoneScreen.position.set(0, 0.92, 0.052);
  phone.add(pBody, phoneScreen);
  shadow(phone);
  scene.add(phone);
  const stand = rbox(1.0, 0.15, 0.7, 0x5a4470, 0.04);
  stand.position.set(2.5, T + 0.075, 0.75);
  scene.add(stand);

  // ---------- Printer, speaker, traffic light ----------
  const printer = new THREE.Group();
  printer.position.set(-3.6, T, 0.3);
  printer.rotation.y = 0.3;
  const prBody = rbox(1.5, 0.7, 1.2, 0xd9d3de, 0.08);
  prBody.position.y = 0.35;
  const prTop = rbox(1.3, 0.07, 0.9, 0x5a4470, 0.03);
  prTop.position.set(0, 0.72, -0.05);
  const page = rbox(0.8, 0.02, 1.0, 0xffffff, 0.005);
  page.position.set(0, 0.45, 0.4);
  page.visible = false;
  printer.add(prBody, prTop, page);
  shadow(printer);
  scene.add(printer);
  const speaker = new THREE.Group();
  const spBody = rbox(0.55, 0.9, 0.5, 0x24182e, 0.08);
  spBody.position.y = 0.45;
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 18), mat(0x5a4470));
  cone.rotation.x = Math.PI / 2;
  cone.position.set(0, 0.5, 0.26);
  speaker.add(spBody, cone);
  shadow(speaker);
  speaker.position.set(1.35, T, 0.1);
  scene.add(speaker);
  const spTag = label('', { scale: 0.5 });
  spTag.position.set(0, 1.3, 0);
  speaker.add(spTag);

  const light = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), mat(0x24182e));
  pole.position.y = 0.3;
  const housing = rbox(0.42, 1.1, 0.3, 0x24182e, 0.08);
  housing.position.y = 1.1;
  light.add(pole, housing);
  const lamps = {};
  [['stop', 0xca1f3f, 1.42], ['wait', 0xffbe00, 1.1], ['go', 0x2ec4b6, 0.78]].forEach(([id, c, y]) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), mat(c, { emissive: 0x000000 }));
    l.position.set(0, y, 0.14);
    l.userData.c = c;
    light.add(l);
    lamps[id] = l;
  });
  shadow(light);
  light.position.set(-3.9, T, 1.9);
  scene.add(light);
  const setLight = (id) => { for (const [k, l] of Object.entries(lamps)) l.material.emissive.setHex(k === id ? l.userData.c : 0x000000); };

  // The request "letter" that travels from app to OS to hardware.
  const letter = new THREE.Group();
  const env = rbox(0.5, 0.32, 0.06, 0xffffff, 0.02);
  const seal = new THREE.Mesh(new THREE.CircleGeometry(0.07, 14), mat(COLORS.red));
  seal.position.z = 0.032;
  letter.add(env, seal);
  letter.visible = false;
  scene.add(letter);
  const letterTag = label('', { scale: 0.45, bg: '#FFFFFF' });
  letterTag.position.set(0, 0.42, 0);
  letter.add(letterTag);

  // ---------- Callouts (most important first) ----------
  stage.callout(tiles.music, { icon: '🧒', title: 'Apps (pupils)', text: 'They ask the OS for what they need.', at: [0, 0.4, 0], dx: 60, dy: -80 });
  stage.callout(head, { icon: '🧑‍🏫', title: 'Operating system', text: 'The headteacher: decides who uses what.', at: [0, 1.3, 0], dx: -250, dy: -40 });
  stage.callout(hwTiles.camera, { icon: '🏫', title: 'Hardware', text: 'Classrooms, staff and store.', at: [0.4, 0, 0.2], dx: 150, dy: 10 });
  stage.callout(laptop, { icon: '💻', title: 'Laptop', text: 'Windows, ChromeOS or Linux.', at: [-LW / 2, 1.9, -LD / 2], dx: -130, dy: -30 });
  stage.callout(phone, { icon: '📱', title: 'Phone', text: 'Android is its headteacher.', at: [0.5, 1.4, 0], dx: 120, dy: 90 });
  stage.callout(light, { icon: '🚦', title: 'App traffic light', text: 'Install only from trusted places.', at: [0, 1.0, 0], dx: -40, dy: 110 });

  // ======================================================================
  //  SCREENS
  // ======================================================================
  let os = 'windows';
  let win = null; // { title, lines, kind }
  const sg = (d) => { const c = d.material.map.image; return [c.getContext('2d'), c.width, c.height]; };
  function drawLaptop() {
    const [g, W, H] = sg(lapScreen);
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    if (os === 'windows') {
      const grd = g.createRadialGradient(W * 0.5, H * 0.55, 10, W * 0.5, H * 0.5, W * 0.6);
      grd.addColorStop(0, '#9cc3ff'); grd.addColorStop(0.5, '#3b6fd4'); grd.addColorStop(1, '#1b2a6b');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(244,240,246,0.95)'; g.fillRect(0, H * 0.9, W, H * 0.1);
      const icons = ['⊞', '🔍', '📁', '🌐', '📝'];
      g.font = `${H * 0.05}px ${FONT}`;
      g.textAlign = 'center';
      icons.forEach((ic, i) => { g.fillStyle = i === 0 ? '#3b6fd4' : '#24182e'; g.fillText(ic, W * (0.4 + i * 0.05), H * 0.95); });
      g.fillStyle = '#24182e'; g.font = `500 ${H * 0.035}px ${FONT}`; g.fillText('10:41', W * 0.94, H * 0.95);
    } else if (os === 'chromeos') {
      const grd = g.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, '#2ec4b6'); grd.addColorStop(1, '#ff8c42');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(36,24,46,0.55)';
      g.beginPath(); g.roundRect(W * 0.03, H * 0.89, W * 0.94, H * 0.09, H * 0.045); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(W * 0.07, H * 0.935, H * 0.025, 0, 7); g.fill();
      g.textAlign = 'center';
      g.font = `${H * 0.045}px ${FONT}`;
      ['🌐', '📁', '▶️', '📝'].forEach((ic, i) => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(W * (0.42 + i * 0.06), H * 0.935, H * 0.032, 0, 7); g.fill(); g.fillText(ic, W * (0.42 + i * 0.06), H * 0.937); });
      g.fillStyle = '#ffffff'; g.font = `500 ${H * 0.035}px ${FONT}`; g.fillText('10:41  📶 🔋', W * 0.88, H * 0.935);
    } else {
      const grd = g.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, '#e95420'); grd.addColorStop(1, '#5a1a4a');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1b1222'; g.fillRect(0, 0, W, H * 0.06);
      g.fillStyle = '#ffffff'; g.font = `500 ${H * 0.035}px ${FONT}`;
      g.fillText('Activities', W * 0.02, H * 0.03);
      g.textAlign = 'center'; g.fillText('Thu 10:41', W / 2, H * 0.03);
      g.textAlign = 'right'; g.fillText('📶 🔋', W * 0.98, H * 0.03);
      g.fillStyle = 'rgba(27,18,34,0.75)'; g.fillRect(0, H * 0.06, W * 0.07, H * 0.94);
      g.textAlign = 'center'; g.font = `${H * 0.045}px ${FONT}`;
      ['🌐', '📁', '📝', '🎵', '⋮⋮'].forEach((ic, i) => g.fillText(ic, W * 0.035, H * (0.14 + i * 0.1)));
    }
    if (win) drawWindow(g, W, H);
    lapScreen.material.map.needsUpdate = true;
  }
  function drawWindow(g, W, H) {
    const x = W * 0.14, y = H * 0.1, w = W * 0.72, h = H * 0.72;
    const r = os === 'windows' ? 6 : os === 'chromeos' ? 18 : 10;
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 16;
    g.fillStyle = '#ffffff';
    g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
    g.restore();
    const bar = os === 'linux' ? '#2b2233' : win.kind === 'frozen' ? '#e8e2ec' : '#f4f0f6';
    g.fillStyle = bar;
    g.beginPath(); g.roundRect(x, y, w, h * 0.12, [r, r, 0, 0]); g.fill();
    g.fillStyle = os === 'linux' ? '#ffffff' : '#24182e';
    g.textAlign = 'left';
    fit(g, win.title, 600, h * 0.06, w * 0.7);
    g.fillText(win.title, x + w * 0.03, y + h * 0.06);
    // window buttons in each OS's style
    if (os === 'linux') { g.fillStyle = '#e95420'; g.beginPath(); g.arc(x + w * 0.95, y + h * 0.06, h * 0.025, 0, 7); g.fill(); }
    else { g.textAlign = 'right'; g.font = `500 ${h * 0.06}px ${FONT}`; g.fillText('—  ☐  ✕', x + w * 0.97, y + h * 0.06); }
    g.textAlign = 'left';
    g.fillStyle = '#24182e';
    (win.lines ?? []).forEach((l, i) => {
      const t = typeof l === 'string' ? { t: l } : l;
      if (t.bg) { g.fillStyle = t.bg; g.fillRect(x + w * 0.04, y + h * (0.2 + i * 0.105) - h * 0.045, w * 0.92, h * 0.09); }
      g.fillStyle = t.color ?? '#24182e';
      fit(g, t.t, t.b ? 700 : 400, h * 0.06, w * 0.88);
      g.fillText(t.t, x + w * 0.06, y + h * (0.2 + i * 0.105));
    });
    if (win.kind === 'frozen') {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(x, y + h * 0.12, w, h * 0.88);
      g.strokeStyle = '#3b6fd4'; g.lineWidth = 6;
      g.beginPath(); g.arc(x + w / 2, y + h * 0.58, h * 0.1, spin, spin + 4.5); g.stroke();
    }
  }
  let spin = 0;
  function drawPhone(cam = false) {
    const [g, W, H] = sg(phoneScreen);
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    if (cam) {
      g.fillStyle = '#1b1222'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#2a9d8f'; g.fillRect(W * 0.05, H * 0.15, W * 0.9, H * 0.6);
      g.fillStyle = '#ffbe00'; g.beginPath(); g.arc(W * 0.5, H * 0.38, W * 0.12, 0, 7); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(W / 2, H * 0.86, W * 0.1, 0, 7); g.fill();
    } else {
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#5a4470'); grd.addColorStop(1, '#2ec4b6');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffffff'; g.font = `500 ${W * 0.07}px ${FONT}`;
      g.textAlign = 'left'; g.fillText('10:41', W * 0.06, H * 0.03);
      g.textAlign = 'right'; g.fillText('📶 🔋', W * 0.94, H * 0.03);
      g.textAlign = 'center';
      g.font = `700 ${W * 0.13}px ${FONT}`; g.fillText('10:41', W / 2, H * 0.14);
      const icons = ['📷', '💬', '🎵', '🌐', '📞', '⚙️', '🗺️', '📁'];
      icons.forEach((ic, i) => {
        const cx = W * (0.2 + (i % 4) * 0.2), cy = H * (0.62 + Math.floor(i / 4) * 0.13);
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(cx, cy, W * 0.075, 0, 7); g.fill();
        g.font = `${W * 0.08}px ${FONT}`; g.fillStyle = '#24182e'; g.fillText(ic, cx, cy + 1);
      });
      g.fillStyle = '#ffffff'; g.font = `500 ${W * 0.06}px ${FONT}`; g.fillText('Android', W / 2, H * 0.93);
    }
    phoneScreen.material.map.needsUpdate = true;
  }

  // ======================================================================
  //  SIDE PANEL
  // ======================================================================
  const tabsG = ui.group('Three parts');
  const tabBtns = [
    ui.button('1 📨 Requests', () => showPart(1), { group: tabsG }),
    ui.button('2 🎨 Change the look', () => showPart(2), { group: tabsG }),
    ui.button('3 🛡️ Keep it safe', () => showPart(3), { group: tabsG }),
  ];
  const box3 = ui.group('');
  let part = 1, busy = false, run = 0;
  const title = (t, g = box3) => ui.element(`<span class="lab-group-title">${esc(t)}</span>`, g);
  function setBusy(on) {
    busy = on;
    box3.querySelectorAll('button').forEach((b) => { b.setAttribute('aria-disabled', String(on)); b.style.opacity = on ? '0.5' : ''; });
    tabBtns.forEach((b) => { b.setAttribute('aria-disabled', String(on)); b.style.opacity = on ? '0.5' : ''; });
  }
  function showPart(n) {
    if (busy) return;
    if (part === 3 && n !== 3) { frozen = false; tmOpen = false; selProc = null; }
    part = n;
    run++;
    ui.toggle(tabBtns, tabBtns[n - 1]);
    tabBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === n - 1)));
    box3.innerHTML = '';
    setLight(null);
    [partRequests, partLook, partSafe][n - 1]();
  }

  // ---------- Part 1: requests through the OS ----------
  const sent = new Set();
  let reqInfo = null;
  function partRequests() {
    title('Click an app to send its request');
    for (const a of APPS) ui.button(`${a.icon} ${a.name}: ${a.verb}`, () => request(a.id), { group: box3 }).style.textAlign = 'left';
    reqInfo = ui.element(`<p class="crack" aria-live="polite">Requests sent: <b>${sent.size}</b> of 3 different ones.</p>`, box3).firstElementChild;
    win = null;
    drawLaptop();
    drawPhone();
    ui.info('📨 Apps ask, the OS decides', '<p>Apps never go straight to the hardware. They <b>ask the operating system</b>, and the OS shares out the hardware fairly, just like a headteacher.</p><p>Click an app and follow its request: <b>app → OS → hardware</b>.</p>');
  }
  const boardPos = (obj, dz = 0.5) => obj.localToWorld(V(0, 0, 0)).add(V(0, 0, dz));
  const fly = (from, to, d = 0.7, hop = 0.3) => stage.tween((k) => { letter.position.lerpVectors(from, to, k); letter.position.y += Math.sin(k * Math.PI) * hop; }, d);
  async function request(id) {
    if (busy) return;
    const a = APPS.find((x) => x.id === id);
    setBusy(true);
    const r = run;
    stage.reveal();
    const osName = a.phone ? 'Android' : OSES[os].name;
    drawBeam(osName);
    win = a.phone ? null : { title: `${a.icon} ${a.name}`, lines: [{ t: a.verb + '…', b: true }, a.ask] };
    drawLaptop();
    if (a.phone) drawPhone(true);
    stage.highlight(tiles[id], true);
    letter.visible = true;
    setLabel(letterTag, `${a.icon} “${a.ask}”`);
    const pA = boardPos(tiles[id], 0.4), pOS = head.localToWorld(V(-0.45, 0.9, 0.35)), pHW = boardPos(hwTiles[a.hw], 0.45);
    letter.position.copy(pA);
    ui.info(`${a.icon} ${a.name} asks…`, `<p><b>“${esc(a.ask)}”</b></p><p>The request goes to the headteacher first: <b>${esc(osName)}</b>.</p>`);
    await stage.wait(0.5);
    await fly(pA, pOS, 0.8);
    setLabel(headTag, id === 'game' ? '🤔 You may have 2 GB.' : '✅ Yes, you may.');
    const y0 = head.position.y;
    await stage.tween((k) => (head.position.y = y0 + Math.sin(k * Math.PI * 2) * 0.08), 0.6);
    setLabel(letterTag, `✅ Approved by ${osName}`);
    await fly(pOS, pHW, 0.8);
    stage.highlight(hwTiles[a.hw], true);
    letter.visible = false;
    await deliver(a.hw);
    stage.highlight(tiles[id], false);
    stage.highlight(hwTiles[a.hw], false);
    setLabel(headTag, '');
    drawBeam(OSES[os].name);
    if (a.phone) drawPhone(false);
    setBusy(false);
    if (r !== run) return;
    sent.add(id);
    if (reqInfo) reqInfo.innerHTML = `Requests sent: <b>${sent.size}</b> different one${sent.size === 1 ? '' : 's'}${sent.size >= 3 ? ' ✅' : ' (send 3)'}.`;
    ui.info(`✅ ${a.name} got what it asked for`, `<p>${DONE_MSG[a.hw]}</p><p><b>App → OS → hardware.</b> The app never touched the hardware itself.</p>${sent.size >= 3 ? '' : `<p>Send <b>${3 - sent.size}</b> more different request${3 - sent.size > 1 ? 's' : ''}.</p>`}`);
    if (sent.size >= 3) ui.complete('requests');
  }
  async function deliver(hw) {
    if (hw === 'printer') {
      page.visible = true;
      await stage.tween((k) => page.position.set(0, 0.45, 0.4 + k * 0.5), 0.8);
      await stage.wait(0.4);
      page.visible = false;
      page.position.set(0, 0.45, 0.4);
    } else if (hw === 'speaker') {
      for (const t of ['🎵', '🎵 ♪', '🎵 ♪ ♫']) { setLabel(spTag, t); await stage.wait(0.35); }
      setLabel(spTag, '');
    } else if (hw === 'camera') {
      await stage.wait(0.3);
      phoneScreen.material.color.setScalar(2.5);
      await stage.wait(0.15);
      phoneScreen.material.color.setScalar(1);
      await stage.wait(0.4);
    } else {
      win = win && { ...win, lines: [...win.lines, { t: hw === 'storage' ? '✅ Saved in Pictures' : hw === 'memory' ? '✅ 2 GB of memory given' : '✅ Page loaded', color: '#2a9d8f', b: true }] };
      drawLaptop();
      await stage.wait(0.9);
    }
  }

  // ---------- Part 2: change the look ----------
  const seen = new Set(['windows']);
  function partLook() {
    title('Switch the laptop\'s operating system');
    const btns = Object.entries(OSES).map(([id, o]) => ui.button(`${o.name}`, () => { setOs(id); ui.toggle(btns, btns[Object.keys(OSES).indexOf(id)]); }, { group: box3 }));
    ui.toggle(btns, btns[Object.keys(OSES).indexOf(os)]);
    ui.element(`<div class="mail-card" style="margin-top:6px"><small class="mail-count">The headteacher's five big jobs</small><ol style="margin:6px 0 0;padding-left:18px">${JOBS.map((j) => `<li>${esc(j)}</li>`).join('')}</ol></div>`, box3);
    const q = ui.group('');
    box3.appendChild(q);
    q.style.display = 'none';
    partLook.q = q;
    win = null;
    drawLaptop();
    if (seen.size === 3 && !ui.isDone('looks')) askLook();
    ui.info('🎨 Different schools, different headteachers', '<p>Switch the laptop between <b>Windows</b>, <b>ChromeOS</b> and <b>Linux</b>. Look at the desktop each time.</p><p>What <b>changes</b>? What <b>stays the same</b>?</p>');
  }
  function setOs(id) {
    if (busy) return;
    os = id;
    seen.add(id);
    win = { title: id === 'windows' ? 'File Explorer' : id === 'chromeos' ? 'Files' : 'Files (Nautilus)', lines: ['📁 Documents', '📁 Pictures', '📁 BIH_Practice'] };
    drawLaptop();
    drawBeam(OSES[id].name);
    stage.reveal();
    const o = OSES[id];
    const look = { windows: 'a taskbar in the middle at the bottom, and the Start button ⊞', chromeos: 'a "shelf" at the bottom with round app icons, and the launcher circle on the left', linux: 'a top bar with "Activities", and a dock of apps down the left side' }[id];
    ui.info(`${o.full}`, `<p>Made by <b>${esc(o.by)}</b>. It has ${look}.</p><p>But look at the board: the headteacher still does the <b>same five jobs</b>, and the files are still in folders.</p><p>Seen: <b>${seen.size} of 3</b>${seen.size < 3 ? '. Try another one!' : '.'}</p>`);
    if (seen.size === 3 && !ui.isDone('looks')) askLook();
  }
  function askLook() {
    const q = partLook.q;
    if (!q || !q.isConnected) return;
    q.style.display = '';
    q.innerHTML = '<span class="lab-group-title">You tried all three. What stayed the same?</span>';
    for (const [t, good] of [['The wallpaper and the colours', false], ['The jobs the operating system does', true], ['Where the app buttons are', false]]) {
      ui.button(t, () => {
        if (good) {
          q.innerHTML = '<p class="crack">✅ The look changes, the jobs stay.</p>';
          ui.complete('looks');
          ui.info('✅ The look changes, the jobs stay', '<p>Windows, ChromeOS and Linux (and macOS, Android and iOS) all <b>look different</b>, but every one does the <b>same five jobs</b>. Once you know one well, learning another is much easier.</p>');
        } else ui.info('🤔 Look again', '<p>That part <b>changed</b> each time you switched. What did the headteacher keep doing, whichever operating system it was?</p>');
      }, { group: q });
    }
  }

  // ---------- Part 3: keep it safe ----------
  let ii = 0, good = 0, judged = false, rescued = false, frozen = false, selProc = null, tmOpen = false;
  function partSafe() {
    title('A · The app traffic light');
    const card = ui.element('<div class="mail-card" aria-live="polite"></div>', box3).firstElementChild;
    const row = ui.group('');
    box3.appendChild(row);
    title('B · Rescue a frozen app');
    const fRow = ui.group('');
    box3.appendChild(fRow);
    const drawCard = () => {
      row.innerHTML = '';
      if (ii >= INSTALLS.length) {
        const perfect = good === INSTALLS.length;
        card.innerHTML = `<p class="mail-done">${perfect ? '🏆' : '🔁'} You judged <b>${good} of ${INSTALLS.length}</b> correctly.</p>`;
        ui.button('↺ Try again', () => { ii = good = 0; judged = false; newApps.clear(); drawCard(); showInstall(); }, { group: row });
        return;
      }
      const it = INSTALLS[ii];
      card.innerHTML = `<small class="mail-count">App ${ii + 1} of ${INSTALLS.length} · ✅ ${good} right</small><p style="margin:6px 0"><b>${esc(it.t)}</b></p><small class="mail-count">Install it?</small>`;
      if (judged) { ui.button(ii + 1 < INSTALLS.length ? 'Next app ▶' : 'See my score ▶', () => { ii++; judged = false; setLight(null); if (ii >= INSTALLS.length) finishInstalls(); drawCard(); showInstall(); }, { primary: true, group: row }); return; }
      ui.button('🟢 Go: install it', () => judge('go'), { group: row });
      ui.button('🟡 Wait: ask a mentor first', () => judge('wait'), { group: row });
      ui.button('🔴 Stop: don\'t install', () => judge('stop'), { group: row });
    };
    async function judge(ans) {
      if (busy || judged) return;
      judged = true;
      const it = INSTALLS[ii];
      const ok = ans === it.a;
      if (ok) good++;
      setLight(it.a);
      stage.reveal();
      ui.info(ok ? `✅ Right: ${LIGHT[it.a]}` : `⚠️ Careful: this one is ${LIGHT[it.a]}`, `<p>${esc(it.why)}</p>`);
      setBusy(true);
      await installAnim(it.a);
      setBusy(false);
      drawCard();
    }
    const drawF = () => {
      fRow.innerHTML = '';
      if (!frozen && !tmOpen) { ui.button('🎮 Open the football game', () => openGame(), { group: fRow }); return; }
      if (frozen && !tmOpen) {
        ui.button('🖱️ Click the game', () => ui.info('🧊 Nothing happens', '<p>The game is <b>frozen</b> ("Not responding"). Clicking again and again will not help.</p>'), { group: fRow });
        ui.button('⏳ Wait 30 seconds', () => { ui.info('⏳ Still frozen', '<p>Good habit: waiting a little first. But it is still <b>Not responding</b>. Time to ask the headteacher for help: open <b>Task Manager</b>.</p>'); }, { group: fRow });
        ui.button('⌨️ Ctrl + Shift + Esc', () => openTM(), { primary: true, group: fRow });
        return;
      }
      title('Task Manager · Processes', fRow);
      for (const p of PROCS) {
        const b = ui.button(p.name, () => { selProc = p.id; drawTM(); drawF(); }, { group: fRow });
        b.classList.toggle('active', selProc === p.id);
        b.setAttribute('aria-pressed', String(selProc === p.id));
      }
      ui.button('End task', () => endTask(), { primary: true, group: fRow });
    };
    partSafe.drawF = drawF;
    function openGame() {
      if (busy) return;
      if (os !== 'windows') { os = 'windows'; drawBeam('Windows'); }
      frozen = true;
      selProc = null;
      win = { title: 'Football Game (Not responding)', lines: ['⚽ Black Stars vs Super Eagles', 'Score: 1 - 1'], kind: 'frozen' };
      drawLaptop();
      stage.reveal();
      ui.info('🧊 Oh no, it froze!', '<p>The game says <b>(Not responding)</b> and the spinning circle will not stop. (The laptop is on Windows for this part.)</p><p>Try clicking it, or waiting. If it stays frozen, press <b>Ctrl + Shift + Esc</b> to open <b>Task Manager</b>.</p>');
      drawF();
    }
    function openTM() {
      tmOpen = true;
      drawTM();
      drawF();
      ui.info('📋 Task Manager', '<p>Task Manager is the headteacher\'s register: it lists every programme that is running. Click the <b>frozen</b> one, then <b>End task</b>.</p><p>⚠️ Only end programmes <b>you opened yourself</b>!</p>');
    }
    function drawTM() {
      win = { title: 'Task Manager', lines: [{ t: 'Processes', b: true }, ...PROCS.map((p) => ({ t: p.name, bg: selProc === p.id ? '#ffe9a8' : null, color: p.kind === 'frozen' ? '#ca1f3f' : '#24182e' }))] };
      drawLaptop();
    }
    async function endTask() {
      if (!selProc) { ui.info('👆 Choose one first', '<p>Click the programme that is <b>Not responding</b>, then press <b>End task</b>.</p>'); return; }
      const p = PROCS.find((x) => x.id === selProc);
      if (p.kind === 'system') { ui.info('🚫 Leave that one!', `<p><b>${esc(p.name)}</b> is part of Windows itself. Only end programmes <b>you opened yourself</b>.</p>`); return; }
      if (p.kind === 'mine') { ui.info('🤔 That one is working fine', `<p><b>${esc(p.name)}</b> is not frozen${p.id === 'word' ? ', and it has your unsaved essay in it' : ''}. Ending it would close it for nothing. Choose the one that says <b>Not responding</b>.</p>`); return; }
      tmOpen = false;
      frozen = false;
      selProc = null;
      win = null;
      drawLaptop();
      const t = tiles.game, y0 = t.position.y;
      await stage.tween((k) => (t.position.y = y0 + Math.sin(k * Math.PI * 3) * 0.1), 0.6);
      rescued = true;
      drawF();
      ui.info('✅ Rescued!', '<p>You ended the frozen game. Now you can <b>reopen</b> it and carry on.</p><p><b>Ctrl + Shift + Esc → click the app → End task.</b> Whole PC frozen? Then restart.</p>');
      checkSafe();
    }
    drawCard();
    showInstall();
    drawF();
    ui.info('🛡️ Job 5: keep it safe', '<p><b>A.</b> Use the <b>app traffic light</b>: 🟢 trusted store or the maker\'s own website, 🟡 not sure? ask first, 🔴 random websites, pop-ups and files from strangers.</p><p><b>B.</b> Then rescue a <b>frozen app</b> with Task Manager.</p>');
  }
  function showInstall() {
    if (part !== 3 || ii >= INSTALLS.length || frozen || tmOpen) return;
    win = { title: 'Install?', lines: [{ t: INSTALLS[ii].t, b: true }, 'Where is it from? Who made it?'] };
    drawLaptop();
  }
  function finishInstalls() {
    if (good === INSTALLS.length) {
      ui.info('🏆 Safe installer!', '<p>You judged every app correctly. Only install from places you can trust, and ask when you are not sure.</p>');
      checkSafe();
    } else ui.info('🔁 Nearly', `<p>You judged <b>${good} of ${INSTALLS.length}</b> correctly. Press <b>↺ Try again</b> to get them all.</p>`);
  }
  function checkSafe() {
    const installsOk = ii >= INSTALLS.length && good === INSTALLS.length;
    if (installsOk && rescued) {
      ui.complete('safe');
      ui.info('🏆 The headteacher keeps it safe', '<p>You only installed apps from <b>trusted places</b>, asked when unsure, blocked the scams, and ended a <b>frozen app</b> with Task Manager.</p><p>Remember: only end programmes <b>you opened yourself</b>, and real Windows Security never asks you to phone anyone.</p>');
    }
    else if (installsOk && !rescued) ui.info('Now part B', '<p>Great judging! Now rescue the frozen app: press <b>🎮 Open the football game</b>.</p>');
    else if (rescued && !installsOk) ui.info('✅ Rescued! Now part A', '<p>You ended the frozen game with Task Manager. Now judge all the apps with the traffic light to finish the mission.</p>');
  }
  async function installAnim(a) {
    const start = laptop.localToWorld(V(0, 2.2, -LD / 2));
    letter.visible = true;
    setLabel(letterTag, '📦 install request');
    letter.position.copy(start);
    const pOS = board.localToWorld(V(3.2, 2.95, 1.0));
    await fly(start, pOS, 0.7, 0.6);
    if (a === 'go') {
      const n = newApps.children.length;
      const t = new THREE.Mesh(tileGeo, mat(0x2ec4b6));
      t.scale.setScalar(0.6);
      t.position.set(3.75, 4.05 + (n % 2) * 0.5, 0.5);
      t.position.x -= Math.floor(n / 2) * 0.5;
      newApps.add(t);
      setLabel(letterTag, '✅ Installed');
      await fly(pOS, board.localToWorld(t.position.clone()), 0.5, 0.2);
    } else if (a === 'stop') {
      shield.material.emissive.setHex(0xca1f3f);
      setLabel(letterTag, '🛡️ Blocked');
      await stage.wait(0.5);
      shield.material.emissive.setHex(0x000000);
    } else {
      setLabel(headTag, '✋ Ask your mentor first.');
      setLabel(letterTag, '🟡 Waiting…');
      await stage.wait(0.8);
      setLabel(headTag, '');
    }
    letter.visible = false;
  }

  // ---------- 3D clicks ----------
  for (const a of APPS) stage.clickable(tiles[a.id], () => { if (part !== 1) showPart(1); request(a.id); });
  stage.clickable(head, () => ui.info('🧑‍🏫 The headteacher (the OS)', `<ol>${JOBS.map((j) => `<li>${esc(j)}</li>`).join('')}</ol>`));
  stage.clickable(laptop, () => ui.info(`💻 This laptop runs ${OSES[os].full}`, `<p>Made by <b>${esc(OSES[os].by)}</b>. Change it in part <b>2 🎨 Change the look</b>.</p>`));

  // The "Not responding" spinner turns (redrawn a few times a second only).
  let spinT = 0;
  stage.onTick((dt) => {
    if (win?.kind !== 'frozen') return;
    spin += dt * 5;
    if ((spinT += dt) > 0.12) { spinT = 0; drawLaptop(); }
  });

  drawBeam('Windows');
  drawPhone();
  showPart(1);
}

export const missions = [
  { id: 'requests', text: 'Send 3 different app requests through the OS to the hardware.', hint: 'Try Word (print), Paint (save) and Music (play a sound).' },
  { id: 'looks', text: 'Switch the laptop to Windows, ChromeOS and Linux, and say what stays the same.', hint: 'Part 2: try all three, then answer the question.' },
  { id: 'safe', text: 'Judge all 6 app installs with the traffic light, and rescue a frozen app.', hint: 'Part 3: trusted store = go. Frozen? Ctrl + Shift + Esc → End task.' },
];

export const config = { camera: [3, 8.5, 13], target: [0, 4.1, -0.6], shadowSize: 10, frame: 1.0, minDistance: 4 };
