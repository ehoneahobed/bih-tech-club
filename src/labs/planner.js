// Session 30 (and Skills Lab 4, Session 35) — Club Planner: the club
// noticeboard, meeting room and cupboard, moved online. Pupils schedule a
// club meeting on a wall calendar (title, date, time, reminder, guests) and
// watch Kofi, Esi and Yaw reply Yes / Maybe / No; run a mock video call whose
// tiles react to mute, camera, raise hand and share screen (with meeting
// manners: background noise, waiting your turn, never posting the link);
// and use the cloud cupboard: make a folder, upload, download, open it on a
// phone, read the sync icons and sign out of the shared PC.
import { THREE, COLORS, mat, rbox, decal, label, setLabel } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const YEAR = 2026;
const MONTH = 10; // November (0-based)
const DAYS = [9, 11, 13, 14, 16, 18];
const dayName = (d) => new Date(YEAR, MONTH, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const TIMES = [];
for (let h = 8; h <= 17; h++) for (const m of ['00', '30']) TIMES.push(`${String(h).padStart(2, '0')}:${m}`);
const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
const REMINDERS = { '': 'No reminder', '30m': '30 minutes before', '1d': '1 day before', both: '1 day before and 30 minutes before' };
const GUESTS = [
  { id: 'kofi', name: 'Kofi', email: 'kofi.club@example.com', reply: 'yes', shirt: COLORS.green, skin: 0x6b4226 },
  { id: 'esi', name: 'Esi', email: 'esi.club@example.com', reply: 'maybe', shirt: COLORS.gold, skin: 0x8d5a3b },
  { id: 'yaw', name: 'Yaw', email: 'yaw.club@example.com', reply: 'no', shirt: COLORS.red, skin: 0x5a3520 },
];
const REPLY = {
  yes: { word: 'YES', long: 'Yes (Accept)', mark: '✔', bg: '#2EC4B6', ink: '#24182E' },
  maybe: { word: 'MAYBE', long: 'Maybe (Tentative)', mark: '?', bg: '#FFBE00', ink: '#24182E' },
  no: { word: 'NO', long: 'No (Decline)', mark: '✕', bg: '#CA1F3F', ink: '#FFFFFF' },
};
const LINK = 'meet.google.com/abc-defg-hij';
const POSTER = 'TechClub_OpenDayPoster_AmaMensah.pdf';
const RULES = 'Club_Rules.pdf';
const NAME_RULE = /^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$/;

// Repaint a decal's canvas.
function redraw(mesh, draw) {
  const c = mesh.material.map.image;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  draw(g, c.width, c.height);
  mesh.material.map.needsUpdate = true;
}
// Text that shrinks to fit.
function fit(g, text, x, y, maxW, size, weight = 600, color) {
  let px = size;
  do g.font = `${weight} ${px}px ${FONT}`;
  while (g.measureText(text).width > maxW && (px -= 1) > 8);
  if (color) g.fillStyle = color;
  g.fillText(text, x, y);
}
function pill(g, x, y, w, h, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, h / 2);
  g.fill();
}

// ---------- Sync icons (the same three as OneDrive in File Explorer) ----------
function iconCloud(g, x, y, s) {
  g.save();
  g.strokeStyle = '#2B6CB0';
  g.lineWidth = s * 0.11;
  g.beginPath();
  g.arc(x - s * 0.18, y + s * 0.05, s * 0.2, Math.PI * 0.5, Math.PI * 1.5);
  g.arc(x + s * 0.02, y - s * 0.1, s * 0.25, Math.PI * 1.05, Math.PI * 1.95);
  g.arc(x + s * 0.24, y + s * 0.07, s * 0.18, Math.PI * 1.5, Math.PI * 0.5);
  g.closePath();
  g.stroke();
  g.restore();
}
function iconTick(g, x, y, s) {
  g.save();
  g.fillStyle = '#1E9E5A';
  g.beginPath();
  g.arc(x, y, s * 0.34, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#fff';
  g.lineWidth = s * 0.1;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - s * 0.16, y);
  g.lineTo(x - s * 0.04, y + s * 0.12);
  g.lineTo(x + s * 0.17, y - s * 0.12);
  g.stroke();
  g.restore();
}
function iconSync(g, x, y, s) {
  g.save();
  g.strokeStyle = '#2B6CB0';
  g.fillStyle = '#2B6CB0';
  g.lineWidth = s * 0.1;
  for (const a of [0, Math.PI]) {
    g.beginPath();
    g.arc(x, y, s * 0.26, a + 0.3, a + Math.PI - 0.3);
    g.stroke();
    const ex = x + Math.cos(a + Math.PI - 0.3) * s * 0.26;
    const ey = y + Math.sin(a + Math.PI - 0.3) * s * 0.26;
    g.beginPath();
    g.moveTo(ex - s * 0.12 * Math.cos(a), ey - s * 0.02);
    g.lineTo(ex + s * 0.1 * Math.cos(a + 0.6), ey - s * 0.14 * Math.cos(a));
    g.lineTo(ex + s * 0.12 * Math.cos(a), ey + s * 0.06 * Math.cos(a));
    g.fill();
  }
  g.restore();
}
const ICON = { cloud: iconCloud, tick: iconTick, sync: iconSync };
const STATUS_WORD = { cloud: 'online only', tick: 'also on this PC', sync: 'syncing now' };

export default function plannerLab(stage, ui) {
  const { scene } = stage;

  // ---------- The club room ----------
  const floor = rbox(13.4, 0.14, 6.4, 0xe7e0d4, 0.06);
  floor.position.set(0.3, -0.07, -0.1);
  scene.add(floor);
  const wall = rbox(13.4, 3.7, 0.2, 0xf4f0f6, 0.05);
  wall.position.set(0.3, 1.85, -3.2);
  scene.add(wall);
  const skirting = rbox(13.4, 0.16, 0.06, COLORS.blue, 0.02);
  skirting.position.set(0.3, 0.08, -3.07);
  scene.add(skirting);
  // A kente-style mat under the meeting table.
  const rug = decal(3.6, 2.2, (g, W, H) => {
    const cols = ['#FFBE00', '#2EC4B6', '#CA1F3F', '#24182E', '#FFBE00', '#2E7D32'];
    const n = 18;
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[i % cols.length];
      g.fillRect((i * W) / n, 0, W / n + 1, H);
    }
    g.fillStyle = 'rgba(36,24,46,0.85)';
    for (let y = 0; y < H; y += H / 8) g.fillRect(0, y, W, H / 40);
    g.strokeStyle = '#24182E';
    g.lineWidth = 8;
    g.strokeRect(4, 4, W - 8, H - 8);
  }, { px: 128, transparent: false });
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.3, 0.003, -0.9);
  scene.add(rug);

  // ---------- 1. Wall calendar ----------
  const CAL = { x: -4.25, y: 2.0 };
  const calBoard = rbox(2.35, 2.55, 0.08, COLORS.purple, 0.05);
  calBoard.position.set(CAL.x, CAL.y, -3.06);
  scene.add(calBoard);
  const cal = decal(2.2, 2.4, () => {}, { px: 512, transparent: false });
  cal.position.set(CAL.x, CAL.y, -3.015);
  scene.add(cal);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(COLORS.red));
  pin.position.set(CAL.x, CAL.y + 1.2, -2.98);
  scene.add(pin);
  // The reminder bell on top of the calendar.
  const bell = new THREE.Group();
  const bellBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 0.26, 18, 1, true), mat(COLORS.gold, { side: THREE.DoubleSide, metalness: 0.4, roughness: 0.35 }));
  bellBody.position.y = -0.13;
  const bellTop = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), mat(COLORS.gold, { metalness: 0.4, roughness: 0.35 }));
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(0x8a5c00));
  clapper.position.y = -0.27;
  bell.add(bellBody, bellTop, clapper);
  bell.position.set(CAL.x + 0.95, CAL.y + 1.6, -2.95);
  scene.add(bell);
  const bellTag = label('', { scale: 0.55, bg: 'rgba(255,190,0,0.95)' });
  bellTag.position.set(CAL.x, CAL.y + 1.75, -2.9);
  bellTag.visible = false;
  scene.add(bellTag);

  // The three members who get the invitation.
  const guests = {};
  GUESTS.forEach((gu, i) => {
    const p = person({ shirt: gu.shirt, skin: gu.skin });
    p.group.position.set(CAL.x - 1.25 + i * 1.25, 0, -1.55);
    p.group.rotation.y = 0.15;
    scene.add(p.group);
    const tag = label(gu.name, { scale: 0.5 });
    tag.position.set(0, 1.62, 0);
    p.group.add(tag);
    // A reply card they hold up.
    const sign = new THREE.Group();
    const board = rbox(0.62, 0.36, 0.04, 0xffffff, 0.04);
    const face = decal(0.58, 0.32, () => {}, { px: 96, transparent: false });
    face.position.z = 0.025;
    const stick = rbox(0.04, 0.5, 0.04, 0x8a6a4a, 0.015);
    stick.position.set(0, -0.4, -0.01);
    sign.add(board, face, stick);
    sign.position.set(0.32, 1.25, 0.18);
    sign.scale.setScalar(0.001);
    sign.visible = false;
    p.group.add(sign);
    guests[gu.id] = { ...gu, p, tag, sign, face };
  });

  // ---------- 2. Meeting room: the big screen, table and you ----------
  const SCR = { x: 0.35, y: 2.05 };
  const tvFrame = rbox(3.85, 2.3, 0.1, 0x2b2730, 0.05);
  tvFrame.position.set(SCR.x, SCR.y, -3.04);
  scene.add(tvFrame);
  const screen = decal(3.7, 2.15, () => {}, { px: 420, transparent: false });
  screen.position.set(SCR.x, SCR.y, -2.985);
  scene.add(screen);
  const camDot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), mat(0x111111, { emissive: 0x2ec4b6, emissiveIntensity: 0 }));
  camDot.position.set(SCR.x, SCR.y + 1.2, -2.96);
  scene.add(camDot);

  const table = new THREE.Group();
  const top = rbox(2.6, 0.1, 1.15, 0xc8a27a, 0.03);
  top.position.y = 0.78;
  table.add(top);
  for (const x of [-1.15, 1.15]) for (const z of [-0.45, 0.45]) {
    const leg = rbox(0.09, 0.74, 0.09, 0x8a6a4a, 0.02);
    leg.position.set(x, 0.37, z);
    table.add(leg);
  }
  table.position.set(0.3, 0, -0.95);
  scene.add(table);
  // Your laptop, facing you (its back, with a BIH sticker, faces the screen).
  const laptop = new THREE.Group();
  const lapBase = rbox(0.7, 0.04, 0.48, 0x9aa0a8, 0.02, { metalness: 0.3 });
  const lid = new THREE.Group();
  const lidBox = rbox(0.7, 0.46, 0.03, 0x9aa0a8, 0.02, { metalness: 0.3 });
  lidBox.position.y = 0.23;
  const lapScreen = decal(0.62, 0.38, (g, W, H) => {
    g.fillStyle = '#1f1a24';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#3a2b47';
    for (let i = 0; i < 4; i++) g.fillRect(8 + (i % 2) * (W / 2), 8 + Math.floor(i / 2) * (H * 0.4), W / 2 - 16, H * 0.36);
  }, { px: 64, transparent: false });
  lapScreen.position.set(0, 0.23, 0.017);
  lid.add(lidBox, lapScreen);
  lid.position.set(0, 0.02, -0.22);
  lid.rotation.x = -0.25;
  laptop.add(lapBase, lid);
  laptop.position.set(0.75, 0.85, -0.65);
  laptop.rotation.y = Math.PI;
  scene.add(laptop);
  for (const [x, z, ry] of [[-0.75, -1.9, 0], [1.75, -0.95, -Math.PI / 2]]) {
    const ch = chair();
    ch.position.set(x, 0, z);
    ch.rotation.y = ry;
    scene.add(ch);
  }
  const myChair = chair();
  myChair.position.set(0.75, 0, 0.1);
  myChair.rotation.y = Math.PI;
  scene.add(myChair);
  const me = person({ shirt: COLORS.blue, skin: 0x7a4a2e, seated: true });
  me.group.position.set(0.75, 0, 0.1);
  me.group.rotation.y = Math.PI; // facing the screen, back to us
  scene.add(me.group);
  const meTag = label('You', { scale: 0.5 });
  meTag.position.set(0, 1.55, 0);
  me.group.add(meTag);
  const noiseTag = label('', { scale: 0.6, bg: 'rgba(202,31,63,0.95)', color: '#FFFFFF' });
  noiseTag.position.set(0.75, 2.0, 0.6);
  noiseTag.visible = false;
  scene.add(noiseTag);

  // ---------- 3. Cloud cupboard, Hub PC and the phone ----------
  const cup = new THREE.Group();
  const CW = 2.2;
  const CH = 2.7;
  const wood = 0x8a6a4a;
  const backP = rbox(CW, CH, 0.06, 0xd9cbb5, 0.02);
  backP.position.set(0, CH / 2, -0.4);
  cup.add(backP);
  for (const x of [-CW / 2, CW / 2]) {
    const side = rbox(0.08, CH, 0.86, wood, 0.02);
    side.position.set(x, CH / 2, 0);
    cup.add(side);
  }
  for (const y of [0.08, 1.0, 1.85, CH - 0.04]) {
    const shelf = rbox(CW, 0.07, 0.84, wood, 0.02);
    shelf.position.set(0, y, 0);
    cup.add(shelf);
  }
  // Doors: hinged on the outer edges, open while you are signed in.
  const doors = [-1, 1].map((s) => {
    const hinge = new THREE.Group();
    hinge.position.set(s * CW / 2, CH / 2, 0.43);
    const door = rbox(CW / 2 - 0.02, CH - 0.06, 0.05, COLORS.blue, 0.02);
    door.position.x = -s * (CW / 4);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(COLORS.gold, { metalness: 0.5 }));
    knob.position.set(-s * (CW / 2 - 0.12), 0, 0.05);
    hinge.add(door, knob);
    hinge.rotation.y = s * 1.95;
    cup.add(hinge);
    return { hinge, s };
  });
  const lock = new THREE.Group();
  const lockBody = rbox(0.24, 0.2, 0.08, COLORS.gold, 0.03, { metalness: 0.4 });
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 8, 16, Math.PI), mat(0x9aa0a8, { metalness: 0.6 }));
  shackle.position.y = 0.1;
  lock.add(lockBody, shackle);
  lock.position.set(0, CH / 2, 0.5);
  lock.visible = false;
  cup.add(lock);
  // A fluffy cloud on top: this cupboard lives on the company's servers.
  const cloud = new THREE.Group();
  const puff = new THREE.SphereGeometry(1, 16, 12);
  const puffMat = mat(0xffffff, { roughness: 0.9, emissive: 0xdde9ff, emissiveIntensity: 0.25 });
  for (const [x, y, r] of [[-0.6, 0.05, 0.36], [-0.15, 0.25, 0.5], [0.4, 0.15, 0.42], [0.8, 0, 0.3], [0.1, -0.05, 0.38]]) {
    const m = new THREE.Mesh(puff, puffMat);
    m.scale.setScalar(r);
    m.position.set(x, y, 0);
    cloud.add(m);
  }
  cloud.position.set(0, CH + 0.4, -0.1);
  cup.add(cloud);
  const sign = decal(1.6, 0.3, (g, W, H) => {
    pill(g, 0, 0, W, H, '#24182E');
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fit(g, '☁ CLOUD CUPBOARD', W / 2, H * 0.55, W - 20, H * 0.55, 700, '#FFBE00');
  }, { px: 64 });
  sign.position.set(0, CH + 0.12, 0.43);
  cup.add(sign);
  // What is inside: the club folder that is already there, with the club rules.
  const folderGeo = new THREE.BoxGeometry(0.62, 0.46, 0.08);
  const sheetGeo = new THREE.BoxGeometry(0.34, 0.44, 0.015);
  const sheetMat = mat(0xffffff);
  const clubFolder = new THREE.Mesh(folderGeo, mat(COLORS.blue));
  clubFolder.position.set(-0.55, 1.32, 0);
  clubFolder.rotation.x = -0.12;
  clubFolder.castShadow = true;
  cup.add(clubFolder);
  const clubLabel = folderLabel('Club files');
  clubLabel.position.set(-0.55, 1.33, 0.05);
  cup.add(clubLabel);
  const rulesSheet = new THREE.Mesh(sheetGeo, sheetMat);
  rulesSheet.position.set(-0.55, 1.5, -0.06);
  cup.add(rulesSheet);
  // The new folder the pupil makes.
  const newFolder = new THREE.Group();
  const nfBox = new THREE.Mesh(folderGeo, mat(COLORS.gold));
  nfBox.castShadow = true;
  const nfLabel = folderLabel('');
  nfLabel.position.set(0, 0.01, 0.05);
  newFolder.add(nfBox, nfLabel);
  newFolder.position.set(0.45, 1.32, 0);
  newFolder.rotation.x = -0.12;
  newFolder.visible = false;
  cup.add(newFolder);
  const posterInFolder = posterSheet();
  posterInFolder.position.set(0.45, 1.52, -0.06);
  posterInFolder.visible = false;
  cup.add(posterInFolder);
  // Box files on the bottom shelf, for a lived-in look.
  [[-0.7, COLORS.red], [-0.45, COLORS.green], [-0.2, COLORS.purple]].forEach(([x, c]) => {
    const b = rbox(0.2, 0.7, 0.6, c, 0.03);
    b.position.set(x, 0.47, 0);
    cup.add(b);
  });
  cup.position.set(4.75, 0, -2.55);
  scene.add(cup);

  // The Hub PC on its desk.
  const pc = new THREE.Group();
  const deskTop = rbox(2.0, 0.08, 0.9, 0xc8a27a, 0.03);
  deskTop.position.y = 0.78;
  pc.add(deskTop);
  for (const x of [-0.92, 0.92]) for (const z of [-0.36, 0.36]) {
    const leg = rbox(0.08, 0.74, 0.08, wood, 0.02);
    leg.position.set(x, 0.37, z);
    pc.add(leg);
  }
  const monFrame = rbox(1.42, 0.9, 0.06, 0x2b2730, 0.03);
  monFrame.position.set(0, 1.42, -0.18);
  const monitor = decal(1.34, 0.82, () => {}, { px: 330, transparent: false });
  monitor.position.set(0, 1.42, -0.147);
  const neck = rbox(0.08, 0.32, 0.06, 0x2b2730, 0.02);
  neck.position.set(0, 0.97, -0.22);
  const foot = rbox(0.4, 0.03, 0.24, 0x2b2730, 0.015);
  foot.position.set(0, 0.835, -0.2);
  const kb = rbox(0.9, 0.035, 0.28, 0x3b3f46, 0.015);
  kb.position.set(-0.05, 0.84, 0.18);
  const mouse = rbox(0.1, 0.04, 0.15, 0x3b3f46, 0.04);
  mouse.position.set(0.55, 0.84, 0.2);
  const tower = rbox(0.3, 0.62, 0.62, 0x3b3f46, 0.03);
  tower.position.set(0.75, 0.31, 0);
  const pcTag = decal(0.42, 0.11, (g, W, H) => {
    pill(g, 0, 0, W, H, '#FFBE00');
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fit(g, 'HUB PC-04', W / 2, H * 0.55, W - 8, H * 0.6, 700, '#24182E');
  }, { px: 32 });
  pcTag.position.set(0.5, 0.92, -0.146);
  pc.add(monFrame, monitor, neck, foot, kb, mouse, tower, pcTag);
  pc.position.set(3.15, 0, 0.85);
  scene.add(pc);
  const download = posterSheet(RULES);
  download.scale.setScalar(0.75);
  download.position.set(3.15 - 0.62, 0.84, 0.85 + 0.15);
  download.rotation.x = -Math.PI / 2;
  download.visible = false;
  scene.add(download);

  // A phone propped up next to a toy trotro: "open it on the trotro".
  const trotro = buildTrotro();
  trotro.position.set(5.75, 0, 0.55);
  trotro.rotation.y = -0.5;
  scene.add(trotro);
  const phone = new THREE.Group();
  const phBody = rbox(0.6, 1.15, 0.07, COLORS.purple, 0.07, { roughness: 0.35 });
  phBody.position.y = 0.575;
  const phScreen = decal(0.53, 1.04, () => {}, { px: 220, transparent: false });
  phScreen.position.set(0, 0.58, 0.037);
  const phStand = rbox(0.4, 0.08, 0.35, COLORS.gold, 0.03);
  phStand.position.set(0, -0.02, -0.08);
  phone.add(phBody, phScreen, phStand);
  phone.position.set(5.0, 0.06, 1.75);
  phone.rotation.set(-0.2, 0.25, 0);
  scene.add(phone);

  // A flying sheet of paper for uploads and downloads.
  const flyer = posterSheet();
  flyer.visible = false;
  scene.add(flyer);

  // ---------- Callouts (most important first: phones show four) ----------
  const cards = {
    cal: stage.callout(cal, { icon: '🗓️', title: 'Calendar', text: 'The noticeboard that reminds you.', at: [-0.6, 0.9, 0], dx: 40, dy: -60 }),
    call: stage.callout(screen, { icon: '🎥', title: 'Video call', text: 'The meeting room that comes to you.', at: [0.4, 0.9, 0], dx: 30, dy: -60 }),
    cup: stage.callout(cloud, { icon: '☁️', title: 'Cloud cupboard', text: 'Your files, from any computer or phone.', at: [0.3, 0.3, 0], dx: -40, dy: -60 }),
    sync: stage.callout(monitor, { icon: '🔄', title: 'Sync icons', text: 'Cloud, tick or arrows: where your file is.', at: [-0.4, 0.1, 0], dx: -150, dy: 80 }),
    replies: stage.callout(guests.esi.p.group, { icon: '✉️', title: 'Replies', text: 'Always reply: yes, maybe or no.', at: [0, 1.3, 0], dx: 10, dy: 120 }),
    phone: stage.callout(phone, { icon: '📱', title: 'Another device', text: 'Signed in, it sees the newest copy.', at: [0.3, 1.1, 0], dx: 40, dy: 90 }),
  };

  // ---------- State ----------
  let event = null; // the saved meeting
  const call = { in: false, muted: false, cam: true, hand: false, sharing: false, called: false, speaking: false, stranger: false, toast: '', toastT: 0, noisy: false };
  const done = { cam: false, spoke: false, mutedAfter: false, shared: false };
  const cloudSt = { folder: null, poster: null, rules: 'cloud', downloaded: false, phone: false, signedOut: false };
  let busy = false;
  let idle = 0; // seconds unmuted without speaking (the cockerel is waiting)
  let noiseN = 0;

  // ---------- Side panel ----------
  // 1 · Calendar
  const calGroup = ui.group('1 · Calendar: plan the meeting');
  const form = ui.element(`
    <label class="lab-field">Title <input data-f="title" maxlength="40" placeholder="e.g. Tech Club planning meeting" style="font-family:inherit;font-size:14px"></label>
    <label class="lab-field">Date <select data-f="day"><option value="">Choose a day…</option>${DAYS.map((d) => `<option value="${d}">${dayName(d)}</option>`).join('')}</select></label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <label class="lab-field">Starts <select data-f="start"><option value="">--:--</option>${TIMES.map((t) => `<option>${t}</option>`).join('')}</select></label>
      <label class="lab-field" style="margin-top:0">Ends <select data-f="end"><option value="">--:--</option>${TIMES.map((t) => `<option>${t}</option>`).join('')}</select></label>
    </div>
    <label class="lab-field">Reminder (notification) <select data-f="reminder">${Object.entries(REMINDERS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label class="inline"><input type="checkbox" data-f="link"> 🔗 Add a video meeting link</label>
    <div class="field-label">Add guests</div>
    ${GUESTS.map((gu) => `<label class="inline" style="margin:4px 0"><input type="checkbox" data-g="${gu.id}"> ${gu.name} <small style="color:var(--muted)">${gu.email}</small></label>`).join('')}`, calGroup);
  const f = (k) => form.querySelector(`[data-f="${k}"]`);
  const sendBtn = ui.button('📨 Save and send', () => send(), { primary: true, group: calGroup });

  // 2 · Video call
  const callGroup = ui.group('2 · Video call');
  const joinBtn = ui.button('🎥 Join call', () => (call.in ? leave() : join()), { primary: true, group: callGroup });
  const micBtn = ui.button('', () => toggleMic(), { group: callGroup });
  const camBtn = ui.button('', () => toggleCam(), { group: callGroup });
  const handBtn = ui.button('', () => toggleHand(), { group: callGroup });
  const helloBtn = ui.button('👋 Say hello', () => sayHello(), { group: callGroup });
  const shareBtn = ui.button('', () => toggleShare(), { group: callGroup });
  const chatBtn = ui.button('💬 Chat: send the folder link', () => chat(), { group: callGroup });
  const postBtn = ui.button('📢 Post the link on my public page', () => postLink(), { group: callGroup });
  postBtn.style.borderStyle = 'dashed';

  // 3 · Cloud cupboard
  const cloudGroup = ui.group('3 · Cloud cupboard (OneDrive / Drive)');
  const folderField = ui.element('<label class="lab-field">Folder name <input data-f="folder" maxlength="40" placeholder="TechClub_OpenDay_Team3" style="font-family:inherit;font-size:14px"></label>', cloudGroup).querySelector('input');
  const folderBtn = ui.button('📁 New folder', () => makeFolder(), { group: cloudGroup });
  const upBtn = ui.button('⬆️ Upload my poster', () => upload(), { group: cloudGroup });
  const downBtn = ui.button(`⬇️ Download ${RULES}`, () => downloadRules(), { group: cloudGroup });
  const phoneBtn = ui.button('📱 Open it on my phone', () => openOnPhone(), { group: cloudGroup });
  const outBtn = ui.button('🔒 Sign out', () => signOut(), { group: cloudGroup });
  const store = ui.element('<p class="crack"></p>', cloudGroup).firstElementChild;

  const allBtns = [sendBtn, joinBtn, micBtn, camBtn, handBtn, helloBtn, shareBtn, chatBtn, postBtn, folderBtn, upBtn, downBtn, phoneBtn, outBtn];
  function setBusy(on) {
    busy = on;
    // aria-disabled (not disabled) so a keyboard user's focus stays on the button.
    for (const b of allBtns) {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.5' : '';
    }
  }
  function callButtons() {
    joinBtn.textContent = call.in ? '📴 Leave call' : '🎥 Join call';
    joinBtn.classList.toggle('primary', !call.in);
    micBtn.textContent = call.muted ? '🔇 Unmute' : '🎤 Mute';
    camBtn.textContent = call.cam ? '📷 Camera off' : '📷 Camera on';
    handBtn.textContent = call.hand ? '✋ Lower hand' : '✋ Raise hand';
    shareBtn.textContent = call.sharing ? '🖥️ Stop sharing' : '🖥️ Share screen';
    micBtn.classList.toggle('active', call.muted);
    handBtn.classList.toggle('active', call.hand);
    shareBtn.classList.toggle('active', call.sharing);
    for (const b of [micBtn, camBtn, handBtn, helloBtn, shareBtn, chatBtn]) b.style.opacity = call.in && !busy ? '' : '0.55';
  }
  function storeText() {
    const used = 1.2 + (cloudSt.poster ? 0.004 : 0);
    outBtn.textContent = cloudSt.signedOut ? '🔑 Sign in again' : '🔒 Sign out';
    store.innerHTML = cloudSt.signedOut
      ? '🔒 Signed out. The next person on this PC cannot open your files.'
      : `Signed in: Hub learning account · ${used.toFixed(1)} GB of 5 GB used`;
  }

  // ---------- 1 · Calendar ----------
  function drawCal() {
    redraw(cal, (g, W, H) => {
      g.fillStyle = '#FFFFFF';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#24182E';
      g.fillRect(0, 0, W, H * 0.15);
      const kente = ['#FFBE00', '#2EC4B6', '#CA1F3F', '#FFBE00'];
      for (let i = 0; i < 24; i++) {
        g.fillStyle = kente[i % 4];
        g.fillRect((i * W) / 24, H * 0.15, W / 24 + 1, H * 0.018);
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fit(g, `NOVEMBER ${YEAR}`, W / 2, H * 0.08, W - 40, H * 0.07, 700, '#FFFFFF');
      const gx = W * 0.04;
      const gw = (W - gx * 2) / 7;
      const gy = H * 0.24;
      const gh = (H * 0.74) / 6;
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d, i) => fit(g, d, gx + gw * (i + 0.5), H * 0.2, gw, H * 0.03, 700, '#6B6373'));
      const first = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7; // Monday = 0
      const days = new Date(YEAR, MONTH + 1, 0).getDate();
      g.strokeStyle = '#D9D3DE';
      g.lineWidth = 2;
      for (let d = 1; d <= days; d++) {
        const k = first + d - 1;
        const x = gx + gw * (k % 7);
        const y = gy + gh * Math.floor(k / 7);
        g.strokeRect(x, y, gw, gh);
        g.textAlign = 'left';
        fit(g, String(d), x + 6, y + gh * 0.2, gw, gh * 0.24, 600, k % 7 > 4 ? '#CA1F3F' : '#24182E');
        if (event && event.day === d) {
          g.fillStyle = '#CA1F3F';
          g.beginPath();
          g.roundRect(x + 3, y + gh * 0.38, gw - 6, gh * 0.58, 6);
          g.fill();
          fit(g, event.title, x + 7, y + gh * 0.56, gw - 12, gh * 0.18, 700, '#FFFFFF');
          fit(g, `${event.start}${event.reminder ? ' 🔔' : ''}`, x + 7, y + gh * 0.82, gw - 12, gh * 0.18, 500, '#FFFFFF');
        }
      }
    });
  }

  function guestReplySign(gu) {
    const r = REPLY[gu.reply];
    redraw(gu.face, (g, W, H) => {
      g.fillStyle = r.bg;
      g.fillRect(0, 0, W, H);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fit(g, `${r.mark} ${r.word}`, W / 2, H * 0.55, W - 10, H * 0.55, 800, r.ink);
    });
  }

  async function send() {
    if (busy) return;
    const title = f('title').value.trim();
    const day = +f('day').value;
    const start = f('start').value;
    const end = f('end').value;
    const reminder = f('reminder').value;
    const link = f('link').checked;
    const invited = GUESTS.filter((gu) => form.querySelector(`[data-g="${gu.id}"]`).checked).map((gu) => gu.id);
    if (title.length < 4) {
      ui.info('✏️ Give it a clear title', '<p>A title like <b>"Tech Club planning meeting"</b> tells everyone what the event is, even in a tiny box on their phone. "Meeting" or a blank title tells them nothing.</p>');
      return f('title').focus();
    }
    if (!day) {
      ui.info('📅 Which day?', '<p>Choose the <b>date</b>. An event is anything with a date and a time.</p>');
      return f('day').focus();
    }
    if (!start || !end) {
      ui.info('🕒 Set the start and end time', '<p>Guests need to know when to come <b>and</b> when they will be free again. Choose a start and an end time.</p>');
      return f(start ? 'end' : 'start').focus();
    }
    if (mins(end) <= mins(start)) {
      ui.info('🕒 It ends before it starts!', `<p>Your meeting starts at <b>${start}</b> but ends at <b>${end}</b>. The end time must be later than the start time. A planning meeting of 30 minutes is plenty.</p>`);
      return f('end').focus();
    }
    event = { title, day, start, end, reminder, link, invited };
    drawCal();
    drawScreen();
    setBusy(true);
    stage.reveal();
    for (const gu of GUESTS) {
      guests[gu.id].sign.visible = false;
      setLabel(guests[gu.id].tag, gu.name);
    }
    bellTag.visible = false;
    const when = `<b>${esc(dayName(day))}</b>, ${start}–${end}`;
    if (!invited.length) {
      ui.info('💾 Saved, but nobody is invited', `<p>"${esc(title)}" is on <b>your</b> calendar for ${when}. But you did not add any guests, so Kofi, Esi and Yaw know nothing about it!</p><p>Tick the members under <b>Add guests</b> and press <b>Save and send</b> again.</p>`);
      setBusy(false);
      return;
    }
    ui.info('📨 Invitations sent…', `<p>"${esc(title)}", ${when}. Each guest gets an email and the event appears on their calendar. Now they reply…</p>`);
    for (const id of invited) {
      const gu = guests[id];
      guestReplySign(gu);
      gu.sign.visible = true;
      await stage.tween((k) => gu.sign.scale.setScalar(0.001 + k * 0.999), 0.4);
      setLabel(gu.tag, `${gu.name}: ${REPLY[gu.reply].word.toLowerCase().replace(/^./, (c) => c.toUpperCase())}`);
      await stage.wait(0.35);
    }
    const count = (r) => invited.filter((id) => guests[id].reply === r).length;
    const tally = `<b>${count('yes')}</b> yes, <b>${count('maybe')}</b> maybe, <b>${count('no')}</b> no`;
    const missing = GUESTS.filter((gu) => !invited.includes(gu.id)).map((gu) => gu.name);
    let html = `<p>Your calendar shows ${tally}. Replying matters: it tells the organiser who is coming.</p>`;
    if (reminder) {
      bellTag.visible = true;
      setLabel(bellTag, `🔔 Reminder: ${REMINDERS[reminder]}`);
      await ring();
      html += `<p>🔔 Everyone who said yes gets the reminder <b>${REMINDERS[reminder]}</b>, so nobody forgets.</p>`;
    } else {
      html += '<p>⚠️ <b>No reminder!</b> A calendar only beats the paper noticeboard if it reminds you. Choose one, for example <b>30 minutes before</b> or <b>1 day before</b>, and send again.</p>';
    }
    if (!link) html += '<p>💡 Tip: add a <b>video meeting link</b>, so people can join from wherever they are.</p>';
    if (missing.length) html += `<p>👥 You did not invite <b>${missing.join(' and ')}</b>. Tick them under <b>Add guests</b> and send again.</p>`;
    const ok = reminder && !missing.length;
    ui.info(ok ? '✅ Meeting scheduled!' : '📨 Sent, but something is missing', html);
    if (ok) ui.complete('invite');
    setBusy(false);
  }

  async function ring() {
    await stage.tween((k) => {
      bell.rotation.z = Math.sin(k * Math.PI * 8) * 0.45 * (1 - k);
    }, 1.2);
  }

  // ---------- 2 · Video call ----------
  const people = () => {
    const list = [
      { name: 'You', you: true, cam: call.cam, muted: call.muted, hand: call.hand, speaking: call.speaking, noisy: call.noisy, shirt: '#5A4470', skin: '#7A4A2E' },
      { name: 'Mentor (host)', cam: true, muted: !call.toast.startsWith('Mentor'), shirt: '#24182E', skin: '#5A3520' },
      { name: 'Kofi', cam: true, muted: true, shirt: '#2EC4B6', skin: '#6B4226' },
      { name: 'Esi', cam: false, muted: !call.toast.startsWith('Esi'), shirt: '#FFBE00', skin: '#8D5A3B' },
    ];
    if (call.stranger) list.push({ name: 'Unknown', cam: true, muted: false, noisy: true, shirt: '#111111', skin: '#3B3F46', stranger: true });
    return list;
  };

  function drawTile(g, x, y, w, h, p) {
    g.save();
    g.fillStyle = p.stranger ? '#4a1020' : '#3a2b47';
    g.beginPath();
    g.roundRect(x, y, w, h, 10);
    g.fill();
    g.clip();
    if (p.cam) {
      g.fillStyle = p.stranger ? '#6b1a2e' : '#4b3c58';
      g.fillRect(x, y, w, h * 0.55);
      g.fillStyle = p.shirt;
      g.beginPath();
      g.ellipse(x + w / 2, y + h * 1.02, w * 0.3, h * 0.36, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = p.skin;
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.45, h * 0.18, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#1b1410';
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.41, h * 0.185, Math.PI * 1.05, Math.PI * 1.95);
      g.fill();
      if (p.stranger) {
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        fit(g, '?', x + w / 2, y + h * 0.46, w, h * 0.2, 800, '#FFFFFF');
      }
    } else {
      g.fillStyle = p.shirt;
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.46, h * 0.2, 0, Math.PI * 2);
      g.fill();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fit(g, p.name[0], x + w / 2, y + h * 0.47, w, h * 0.2, 700, '#24182E');
      g.textAlign = 'left';
      fit(g, '📷 camera off', x + 8, y + 14, w - 16, Math.max(10, h * 0.09), 500, '#D9D3DE');
    }
    g.restore();
    if (p.speaking || p.noisy) {
      g.strokeStyle = p.noisy ? '#FFBE00' : '#2EC4B6';
      g.lineWidth = 5;
      g.beginPath();
      g.roundRect(x + 2.5, y + 2.5, w - 5, h - 5, 9);
      g.stroke();
    }
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.font = `600 ${Math.max(10, h * 0.1)}px ${FONT}`;
    const nw = Math.min(w - 16, g.measureText(p.name).width + 14);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.beginPath();
    g.roundRect(x + 6, y + h - h * 0.17, nw, h * 0.13, 5);
    g.fill();
    fit(g, p.name, x + 13, y + h - h * 0.105, nw - 12, Math.max(10, h * 0.1), 600, '#FFFFFF');
    const r = Math.max(7, h * 0.08);
    if (p.muted) {
      g.fillStyle = '#CA1F3F';
      g.beginPath();
      g.arc(x + w - r - 6, y + r + 6, r, 0, Math.PI * 2);
      g.fill();
      micGlyph(g, x + w - r - 6, y + r + 6, r, true);
    }
    if (p.hand) {
      g.fillStyle = '#FFBE00';
      g.beginPath();
      g.arc(x + r + 8, y + r + 8, r * 1.2, 0, Math.PI * 2);
      g.fill();
      g.textAlign = 'center';
      fit(g, '✋', x + r + 8, y + r + 9, r * 2, r * 1.3, 400, '#24182E');
    }
  }
  function micGlyph(g, x, y, r, slash) {
    g.save();
    g.fillStyle = '#FFFFFF';
    g.strokeStyle = '#FFFFFF';
    g.beginPath();
    g.roundRect(x - r * 0.22, y - r * 0.6, r * 0.44, r * 0.8, r * 0.22);
    g.fill();
    g.lineWidth = Math.max(1.5, r * 0.12);
    g.beginPath();
    g.arc(x, y - r * 0.05, r * 0.4, 0.1 * Math.PI, 0.9 * Math.PI);
    g.moveTo(x, y + r * 0.35);
    g.lineTo(x, y + r * 0.6);
    g.stroke();
    if (slash) {
      g.lineWidth = Math.max(2, r * 0.16);
      g.beginPath();
      g.moveTo(x - r * 0.6, y - r * 0.6);
      g.lineTo(x + r * 0.6, y + r * 0.6);
      g.stroke();
    }
    g.restore();
  }

  function drawDrive(g, x, y, w, h, { compact = false } = {}) {
    g.save();
    g.fillStyle = '#FFFFFF';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#2B6CB0';
    g.fillRect(x, y, w, h * 0.13);
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    fit(g, '☁ OneDrive · Hub learning account', x + 10, y + h * 0.066, w - 20, h * 0.07, 600, '#FFFFFF');
    const rows = [];
    if (cloudSt.folder) rows.push({ icon: '📁', name: cloudSt.folder, st: 'tick' });
    if (cloudSt.folder && cloudSt.poster) rows.push({ icon: '📄', name: POSTER, st: cloudSt.poster, indent: true });
    rows.push({ icon: '📁', name: 'Club files', st: 'tick' });
    rows.push({ icon: '📄', name: RULES, st: cloudSt.rules, indent: true });
    const rh = h * (compact ? 0.12 : 0.11);
    rows.forEach((r, i) => {
      const ry = y + h * 0.2 + i * rh;
      if (i % 2) {
        g.fillStyle = '#F4F0F6';
        g.fillRect(x, ry - rh / 2, w, rh);
      }
      const ix = x + 10 + (r.indent ? w * 0.05 : 0);
      fit(g, r.icon, ix, ry, rh, rh * 0.6, 400, '#24182E');
      fit(g, r.name, ix + rh * 0.9, ry, w * 0.58, rh * 0.48, 500, '#24182E');
      ICON[r.st](g, x + w * 0.76, ry, rh * 0.9);
      fit(g, STATUS_WORD[r.st], x + w * 0.8, ry, w * 0.19, rh * 0.36, 500, '#6B6373');
    });
    if (cloudSt.downloaded) {
      const ry = y + h * 0.2 + rows.length * rh + rh * 0.3;
      fit(g, `⬇ Downloads folder: ${RULES}`, x + 10, ry, w - 20, rh * 0.42, 600, '#1E9E5A');
    }
    if (!compact) {
      // Legend: what the three icons mean.
      const ly = y + h - h * 0.09;
      g.fillStyle = '#F4F0F6';
      g.fillRect(x, ly - h * 0.07, w, h * 0.16);
      [['cloud', 'online only'], ['tick', 'also on this PC'], ['sync', 'syncing now']].forEach(([k, t], i) => {
        const lx = x + 12 + (i * w) / 3;
        ICON[k](g, lx + rh * 0.3, ly, rh * 0.8);
        fit(g, t, lx + rh * 0.75, ly, w / 3 - rh, rh * 0.38, 600, '#24182E');
      });
    }
    g.restore();
  }

  function drawScreen() {
    redraw(screen, (g, W, H) => {
      g.fillStyle = '#1f1a24';
      g.fillRect(0, 0, W, H);
      g.textBaseline = 'middle';
      const title = event ? event.title : 'Tech Club planning meeting';
      if (!call.in) {
        g.textAlign = 'center';
        fit(g, title, W / 2, H * 0.16, W - 60, H * 0.075, 700, '#FFFFFF');
        fit(g, 'Ready to join?', W / 2, H * 0.27, W, H * 0.055, 500, '#D9D3DE');
        drawTile(g, W * 0.3, H * 0.34, W * 0.4, H * 0.38, { name: 'You', cam: call.cam, muted: call.muted, shirt: '#5A4470', skin: '#7A4A2E' });
        pill(g, W * 0.38, H * 0.77, W * 0.24, H * 0.1, '#1E9E5A');
        fit(g, 'Join now', W / 2, H * 0.82, W * 0.2, H * 0.05, 700, '#FFFFFF');
        fit(g, `🔗 ${LINK}`, W / 2, H * 0.94, W, H * 0.04, 500, '#9A8FA6');
        return;
      }
      const barH = H * 0.13;
      const areaH = H - barH;
      const list = people();
      if (call.sharing) {
        // Your shared screen fills the stage; the tiles move to the side.
        const sw = W * 0.74;
        g.fillStyle = '#3a2b47';
        g.fillRect(8, 8, sw - 8, areaH - 16);
        drawDrive(g, 16, 30, sw - 24, areaH - 48);
        g.textAlign = 'left';
        fit(g, '🖥 You are presenting your screen', 16, 19, sw, 14, 600, '#FFBE00');
        const th = Math.min((areaH - 16) / list.length - 6, (W - sw - 16) * 0.7);
        list.forEach((p, i) => drawTile(g, sw + 8, 8 + i * (th + 6), W - sw - 16, th, p));
      } else {
        const cols = list.length > 4 ? 3 : 2;
        const rows = Math.ceil(list.length / cols);
        const tw = (W - 12) / cols - 8;
        const th = (areaH - 12) / rows - 8;
        list.forEach((p, i) => drawTile(g, 10 + (i % cols) * (tw + 8), 10 + Math.floor(i / cols) * (th + 8), tw, th, p));
      }
      if (call.toast) {
        g.font = `600 ${H * 0.05}px ${FONT}`;
        const tw = Math.min(W - 30, g.measureText(call.toast).width + 36);
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.beginPath();
        g.roundRect((W - tw) / 2, areaH - H * 0.13, tw, H * 0.09, 12);
        g.fill();
        g.textAlign = 'center';
        fit(g, call.toast, W / 2, areaH - H * 0.085, tw - 24, H * 0.05, 600, '#24182E');
      }
      // The control bar: the same six buttons as in Meet, Zoom or Teams.
      g.fillStyle = '#2b2430';
      g.fillRect(0, areaH, W, barH);
      const icons = [
        ['mic', call.muted ? '#CA1F3F' : '#4a4152'],
        ['📷', call.cam ? '#4a4152' : '#CA1F3F'],
        ['✋', call.hand ? '#FFBE00' : '#4a4152'],
        ['💬', '#4a4152'],
        ['🖥', call.sharing ? '#1E9E5A' : '#4a4152'],
      ];
      const r = barH * 0.32;
      icons.forEach(([ic, c], i) => {
        const cx = W / 2 - 2.6 * r * 2.6 + i * r * 2.6;
        const cy = areaH + barH / 2;
        g.fillStyle = c;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
        g.textAlign = 'center';
        if (ic === 'mic') micGlyph(g, cx, cy, r * 0.9, call.muted);
        else fit(g, ic, cx, cy + 1, r * 1.6, r, 400, '#FFFFFF');
        if (ic === '📷' && !call.cam) {
          g.strokeStyle = '#FFFFFF';
          g.lineWidth = 3;
          g.beginPath();
          g.moveTo(cx - r * 0.55, cy - r * 0.55);
          g.lineTo(cx + r * 0.55, cy + r * 0.55);
          g.stroke();
        }
      });
      const lx = W / 2 - 2.6 * r * 2.6 + 5 * r * 2.6;
      pill(g, lx - r * 1.2, areaH + barH / 2 - r, r * 2.4, r * 2, '#CA1F3F');
      g.textAlign = 'center';
      fit(g, 'Leave', lx, areaH + barH / 2, r * 2.2, r * 0.8, 700, '#FFFFFF');
      g.textAlign = 'left';
      fit(g, '🔒 ' + LINK.split('/')[1], 10, areaH + barH / 2, W * 0.2, barH * 0.26, 500, '#9A8FA6');
    });
    camDot.material.emissiveIntensity = call.in && call.cam ? 0.9 : 0;
  }

  function toast(text, seconds = 3) {
    call.toast = text;
    call.toastT = seconds;
    drawScreen();
  }

  function needCall() {
    if (call.in) return false;
    ui.info('🎥 Join the call first', `<p>Press <b>Join call</b>. In real life you click the link in the calendar event (${LINK}) or type the meeting code, check your name, microphone and camera, then click <b>Join now</b>.</p>`);
    return true;
  }

  async function join() {
    if (busy) return;
    Object.assign(call, { in: true, hand: false, sharing: false, called: false, speaking: false, noisy: false });
    idle = 0;
    stage.reveal();
    callButtons();
    toast('You joined: Mentor, Kofi and Esi are here', 2.5);
    ui.info('🎥 You are in the meeting', `<p>The tiles on the screen show who is here. Yaw said <b>No</b>, so he is not here.</p><p>Your microphone is <b>on</b>. Listen… what can everybody else hear?</p>`);
    await arm(call.hand);
  }
  function leave() {
    if (busy) return;
    Object.assign(call, { in: false, hand: false, sharing: false, speaking: false, noisy: false, stranger: false, toast: '' });
    noiseTag.visible = false;
    arm(false);
    callButtons();
    drawScreen();
    ui.info('📴 You left the call', `<p>Always leave the call when the meeting ends. On a shared computer, also <b>sign out</b> of the account.</p>${missionLeft()}`);
  }

  function toggleMic() {
    if (busy || needCall()) return;
    call.muted = !call.muted;
    idle = 0;
    if (call.muted) {
      call.noisy = false;
      noiseTag.visible = false;
      if (done.spoke && !done.mutedAfter) {
        done.mutedAfter = true;
        ui.info('🔇 Muted again: perfect manners', '<p>You spoke, then muted again. Now the generator, the cockerel and the TV stay out of the meeting.</p>' + missionLeft());
      } else {
        ui.info('🔇 Muted', `<p>Good. <b>Stay muted until you speak.</b> Background noise (a generator, a cockerel, the TV) drowns out the speaker.</p>${call.called ? '<p>The mentor asked you to speak: unmute now, then press <b>Say hello</b>.</p>' : ''}`);
      }
    } else {
      ui.info('🎤 Microphone on', call.called ? '<p>Your turn. Press <b>Say hello</b>.</p>' : '<p>Everyone can hear you now, and everything around you. Only unmute when it is your turn to talk.</p>');
    }
    callButtons();
    drawScreen();
    checkCall();
  }
  function toggleCam() {
    if (busy || needCall()) return;
    call.cam = !call.cam;
    done.cam = true;
    callButtons();
    drawScreen();
    ui.info(call.cam ? '📷 Camera on' : '📷 Camera off', call.cam
      ? '<p>Check your background first: nothing private, no family members who did not agree, no address or school uniform. Light on your face helps people see you.</p>'
      : '<p>Your tile shows your initial instead. A video call can use hundreds of MB of data, sometimes over 1 GB in an hour. <b>Camera off saves most of the data</b> and helps on a weak signal, just like Esi.</p>');
    checkCall();
  }
  async function toggleHand() {
    if (busy || needCall()) return;
    call.hand = !call.hand;
    callButtons();
    drawScreen();
    arm(call.hand);
    if (!call.hand) {
      call.called = false;
      ui.info('✋ Hand lowered', '<p>Raise it again when you want to speak.</p>');
      return;
    }
    ui.info('✋ Hand raised', '<p>Raising your hand says "I want to speak" without interrupting. Only one person talks at a time. Wait for the host…</p>');
    await stage.wait(1.3);
    if (!call.in || !call.hand) return;
    call.called = true;
    toast('Mentor: Yes, go ahead! We are listening.', 3);
    ui.info('🙋 The host asked you to speak', `<p>${call.muted ? 'Now <b>unmute</b>, then press <b>Say hello</b>.' : 'Press <b>Say hello</b>.'}</p>`);
  }
  async function sayHello() {
    if (busy || needCall()) return;
    if (call.muted) {
      toast('Kofi: We can see your lips moving… you are muted!', 3);
      ui.info('🔇 Nobody heard you', '<p>You are <b>muted</b>. Unmute first, then speak. (Everyone does this at least once!)</p>');
      return;
    }
    if (!call.called) {
      ui.info('✋ Wait your turn', '<p>Talking over other people makes a call impossible to follow. <b>Raise your hand</b> first and wait until the host asks you to speak.</p>');
      return;
    }
    setBusy(true);
    call.speaking = true;
    call.noisy = false;
    noiseTag.visible = false;
    call.hand = false;
    call.called = false;
    arm(false);
    callButtons();
    toast('You: Hello everyone! Our folder is ready for the Open Day.', 2.6);
    await stage.wait(2.4);
    call.speaking = false;
    idle = 0;
    done.spoke = true;
    toast('Mentor: Thank you! Please mute again.', 3);
    setBusy(false);
    callButtons();
    ui.info('👋 Everyone heard you', '<p>You raised your hand, waited, unmuted and spoke. Your hand went down automatically. Now <b>mute again</b>, before the cockerel joins in!</p>');
    checkCall();
  }
  function toggleShare() {
    if (busy || needCall()) return;
    call.sharing = !call.sharing;
    if (call.sharing) done.shared = true;
    callButtons();
    drawScreen();
    ui.info(call.sharing ? '🖥️ You are sharing your screen' : '🖥️ Sharing stopped', call.sharing
      ? `<p>Everyone now sees <b>your screen</b> (Meet calls this "Present"). Here you show the club's OneDrive folder. Close anything private first: everyone can see it! Sharing also uses more data.</p>${cloudSt.folder ? '' : '<p>Your cloud cupboard has no Open Day folder yet: make one in part 3.</p>'}`
      : '<p>The tiles are back. Stop sharing as soon as you have finished showing.</p>');
    checkCall();
  }
  function chat() {
    if (busy || needCall()) return;
    toast(`💬 You: Folder link → onedrive.live.com/…/${cloudSt.folder ?? 'TechClub_OpenDay'}`, 3.5);
    ui.info('💬 Links go in the chat', '<p>Reading out a long link is hard; type it in the chat instead. The chat is only for people in this meeting.</p>');
  }
  async function postLink() {
    if (busy) return;
    if (!call.in) {
      ui.info('📢 Never share meeting links publicly', '<p>A link on a public page lets <b>anyone</b> join: strangers can walk into your meeting and disrupt it. Send the link only to the people you invite (in the calendar invitation or the chat).</p>');
      return;
    }
    setBusy(true);
    call.stranger = true;
    toast('A stranger joined from your public post and is shouting!', 3);
    ui.info('📢 Oh no, a stranger joined', '<p>You posted the link on a public page, so anyone could join. Strangers can shout, show rude pictures or see who is in the club.</p><p><b>Never share meeting links publicly.</b> The host is removing them…</p>');
    await stage.wait(3);
    call.stranger = false;
    toast('Mentor: I removed the stranger and locked the meeting.', 3);
    setBusy(false);
    callButtons();
  }
  function checkCall() {
    if (done.cam && done.spoke && done.mutedAfter && done.shared && !ui.isDone('call')) {
      ui.complete('call');
      ui.info('✅ Great meeting manners!', '<p>You used the camera, raised your hand, waited your turn, spoke, muted again and shared your screen. When the meeting ends, <b>leave</b> the call.</p>');
    }
  }
  function missionLeft() {
    if (ui.isDone('call') || !call.in) return '';
    const todo = [];
    if (!done.cam) todo.push('turn your camera off or on');
    if (!done.spoke) todo.push('raise your hand and say hello');
    else if (!done.mutedAfter) todo.push('mute again');
    if (!done.shared) todo.push('share your screen');
    return todo.length ? `<p>Still to do: ${todo.join(', ')}.</p>` : '';
  }
  function arm(up) {
    const from = me.armR.rotation.z;
    const to = up ? 2.85 : 0;
    return stage.tween((k) => (me.armR.rotation.z = from + (to - from) * k), 0.4);
  }

  // Leave your microphone on and the room joins in.
  const NOISES = [
    ['🐓 Cock-a-doodle-doo!', 'A cockerel outside crowed into your microphone.'],
    ['🔊 Brrrrrm… the generator', 'Your neighbour\'s generator is roaring into the meeting.'],
    ['📺 The TV is on!', 'The TV behind you is louder than the speaker.'],
  ];
  function noise() {
    const [tag, why] = NOISES[noiseN++ % NOISES.length];
    call.noisy = true;
    noiseTag.visible = true;
    setLabel(noiseTag, tag);
    toast('Esi: Sorry, I can\'t hear the mentor!', 3);
    ui.info(tag, `<p>${why} Everyone else hears it too, and Esi cannot hear the mentor.</p><p><b>Stay muted until you speak.</b> Press <b>Mute</b>.</p>`);
  }

  // ---------- 3 · Cloud cupboard ----------
  function drawMonitor() {
    redraw(monitor, (g, W, H) => {
      if (cloudSt.signedOut) {
        g.fillStyle = '#24182E';
        g.fillRect(0, 0, W, H);
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        fit(g, '🔒', W / 2, H * 0.35, W, H * 0.2, 400, '#FFFFFF');
        fit(g, 'Signed out', W / 2, H * 0.58, W, H * 0.1, 700, '#FFFFFF');
        fit(g, 'Sign in to open the cloud cupboard', W / 2, H * 0.72, W - 20, H * 0.065, 500, '#D9D3DE');
        return;
      }
      drawDrive(g, 0, 0, W, H);
    });
  }
  function drawPhone() {
    redraw(phScreen, (g, W, H) => {
      g.fillStyle = '#FFFFFF';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#24182E';
      g.fillRect(0, 0, W, H * 0.05);
      g.textBaseline = 'middle';
      g.textAlign = 'left';
      fit(g, '10:42   📶 🔋', 8, H * 0.026, W, H * 0.03, 500, '#FFFFFF');
      g.fillStyle = '#2B6CB0';
      g.fillRect(0, H * 0.05, W, H * 0.08);
      fit(g, '☁ OneDrive', 10, H * 0.09, W - 20, H * 0.04, 700, '#FFFFFF');
      if (!cloudSt.phone) {
        g.textAlign = 'center';
        fit(g, 'Signed in on', W / 2, H * 0.4, W - 20, H * 0.04, 500, '#6B6373');
        fit(g, 'my phone', W / 2, H * 0.46, W - 20, H * 0.045, 700, '#24182E');
        fit(g, '🚌 on the trotro', W / 2, H * 0.55, W - 20, H * 0.04, 500, '#6B6373');
        return;
      }
      fit(g, `📁 ${cloudSt.folder}`, 10, H * 0.17, W - 20, H * 0.035, 600, '#24182E');
      iconCloud(g, W - 22, H * 0.23, 24);
      fit(g, '📄 Poster', 10, H * 0.23, W - 50, H * 0.035, 500, '#24182E');
      // The poster itself, opened on the phone.
      const px = W * 0.12;
      const py = H * 0.28;
      const pw = W * 0.76;
      const ph = H * 0.6;
      g.fillStyle = '#24182E';
      g.fillRect(px, py, pw, ph);
      g.fillStyle = '#FFBE00';
      g.fillRect(px, py + ph * 0.42, pw, ph * 0.04);
      g.textAlign = 'center';
      fit(g, 'TECH CLUB', px + pw / 2, py + ph * 0.18, pw - 10, ph * 0.1, 800, '#FFBE00');
      fit(g, 'OPEN DAY', px + pw / 2, py + ph * 0.31, pw - 10, ph * 0.12, 800, '#FFFFFF');
      fit(g, 'Sat 14 Nov · 9:00 am', px + pw / 2, py + ph * 0.6, pw - 10, ph * 0.06, 600, '#FFFFFF');
      fit(g, 'Bozoma Innovation Hub', px + pw / 2, py + ph * 0.72, pw - 10, ph * 0.05, 500, '#D9D3DE');
      fit(g, 'Same file, newest copy', W / 2, H * 0.94, W - 10, H * 0.032, 600, '#1E9E5A');
    });
  }

  function signedIn() {
    if (!cloudSt.signedOut) return true;
    ui.info('🔒 You are signed out', '<p>The cupboard is locked. Press <b>Sign in again</b> to open it.</p>');
    return false;
  }
  async function fly(from, to, { up = 1.2, duration = 0.9, scale = 0.6 } = {}) {
    flyer.visible = true;
    flyer.scale.setScalar(scale);
    await stage.tween((k) => {
      flyer.position.lerpVectors(from, to, k);
      flyer.position.y += Math.sin(k * Math.PI) * up;
      flyer.rotation.y = k * Math.PI * 2;
    }, duration);
    flyer.visible = false;
  }
  const cupSpot = () => cup.localToWorld(new THREE.Vector3(0.45, 1.5, 0.2));
  const pcSpot = () => pc.localToWorld(new THREE.Vector3(0, 1.42, 0));

  async function makeFolder() {
    if (busy || !signedIn()) return;
    const name = folderField.value.trim();
    if (!name) {
      ui.info('📁 Name the folder first', '<p>Type a folder name using the BIH naming standard, for example <b>TechClub_OpenDay_Team3</b>.</p>');
      return folderField.focus();
    }
    if (!NAME_RULE.test(name)) {
      ui.info('📁 Use the naming standard', `<p>"${esc(name)}" does not follow the BIH naming standard: words joined by underscores, no spaces or strange symbols, for example <b>TechClub_OpenDay_Team3</b>.</p><p>A clear name means everyone in the team can find the folder on any device.</p>`);
      return folderField.focus();
    }
    if (cloudSt.folder === name) {
      ui.info('📁 Already there', `<p>The folder <b>${esc(name)}</b> is already in the cupboard. Now <b>upload</b> your poster into it.</p>`);
      return;
    }
    setBusy(true);
    cloudSt.folder = name;
    cloudSt.poster = null;
    posterInFolder.visible = false;
    cloudSt.phone = false;
    redraw(nfLabel, (g, W, H) => labelDraw(g, W, H, name));
    newFolder.visible = true;
    await stage.tween((k) => newFolder.scale.setScalar(0.01 + k * 0.99), 0.4);
    drawMonitor();
    drawPhone();
    drawScreen();
    ui.info('📁 Folder made in the cloud', `<p><b>${esc(name)}</b> is now in your cloud cupboard (New → New folder). Next, <b>upload</b> your Session 27 poster into it.</p>`);
    setBusy(false);
  }
  async function upload() {
    if (busy || !signedIn()) return;
    if (!cloudSt.folder) {
      ui.info('📁 Make a folder first', '<p>Keep the cupboard tidy: make the team folder first, then upload into it.</p>');
      return;
    }
    if (cloudSt.poster) {
      ui.info('⬆️ Already uploaded', `<p>Your poster is in <b>${esc(cloudSt.folder)}</b>. Try <b>downloading</b> a file, or <b>open it on your phone</b>.</p>`);
      return;
    }
    setBusy(true);
    cloudSt.poster = 'sync';
    drawMonitor();
    drawScreen();
    ui.info('⬆️ Uploading…', '<p>The arrows icon means <b>syncing now</b>: the file is travelling from Hub PC-04 to the company\'s servers, the cloud.</p>');
    await fly(pcSpot(), cupSpot());
    posterInFolder.visible = true;
    await stage.wait(0.6);
    cloudSt.poster = 'tick';
    drawMonitor();
    drawScreen();
    storeText();
    ui.info('✅ Uploaded', `<p><b>${POSTER}</b> is in the cloud. The <b>green tick</b> means it is in the cloud <b>and also on this PC</b>.</p><p>Now it can be opened from any computer or phone you sign in on.</p>`);
    setBusy(false);
  }
  async function downloadRules() {
    if (busy || !signedIn()) return;
    if (cloudSt.downloaded) {
      ui.info('⬇️ Already downloaded', `<p>A copy of <b>${RULES}</b> is in your Downloads folder.</p>`);
      return;
    }
    setBusy(true);
    ui.info('⬇️ Downloading…', `<p>${RULES} had a <b>cloud icon</b>: it was <b>online only</b>, not on this PC. Downloading puts a copy in your <b>Downloads</b> folder (right-click → Download).</p>`);
    cloudSt.rules = 'sync';
    drawMonitor();
    await fly(cup.localToWorld(new THREE.Vector3(-0.55, 1.5, 0.2)), download.position.clone(), { scale: 0.5 });
    download.visible = true;
    cloudSt.rules = 'tick';
    cloudSt.downloaded = true;
    drawMonitor();
    drawScreen();
    ui.info('✅ Downloaded', `<p>The icon changed from a <b>cloud</b> (online only) to a <b>green tick</b> (also on this PC). Now you could read it even with no internet.</p>${cloudSt.poster ? '' : '<p>Next: upload your poster.</p>'}`);
    setBusy(false);
  }
  async function openOnPhone() {
    if (busy || !signedIn()) return;
    if (!cloudSt.poster) {
      ui.info('📱 Nothing to open yet', `<p>The phone can only see what is in the cloud. ${cloudSt.folder ? 'Upload your poster' : 'Make a folder and upload your poster'} first.</p>`);
      return;
    }
    setBusy(true);
    stage.reveal();
    await fly(cloud.getWorldPosition(new THREE.Vector3()), phone.localToWorld(new THREE.Vector3(0, 0.5, 0.1)), { scale: 0.5, up: 0.6 });
    cloudSt.phone = true;
    drawPhone();
    ui.info('📱 Opened on another device', '<p>On the trotro, you signed in on your phone and the poster is there. This is <b>sync</b>: one file in the cloud, and every device you sign in on sees the newest copy.</p><p>On the phone it shows a cloud icon: online only, so it is not using up the phone\'s storage.</p>' + (cloudSt.downloaded && !ui.isDone('cloud') ? '<p>Last step: you are on a shared Hub PC, so press <b>Sign out</b>.</p>' : ''));
    setBusy(false);
  }
  async function signOut() {
    if (busy) return;
    setBusy(true);
    const closing = !cloudSt.signedOut;
    cloudSt.signedOut = closing;
    if (!closing) lock.visible = false;
    await stage.tween((k) => doors.forEach(({ hinge, s }) => (hinge.rotation.y = s * 1.95 * (closing ? 1 - k : k))), 0.6);
    lock.visible = closing;
    drawMonitor();
    storeText();
    setBusy(false);
    if (!closing) {
      ui.info('🔑 Signed in again', '<p>The cupboard is open. Remember to sign out before you leave the PC.</p>');
      return;
    }
    if (checkCloud(true)) return;
    const todo = [];
    if (!cloudSt.folder) todo.push('make a folder');
    if (!cloudSt.poster) todo.push('upload your poster');
    if (!cloudSt.downloaded) todo.push(`download ${RULES}`);
    if (!cloudSt.phone) todo.push('open the poster on your phone');
    ui.info('🔒 Signed out', `<p>Well done for locking the cupboard: on a shared PC the next person cannot open your files. Never tick "Stay signed in" on a club computer.</p>${todo.length ? `<p>For the mission, sign in again and ${todo.join(', ')}, then sign out at the end.</p>` : ''}`);
  }
  function checkCloud(atSignOut) {
    const all = cloudSt.folder && cloudSt.poster === 'tick' && cloudSt.downloaded && cloudSt.phone;
    if (all && atSignOut && !ui.isDone('cloud')) {
      ui.complete('cloud');
      ui.info('✅ Cupboard locked!', '<p>Folder, upload, download, another device, and you signed out of the shared PC. The cloud is a cupboard, so you locked it!</p>');
      return true;
    }
    return false;
  }

  // ---------- Clicking the model (a bonus: every action has a button) ----------
  stage.clickable(cal, () => f('title').focus());
  stage.clickable(screen, () => (call.in ? toggleMic() : join()));
  stage.clickable(cup, () => (cloudSt.signedOut ? signOut() : folderField.focus()));
  stage.clickable(phone, () => openOnPhone());

  stage.onTick((dt, t) => {
    cloud.position.y = CH + 0.4 + Math.sin(t * 1.3) * 0.04;
    if (call.toastT > 0 && (call.toastT -= dt) <= 0) {
      call.toast = '';
      drawScreen();
    }
    if (call.in && !call.muted && !call.speaking && !busy) {
      idle += dt;
      if (idle > 2) {
        idle = -4;
        noise();
        drawScreen();
      }
    }
    if (noiseTag.visible) noiseTag.position.y = 2.0 + Math.abs(Math.sin(t * 6)) * 0.08;
  });

  drawCal();
  drawScreen();
  drawMonitor();
  drawPhone();
  callButtons();
  storeText();
  ui.info('Club Planner 📅', '<p>The club noticeboard, meeting room and cupboard have moved online.</p><p><b>1.</b> Plan a meeting on the wall <b>calendar</b> and invite Kofi, Esi and Yaw. <b>2.</b> Join the <b>video call</b> and show good meeting manners. <b>3.</b> Use the <b>cloud cupboard</b>, then sign out.</p><p>Nothing here is sent to real people.</p>');
}

// ---------- Models ----------

// A simple standing or seated club member. armR swings up to raise a hand.
function person({ shirt, skin, seated = false }) {
  const group = new THREE.Group();
  const hip = seated ? 0.52 : 0.72;
  if (seated) {
    const thighs = rbox(0.34, 0.14, 0.42, 0x2b2730, 0.06);
    thighs.position.set(0, hip, 0.14);
    const shins = rbox(0.32, 0.46, 0.14, 0x2b2730, 0.05);
    shins.position.set(0, 0.25, 0.32);
    group.add(thighs, shins);
  } else {
    const legs = rbox(0.34, hip, 0.2, 0x2b2730, 0.06);
    legs.position.y = hip / 2;
    group.add(legs);
  }
  const body = rbox(0.48, 0.6, 0.28, shirt, 0.12);
  body.position.y = hip + 0.3;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), mat(skin));
  head.position.y = hip + 0.78;
  head.castShadow = true;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x1b1410));
  hair.position.y = hip + 0.8;
  group.add(body, head, hair);
  const armL = rbox(0.11, 0.5, 0.12, shirt, 0.05);
  armL.position.set(-0.3, hip + 0.32, 0);
  group.add(armL);
  const armR = new THREE.Group();
  armR.position.set(0.3, hip + 0.56, 0);
  const arm = rbox(0.11, 0.5, 0.12, shirt, 0.05);
  arm.position.y = -0.24;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), mat(skin));
  hand.position.y = -0.5;
  armR.add(arm, hand);
  group.add(armR);
  return { group, armR };
}

function chair() {
  const g = new THREE.Group();
  const seat = rbox(0.5, 0.06, 0.5, COLORS.red, 0.02);
  seat.position.y = 0.48;
  const back = rbox(0.5, 0.5, 0.05, COLORS.red, 0.02);
  back.position.set(0, 0.76, -0.23);
  g.add(seat, back);
  for (const x of [-0.2, 0.2]) for (const z of [-0.2, 0.2]) {
    const leg = rbox(0.04, 0.46, 0.04, 0x3b3f46, 0.01);
    leg.position.set(x, 0.23, z);
    g.add(leg);
  }
  return g;
}

function labelDraw(g, W, H, text) {
  g.fillStyle = '#FFFFFF';
  g.beginPath();
  g.roundRect(2, 2, W - 4, H - 4, 6);
  g.fill();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fit(g, text, W / 2, H * 0.55, W - 12, H * 0.55, 700, '#24182E');
}
function folderLabel(text) {
  const d = decal(0.56, 0.14, (g, W, H) => labelDraw(g, W, H, text), { px: 48 });
  return d;
}

// A sheet of paper (a file) with a coloured poster on it.
function posterSheet(name) {
  const d = decal(0.34, 0.44, (g, W, H) => {
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, W, H);
    if (name) {
      g.fillStyle = '#CA1F3F';
      g.fillRect(0, 0, W, H * 0.16);
      g.fillStyle = '#D9D3DE';
      for (let i = 0; i < 6; i++) g.fillRect(W * 0.12, H * (0.28 + i * 0.1), W * (i % 3 === 2 ? 0.5 : 0.76), H * 0.04);
      return;
    }
    g.fillStyle = '#24182E';
    g.fillRect(W * 0.08, H * 0.06, W * 0.84, H * 0.88);
    g.fillStyle = '#FFBE00';
    g.fillRect(W * 0.16, H * 0.16, W * 0.68, H * 0.12);
    g.fillStyle = '#FFFFFF';
    g.fillRect(W * 0.16, H * 0.36, W * 0.68, H * 0.28);
    g.fillStyle = '#2EC4B6';
    g.fillRect(W * 0.16, H * 0.72, W * 0.5, H * 0.06);
  }, { px: 64, transparent: false });
  d.material.side = THREE.DoubleSide;
  return d;
}

// A toy trotro (Ghanaian minibus), with a slogan on its back.
function buildTrotro() {
  const g = new THREE.Group();
  const body = rbox(1.25, 0.55, 0.6, 0xf2e6c9, 0.1);
  body.position.y = 0.38;
  const stripe = rbox(1.27, 0.08, 0.62, COLORS.blue, 0.03);
  stripe.position.y = 0.3;
  const roof = rbox(1.0, 0.06, 0.52, 0x3b3f46, 0.02);
  roof.position.y = 0.69;
  const rack = rbox(0.5, 0.12, 0.3, COLORS.gold, 0.03);
  rack.position.set(-0.1, 0.78, 0);
  g.add(body, stripe, roof, rack);
  const windows = decal(1.1, 0.2, (c, W, H) => {
    c.fillStyle = '#5a7a96';
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.roundRect(4 + i * (W / 5), 4, W / 5 - 10, H - 8, 6);
      c.fill();
    }
  }, { px: 48 });
  windows.position.set(0, 0.5, 0.305);
  const slogan = decal(0.5, 0.14, (c, W, H) => {
    c.fillStyle = '#CA1F3F';
    c.fillRect(0, 0, W, H);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    fit(c, 'GOD DEY', W / 2, H * 0.55, W - 8, H * 0.65, 800, '#FFFFFF');
  }, { px: 40 });
  slogan.rotation.y = Math.PI / 2;
  slogan.position.set(0.63, 0.45, 0);
  g.add(windows, slogan);
  const wheelGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16);
  const wheelMat = mat(0x1b1b1f);
  for (const x of [-0.38, 0.38]) for (const z of [-0.3, 0.3]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.11, z);
    g.add(w);
  }
  return g;
}

export const config = { camera: [3.4, 7.4, 11.6], target: [0.4, 1.3, -0.6], shadowSize: 9, frame: 0.84 };

export const missions = [
  { id: 'invite', text: 'Schedule a club meeting with a title, date, start and end time and a reminder, then invite Kofi, Esi and Yaw.', hint: 'Fill in the calendar form, tick the three members under "Add guests" and press "Save and send". Watch their replies.' },
  { id: 'call', text: 'In the video call, turn your camera off or on, raise your hand, say hello, mute again and share your screen.', hint: 'Press "Join call". When the noise starts, mute. Raise ✋, wait for the host, unmute, say hello, then mute again.' },
  { id: 'cloud', text: 'In the cloud cupboard, make a folder, upload your poster, download a copy of a file, open the poster on your phone, then sign out.', hint: 'Name the folder with the naming standard, e.g. TechClub_OpenDay_Team3 (no spaces). Sign out comes last.' },
];
