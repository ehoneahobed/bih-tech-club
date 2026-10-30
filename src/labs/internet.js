// Sessions 6, 7 & 14 — The internet as a road network. Send web requests
// (HTTP vs HTTPS), follow an email through the digital post office, and watch
// classmates edit a shared document in the cloud.
import { THREE, COLORS, box, rbox, mat, decal, cable, label, setLabel } from './runtime.js';

const NODES = {
  you: { name: 'Your computer', pos: [-7, 0, 3], kind: 'pc', color: COLORS.purple, info: 'Your device, in the computer lab. Every request starts here.' },
  router: { name: 'School Wi-Fi router', pos: [-4, 0, 4.5], kind: 'router', color: 0x495057, info: 'Connects the lab computers to each other and passes traffic to the Internet Service Provider.' },
  isp: { name: 'ISP (e.g. mobile network)', pos: [-1.5, 0, 1.5], kind: 'tower', color: 0xadb5bd, info: 'The <b>Internet Service Provider</b> — the company whose "roads" connect your school to the rest of the internet.' },
  hub: { name: 'The Internet', pos: [1.5, 0, -1], kind: 'globe', color: COLORS.blue, info: 'Millions of computers joined by cables, satellites and radio. The <b>internet</b> is the road network; the <b>Web</b> is one kind of traffic on it.' },
  web: { name: 'Web server', pos: [6, 0, -4], kind: 'server', color: COLORS.green, info: 'A computer that stores websites and sends pages to anyone who asks.' },
  mailA: { name: 'School mail server', pos: [-5, 0, -3], kind: 'server', color: COLORS.gold, info: 'Your school\'s digital post office. It sends your outgoing mail.' },
  mailB: { name: 'Friend\'s mail server', pos: [6.5, 0, 1.5], kind: 'server', color: COLORS.gold, info: 'The receiving post office. It keeps the email until your friend opens their inbox.' },
  friend: { name: 'Friend\'s computer', pos: [8.5, 0, 4.5], kind: 'pc', color: COLORS.red, info: 'Kofi, at another school.' },
  teacher: { name: 'Teacher\'s computer', pos: [4, 0, 5.5], kind: 'pc', color: 0x5a4470, info: 'Your teacher, who was Cc\'d.' },
  cloud: { name: 'Cloud drive', pos: [1.5, 0, -5.5], kind: 'cloud', color: 0x90e0ef, info: 'A file stored online so the whole team can work on it at once.' },
  ama: { name: 'Ama (Editor)', pos: [-2.5, 0, -7], kind: 'pc', color: 0x2a9d8f, info: 'Ama can <b>edit</b> the shared document.' },
  yaw: { name: 'Yaw (Commenter)', pos: [5.5, 0, -7.5], kind: 'pc', color: 0xf4a261, info: 'Yaw can <b>comment</b> but not change the text.' },
};
// Cards for the most important places: [icon, title, text, point on it, dx, dy].
const CALLOUTS = {
  you: ['💻', 'Your computer', 'Every request starts here', [0, 1.3, 0], -30, 95],
  router: ['📶', 'Wi-Fi router', 'Joins the lab to the ISP', [0, 0.3, 0], 150, 85],
  hub: ['🌍', 'The Internet', 'A road network of computers', [0.6, 2.4, 0], 230, -105],
  web: ['🗄️', 'Web server', 'Stores websites, sends pages', [0.5, 1.2, 0], 115, 5],
  mailA: ['📮', 'Mail server', 'Your school\'s digital post office', [0, 1.4, 0], -70, -95],
  cloud: ['☁️', 'Cloud drive', 'One shared file, saved online', [0, 1.9, 0], 0, -95],
};
const LINKS = [['you', 'router'], ['router', 'isp'], ['isp', 'hub'], ['hub', 'web'], ['router', 'mailA'], ['mailA', 'hub'], ['hub', 'mailB'], ['mailB', 'friend'], ['mailB', 'teacher'], ['hub', 'cloud'], ['ama', 'cloud'], ['yaw', 'cloud']];

const SITES = [
  { url: 'https://www.wikipedia.org', secure: true, ext: '.org', note: 'An organisation (often non-profit).' },
  { url: 'https://moe.gov.gh', secure: true, ext: '.gov.gh', note: 'A Government of Ghana website — usually reliable for official information.' },
  { url: 'https://www.ug.edu.gh', secure: true, ext: '.edu.gh', note: 'An education institution in Ghana.' },
  { url: 'http://free-phone-prizes.com', secure: false, ext: '.com', note: 'A commercial site. No padlock, and the offer is too good to be true — be very careful!' },
];

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
const font = (px, w = 'bold') => `${w} ${px}px Rubik, system-ui, sans-serif`;
// Which picture each screen shows at the start.
const SCREENS = { you: 'browser', friend: 'mail', teacher: 'mail', ama: 'doc', yaw: 'doc', spy: 'mail' };
const LAPTOPS = new Set(['ama', 'yaw', 'spy']);
// Backbone links are thick fibre; the rest are thinner network cables.
const FIBRE = new Set(['isp-hub', 'hub-web', 'mailA-hub', 'hub-mailB', 'hub-cloud', 'router-isp']);

// ---------- Drawing helpers (2D canvas) ----------
function padlock(g, x, y, s, ok) {
  g.strokeStyle = g.fillStyle = ok ? '#2a9d8f' : '#ca1f3f';
  g.lineWidth = s * 0.18;
  g.beginPath(); g.arc(x, y - s * 0.15, s * 0.3, Math.PI, ok ? 0 : -0.6); g.stroke();
  g.fillRect(x - s * 0.42, y - s * 0.15, s * 0.84, s * 0.6);
}
function drawScreen(g, W, H, view, color, url = 'Search or type a web address', secure = null) {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#24182e';
  g.fillRect(0, 0, W, H * 0.13);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = ['#ca1f3f', '#ffbe00', '#2ec4b6'][i];
    g.beginPath(); g.arc(W * (0.04 + i * 0.035), H * 0.065, H * 0.025, 0, 7); g.fill();
  }
  const ac = hex(color);
  if (view === 'browser') {
    g.fillStyle = '#efeaf2';
    g.beginPath(); g.roundRect(W * 0.05, H * 0.17, W * 0.9, H * 0.11, H * 0.05); g.fill();
    if (secure !== null) padlock(g, W * 0.1, H * 0.225, H * 0.08, secure);
    g.fillStyle = secure === false ? '#ca1f3f' : '#24182e';
    g.font = font(H * 0.065, secure === null ? 'normal' : 'bold');
    g.textBaseline = 'middle';
    g.fillText(url, W * (secure === null ? 0.08 : 0.14), H * 0.228, W * 0.78);
    g.fillStyle = ac;
    g.fillRect(W * 0.05, H * 0.34, W * 0.9, H * 0.16);
    g.fillStyle = '#d9d3de';
    g.fillRect(W * 0.05, H * 0.56, W * 0.38, H * 0.34);
    [0.58, 0.66, 0.74, 0.82].forEach((y, k) => g.fillRect(W * 0.48, H * y, W * (k === 3 ? 0.3 : 0.47), H * 0.04));
  } else if (view === 'mail') {
    g.fillStyle = '#efeaf2';
    g.fillRect(0, H * 0.13, W * 0.25, H * 0.87);
    for (let k = 0; k < 4; k++) {
      const y = H * (0.18 + k * 0.2);
      g.fillStyle = k === 0 ? ac : '#ffffff';
      g.fillRect(W * 0.28, y, W * 0.68, H * 0.16);
      g.fillStyle = k === 0 ? '#ffffff' : '#9b91a4';
      g.fillRect(W * 0.32, y + H * 0.04, W * 0.3, H * 0.035);
      g.fillRect(W * 0.32, y + H * 0.1, W * 0.5, H * 0.025);
    }
    g.fillStyle = ac;
    g.beginPath(); g.roundRect(W * 0.03, H * 0.18, W * 0.19, H * 0.1, H * 0.04); g.fill();
  } else {
    // A document editor: a page with a heading and lines of text.
    g.fillStyle = '#efeaf2';
    g.fillRect(0, H * 0.13, W, H * 0.87);
    g.fillStyle = '#ffffff';
    g.fillRect(W * 0.2, H * 0.18, W * 0.6, H * 0.82);
    g.fillStyle = ac;
    g.fillRect(W * 0.26, H * 0.25, W * 0.35, H * 0.06);
    g.fillStyle = '#9b91a4';
    for (let k = 0; k < 6; k++) g.fillRect(W * 0.26, H * (0.38 + k * 0.09), W * (k % 3 === 2 ? 0.3 : 0.48), H * 0.03);
  }
}

// ---------- 3D parts ----------
// A thin rod from a to b (tower legs and braces).
function rod(a, b, r, color, ink = true) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6), mat(color, { metalness: 0.4, roughness: 0.4 }));
  m.position.copy(A).lerp(B, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = ink;
  m.userData.noInk = !ink;
  return m;
}
function led(color, w = 0.05, h = 0.03) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), mat(color, { emissive: color, emissiveIntensity: 1 }));
  m.userData.noInk = true;
  m.userData.blink = Math.random() * 6;
  return m;
}
function keyboardDecal(w, d, dark) {
  return decal(w, d, (g, W, H) => {
    g.fillStyle = dark ? '#3b3f46' : '#ffffff';
    const kw = W / 13;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
      if (r === 3 && c > 2 && c < 9) continue;
      g.beginPath(); g.roundRect(kw * 0.6 + c * kw, H * 0.08 + r * H * 0.22, kw * 0.8, H * 0.17, 3); g.fill();
    }
    g.beginPath(); g.roundRect(kw * 3.6, H * 0.74, kw * 5.8, H * 0.17, 3); g.fill();
  }, { px: 96 });
}

function pcModel(g, id, n) {
  const screen = decal(1.1, 0.7, (c, W, H) => drawScreen(c, W, H, SCREENS[id], n.color), { px: 256, transparent: false });
  if (LAPTOPS.has(id)) {
    const base = rbox(1.1, 0.06, 0.75, 0xc9c3cf, 0.025, { metalness: 0.3 });
    base.position.set(0, 0.03, 0.2);
    const keys = keyboardDecal(0.95, 0.4, true);
    keys.rotation.x = -Math.PI / 2;
    keys.position.set(0, 0.062, 0.12);
    const pad = box(0.3, 0.005, 0.15, 0xb5aebb);
    pad.position.set(0, 0.062, 0.45);
    const hinge = new THREE.Group();
    hinge.position.set(0, 0.06, -0.16);
    hinge.rotation.x = -0.25;
    const lid = rbox(1.1, 0.76, 0.04, 0x3b3f46, 0.02);
    lid.position.y = 0.38;
    screen.scale.setScalar(0.92);
    screen.position.set(0, 0.39, 0.022);
    hinge.add(lid, screen);
    g.add(base, keys, pad, hinge);
  } else {
    const bezel = rbox(1.2, 0.8, 0.07, 0x24182e, 0.03);
    bezel.position.y = 1.0;
    screen.position.set(0, 1.01, 0.037);
    const neck = rbox(0.1, 0.55, 0.05, 0x5a4470, 0.02);
    neck.position.set(0, 0.32, -0.06);
    const foot = rbox(0.5, 0.04, 0.35, 0x5a4470, 0.02);
    foot.position.set(0, 0.02, -0.02);
    const tower = rbox(0.36, 0.85, 0.85, 0x3b3f46, 0.03);
    tower.position.set(-0.9, 0.43, -0.05);
    const tf = decal(0.3, 0.8, (c, W, H) => {
      c.fillStyle = '#24182e';
      c.fillRect(W * 0.12, H * 0.1, W * 0.76, H * 0.06);
      c.fillStyle = '#2ec4b6';
      c.beginPath(); c.arc(W / 2, H * 0.28, W * 0.1, 0, 7); c.fill();
      c.strokeStyle = '#24182e';
      c.lineWidth = W * 0.06;
      for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(W * 0.2, H * (0.55 + k * 0.05)); c.lineTo(W * 0.8, H * (0.55 + k * 0.05)); c.stroke(); }
    }, { px: 64 });
    tf.position.set(-0.9, 0.43, 0.378);
    const kb = rbox(0.9, 0.04, 0.3, 0xe9e4ec, 0.015);
    kb.position.set(0.05, 0.02, 0.5);
    const keys = keyboardDecal(0.84, 0.26, false);
    keys.rotation.x = -Math.PI / 2;
    keys.position.set(0.05, 0.042, 0.5);
    const mouse = rbox(0.12, 0.05, 0.18, 0xe9e4ec, 0.025);
    mouse.position.set(0.65, 0.025, 0.52);
    g.add(bezel, screen, neck, foot, tower, tf, kb, keys, mouse);
  }
  g.userData.screen = screen;
}

function serverModel(g, id, n) {
  const rack = rbox(1.05, 1.5, 1.0, 0x2c2433, 0.05);
  rack.position.y = 0.75;
  const ac = hex(n.color);
  const front = decal(0.95, 1.4, (c, W, H) => {
    for (let u = 0; u < 3; u++) {
      const y = H * (0.04 + u * 0.32);
      c.fillStyle = '#4a3f56';
      c.beginPath(); c.roundRect(W * 0.03, y, W * 0.94, H * 0.29, 8); c.fill();
      // Drive bays.
      for (let k = 0; k < 4; k++) {
        c.fillStyle = '#1b1520';
        c.fillRect(W * (0.07 + k * 0.12), y + H * 0.04, W * 0.1, H * 0.21);
        c.fillStyle = '#9b91a4';
        c.fillRect(W * (0.09 + k * 0.12), y + H * 0.06, W * 0.06, H * 0.015);
      }
      // Vents.
      c.fillStyle = '#1b1520';
      for (let k = 0; k < 6; k++) c.fillRect(W * 0.58, y + H * (0.05 + k * 0.035), W * 0.24, H * 0.014);
      c.fillStyle = ac;
      c.fillRect(W * 0.86, y + H * 0.04, W * 0.07, H * 0.21);
    }
  }, { px: 128 });
  front.position.set(0, 0.75, 0.502);
  // A sign on top says what the server is for.
  const sign = decal(0.8, 0.5, (c, W, H) => {
    c.fillStyle = ac;
    c.beginPath(); c.roundRect(0, 0, W, H, 16); c.fill();
    c.fillStyle = '#24182e';
    if (id === 'web') {
      c.font = font(H * 0.42);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('www', W / 2, H * 0.52);
    } else {
      c.fillStyle = '#ffffff';
      c.fillRect(W * 0.28, H * 0.2, W * 0.44, H * 0.6);
      c.strokeStyle = '#24182e';
      c.lineWidth = H * 0.06;
      c.strokeRect(W * 0.28, H * 0.2, W * 0.44, H * 0.6);
      c.beginPath(); c.moveTo(W * 0.28, H * 0.2); c.lineTo(W / 2, H * 0.52); c.lineTo(W * 0.72, H * 0.2); c.stroke();
    }
  }, { px: 96 });
  sign.rotation.x = -Math.PI / 2;
  sign.position.set(0, 1.502, 0.05);
  g.add(rack, front, sign);
  for (let u = 0; u < 3; u++) for (const [x, col] of [[0.3, 0x2ec4b6], [0.36, COLORS.gold]]) {
    const l = led(col, 0.035, 0.035);
    l.position.set(x, 0.75 + 0.7 - 1.4 * (0.12 + u * 0.32), 0.508);
    g.add(l);
  }
}

function routerModel(g) {
  const body = rbox(1.2, 0.22, 0.8, 0xeeeaf1, 0.07);
  body.position.y = 0.15;
  const top = decal(0.5, 0.4, (c, W, H) => {
    c.strokeStyle = '#5a4470';
    c.lineCap = 'round';
    c.lineWidth = W * 0.06;
    for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(W / 2, H * 0.85, k * W * 0.15, -Math.PI * 0.8, -Math.PI * 0.2); c.stroke(); }
    c.fillStyle = '#5a4470';
    c.beginPath(); c.arc(W / 2, H * 0.85, W * 0.05, 0, 7); c.fill();
  }, { px: 96 });
  top.rotation.x = -Math.PI / 2;
  top.position.set(0, 0.262, 0.05);
  g.add(body, top);
  for (let k = 0; k < 4; k++) {
    const l = led(k === 0 ? 0x2ec4b6 : COLORS.gold);
    l.position.set(-0.3 + k * 0.2, 0.15, 0.402);
    g.add(l);
  }
  for (const [x, tilt] of [[-0.45, 0.25], [0, 0], [0.45, -0.25]]) {
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.7, 4, 8), mat(0x24182e));
    a.position.set(x - Math.sin(tilt) * 0.35, 0.62, -0.34);
    a.rotation.z = tilt;
    a.castShadow = true;
    g.add(a);
  }
}

// The ISP: a steel mobile-network mast with antennas, a dish and an equipment cabinet.
function towerModel(g) {
  const H = 3.2, steel = 0xadb5bd;
  const w = (y) => 0.45 - (y / H) * 0.3;
  const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  for (const [sx, sz] of corners) g.add(rod([sx * w(0), 0, sz * w(0)], [sx * w(H), H, sz * w(H)], 0.04, steel));
  const levels = [0, 0.8, 1.6, 2.4, H];
  for (let i = 0; i < levels.length - 1; i++) {
    const y0 = levels[i], y1 = levels[i + 1];
    for (let k = 0; k < 4; k++) {
      const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4];
      g.add(rod([ax * w(y0), y0, az * w(y0)], [bx * w(y1), y1, bz * w(y1)], 0.015, 0x8d969e, false));
      g.add(rod([ax * w(y1), y1, az * w(y1)], [bx * w(y1), y1, bz * w(y1)], 0.015, 0x8d969e, false));
    }
  }
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16), mat(0x6c757d));
  deck.position.y = H - 0.35;
  g.add(deck);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
    const p = rbox(0.18, 0.6, 0.07, 0xf9f9f9, 0.03);
    p.position.set(Math.sin(a) * 0.36, H - 0.05, Math.cos(a) * 0.36);
    p.rotation.y = a;
    g.add(p);
  }
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.1, 16), mat(0xf9f9f9));
  dish.position.set(0.22, 2.0, -0.2);
  dish.rotation.order = 'YXZ';
  dish.rotation.set(Math.PI / 2, 2.4, 0); // faces the globe
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(COLORS.red, { emissive: COLORS.red, emissiveIntensity: 1 }));
  beacon.position.y = H + 0.08;
  beacon.userData.blink = 0;
  beacon.userData.noInk = true;
  const cab = rbox(0.55, 0.55, 0.4, 0xd9d3de, 0.03);
  cab.position.set(0.75, 0.28, 0.35);
  const cf = decal(0.45, 0.45, (c, W, H2) => {
    c.fillStyle = '#5a4470';
    c.beginPath(); c.roundRect(W * 0.1, H2 * 0.1, W * 0.8, H2 * 0.32, 8); c.fill();
    c.fillStyle = '#ffffff';
    c.font = font(H2 * 0.22);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('ISP', W / 2, H2 * 0.27);
    c.fillStyle = '#9b91a4';
    for (let k = 0; k < 4; k++) c.fillRect(W * 0.2, H2 * (0.55 + k * 0.09), W * 0.6, H2 * 0.04);
  }, { px: 96 });
  cf.position.set(0.75, 0.28, 0.552);
  g.add(dish, beacon, cab, cf);
}

// A school globe on a stand, with simple continents and Ghana marked in gold.
const LANDS = [
  [[-17, 21], [-10, 30], [10, 37], [32, 31], [35, 28], [43, 12], [51, 12], [40, -5], [40, -15], [35, -25], [20, -35], [17, -28], [12, -15], [12, -5], [8, 4], [-8, 4], [-17, 14]],
  [[-10, 36], [-9, 43], [-2, 48], [5, 52], [10, 57], [20, 60], [30, 70], [40, 66], [45, 50], [30, 45], [25, 40], [15, 40], [5, 43], [0, 40]],
  [[40, 66], [60, 70], [100, 75], [140, 72], [170, 65], [160, 55], [140, 50], [130, 40], [120, 30], [110, 20], [105, 10], [95, 15], [90, 22], [80, 10], [72, 20], [60, 25], [50, 30], [45, 40], [45, 50]],
  [[-165, 65], [-140, 70], [-100, 72], [-80, 70], [-60, 60], [-55, 50], [-70, 43], [-80, 30], [-82, 25], [-97, 20], [-90, 15], [-105, 20], [-115, 30], [-125, 40], [-125, 50], [-140, 60]],
  [[-80, 10], [-60, 10], [-50, 0], [-35, -7], [-40, -20], [-50, -30], [-65, -40], [-70, -55], [-75, -45], [-72, -20], [-80, -5]],
  [[115, -20], [130, -12], [145, -15], [153, -28], [145, -38], [135, -35], [115, -35]],
  [[-55, 60], [-45, 60], [-20, 70], [-25, 80], [-60, 80], [-70, 75]],
];
function globeTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  const X = (lon) => ((lon + 180) / 360) * c.width, Y = (lat) => ((90 - lat) / 180) * c.height;
  g.fillStyle = '#3a86c8';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(255,255,255,0.3)';
  g.lineWidth = 2;
  for (let lon = -180; lon < 180; lon += 30) { g.beginPath(); g.moveTo(X(lon), 0); g.lineTo(X(lon), c.height); g.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { g.beginPath(); g.moveTo(0, Y(lat)); g.lineTo(c.width, Y(lat)); g.stroke(); }
  g.fillStyle = '#86b86a';
  g.strokeStyle = '#4f7d3d';
  g.lineWidth = 3;
  g.lineJoin = 'round';
  for (const land of LANDS) {
    g.beginPath();
    land.forEach(([lon, lat], i) => (i ? g.lineTo(X(lon), Y(lat)) : g.moveTo(X(lon), Y(lat))));
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.fillStyle = '#f2efe9';
  g.fillRect(0, Y(-72), c.width, c.height);
  g.fillStyle = '#ffbe00';
  g.strokeStyle = '#24182e';
  g.beginPath(); g.arc(X(-1), Y(8), 9, 0, 7); g.fill(); g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function globeModel(g, stage) {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.12, 32), mat(0x24182e));
  base.position.y = 0.06;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.2, 12), mat(0x5a4470));
  post.position.y = 0.2;
  const tilt = new THREE.Group();
  tilt.position.y = 1.4;
  tilt.rotation.z = -0.41;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.2, 40, 20), mat(0xffffff, { map: globeTexture(), roughness: 0.45 }));
  ball.castShadow = true;
  ball.rotation.y = -1.6;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.035, 8, 48, Math.PI), mat(0xc9a227, { metalness: 0.6, roughness: 0.3 }));
  ring.rotation.z = -Math.PI / 2;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.75, 8), mat(0xc9a227, { metalness: 0.6 }));
  pin.userData.noInk = true;
  tilt.add(ball, ring, pin);
  g.add(base, post, tilt);
  stage.onTick((dt) => (ball.rotation.y += dt * 0.2));
}

// A soft cloud with the shared document on its front.
function cloudModel(g) {
  for (const [x, y, z, r] of [[0, 1.15, 0, 0.72], [0.75, 0.98, 0.05, 0.5], [-0.75, 0.98, 0.05, 0.5], [0.32, 1.62, -0.05, 0.52], [-0.35, 1.52, 0, 0.45], [1.15, 0.9, -0.1, 0.32], [-1.15, 0.9, -0.1, 0.32]]) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat(0xffffff, { roughness: 0.9 }));
    p.position.set(x, y, z);
    p.scale.y = 0.85;
    p.castShadow = true;
    g.add(p);
  }
  const docIcon = decal(0.7, 0.9, (c, W, H) => {
    c.fillStyle = '#ffffff';
    c.strokeStyle = '#24182e';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(W * 0.1, H * 0.05); c.lineTo(W * 0.68, H * 0.05); c.lineTo(W * 0.9, H * 0.22); c.lineTo(W * 0.9, H * 0.95); c.lineTo(W * 0.1, H * 0.95);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#3d6fd6';
    c.fillRect(W * 0.22, H * 0.25, W * 0.4, H * 0.06);
    c.fillStyle = '#9b91a4';
    for (let k = 0; k < 5; k++) c.fillRect(W * 0.22, H * (0.4 + k * 0.1), W * (k === 4 ? 0.3 : 0.56), H * 0.03);
  }, { px: 128 });
  docIcon.position.set(0, 1.05, 0.8);
  g.add(docIcon);
}

export default function internetLab(stage, ui) {
  const { scene } = stage;
  const pos = (id) => new THREE.Vector3(...NODES[id].pos);

  for (const [id, n] of Object.entries(NODES)) {
    const g = new THREE.Group();
    g.position.copy(pos(id));
    if (n.kind === 'pc') pcModel(g, id, n);
    else if (n.kind === 'server') serverModel(g, id, n);
    else if (n.kind === 'router') routerModel(g);
    else if (n.kind === 'tower') towerModel(g);
    else if (n.kind === 'globe') globeModel(g, stage);
    else if (n.kind === 'cloud') cloudModel(g);
    // The main places get a callout card (below); the rest keep a small tag.
    if (!CALLOUTS[id]) {
      const t = label(n.name, { scale: 0.62 });
      t.position.y = n.kind === 'tower' ? 3.6 : 2.1;
      g.add(t);
    }
    scene.add(g);
    n.group = g;
    stage.clickable(g, () => select(id));
  }
  // Status lights blink, each at its own pace.
  const blinkers = [];
  scene.traverse((m) => m.userData.blink !== undefined && blinkers.push(m));
  let clock = 0;
  stage.onTick((dt) => {
    clock += dt;
    for (const m of blinkers) m.material.emissiveIntensity = Math.sin(clock * (2 + (m.userData.blink % 3)) + m.userData.blink * 3) > -0.2 ? 1.2 : 0.15;
  });
  // Redraw a computer's screen (your browser shows the address you visit).
  function setScreen(id, view, url, secure) {
    const tex = NODES[id].group.userData.screen.material.map;
    const c = tex.image;
    drawScreen(c.getContext('2d'), c.width, c.height, view, NODES[id].color, url, secure);
    tex.needsUpdate = true;
  }

  function select(id) {
    const n = NODES[id];
    ui.info(n.name, `<p>${n.info}</p>`);
    if (id === 'hub') {
      ui.complete('globe');
      cards.hub.card.classList.add('done');
    }
  }
  // Clicking a card does the same as clicking the place.
  const cards = {};
  for (const [id, [icon, title, text, at, dx, dy]] of Object.entries(CALLOUTS)) {
    cards[id] = stage.callout(NODES[id].group, { icon, title, text, at, dx, dy, onClick: () => select(id) });
  }
  if (ui.isDone('globe')) cards.hub.card.classList.add('done');

  // Cables along the ground, with a gentle S-bend like a real cable run.
  for (const [a, b] of LINKS) {
    const fibre = FIBRE.has(`${a}-${b}`);
    const pa = pos(a).setY(fibre ? 0.07 : 0.05);
    const pb = pos(b).setY(fibre ? 0.07 : 0.05);
    const side = new THREE.Vector3(pb.z - pa.z, 0, pa.x - pb.x).normalize().multiplyScalar(0.18);
    const pts = [pa, pa.clone().lerp(pb, 0.33).add(side), pa.clone().lerp(pb, 0.66).sub(side), pb];
    const c = cable(pts.map((v) => v.toArray()), fibre ? 0x3b2d48 : 0x7a6690, fibre ? 0.05 : 0.035);
    c.castShadow = false;
    scene.add(c);
  }

  // Eavesdropper on the café-style network, used to explain HTTPS.
  const spy = label('👀 Snooper', { scale: 0.55, color: '#CA1F3F' });
  spy.position.set(-2.4, 1.2, 4.6);
  scene.add(spy);
  // The snooper's own laptop, listening in on the network.
  const spyPc = new THREE.Group();
  spyPc.position.set(-2.4, 0, 4.4);
  spyPc.rotation.y = -0.5;
  spyPc.scale.setScalar(0.6);
  pcModel(spyPc, 'spy', { color: COLORS.red });
  scene.add(spyPc);
  const spyBubble = label('…', { scale: 0.6, color: '#CA1F3F', width: 768 });
  spyBubble.position.set(-2.4, 2.0, 4.6);
  spyBubble.visible = false;
  scene.add(spyBubble);

  // ---------- Packets ----------
  // Packets: small cubes with an icon on each side, or envelopes for email.
  const icons = new Map();
  function iconMat(key, color) {
    if (!icons.has(key)) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = hex(color);
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = g.strokeStyle = '#ffffff';
      g.lineWidth = 12;
      g.lineCap = g.lineJoin = 'round';
      if (key.startsWith('lock')) {
        g.fillStyle = '#ffffff';
        g.strokeStyle = '#ffffff';
        g.beginPath(); g.arc(64, 54, 18, Math.PI, 0); g.stroke();
        g.fillRect(38, 54, 52, 40);
      } else if (key.startsWith('open')) {
        g.beginPath(); g.arc(64, 44, 18, Math.PI, -0.4); g.stroke();
        g.fillRect(38, 54, 52, 40);
        g.fillStyle = hex(color);
        g.fillRect(60, 62, 8, 18);
      } else if (key.startsWith('mail')) {
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 128, 128);
        g.strokeStyle = '#9b91a4';
        g.lineWidth = 5;
        g.beginPath(); g.moveTo(6, 10); g.lineTo(64, 70); g.lineTo(122, 10); g.stroke();
        g.fillStyle = hex(color);
        g.fillRect(92, 76, 26, 32);
        g.fillStyle = '#9b91a4';
        g.fillRect(16, 86, 50, 6);
        g.fillRect(16, 100, 36, 6);
      } else {
        // An arrow: data on the move.
        g.beginPath(); g.moveTo(28, 64); g.lineTo(96, 64); g.moveTo(72, 40); g.lineTo(98, 64); g.lineTo(72, 88); g.stroke();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      icons.set(key, mat(0xffffff, { map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }));
    }
    return icons.get(key);
  }
  function packet(kind, color, icon = 'arrow') {
    const g = new THREE.Group();
    if (kind === 'mail') {
      const face = iconMat(`mail${color}`, color);
      const paper = mat(0xffffff);
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), [paper, paper, paper, paper, face, face]));
    } else {
      const face = iconMat(`${icon}${color}`, color);
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), face));
    }
    g.children[0].castShadow = true;
    scene.add(g);
    return g;
  }
  function drop(p) {
    scene.remove(p);
    p.traverse((m) => m.isMesh && m.geometry.dispose());
  }
  async function send(p, route, speed = 0.55, onHop) {
    stage.reveal();
    for (let i = 0; i < route.length - 1; i++) {
      const a = pos(route[i]).setY(1.0);
      const b = pos(route[i + 1]).setY(1.0);
      onHop?.(route[i], route[i + 1]);
      await stage.tween((k) => {
        p.position.lerpVectors(a, b, k);
        p.position.y += Math.sin(k * Math.PI) * 0.6;
        p.rotation.y += 0.08;
      }, speed * Math.max(0.6, a.distanceTo(b) / 4));
    }
  }
  let busy = false;
  const once = (fn) => async () => {
    if (busy) return;
    busy = true;
    try {
      await fn();
    } finally {
      busy = false;
    }
  };

  // ---------- Website ----------
  const webGroup = ui.group('1 · Visit a website (Session 6)');
  SITES.forEach((site) =>
    ui.button(`${site.secure ? '🔒' : '⚠️'} ${site.url.replace(/^https?:\/\//, '')}`, once(() => visit(site)), { group: webGroup })
  );
  async function visit(site) {
    ui.info(site.url, `<p><b>${site.secure ? '🔒 HTTPS' : '⚠️ HTTP — not secure'}</b> · domain ending <code>${site.ext}</code>: ${site.note}</p><p>Your request travels: computer → router → ISP → internet → web server…</p>`);
    const req = packet('data', site.secure ? COLORS.green : COLORS.red, site.secure ? 'lock' : 'open');
    setScreen('you', 'browser', site.url.replace(/^https?:\/\//, ''), null);
    await send(req, ['you', 'router', 'isp', 'hub', 'web'], 0.55, (a) => {
      if (a === 'router') {
        spyBubble.visible = true;
        setLabel(spyBubble, site.secure ? 'k#9@x!q2Zr… (scrambled!)' : 'GET /prize?phone=024…', { width: 768, color: '#CA1F3F' });
      }
      if (a === 'isp') spyBubble.visible = false;
    });
    drop(req);
    const page = packet('data', COLORS.blue);
    await send(page, ['web', 'hub', 'isp', 'router', 'you']);
    drop(page);
    setScreen('you', 'browser', site.url, site.secure);
    ui.complete(site.secure ? 'https' : 'http');
    ui.info(site.url, `<p>✅ The web page arrived and your <b>browser</b> displayed it.</p><p>${site.secure ? 'The <b>padlock</b> means the data was <b>encrypted</b> (scrambled). The snooper only saw nonsense.' : '<b>No padlock:</b> the snooper on the network could read everything you sent. Never type passwords or personal details on an <code>http://</code> page.'}</p>`);
  }

  // ---------- Email ----------
  const mailGroup = ui.group('2 · Send an email (Session 7)');
  ui.button('✉️ To: Kofi', once(() => email(false)), { group: mailGroup });
  ui.button('✉️ To: Kofi · Cc: Teacher', once(() => email(true)), { group: mailGroup });
  async function email(cc) {
    ui.info('Sending email…', '<p><b>To:</b> kofi@friendschool.edu.gh' + (cc ? '<br><b>Cc:</b> teacher@friendschool.edu.gh' : '') + '<br><b>Subject:</b> Science project question</p><p>The email goes to <b>your</b> post office (mail server) first…</p>');
    setScreen('you', 'mail');
    const m = packet('mail', COLORS.gold);
    await send(m, ['you', 'router', 'mailA', 'hub', 'mailB']);
    ui.info('At the receiving post office', `<p>The friend's mail server reads the part after <b>@</b> to know it is the right post office, then delivers to the inbox${cc ? ' — and a <b>copy</b> for everyone in Cc' : ''}.</p>`);
    const jobs = [send(m, ['mailB', 'friend'])];
    let c2;
    if (cc) {
      c2 = packet('mail', COLORS.gold);
      c2.position.copy(m.position);
      jobs.push(send(c2, ['mailB', 'teacher']));
    }
    await Promise.all(jobs);
    drop(m);
    if (c2) drop(c2);
    if (cc) ui.complete('email-cc');
    ui.info('📬 Delivered!', `<p>${cc ? '<b>Cc</b> (carbon copy) means "for your information": the teacher gets the same email but Kofi is the main person who should reply.' : 'One email, one recipient. Add <b>Cc</b> to keep someone else informed.'}</p><p>Remember: a clear <b>Subject</b>, a greeting, a short message and a polite closing.</p>`);
  }

  // ---------- Shared document ----------
  const history = [];
  const histGroup = new THREE.Group();
  histGroup.position.copy(pos('cloud')).add(new THREE.Vector3(-1.9, 0, 0.6));
  scene.add(histGroup);
  const histTag = label('Version history: 0', { scale: 0.5 });
  histTag.position.set(0, 0.4, 0.8);
  histGroup.add(histTag);

  const docGroup = ui.group('3 · Edit a shared document (Session 14)');
  ui.button('Ama (Editor) adds a paragraph', once(() => edit('ama', true, 'Ama added a paragraph')), { group: docGroup });
  ui.button('You (Editor) fix a typo', once(() => edit('you', true, 'You fixed a typo')), { group: docGroup });
  ui.button('Yaw (Commenter) tries to edit', once(() => edit('yaw', false, 'Yaw tried to edit')), { group: docGroup });
  async function edit(who, allowed, what) {
    const route = who === 'you' ? ['you', 'router', 'isp', 'hub', 'cloud'] : [who, 'cloud'];
    if (who === 'you') setScreen('you', 'doc');
    const p = packet('data', NODES[who].color);
    await send(p, route);
    if (!allowed) {
      await stage.tween((k) => p.scale.setScalar(1 - k), 0.4);
      drop(p);
      ui.complete('blocked');
      ui.info('🚫 Not allowed', '<p>Yaw is a <b>Commenter</b>. Commenters can add digital sticky notes but cannot change the text. The three access levels are <b>Viewer</b> (read only), <b>Commenter</b> and <b>Editor</b>.</p><p>Sharing law: give people the <b>lowest</b> access they need.</p>');
      return;
    }
    drop(p);
    history.push(what);
    // Each save adds a printed page to the version-history stack.
    const n = history.length;
    const plate = rbox(1, 0.08, 0.7, 0xffffff, 0.02);
    plate.position.set((n % 2) * 0.06, 0.04 + (n - 1) * 0.11, 0);
    plate.rotation.y = (n % 3 - 1) * 0.06;
    const top = decal(0.9, 0.6, (c, W, H) => {
      c.fillStyle = hex(NODES[who].color);
      c.beginPath(); c.roundRect(W * 0.04, H * 0.08, W * 0.3, H * 0.36, 10); c.fill();
      c.fillStyle = '#ffffff';
      c.font = font(H * 0.24);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(`v${n}`, W * 0.19, H * 0.27);
      c.fillStyle = '#9b91a4';
      [0.55, 0.68, 0.81].forEach((y, k) => c.fillRect(W * 0.04, H * y, W * (k === 2 ? 0.5 : 0.9), H * 0.05));
      c.fillRect(W * 0.4, H * 0.14, W * 0.5, H * 0.06);
      c.fillRect(W * 0.4, H * 0.3, W * 0.36, H * 0.06);
    }, { px: 96 });
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.042;
    plate.add(top);
    histGroup.add(plate);
    histTag.position.y = 0.4 + history.length * 0.11;
    setLabel(histTag, `Version history: ${history.length}`);
    const others = ['ama', 'yaw'].filter((o) => o !== who);
    await Promise.all(others.map((o) => {
      const q = packet('data', NODES[who].color);
      return send(q, ['cloud', o]).then(() => drop(q));
    }));
    ui.complete('cloud-edit');
    ui.info('☁️ Saved to the cloud', `<p><b>${what}.</b> Everyone sees the change within seconds — no emailing files back and forth.</p><p><b>Version history</b> keeps every save (${history.map((h, i) => `v${i + 1}`).join(', ')}), so mistakes can be undone. That is the ultimate safety net.</p>`);
  }

  ui.info('The internet: a road network of computers', '<p>Click any building to learn what it does, then send some traffic using the buttons. Drag to look around.</p>');
}

export const config = { camera: [0, 13, 14], target: [0.5, 0, -0.5], shadowSize: 14, maxDistance: 35, frame: 1.2 };

export const missions = [
  { id: 'globe', text: 'Click the blue globe called "The Internet".', hint: 'The internet is like a road network that joins computers together.' },
  { id: 'https', text: 'Visit a website that has a padlock 🔒.', hint: 'Watch what the snooper sees: only scrambled letters!' },
  { id: 'http', text: 'Visit the website with the ⚠️ warning sign.', hint: 'No padlock means anyone on the network can read what you send.' },
  { id: 'email-cc', text: 'Send an email to Kofi with your teacher in Cc.', hint: 'Count the envelopes when they reach the friend\'s mail server.' },
  { id: 'cloud-edit', text: 'Make an edit to the shared document.', hint: 'Use "Ama (Editor) adds a paragraph" or "You fix a typo".' },
  { id: 'blocked', text: 'Let Yaw (a Commenter) try to edit.', hint: 'What happens to Yaw\'s change? Why?' },
];
