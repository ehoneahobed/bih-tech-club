// Session 32 — Smartphone Explorer: a pretend Android phone on a desk.
// 1. Install the real torch app (not the copy) and answer its permission questions.
// 2. Free up storage without losing photos that are not backed up.
// 3. A "wrong transfer, please send it back" MoMo message: check the balance yourself.
// Free exploration: Quick Settings (Wi-Fi, mobile data, Bluetooth, aeroplane mode,
// torch, battery saver), a hotspot with a password, the Settings app and brightness.
// Every screen is drawn on a canvas; nothing here touches a real phone or network.
import { THREE, COLORS, box, rbox, mat, decal } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const C = { plum: '#24182e', purple: '#5a4470', gold: '#ffbe00', red: '#ca1f3f', green: '#2ec4b6', teal: '#2a9d8f', grey: '#d9d3de', sky: '#f4f0f6', muted: '#6b6075', blue: '#1a73e8', white: '#ffffff', dark: '#3d2c4a' };

// The two torch apps in the Play Store: the real one and a copy.
const LISTINGS = {
  real: {
    name: 'Bright Torch', dev: 'Sunrise Apps Ltd', rating: '4.6', downloads: '10M+', reviews: '212K',
    review: '“Simple, bright and works offline. No adverts.”', safety: 'No data shared. Uses the camera flash only.',
    checks: {
      dev: '<b>Sunrise Apps Ltd</b> is a real company that has made apps for years. ✅',
      stats: '<b>10 million+</b> downloads and <b>4.6 ★</b> from 212,000 reviews. A popular app has lots of both. ✅',
      reviews: 'The newest reviews say “Simple, bright and works offline.” Nobody complains about stolen data. ✅',
      safety: 'Data safety: <b>no data shared</b>. It only needs the camera flash, which is what a torch uses. ✅',
    },
  },
  fake: {
    name: 'Bright Torch FREE Gold Edition', dev: 'free-apps-4u-2024', rating: '2.1', downloads: '500+', reviews: '37',
    review: '“It stole my data!! Adverts everywhere.”', safety: 'Shares contacts, location and messages.',
    checks: {
      dev: 'The developer is <b>free-apps-4u-2024</b>: not a company name at all. It copies the real app\'s name and logo. ❌',
      stats: 'Only <b>500+</b> downloads and <b>2.1 ★</b>. A copy usually has very few. ❌',
      reviews: 'The newest review says “<b>It stole my data!!</b>” That is a red flag. ❌',
      safety: 'Data safety: it <b>shares your contacts, location and messages</b>. A torch does not need any of that! ❌',
    },
  },
};
const CHECKS = [['dev', '1️⃣ Developer'], ['stats', '2️⃣ Downloads & rating'], ['reviews', '3️⃣ Reviews'], ['safety', '4️⃣ Data safety']];

// The torch app's three permission questions.
const PERMS = [
  { id: 'camera', icon: '📷', ask: 'take pictures and record video?', why: '(Android asks this so the app can switch on the camera\'s flash.)', need: true },
  { id: 'contacts', icon: '👥', ask: 'access your contacts?', why: '', need: false },
  { id: 'location', icon: '📍', ask: 'access this device\'s location?', why: '', need: false },
];

// What is filling the phone (GB).
const ITEMS0 = [
  { id: 'chat', icon: '💬', title: 'WhatsApp videos & voice notes', sub: 'Old forwarded videos', gb: 1.8, verb: 'Delete' },
  { id: 'camera', icon: '📷', title: 'Camera photos', sub: '☁ Backed up to Google Photos', gb: 1.4, verb: 'Free up', backed: true },
  { id: 'ludo', icon: '🎲', title: 'Ludo Party (game)', sub: 'Last used 8 months ago', gb: 1.2, verb: 'Uninstall' },
  { id: 'grandma', icon: '🎂', title: 'Grandma\'s 80th birthday', sub: '⚠ 140 photos, NOT backed up', gb: 2.4, verb: 'Delete', backed: false },
  { id: 'movie', icon: '🎬', title: 'Downloaded film (watched)', sub: 'Downloads folder', gb: 0.9, verb: 'Delete' },
  { id: 'bin', icon: '🗑️', title: 'Photos bin', sub: 'Photos you already deleted', gb: 0.5, verb: 'Empty' },
  { id: 'school', icon: '📚', title: 'School app', sub: 'Used every day', gb: 0.6, verb: 'Uninstall' },
];
const SYSTEM_GB = 23.0, TOTAL_GB = 32, GOAL_GB = 7;

export default function phoneLab(stage, ui) {
  const { scene } = stage;
  const T = 1.65; // desk top

  // ---------- Desk, kente mat and stand ----------
  const desk = rbox(9.4, 0.3, 5.2, 0xc8a27a, 0.05);
  desk.position.y = 1.5;
  scene.add(desk);
  const grain = decal(9.3, 5.1, (g, W, H) => {
    g.fillStyle = '#c8a27a';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,80,40,0.18)';
    g.lineWidth = 2;
    for (let k = 0; k < 24; k++) {
      const y = (k + 0.5) * (H / 24);
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x / 90 + k * 1.7) * 4);
      g.stroke();
    }
  }, { px: 256, transparent: false });
  grain.material.color.setScalar(0.82);
  grain.rotation.x = -Math.PI / 2;
  grain.position.y = T + 0.002;
  scene.add(grain);
  for (const x of [-4.2, 4.2]) for (const z of [-2.2, 2.2]) {
    const leg = rbox(0.28, 1.36, 0.28, 0x8a6a4a, 0.04);
    leg.position.set(x, 0.68, z);
    scene.add(leg);
  }
  // A strip of kente cloth under the phone.
  const kente = decal(3.4, 2.6, (g, W, H) => {
    const cols = ['#ffbe00', '#2a9d8f', '#ca1f3f', '#24182e'];
    for (let i = 0; i < 16; i++) { g.fillStyle = cols[i % 4]; g.fillRect((i * W) / 16, 0, W / 16 + 1, H); }
    for (let j = 0; j < 10; j++) {
      if (j % 2) continue;
      for (let i = 0; i < 8; i++) {
        g.fillStyle = (i + j) % 2 ? '#ffbe00' : '#24182e';
        g.fillRect((i * W) / 8, (j * H) / 10, W / 8, H / 10);
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
  }, { px: 128, transparent: false });
  kente.rotation.x = -Math.PI / 2;
  kente.position.set(0, T + 0.004, 0.1);
  scene.add(kente);

  const rgeo = (w, h, d, r) => { const m = rbox(w, h, d, 0, r); m.material.dispose(); return m.geometry; };
  const stand = new THREE.Group();
  const standMat = mat(0x5a4470, { roughness: 0.5 });
  const sBase = new THREE.Mesh(rgeo(2.0, 0.14, 1.6, 0.05), standMat);
  sBase.position.set(0, 0.07, -0.25);
  const sBack = new THREE.Mesh(rgeo(1.6, 2.8, 0.14, 0.05), standMat);
  sBack.position.set(0, 1.5, -0.45);
  sBack.rotation.x = -0.22;
  const sLip = new THREE.Mesh(rgeo(2.0, 0.3, 0.14, 0.05), standMat);
  sLip.position.set(0, 0.2, 0.42);
  for (const m of [sBase, sBack, sLip]) m.castShadow = m.receiveShadow = true;
  stand.add(sBase, sBack, sLip);
  stand.position.set(0, T, -0.4);
  scene.add(stand);

  // ---------- The phone ----------
  const PW = 2.7, PH = 5.4, SW = 2.5, SH = 5.0;
  const phone = new THREE.Group();
  const body = rbox(PW, PH, 0.24, 0x2f2238, 0.32, { roughness: 0.35, metalness: 0.25 });
  body.position.y = PH / 2;
  const glass = rbox(PW - 0.1, PH - 0.1, 0.02, 0x0b090d, 0.28, { roughness: 0.2 });
  glass.position.set(0, PH / 2, 0.116);
  glass.userData.noInk = true;
  const screen = decal(SW, SH, () => {}, { px: 512, transparent: false });
  screen.position.set(0, PH / 2, 0.128);
  phone.add(body, glass, screen);
  const btnMat = mat(0x4a3a58, { metalness: 0.4, roughness: 0.35 });
  const sideBtn = (h, y, x) => { const b = new THREE.Mesh(rgeo(0.06, h, 0.1, 0.025), btnMat); b.position.set(x, y, 0); phone.add(b); };
  sideBtn(0.62, PH - 1.4, PW / 2 + 0.02); // power
  sideBtn(1.0, PH - 2.4, PW / 2 + 0.02); // volume
  const port = box(0.42, 0.06, 0.08, 0x0b090d);
  port.position.set(0, 0.0, 0);
  port.userData.noInk = true;
  phone.add(port);
  // Camera bump with three lenses and the flash (the torch).
  const bump = rbox(1.0, 1.0, 0.08, 0x3d2c4a, 0.2);
  bump.position.set(-0.6, PH - 0.75, -0.15);
  phone.add(bump);
  const lensGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 20);
  const lensMat = mat(0x0b090d, { roughness: 0.15, metalness: 0.5 });
  for (const [x, y] of [[-0.8, PH - 0.55], [-0.4, PH - 0.95], [-0.8, PH - 0.95]]) {
    const l = new THREE.Mesh(lensGeo, lensMat);
    l.rotation.x = Math.PI / 2;
    l.position.set(x, y, -0.21);
    phone.add(l);
  }
  const flashMat = mat(0xfff6d0, { emissive: 0x000000, roughness: 0.3 });
  const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), flashMat);
  flash.rotation.x = Math.PI / 2;
  flash.position.set(-0.4, PH - 0.55, -0.21);
  phone.add(flash);
  // The torch beam shines out of the back, up and away.
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.5, 5, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe58a, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
  beam.geometry.translate(0, -2.5, 0);
  beam.rotation.x = -Math.PI / 2 - 0.35;
  beam.position.set(-0.4, PH - 0.55, -0.24);
  beam.userData.noInk = true;
  beam.visible = false;
  phone.add(beam);
  const torchLight = new THREE.PointLight(0xffe9a0, 0, 7, 1.5);
  torchLight.position.set(-0.4, PH - 0.4, -1.0);
  phone.add(torchLight);
  // Wi-Fi waves above the phone while its hotspot is on.
  const hsArcs = [];
  for (let k = 0; k < 3; k++) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.25 + k * 0.2, 0.035, 6, 24, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.8 }));
    a.rotation.z = Math.PI / 4;
    a.position.set(0, PH + 0.1, 0);
    a.userData.noInk = true;
    a.visible = false;
    phone.add(a);
    hsArcs.push(a);
  }
  phone.position.set(0, T + 0.16, -0.3);
  phone.rotation.x = -0.22;
  scene.add(phone);
  const topSpot = new THREE.Object3D(); topSpot.position.set(0, PH - 0.25, 0.13);
  // Points on the screen for callouts: the Play Store and MoMo icons.
  const midSpot = new THREE.Object3D(); midSpot.position.set(-0.54, 3.1, 0.13);
  const dockSpot = new THREE.Object3D(); dockSpot.position.set(0.29, 3.1, 0.13);
  phone.add(topSpot, midSpot, dockSpot);

  // ---------- Laptop (for the hotspot) ----------
  const laptop = new THREE.Group();
  const lBase = rbox(2.3, 0.1, 1.55, 0xb9b2c2, 0.05, { metalness: 0.35, roughness: 0.4 });
  lBase.position.y = 0.05;
  const keys = decal(2.0, 0.85, (g, W, H) => {
    g.fillStyle = '#3d3647';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#5c5468';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) g.fillRect(6 + c * ((W - 12) / 12), 6 + r * ((H - 12) / 4), (W - 12) / 12 - 4, (H - 12) / 4 - 4);
  }, { px: 128, transparent: false });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.102, -0.2);
  const pad = box(0.7, 0.01, 0.4, 0x9e97a8);
  pad.position.set(0, 0.1, 0.48);
  pad.userData.noInk = true;
  const lid = new THREE.Group();
  lid.position.set(0, 0.1, -0.76);
  lid.rotation.x = -0.28;
  const lidBack = rbox(2.3, 1.5, 0.07, 0xb9b2c2, 0.05, { metalness: 0.35, roughness: 0.4 });
  lidBack.position.y = 0.75;
  const lapScreen = decal(2.1, 1.3, () => {}, { px: 200, transparent: false });
  lapScreen.position.set(0, 0.76, 0.04);
  lid.add(lidBack, lapScreen);
  laptop.add(lBase, keys, pad, lid);
  laptop.position.set(3.3, T, 0.4);
  laptop.rotation.y = -0.45;
  scene.add(laptop);
  function drawLaptop() {
    const c = lapScreen.material.map.image, g = c.getContext('2d'), W = c.width, H = c.height;
    g.fillStyle = '#5a4470';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#24182e';
    g.fillRect(0, H - 34, W, 34);
    const on = st.hotspot;
    g.fillStyle = '#ffffff';
    g.beginPath(); g.roundRect(W * 0.12, H * 0.14, W * 0.76, H * 0.6, 14); g.fill();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = C.plum;
    g.font = `700 ${H * 0.1}px ${FONT}`;
    g.fillText(on ? (st.secure ? '📶 Connected' : '⚠️ Connected') : '📶 No internet', W / 2, H * 0.32);
    g.font = `500 ${H * 0.075}px ${FONT}`;
    g.fillStyle = C.muted;
    g.fillText(on ? 'Wi-Fi: Kofi\'s phone' : 'Looking for Wi-Fi…', W / 2, H * 0.47);
    g.fillStyle = on ? (st.secure ? C.teal : C.red) : C.muted;
    g.fillText(on ? (st.secure ? '🔒 Password protected' : '🔓 Open: anyone can join') : 'Turn on the phone\'s hotspot', W / 2, H * 0.6);
    lapScreen.material.map.needsUpdate = true;
  }

  // ---------- Phone mast (mobile data) ----------
  const mast = new THREE.Group();
  const segGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.7, 10);
  const red = mat(COLORS.red), white = mat(0xf4f0f6);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(segGeo, i % 2 ? white : red);
    s.position.y = 0.35 + i * 0.7;
    s.scale.setScalar(1 - i * 0.12);
    s.castShadow = true;
    mast.add(s);
  }
  const mBase = rbox(0.7, 0.12, 0.7, 0x8a8494, 0.03);
  mBase.position.y = 0.06;
  mast.add(mBase);
  const antGeo = rgeo(0.1, 0.45, 0.06, 0.02);
  for (let k = 0; k < 3; k++) {
    const a = new THREE.Mesh(antGeo, white);
    const ang = (k / 3) * Math.PI * 2;
    a.position.set(Math.sin(ang) * 0.13, 3.3, Math.cos(ang) * 0.13);
    a.rotation.y = ang;
    a.castShadow = true;
    mast.add(a);
  }
  const arcMat = new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.8 });
  const arcs = [];
  for (let k = 0; k < 3; k++) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.3 + k * 0.22, 0.035, 6, 24, Math.PI * 0.6), arcMat.clone());
    a.rotation.z = Math.PI / 2 - Math.PI * 0.3;
    a.position.y = 3.55;
    a.userData.noInk = true;
    mast.add(a);
    arcs.push(a);
  }
  mast.position.set(-3.6, T, -1.8);
  mast.scale.setScalar(0.85);
  scene.add(mast);

  // ---------- Wi-Fi router ----------
  const router = new THREE.Group();
  const rBody = rbox(1.1, 0.24, 0.7, 0xf4f0f6, 0.06);
  rBody.position.y = 0.12;
  const antMat = mat(COLORS.purple);
  for (const x of [-0.4, 0.4]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8), antMat);
    a.position.set(x, 0.55, -0.28);
    a.castShadow = true;
    router.add(a);
  }
  const ledMat = mat(0x2ec4b6, { emissive: 0x2ec4b6, emissiveIntensity: 0.8 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), ledMat);
  led.position.set(0, 0.17, 0.36);
  led.userData.noInk = true;
  const rTag = decal(0.8, 0.14, (g, W, H) => {
    g.fillStyle = '#24182e';
    g.font = `700 ${H * 0.7}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('Hub-WiFi', W / 2, H * 0.55);
  }, { px: 48 });
  rTag.position.set(0, 0.12, 0.352);
  router.add(rBody, led, rTag);
  const wifiArcs = [];
  for (let k = 0; k < 3; k++) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.2 + k * 0.18, 0.03, 6, 24, Math.PI * 0.5), new THREE.MeshBasicMaterial({ color: COLORS.green, transparent: true, opacity: 0.8 }));
    a.rotation.z = Math.PI / 4;
    a.position.y = 0.6;
    a.userData.noInk = true;
    router.add(a);
    wifiArcs.push(a);
  }
  router.position.set(2.0, T, -2.0);
  router.rotation.y = -0.3;
  scene.add(router);

  // ---------- Cloud (photo backup) ----------
  const cloud = new THREE.Group();
  const puff = new THREE.SphereGeometry(0.5, 16, 12);
  const cloudMat = mat(0xffffff, { roughness: 0.9 });
  for (const [x, y, s] of [[0, 0, 1], [0.6, -0.1, 0.8], [-0.6, -0.12, 0.78], [0.25, 0.3, 0.75], [-0.3, 0.25, 0.7]]) {
    const p = new THREE.Mesh(puff, cloudMat);
    p.position.set(x, y, 0);
    p.scale.set(s, s * 0.85, s * 0.8);
    cloud.add(p);
  }
  const cloudTag = decal(1.3, 0.34, (g, W, H) => {
    g.fillStyle = '#5a4470';
    g.font = `700 ${H * 0.55}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('☁ Backup', W / 2, H * 0.55);
  }, { px: 64 });
  cloudTag.position.set(0, -0.05, 0.45);
  cloud.add(cloudTag);
  const cloudHome = new THREE.Vector3(-2.9, T + 5.2, -0.4);
  cloud.position.copy(cloudHome);
  scene.add(cloud);
  const photoGeo = rgeo(0.32, 0.26, 0.03, 0.03);
  const photoMats = [mat(COLORS.gold), mat(COLORS.green), mat(COLORS.red)];

  // ---------- A small plant ----------
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.5, 20), mat(0xc8643c));
  pot.position.y = 0.25;
  plant.add(pot);
  const leafGeo = new THREE.SphereGeometry(0.2, 12, 8);
  const leafMat = mat(0x2a9d8f);
  [[0, 0.9, 0, 0], [0.2, 0.75, 0.05, -0.6], [-0.2, 0.78, -0.04, 0.6], [0.06, 0.7, 0.2, -0.3]].forEach(([x, y, z, r]) => {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.scale.set(0.55, 1.5, 0.3);
    leaf.position.set(x, y, z);
    leaf.rotation.set(z * 1.5, 0, r);
    plant.add(leaf);
  });
  plant.traverse((m) => m.isMesh && (m.castShadow = true));
  plant.position.set(-3.6, T, 1.2);
  scene.add(plant);

  // ---------- Phone state ----------
  const st = {
    screen: 'home', wifi: false, data: true, bt: false, plane: false, torch: false, rotate: true, saver: false,
    hotspot: false, hsPw: '', secure: true, brightness: 0.8, timeout: '15 seconds',
    listing: 'real', checks: { real: new Set(), fake: new Set() },
    installed: null, perms: {}, permStep: 0,
    items: ITEMS0.map((x) => ({ ...x })), lost: false, confirmDel: false, backing: -1,
    scam: { unread: true, seen: false, called: false, answered: false, checked: false, sent: false, pin: false, sending: false, done: false },
    callState: 'ring', toast: '',
  };
  const history = [];

  // ---------- Drawing the phone screen ----------
  const scr = screen.material.map.image;
  const g = scr.getContext('2d');
  const W = scr.width, H = scr.height;
  let regions = [];
  const region = (x, y, w, h, label, fn, o = {}) => regions.push({ x, y, w, h, label, fn, ...o });
  const f = (px, w = 500) => `${w} ${px}px ${FONT}`;
  function rr(x, y, w, h, r, fill, stroke, lw = 2) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }
  function txt(s, x, y, { size = 24, weight = 500, color = C.plum, align = 'left', max = 0 } = {}) {
    let px = size;
    g.font = f(px, weight);
    while (max && g.measureText(s).width > max && px > 12) g.font = f((px -= 1), weight);
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillText(s, x, y);
  }
  function para(s, x, y, maxW, { size = 22, weight = 400, color = C.plum, lh = 30, maxLines = 9 } = {}) {
    g.font = f(size, weight);
    const words = String(s).split(' ');
    const lines = [];
    let cur = '';
    for (const wd of words) {
      const t = cur ? cur + ' ' + wd : wd;
      if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t;
    }
    lines.push(cur);
    lines.length = Math.min(lines.length, maxLines);
    g.fillStyle = color;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
    return y + lines.length * lh;
  }
  function icon(x, y, s, bg, glyph, { fg = '#fff', gsize = 0.5 } = {}) {
    rr(x - s / 2, y - s / 2, s, s, s * 0.28, bg);
    txt(glyph, x, y + 2, { size: s * gsize, weight: 700, color: fg, align: 'center' });
  }
  function toggle(x, y, on) {
    rr(x, y - 16, 62, 32, 16, on ? C.teal : '#b8b0c0');
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(on ? x + 46 : x + 16, y, 12, 0, 7); g.fill();
  }
  function header(title, { bg = C.white, color = C.plum } = {}) {
    g.fillStyle = bg;
    g.fillRect(0, 56, W, 84);
    txt('←', 30, 98, { size: 34, weight: 700, color });
    region(0, 56, 90, 84, '◁ Back', back, { panel: false });
    txt(title, 92, 98, { size: 32, weight: 700, color, max: W - 120 });
    return 150;
  }
  // A list of rows: { icon, bg, title, sub, toggle, action, label, fn, warn }
  function rows(list, y0, rh = 96) {
    list.forEach((r, i) => {
      const y = y0 + i * rh;
      if (r.hi) rr(10, y + 4, W - 20, rh - 8, 18, 'rgba(255,190,0,0.18)');
      if (r.icon) icon(56, y + rh / 2, 54, r.bg ?? C.purple, r.icon, { gsize: 0.55 });
      const tx = r.icon ? 100 : 32;
      const right = r.toggle !== undefined ? 92 : r.action ? 130 : 30;
      txt(r.title, tx, y + (r.sub ? rh / 2 - 15 : rh / 2), { size: 24, weight: 600, max: W - tx - right });
      if (r.sub) txt(r.sub, tx, y + rh / 2 + 17, { size: 19, color: r.warn ? C.red : C.muted, max: W - tx - right });
      if (r.toggle !== undefined) toggle(W - 84, y + rh / 2, r.toggle);
      else if (r.action) {
        rr(W - 126, y + rh / 2 - 24, 108, 48, 24, r.danger ? '#fde8ec' : '#efe9f3', r.danger ? C.red : null);
        txt(r.action, W - 72, y + rh / 2, { size: 19, weight: 700, color: r.danger ? C.red : C.purple, align: 'center', max: 96 });
      } else if (r.fn) txt('›', W - 34, y + rh / 2, { size: 34, color: C.muted });
      g.fillStyle = '#ebe6ef';
      g.fillRect(tx, y + rh - 1, W - tx - 20, 2);
      if (r.fn) region(r.action ? W - 130 : 0, y, r.action ? 130 : W, rh, r.label ?? r.title, r.fn, { primary: r.primary });
    });
    return y0 + list.length * rh;
  }

  function statusBar(dark) {
    const col = dark ? '#fff' : C.plum;
    txt('10:45', 28, 30, { size: 22, weight: 600, color: col });
    g.fillStyle = '#0b090d';
    g.beginPath(); g.arc(W / 2, 30, 13, 0, 7); g.fill();
    let x = W - 30;
    // Battery
    g.strokeStyle = col; g.lineWidth = 2.5;
    g.beginPath(); g.roundRect(x - 34, 20, 34, 20, 4); g.stroke();
    g.fillStyle = st.saver ? C.gold : col;
    g.fillRect(x - 31, 23, 18, 14);
    txt('64%', x - 40, 30, { size: 17, weight: 600, color: col, align: 'right' });
    x -= 96;
    if (st.plane) { txt('✈', x, 30, { size: 22, color: col, align: 'center' }); x -= 34; }
    else {
      g.fillStyle = col;
      for (let i = 0; i < 4; i++) g.fillRect(x - 12 + i * 7, 38 - i * 5, 5, 5 + i * 5);
      if (st.data) txt('4G', x - 22, 30, { size: 15, weight: 700, color: col, align: 'right' });
      x -= st.data ? 66 : 34;
    }
    if (st.wifi) {
      g.strokeStyle = col; g.lineWidth = 3;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x, 40, 5 + k * 6, -Math.PI * 0.75, -Math.PI * 0.25); g.stroke(); }
      x -= 32;
    }
    if (st.hotspot) { txt('📡', x, 30, { size: 18, align: 'center' }); x -= 30; }
    if (st.bt) { txt('ᛒ', x, 30, { size: 20, weight: 700, color: col, align: 'center' }); x -= 26; }
    if (st.scam.unread) { txt('✉', 108, 30, { size: 20, color: col }); }
    region(0, 0, W, 56, '⬇ Quick Settings', () => go('qs'), { panel: false });
  }
  function navBar(dark) {
    const col = dark ? '#fff' : C.plum;
    g.fillStyle = dark ? 'rgba(0,0,0,0.25)' : '#f4f0f6';
    g.fillRect(0, H - 64, W, 64);
    g.strokeStyle = col; g.lineWidth = 3; g.fillStyle = col;
    const y = H - 32;
    g.beginPath(); g.moveTo(W * 0.22 + 10, y - 12); g.lineTo(W * 0.22 - 10, y); g.lineTo(W * 0.22 + 10, y + 12); g.closePath(); g.stroke();
    g.beginPath(); g.arc(W / 2, y, 13, 0, 7); g.stroke();
    g.strokeRect(W * 0.78 - 11, y - 11, 22, 22);
    region(W * 0.12, H - 64, W * 0.2, 64, '◁ Back', back, { panel: false });
    region(W * 0.4, H - 64, W * 0.2, 64, '○ Home', home, { panel: false });
  }

  // ---------- Screens ----------
  const SCREENS = {
    home() {
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#5a4470');
      grd.addColorStop(1, '#24182e');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      // Kente stripes on the wallpaper.
      g.globalAlpha = 0.16;
      ['#ffbe00', '#2ec4b6', '#ca1f3f', '#ffbe00'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, H * 0.62 + i * 22, W, 12); });
      g.globalAlpha = 1;
      txt('10:45', W / 2, 160, { size: 92, weight: 300, color: '#fff', align: 'center' });
      txt('Friday 30 October', W / 2, 228, { size: 22, color: '#e8e2ee', align: 'center' });
      rr(36, 270, W - 72, 62, 31, '#ffffff');
      txt('G', 70, 302, { size: 28, weight: 700, color: C.blue, align: 'center' });
      txt('Search…', 100, 302, { size: 22, color: C.muted });
      const apps = [
        { n: 'Settings', bg: '#6b6075', gl: '⚙', go: () => go('settings') },
        { n: 'Play Store', bg: '#ffffff', gl: '▶', fg: C.teal, go: () => go('store') },
        { n: 'MoMo', bg: C.gold, gl: 'M', fg: C.plum, go: () => go('momo') },
        { n: 'Photos', bg: '#ffffff', gl: '🌸', go: () => note('🌸 Photos', '<p>Your photos live here. Before you delete any to free space, check they are <b>backed up</b> (Settings → Storage).</p>') },
        { n: 'Maps', bg: '#ffffff', gl: '📍', go: () => note('📍 Maps', '<p>Maps finds places and gives directions. It asks for your <b>location</b>, and that makes sense: it needs it to show the way. Try it on a real phone on Page 5.</p>') },
        { n: 'Files', bg: '#6fa8dc', gl: '📁', go: () => go('storage') },
        ...st.items.some((i) => i.id === 'ludo') ? [{ n: 'Ludo Party', bg: C.red, gl: '🎲', go: () => note('🎲 Ludo Party', '<p>A game you have not opened for <b>8 months</b>, but it still takes <b>1.2 GB</b>. Apps you never use are the first thing to uninstall when storage is full.</p>') }] : [],
        { n: 'School', bg: C.teal, gl: '📚', go: () => note('📚 School app', '<p>You use this every day. Keep the apps you use!</p>') },
        ...st.installed ? [{ n: st.installed === 'real' ? 'Bright Torch' : 'Torch GOLD', bg: st.installed === 'real' ? C.gold : '#c9a400', gl: '🔦', go: () => go('torch'), label: '🔦 Open the torch app' }] : [],
      ];
      apps.forEach((a, i) => {
        const cx = 76 + (i % 4) * 120, cy = 430 + Math.floor(i / 4) * 150;
        icon(cx, cy, 88, a.bg, a.gl, { fg: a.fg ?? '#fff' });
        txt(a.n, cx, cy + 66, { size: 19, color: '#fff', align: 'center', max: 116 });
        region(cx - 56, cy - 56, 112, 136, a.label ?? a.n, a.go, { panel: !!a.label });
      });
      // The dock.
      rr(24, H - 200, W - 48, 118, 40, 'rgba(255,255,255,0.18)');
      [['📞', '#2ec4b6', 'Phone'], ['💬', '#1a73e8', 'Messages'], ['🌐', '#ffffff', 'Browser'], ['📷', '#3d2c4a', 'Camera']].forEach(([gl, bg, n], i) => {
        const cx = 84 + i * 115, cy = H - 141;
        icon(cx, cy, 84, bg, gl);
        if (n === 'Messages') {
          region(cx - 50, cy - 50, 100, 100, '💬 Messages', () => go('messages'), { panel: false });
          if (st.scam.unread) { g.fillStyle = C.red; g.beginPath(); g.arc(cx + 34, cy - 34, 16, 0, 7); g.fill(); txt('1', cx + 34, cy - 33, { size: 20, weight: 700, color: '#fff', align: 'center' }); }
        } else region(cx - 50, cy - 50, 100, 100, n, () => note(`${gl} ${n}`, `<p>The <b>${n}</b> app is not part of today's lab. Explore it on a real phone (Page 5).</p>`), { panel: false });
      });
      return true;
    },

    qs() {
      g.fillStyle = '#1b1222';
      g.fillRect(0, 0, W, H);
      // Brightness slider
      rr(36, 82, W - 72, 56, 28, '#3d2c4a');
      rr(36, 82, 56 + (W - 128) * st.brightness, 56, 28, '#e8e2ee');
      txt('☀', 64, 110, { size: 26, color: C.plum, align: 'center' });
      region(36, 82, (W - 72) / 2, 56, '🔅 Dimmer', () => bright(-0.2));
      region(W / 2, 82, (W - 72) / 2, 56, '🔆 Brighter', () => bright(0.2));
      const tiles = [
        ['wifi', '📶', 'Wi-Fi', st.wifi ? 'Hub-WiFi' : 'Off'],
        ['data', '⇅', 'Mobile data', st.plane ? 'Aeroplane mode' : st.data ? 'On' : 'Off'],
        ['bt', 'ᛒ', 'Bluetooth', st.bt ? 'On' : 'Off'],
        ['plane', '✈', 'Aeroplane mode', st.plane ? 'On' : 'Off'],
        ['torch', '🔦', 'Torch', st.torch ? 'On' : 'Off'],
        ['rotate', '🔄', 'Auto-rotate', st.rotate ? 'On' : 'Off'],
        ['saver', '🔋', 'Battery saver', st.saver ? 'On' : 'Off'],
        ['hotspot', '📡', 'Hotspot', st.hotspot ? 'On' : 'Off'],
      ];
      tiles.forEach(([id, gl, name, sub], i) => {
        const x = 28 + (i % 2) * 234, y = 168 + Math.floor(i / 2) * 118;
        const on = st[id];
        rr(x, y, 222, 100, 50, on ? C.gold : '#3d2c4a');
        txt(gl, x + 46, y + 50, { size: 30, weight: 700, color: on ? C.plum : '#fff', align: 'center' });
        txt(name, x + 82, y + 36, { size: 21, weight: 700, color: on ? C.plum : '#fff', max: 130 });
        txt(sub, x + 82, y + 66, { size: 18, color: on ? C.plum : '#c9c0d2', max: 130 });
        region(x, y, 222, 100, `${gl} ${name}: ${on ? 'on' : 'off'}`, () => flip(id));
      });
      txt('✏ Edit', 50, 660, { size: 20, color: '#c9c0d2' });
      txt('⚙', W - 56, 660, { size: 28, color: '#c9c0d2', align: 'center' });
      region(W - 100, 630, 90, 60, '⚙️ Settings', () => go('settings'), { panel: false });
      if (st.scam.unread) {
        rr(28, 700, W - 56, 130, 28, '#2f2238');
        icon(78, 765, 56, C.blue, '💬', { gsize: 0.5 });
        txt('Messages · now', 120, 735, { size: 18, color: '#c9c0d2' });
        txt('0551234567', 120, 765, { size: 22, weight: 700, color: '#fff' });
        txt('You have received GHS 500.00 from…', 120, 797, { size: 19, color: '#e8e2ee', max: W - 170 });
        region(28, 700, W - 56, 130, '💬 Open the new message', () => go('messages'));
      }
      txt('Swipe up or press ○ to close', W / 2, H - 100, { size: 18, color: '#8a7f96', align: 'center' });
      return true;
    },

    settings() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      const y = header('Settings');
      rows([
        { icon: '📶', bg: C.blue, title: 'Network & internet', sub: 'Wi-Fi, mobile data, hotspot', fn: () => go('network') },
        { icon: 'ᛒ', bg: C.purple, title: 'Connected devices', sub: st.bt ? 'Bluetooth on' : 'Bluetooth off', fn: () => note('ᛒ Connected devices', '<p>Here you turn on <b>Bluetooth</b> and pair a speaker or earbuds. Turn Bluetooth off when you are not using it: it saves battery.</p>') },
        { icon: '🔆', bg: '#f4a11d', title: 'Display', sub: `Brightness, screen timeout (${st.timeout})`, fn: () => go('display') },
        { icon: '💾', bg: C.teal, title: 'Storage', sub: `${used().toFixed(1)} GB of ${TOTAL_GB} GB used`, warn: free() < 1, fn: () => go('storage'), label: '💾 Storage' },
        { icon: '🔋', bg: '#3aa655', title: 'Battery', sub: st.saver ? '64% · Battery saver on' : '64%', fn: () => go('battery') },
        { icon: '🧩', bg: C.red, title: 'Apps', sub: 'Permissions, default apps', fn: () => go('apps') },
        { icon: '🔒', bg: C.plum, title: 'Security', sub: 'Screen lock: 6-digit PIN', fn: () => note('🔒 Security', '<p>This phone is locked with a <b>6-digit PIN</b>. Always use a screen lock, and never 1234, 0000 or your birthday.</p>') },
      ], y);
      return false;
    },

    network() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      const y = header('Network & internet');
      rows([
        { icon: '📶', bg: C.blue, title: 'Wi-Fi', sub: st.wifi ? 'Connected to Hub-WiFi' : 'Off', toggle: st.wifi, fn: () => flip('wifi'), label: `📶 Wi-Fi: ${st.wifi ? 'on' : 'off'}` },
        { icon: '⇅', bg: C.teal, title: 'Mobile data', sub: st.plane ? 'Off in aeroplane mode' : st.data ? 'On: uses your bundle' : 'Off', toggle: st.data, fn: () => flip('data'), label: `⇅ Mobile data: ${st.data ? 'on' : 'off'}` },
        { icon: '📉', bg: '#f4a11d', title: 'Data Saver', sub: 'Apps use less data in the background', toggle: !!st.dsaver, fn: () => { st.dsaver = !st.dsaver; note('📉 Data Saver', `<p>Data Saver is <b>${st.dsaver ? 'on' : 'off'}</b>. ${st.dsaver ? 'Apps now use less data when you are not looking at them, so your bundle lasts longer.' : ''}</p>`); }, label: '📉 Data Saver' },
        { icon: '📡', bg: C.purple, title: 'Hotspot & tethering', sub: st.hotspot ? 'Hotspot on' : 'Off', fn: () => go('hotspot'), label: '📡 Hotspot & tethering' },
        { icon: '✈', bg: '#6b6075', title: 'Aeroplane mode', toggle: st.plane, fn: () => flip('plane'), label: `✈ Aeroplane mode: ${st.plane ? 'on' : 'off'}` },
      ], y);
      return false;
    },

    display() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      let y = header('Display');
      txt('Brightness', 32, y + 30, { size: 24, weight: 600 });
      rr(32, y + 60, W - 64, 20, 10, '#e8e2ee');
      rr(32, y + 60, (W - 64) * st.brightness, 20, 10, C.gold);
      region(32, y + 40, (W - 64) / 2, 60, '🔅 Dimmer', () => bright(-0.2));
      region(W / 2, y + 40, (W - 64) / 2, 60, '🔆 Brighter', () => bright(0.2));
      y += 120;
      txt('Screen timeout', 32, y + 10, { size: 24, weight: 600 });
      txt('How fast the screen goes dark', 32, y + 42, { size: 19, color: C.muted });
      rows(['15 seconds', '1 minute', '2 minutes'].map((t) => ({ title: (st.timeout === t ? '◉  ' : '○  ') + t, fn: () => { st.timeout = t; note('🔆 Screen timeout', `<p>The screen now stays on for <b>${t}</b> after your last touch. ${t === '15 seconds' ? 'Short timeouts save battery, but the screen may go dark while you read.' : 'Good for reading, like Kofi on Page 2. A longer timeout uses a bit more battery.'}</p>`); }, label: `⏱ Timeout: ${t}` })), y + 70, 80);
      return false;
    },

    battery() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      let y = header('Battery');
      txt('64%', W / 2, y + 70, { size: 80, weight: 300, align: 'center', color: C.teal });
      txt('About 9 hours left', W / 2, y + 130, { size: 22, color: C.muted, align: 'center' });
      y += 170;
      txt('Most power used by', 32, y, { size: 22, weight: 700, color: C.muted });
      rows([
        { icon: '▶', bg: C.red, title: 'Videos app', sub: '38%' },
        { icon: '🖥', bg: C.purple, title: 'Screen', sub: '24%' },
        { icon: '📡', bg: C.blue, title: 'Mobile network', sub: '11%' },
        { icon: '🔋', bg: '#3aa655', title: 'Battery saver', sub: st.saver ? 'On' : 'Off', toggle: st.saver, fn: () => flip('saver'), label: `🔋 Battery saver: ${st.saver ? 'on' : 'off'}` },
      ], y + 24);
      return false;
    },

    apps() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      let y = header('Apps');
      const list = [
        { icon: '📍', bg: '#fff', title: 'Maps', sub: 'Location: allowed while using' },
        { icon: '📷', bg: '#3d2c4a', title: 'Camera', sub: 'Camera, microphone: allowed' },
      ];
      if (st.installed) {
        const p = st.perms;
        const say = (id) => (p[id] === undefined ? 'not asked' : p[id] ? 'allowed' : 'not allowed');
        list.unshift({ icon: '🔦', bg: C.gold, title: st.installed === 'real' ? 'Bright Torch' : 'Torch GOLD (copy)', sub: st.installed === 'real' ? `Camera ${say('camera')} · Contacts ${say('contacts')} · Location ${say('location')}` : 'Contacts, location, messages: allowed', warn: st.installed === 'fake', hi: true,
          fn: () => (st.installed === 'real' ? fixPerms() : uninstallFake()), label: st.installed === 'real' ? '🔦 Bright Torch → Permissions' : '🗑 Uninstall the copy' });
      }
      rows(list, y);
      return false;
    },

    storage() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      let y = header('Storage');
      const u = used(), fr = free();
      txt(`${u.toFixed(1)} GB used`, 32, y + 24, { size: 34, weight: 700 });
      txt(`of ${TOTAL_GB} GB`, 34 + g.measureText(`${u.toFixed(1)} GB used`).width + 10, y + 28, { size: 22, color: C.muted });
      rr(32, y + 60, W - 64, 26, 13, '#e8e2ee');
      rr(32, y + 60, (W - 64) * (u / TOTAL_GB), 26, 13, fr < 1 ? C.red : fr < GOAL_GB ? '#f4a11d' : C.teal);
      g.fillStyle = C.plum;
      g.fillRect(32 + (W - 64) * ((TOTAL_GB - GOAL_GB) / TOTAL_GB), y + 54, 3, 38);
      txt(`${fr.toFixed(1)} GB free · goal: ${GOAL_GB} GB free`, 32, y + 112, { size: 20, weight: 600, color: fr >= GOAL_GB ? C.teal : C.red });
      if (st.lost) txt('😢 Grandma\'s photos are gone for ever.', 32, y + 142, { size: 20, weight: 700, color: C.red });
      y += 160;
      if (st.backing >= 0) {
        rr(24, y, W - 48, 86, 18, '#e9f7f5');
        txt(`☁ Backing up on ${st.wifi ? 'Wi-Fi' : 'mobile data'}… ${Math.round(st.backing * 100)}%`, 44, y + 28, { size: 21, weight: 600, color: C.teal });
        rr(44, y + 52, W - 88, 14, 7, '#cfeeea');
        rr(44, y + 52, (W - 88) * st.backing, 14, 7, C.teal);
        return false;
      }
      const list = st.items.map((it) => {
        const r = { icon: it.icon, bg: it.id === 'grandma' && !it.backed ? C.red : C.purple, title: it.title, sub: `${it.gb.toFixed(1)} GB · ${it.sub}`, warn: it.id === 'grandma' && !it.backed };
        if (it.id === 'grandma' && !it.backed) return [{ ...r, action: '☁ Back up', fn: () => backup(it), label: `☁ Back up ${it.title}`, primary: true }, { title: '', sub: '', action: 'Delete', danger: true, fn: () => delItem(it), label: `🗑 Delete ${it.title}`, short: true }];
        return [{ ...r, action: it.verb, fn: () => delItem(it), label: `${it.verb === 'Uninstall' ? '🗑 Uninstall' : it.verb === 'Free up' ? '🧹 Free up' : it.verb === 'Empty' ? '🗑 Empty' : '🗑 Delete'} ${it.title}` }];
      }).flat();
      // Draw: the "Delete" partner row of Grandma's photos sits beside its row, not below it.
      let yy = y;
      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        if (r.short) continue;
        rows([r], yy, 84);
        if (list[i + 1]?.short) {
          const d = list[i + 1];
          rr(W - 126, yy + 78, 108, 38, 19, '#fde8ec', C.red);
          txt('Delete', W - 72, yy + 97, { size: 18, weight: 700, color: C.red, align: 'center' });
          region(W - 130, yy + 76, 130, 42, d.label, d.fn);
          yy += 40;
        }
        yy += 84;
      }
      if (st.confirmDel) {
        g.fillStyle = 'rgba(0,0,0,0.45)';
        g.fillRect(0, 0, W, H);
        rr(36, H * 0.32, W - 72, 330, 30, '#fff');
        txt('Delete 140 photos?', 64, H * 0.32 + 52, { size: 28, weight: 700 });
        para('These photos are NOT backed up. If you delete them now, they are gone for ever. Grandma\'s 80th birthday only happens once!', 64, H * 0.32 + 104, W - 140, { size: 21, color: C.red });
        rr(64, H * 0.32 + 240, 170, 60, 30, '#efe9f3');
        txt('Cancel', 149, H * 0.32 + 270, { size: 22, weight: 700, color: C.purple, align: 'center' });
        rr(W - 234, H * 0.32 + 240, 170, 60, 30, C.red);
        txt('Delete for ever', W - 149, H * 0.32 + 270, { size: 19, weight: 700, color: '#fff', align: 'center' });
        regions = regions.filter((r) => r.panel === false);
        region(64, H * 0.32 + 240, 170, 60, '✋ Cancel (keep the photos)', () => { st.confirmDel = false; note('✋ Good choice', '<p>Back them up first (on <b>Wi-Fi</b>), check they are safe in the cloud, and only then free up the space.</p>'); }, { primary: true });
        region(W - 234, H * 0.32 + 240, 170, 60, '🗑 Delete for ever', loseGrandma);
      }
      if (st.lost) region(0, 0, 0, 0, '↺ Start again (restore the phone)', resetStorage);
      return false;
    },

    hotspot() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      let y = header('Hotspot');
      const strength = pwStrength(st.hsPw);
      y = rows([
        { icon: '📡', bg: C.purple, title: 'Use Wi-Fi hotspot', sub: st.hotspot ? `On · ${st.secure ? 1 : 3} device${st.secure ? '' : 's'} connected` : 'Off', toggle: st.hotspot, fn: () => flip('hotspot'), label: `📡 Hotspot: ${st.hotspot ? 'on' : 'off'}`, primary: !st.hotspot },
        { icon: '🏷', bg: C.teal, title: 'Hotspot name', sub: 'Kofi\'s phone' },
        { icon: st.secure ? '🔒' : '🔓', bg: st.secure ? C.teal : C.red, title: 'Security', sub: st.secure ? 'WPA2 password' : 'None: open to everyone', warn: !st.secure, toggle: st.secure, fn: () => { st.secure = !st.secure; hotspotNote(); }, label: `🔒 Security: ${st.secure ? 'password' : 'none'}` },
        { icon: '🔑', bg: '#f4a11d', title: 'Hotspot password', sub: st.secure ? (st.hsPw ? `${'•'.repeat(Math.min(st.hsPw.length, 16))} · ${strength.word}` : 'Not set yet') : '—', warn: st.secure && strength.score < 2 },
      ], y);
      if (st.hotspot) {
        y += 20;
        txt('Connected devices', 32, y, { size: 22, weight: 700, color: C.muted });
        rows([{ icon: '💻', bg: C.blue, title: 'Laptop (your sister\'s)', sub: 'Using your data bundle' },
          ...(st.secure ? [] : [{ icon: '❓', bg: C.red, title: 'Unknown phone', sub: 'Downloading videos…', warn: true }, { icon: '❓', bg: C.red, title: 'Unknown tablet', sub: 'Updating apps…', warn: true }])], y + 20, 86);
      }
      return false;
    },

    store() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      rr(24, 70, W - 48, 64, 32, '#f1edf4');
      txt('←', 54, 102, { size: 28, weight: 700 });
      region(24, 70, 70, 64, '◁ Back', back, { panel: false });
      txt('torch', 96, 102, { size: 24 });
      txt('🔍', W - 60, 102, { size: 24, align: 'center' });
      txt('Play Store · search results', 32, 170, { size: 20, color: C.muted });
      ['real', 'fake'].forEach((k, i) => {
        const L = LISTINGS[k], y = 200 + i * 170;
        rr(20, y, W - 40, 150, 22, '#faf8fb', '#ebe6ef');
        icon(90, y + 75, 92, C.gold, '🔦', { gsize: 0.55 });
        txt(L.name, 156, y + 42, { size: 24, weight: 700, max: W - 196 });
        txt(L.dev, 156, y + 76, { size: 20, color: k === 'real' ? C.teal : C.muted, max: W - 196 });
        txt(`${L.rating} ★   ·   ${L.downloads} downloads`, 156, y + 110, { size: 19, color: C.muted });
        region(20, y, W - 40, 150, k === 'real' ? '🔦 Open “Bright Torch”' : '🔦 Open “Bright Torch FREE Gold Edition”', () => { st.listing = k; go('listing'); });
      });
      rr(20, 560, W - 40, 150, 22, '#fff6d6');
      txt('💡 Did you know?', 44, 600, { size: 22, weight: 700 });
      para('Most Android phones already have a torch in Quick Settings. You may not need an app at all!', 44, 638, W - 100, { size: 20 });
      return false;
    },

    listing() {
      const L = LISTINGS[st.listing], done = st.checks[st.listing];
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      txt('←', 34, 98, { size: 30, weight: 700 });
      region(0, 60, 90, 80, '◁ Back', back, { panel: false });
      icon(96, 210, 120, C.gold, '🔦', { gsize: 0.55 });
      txt(L.name, 176, 180, { size: 27, weight: 700, max: W - 196 });
      const tick = (k, x, y) => done.has(k) && txt(st.listing === 'real' ? '✅' : '❌', x, y, { size: 22, align: 'center' });
      txt(L.dev, 176, 222, { size: 22, weight: 600, color: st.listing === 'real' ? C.teal : C.red, max: W - 230 });
      tick('dev', W - 36, 222);
      region(170, 196, W - 170, 52, CHECKS[0][1], () => check('dev'));
      // Stats strip
      rr(24, 290, W - 48, 96, 18, '#faf8fb', '#ebe6ef');
      [[`${L.rating} ★`, `${L.reviews} reviews`], [L.downloads, 'Downloads'], ['3+', 'Rated for 3+']].forEach(([a, b], i) => {
        const cx = 24 + (W - 48) * (i + 0.5) / 3;
        txt(a, cx, 322, { size: 24, weight: 700, align: 'center' });
        txt(b, cx, 356, { size: 17, color: C.muted, align: 'center' });
      });
      tick('stats', W - 40, 300);
      region(24, 290, W - 48, 96, CHECKS[1][1], () => check('stats'));
      const inst = st.installed === st.listing;
      rr(24, 410, W - 48, 70, 35, inst ? '#efe9f3' : '#01875f');
      txt(inst ? 'Installed ✓  ·  Open' : 'Install', W / 2, 445, { size: 26, weight: 700, color: inst ? C.purple : '#fff', align: 'center' });
      region(24, 410, W - 48, 70, inst ? '🔦 Open the app' : `⬇ Install “${L.name}”`, () => (inst ? go('torch') : install(st.listing)), { primary: true });
      // Reviews
      txt('Reviews', 32, 530, { size: 24, weight: 700 });
      tick('reviews', W - 40, 530);
      rr(24, 556, W - 48, 120, 18, '#faf8fb', '#ebe6ef');
      txt(st.listing === 'real' ? '★★★★★  Abena K. · 2 days ago' : '★☆☆☆☆  Yaw · yesterday', 44, 586, { size: 18, color: C.muted });
      para(L.review, 44, 622, W - 100, { size: 21, weight: 600 });
      region(24, 516, W - 48, 160, CHECKS[2][1], () => check('reviews'));
      // Data safety
      txt('Data safety', 32, 718, { size: 24, weight: 700 });
      tick('safety', W - 40, 718);
      rr(24, 744, W - 48, 110, 18, st.listing === 'real' ? '#e9f7f5' : '#fde8ec');
      para((st.listing === 'real' ? '🛡 ' : '⚠ ') + L.safety, 44, 778, W - 100, { size: 21, weight: 600, color: st.listing === 'real' ? C.teal : C.red });
      region(24, 704, W - 48, 150, CHECKS[3][1], () => check('safety'));
      return false;
    },

    torch() {
      const fake = st.installed === 'fake';
      g.fillStyle = fake ? '#2a2a2a' : C.plum;
      g.fillRect(0, 0, W, H);
      txt(fake ? 'Torch GOLD' : 'Bright Torch', W / 2, 110, { size: 30, weight: 700, color: '#fff', align: 'center' });
      const on = st.torch;
      g.fillStyle = on ? 'rgba(255,190,0,0.25)' : 'rgba(255,255,255,0.06)';
      g.beginPath(); g.arc(W / 2, 420, 190, 0, 7); g.fill();
      g.fillStyle = on ? C.gold : '#4a3a58';
      g.beginPath(); g.arc(W / 2, 420, 130, 0, 7); g.fill();
      g.strokeStyle = on ? C.plum : '#fff'; g.lineWidth = 12; g.lineCap = 'round';
      g.beginPath(); g.arc(W / 2, 430, 56, -Math.PI * 0.3, Math.PI * 1.3); g.stroke();
      g.beginPath(); g.moveTo(W / 2, 360); g.lineTo(W / 2, 420); g.stroke();
      g.lineCap = 'butt';
      txt(on ? 'ON' : 'OFF', W / 2, 650, { size: 40, weight: 700, color: on ? C.gold : '#c9c0d2', align: 'center' });
      if (fake) {
        rr(24, 720, W - 48, 150, 18, '#ffeb3b');
        txt('🎁 YOU WON A FREE PHONE!!!', W / 2, 770, { size: 24, weight: 700, color: C.red, align: 'center' });
        txt('Tap here and enter your MoMo PIN', W / 2, 820, { size: 20, color: C.plum, align: 'center' });
        region(24, 720, W - 48, 150, '🎁 Tap the advert', () => note('🚩 A scam advert', '<p>The copy app is full of adverts like this one. “You won! Enter your MoMo PIN” is <b>always a scam</b>. Uninstall the copy (Settings → Apps).</p>'));
        region(0, 0, 0, 0, '🗑 Uninstall the copy', uninstallFake, { primary: true });
      }
      const step = PERMS[st.permStep];
      if (!fake && step) {
        g.fillStyle = 'rgba(0,0,0,0.55)';
        g.fillRect(0, 0, W, H);
        const y0 = H - 470;
        rr(24, y0, W - 48, 400, 32, '#fff');
        txt(step.icon, W / 2, y0 + 50, { size: 38, align: 'center' });
        txt(`Question ${st.permStep + 1} of 3`, W / 2, y0 + 92, { size: 17, color: C.muted, align: 'center' });
        para(`Allow Bright Torch to ${step.ask}`, 52, y0 + 128, W - 104, { size: 24, weight: 700, lh: 32 });
        if (step.why) txt(step.why, 52, y0 + 200, { size: 16, color: C.muted, max: W - 104 });
        [['While using the app', true], ['Only this time', true], ['Don\'t allow', false]].forEach(([t, v], i) => {
          const y = y0 + 222 + i * 58;
          rr(48, y, W - 96, 50, 25, '#efe9f3');
          txt(t, W / 2, y + 25, { size: 21, weight: 600, color: C.blue, align: 'center' });
          region(48, y, W - 96, 50, `${v ? '✅' : '🚫'} ${t}`, () => answer(step, v, t));
        });
      } else if (!fake) {
        const ok = st.perms.camera && !st.perms.contacts && !st.perms.location;
        region(W / 2 - 130, 290, 260, 260, on ? '🔦 Turn the torch off' : '🔦 Turn the torch on', () => setTorch(!st.torch), { primary: ok });
        if (!ok) region(0, 0, 0, 0, '🔧 Fix the permissions', fixPerms, { primary: true });
      }
      return true;
    },

    messages() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      const y = header('Messages');
      const threads = [
        { from: '0551234567', when: 'now', text: 'You have received GHS 500.00 from Kwame A. New balance GHS 512.40.', unread: st.scam.unread, fn: () => openScam(), label: '📩 Open the message from 0551234567' },
        { from: 'MoMo ✓', when: 'Yesterday', text: 'Payment received for GHS 20.00 from AMA MENSAH. Current balance: GHS 640.00. Transaction ID: 4417025.', fn: () => openReal(), label: '📩 Open the message from MoMo' },
        { from: 'Mum', when: 'Mon', text: 'Please buy bread on your way home 🍞', fn: () => note('💬 Mum', '<p>A normal message from Mum. Nothing to worry about!</p>') },
      ];
      threads.forEach((t, i) => {
        const yy = y + i * 120;
        g.fillStyle = t.from.startsWith('MoMo') ? C.gold : t.from === 'Mum' ? C.teal : '#9b91a4';
        g.beginPath(); g.arc(62, yy + 60, 34, 0, 7); g.fill();
        txt(t.from.startsWith('MoMo') ? 'M' : t.from === 'Mum' ? 'M' : '#', 62, yy + 62, { size: 26, weight: 700, color: t.from.startsWith('MoMo') ? C.plum : '#fff', align: 'center' });
        txt(t.from, 112, yy + 40, { size: 23, weight: t.unread ? 700 : 600 });
        txt(t.when, W - 30, yy + 40, { size: 18, color: C.muted, align: 'right' });
        txt(t.text, 112, yy + 76, { size: 19, weight: t.unread ? 600 : 400, color: t.unread ? C.plum : C.muted, max: W - 150 });
        if (t.unread) { g.fillStyle = C.blue; g.beginPath(); g.arc(W - 40, yy + 78, 8, 0, 7); g.fill(); }
        region(0, yy, W, 120, t.label ?? t.from, t.fn, { panel: !!t.label });
      });
      return false;
    },

    thread() {
      const real = st.thread === 'real';
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      const y = header(real ? 'MoMo ✓' : '0551234567');
      txt(real ? 'Official sender name · Yesterday 18:02' : 'Ordinary phone number · Today 10:44', W / 2, y + 30, { size: 18, color: real ? C.teal : C.red, align: 'center' });
      rr(28, y + 64, W - 120, 200, [28, 28, 28, 6], '#f1edf4');
      para(real ? 'Payment received for GHS 20.00 from AMA MENSAH. Current balance: GHS 640.00. Transaction ID: 4417025.' : 'You have received GHS 500.00 from Kwame A. New balance GHS 512.40.', 52, y + 104, W - 170, { size: 23, lh: 32 });
      if (!real) {
        region(0, 0, 0, 0, '🔍 Who sent it?', () => note('🔍 Who sent it?', '<p>It came from an <b>ordinary phone number</b> (0551234567). A real MoMo message comes from the network\'s <b>official name</b>, like the one from <b>MoMo ✓</b> yesterday. Anyone can type a text that <i>looks</i> like a MoMo message.</p>'));
        region(0, 0, 0, 0, '📩 Compare with the real MoMo message', openReal);
        if (!st.scam.called) region(0, 0, 0, 0, '⏳ Wait a moment…', ringNow, { primary: true });
      }
      return false;
    },

    call() {
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#2f2238');
      grd.addColorStop(1, '#5a4470');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      txt(st.callState === 'ring' ? 'Incoming call' : 'On a call · 0:14', W / 2, 130, { size: 22, color: '#c9c0d2', align: 'center' });
      g.fillStyle = '#9b91a4';
      g.beginPath(); g.arc(W / 2, 250, 70, 0, 7); g.fill();
      txt('?', W / 2, 254, { size: 70, weight: 700, color: '#fff', align: 'center' });
      txt('0551234567', W / 2, 360, { size: 34, weight: 700, color: '#fff', align: 'center' });
      txt('Unknown number', W / 2, 400, { size: 20, color: '#c9c0d2', align: 'center' });
      if (st.callState === 'ring') {
        g.fillStyle = C.red; g.beginPath(); g.arc(W * 0.28, H - 200, 52, 0, 7); g.fill();
        g.fillStyle = '#3aa655'; g.beginPath(); g.arc(W * 0.72, H - 200, 52, 0, 7); g.fill();
        txt('✆', W * 0.28, H - 198, { size: 44, color: '#fff', align: 'center' });
        txt('✆', W * 0.72, H - 198, { size: 44, color: '#fff', align: 'center' });
        txt('Decline', W * 0.28, H - 120, { size: 20, color: '#fff', align: 'center' });
        txt('Answer', W * 0.72, H - 120, { size: 20, color: '#fff', align: 'center' });
        region(W * 0.72 - 60, H - 260, 120, 160, '📞 Answer the call', () => { st.callState = 'talk'; st.scam.answered = true; render(); note('📞 The caller says…', '<p>“Hello! Sorry, I sent <b>GHS 500</b> to your MoMo by mistake. Please send it back <b>quickly</b>, my mother is in hospital!”</p><p>What will you do? Think about the <b>Golden MoMo Rules</b>.</p>'); }, { primary: true });
        region(W * 0.28 - 60, H - 260, 120, 160, '✋ Decline and check myself', hangUp);
      } else {
        rr(32, 450, W - 64, 230, 26, 'rgba(255,255,255,0.12)');
        para('“Sorry, I sent GHS 500 to your MoMo by mistake. Please send it back quickly, my mother is in hospital!”', 56, 494, W - 112, { size: 23, color: '#fff', lh: 32 });
        g.fillStyle = C.red; g.beginPath(); g.arc(W / 2, H - 190, 52, 0, 7); g.fill();
        txt('✆', W / 2, H - 188, { size: 44, color: '#fff', align: 'center' });
        region(0, 0, 0, 0, '💸 Send the GHS 500 back now', () => { hangUp(true); go('momo'); startSend(); });
        region(0, 0, 0, 0, '🔢 Tell him my PIN so he can “fix it”', givePin);
        region(W / 2 - 60, H - 250, 120, 120, '✋ Hang up and check myself', hangUp, { primary: true });
      }
      return true;
    },

    momo() {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      g.fillStyle = C.gold;
      g.fillRect(0, 0, W, 300);
      txt('←', 30, 98, { size: 34, weight: 700 });
      region(0, 56, 90, 84, '◁ Back', back, { panel: false });
      txt('MoMo', 92, 98, { size: 34, weight: 700 });
      txt('Official app · Kofi\'s family wallet', 92, 134, { size: 18, color: C.plum });
      rr(28, 170, W - 56, 110, 24, '#fff');
      txt('Available balance', 52, 204, { size: 20, color: C.muted });
      if (st.scam.checked) txt(`GHS ${st.scam.sent ? '140.00' : '640.00'}`, 52, 246, { size: 38, weight: 700, color: C.plum });
      else txt('GHS ••••••', 52, 246, { size: 38, weight: 700, color: C.muted });
      region(28, 170, W - 56, 110, '🔎 Check my balance', checkBalance, { primary: !st.scam.checked });
      if (st.scam.sending) {
        rr(28, 320, W - 56, 400, 26, '#fff', '#ebe6ef');
        txt('Send money', 52, 362, { size: 26, weight: 700 });
        txt('To: 0551234567', 52, 412, { size: 22 });
        txt('Amount: GHS 500.00', 52, 450, { size: 22 });
        txt('Reference: “refund”', 52, 488, { size: 22 });
        txt('Enter your PIN to confirm', 52, 540, { size: 20, color: C.muted });
        txt('● ● ● ● ● ●', 52, 580, { size: 26, color: C.plum });
        rr(52, 620, 180, 60, 30, '#efe9f3'); txt('Cancel', 142, 650, { size: 22, weight: 700, color: C.purple, align: 'center' });
        rr(W - 232, 620, 180, 60, 30, C.red); txt('Confirm', W - 142, 650, { size: 22, weight: 700, color: '#fff', align: 'center' });
        region(52, 620, 180, 60, '✋ Cancel: send nothing', () => { st.scam.sending = false; render(); note('✋ Stopped in time', '<p>Good. Before you ever send money “back”, <b>check your balance yourself</b>. Did any GHS 500 really arrive?</p>'); }, { primary: true });
        region(W - 232, 620, 180, 60, '💸 Confirm and send GHS 500', sendMoney);
        return false;
      }
      const latest = st.scam.checked ? [
        { icon: '⬇', bg: C.teal, title: 'Received from AMA MENSAH', sub: 'Yesterday · GHS 20.00' },
        { icon: '⬆', bg: C.purple, title: 'Paid ECG prepaid', sub: 'Mon · GHS 50.00' },
        ...(st.scam.sent ? [{ icon: '⬆', bg: C.red, title: 'Sent to 0551234567', sub: 'Now · GHS 500.00', warn: true }] : []),
      ] : [];
      let y = 320;
      if (latest.length) { txt('Latest transactions', 32, y + 10, { size: 21, weight: 700, color: C.muted }); y = rows(latest, y + 30, 88); }
      else y = rows([{ icon: '⇄', bg: C.purple, title: 'Send money', sub: 'To a phone number', fn: () => startSend(), label: '💸 Send money' }, { icon: '🧾', bg: C.teal, title: 'Pay bills', sub: 'ECG, water, school fees' }], y, 92);
      if (st.scam.seen && !st.scam.done && !st.scam.sent && st.scam.checked) {
        region(0, 0, 0, 0, '🛑 Send nothing: it\'s a scam', () => sendNothing(), { primary: true });
        region(0, 0, 0, 0, '💸 Send GHS 500 anyway', startSend);
      }
      if (st.scam.seen && (st.scam.done || st.scam.sent || st.scam.pin)) region(0, 0, 0, 0, '↺ Play the scam message again', resetScam);
      if (st.scam.seen && !st.scam.done) region(0, 0, 0, 0, '📞 Call official customer service', () => note('📞 Official customer service', '<p>Calling the network\'s <b>official</b> customer service number (printed on its website or SIM pack, never the number in the message) is a great way to report a scam. Tell a parent too.</p>'));
      return false;
    },
  };

  let lastKey = '';
  function render() {
    regions = [];
    g.save();
    const dark = SCREENS[st.screen]();
    g.restore();
    if (!['call'].includes(st.screen)) {
      if (!dark) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, 56); }
      statusBar(dark);
      navBar(dark);
    }
    if (st.toast) {
      g.font = f(20, 600);
      const tw = g.measureText(st.toast).width + 40;
      rr((W - tw) / 2, H - 150, tw, 52, 26, 'rgba(36,24,46,0.92)');
      txt(st.toast, W / 2, H - 124, { size: 20, weight: 600, color: '#fff', align: 'center' });
    }
    // The Play Store and MoMo cards point at icons on the home screen only.
    midSpot.visible = dockSpot.visible = st.screen === 'home';
    hsArcs.forEach((a) => (a.visible = st.hotspot));
    screen.material.map.needsUpdate = true;
    screen.material.color.setScalar(0.55 + 0.45 * st.brightness);
    drawLaptop();
    buildPanel();
  }

  // ---------- Side panel ----------
  const phoneG = ui.group('The phone');
  ui.button('⬇ Swipe down: Quick Settings', () => go('qs'), { group: phoneG });
  ui.button('○ Home', home, { group: phoneG });
  ui.button('◁ Back', back, { group: phoneG });
  const appG = ui.group('Open an app');
  ui.button('🛒 Play Store', () => go('store', true), { group: appG });
  ui.button('⚙️ Settings', () => go('settings', true), { group: appG });
  ui.button('💾 Storage', () => go('storage', true), { group: appG });
  ui.button('💬 Messages', () => go('messages', true), { group: appG });
  ui.button('💰 MoMo', () => go('momo', true), { group: appG });
  const screenG = ui.group('');
  let busy = false;
  function buildPanel() {
    const had = screenG.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    screenG.innerHTML = '<span class="lab-group-title">On the screen</span>';
    const seen = new Set();
    for (const r of regions) {
      if (r.panel === false || !r.label || seen.has(r.label)) continue;
      seen.add(r.label);
      const b = ui.button(r.label, () => !busy && r.fn(), { group: screenG, primary: !!r.primary });
      b.dataset.key = r.label;
      if (busy) { b.setAttribute('aria-disabled', 'true'); b.style.opacity = '0.5'; }
    }
    if (st.screen === 'hotspot') hotspotField();
    if (had) {
      const again = [...screenG.querySelectorAll('button')].find((b) => b.dataset.key === had) ?? screenG.querySelector('button');
      again?.focus();
    }
  }
  function hotspotField() {
    const d = ui.element(`<label class="lab-field">🔑 Hotspot password (pretend)<input type="text" maxlength="24" autocomplete="off" spellcheck="false" placeholder="at least 8 characters" value="${esc(st.hsPw)}"></label><p class="crack hs-meter" style="margin-top:6px"></p>`, screenG);
    const inp = d.querySelector('input'), m = d.querySelector('.hs-meter');
    const show = () => {
      const s = pwStrength(inp.value);
      m.innerHTML = inp.value ? `Strength: <b style="color:${['#ca1f3f', '#ca1f3f', '#b07d00', '#2a9d8f'][s.score]}">${s.word}</b>${s.tip ? ` · ${esc(s.tip)}` : ''}` : 'Use a passphrase of 3 words and a number, like <b>Kente-Lamp-47</b>. (Never a real password.)';
    };
    inp.addEventListener('input', show);
    show();
    ui.button('💾 Save password', () => {
      st.hsPw = inp.value.trim();
      st.secure = true;
      const s = pwStrength(st.hsPw);
      note(s.score >= 2 ? '🔒 Password saved' : '⚠️ That password is weak', s.score >= 2 ? '<p>Now only people you give the password to can join. Share it only with people you know, and <b>turn the hotspot off</b> when you finish: it uses your bundle and drains the battery.</p>' : `<p>${esc(s.tip || 'Make it longer.')} A neighbour could guess it and use up your data bundle.</p>`);
    }, { group: screenG, primary: true });
  }

  // ---------- Navigation and actions ----------
  function go(s, fresh) {
    if (busy) return;
    if (fresh) {
      history.length = 0;
      history.push('home');
    } else if (st.screen !== s) history.push(st.screen);
    st.screen = s;
    st.confirmDel = false;
    st.toast = '';
    render();
    stage.reveal();
    INTRO[s]?.();
  }
  function back() {
    if (busy) return;
    if (st.screen === 'torch' && st.installed === 'real' && PERMS[st.permStep]) return note('🔦 Answer the question first', '<p>The app is waiting for your answer. Choose one of the options on the screen.</p>');
    st.screen = history.pop() ?? 'home';
    st.confirmDel = false;
    st.toast = '';
    render();
  }
  function home() {
    if (busy) return;
    history.length = 0;
    st.screen = 'home';
    st.toast = '';
    render();
  }
  function note(title, html) { ui.info(title, html); }
  function toast(t) {
    st.toast = t;
    render();
    const mine = t;
    stage.wait(2.2).then(() => { if (st.toast === mine) { st.toast = ''; render(); } });
  }
  const INTRO = {
    qs: () => note('⬇ Quick Settings', '<p>Swiping down from the top of the screen twice opens <b>Quick Settings</b>. Each tile is like a light switch: tap it to turn something <b>on</b> (gold) or <b>off</b> (dark).</p>'),
    settings: () => note('⚙️ The Settings app', '<p>For everything else, open <b>Settings</b> (the grey gear). Samsung phones call some sections by different names.</p>'),
    store: () => note('🛒 Two torch apps?', '<p>You searched for <b>torch</b> and found two apps with the same name and logo. One is real; one is a <b>copy</b> that wants to steal data.</p><p>Open each one and do the <b>4 checks</b>: developer, downloads and rating, reviews, data safety. Then install the real one.</p>'),
    storage: () => note('💾 Storage full!', `<p>Only <b>${free().toFixed(1)} GB</b> is free, so the phone can't take photos or update apps. Free at least <b>${GOAL_GB} GB</b>.</p><p>Uninstall apps you never use, delete videos you don't need and empty the bin. Photos? <b>Back them up first</b>, on Wi-Fi.</p>`),
    hotspot: () => note('📡 Hotspot', '<p>A hotspot turns the phone into a little Wi-Fi router, so your sister\'s laptop can use the phone\'s <b>data bundle</b>. Set a strong password, then turn it on.</p>'),
    messages: () => st.scam.unread && note('💬 A new message', '<p>A message says someone sent you money. Open it, and think before you do anything.</p>'),
    momo: () => !st.scam.sending && note('💰 MoMo', '<p>This is the <b>official</b> MoMo app (in real life you can also dial the network\'s official MoMo menu). This is the only safe place to check what is really in the wallet.</p>'),
  };

  function bright(d) {
    st.brightness = Math.max(0.2, Math.min(1, st.brightness + d));
    render();
    note('☀️ Brightness', `<p>Brightness is now <b>${Math.round(st.brightness * 100)}%</b>. ${st.brightness > 0.8 ? 'A very bright screen drains the battery faster.' : st.brightness < 0.4 ? 'Dim is kind to the battery, but hard to read in sunshine.' : 'A medium brightness saves battery.'}</p>`);
  }

  function flip(id) {
    if (busy) return;
    const was = st[id];
    if (id === 'data' && st.plane && !was) return note('✈ Aeroplane mode is on', '<p>Aeroplane mode switches off the phone\'s radios, including mobile data. Turn aeroplane mode off first.</p>');
    if (id === 'hotspot' && !was) {
      if (st.plane || !st.data) return note('📡 No data to share', '<p>A hotspot shares your <b>mobile data</b>. Turn on <b>Mobile data</b> (and make sure aeroplane mode is off) first.</p>');
      if (st.secure && pwStrength(st.hsPw).score < 2) {
        if (st.screen !== 'hotspot') go('hotspot');
        return note('🔑 Set a password first', '<p>Never leave a hotspot open. Type a strong hotspot password in the box below and press <b>Save password</b>, then turn the hotspot on.</p>');
      }
    }
    if (id === 'torch') return setTorch(!was, true);
    st[id] = !was;
    const on = st[id];
    if (id === 'plane') {
      if (on) { st.prev = { wifi: st.wifi, data: st.data, bt: st.bt }; st.wifi = st.data = st.bt = false; st.hotspot = false; }
      else if (st.prev) { st.wifi = st.prev.wifi; st.data = st.prev.data; st.bt = st.prev.bt; }
    }
    if (id === 'data' && !on) st.hotspot = false;
    render();
    const TEXT = {
      wifi: on ? '<p>📶 <b>Wi-Fi on</b>: connected to <b>Hub-WiFi</b>. Internet from a router does <b>not</b> use your data bundle, so use Wi-Fi whenever you can.</p>' : '<p>📶 <b>Wi-Fi off</b>. Now any internet comes from mobile data, which uses your bundle.</p>',
      data: on ? '<p>⇅ <b>Mobile data on</b>: internet from the phone network, paid for with your <b>data bundle</b>. Watch out: videos can use 1 GB an hour!</p>' : '<p>⇅ <b>Mobile data off</b>. Turning it off when you are not using it makes a bundle last longer.</p>',
      bt: on ? '<p>ᛒ <b>Bluetooth on</b>: now you can pair earbuds or a speaker. Turn it off afterwards to save battery.</p>' : '<p>ᛒ <b>Bluetooth off</b>. Saves a little battery.</p>',
      plane: on ? '<p>✈ <b>Aeroplane mode on</b>: Wi-Fi, mobile data and Bluetooth all switch off. No calls, no internet. Useful on a plane, or for quiet homework time.</p>' : '<p>✈ <b>Aeroplane mode off</b>: the phone reconnects to the network.</p>',
      rotate: on ? '<p>🔄 <b>Auto-rotate on</b>: the screen turns when you turn the phone sideways.</p>' : '<p>🔄 <b>Auto-rotate off</b>: the screen stays upright, handy for reading in bed.</p>',
      saver: on ? '<p>🔋 <b>Battery saver on</b>: the phone slows background apps and dims a little, so the battery lasts longer.</p>' : '<p>🔋 <b>Battery saver off</b>.</p>',
      hotspot: on ? '' : '<p>📡 <b>Hotspot off</b>. Good: turn it off when you finish, because it uses your bundle and drains the battery.</p>',
    };
    if (id === 'hotspot' && on) hotspotNote();
    else note(id === 'plane' ? '✈ Aeroplane mode' : '⬇ Quick Settings', TEXT[id]);
  }
  function hotspotNote() {
    render();
    if (!st.hotspot) return note('📡 Hotspot', st.secure ? '<p>Security: <b>password</b>. Good.</p>' : '<p>⚠️ Security: <b>none</b>. If you turn the hotspot on like this, anyone nearby can join and use up your bundle.</p>');
    if (st.secure) note('📡 Hotspot on, with a password', '<p>The laptop has joined <b>Kofi\'s phone</b>. Every megabyte it uses comes from the phone\'s <b>data bundle</b>, and a laptop can download big updates quickly. Turn the hotspot <b>off</b> when she finishes.</p>');
    else note('⚠️ An open hotspot!', '<p>With no password, <b>two unknown devices</b> joined too, and they are using up your bundle! Turn <b>Security</b> back on with a strong password.</p>');
  }
  function pwStrength(p) {
    if (!p) return { score: 0, word: 'none', tip: '' };
    if (p.length < 8) return { score: 1, word: 'too short', tip: 'A hotspot password needs at least 8 characters.' };
    if (/^(\d)\1+$|^12345678|^password|^qwerty/i.test(p)) return { score: 1, word: 'easy to guess', tip: 'Everyone tries 12345678 and "password" first.' };
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
    if (p.length >= 12 || kinds >= 3) return { score: 3, word: 'strong', tip: '' };
    return { score: 2, word: 'OK', tip: 'Longer is stronger: try three words and a number.' };
  }

  // ----- Mission 1: install safely and choose permissions -----
  function check(k) {
    st.checks[st.listing].add(k);
    render();
    const L = LISTINGS[st.listing];
    const n = st.checks[st.listing].size;
    note(`${CHECKS.find((c) => c[0] === k)[1]} · ${L.name}`, `<p>${L.checks[k]}</p><p><small>${n} of 4 checks done for this app.${n === 4 ? (st.listing === 'real' ? ' Every check passes: this is the <b>real</b> app.' : ' Every check fails: this is a <b>copy</b>. Go back and open the other one.') : ''}</small></p>`);
  }
  function install(k) {
    if (st.installed && st.installed !== k) return note('📦 One torch is enough', `<p>You already installed ${st.installed === 'real' ? 'the real Bright Torch' : 'the copy'}. ${st.installed === 'fake' ? 'Uninstall the copy first (Settings → Apps).' : ''}</p>`);
    const n = st.checks[k].size;
    st.installed = k;
    if (k === 'fake') {
      st.screen = 'torch';
      history.length = 0; history.push('home');
      render();
      stage.reveal();
      note('🚩 Oh no, that was the copy!', `<p>“Bright Torch FREE Gold Edition” is a <b>fake</b>.${n < 4 ? ' The 4 checks would have shown it:' : ' The checks showed it:'}</p><ul><li>Developer: <b>free-apps-4u-2024</b>, not a real company</li><li>Only 500+ downloads and 2.1 ★</li><li>Reviews: “It stole my data!!”</li><li>Data safety: shares contacts, location and messages</li></ul><p>It is already showing scam adverts. Press <b>🗑 Uninstall the copy</b>, then install the real one.</p>`);
      return;
    }
    st.perms = {};
    st.permStep = 0;
    st.screen = 'torch';
    history.length = 0; history.push('home');
    render();
    stage.reveal();
    note(n === 4 ? '✅ The real app, well checked!' : '✅ That\'s the real one', `<p>${n === 4 ? 'You did all <b>4 checks</b> before you installed it. Exactly right.' : `Good choice. Next time, do all <b>4 checks</b> first (you did ${n}).`}</p><p>Now the app asks for <b>permissions</b>. For each one ask: <b>does a torch really need this?</b></p>`);
  }
  function uninstallFake() {
    if (st.installed !== 'fake') return;
    st.installed = null;
    st.screen = 'home';
    history.length = 0;
    render();
    note('🗑 Copy uninstalled', '<p>Good. Now open the <b>Play Store</b> again and install the <b>real</b> Bright Torch by Sunrise Apps Ltd.</p>');
  }
  function answer(step, allow, word) {
    st.perms[step.id] = allow;
    st.permStep++;
    const good = allow === step.need;
    render();
    const why = {
      camera: allow ? 'A torch uses the camera\'s <b>flash</b> as its light, so this one makes sense.' : 'Hmm: a torch uses the camera\'s <b>flash</b> as its light. Without this, the torch can\'t work.',
      contacts: allow ? 'Why would a torch need your <b>contacts</b>? It doesn\'t! Now it can read everybody\'s names and numbers.' : 'Right: a torch has no reason to read your <b>contacts</b>.',
      location: allow ? 'A torch does not need to know <b>where you are</b>. That was a "no".' : 'Right: a torch does not need to know <b>where you are</b>.',
    }[step.id];
    if (st.permStep < PERMS.length) return note(`${good ? '👍' : '🤔'} “${word}”`, `<p>${why}</p><p><small>Question ${st.permStep + 1} of 3 is on the screen.</small></p>`);
    const p = st.perms;
    const ok = p.camera && !p.contacts && !p.location;
    if (ok) {
      ui.complete('install');
      note('🏆 Installed safely!', `<p>${why}</p><p>You chose the <b>real</b> app and gave it only what it needs: the camera flash. No contacts, no location.</p><p>Tap the big button to try your torch! You can change permissions any time in <b>Settings → Apps → Bright Torch → Permissions</b>.</p>`);
    } else {
      note('🔧 Not quite right yet', `<p>${why}</p><p>${!p.camera ? 'Without the camera permission the light can\'t work. ' : ''}${p.contacts || p.location ? 'You allowed something a torch doesn\'t need. ' : ''}Fix it: press <b>⚙️ Settings → Apps → Bright Torch → Permissions</b>, or the button below.</p>`);
    }
  }
  function fixPerms() {
    if (st.installed !== 'real') return;
    st.perms = {};
    st.permStep = 0;
    setTorch(false, false, true);
    st.screen = 'torch';
    render();
    note('🔧 Permissions reset', '<p>The app will ask again. This time think: <b>does a torch need it?</b></p>');
  }
  function setTorch(on, fromTile, quiet) {
    if (on && st.screen === 'torch' && st.installed === 'real' && !st.perms.camera) {
      return note('🚫 No permission', '<p>You said <b>Don\'t allow</b> to the camera, so the torch can\'t use the flash. Fix it in Settings → Apps → Bright Torch → Permissions.</p>');
    }
    st.torch = on;
    flashMat.emissive.setHex(on ? 0xffe9a0 : 0x000000);
    flashMat.emissiveIntensity = on ? 2 : 1;
    beam.visible = on;
    torchLight.intensity = on ? 6 : 0;
    render();
    if (quiet) return;
    if (on) stage.reveal();
    note(on ? '🔦 Let there be light!' : '🔦 Torch off', on ? `<p>The <b>flash</b> on the back of the phone is the torch. Look behind the phone! ${fromTile ? 'You used the torch tile in <b>Quick Settings</b>: no app needed at all.' : ''}</p>` : '<p>Turn the torch off when you finish: it drains the battery.</p>');
  }

  // ----- Mission 2: free up storage -----
  const used = () => SYSTEM_GB + st.items.reduce((s, i) => s + i.gb, 0);
  const free = () => TOTAL_GB - used();
  async function delItem(it) {
    if (busy || st.lost && it.id !== 'grandma') { if (st.lost) note('😢 Start again', '<p>Press <b>↺ Start again</b> to restore the phone and try once more, keeping Grandma\'s photos safe.</p>'); return; }
    if (it.id === 'school') return note('📚 Keep it!', '<p>You use the School app <b>every day</b>. Only uninstall apps you <b>never</b> use, like the old Ludo game.</p>');
    if (it.id === 'grandma' && !it.backed) { st.confirmDel = true; render(); return note('⚠️ Wait!', '<p>These photos are <b>not backed up</b>. If you delete them, they are gone for ever.</p>'); }
    st.items = st.items.filter((x) => x !== it);
    const WHY = {
      chat: 'Old forwarded videos and voice notes fill phones fast. (In WhatsApp: Settings → Storage and data → Manage storage.)',
      camera: 'These photos are <b>backed up</b> in the cloud, so it is safe to remove the copies on the phone. You can still see them in Google Photos.',
      ludo: 'You hadn\'t opened it for 8 months. Uninstall apps you never use: you can always download them again.',
      grandma: 'They are safe in the cloud now, so freeing the space on the phone loses nothing.',
      movie: 'You already watched it. Big video files are often the biggest space-eaters.',
      bin: 'Deleted photos wait in the bin for 30 days. Emptying it frees the space straight away.',
    };
    render();
    toast(`${it.gb.toFixed(1)} GB freed`);
    checkStorage(`<p>${WHY[it.id]}</p>`);
  }
  function checkStorage(why) {
    const fr = free();
    if (!st.lost && fr >= GOAL_GB) {
      const first = !ui.isDone('storage');
      ui.complete('storage');
      note('🏆 Space freed, memories kept!', `${why}<p>Now <b>${fr.toFixed(1)} GB</b> is free, and every precious photo is safe. ${first ? 'Clear out what you don\'t need, and <b>back up before you delete</b>.' : ''}</p>`);
    } else note(`💾 ${fr.toFixed(1)} GB free`, `${why}<p>Goal: <b>${GOAL_GB} GB</b> free. ${fr < GOAL_GB ? `${(GOAL_GB - fr).toFixed(1)} GB to go.` : ''}</p>`);
  }
  async function backup(it) {
    if (busy) return;
    if (!st.wifi) {
      return note('📶 Turn on Wi-Fi first', `<p>Backing up <b>${it.gb.toFixed(1)} GB</b> of photos on mobile data would use up your whole data bundle! Swipe down for <b>Quick Settings</b> and turn on <b>Wi-Fi</b>, then come back to Storage.</p>`);
    }
    busy = true;
    st.backing = 0;
    render();
    stage.reveal();
    note('☁ Backing up on Wi-Fi…', '<p>The photos are copied to the cloud (here, Google Photos) using the Hub\'s Wi-Fi, so your data bundle is not touched.</p>');
    // Little photos fly up to the cloud.
    const flying = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(photoGeo, photoMats[i % 3]);
      p.visible = false;
      scene.add(p);
      flying.push(p);
    }
    const a = phone.localToWorld(new THREE.Vector3(0, PH * 0.55, 0.3));
    const b = cloud.position.clone();
    for (let i = 0; i < 6; i++) {
      const p = flying[i];
      p.visible = true;
      stage.tween((k) => {
        p.position.lerpVectors(a, b, k);
        p.position.y += Math.sin(k * Math.PI) * 1.2;
        p.rotation.set(k * 3, k * 2, 0);
        p.scale.setScalar(1 - k * 0.6);
      }, 0.9).then(() => { scene.remove(p); });
      st.backing = (i + 1) / 6;
      render();
      await stage.wait(0.35);
    }
    await stage.wait(0.6);
    busy = false;
    st.backing = -1;
    it.backed = true;
    it.sub = '☁ Backed up to Google Photos';
    it.verb = 'Free up';
    render();
    note('☁ Backed up!', '<p>Grandma\'s photos are now <b>safe in the cloud</b>. Check they are there, then you can <b>free up</b> the space on the phone without losing a single one.</p>');
  }
  function loseGrandma() {
    st.confirmDel = false;
    st.lost = true;
    st.items = st.items.filter((x) => x.id !== 'grandma');
    render();
    note('😢 Gone for ever', '<p>Those 140 photos were <b>not backed up</b>, so they can\'t come back. On a real phone this can\'t be undone!</p><p>Press <b>↺ Start again (restore the phone)</b> and this time <b>back them up on Wi-Fi first</b>.</p>');
  }
  function resetStorage() {
    st.items = ITEMS0.map((x) => ({ ...x }));
    st.lost = false;
    st.confirmDel = false;
    render();
    note('↺ Phone restored', `<p>Storage is full again (${free().toFixed(1)} GB free). Free <b>${GOAL_GB} GB</b>, and keep every photo that isn't backed up.</p>`);
  }

  // ----- Mission 3: the MoMo "wrong transfer" scam -----
  function openScam() {
    st.scam.unread = false;
    st.scam.seen = true;
    st.thread = 'scam';
    go('thread');
    note('📩 “You have received GHS 500.00”', '<p>A message says someone sent <b>GHS 500</b> to the family\'s MoMo wallet. Look carefully: <b>who sent it?</b></p>');
  }
  function openReal() {
    st.thread = 'real';
    go('thread');
    note('📩 A real MoMo message', '<p>Compare: a real message comes from the network\'s <b>official name</b> (MoMo ✓), not an ordinary number, and it has a <b>transaction ID</b>. The real balance yesterday was <b>GHS 640.00</b>.</p>');
  }
  let ringing = null;
  async function ringNow() {
    if (busy) return;
    st.scam.called = true;
    st.callState = 'ring';
    go('call');
    stage.reveal();
    note('📞 The phone is ringing!', '<p>It is the <b>same number</b> that sent the message: 0551234567. Answer it, or decline it.</p>');
    const run = (ringing = {});
    const y0 = phone.position.x;
    for (let i = 0; i < 6 && ringing === run && st.callState === 'ring' && st.screen === 'call'; i++) {
      await stage.tween((k) => { phone.position.x = y0 + Math.sin(k * Math.PI * 8) * 0.05; }, 0.5);
      phone.position.x = y0;
      await stage.wait(0.4);
    }
    phone.position.x = y0;
  }
  function hangUp(quiet) {
    st.callState = 'ended';
    ringing = null;
    st.screen = 'momo';
    history.length = 0; history.push('home');
    render();
    if (quiet === true) return;
    note('✋ Hung up', '<p>Smart. Never trust the text or the caller. Now check the wallet <b>yourself</b>, in the official MoMo app: press <b>🔎 Check my balance</b>.</p>');
  }
  function givePin() {
    st.scam.pin = true;
    hangUp(true);
    note('🛑 Never share your PIN!', '<p><b>Golden MoMo Rule 1:</b> never share the MoMo PIN with anyone, not even someone who says they work for the network. With your PIN, a scammer can <b>empty the wallet</b>.</p><p>In this pretend phone nothing was lost. Press <b>↺ Play the scam message again</b> and try once more.</p>');
  }
  function checkBalance() {
    st.scam.checked = true;
    render();
    if (!st.scam.seen) return note('🔎 Balance: GHS 640.00', '<p>This is the real balance, straight from the official app. Now open <b>💬 Messages</b>: a new message has arrived.</p>');
    if (st.scam.sent) return note('💸 Balance: GHS 140.00', '<p>The GHS 500 you sent “back” is gone, and it was the family\'s own money.</p>');
    note('🔎 Balance: GHS 640.00', '<p>The same as yesterday! The latest money in was <b>GHS 20.00 from AMA MENSAH</b>. <b>No GHS 500 ever arrived.</b></p><p>The text was fake, and the call was a trick to make you send your own money. What will you do now?</p>');
  }
  function startSend() {
    st.scam.sending = true;
    if (st.screen !== 'momo') go('momo');
    else render();
    if (st.scam.seen && !st.scam.checked) note('⚠️ Stop and think', '<p>You are about to send <b>GHS 500</b> to a stranger, but you never checked whether any money arrived. Press <b>Cancel</b> and <b>🔎 Check my balance</b> first.</p>');
  }
  function sendMoney() {
    st.scam.sending = false;
    st.scam.sent = true;
    st.scam.checked = true;
    render();
    note('💸 The money is gone', '<p>No GHS 500 ever arrived: the text was fake. You just sent the family\'s <b>own</b> money to a scammer, and it is very hard to get back.</p><p><b>Always check the balance yourself</b> in the official app first. Press <b>↺ Play the scam message again</b> and try once more. (Don\'t worry: this is a pretend wallet.)</p>');
  }
  function sendNothing() {
    if (!st.scam.checked) return;
    st.scam.done = true;
    render();
    const clean = !st.scam.sent && !st.scam.pin;
    if (clean) ui.complete('momo');
    note(clean ? '🏆 Scam stopped!' : '🛑 Better, but…', `${clean ? '' : '<p>Earlier you told the caller your <b>PIN</b>. With it he could empty the wallet, even though you sent nothing. Press <b>↺ Play the scam message again</b> and keep the PIN secret.</p>'}<p>You checked the balance <b>yourself</b>, saw that no money came in, and sent <b>nothing</b>. That is exactly what a smart family does.</p><p><b>🛑 The Golden MoMo Rules</b></p><ol><li>Never share the MoMo PIN with anyone.</li><li>“You have won a prize! Send a fee to claim it” is always a scam.</li><li>Never approve a payment request you did not start.</li><li>If something feels wrong, stop, tell a parent, and call the network's official customer service number to report it.</li></ol>`);
  }
  function resetScam() {
    Object.assign(st.scam, { unread: true, seen: false, called: false, answered: false, checked: false, sent: false, pin: false, sending: false, done: false });
    st.callState = 'ring';
    home();
    note('↺ A new message…', '<p>The 💬 Messages app has a new message. Open it and try again.</p>');
  }

  // ---------- Clicking the 3D phone ----------
  stage.clickable(screen, (o, e, hit) => {
    if (!hit?.uv) return;
    const x = hit.uv.x * W, y = (1 - hit.uv.y) * H;
    const r = [...regions].reverse().find((q) => q.fn && x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
    if (r && !busy) r.fn();
  });
  stage.clickable(laptop, () => go('hotspot', true));
  stage.clickable(cloud, () => go('storage', true));
  stage.clickable(mast, () => go('qs'));
  stage.clickable(router, () => go('qs'));

  // ---------- Callouts (most important first: phones show only four) ----------
  stage.callout(topSpot, { icon: '⬇️', title: 'Quick Settings', text: 'Swipe down from the top for the switches.', dx: 190, dy: -30, onClick: () => go('qs') });
  stage.callout(midSpot, { icon: '🛒', title: 'Install safely', text: 'Do the 4 checks before you press Install.', dx: -210, dy: -40, onClick: () => go('store', true) });
  stage.callout(dockSpot, { icon: '💰', title: 'MoMo safety', text: 'Check the balance yourself. Never share the PIN.', dx: 210, dy: 30, onClick: () => go('momo', true) });
  stage.callout(cloud, { icon: '☁️', title: 'Back up', text: 'Back up photos on Wi-Fi before deleting.', at: [-0.2, 0.5, 0], dx: -60, dy: -60, onClick: () => go('storage', true) });
  stage.callout(laptop, { icon: '📡', title: 'Hotspot', text: 'Share your data with a password.', at: [0, 1.6, -0.7], dx: 60, dy: -80, onClick: () => go('hotspot', true) });

  // ---------- Idle animation ----------
  stage.onTick((dt, t) => {
    const dataOn = st.data && !st.plane;
    arcs.forEach((a, i) => { a.visible = dataOn; a.material.opacity = 0.35 + 0.5 * Math.max(0, Math.sin(t * 3 - i * 0.9)); });
    hsArcs.forEach((a, i) => (a.material.opacity = 0.35 + 0.5 * Math.max(0, Math.sin(t * 3 - i * 0.9))));
    wifiArcs.forEach((a, i) => { a.visible = st.wifi; a.material.opacity = 0.35 + 0.5 * Math.max(0, Math.sin(t * 3 - i * 0.9)); });
    ledMat.emissiveIntensity = st.wifi ? 0.6 + 0.3 * Math.sin(t * 5) : 0.1;
    cloud.position.y = cloudHome.y + Math.sin(t * 1.2) * 0.08;
  });

  render();
  ui.info('📱 Meet Kofi\'s family phone', '<p>This pretend Android phone works like a real one. Use the buttons (or tap the 3D screen) to explore: swipe down for <b>Quick Settings</b>, open <b>Settings</b>, the <b>Play Store</b>, <b>Messages</b> and <b>MoMo</b>.</p><p>Nothing here touches a real phone, real money or the internet, so explore freely!</p>');
}

export const missions = [
  { id: 'install', text: 'Install the real torch app (not the copy), then answer its 3 permission questions wisely.', hint: 'Open 🛒 Play Store. Check the developer, downloads, reviews and data safety. A torch only needs the camera flash.' },
  { id: 'storage', text: 'Storage is full: free at least 7 GB without losing any photos that aren\'t backed up.', hint: 'Open 💾 Storage. Delete what you don\'t need. Back up Grandma\'s photos on Wi-Fi before you free their space.' },
  { id: 'momo', text: 'A “wrong transfer, please send it back” message arrives: check the balance yourself and send nothing.', hint: 'Open 💬 Messages. Don\'t trust the text or the caller: check in the official 💰 MoMo app.' },
];

export const config = { camera: [3.4, 8.6, 11.5], target: [0, 4.1, 0], shadowSize: 9, frame: 0.7, minDistance: 4 };
