// Sessions 34 & 35 — Feed Check: a pretend social media app on a 3D phone,
// with the feed shown as a wall of cards behind it.
// 1. W.A.I.T. (Who? Anyone else? Image? Time?) on 6 posts: share the real ones, stop the fakes.
// 2. A bullying comment: don't reply; screenshot, block, report, support the target,
//    tell an adult; then fix the 4 privacy settings.
// 3. The feed loop: linger on one topic and watch the feed fill up with it, then pop the bubble.
// Every account and post is made up. Nothing is real, political or religious.
import { THREE, COLORS, rbox, mat, decal } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const C = { plum: '#24182e', purple: '#5a4470', gold: '#ffbe00', red: '#ca1f3f', green: '#2ec4b6', teal: '#2a9d8f', grey: '#d9d3de', sky: '#f4f0f6', muted: '#6b6075', blue: '#1a73e8' };

// ---------- Part 1: posts to check with W.A.I.T. ----------
const POSTS = [
  {
    name: 'Ghana Newz Update 24/7', handle: '@ghananewz247', tick: false, av: '#9b91a4', when: '1h', img: 'flood', likes: '8.1K', shares: '12K', fake: true,
    text: 'BREAKING!!! This is Kaneshie RIGHT NOW. All schools in Accra closed tomorrow by order of the Ministry. Share to every parent before they delete it!!!',
    W: ['Page created last week', 'A page called “Ghana Newz Update 24/7”, <b>created last week</b>. “Newz” is spelt wrong. It is not a real news organisation.'],
    A: ['No trusted news says so', 'You search “Accra schools closed”: <b>no trusted news website</b> reports it, and the Ministry of Education\'s own page says schools are open.'],
    I: ['Photo is from 2015', 'A reverse image search finds this flood photo on pages from <b>2015</b>. An old photo with a new story.'],
    T: ['“Before they delete it!”', '“Share before they delete it!!!” is <b>pressure, not proof</b>.'],
  },
  {
    name: 'Bozoma Community Radio', handle: '@bozomaradio', tick: true, av: '#2a9d8f', when: '3h', img: 'market', likes: '420', shares: '96', fake: false,
    text: 'Bozoma market opens at 9 am this Saturday, after the community clean-up. Bring a broom! 🧹',
    W: ['Official, 6 years old', 'The radio station\'s <b>official account</b>: it has the tick and has posted for 6 years.'],
    A: ['Assembly says the same', 'The Bozoma Assembly\'s page and the market women\'s association <b>say the same thing</b>.'],
    I: ['Photo is new', 'Reverse image search: this photo first appeared <b>today</b>, on the station\'s own page.'],
    T: ['Posted today, calm', 'Posted this morning, about this Saturday. Calm words, and <b>no pressure</b> to share.'],
  },
  {
    name: 'Natural Cures Daily', handle: '@naturalcures_dly', tick: false, av: '#c8643c', when: '5h', img: 'lime', likes: '15K', shares: '30K', fake: true,
    text: 'Drinking hot water with lime CURES malaria in one day!!! Doctors don\'t want you to know. Share to save lives!',
    W: ['Sells “natural” products', 'A page that <b>sells “natural” products</b>. It is not a hospital or a health organisation.'],
    A: ['Health workers disagree', 'Trusted health websites and health workers say malaria needs a <b>test and proper medicine</b> from a clinic. No trusted source reports this “cure”.'],
    I: ['A recipe-site photo', 'The picture is a <b>stock photo</b> from a recipe website. It proves nothing about malaria.'],
    T: ['“Share to save lives!”', '“Doctors don\'t want you to know” and “share to save lives” are <b>pressure tricks</b>.'],
  },
  {
    name: 'Tamale Weather Watch', handle: '@tamaleweather_now', tick: false, av: '#6fa8dc', when: '2h', img: 'snow', likes: '22K', shares: '9.4K', fake: true,
    text: 'SNOW in Tamale this morning!!! ❄️ First time EVER! Look at this!!',
    W: ['Account is 2 days old', 'A <b>new account</b>, created 2 days ago, with only 3 posts.'],
    A: ['Weather: 38 °C, dry', 'The weather service says Tamale is <b>hot and dry, 38 °C</b> today. No news website mentions snow.'],
    I: ['Photo: Europe, 2019', 'Reverse image search: the photo is from a <b>town in Europe, taken in 2019</b>.'],
    T: ['New post, old photo', 'Posted today, but the photo is years old: <b>old photo, new story</b>.'],
  },
  {
    name: 'BIH Tech Club', handle: '@bih_techclub', tick: true, av: '#5a4470', when: '1d', img: 'oven', likes: '310', shares: '41', fake: false,
    text: 'Our science team built a solar oven from a box and some foil, and it baked bread! ☀️🍞',
    W: ['The club\'s own account', 'The club\'s <b>official account</b>, posting for 4 years.'],
    A: ['School news says so too', 'The school\'s newsletter and the mentor\'s page <b>share the same story</b>.'],
    I: ['Original photo', 'An <b>original photo</b>: it appears nowhere else online before yesterday.'],
    T: ['Posted yesterday', 'Posted yesterday, about yesterday. <b>No rush</b> to share.'],
  },
  {
    name: 'Ama Sky', handle: '@AmaSky_0fficial', tick: false, av: '#ca1f3f', when: '4h', img: 'deepfake', likes: '5.2K', shares: '7.7K', fake: true,
    text: '▶ VIDEO: “Hi fans! I\'m giving FREE phones to the first 500 people who send me their MoMo number!” 📱',
    W: ['“0fficial” with a zero', 'The name uses a <b>zero</b>: “AmaSky_<b>0</b>fficial”. The singer\'s real account has the tick and millions of followers.'],
    A: ['Her real page: nothing', 'Her real account and music news sites say <b>nothing</b> about free phones.'],
    I: ['Deepfake signs', '<b>Deepfake</b> signs: the lips don\'t match the words, and the edges of her face are blurry. The video was made with AI.'],
    T: ['“First 500 people!”', '“First 500 people!” rushes you. Free prizes for your MoMo number are <b>always a scam</b>.'],
  },
];
const WAIT = [['W', 'Who posted it?'], ['A', 'Anyone else reporting it?'], ['I', 'Image check'], ['T', 'Time and date']];

// ---------- Part 2: privacy settings ----------
const PRIVACY = [
  { id: 'private', icon: '🔐', name: 'Private account', good: true, on: 'Only people you approve see your posts.', off: 'Anyone in the world can see your posts.' },
  { id: 'friendsDm', icon: '✉️', name: 'Messages: friends only', good: true, on: 'Strangers can\'t message you.', off: 'Anyone, even strangers, can message you.' },
  { id: 'location', icon: '📍', name: 'Share my location', good: false, on: 'Your posts show where you are.', off: 'Your posts don\'t show where you are.' },
  { id: 'tags', icon: '🏷️', name: 'Approve tags first', good: true, on: 'You check posts others tag you in first.', off: 'Anyone can tag you, and it shows at once.' },
];

// ---------- Part 3: topics for the feed loop ----------
const TOPICS = {
  football: { icon: '⚽', name: 'Football', col: '#2a9d8f', titles: ['Top 10 goals of the week', 'Free-kick skills', 'Our school match!', 'Keepy-uppy challenge'] },
  music: { icon: '🎵', name: 'Music', col: '#5a4470', titles: ['New Afrobeats dance', 'Learn the xylophone', 'Drum circle jam'] },
  science: { icon: '🔬', name: 'Science', col: '#1a73e8', titles: ['Volcano experiment', 'Why is the sky blue?', 'Make a water filter'] },
  cooking: { icon: '🍲', name: 'Cooking', col: '#ca1f3f', titles: ['How to make kelewele', 'Perfect jollof rice', 'Easy groundnut soup'] },
  animals: { icon: '🐐', name: 'Animals', col: '#f4a11d', titles: ['Funny goat jumps', 'Baby elephant bath', 'Talking parrot'] },
  art: { icon: '🎨', name: 'Art', col: '#c8643c', titles: ['Draw a kente pattern', 'Chalk art on the wall', 'Paint a sunset'] },
};
const TKEYS = Object.keys(TOPICS);

export default function feedLab(stage, ui) {
  const { scene } = stage;
  const B = 0.4; // top of the platform

  // ---------- Platform ----------
  const base = rbox(11.5, 0.4, 7.2, 0xefe8f3, 0.12);
  base.position.y = 0.2;
  scene.add(base);
  const rug = decal(4.6, 3.0, (g, W, H) => {
    const cols = ['#ffbe00', '#2a9d8f', '#ca1f3f', '#24182e'];
    for (let i = 0; i < 20; i++) { g.fillStyle = cols[i % 4]; g.fillRect((i * W) / 20, 0, W / 20 + 1, H); }
    for (let j = 1; j < 10; j += 2) for (let i = 0; i < 10; i++) { g.fillStyle = (i + j) % 2 ? '#ffbe00' : '#24182e'; g.fillRect((i * W) / 10, (j * H) / 10, W / 10, H / 10); }
  }, { px: 128, transparent: false });
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, B + 0.003, 0.4);
  scene.add(rug);
  const rgeo = (w, h, d, r) => { const m = rbox(w, h, d, 0, r); m.material.dispose(); return m.geometry; };

  // ---------- The phone on its stand ----------
  const PW = 2.6, PH = 5.0, SW = 2.4, SH = 4.76;
  const standMat = mat(COLORS.purple, { roughness: 0.5 });
  const stand = new THREE.Group();
  const sBase = new THREE.Mesh(rgeo(1.9, 0.14, 1.5, 0.05), standMat);
  sBase.position.set(0, 0.07, -0.25);
  const sBack = new THREE.Mesh(rgeo(1.5, 2.6, 0.14, 0.05), standMat);
  sBack.position.set(0, 1.42, -0.4);
  sBack.rotation.x = -0.22;
  const sLip = new THREE.Mesh(rgeo(1.9, 0.3, 0.14, 0.05), standMat);
  sLip.position.set(0, 0.2, 0.42);
  for (const m of [sBase, sBack, sLip]) m.castShadow = m.receiveShadow = true;
  stand.add(sBase, sBack, sLip);
  stand.position.set(0, B, 0.5);
  stand.scale.setScalar(1.15);
  scene.add(stand);
  const phone = new THREE.Group();
  const body = rbox(PW, PH, 0.22, COLORS.purple, 0.3, { roughness: 0.35, metalness: 0.2 });
  body.position.y = PH / 2;
  const glass = rbox(PW - 0.1, PH - 0.1, 0.02, 0x0b090d, 0.26, { roughness: 0.2 });
  glass.position.set(0, PH / 2, 0.106);
  glass.userData.noInk = true;
  const screen = decal(SW, SH, () => {}, { px: 512, transparent: false });
  screen.position.set(0, PH / 2, 0.118);
  phone.add(body, glass, screen);
  const btnMat = mat(0x3d2c4a, { metalness: 0.4, roughness: 0.35 });
  for (const [h, y] of [[0.6, PH - 1.3], [0.9, PH - 2.3]]) {
    const b = new THREE.Mesh(rgeo(0.06, h, 0.1, 0.025), btnMat);
    b.position.set(PW / 2 + 0.02, y, 0);
    phone.add(b);
  }
  phone.position.set(0, B + 0.18, 0.6);
  phone.scale.setScalar(1.15);
  phone.rotation.x = -0.22;
  scene.add(phone);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const flashPlane = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), flashMat);
  flashPlane.position.set(0, PH / 2, 0.125);
  flashPlane.userData.noInk = true;
  phone.add(flashPlane);
  const topSpot = new THREE.Object3D();
  topSpot.position.set(SW / 2, PH * 0.7, 0.12);
  phone.add(topSpot);

  // ---------- The feed wall: 12 post cards ----------
  const wall = new THREE.Group();
  const board = rbox(8.2, 4.6, 0.24, 0x3d2c4a, 0.1);
  board.position.y = 2.3;
  wall.add(board);
  const title = decal(3.2, 0.5, (g, W, H) => {
    g.fillStyle = '#ffbe00';
    g.beginPath(); g.roundRect(0, 0, W, H, H / 2); g.fill();
    g.fillStyle = '#24182e';
    g.font = `700 ${H * 0.55}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('YOUR FEED · FOR YOU', W / 2, H * 0.55);
  }, { px: 80 });
  title.position.set(-2.3, 4.62, 0.13);
  wall.add(title);
  const cardGeo = rgeo(1.7, 1.2, 0.06, 0.06);
  const cardMat = mat(0xffffff, { roughness: 0.6 });
  const slots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const grp = new THREE.Group();
    const cb = new THREE.Mesh(cardGeo, cardMat);
    cb.castShadow = true;
    const face = decal(1.6, 1.1, () => {}, { px: 128, transparent: false });
    face.position.z = 0.032;
    grp.add(cb, face);
    grp.position.set(-2.85 + c * 1.9, 3.65 - r * 1.38, 0.16);
    wall.add(grp);
    slots.push({ grp, face, topic: null, i: r * 4 + c });
  }
  wall.position.set(0, B, -2.4);
  scene.add(wall);
  function drawCard(slot, topic) {
    const c = slot.face.material.map.image, g = c.getContext('2d'), W = c.width, H = c.height, T = TOPICS[topic];
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = T.col;
    g.fillRect(0, 0, W, H * 0.64);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${H * 0.36}px ${FONT}`;
    g.fillText(T.icon, W / 2, H * 0.33);
    g.fillStyle = '#24182e';
    g.font = `700 ${H * 0.15}px ${FONT}`;
    g.fillText(T.name, W / 2, H * 0.78);
    g.fillStyle = '#9b91a4';
    g.fillRect(W * 0.2, H * 0.9, W * 0.6, H * 0.03);
    slot.face.material.map.needsUpdate = true;
  }

  // ---------- W.A.I.T. blocks ----------
  const blocks = {};
  const blockCols = { W: COLORS.gold, A: COLORS.red, I: COLORS.green, T: 0x6fa8dc };
  const waitGroup = new THREE.Group();
  ['W', 'A', 'I', 'T'].forEach((L, i) => {
    const grp = new THREE.Group();
    const cube = rbox(0.82, 0.82, 0.82, blockCols[L], 0.1);
    cube.position.y = 0.41;
    const letter = (big) => decal(0.66, 0.66, (g, W, H) => {
      g.fillStyle = '#ffffff';
      g.font = `700 ${H * (big ? 0.78 : 0.6)}px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(L, W / 2, H * 0.56);
    }, { px: 96 });
    const front = letter(true);
    front.position.set(0, 0.41, 0.415);
    const top = letter(false);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, 0.825, 0);
    grp.add(cube, front, top);
    grp.position.set(-4.2 + i * 0.98, B, 2.3 - i * 0.12);
    grp.rotation.y = 0.2 - i * 0.05;
    waitGroup.add(grp);
    blocks[L] = { grp, cube };
  });
  scene.add(waitGroup);

  // ---------- The feed loop ----------
  const loop = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 8, 48), mat(COLORS.purple));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  loop.add(ring);
  const STEPS = [['👀', 'You watch'], ['📝', 'App records'], ['🔮', 'It predicts'], ['📈', 'Shows more']];
  const pads = STEPS.map(([ic, name], i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 2; // start at the back, go clockwise
    const p = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 0.16, 28), mat(0xffffff, { emissive: 0x000000 }));
    disc.position.y = 0.08;
    disc.castShadow = disc.receiveShadow = true;
    const face = decal(0.9, 0.9, (g, W, H) => {
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `${H * 0.42}px ${FONT}`;
      g.fillText(ic, W / 2, H * 0.38);
      g.fillStyle = '#24182e';
      g.font = `700 ${H * 0.16}px ${FONT}`;
      g.fillText(name, W / 2, H * 0.78);
    }, { px: 128 });
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.165;
    p.add(disc, face);
    p.position.set(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3);
    loop.add(p);
    return { p, disc, a };
  });
  const token = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(COLORS.gold, { emissive: 0x5a3a00, metalness: 0.3, roughness: 0.3 }));
  token.position.set(pads[0].p.position.x, 0.42, pads[0].p.position.z);
  loop.add(token);
  loop.position.set(3.7, B, 1.6);
  scene.add(loop);

  // ---------- Padlock (privacy) ----------
  const lock = new THREE.Group();
  const lBody = rbox(1.0, 0.85, 0.42, COLORS.gold, 0.12, { metalness: 0.35, roughness: 0.35 });
  lBody.position.y = 0.43;
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 10, 24, Math.PI), mat(0xb9b2c2, { metalness: 0.7, roughness: 0.3 }));
  shackle.position.set(0, 0.86, 0);
  const hole = decal(0.24, 0.34, (g, W, H) => {
    g.fillStyle = '#24182e';
    g.beginPath(); g.arc(W / 2, H * 0.35, W * 0.3, 0, 7); g.fill();
    g.fillRect(W * 0.4, H * 0.35, W * 0.2, H * 0.5);
  }, { px: 48 });
  hole.position.set(0, 0.42, 0.215);
  lock.add(lBody, shackle, hole);
  lock.position.set(-3.3, B, -0.9);
  lock.rotation.y = 0.35;
  scene.add(lock);
  function setLock(closed, animate = true) {
    const y1 = closed ? 0.86 : 1.12;
    const r1 = closed ? 0 : 0.6;
    const y0 = shackle.position.y, r0 = shackle.rotation.y;
    if (!animate) { shackle.position.y = y1; shackle.rotation.y = r1; return; }
    stage.tween((k) => { shackle.position.y = y0 + (y1 - y0) * k; shackle.rotation.y = r0 + (r1 - r0) * k; }, 0.4);
  }
  setLock(false, false);

  // ---------- Drawing helpers for the phone screen ----------
  const scr = screen.material.map.image;
  const g = scr.getContext('2d');
  const W = scr.width, H = scr.height;
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
    while (max && g.measureText(s).width > max && px > 11) g.font = f((px -= 1), weight);
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillText(s, x, y);
  }
  function para(s, x, y, maxW, { size = 22, weight = 400, color = C.plum, lh = 30, maxLines = 9 } = {}) {
    g.font = f(size, weight);
    const lines = [];
    let cur = '';
    for (const wd of String(s).split(' ')) {
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
  function avatar(x, y, r, col, letter) {
    g.fillStyle = col;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    txt(letter, x, y + 1, { size: r, weight: 700, color: '#fff', align: 'center' });
  }
  function chrome(tab) {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = C.plum;
    g.fillRect(0, 0, W, 130);
    txt('10:45', 28, 28, { size: 21, weight: 600, color: '#fff' });
    g.fillStyle = '#0b090d';
    g.beginPath(); g.arc(W / 2, 28, 12, 0, 7); g.fill();
    txt('64% ▮', W - 28, 28, { size: 19, weight: 600, color: '#fff', align: 'right' });
    rr(24, 66, 46, 46, 14, C.gold);
    txt('C', 47, 90, { size: 30, weight: 700, color: C.plum, align: 'center' });
    txt('Chatter', 84, 90, { size: 30, weight: 700, color: '#fff' });
    txt(tab, W - 28, 90, { size: 20, color: '#d9d3de', align: 'right' });
    // Bottom bar
    g.fillStyle = '#f4f0f6';
    g.fillRect(0, H - 80, W, 80);
    ['🏠', '🔍', '➕', '💬', '👤'].forEach((ic, i) => txt(ic, W * (0.1 + i * 0.2), H - 42, { size: 28, align: 'center' }));
  }

  // Little pictures for the posts.
  function picture(kind, x, y, w, h) {
    g.save();
    g.beginPath(); g.roundRect(x, y, w, h, 18); g.clip();
    const sky = (top, bot) => { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(x, y, w, h); };
    if (kind === 'flood') {
      sky('#8a96a8', '#c3c9d2');
      for (let i = 0; i < 5; i++) { g.fillStyle = ['#c8643c', '#d9d3de', '#a05030', '#e8e2ee', '#8a6a4a'][i]; g.fillRect(x + 20 + i * w / 5, y + h * 0.3 - (i % 2) * 20, w / 6, h * 0.4); g.fillStyle = '#5a4470'; g.beginPath(); g.moveTo(x + 14 + i * w / 5, y + h * 0.3 - (i % 2) * 20); g.lineTo(x + 20 + i * w / 5 + w / 12, y + h * 0.18 - (i % 2) * 20); g.lineTo(x + 26 + i * w / 5 + w / 6, y + h * 0.3 - (i % 2) * 20); g.fill(); }
      g.fillStyle = '#7a6a4a'; g.fillRect(x, y + h * 0.58, w, h * 0.42);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3;
      for (let k = 0; k < 6; k++) { g.beginPath(); for (let xx = x; xx < x + w; xx += 20) g.lineTo(xx, y + h * 0.65 + k * 16 + Math.sin(xx / 15 + k) * 4); g.stroke(); }
    } else if (kind === 'market') {
      sky('#ffd97a', '#fff3cf');
      for (let i = 0; i < 4; i++) {
        const sx = x + 16 + i * (w - 32) / 4;
        g.fillStyle = ['#ca1f3f', '#2a9d8f', '#ffbe00', '#5a4470'][i];
        g.beginPath(); g.moveTo(sx, y + h * 0.42); g.lineTo(sx + (w - 32) / 8, y + h * 0.22); g.lineTo(sx + (w - 32) / 4 - 8, y + h * 0.42); g.fill();
        g.fillStyle = '#c8a27a'; g.fillRect(sx + 6, y + h * 0.42, (w - 32) / 4 - 20, h * 0.36);
        for (let j = 0; j < 3; j++) { g.fillStyle = ['#ff8c1a', '#3aa655', '#ffbe00'][j]; g.beginPath(); g.arc(sx + 20 + j * 18, y + h * 0.5, 8, 0, 7); g.fill(); }
      }
      g.fillStyle = '#d9b98a'; g.fillRect(x, y + h * 0.8, w, h * 0.2);
    } else if (kind === 'lime') {
      sky('#f4f0f6', '#e8e2ee');
      g.fillStyle = '#ffffff'; g.strokeStyle = '#9b91a4'; g.lineWidth = 4;
      g.beginPath(); g.roundRect(x + w * 0.3, y + h * 0.3, w * 0.28, h * 0.55, 14); g.fill(); g.stroke();
      g.beginPath(); g.arc(x + w * 0.6, y + h * 0.55, h * 0.12, -1.2, 1.2); g.stroke();
      g.strokeStyle = 'rgba(155,145,164,0.6)';
      for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + w * (0.37 + k * 0.07), y + h * 0.25); g.quadraticCurveTo(x + w * (0.4 + k * 0.07), y + h * 0.15, x + w * (0.37 + k * 0.07), y + h * 0.06); g.stroke(); }
      g.fillStyle = '#7bc043'; g.beginPath(); g.arc(x + w * 0.75, y + h * 0.7, h * 0.14, 0, 7); g.fill();
      g.fillStyle = '#d4f0a0'; g.beginPath(); g.arc(x + w * 0.75, y + h * 0.7, h * 0.1, 0, 7); g.fill();
    } else if (kind === 'snow') {
      sky('#b9c6d6', '#eef2f7');
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + w / 2, y + h, w * 0.7, h * 0.35, 0, 0, 7); g.fill();
      g.fillStyle = '#3d5a3d';
      for (let i = 0; i < 3; i++) { const tx = x + w * (0.18 + i * 0.3); g.beginPath(); g.moveTo(tx, y + h * 0.25); g.lineTo(tx - 30, y + h * 0.72); g.lineTo(tx + 30, y + h * 0.72); g.fill(); }
      g.fillStyle = '#ffffff';
      for (let k = 0; k < 40; k++) { g.beginPath(); g.arc(x + ((k * 97) % w), y + ((k * 53) % h), 3, 0, 7); g.fill(); }
    } else if (kind === 'oven') {
      sky('#ffe58a', '#fff6d6');
      g.fillStyle = '#ffbe00'; g.beginPath(); g.arc(x + w * 0.82, y + h * 0.22, 34, 0, 7); g.fill();
      g.fillStyle = '#c8a27a'; g.fillRect(x + w * 0.2, y + h * 0.45, w * 0.5, h * 0.4);
      g.fillStyle = '#d9d3de'; g.beginPath(); g.moveTo(x + w * 0.2, y + h * 0.45); g.lineTo(x + w * 0.3, y + h * 0.18); g.lineTo(x + w * 0.7, y + h * 0.18); g.lineTo(x + w * 0.7, y + h * 0.45); g.fill();
      g.fillStyle = '#c8843c'; g.beginPath(); g.ellipse(x + w * 0.45, y + h * 0.62, 50, 24, 0, 0, 7); g.fill();
    } else if (kind === 'deepfake') {
      sky('#5a4470', '#24182e');
      g.fillStyle = '#8a5a3c'; g.beginPath(); g.arc(x + w / 2, y + h * 0.42, h * 0.22, 0, 7); g.fill();
      g.filter = 'blur(3px)';
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 8;
      g.beginPath(); g.arc(x + w / 2, y + h * 0.42, h * 0.23, 0, 7); g.stroke();
      g.filter = 'none';
      g.fillStyle = '#24182e'; g.fillRect(x + w / 2 - 26, y + h * 0.33, 12, 8); g.fillRect(x + w / 2 + 14, y + h * 0.33, 12, 8);
      g.fillStyle = '#ca1f3f'; g.beginPath(); g.ellipse(x + w / 2 + 6, y + h * 0.53, 22, 7, 0.2, 0, 7); g.fill();
      g.fillStyle = '#ca1f3f'; g.fillRect(x + w / 2 - h * 0.25, y + h * 0.66, h * 0.5, h * 0.34);
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x + w / 2, y + h / 2, 38, 0, 7); g.fill();
      g.fillStyle = C.plum; g.beginPath(); g.moveTo(x + w / 2 - 12, y + h / 2 - 20); g.lineTo(x + w / 2 + 22, y + h / 2); g.lineTo(x + w / 2 - 12, y + h / 2 + 20); g.fill();
    } else if (kind === 'lagoon') {
      sky('#9fd3e8', '#e8f6fb');
      g.fillStyle = '#2a9d8f'; g.fillRect(x, y + h * 0.55, w, h * 0.45);
      g.fillStyle = '#3aa655'; g.beginPath(); g.ellipse(x + w * 0.25, y + h * 0.57, w * 0.35, 30, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#ffbe00'; g.beginPath(); g.arc(x + w * 0.78, y + h * 0.25, 30, 0, 7); g.fill();
      g.strokeStyle = '#8a5a3c'; g.lineWidth = 6; g.beginPath(); g.moveTo(x + w * 0.62, y + h * 0.55); g.quadraticCurveTo(x + w * 0.6, y + h * 0.3, x + w * 0.66, y + h * 0.18); g.stroke();
      g.fillStyle = '#3aa655'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + w * 0.66, y + h * 0.18, 40, 10, k * 0.6, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 5; k++) g.fillRect(x + 30 + k * 80, y + h * 0.7 + (k % 2) * 20, 40, 4);
    }
    g.restore();
  }

  // ---------- State ----------
  let part = 1, busy = false, run = 0;
  // Part 1
  let pi = 0, right1 = 0, checked = new Set(), decided = null, results = [];
  // Part 2
  const bully = { replied: false, liked: false, screenshot: false, reported: false, blocked: false, kind: false, adult: false };
  const priv = { private: false, friendsDm: false, location: true, tags: false };
  let view2 = 'esi';
  // Part 3
  const weight = Object.fromEntries(TKEYS.map((k) => [k, 1]));
  let feed = []; // 12 topics, in feed order
  let titleIx = 0, bubbled = false, popped = false, signals = { watch: 0, like: 0, skip: 0 };

  // ---------- Screens ----------
  function drawPart1() {
    chrome('For you');
    const p = POSTS[pi];
    if (!p) {
      txt('🏁', W / 2, 340, { size: 90, align: 'center' });
      txt(`You judged ${right1} of ${POSTS.length} correctly`, W / 2, 460, { size: 26, weight: 700, align: 'center', max: W - 40 });
      return;
    }
    txt(`Post ${pi + 1} of ${POSTS.length}`, 28, 160, { size: 18, color: C.muted });
    avatar(60, 214, 30, p.av, p.name[0]);
    txt(p.name + (p.tick ? '  ✓' : ''), 104, 200, { size: 23, weight: 700, color: C.plum, max: W - 160 });
    txt(`${p.handle} · ${p.when}`, 104, 232, { size: 18, color: C.muted, max: W - 160 });
    const y = para(p.text, 28, 280, W - 56, { size: 21, lh: 29, maxLines: 5 });
    const iy = y + 6, ih = 210;
    picture(p.img, 24, iy, W - 48, ih);
    if (decided) {
      g.save();
      g.translate(W / 2, iy + ih / 2);
      g.rotate(-0.14);
      const fake = p.fake;
      rr(-150, -42, 300, 84, 16, fake ? 'rgba(202,31,63,0.92)' : 'rgba(42,157,143,0.92)');
      txt(fake ? '✋ FAKE' : '✓ CHECKED', 0, 2, { size: 40, weight: 700, color: '#fff', align: 'center' });
      g.restore();
    }
    txt(`♥ ${p.likes}     💬     ↗ ${p.shares}`, 28, iy + ih + 30, { size: 19, color: C.muted });
    // W.A.I.T. clue chips
    let cy = iy + ih + 66;
    for (const [L] of WAIT) {
      if (!checked.has(L)) continue;
      const bad = p.fake;
      rr(24, cy, W - 48, 48, 14, bad ? '#fde8ec' : '#e9f7f5');
      rr(32, cy + 8, 32, 32, 8, bad ? C.red : C.teal);
      txt(L, 48, cy + 25, { size: 20, weight: 700, color: '#fff', align: 'center' });
      txt(p[L][0], 76, cy + 25, { size: 19, weight: 600, color: bad ? C.red : C.teal, max: W - 120 });
      cy += 54;
    }
  }

  function drawPart2() {
    chrome(view2 === 'esi' ? 'Comments' : 'Settings');
    if (view2 === 'privacy') {
      txt('🔐 Privacy · Adwoa (14)', 28, 168, { size: 24, weight: 700 });
      txt('Social media is for ages 13+', 28, 200, { size: 18, color: C.muted });
      PRIVACY.forEach((s, i) => {
        const y = 230 + i * 120, on = priv[s.id], good = on === s.good;
        rr(20, y, W - 40, 108, 20, good ? '#e9f7f5' : '#faf8fb', good ? C.teal : '#ebe6ef');
        txt(s.icon, 56, y + 54, { size: 30, align: 'center' });
        txt(s.name, 92, y + 38, { size: 22, weight: 700, max: W - 210 });
        txt(on ? s.on : s.off, 92, y + 72, { size: 16, color: C.muted, max: W - 210 });
        rr(W - 104, y + 38, 62, 32, 16, on ? C.teal : '#b8b0c0');
        g.fillStyle = '#fff'; g.beginPath(); g.arc(on ? W - 58 : W - 88, y + 54, 12, 0, 7); g.fill();
      });
      const n = privOk();
      txt(n === 4 ? '✅ All 4 settings are safe' : `${n} of 4 settings are safe`, W / 2, 740, { size: 22, weight: 700, color: n === 4 ? C.teal : C.muted, align: 'center' });
      return;
    }
    // Esi's post
    avatar(60, 172, 28, '#c8643c', 'E');
    txt('Esi Owusu', 104, 160, { size: 22, weight: 700 });
    txt('@esi_draws · your classmate · 2h', 104, 190, { size: 17, color: C.muted, max: W - 130 });
    para('My first painting of the Bozoma lagoon 🎨 Be kind!', 28, 232, W - 56, { size: 20 });
    picture('lagoon', 24, 256, W - 48, 200);
    txt('Comments', 28, 486, { size: 20, weight: 700, color: C.muted });
    const list = [{ who: 'Kojo', col: '#2a9d8f', text: 'Wow, beautiful colours! 😍' }];
    if (!bully.blocked) list.push({ who: 'xx_jokerboy', col: '#3d2c4a', text: 'This is so ugly lol 😂 Nobody likes you Esi', cruel: true });
    else list.push({ who: '', text: 'Comment hidden: you blocked xx_jokerboy', hidden: true });
    if (bully.replied) {
      list.push({ who: 'Adwoa (you)', col: '#5a4470', text: 'You\'re the ugly one!' });
      if (!bully.blocked) list.push({ who: 'xx_jokerboy', col: '#3d2c4a', text: '😂😂 she got a bodyguard now. More fun!', cruel: true });
    }
    let y = 510;
    for (const c of list) {
      if (c.hidden) { rr(24, y, W - 48, 50, 14, '#f4f0f6'); txt('🚫 ' + c.text, 40, y + 25, { size: 17, color: C.muted, max: W - 80 }); y += 60; continue; }
      avatar(50, y + 26, 20, c.col, c.who[0].toUpperCase());
      rr(80, y, W - 104, 66, 16, c.cruel ? '#fde8ec' : '#f4f0f6');
      txt(c.who + (c.cruel && bully.reported ? '  · 🚩 reported' : ''), 96, y + 20, { size: 16, weight: 700, color: c.cruel ? C.red : C.plum, max: W - 140 });
      txt(c.text, 96, y + 46, { size: 18, max: W - 140 });
      y += 76;
    }
    if (bully.kind) {
      rr(24, y + 4, W - 48, 96, 18, '#fff6d6');
      txt('✉️ Private message to Esi', 40, y + 28, { size: 17, weight: 700, color: C.purple });
      txt('“Are you okay? That wasn\'t fair. Your painting is lovely!”', 40, y + 56, { size: 17, max: W - 80 });
      txt('Esi: “Thank you 💛 that really helps.”', 40, y + 82, { size: 17, color: C.teal, max: W - 80 });
    }
  }

  function drawPart3() {
    chrome('For you');
    txt('Your feed', 28, 162, { size: 22, weight: 700 });
    txt(`⏱ ${signals.watch}  ❤️ ${signals.like}  ⏭ ${signals.skip}`, W - 28, 162, { size: 18, color: C.muted, align: 'right' });
    visible().forEach((t, i) => {
      const T = TOPICS[t], y = 190 + i * 168;
      rr(20, y, W - 40, 152, 20, '#faf8fb', '#ebe6ef');
      rr(32, y + 12, 128, 128, 16, T.col);
      txt(T.icon, 96, y + 78, { size: 60, align: 'center' });
      txt(T.name.toUpperCase(), 178, y + 40, { size: 16, weight: 700, color: T.col });
      txt(titleFor(t, i), 178, y + 76, { size: 22, weight: 700, max: W - 210 });
      txt(`👁 ${(12 - i * 3) / 10 + 0.4}K views`, 178, y + 112, { size: 16, color: C.muted });
    });
    // What the app thinks you like.
    const y0 = 712;
    txt('🔮 What the app predicts you like', 28, y0, { size: 18, weight: 700, color: C.purple });
    const counts = allot();
    TKEYS.forEach((k, i) => {
      const T = TOPICS[k], x = 30 + i * 76, h = counts[k] * 16;
      g.fillStyle = '#ebe6ef';
      g.fillRect(x, y0 + 26, 56, 192);
      g.fillStyle = T.col;
      g.fillRect(x, y0 + 26 + 192 - h, 56, h);
      txt(T.icon, x + 28, y0 + 26 + 192 - h - 16, { size: 20, align: 'center' });
    });
    if (bubbled && !popped) {
      rr(70, 420, W - 140, 90, 20, 'rgba(202,31,63,0.94)');
      txt('🫧 Echo chamber!', W / 2, 450, { size: 26, weight: 700, color: '#fff', align: 'center' });
      txt('Only one topic gets in', W / 2, 484, { size: 18, color: '#fff', align: 'center' });
    }
  }

  function drawScreen() {
    g.save();
    [drawPart1, drawPart2, drawPart3][part - 1]();
    g.restore();
    screen.material.map.needsUpdate = true;
  }

  // ---------- Part 3 maths: share the 12 feed slots out by interest ----------
  function allot() {
    const sum = TKEYS.reduce((s, k) => s + weight[k], 0);
    const raw = TKEYS.map((k) => ({ k, v: (weight[k] / sum) * 12 }));
    const out = Object.fromEntries(raw.map((r) => [r.k, Math.floor(r.v)]));
    let left = 12 - Object.values(out).reduce((a, b) => a + b, 0);
    raw.sort((a, b) => (b.v % 1) - (a.v % 1)).forEach((r) => { if (left > 0) { out[r.k]++; left--; } });
    return out;
  }
  function buildFeed() {
    const counts = allot();
    // Keep cards that still fit, so only the changed ones flip.
    const need = { ...counts };
    const next = new Array(12).fill(null);
    slots.forEach((s, i) => { if (s.topic && need[s.topic] > 0) { next[i] = s.topic; need[s.topic]--; } });
    // Deal the rest out round-robin, so the topics are mixed across the wall.
    const pool = [];
    while (TKEYS.some((k) => need[k] > 0)) for (const k of TKEYS) if (need[k] > 0) { pool.push(k); need[k]--; }
    for (let i = 0; i < 12; i++) if (!next[i]) next[i] = pool.shift();
    feed = next;
    return next;
  }
  // The top three posts on the phone: the most "liked" topics first, but mixed while the feed is varied.
  function visible() {
    const counts = allot();
    const order = [...TKEYS].sort((a, b) => counts[b] - counts[a] || TKEYS.indexOf(a) - TKEYS.indexOf(b));
    const max = counts[order[0]];
    if (max >= 6) return [order[0], order[0], max >= 9 ? order[0] : order[1]];
    // A varied feed: rotate through the topics so every refresh looks different.
    return [0, 1, 2].map((i) => order[(i + titleIx) % order.length]);
  }
  const titleFor = (t, i) => TOPICS[t].titles[(titleIx + i) % TOPICS[t].titles.length];
  async function flipWall(animate = true) {
    const next = buildFeed();
    const changed = slots.filter((s, i) => s.topic !== next[i]);
    if (!animate) { slots.forEach((s, i) => { s.topic = next[i]; drawCard(s, next[i]); }); return; }
    await Promise.all(changed.map((s, n) => (async () => {
      await stage.wait(n * 0.06);
      await stage.tween((k) => (s.grp.rotation.y = (k * Math.PI) / 2), 0.18);
      s.topic = next[s.i];
      drawCard(s, s.topic);
      await stage.tween((k) => (s.grp.rotation.y = -Math.PI / 2 + (k * Math.PI) / 2), 0.18);
    })()));
  }
  async function runLoop() {
    // The gold token goes once round the loop: you watch → app records → it predicts → shows more.
    for (let i = 0; i < 4; i++) {
      const pad = pads[i];
      pad.disc.material.emissive.setHex(0x5a3a00);
      await stage.tween((k) => {
        const a = pad.a + (k * Math.PI) / 2;
        token.position.set(Math.cos(a) * 1.3, 0.42 + Math.sin(k * Math.PI) * 0.3, Math.sin(a) * 1.3);
      }, 0.32);
      pad.disc.material.emissive.setHex(0x000000);
      if (i === 2) flipWall();
    }
  }

  // ---------- Side panel ----------
  const tabs = ui.group('Three parts');
  const tabBtns = [
    ui.button('1 🔍 W.A.I.T.', () => showPart(1), { group: tabs }),
    ui.button('2 🛡️ Bully & privacy', () => showPart(2), { group: tabs }),
    ui.button('3 🔁 Feed loop', () => showPart(3), { group: tabs }),
  ];
  const box = ui.group('');
  const heading = (t) => ui.element(`<span class="lab-group-title">${esc(t)}</span>`, box);
  function setBusy(on) {
    busy = on;
    for (const b of box.querySelectorAll('button')) { b.setAttribute('aria-disabled', String(on)); b.style.opacity = on ? '0.5' : ''; }
  }
  function showPart(n) {
    if (busy) return;
    part = n;
    run++;
    ui.toggle(tabBtns, tabBtns[n - 1]);
    tabBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === n - 1)));
    [panel1, panel2, panel3][n - 1](true);
    drawScreen();
  }
  function keepFocus(fn) {
    const had = box.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    box.innerHTML = '';
    fn();
    if (had) ([...box.querySelectorAll('button')].find((b) => b.dataset.key === had) ?? box.querySelector('button'))?.focus();
  }
  const btn = (label, fn, o = {}) => {
    const b = ui.button(label, () => { if (!busy) fn(); }, { group: box, ...o });
    b.dataset.key = o.key ?? label;
    return b;
  };

  // ----- Part 1 -----
  function panel1(intro) {
    keepFocus(() => {
      const p = POSTS[pi];
      if (!p) {
        const perfect = right1 === POSTS.length;
        ui.element(`<div class="mail-card"><p class="mail-done">${perfect ? '🏆' : '🔁'} You judged <b>${right1} of ${POSTS.length}</b> posts correctly.</p><small class="mail-count">${perfect ? 'Brilliant detective work!' : 'Try again: use all four W.A.I.T. checks before you decide.'}</small></div>`, box);
        btn('↺ Check the posts again', () => { pi = 0; right1 = 0; results = []; checked = new Set(); decided = null; drawScreen(); panel1(); }, { primary: !perfect });
        if (perfect) btn('Next: 2 🛡️ Bully & privacy ▶', () => showPart(2), { primary: true });
        return;
      }
      heading(`Post ${pi + 1} of ${POSTS.length} · ✅ ${right1} right so far`);
      heading('Before you share, W.A.I.T.');
      for (const [L, q] of WAIT) btn(`${checked.has(L) ? '✔' : L} – ${q}`, () => doCheck(L), { key: L });
      heading('Your decision');
      if (!decided) {
        btn('↗️ Share it: looks real', () => decide(false), { key: 'share' });
        btn('✋ Don\'t share: it\'s fake', () => decide(true), { key: 'fake', primary: true });
      } else btn(pi + 1 < POSTS.length ? 'Next post ▶' : 'See my score ▶', () => { pi++; checked = new Set(); decided = null; drawScreen(); panel1(); stage.reveal(); }, { primary: true, key: 'next' });
    });
    if (intro && pi === 0 && !decided) ui.info('🔍 Before you share, W.A.I.T.', '<p>Six posts are going round. Some are true and some are <b>fake</b>. For each one, do the checks: <b>W</b>ho posted it? <b>A</b>nyone else reporting it? <b>I</b>mage check. <b>T</b>ime and date.</p><p>Then decide: share it, or stop it. <b>If you are not sure, don\'t share.</b></p>');
  }
  async function doCheck(L) {
    if (part !== 1 || !POSTS[pi]) return;
    const p = POSTS[pi];
    checked.add(L);
    drawScreen();
    panel1();
    ui.info(`${L} – ${WAIT.find((w) => w[0] === L)[1]}`, `<p>${p[L][1]}</p><p><small>${checked.size} of 4 checks done.</small></p>`);
    const b = blocks[L].grp;
    const y0 = B, r0 = b.userData.r0 ?? (b.userData.r0 = b.rotation.y);
    await stage.tween((k) => { b.position.y = y0 + Math.sin(k * Math.PI) * 0.5; b.rotation.y = r0 + k * Math.PI * 2; }, 0.5);
    b.position.set(b.position.x, y0, b.position.z);
    b.rotation.y = r0;
    blocks[L].cube.material.emissive.setHex(0x3a2a08);
    stage.wait(0.6).then(() => blocks[L].cube.material.emissive.setHex(0x000000));
  }
  function decide(saysFake) {
    if (decided || !POSTS[pi]) return;
    const p = POSTS[pi];
    const good = saysFake === p.fake;
    decided = saysFake ? 'fake' : 'share';
    results.push(good);
    if (good) right1++;
    // Show every clue once the decision is made.
    for (const [L] of WAIT) checked.add(L);
    drawScreen();
    stage.reveal();
    const clues = WAIT.map(([L, q]) => `<li><b>${L}</b> (${q}): ${p[L][1]}</li>`).join('');
    const head = good ? (p.fake ? '🕵️ Caught it! That post is fake' : '✅ Right: that one is true') : (p.fake ? '😟 Oh no, that was fake!' : '🤔 Actually, that one was true');
    const tail = p.fake ? (good ? '<p>You stopped it spreading. In a group chat you could kindly say “I checked: this isn\'t true.”</p>' : '<p>Sharing it sent a lie to everyone in your group. Next time, <b>W.A.I.T.</b> first.</p>') : (good ? '<p>Every check passed, so it is fine to share.</p>' : '<p>Every check passed: a trusted account, other sources agree, a new photo and calm words.</p>');
    ui.info(head, `<ul>${clues}</ul>${tail}`);
    if (pi === POSTS.length - 1 && right1 === POSTS.length) ui.complete('wait');
    panel1();
  }

  // ----- Part 2 -----
  const steps2 = () => [bully.screenshot, bully.blocked, bully.reported, bully.kind, bully.adult];
  const bullyOk = () => steps2().every(Boolean) && !bully.replied && !bully.liked;
  const privOk = () => PRIVACY.filter((s) => priv[s.id] === s.good).length;
  function panel2(intro) {
    keepFocus(() => {
      const v = [btn('💬 Esi\'s post', () => { view2 = 'esi'; drawScreen(); panel2(); }, { key: 'v-esi' }), btn('🔐 Privacy settings', () => { view2 = 'privacy'; drawScreen(); panel2(); stage.reveal(); }, { key: 'v-priv' })];
      ui.toggle(v, v[view2 === 'esi' ? 0 : 1]);
      if (view2 === 'esi') {
        const done = steps2().filter(Boolean).length;
        heading(`Someone is bullying Esi · ${done} of 5 safe steps done`);
        if (bully.replied || bully.liked) {
          btn('↺ Start this again', resetBully, { primary: true });
        }
        btn('💬 Reply: “You\'re the ugly one!”', () => doBully('reply'));
        btn('😂 Like the cruel comment', () => doBully('like'));
        btn(`${bully.screenshot ? '✔' : '📸'} Screenshot (keep evidence)`, () => doBully('screenshot'), { key: 'ss' });
        btn(`${bully.blocked ? '✔' : '🚫'} Block xx_jokerboy`, () => doBully('block'), { key: 'block' });
        btn(`${bully.reported ? '✔' : '🚩'} Report the comment`, () => doBully('report'), { key: 'report' });
        btn(`${bully.kind ? '✔' : '💌'} Send Esi a kind private message`, () => doBully('kind'), { key: 'kind' });
        btn(`${bully.adult ? '✔' : '🗣️'} Tell an adult you trust`, () => doBully('adult'), { key: 'adult' });
      } else {
        heading(`Adwoa's privacy · ${privOk()} of 4 safe`);
        PRIVACY.forEach((s) => btn(`${s.icon} ${s.name}: ${priv[s.id] ? 'ON' : 'OFF'}`, () => togglePriv(s), { key: s.id }));
      }
    });
    if (intro) ui.info('🛡️ Esi is being bullied', '<p>You are logged in as <b>Adwoa, age 14</b> (most apps are for 13+). Your classmate Esi posted her painting, and someone left a <b>cruel comment</b>.</p><p>Be an <b>upstander</b>: what should you do, and what should you <b>not</b> do? Then open <b>🔐 Privacy settings</b> and make Adwoa\'s account safer.</p>');
  }
  async function doBully(a) {
    if (part !== 2) return;
    if (view2 !== 'esi') { view2 = 'esi'; }
    const T = {
      reply: ['🤐 Don\'t reply!', '<p>Replying gives the bully the <b>reaction</b> they want, and look: now they are posting even more. Step 1 is always: <b>don\'t reply</b>.</p><p>Press <b>↺ Start this again</b> and try the safe steps.</p>'],
      like: ['😟 That makes it worse', '<p>Liking a cruel comment tells the bully (and the app) that people enjoy it. <b>Never like or share</b> a cruel post.</p><p>Press <b>↺ Start this again</b>.</p>'],
      screenshot: ['📸 Evidence saved', '<p>A screenshot keeps <b>evidence</b>, with the date and the name, in case an adult or the app needs to see it. Do this <b>before</b> you block.</p>'],
      block: ['🚫 Blocked', '<p><b>xx_jokerboy</b> can\'t contact you any more, and their comment is hidden from you.</p>'],
      report: ['🚩 Reported', '<p>Every app has a <b>Report</b> button. You chose “Bullying or harassment”. The app\'s team will review it and can remove the comment or the account.</p>'],
      kind: ['💌 You are an upstander!', '<p>A kind private message helps a lot: “Are you okay? That wasn\'t fair.” Esi now knows she is not alone.</p>'],
      adult: ['🗣️ Told an adult', '<p>You told <b>Mrs Owusu</b>, your mentor, and showed her the screenshot. A parent, teacher or mentor can help stop it. It is <b>never</b> the victim\'s fault.</p>'],
    };
    if (a === 'block' && !bully.screenshot && !bully.blocked) return ui.info('📸 Screenshot first!', '<p>Wait: once you block, the comment is hidden from you. Take a <b>screenshot</b> first, so you keep the evidence.</p>');
    if (a === 'reply') bully.replied = true;
    else if (a === 'like') bully.liked = true;
    else if (a === 'screenshot') {
      bully.screenshot = true;
      setBusy(true);
      await stage.tween((k) => (flashMat.opacity = Math.sin(k * Math.PI) * 0.9), 0.35);
      setBusy(false);
    } else if (a === 'block') bully.blocked = true;
    else if (a === 'report') bully.reported = true;
    else if (a === 'kind') bully.kind = true;
    else if (a === 'adult') bully.adult = true;
    drawScreen();
    stage.reveal();
    panel2();
    let html = T[a][1];
    const left = [['screenshot', '📸 screenshot'], ['blocked', '🚫 block'], ['reported', '🚩 report'], ['kind', '💌 support Esi'], ['adult', '🗣️ tell an adult']].filter(([k]) => !bully[k]).map(([, t]) => t);
    if (!bully.replied && !bully.liked) {
      if (left.length) html += `<p><small>Still to do: ${left.join(', ')}.</small></p>`;
      else html += `<p><b>All 5 safe steps done!</b> ${privOk() === 4 ? '' : 'Now open <b>🔐 Privacy settings</b> and make the account safer.'}</p>`;
    }
    ui.info(T[a][0], html);
    check2();
  }
  function resetBully() {
    Object.keys(bully).forEach((k) => (bully[k] = false));
    drawScreen();
    panel2();
    ui.info('↺ Try again', '<p>The cruel comment is back. This time: <b>don\'t reply</b>; screenshot, block, report, support Esi and tell an adult.</p>');
  }
  function togglePriv(s) {
    priv[s.id] = !priv[s.id];
    if (s.id === 'private') setLock(priv.private);
    drawScreen();
    stage.reveal();
    panel2();
    const good = priv[s.id] === s.good;
    const n = privOk();
    ui.info(`${s.icon} ${s.name}: ${priv[s.id] ? 'on' : 'off'}`, `<p>${priv[s.id] ? s.on : s.off} ${good ? '✅ Safer.' : '⚠️ Less safe.'}</p><p><small>${n} of 4 privacy settings are safe.${n === 4 ? '' : ' Safe: private account, messages from friends only, location off, approve tags first.'}</small></p>`);
    check2();
  }
  function check2() {
    if (bullyOk() && privOk() === 4 && !ui.isDone('bully')) {
      ui.complete('bully');
      ui.info('🏆 Safe and kind!', '<p>You didn\'t reply; you took a screenshot, blocked, reported, supported Esi and told an adult. And Adwoa\'s account is now <b>private</b>, with messages from friends only, location off and tag approval on.</p><p>Next: <b>3 🔁 Feed loop</b>.</p>');
    }
  }

  // ----- Part 3 -----
  function panel3(intro) {
    keepFocus(() => {
      const counts = allot();
      const top = Math.max(...Object.values(counts));
      heading(bubbled && !popped ? '🫧 Pop the bubble' : 'Linger on a post (watch it to the end)');
      if (!(bubbled && !popped)) {
        const seen = new Set();
        visible().forEach((t, i) => {
          if (seen.has(t)) return;
          seen.add(t);
          btn(`⏱ Watch to the end: ${TOPICS[t].icon} ${titleFor(t, i)}`, () => signal('watch', t), { key: 'w-' + t });
        });
        const t0 = visible()[0];
        btn(`❤️ Like the top post (${TOPICS[t0].name})`, () => signal('like', t0), { key: 'like' });
        btn('⏭ Scroll past the top post quickly', () => signal('skip', t0), { key: 'skip' });
      } else {
        const big = TKEYS.find((k) => counts[k] === top);
        btn(`🙅 “Not interested” on a ${TOPICS[big].name} post`, () => pop('not', big), { key: 'not' });
        btn('➕ Follow a mix of people and topics', () => pop('mix'), { key: 'mix' });
        TKEYS.filter((k) => k !== big).slice(0, 3).forEach((k) => btn(`🔍 Search for ${TOPICS[k].name.toLowerCase()}`, () => pop('search', k), { key: 's-' + k }));
      }
      btn('↺ Reset the feed', resetFeed, { key: 'reset' });
    });
    if (intro && !signals.watch && !signals.like) ui.info('🔁 The feed loop', '<p>The app watches what you do. The strongest signal is often simply <b>how long you watch</b>.</p><p>Pick one kind of post and keep <b>watching it to the end</b>. Watch the gold token go round the loop, and watch the wall behind the phone: that is your feed.</p>');
  }
  async function signal(kind, t) {
    if (busy || part !== 3) return;
    const r = run;
    if (kind === 'watch') { weight[t] += 3; TKEYS.forEach((k) => k !== t && (weight[k] *= 0.85)); signals.watch++; }
    if (kind === 'like') { weight[t] += 1.5; signals.like++; }
    if (kind === 'skip') { weight[t] = Math.max(0.2, weight[t] * 0.5); signals.skip++; }
    titleIx++;
    setBusy(true);
    stage.reveal();
    drawScreen();
    ui.info({ watch: '⏱ You watched it to the end', like: '❤️ You liked it', skip: '⏭ You scrolled past' }[kind], `<p>${{ watch: `The app <b>records</b> your watch time and <b>predicts</b>: “This person likes ${TOPICS[t].name.toLowerCase()}.” So it <b>shows more</b>.`, like: `A like tells the app: “${TOPICS[t].name} matters to me.”`, skip: `Scrolling past quickly says: “Not interested.” The app shows <b>less</b> ${TOPICS[t].name.toLowerCase()}.` }[kind]}</p>`);
    await runLoop();
    await stage.wait(0.5);
    setBusy(false);
    if (r !== run) return;
    const counts = allot();
    const top = TKEYS.reduce((a, b) => (counts[b] > counts[a] ? b : a));
    drawScreen();
    if (!bubbled && counts[top] >= 9) {
      bubbled = true;
      drawScreen();
      ui.info('🫧 You are in an echo chamber!', `<p>Look at the wall: <b>${counts[top]} of 12</b> posts are now ${TOPICS[top].name.toLowerCase()}. You lingered on it, so the app keeps showing more of the same. Everything else has nearly vanished.</p><p>The app's job is to <b>keep you scrolling</b> (to show you adverts), not to show you a mix. Now <b>pop the bubble</b>!</p>`);
    } else if (!bubbled) {
      ui.info('🔁 The feed is learning', `<p>${TOPICS[top].icon} ${TOPICS[top].name} now fills <b>${counts[top]} of 12</b> posts on the wall. ${kind === 'watch' ? 'Keep watching the same kind of post and see what happens.' : ''}</p>`);
    }
    panel3();
  }
  async function pop(kind, t) {
    if (busy) return;
    const counts0 = allot();
    const big = TKEYS.reduce((a, b) => (counts0[b] > counts0[a] ? b : a));
    if (kind === 'not') weight[big] *= 0.4;
    if (kind === 'mix') TKEYS.forEach((k) => k !== big && (weight[k] += 1.5));
    if (kind === 'search') weight[t] += 3;
    titleIx++;
    setBusy(true);
    await flipWall();
    setBusy(false);
    const counts = allot();
    const max = Math.max(...Object.values(counts));
    const kinds = TKEYS.filter((k) => counts[k] > 0).length;
    drawScreen();
    const WHY = { not: '“Not interested” tells the app to show <b>less</b> of it.', mix: 'Following a mix of people and topics lets other ideas back in.', search: `Searching for ${t && TOPICS[t].name.toLowerCase()} tells the app you like that too.` };
    if (max <= 5 && kinds >= 4) {
      popped = true;
      ui.complete('loop');
      drawScreen();
      ui.info('🎉 Bubble popped!', `<p>${WHY[kind]} Your feed has <b>${kinds} different topics</b> again.</p><p>Remember the loop: <b>you watch → the app records → it predicts → it shows more</b>. You are in charge, not the app. Follow a mix, tap “Not interested”, and get news from trusted news organisations too.</p>`);
    } else ui.info('🫧 Still a bubble', `<p>${WHY[kind]} But ${TOPICS[big].name.toLowerCase()} still fills <b>${max} of 12</b> posts. Do one more thing to let other topics in.</p>`);
    panel3();
  }
  function resetFeed() {
    TKEYS.forEach((k) => (weight[k] = 1));
    bubbled = popped = false;
    signals = { watch: 0, like: 0, skip: 0 };
    flipWall();
    drawScreen();
    panel3();
    ui.info('↺ A fresh feed', '<p>Every topic is back to the same amount. Linger on one kind of post and watch the wall.</p>');
  }

  // ---------- Clicking the model ----------
  for (const L of ['W', 'A', 'I', 'T']) stage.clickable(blocks[L].grp, () => (part === 1 ? doCheck(L) : ui.info('🔍 W.A.I.T.', '<p>Before you share: <b>W</b>ho posted it? <b>A</b>nyone else reporting it? <b>I</b>mage check. <b>T</b>ime and date. Open part <b>1</b> to use it.</p>')));
  stage.clickable(lock, () => { if (part !== 2) showPart(2); if (view2 !== 'privacy') { view2 = 'privacy'; drawScreen(); panel2(); } });
  stage.clickable(loop, () => ui.info('🔁 The feed loop', '<p><b>1. You watch</b> a post. <b>2. The app records</b> how long you watched, likes and shares. <b>3. It predicts</b> what you like. <b>4. It shows more</b> of it, at the top. Round and round, every time you scroll.</p>'));
  stage.clickable(wall, () => ui.info('📰 Your feed', '<p>The wall shows the 12 posts your feed is ready to show you. An <b>algorithm</b> chose every one, using the signals you gave it.</p>'));

  // ---------- Callouts (most important first: phones show only four) ----------
  stage.callout(waitGroup, { icon: '🔍', title: 'W.A.I.T.', text: 'Who? Anyone else? Image? Time? Check before you share.', at: [-2.7, 0.9, 2.15], dx: -20, dy: 110, onClick: () => showPart(1) });
  stage.callout(topSpot, { icon: '📱', title: 'Your feed', text: 'An algorithm picks every post you see.', dx: 150, dy: -40 });
  stage.callout(loop, { icon: '🔁', title: 'Feed loop', text: 'What you watch teaches the app what to show.', at: [0, 0.5, -1.3], dx: 70, dy: -100, onClick: () => showPart(3) });
  stage.callout(lock, { icon: '🔐', title: 'Privacy', text: 'Private account, friends-only messages, location off.', at: [0, 1.0, 0], dx: -50, dy: -100, onClick: () => showPart(2) });
  stage.callout(wall, { icon: '🫧', title: 'Echo chamber', text: 'Only one topic? Pop the bubble.', at: [3.6, 4.5, 0.1], dx: 80, dy: -40, onClick: () => showPart(3) });

  stage.onTick((dt, t) => {
    token.rotation.y += dt * 2;
    if (!busy) token.position.y = 0.42 + Math.sin(t * 2.5) * 0.05;
  });

  flipWall(false);
  showPart(1);
}

export const missions = [
  { id: 'wait', text: 'Use W.A.I.T. to judge all 6 posts correctly: share the true ones, stop the fakes.', hint: 'Press W, A, I and T for each post. A brand-new account, an old photo or “share before they delete it!” are clues.' },
  { id: 'bully', text: 'Help Esi without replying to the bully (screenshot, block, report, support her, tell an adult), then make all 4 privacy settings safe.', hint: 'Screenshot before you block. Privacy: private account on, messages friends only, location off, approve tags on.' },
  { id: 'loop', text: 'Linger on one kind of post until the feed fills up with it, then pop the bubble.', hint: 'In part 3, keep pressing “Watch to the end” on the same topic. Then use “Not interested” and “Follow a mix”.' },
];

export const config = { camera: [3, 8.5, 12.5], target: [0, 2.6, 0.2], shadowSize: 9, frame: 0.74, minDistance: 4 };
