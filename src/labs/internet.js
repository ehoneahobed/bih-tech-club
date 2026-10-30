// Sessions 11, 13 & 29 — The internet as a road network. Send web requests
// (HTTP vs HTTPS), follow an email through the digital post office, and watch
// classmates edit a shared document in the cloud.
//
// Session 11 also gets a "browser" mode: a big zoomed-in browser window with
// tabs, the bookmark star and a download that lands in the Downloads folder,
// with its own three missions. The mode is chosen from the page: a
// data-mode="browser" (or "town") attribute on the lab wins; otherwise the
// session number on the page (the path list's data-path, or the URL) decides.
// Sessions 13 and 29 keep the original town and its six missions.
import { THREE, COLORS, box, rbox, mat, decal, cable, label, setLabel } from './runtime.js';

function pageSession() {
  if (typeof document === 'undefined') return 0;
  const v = document.querySelector('.lab[data-lab="internet"]')?.dataset.session ?? document.querySelector('[data-path]')?.dataset.path ?? (location.pathname.match(/sessions\/(\d+)/) || [])[1];
  return Number(v) || 0;
}
function pageMode() {
  const m = typeof document !== 'undefined' ? document.querySelector('.lab[data-lab="internet"]')?.dataset.mode : undefined;
  if (m === 'browser' || m === 'town') return m;
  return pageSession() === 11 ? 'browser' : 'town';
}
const BROWSER_MODE = pageMode() === 'browser';

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
// In browser mode the browser's own parts come first, so only three places keep a card.
const CALLOUTS_BROWSER = {
  you: ['💻', 'Your computer', 'Every request starts here', [0, 1.3, 0], 60, 110],
  hub: ['🌍', 'The Internet', 'Pages travel to you across it', [0.6, 2.4, 0], 150, -60],
};
const NODE_CARDS = BROWSER_MODE ? CALLOUTS_BROWSER : CALLOUTS;
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

// ---------- Session 11: the browser, zoomed in ----------
// The pages the browser can open in this lab (the same sites as the workbook's circuit).
const PAGES = {
  wiki: { key: 'wiki', url: 'en.wikipedia.org', title: 'Wikipedia', short: 'Wikipedia', secure: true, kind: 'wiki', fav: '#24182e' },
  kakum: { key: 'kakum', url: 'en.wikipedia.org/wiki/Kakum_National_Park', title: 'Kakum National Park', short: 'Kakum', secure: true, kind: 'kakum', fav: '#24182e' },
  ges: { key: 'ges', url: 'ges.gov.gh', title: 'Ghana Education Service', short: 'GES', secure: true, kind: 'site', fav: '#2a7d4f', band: '#2a7d4f' },
  ug: { key: 'ug', url: 'www.ug.edu.gh', title: 'University of Ghana', short: 'UG', secure: true, kind: 'site', fav: '#1d3d8f', band: '#1d3d8f' },
};
const PHOTO = 'Kakum_Photo_Ama.jpg';
const BIG_POS = [-5.2, 0, -0.9];
const DL_POS = [-9.3, 0, 3.4];

function star(g, x, y, r, filled) {
  g.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.lineWidth = 3;
  g.strokeStyle = filled ? '#8a5c00' : '#24182e';
  if (filled) { g.fillStyle = '#ffbe00'; g.fill(); }
  g.stroke();
}
function kakumPicture(g, x, y, w, h) {
  const sky = g.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#bfe3f2');
  sky.addColorStop(1, '#eaf6fb');
  g.fillStyle = sky;
  g.fillRect(x, y, w, h);
  // The forest canopy, with the rope walkway strung between the tree tops.
  for (let k = 0; k < 9; k++) {
    g.fillStyle = ['#2a7d4f', '#3b9a5f', '#21653f'][k % 3];
    g.beginPath(); g.arc(x + w * (0.05 + k * 0.115), y + h * (0.72 + (k % 2) * 0.06), w * 0.09, 0, 7); g.fill();
  }
  g.fillStyle = '#1b4d31';
  g.fillRect(x, y + h * 0.86, w, h * 0.14);
  g.strokeStyle = '#8a5c00';
  g.lineWidth = 4;
  for (const dy of [0, 0.07]) {
    g.beginPath();
    g.moveTo(x + w * 0.04, y + h * (0.44 + dy));
    g.quadraticCurveTo(x + w * 0.27, y + h * (0.58 + dy), x + w * 0.5, y + h * (0.42 + dy));
    g.quadraticCurveTo(x + w * 0.73, y + h * (0.56 + dy), x + w * 0.96, y + h * (0.4 + dy));
    g.stroke();
  }
  g.fillStyle = '#5a3d1e';
  for (const fx of [0.04, 0.5, 0.96]) g.fillRect(x + w * fx - 5, y + h * 0.36, 10, h * 0.36);
}
// Cut text to fit a width, with "…" (canvas maxWidth would squash it instead).
function fit(g, s, w) {
  if (g.measureText(s).width <= w) return s;
  while (s.length > 1 && g.measureText(s + '…').width > w) s = s.slice(0, -1);
  return s + '…';
}
// The browser is drawn on a 600 × 360 grid, scaled to the canvas, with big
// type so it can be read on a projector and a phone.
function drawBrowser(g, W, H, st) {
  const F = (px, w = 600) => `${w} ${px}px Rubik, system-ui, sans-serif`;
  const t = st.tabs[st.active];
  g.save();
  g.scale(W / 600, H / 360);
  W = 600;
  H = 360;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.lineCap = 'round';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  // Tab strip.
  g.fillStyle = '#24182e';
  g.fillRect(0, 0, W, 44);
  const n = st.tabs.length;
  const tw = Math.min(150, (W - 110) / Math.max(n, 1));
  st.tabs.forEach((tab, i) => {
    const x = 6 + i * tw;
    const on = i === st.active;
    g.fillStyle = on ? '#ffffff' : '#4a3a5e';
    g.beginPath(); g.roundRect(x, 7, tw - 4, 37, [9, 9, 0, 0]); g.fill();
    g.fillStyle = tab.fav;
    g.beginPath(); g.arc(x + 14, 26, 6, 0, 7); g.fill();
    g.fillStyle = on ? '#24182e' : '#f1ecf4';
    g.font = F(15, on ? 700 : 500);
    g.fillText(fit(g, tab.loading ? 'Loading…' : tab.title, tw - 46), x + 25, 27);
    g.font = F(17, 500);
    g.fillText('×', x + tw - 19, 26);
  });
  g.fillStyle = '#f1ecf4';
  g.font = F(26, 500);
  g.fillText('+', 12 + n * tw, 25);
  g.font = F(15, 500);
  ['—', '□', '×'].forEach((c, k) => g.fillText(c, W - 66 + k * 22, 22));
  // Toolbar: Back, Forward, Refresh, address bar with the star, downloads, menu.
  g.fillStyle = '#24182e';
  g.font = F(20, 700);
  ['←', '→', '↻'].forEach((c, k) => g.fillText(c, 9 + k * 26, 66));
  const ax = 86;
  const aw = W - ax - 72;
  g.fillStyle = '#efeaf2';
  g.beginPath(); g.roundRect(ax, 51, aw, 30, 15); g.fill();
  if (t.url) padlock(g, ax + 16, 67, 18, t.secure);
  g.fillStyle = t.secure === false ? '#ca1f3f' : '#24182e';
  g.font = F(15, 600);
  g.fillText(fit(g, t.url ? `${t.secure === false ? 'Not secure · ' : ''}${t.url}` : 'Search or type a web address', aw - 70), ax + 32, 67);
  star(g, ax + aw - 17, 66, 10.5, st.starred);
  const dx = W - 52;
  g.strokeStyle = st.dl ? '#2a9d8f' : '#24182e';
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(dx, 55); g.lineTo(dx, 72); g.moveTo(dx - 7, 65); g.lineTo(dx, 72); g.lineTo(dx + 7, 65); g.moveTo(dx - 9, 78); g.lineTo(dx + 9, 78); g.stroke();
  if (st.dl === 'done') { g.fillStyle = '#2ec4b6'; g.beginPath(); g.arc(dx + 9, 55, 5, 0, 7); g.fill(); }
  g.fillStyle = '#24182e';
  g.font = F(20, 700);
  g.fillText('⋮', W - 22, 66);
  // Bookmarks bar.
  g.fillStyle = '#f4f0f6';
  g.fillRect(0, 88, W, 28);
  if (st.bar.length) {
    let x = 8;
    g.font = F(14, 700);
    for (const name of st.bar) {
      const w = g.measureText(name).width + 34;
      g.fillStyle = '#ffffff';
      g.beginPath(); g.roundRect(x, 92, w, 20, 10); g.fill();
      star(g, x + 12, 102, 6, true);
      g.fillStyle = '#24182e';
      g.fillText(name, x + 23, 103);
      x += w + 6;
    }
  } else {
    g.fillStyle = '#857a90';
    g.font = F(13, 500);
    g.fillText('Bookmarks bar: empty. Press ☆ (Ctrl + D) to keep a page here.', 10, 103);
  }
  g.fillStyle = '#d9d3de';
  g.fillRect(0, 116, W, 1.5);
  // The page itself.
  const top = 118;
  const line = (x, y, w) => g.fillRect(x, y, w, 7);
  if (t.loading) {
    g.textAlign = 'center';
    g.fillStyle = '#857a90';
    g.font = F(19, 600);
    g.fillText('Fetching the page from its web server…', W / 2, 220);
    g.textAlign = 'left';
  } else if (t.kind === 'wiki') {
    g.textAlign = 'center';
    g.fillStyle = '#e6e1ea';
    g.beginPath(); g.arc(W / 2, top + 58, 36, 0, 7); g.fill();
    g.strokeStyle = '#9b91a4';
    g.lineWidth = 1.5;
    for (let k = 0; k <= 2; k++) { g.beginPath(); g.ellipse(W / 2, top + 58, k * 13 + 2, 36, 0, 0, 7); g.stroke(); }
    g.fillStyle = '#24182e';
    g.font = F(26, 500);
    g.fillText('WIKIPEDIA', W / 2, top + 120);
    g.font = F(14, 400);
    g.fillText('The Free Encyclopedia', W / 2, top + 144);
    g.strokeStyle = '#9b91a4';
    g.lineWidth = 2;
    g.beginPath(); g.roundRect(W / 2 - 160, top + 168, 320, 34, 6); g.stroke();
    g.fillStyle = '#857a90';
    g.font = F(15, 500);
    g.fillText('Search Wikipedia', W / 2, top + 186);
    g.textAlign = 'left';
  } else if (t.kind === 'kakum') {
    g.fillStyle = '#24182e';
    g.font = F(25, 500);
    g.fillText('Kakum National Park', 16, top + 26);
    g.fillStyle = '#5a4470';
    g.font = F(12, 400);
    g.fillText('From Wikipedia, the free encyclopedia', 16, top + 50);
    g.fillStyle = '#b7adc0';
    for (let k = 0; k < 7; k++) line(16, top + 70 + k * 22, k % 3 === 2 ? 180 : 300);
    const px = 340;
    const pw = 244;
    kakumPicture(g, px, top + 12, pw, 168);
    g.fillStyle = '#24182e';
    g.font = F(13, 600);
    g.fillText('The canopy walkway', px, top + 196);
    if (st.menu) {
      const mx = px + 40;
      const my = top + 50;
      g.fillStyle = '#ffffff';
      g.strokeStyle = '#5a4470';
      g.lineWidth = 1.5;
      g.beginPath(); g.roundRect(mx, my, 190, 96, 6); g.fill(); g.stroke();
      ['Open image in new tab', 'Save image as…', 'Copy image'].forEach((s, k) => {
        if (k === 1) { g.fillStyle = '#ffe9a6'; g.fillRect(mx + 3, my + 34, 184, 28); }
        g.fillStyle = '#24182e';
        g.font = F(14, k === 1 ? 700 : 500);
        g.fillText(s, mx + 12, my + 18 + k * 30);
      });
    }
  } else if (t.kind === 'blank') {
    g.textAlign = 'center';
    g.fillStyle = '#857a90';
    g.font = F(17, 500);
    g.fillText('New tab: type an address at the top', W / 2, 220);
    g.textAlign = 'left';
  } else {
    g.fillStyle = t.band ?? '#2a9d8f';
    g.fillRect(0, top, W, 56);
    g.fillStyle = '#ffffff';
    g.font = F(23, 700);
    g.fillText(fit(g, t.title, W - 32), 16, top + 29);
    g.fillStyle = '#e6e1ea';
    g.fillRect(16, top + 76, 170, 140);
    g.fillStyle = '#b7adc0';
    for (let k = 0; k < 6; k++) line(204, top + 80 + k * 24, k === 5 ? 200 : 370);
  }
  // Pop-ups: the bookmark box, the download bubble, the downloads list.
  if (st.dialog) {
    const bx = 300;
    const by = 84;
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#5a4470';
    g.lineWidth = 2;
    g.beginPath(); g.roundRect(bx, by, 290, 196, 10); g.fill(); g.stroke();
    g.fillStyle = '#24182e';
    g.font = F(18, 700);
    g.fillText('Bookmark added', bx + 14, by + 22);
    g.font = F(12, 700);
    g.fillStyle = '#5a4470';
    g.fillText('Name', bx + 14, by + 48);
    g.fillText('Folder', bx + 14, by + 102);
    for (const [y, v] of [[by + 58, st.dialog.name], [by + 112, st.dialog.bar ? 'Bookmarks bar' : 'Other bookmarks']]) {
      g.strokeStyle = '#9b91a4';
      g.lineWidth = 1.5;
      g.beginPath(); g.roundRect(bx + 14, y, 262, 30, 5); g.stroke();
      g.fillStyle = '#24182e';
      g.font = F(15, 600);
      g.fillText(fit(g, v, 230), bx + 24, y + 16);
    }
    g.fillText('▾', bx + 258, by + 128);
    g.fillStyle = '#5a4470';
    g.beginPath(); g.roundRect(bx + 196, by + 156, 80, 28, 14); g.fill();
    g.fillStyle = '#ffffff';
    g.font = F(14, 700);
    g.textAlign = 'center';
    g.fillText('Done', bx + 236, by + 171);
    g.textAlign = 'left';
  }
  if (st.bubble && st.dl) {
    const bx = 300;
    const by = 84;
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#5a4470';
    g.lineWidth = 2;
    g.beginPath(); g.roundRect(bx, by, 290, 84, 10); g.fill(); g.stroke();
    kakumPicture(g, bx + 12, by + 14, 64, 48);
    g.fillStyle = '#24182e';
    g.font = F(14, 700);
    g.fillText(fit(g, PHOTO, 196), bx + 86, by + 22);
    g.font = F(13, 500);
    g.fillStyle = '#5a4470';
    g.fillText(st.dl === 'done' ? '240 KB · Done' : 'Saving…', bx + 86, by + 44);
    g.fillStyle = '#1d4ed8';
    g.fillText('Show in folder', bx + 86, by + 66);
  }
  if (st.list) {
    g.fillStyle = 'rgba(36,24,46,0.35)';
    g.fillRect(0, 117, W, H - 117);
    const bx = 70;
    const by = 134;
    g.fillStyle = '#ffffff';
    g.beginPath(); g.roundRect(bx, by, 460, 206, 10); g.fill();
    g.fillStyle = '#24182e';
    g.font = F(20, 700);
    g.fillText('Downloads (Ctrl + J)', bx + 18, by + 26);
    g.fillStyle = '#efeaf2';
    g.beginPath(); g.roundRect(bx + 16, by + 50, 428, 92, 8); g.fill();
    kakumPicture(g, bx + 28, by + 62, 88, 68);
    g.fillStyle = '#24182e';
    g.font = F(16, 700);
    g.fillText(PHOTO, bx + 130, by + 74);
    g.font = F(13, 500);
    g.fillStyle = '#5a4470';
    g.fillText('240 KB · in This PC › Downloads', bx + 130, by + 98);
    g.fillStyle = '#1d4ed8';
    g.fillText('Show in folder', bx + 130, by + 122);
    g.fillStyle = '#5a4470';
    g.font = F(13, 500);
    g.fillText('Next: rename it and move it into BIH_TechClub.', bx + 18, by + 176);
  }
  g.restore();
}

function buildBrowser(stage, ui, scene) {
  const st = { tabs: [{ ...PAGES.wiki }], active: 0, bar: [], starred: false, dialog: null, dl: null, bubble: false, list: false, menu: false };
  const bookmarks = new Map(); // url -> { name, bar }
  const closed = []; // closed tabs, newest last: { tab, index }
  const did = { opened: 0, switched: false, closed: false, reopened: false };
  const found = { list: false, folder: false };

  // The big screen: your computer's browser, zoomed in.
  const big = new THREE.Group();
  big.position.set(...BIG_POS);
  big.rotation.y = 0.12;
  const foot = rbox(2.2, 0.1, 1.2, 0x5a4470, 0.04);
  foot.position.y = 0.05;
  const neck = rbox(0.3, 1.5, 0.16, 0x5a4470, 0.05);
  neck.position.set(0, 0.8, -0.2);
  const tilt = new THREE.Group();
  tilt.position.set(0, 1.45, 0);
  tilt.rotation.x = -0.72;
  const bezel = rbox(6.5, 4.0, 0.18, 0x24182e, 0.08);
  bezel.position.y = 2.0;
  const screen = decal(6.25, 3.75, (g, W, H) => drawBrowser(g, W, H, st), { px: 720, transparent: false });
  screen.position.set(0, 2.0, 0.092);
  tilt.add(bezel, screen);
  big.add(foot, neck, tilt);
  scene.add(big);
  const bigTag = label('🔍 Your browser, zoomed in', { scale: 0.6 });
  bigTag.position.set(0, 0.3, 1.2);
  big.add(bigTag);

  // The Downloads folder next to your computer.
  const folder = new THREE.Group();
  folder.position.set(...DL_POS);
  folder.rotation.y = 0.35;
  const back = rbox(1.5, 1.05, 0.06, 0xe0a93a, 0.03);
  back.position.set(0, 0.6, -0.12);
  back.rotation.x = -0.12;
  const tab = rbox(0.55, 0.18, 0.06, 0xe0a93a, 0.03);
  tab.position.set(-0.42, 1.16, -0.19);
  tab.rotation.x = -0.12;
  const front = rbox(1.5, 0.78, 0.06, 0xf2c75c, 0.03);
  front.position.set(0, 0.42, 0.06);
  front.rotation.x = 0.1;
  const sign = decal(1.3, 0.5, (g, W, H) => {
    g.fillStyle = '#24182e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = font(H * 0.36);
    g.fillText('Downloads', W / 2, H * 0.42);
    g.font = font(H * 0.18, 500);
    g.fillText('This PC › Downloads', W / 2, H * 0.78);
  }, { px: 128 });
  sign.position.set(0, 0.44, 0.095);
  sign.rotation.x = 0.1;
  // The saved picture, hidden until it is downloaded.
  const file = new THREE.Group();
  const card = rbox(0.62, 0.46, 0.03, 0xffffff, 0.015);
  const photo = decal(0.54, 0.38, (g, W, H) => kakumPicture(g, 0, 0, W, H), { px: 96, transparent: false });
  photo.position.z = 0.017;
  file.add(card, photo);
  file.visible = false;
  file.position.set(0.1, 0.72, -0.03);
  folder.add(back, tab, file, front, sign);
  scene.add(folder);
  const fileTag = label('', { scale: 0.5 });
  fileTag.position.set(0, 1.75, 0);
  fileTag.visible = false;
  folder.add(fileTag);

  // Cards first: these are the browser parts the session is about.
  const cards = {
    tabs: stage.callout(screen, { icon: '🗂️', title: 'Tabs', text: 'One web page in each tab', at: [-2.5, 1.62, 0], dx: -60, dy: -80, onClick: () => explain('tabs') }),
    star: stage.callout(screen, { icon: '⭐', title: 'Bookmark star', text: 'Keeps a page to come back to', at: [2.05, 1.13, 0], dx: 120, dy: -90, onClick: () => explain('star') }),
    folder: stage.callout(folder, { icon: '📁', title: 'Downloads', text: 'Saved files land in this folder', at: [0, 1.1, 0], dx: -20, dy: 110, onClick: () => explain('folder') }),
  };
  const ABOUT = {
    tabs: ['🗂️ Tabs', '<p>A <b>tab</b> holds one web page. Open several to keep pages side by side in one window, and click a tab (or press <b>Ctrl + Tab</b>) to switch.</p><p><b>Ctrl + T</b> new tab · <b>Ctrl + W</b> close · <b>Ctrl + Shift + T</b> bring back the last tab you closed.</p>'],
    star: ['⭐ The bookmark star', '<p>Press the <b>star ☆</b> at the end of the address bar (or <b>Ctrl + D</b>) to keep a page you want to come back to. Edge calls bookmarks <b>Favourites</b>.</p><p>Put it on the <b>bookmarks bar</b> (<b>Ctrl + Shift + B</b> shows the bar) and it is one click away.</p>'],
    folder: ['📁 The Downloads folder', '<p>Unless you choose another place, files you save from the web land in <b>This PC › Downloads</b>.</p><p>Find them with <b>Ctrl + J</b> in the browser, or in <b>File Explorer</b> (<b>Win + E</b>) › Downloads. Then rename and move them into a proper folder.</p>'],
  };
  function explain(k) { ui.info(...ABOUT[k]); }
  stage.clickable(big, () => explain('tabs'));
  stage.clickable(folder, () => (st.dl === 'done' ? openFolder() : explain('folder')));

  let api = null;
  function redraw() {
    const c = screen.material.map.image;
    const t = st.tabs[st.active];
    st.starred = bookmarks.has(t.url);
    drawBrowser(c.getContext('2d'), c.width, c.height, st);
    screen.material.map.needsUpdate = true;
    if (api && !t.loading) api.setScreen('you', 'browser', t.url || 'New tab', t.url ? t.secure : null);
  }
  const page = () => st.tabs[st.active];
  const tick = (on) => (on ? '✅' : '⬜');
  // Fetch the active tab's page from the web server (a quick trip there and back).
  async function fetchPage() {
    const t = page();
    t.loading = true;
    redraw();
    const req = api.packet('data', COLORS.green, 'lock');
    await api.send(req, ['you', 'router', 'isp', 'hub', 'web'], 0.22);
    api.drop(req);
    const back = api.packet('data', COLORS.blue);
    await api.send(back, ['web', 'hub', 'isp', 'router', 'you'], 0.22);
    api.drop(back);
    t.loading = false;
    redraw();
  }
  function tabsReport(head, html) {
    const all = did.opened >= 2 && did.switched && did.closed && did.reopened;
    if (all) ui.complete('tabs');
    ui.info(head, `${html}<p>${tick(did.opened >= 2)} Open two new tabs (${Math.min(did.opened, 2)}/2)<br>${tick(did.switched)} Switch tabs<br>${tick(did.closed)} Close a tab<br>${tick(did.reopened)} Bring it back</p>${all ? '<p>🏆 <b>Tab juggling done!</b> Next: open the Kakum page in the Wikipedia tab and bookmark it.</p>' : ''}`);
  }
  function closePopups() {
    st.dialog = null;
    st.list = false;
    st.bubble = false;
    st.menu = false;
    dialogGroup.hidden = true;
  }

  async function newTab() {
    if (st.tabs.length >= 4) return tabsReport('🗂️ Plenty of tabs', '<p>Four tabs is plenty for now. Too many tabs make a slow computer slower: close the ones you are not using (<b>Ctrl + W</b>).</p>');
    closePopups();
    const next = ['ges', 'ug'].find((k) => !st.tabs.some((x) => x.key === k));
    st.tabs.push(next ? { ...PAGES[next] } : { key: 'blank', url: '', title: 'New tab', kind: 'blank', fav: '#9b91a4', secure: null });
    st.active = st.tabs.length - 1;
    did.opened++;
    redraw();
    const t = page();
    if (t.url) {
      ui.info('➕ New tab (Ctrl + T)', `<p>A new tab opened and you typed <b>${t.url}</b> in the address bar. Watch the request travel to the web server and the page come back.</p>`);
      await fetchPage();
    }
    tabsReport('➕ New tab (Ctrl + T)', `<p>${t.url ? `<b>${t.title}</b> opened in its own tab. Your other pages are still open in the other tabs.` : 'An empty new tab. In a real browser you would type an address at the top.'}</p>`);
  }
  function switchTab() {
    if (st.tabs.length < 2) return tabsReport('⇥ Only one tab', '<p>There is only one tab open. Open another with <b>Ctrl + T</b> first, then switch.</p>');
    closePopups();
    st.active = (st.active + 1) % st.tabs.length;
    did.switched = true;
    redraw();
    tabsReport('⇥ Switch tab (Ctrl + Tab)', `<p>Now showing <b>${page().title}</b>. <b>Ctrl + Tab</b> moves to the next tab; clicking a tab works too.</p>`);
  }
  function closeTab() {
    if (st.tabs.length < 2) return tabsReport('✖ Your last tab', '<p>This is your last tab: closing it would close the whole browser window. Open another tab first.</p>');
    closePopups();
    const [tab] = st.tabs.splice(st.active, 1);
    closed.push({ tab, index: st.active });
    st.active = Math.min(st.active, st.tabs.length - 1);
    did.closed = true;
    redraw();
    tabsReport('✖ Close tab (Ctrl + W)', `<p>You closed <b>${tab.title}</b>. Closed by mistake? Don't panic: <b>Ctrl + Shift + T</b> brings it back.</p>`);
  }
  function reopenTab() {
    if (!closed.length) return tabsReport('↩ Nothing to bring back', '<p>You have not closed a tab yet. Close one with <b>Ctrl + W</b>, then bring it back.</p>');
    closePopups();
    const { tab, index } = closed.pop();
    st.tabs.splice(Math.min(index, st.tabs.length), 0, tab);
    st.active = st.tabs.indexOf(tab);
    did.reopened = true;
    redraw();
    tabsReport('↩ Reopen tab (Ctrl + Shift + T)', `<p><b>${tab.title}</b> is back, just as it was. This is the shortcut to remember when you close a tab by mistake.</p>`);
  }

  async function openKakum() {
    const t = page();
    if (t.key === 'kakum') return ui.info('🌳 Already here', '<p>The Kakum National Park page is open in this tab. Now press the <b>star ☆</b> to bookmark it, or save its picture.</p>');
    if (t.key !== 'wiki') return ui.info('🔎 Wrong tab', `<p>This tab shows <b>${t.title || 'an empty page'}</b>. Switch to the <b>Wikipedia</b> tab first (<b>Ctrl + Tab</b>), then search Wikipedia for Kakum.</p>`);
    closePopups();
    Object.assign(t, PAGES.kakum);
    ui.info('🔎 Searching Wikipedia…', '<p>You typed <b>Kakum National Park</b> in Wikipedia\'s search box. The request travels to the web server…</p>');
    await fetchPage();
    ui.info('🌳 Kakum National Park', '<p>The page arrived: Kakum is in the Central Region of Ghana and is famous for its <b>canopy walkway</b> high in the trees.</p><p>Next: keep this page with the <b>star ☆</b> (Ctrl + D), and save its picture.</p>');
  }

  // ---------- Bookmarks ----------
  function bookmark() {
    const t = page();
    if (!t.url || t.loading) return ui.info('☆ Nothing to bookmark', '<p>Open a web page in this tab first.</p>');
    st.list = st.bubble = st.menu = false;
    const had = bookmarks.get(t.url);
    // Like Chrome: the star fills at once and a box lets you change the name and folder.
    const b = had ?? { name: t.key === 'kakum' ? 'Kakum National Park - Wikipedia' : t.title, bar: false };
    bookmarks.set(t.url, b);
    st.dialog = { name: b.name, bar: b.bar };
    dialogGroup.hidden = false;
    nameBtn.textContent = `✏️ Name it "${t.short} - Club"`;
    folderLabel();
    redraw();
    stage.reveal();
    ui.info('⭐ Bookmark added (Ctrl + D)', `<p>The star turned gold: <b>${t.title}</b> is bookmarked. Before you press <b>Done</b>, check the box:</p><ul><li><b>Name:</b> short and clear, e.g. "${t.short} - Club".</li><li><b>Folder:</b> it says <b>${b.bar ? 'Bookmarks bar' : 'Other bookmarks'}</b>. ${b.bar ? 'Good: it will show just under the address bar.' : 'Choose the <b>bookmarks bar</b> so it is one click away (Edge: Favourites bar).'}</li></ul>`);
  }
  function rename() {
    if (!st.dialog) return;
    st.dialog.name = `${page().short} - Club`;
    redraw();
    ui.info('✏️ Name changed', `<p>The bookmark is now called <b>${st.dialog.name}</b>: short, so it fits on the bar, and easy to spot.</p>`);
  }
  const folderLabel = () => (folderBtn.textContent = `📁 Change folder (now: ${st.dialog?.bar ? 'Bookmarks bar' : 'Other bookmarks'})`);
  function toggleFolder() {
    if (!st.dialog) return;
    st.dialog.bar = !st.dialog.bar;
    folderLabel();
    redraw();
    ui.info('📁 Folder', `<p>Folder: <b>${st.dialog.bar ? 'Bookmarks bar' : 'Other bookmarks'}</b>. ${st.dialog.bar ? 'It will sit on the bar under the address bar.' : 'It is saved, but hidden away in a menu.'}</p>`);
  }
  function done() {
    if (!st.dialog) return;
    const t = page();
    const b = bookmarks.get(t.url);
    Object.assign(b, st.dialog);
    st.dialog = null;
    dialogGroup.hidden = true;
    st.bar = [...bookmarks.values()].filter((x) => x.bar).map((x) => x.name);
    redraw();
    const good = t.key === 'kakum' && b.name === 'Kakum - Club' && b.bar;
    if (good) {
      ui.complete('bookmark');
      cards.star.card.classList.add('done');
      ui.info('⭐ Kakum - Club is on the bar!', '<p>Your bookmark sits on the <b>bookmarks bar</b>, one click away. Bookmarks stay even in a private window and after you close the browser.</p><p>Forgot to bookmark a page? <b>Ctrl + H</b> (History) lists every page you visited.</p>');
    } else if (t.key !== 'kakum') {
      ui.info('⭐ Saved', `<p><b>${b.name}</b> is bookmarked${b.bar ? ' on the bar' : ''}. For the mission, bookmark the <b>Kakum National Park</b> page (in the Wikipedia tab).</p>`);
    } else {
      ui.info('⭐ Saved, but check it', `<p>The bookmark is saved as <b>${b.name}</b> in <b>${b.bar ? 'the bookmarks bar' : 'Other bookmarks'}</b>.</p><p>${b.name !== 'Kakum - Club' ? 'Rename it to <b>Kakum - Club</b>. ' : ''}${b.bar ? '' : 'Put it on the <b>bookmarks bar</b> so it is easy to find. '}Press the star ☆ again to edit it.</p>`);
    }
  }

  // ---------- Downloads ----------
  async function saveImage() {
    const t = page();
    if (t.key !== 'kakum' || t.loading) return ui.info('🖼️ Which picture?', '<p>The park picture is on the <b>Kakum National Park</b> page. Open it in the Wikipedia tab first.</p>');
    if (st.dl === 'done') {
      st.bubble = true;
      redraw();
      return ui.info('🖼️ Already saved', `<p><b>${PHOTO}</b> is already in Downloads. Saving it again would make a copy called <b>Kakum_Photo_Ama (1).jpg</b>, which is how Downloads fills up with copies!</p>`);
    }
    st.dialog = null;
    dialogGroup.hidden = true;
    st.menu = true;
    redraw();
    stage.reveal();
    ui.info('🖼️ Right-click › Save image as…', `<p>You right-clicked the picture and chose <b>Save image as…</b>, then named it <b>${PHOTO}</b> (the circuit's <i>Kakum_Photo_YourName</i>).</p><p>The browser now copies the file from the web server onto your PC…</p>`);
    await stage.wait(0.9);
    st.menu = false;
    st.dl = 'saving';
    st.bubble = true;
    redraw();
    const p = api.packet('data', COLORS.green, 'pic');
    await api.send(p, ['web', 'hub', 'isp', 'router', 'you'], 0.3);
    // Last hop: from your computer into the Downloads folder.
    const a = p.position.clone();
    const b = folder.localToWorld(new THREE.Vector3(0.1, 1.0, -0.03));
    await stage.tween((k) => {
      p.position.lerpVectors(a, b, k);
      p.position.y += Math.sin(k * Math.PI) * 0.8;
      p.scale.setScalar(1 - k * 0.5);
    }, 0.7);
    api.drop(p);
    file.visible = true;
    file.position.y = 1.2;
    await stage.tween((k) => (file.position.y = 1.2 - k * 0.48), 0.4);
    st.dl = 'done';
    redraw();
    ui.info('📥 Saved in Downloads', `<p><b>${PHOTO}</b> landed in the <b>Downloads</b> folder (see the yellow folder by your computer).</p><p>Now find it two ways: the browser's downloads list (<b>Ctrl + J</b>) and <b>File Explorer › Downloads</b>.</p>`);
  }
  function dlReport(head, html) {
    const all = st.dl === 'done' && found.list && found.folder;
    if (all) {
      ui.complete('download');
      cards.folder.card.classList.add('done');
    }
    ui.info(head, `${html}<p>${tick(st.dl === 'done')} Save the picture<br>${tick(found.list)} Find it with Ctrl + J<br>${tick(found.folder)} Find it in File Explorer › Downloads</p>${all ? '<p>🏆 <b>Found it twice!</b> Last step in real life: rename it and move it into your <b>BIH_TechClub</b> folder (Session 4).</p>' : ''}`);
  }
  function showList() {
    if (st.dl !== 'done') return ui.info('📥 Downloads list (Ctrl + J)', '<p>The list is empty: you have not saved anything yet. Save the park picture first.</p>');
    st.dialog = null;
    dialogGroup.hidden = true;
    st.bubble = st.menu = false;
    st.list = !st.list;
    found.list = true;
    redraw();
    stage.reveal();
    dlReport('📥 Downloads list (Ctrl + J)', `<p>${st.list ? `The list shows <b>${PHOTO}</b> and where it went: <b>This PC › Downloads</b>. "Show in folder" opens that folder.` : 'List closed. Press Ctrl + J again to open it.'}</p>`);
  }
  let lifted = false;
  async function openFolder() {
    if (st.dl !== 'done') return ui.info('📁 File Explorer › Downloads', '<p>The Downloads folder is empty for now. Save the park picture first, then come back.</p>');
    found.folder = true;
    stage.reveal();
    fileTag.visible = true;
    setLabel(fileTag, `This PC › Downloads › ${PHOTO}`);
    if (!lifted) {
      lifted = true;
      await stage.tween((k) => (file.position.y = 0.72 + Math.sin(k * Math.PI) * 0.5), 0.9);
      lifted = false;
    }
    dlReport('📁 File Explorer › Downloads', `<p>You opened File Explorer (<b>Win + E</b>), clicked <b>Downloads</b> on the left, and there is <b>${PHOTO}</b>.</p>`);
  }

  // ---------- Side panel ----------
  let dialogGroup, nameBtn, folderBtn;
  function controls(a) {
    api = a;
    const tabsG = ui.group('1 · Tabs');
    ui.button('➕ New tab · Ctrl + T', a.once(newTab), { group: tabsG });
    ui.button('⇥ Switch tab · Ctrl + Tab', a.once(async () => switchTab()), { group: tabsG });
    ui.button('✖ Close tab · Ctrl + W', a.once(async () => closeTab()), { group: tabsG });
    ui.button('↩ Reopen tab · Ctrl + Shift + T', a.once(async () => reopenTab()), { group: tabsG });
    const bmG = ui.group('2 · Bookmark the Kakum page');
    ui.button('🔎 Search Wikipedia: Kakum National Park', a.once(openKakum), { group: bmG });
    ui.button('☆ Bookmark this page · Ctrl + D', a.once(async () => bookmark()), { group: bmG });
    dialogGroup = ui.group('Bookmark box');
    dialogGroup.hidden = true;
    nameBtn = ui.button('✏️ Name it "Kakum - Club"', rename, { group: dialogGroup });
    folderBtn = ui.button('📁 Change folder', toggleFolder, { group: dialogGroup });
    ui.button('Done', done, { group: dialogGroup, primary: true });
    const dlG = ui.group('3 · Download a picture');
    ui.button('🖼️ Right-click the picture › Save image as…', a.once(saveImage), { group: dlG });
    ui.button('📥 Downloads list · Ctrl + J', a.once(async () => showList()), { group: dlG });
    ui.button('📁 File Explorer › Downloads', a.once(openFolder), { group: dlG });
    // Move the Bookmark box buttons up, next to the star button.
    bmG.after(dialogGroup);
    redraw();
    if (ui.isDone('bookmark')) cards.star.card.classList.add('done');
    if (ui.isDone('download')) cards.folder.card.classList.add('done');
  }
  // A website from the padlock buttons opens in the current tab.
  function show(site) {
    const t = page();
    const host = site.url.replace(/^https?:\/\//, '');
    const name = host.replace(/^www\./, '');
    Object.assign(t, { key: 'site', url: host, title: name, short: name.split('.')[0], secure: site.secure, kind: 'site', fav: site.secure ? '#2a9d8f' : '#ca1f3f', band: site.secure ? '#2a9d8f' : '#ca1f3f', loading: false });
    redraw();
  }
  function intro() {
    ui.info('🧭 Your browser, zoomed in', '<p>The big screen is the browser on <b>your computer</b>, zoomed in. Use the buttons to practise the Session 11 skills: <b>tabs</b>, the <b>bookmark star</b> and <b>downloads</b>.</p><p>Every page you open is fetched from a web server across the internet: watch the packets travel!</p>');
  }
  return { controls, show, intro };
}

export default function internetLab(stage, ui) {
  const { scene } = stage;
  const pos = (id) => new THREE.Vector3(...NODES[id].pos);
  // Session 11's browser missions are stored apart from the town's six.
  if (BROWSER_MODE) ui.missions('internet-browser', BROWSER_MISSIONS, () => stage.confetti());

  for (const [id, n] of Object.entries(NODES)) {
    // In browser mode the big screen stands where the school mail server is.
    if (BROWSER_MODE && id === 'mailA') continue;
    const g = new THREE.Group();
    g.position.copy(pos(id));
    if (n.kind === 'pc') pcModel(g, id, n);
    else if (n.kind === 'server') serverModel(g, id, n);
    else if (n.kind === 'router') routerModel(g);
    else if (n.kind === 'tower') towerModel(g);
    else if (n.kind === 'globe') globeModel(g, stage);
    else if (n.kind === 'cloud') cloudModel(g);
    // The main places get a callout card (below); the rest keep a small tag.
    if (!NODE_CARDS[id]) {
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
    if (id === 'hub' && !BROWSER_MODE) {
      ui.complete('globe');
      cards.hub.card.classList.add('done');
    }
  }
  // The browser's own cards go first (phones show only the first four).
  const browser = BROWSER_MODE ? buildBrowser(stage, ui, scene) : null;
  // Clicking a card does the same as clicking the place.
  const cards = {};
  for (const [id, [icon, title, text, at, dx, dy]] of Object.entries(NODE_CARDS)) {
    cards[id] = stage.callout(NODES[id].group, { icon, title, text, at, dx, dy, onClick: () => select(id) });
  }
  if (ui.isDone('globe')) cards.hub.card.classList.add('done');

  // Cables along the ground, with a gentle S-bend like a real cable run.
  for (const [a, b] of LINKS) {
    if (BROWSER_MODE && (a === 'mailA' || b === 'mailA')) continue;
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
      } else if (key.startsWith('pic')) {
        // A picture file: a photo of green hills and a sun.
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = '#bfe3f2';
        g.fillRect(14, 14, 100, 100);
        g.fillStyle = '#ffbe00';
        g.beginPath(); g.arc(86, 40, 12, 0, 7); g.fill();
        g.fillStyle = '#2a7d4f';
        g.beginPath(); g.moveTo(14, 114); g.lineTo(48, 58); g.lineTo(76, 96); g.lineTo(92, 78); g.lineTo(114, 114); g.fill();
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

  // ---------- Browser skills (Session 11 only) ----------
  browser?.controls({ send, packet, drop, once, setScreen });

  // ---------- Website ----------
  const webGroup = ui.group(BROWSER_MODE ? '4 · Visit a website: padlock or warning?' : '1 · Visit a website (Session 11)');
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
    browser?.show(site);
    ui.complete(site.secure ? 'https' : 'http');
    ui.info(site.url, `<p>✅ The web page arrived and your <b>browser</b> displayed it.</p><p>${site.secure ? 'The <b>padlock</b> means the data was <b>encrypted</b> (scrambled). The snooper only saw nonsense.' : '<b>No padlock:</b> the snooper on the network could read everything you sent. Never type passwords or personal details on an <code>http://</code> page.'}</p>`);
  }

  // ---------- Email ----------
  if (!BROWSER_MODE) {
    const mailGroup = ui.group('2 · Send an email (Session 13)');
    ui.button('✉️ To: Kofi', once(() => email(false)), { group: mailGroup });
    ui.button('✉️ To: Kofi · Cc: Teacher', once(() => email(true)), { group: mailGroup });
  }
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
  if (!BROWSER_MODE) histGroup.add(histTag);

  if (!BROWSER_MODE) {
    const docGroup = ui.group('3 · Edit a shared document (Session 29)');
    ui.button('Ama (Editor) adds a paragraph', once(() => edit('ama', true, 'Ama added a paragraph')), { group: docGroup });
    ui.button('You (Editor) fix a typo', once(() => edit('you', true, 'You fixed a typo')), { group: docGroup });
    ui.button('Yaw (Commenter) tries to edit', once(() => edit('yaw', false, 'Yaw tried to edit')), { group: docGroup });
  }
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

  if (BROWSER_MODE) browser.intro();
  else ui.info('The internet: a road network of computers', '<p>Click any building to learn what it does, then send some traffic using the buttons. Drag to look around.</p>');
}

const TOWN_CONFIG = { camera: [0, 13, 14], target: [0.5, 0, -0.5], shadowSize: 14, maxDistance: 35, frame: 1.2 };
const BROWSER_CONFIG = { camera: [-3.2, 14.6, 15.0], target: [-3.2, 1.6, 0.5], shadowSize: 15, maxDistance: 35, frame: 0.86 };
export const config = BROWSER_MODE ? BROWSER_CONFIG : TOWN_CONFIG;

const TOWN_MISSIONS = [
  { id: 'globe', text: 'Click the blue globe called "The Internet".', hint: 'The internet is like a road network that joins computers together.' },
  { id: 'https', text: 'Visit a website that has a padlock 🔒.', hint: 'Watch what the snooper sees: only scrambled letters!' },
  { id: 'http', text: 'Visit the website with the ⚠️ warning sign.', hint: 'No padlock means anyone on the network can read what you send.' },
  { id: 'email-cc', text: 'Send an email to Kofi with your teacher in Cc.', hint: 'Count the envelopes when they reach the friend\'s mail server.' },
  { id: 'cloud-edit', text: 'Make an edit to the shared document.', hint: 'Use "Ama (Editor) adds a paragraph" or "You fix a typo".' },
  { id: 'blocked', text: 'Let Yaw (a Commenter) try to edit.', hint: 'What happens to Yaw\'s change? Why?' },
];

// Session 11: browser skills.
const BROWSER_MISSIONS = [
  { id: 'tabs', text: 'Open two new tabs, switch between them, close one and bring it back.', hint: 'Ctrl + T opens, Ctrl + Tab switches, Ctrl + W closes, and Ctrl + Shift + T brings back the tab you closed.' },
  { id: 'bookmark', text: 'Bookmark the Kakum page with the star ☆: name it "Kakum - Club" and put it on the bookmarks bar.', hint: 'In the Wikipedia tab, open the Kakum page first. Then press ☆ (Ctrl + D), change the name and the folder, and press Done.' },
  { id: 'download', text: 'Save the park picture, then find it with Ctrl + J and in the Downloads folder.', hint: 'Right-click the picture on the Kakum page and choose Save image as… Then look for it in two places.' },
];
export const missions = BROWSER_MODE ? BROWSER_MISSIONS : TOWN_MISSIONS;
