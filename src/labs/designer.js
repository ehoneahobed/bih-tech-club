// Session 27 — Design with Canva: Poster Studio. A poster for the Clean-Up Day
// stands on a 3D easel. Pupils pick a template, then give it the workbook's
// makeover: put the title, key information and details at the right level of
// the hierarchy, delete what they don't need, choose two fonts and colours with
// good contrast (a live contrast check), and use only a picture they may reuse
// (the picture traffic light: own photo, Canva's free library, Creative Commons
// with a credit line, never someone else's photo).
import { THREE, COLORS, mat, rbox, decal } from './runtime.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PW = 720; // the poster is drawn on a 720 × 1018 canvas (the shape of A4)
const PH = 1018;

// Our event's text (from the workbook's Figure 27.0) and each template's sample text.
const TEXTS = {
  title: 'CLEAN-UP DAY',
  key: 'Sat 14 Nov • 9:00 am • Bozoma Market, main gate',
  details: 'Bring gloves and water. All welcome. Organised by the Bozoma Innovation Hub Tech Club.',
};
const SAMPLE = { title: 'YOUR TITLE HERE', key: 'Lorem ipsum dolor sit amet', details: 'Your Company · www.yourcompany.com' };
const LEVELS = [
  { id: 'title', name: 'Level 1 · Title', tip: 'biggest and boldest', size: 118 },
  { id: 'key', name: 'Level 2 · Key information', tip: 'what, when, where', size: 50 },
  { id: 'details', name: 'Level 3 · Details', tip: 'smallest', size: 30 },
];
const TEXT_NAME = { sample: 'Sample text', title: '“CLEAN-UP DAY”', key: '“Sat 14 Nov • 9:00 am • …”', details: '“Bring gloves and water…”' };

// Fonts: canvas stand-ins for the fonts pupils will meet in Canva.
const FONTS = {
  anton: { name: 'Anton (tall and bold)', family: 'Impact, Anton, Haettenschweiler, "Arial Narrow Bold", sans-serif', weight: 'normal', plain: false },
  montserrat: { name: 'Montserrat (bold, round)', family: 'Montserrat, Rubik, "Segoe UI", Arial, sans-serif', weight: 'bold', plain: true },
  opensans: { name: 'Open Sans (plain)', family: '"Open Sans", "Segoe UI", Arial, Helvetica, sans-serif', weight: 'normal', plain: true },
  script: { name: 'Curly Script (handwriting)', family: '"Brush Script MT", "Segoe Script", "Lucida Handwriting", "Apple Chancery", cursive', weight: 'italic', plain: false, curly: true },
  comic: { name: 'Comic Party (bubbly)', family: '"Comic Sans MS", "Comic Neue", "Chalkboard SE", cursive', weight: 'normal', plain: false },
};
const FONT_IDS = Object.keys(FONTS);

// Colour palettes: background, text and one accent colour.
const PALETTES = {
  yellow: { name: 'White on yellow', bg: '#FFD23F', fg: '#FFFFFF', accent: '#FF9F1C' },
  redgreen: { name: 'Green on red', bg: '#D62839', fg: '#2A9D8F', accent: '#2A9D8F' },
  goldwhite: { name: 'Gold on white', bg: '#FFFFFF', fg: '#FFBE00', accent: '#FFBE00' },
  cream: { name: 'Plum on cream', bg: '#FFF8E7', fg: '#24182E', accent: '#CA1F3F' },
  plum: { name: 'White on plum', bg: '#24182E', fg: '#FFFFFF', accent: '#FFBE00' },
  kente: { name: 'White on kente green', bg: '#0B6E4F', fg: '#FFFFFF', accent: '#FFBE00' },
};
const PAL_IDS = Object.keys(PALETTES);

// Pictures and the workbook's traffic light (Figure 27.3).
const PICS = {
  sample: { icon: '🖼️', name: 'Template sample photo', light: 'stop' },
  own: { icon: '📷', name: 'My own photo of the market gate', src: 'You took it yourself. No people in it.', light: 'go' },
  canva: { icon: '🧹', name: 'Brooms and gloves (Canva free library)', src: 'A free item from Canva’s own library.', light: 'go' },
  cc: { icon: '🏖️', name: 'Beach clean-up photo (CC BY)', src: 'By Kwame Boateng, CC BY licence, via Wikimedia Commons.', light: 'check', credit: 'Photo: Kwame Boateng, CC BY, via Wikimedia Commons' },
  news: { icon: '⚽', name: 'Black Stars photo from a news website', src: 'Copied from a news website. No licence.', light: 'stop' },
  whatsapp: { icon: '🎂', name: 'My cousin’s photo from her WhatsApp status', src: 'Her birthday photo. Nobody asked her.', light: 'stop' },
  pro: { icon: '👑', name: 'Pro picture with a little crown', src: 'A paid (Pro) item in Canva.', light: 'stop' },
};
const PIC_IDS = ['own', 'canva', 'cc', 'news', 'whatsapp', 'pro'];
const WHY_PIC = {
  own: '<p>✅ <b>GO.</b> You took it yourself, so you own the copyright. There are no people in it, so nobody else needs to agree.</p>',
  canva: '<p>✅ <b>GO.</b> Free items in Canva’s own library may be used in your designs. They don’t need a credit line, but you must not pretend you drew them yourself.</p>',
  cc: '<p>🟡 <b>CHECK THE RULES.</b> This photo has a <b>Creative Commons BY</b> licence: permission with a rule. “BY” means you may use it if you <b>credit the creator</b>. Tick <b>Add a credit line</b>.</p>',
  ccOk: '<p>✅ <b>GO, with credit.</b> The credit line is at the bottom in Level 3 size: who made it, the licence and where you found it.</p>',
  news: '<p>⛔ <b>STOP.</b> Somebody owns that photo: it is protected by <b>copyright</b>. Finding a picture on a website does not make it free to use, just as finding a phone on a trotro seat does not make it yours. Logos and football badges are a stop too.</p>',
  whatsapp: '<p>⛔ <b>STOP.</b> A photo of your cousin is not just a picture, it is a person. It is her photo and you did not ask her. <b>Never use someone’s photo without permission.</b></p>',
  pro: '<p>⛔ <b>STOP on a free account.</b> The little crown 👑 means a <b>Pro</b> (paid) item. It may print with a watermark or ask you to pay. Choose a free item instead.</p>',
};

// The three templates. Each comes with sample text, colours, fonts and a sticker.
const TEMPLATES = {
  banner: { name: 'Bold banner', palette: 'yellow', fonts: { title: 'anton', key: 'script', details: 'comic' } },
  photo: { name: 'Big photo', palette: 'redgreen', fonts: { title: 'comic', key: 'script', details: 'anton' } },
  split: { name: 'Side split', palette: 'goldwhite', fonts: { title: 'script', key: 'comic', details: 'anton' } },
};
const TPL_IDS = Object.keys(TEMPLATES);
const fresh = (tpl) => ({ tpl, slots: { title: 'sample', key: 'sample', details: 'sample' }, fonts: { ...TEMPLATES[tpl].fonts }, palette: TEMPLATES[tpl].palette, pic: 'sample', sticker: true, credit: false });

// WCAG contrast ratio between two hex colours (as in the slides lab).
function contrast(a, b) {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// ---------- The rules (the workbook's makeover checklist) ----------
function judge(s) {
  if (!s) return null;
  const slotsOk = LEVELS.every((l) => s.slots[l.id] === l.id);
  const noSample = LEVELS.every((l) => s.slots[l.id] !== 'sample');
  const fontCount = new Set(Object.values(s.fonts)).size;
  const bodyPlain = FONTS[s.fonts.key].plain && FONTS[s.fonts.details].plain;
  const ratio = contrast(PALETTES[s.palette].bg, PALETTES[s.palette].fg);
  const pic = PICS[s.pic];
  const picOk = pic.light === 'go' || (pic.light === 'check' && s.credit);
  return {
    slotsOk, noSample, fontCount, bodyPlain, ratio, picOk,
    contrastOk: ratio >= 4.5,
    layout: slotsOk && !s.sticker,
    style: fontCount <= 2 && bodyPlain && ratio >= 4.5,
    light: pic.light === 'check' && s.credit ? 'go' : pic.light,
  };
}

export default function designerLab(stage, ui) {
  const { scene } = stage;
  let state = null; // null = Auntie Esi's heap, before a template is chosen
  let flipping = false;

  // ---------- The studio ----------
  const floor = rbox(11.6, 0.14, 5.6, 0xe9dcc6, 0.06);
  floor.position.set(0.4, -0.07, 0.2);
  scene.add(floor);
  const rug = rbox(3.6, 0.03, 2.6, COLORS.sky, 0.05);
  rug.position.set(0, 0.015, 0.35);
  scene.add(rug);
  const rugEdge = decal(3.6, 2.6, (g, W, H) => {
    g.strokeStyle = '#5A4470';
    g.lineWidth = 10;
    g.strokeRect(16, 16, W - 32, H - 32);
    g.strokeStyle = '#FFBE00';
    g.lineWidth = 4;
    g.strokeRect(34, 34, W - 68, H - 68);
  }, { px: 128 });
  rugEdge.rotation.x = -Math.PI / 2;
  rugEdge.position.set(0, 0.032, 0.35);
  scene.add(rugEdge);

  // ---------- The easel and the poster ----------
  const wood = mat(0xb9844f, { roughness: 0.7 });
  const easel = new THREE.Group();
  scene.add(easel);
  const front = new THREE.Group(); // the front legs and the board lean back a little
  front.rotation.x = -0.1;
  easel.add(front);
  const legGeo = rbox(0.13, 5.0, 0.13, 0, 0.04).geometry;
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, wood);
    leg.castShadow = true;
    leg.position.set(sx * 0.72, 2.45, 0);
    leg.rotation.z = sx * 0.11;
    front.add(leg);
  }
  const back = new THREE.Mesh(legGeo, wood);
  back.castShadow = true;
  back.position.set(0, 2.2, -1.3);
  back.rotation.x = 0.3;
  easel.add(back);
  const ledge = rbox(2.9, 0.12, 0.36, 0xa0703f, 0.03);
  ledge.position.set(0, 0.92, 0.12);
  front.add(ledge);
  const lip = rbox(2.9, 0.12, 0.05, 0xa0703f, 0.02);
  lip.position.set(0, 1.0, 0.29);
  front.add(lip);
  const bar = rbox(1.6, 0.1, 0.1, 0xa0703f, 0.03);
  bar.position.set(0, 3.0, -0.07);
  front.add(bar);
  const board = new THREE.Group(); // spins round when a new template arrives
  board.position.set(0, 2.78, 0.12);
  front.add(board);
  const backing = rbox(2.5, 3.5, 0.08, 0xf2ece2, 0.03);
  board.add(backing);
  const posterCanvas = document.createElement('canvas');
  posterCanvas.width = PW;
  posterCanvas.height = PH;
  const posterTex = new THREE.CanvasTexture(posterCanvas);
  posterTex.colorSpace = THREE.SRGBColorSpace;
  posterTex.anisotropy = 4;
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 3.34), new THREE.MeshBasicMaterial({ map: posterTex, toneMapped: false }));
  poster.position.z = 0.045;
  poster.userData.noInk = true;
  board.add(poster);
  const clamp = rbox(0.5, 0.2, 0.22, 0xa0703f, 0.04);
  clamp.position.set(0, 4.55, 0.1);
  front.add(clamp);
  // A strip of kente cloth hangs from the ledge.
  const kente = decal(1.1, 0.42, (g, W, H) => kenteStripes(g, W, H), { px: 96, transparent: false });
  kente.position.set(0.75, 0.8, 0.322);
  front.add(kente);

  // ---------- Left: the table with the laptop, templates and letter blocks ----------
  const table = new THREE.Group();
  table.position.set(-3.25, 0, 0.75);
  table.scale.setScalar(1.18);
  scene.add(table);
  const top = rbox(2.5, 0.1, 1.45, 0x8f5f36, 0.03);
  top.position.y = 1.35;
  table.add(top);
  const tLeg = rbox(0.1, 1.3, 0.1, 0x6e4626, 0.03).geometry;
  const tLegMat = mat(0x6e4626);
  for (const [x, z] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]]) {
    const l = new THREE.Mesh(tLeg, tLegMat);
    l.position.set(x, 0.65, z);
    l.castShadow = true;
    table.add(l);
  }
  const runner = decal(0.7, 1.45, (g, W, H) => kenteStripes(g, W, H, true), { px: 128, transparent: false });
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0.7, 1.403, 0);
  table.add(runner);
  const laptop = buildLaptop();
  laptop.position.set(-0.5, 1.4, -0.22);
  laptop.rotation.y = 0.5;
  table.add(laptop);
  // The template rack: three mini posters you can click.
  const rack = new THREE.Group();
  rack.position.set(0.45, 1.4, 0.38);
  rack.rotation.y = -0.18;
  table.add(rack);
  const rackBase = rbox(1.75, 0.1, 0.3, 0xa0703f, 0.03);
  rackBase.position.y = 0.05;
  rack.add(rackBase);
  const tplCards = {};
  TPL_IDS.forEach((id, i) => {
    const card = new THREE.Group();
    card.position.set((i - 1) * 0.56, 0.1, 0);
    card.rotation.x = -0.18;
    const c = document.createElement('canvas');
    c.width = 180;
    c.height = 254;
    const g = c.getContext('2d');
    g.scale(180 / PW, 254 / PH);
    drawPoster(g, fresh(id));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.62), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    face.position.set(0, 0.32, 0.012);
    face.userData.noInk = true;
    const backer = rbox(0.48, 0.66, 0.02, 0xffffff, 0.01);
    backer.position.y = 0.32;
    card.add(backer, face);
    rack.add(card);
    tplCards[id] = card;
    stage.clickable(card, () => pickTemplate(id));
  });
  // Letter blocks: a reminder that two fonts are enough.
  const blocks = new THREE.Group();
  blocks.position.set(1.0, 1.4, -0.35);
  table.add(blocks);
  [['A', 'Impact, sans-serif', '#CA1F3F', -0.17, 0.1], ['a', 'Arial, sans-serif', '#24182E', 0.17, -0.15]].forEach(([ch, fam, col, x, ry]) => {
    const b = rbox(0.3, 0.3, 0.3, 0xfff8e7, 0.04);
    b.position.set(x, 0.15, 0);
    b.rotation.y = ry;
    const face = decal(0.24, 0.24, (g, W, H) => {
      g.fillStyle = col;
      g.font = `bold ${H * 0.8}px ${fam}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(ch, W / 2, H * 0.54);
    }, { px: 64 });
    face.position.z = 0.152;
    b.add(face);
    blocks.add(b);
  });

  // ---------- Right: the picture board and the traffic light ----------
  const pinboard = new THREE.Group();
  pinboard.position.set(3.35, 0, -0.35);
  pinboard.rotation.y = -0.22;
  scene.add(pinboard);
  const pbLegGeo = rbox(0.1, 3.3, 0.1, 0, 0.03).geometry;
  for (const x of [-1.05, 1.05]) {
    const l = new THREE.Mesh(pbLegGeo, mat(0x6e4626));
    l.position.set(x, 1.65, -0.05);
    l.castShadow = true;
    pinboard.add(l);
  }
  const cork = rbox(2.4, 1.95, 0.08, 0xc9a06b, 0.04);
  cork.position.set(0, 2.25, 0);
  pinboard.add(cork);
  const header = decal(2.2, 0.26, (g, W, H) => {
    g.fillStyle = '#24182E';
    g.beginPath(); g.roundRect(0, 0, W, H, H * 0.3); g.fill();
    g.fillStyle = '#FFBE00';
    g.font = `bold ${H * 0.55}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('PICTURES · MAY I USE IT?', W / 2, H * 0.55);
  }, { px: 48 });
  header.position.set(0, 3.05, 0.045);
  pinboard.add(header);
  const picCards = {};
  const pinGeo = new THREE.SphereGeometry(0.035, 10, 8);
  const pinMat = mat(COLORS.red);
  PIC_IDS.forEach((id, i) => {
    const card = new THREE.Group();
    card.position.set(((i % 3) - 1) * 0.72, 2.47 - Math.floor(i / 3) * 0.78, 0.05);
    card.rotation.z = [0.04, -0.03, 0.05, -0.05, 0.03, -0.02][i];
    const paper = rbox(0.64, 0.58, 0.015, 0xffffff, 0.005);
    const photo = decal(0.56, 0.42, (g, W, H) => PAINT[id](g, 0, 0, W, H), { px: 96, transparent: false });
    photo.position.set(0, 0.035, 0.009);
    const cap = decal(0.6, 0.08, (g, W, H) => {
      g.fillStyle = '#24182E';
      g.font = `600 ${H * 0.7}px Rubik, system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(['My photo', 'Canva free', 'CC BY', 'News site', 'WhatsApp', 'Pro 👑'][i], W / 2, H * 0.55);
    }, { px: 24 });
    cap.position.set(0, -0.235, 0.009);
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(0, 0.27, 0.03);
    card.add(paper, photo, cap, pin);
    pinboard.add(card);
    picCards[id] = card;
    stage.clickable(card, () => pickPic(id));
  });

  // The picture traffic light (Figure 27.3).
  const light = new THREE.Group();
  light.position.set(4.95, 0, 0.75);
  scene.add(light);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 12), mat(0x3b3f46));
  pole.position.y = 1.15;
  pole.castShadow = true;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.1, 20), mat(0x3b3f46));
  foot.position.y = 0.05;
  const housing = rbox(0.46, 1.28, 0.34, 0x2b2730, 0.08);
  housing.position.y = 2.85;
  light.add(pole, foot, housing);
  const lamps = {};
  const lampGeo = new THREE.SphereGeometry(0.14, 18, 12);
  [['stop', 0xca1f3f, 3.25], ['check', 0xffbe00, 2.85], ['go', 0x2ec4b6, 2.45]].forEach(([id, col, y]) => {
    const m = new THREE.Mesh(lampGeo, mat(col, { emissive: col, emissiveIntensity: 0 }));
    m.scale.z = 0.5;
    m.position.set(0, y, 0.17);
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 16, 1, true, -Math.PI / 2, Math.PI), mat(0x2b2730, { side: THREE.DoubleSide }));
    hood.rotation.x = Math.PI / 2;
    hood.rotation.y = Math.PI;
    hood.position.set(0, y + 0.02, 0.24);
    light.add(m, hood);
    lamps[id] = m;
  });
  stage.clickable(light, () => explainPic());

  // A stool with paint pots and brushes, for the studio feel.
  const stool = new THREE.Group();
  stool.position.set(1.75, 0, 1.55);
  scene.add(stool);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24), mat(0xa0703f));
  seat.position.y = 0.82;
  stool.add(seat);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const l = rbox(0.07, 0.8, 0.07, 0x6e4626, 0.02);
    l.position.set(Math.cos(a) * 0.28, 0.4, Math.sin(a) * 0.28);
    stool.add(l);
  }
  const potGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.18, 16);
  [[COLORS.red, -0.18, -0.05], [COLORS.gold, 0.08, -0.17], [COLORS.green, 0.12, 0.15]].forEach(([c, x, z]) => {
    const pot = new THREE.Mesh(potGeo, mat(0xf4f0f6));
    pot.position.set(x, 0.95, z);
    const paint = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.02, 16), mat(c));
    paint.position.y = 0.085;
    pot.add(paint);
    stool.add(pot);
  });
  const brush = rbox(0.04, 0.5, 0.04, 0x8f5f36, 0.015);
  brush.position.set(-0.05, 1.05, 0.17);
  brush.rotation.set(0.5, 0, 0.6);
  stool.add(brush);

  // ---------- Callouts (most important first: phones show four) ----------
  const cards = {
    poster: stage.callout(board, { icon: '🖼️', title: 'Your poster', text: 'Title, then key info, then details.', at: [-1.15, 1.25, 0.05], dx: -95, dy: -55 }),
    tpl: stage.callout(rack, { icon: '📐', title: 'Templates', text: 'Ready-made designs to make your own.', at: [-0.56, 0.7, 0], dx: -40, dy: -95 }),
    light: stage.callout(housing, { icon: '🚦', title: 'Picture check', text: 'Use only pictures you may reuse.', at: [0, 0.64, 0], dx: 25, dy: -80 }),
    contrast: stage.callout(board, { icon: '🌗', title: 'Contrast', text: 'Pick a template first.', at: [1.1, -1.3, 0.05], dx: 105, dy: 60 }),
    fonts: stage.callout(blocks, { icon: '🔤', title: 'Two fonts', text: 'One bold for titles, one plain.', at: [0, 0.3, 0], dx: 40, dy: 85 }),
    canva: stage.callout(laptop, { icon: '💻', title: 'Canva', text: 'A 👑 crown means a paid Pro item.', at: [0, 0.75, -0.2], dx: -60, dy: -70 }),
  };

  // ---------- Side panel ----------
  const tplGroup = ui.group('1 · Pick a template');
  const tplBtns = TPL_IDS.map((id) => ui.button(`📐 ${TEMPLATES[id].name}`, () => pickTemplate(id), { group: tplGroup }));

  const layGroup = ui.group('2 · Layout: what goes where?');
  const layBox = ui.element(LEVELS.map((l) => `<label class="lab-field">${l.name} <small style="color:var(--muted)">(${l.tip})</small>
    <select data-slot="${l.id}">${['sample', 'title', 'key', 'details'].map((t) => `<option value="${t}">${t === 'sample' ? `Sample text: “${esc(SAMPLE[l.id])}”` : esc(TEXTS[t])}</option>`).join('')}</select></label>`).join(''), layGroup);
  const stickerBtn = ui.button('🗑️ Delete the “SALE!” sticker', () => deleteSticker(), { group: layGroup });

  const fontGroup = ui.group('3 · Fonts (two at most)');
  const fontBox = ui.element(LEVELS.map((l) => `<label class="lab-field inline-field">${l.name.split(' · ')[1]} <select data-font="${l.id}">${FONT_IDS.map((f) => `<option value="${f}">${esc(FONTS[f].name)}</option>`).join('')}</select></label>`).join('') + '<p class="check fontcheck" aria-live="polite"></p>', fontGroup);

  const colGroup = ui.group('4 · Colours (check the contrast)');
  const palBtns = PAL_IDS.map((id) => {
    const p = PALETTES[id];
    const b = ui.button('', () => pickPalette(id), { group: colGroup });
    b.innerHTML = `<span class="swatch" style="background:${p.bg};border:1px solid #0003"></span><span class="swatch" style="background:${p.fg};border:1px solid #0003"></span>${esc(p.name)}`;
    return b;
  });
  const contrastBox = ui.element('<p class="check contrastcheck" aria-live="polite"></p>', colGroup).firstElementChild;

  const picGroup = ui.group('5 · Picture (may I use it?)');
  const picBtns = PIC_IDS.map((id) => {
    const b = ui.button(`${PICS[id].icon} ${PICS[id].name}`, () => pickPic(id), { group: picGroup });
    b.title = PICS[id].src;
    return b;
  });
  const creditBox = ui.element('<label class="inline"><input type="checkbox" data-credit> Add a credit line at the bottom (Level 3 size)</label>', picGroup);
  const creditInput = creditBox.querySelector('input');

  const checkGroup = ui.group('Template makeover checklist');
  const checklist = ui.element('<ul class="readout" style="list-style:none;padding:0;margin:0;font-family:inherit;font-size:13px;line-height:1.5"></ul>', checkGroup).firstElementChild;
  const backBtn = ui.button('👀 Step back 2 metres', () => stepBack(), { group: checkGroup });
  const againBtn = ui.button('↺ Start again', () => startAgain(), { group: checkGroup });

  const editors = [...layBox.querySelectorAll('select'), ...fontBox.querySelectorAll('select'), stickerBtn, ...palBtns, ...picBtns, creditInput, backBtn];
  layBox.addEventListener('change', (e) => {
    const slot = e.target.dataset.slot;
    if (!slot || !needTemplate()) return;
    state.slots[slot] = e.target.value;
    redraw();
    explainLayout(slot);
  });
  fontBox.addEventListener('change', (e) => {
    const lvl = e.target.dataset.font;
    if (!lvl || !needTemplate()) return;
    state.fonts[lvl] = e.target.value;
    redraw();
    explainFonts(lvl);
  });
  creditInput.addEventListener('change', () => {
    if (!needTemplate()) return;
    state.credit = creditInput.checked;
    redraw();
    explainPic();
  });

  // ---------- Actions ----------
  function needTemplate() {
    if (state) return true;
    ui.info('Pick a template first 📐', '<p>This is Auntie Esi’s poster: everything in a heap. Start again from a <b>template</b>: press one of the three buttons, or click a mini poster on the table.</p>');
    syncPanel();
    return false;
  }

  async function pickTemplate(id) {
    if (flipping) return;
    flipping = true;
    tplBtns.forEach((b) => b.setAttribute('aria-disabled', 'true'));
    stage.reveal();
    const card = tplCards[id];
    const y0 = card.position.y;
    stage.tween((k) => (card.position.y = y0 + Math.sin(k * Math.PI) * 0.25), 0.5);
    await stage.tween((k) => (board.rotation.y = k * Math.PI / 2), 0.35);
    state = fresh(id);
    redraw();
    await stage.tween((k) => (board.rotation.y = -Math.PI / 2 + k * Math.PI / 2), 0.35);
    board.rotation.y = 0;
    flipping = false;
    tplBtns.forEach((b) => b.removeAttribute('aria-disabled'));
    ui.toggle(tplBtns, tplBtns[TPL_IDS.indexOf(id)]);
    ui.info(`📐 Template: ${TEMPLATES[id].name}`, `<p>A <b>template</b> is a ready-made design you change to fit your event. It saves time, but if 20 pupils pick the same one, 20 posters look the same.</p><p>Now give it the <b>makeover</b>: replace the sample text (<i>“${esc(SAMPLE.title)}”</i>, <i>“Lorem ipsum”</i>, <i>“Your Company”</i>), then fix the fonts, colours and picture. The checklist below ticks as you go.</p>`);
  }

  function explainLayout(slot) {
    const j = judge(state);
    const put = state.slots[slot];
    const lvl = LEVELS.find((l) => l.id === slot);
    let html;
    if (put === 'sample') html = `<p>That level still shows the template’s sample text. Replace <b>every</b> piece of sample text, or your poster will say “${esc(SAMPLE[slot])}”!</p>`;
    else if (put === slot) html = `<p>✅ ${esc(TEXT_NAME[put])} is at <b>${lvl.name}</b>: ${lvl.tip}. ${{ title: 'One clear title grabs the eye first: the focal point.', key: 'What, when and where, medium size.', details: 'Extra facts and who is organising, in the smallest text.' }[slot]}</p>`;
    else html = `<p>Hmm: ${esc(TEXT_NAME[put])} is now at <b>${lvl.name}</b> (${lvl.tip}). ${put === 'details' ? 'Readers will see the small print first, not what the event is!' : put === 'title' ? 'The title should be the biggest thing on the poster, readable from across the road.' : 'The date and place are key information: medium size, not the biggest or the smallest.'}</p>`;
    const used = LEVELS.map((l) => state.slots[l.id]).filter((t) => t !== 'sample');
    if (new Set(used).size < used.length) html += '<p>⚠️ One piece of text is used twice, so another piece is missing.</p>';
    if (j.slotsOk) html += `<p>🎉 Hierarchy fixed: the eye reads the <b>title</b>, then the <b>key information</b>, then the <b>details</b>.${state.sticker ? ' Now delete the “SALE!” sticker: it does not belong on a clean-up poster.' : ''}</p>`;
    ui.info('🧱 Layout and hierarchy', html);
  }

  function deleteSticker() {
    if (!needTemplate()) return;
    if (!state.sticker) {
      ui.info('Already gone 🗑️', '<p>The sticker is deleted. Empty space is not wasted space: it lets each part breathe.</p>');
      return;
    }
    state.sticker = false;
    redraw();
    ui.info('🗑️ Deleted: “SALE! 50% OFF”', `<p><b>Less is more.</b> Delete things the reader does not need. A clean-up day is not a sale! Now there is more <b>white space</b>, so each part can breathe, like the gaps between piles on a good market stall.</p>${judge(state).slotsOk ? '' : '<p>Next: put the title, key information and details at the right levels.</p>'}`);
  }

  function explainFonts(lvl) {
    const j = judge(state);
    const f = FONTS[state.fonts[lvl]];
    let html = `<p>${LEVELS.find((l) => l.id === lvl).name.split(' · ')[1]}: <b>${esc(f.name)}</b>.</p>`;
    if (f.curly && lvl !== 'title') html += '<p>⚠️ Curly handwriting fonts are hard to read in sentences. Use a plain font such as <b>Open Sans</b> for everything except the title.</p>';
    else if (!f.plain && lvl !== 'title') html += '<p>⚠️ This font is fun for a word or two, but sentences need a plain, easy-to-read font such as <b>Open Sans</b> or <b>Montserrat</b>.</p>';
    html += j.fontCount > 2
      ? `<p>The poster now uses <b>${j.fontCount} fonts</b>. Two is enough: one bold font for the title and one plain font for everything else. Too many fonts look like a heap of different stalls.</p>`
      : `<p>✅ ${j.fontCount} font${j.fontCount === 1 ? '' : 's'}: tidy. ${j.bodyPlain ? 'The text is easy to read.' : ''}</p>`;
    if (j.style) html += '<p>🎉 Fonts and colours both work now.</p>';
    else if (j.fontCount <= 2 && j.bodyPlain && !j.contrastOk) html += '<p>Next: choose colours with good contrast.</p>';
    ui.info('🔤 Fonts', html);
  }

  function pickPalette(id) {
    if (!needTemplate()) return;
    state.palette = id;
    redraw();
    const j = judge(state);
    const p = PALETTES[id];
    let html = `<p>Contrast: <b>${j.ratio.toFixed(1)} : 1</b>. `;
    html += j.contrastOk
      ? `✅ ${p.fg === '#FFFFFF' ? 'Light text on a dark background' : 'Dark text on a light background'}: easy to read, even from far away.</p>`
      : `⚠️ Too low! You have to squint. Aim for <b>4.5 : 1</b> or more.${id === 'redgreen' ? ' Green on red is also very hard for colour-blind readers.' : ''}</p>`;
    html += '<p>Use your 2–3 colours again and again: that is your <b>colour palette</b>.</p>';
    if (j.style) html += '<p>🎉 Fonts and colours both work now.</p>';
    else if (j.contrastOk) html += `<p>Next: check the fonts. ${j.fontCount > 2 ? `There are ${j.fontCount}; two is enough.` : 'Use a plain font for the text.'}</p>`;
    ui.info('🎨 Colours and contrast', html);
  }

  async function pickPic(id) {
    if (!needTemplate()) return;
    state.pic = id;
    redraw();
    const card = picCards[id];
    const z0 = 0.05;
    stage.tween((k) => (card.position.z = z0 + Math.sin(k * Math.PI) * 0.25), 0.45);
    explainPic();
  }

  function explainPic() {
    if (!state) return needTemplate();
    const id = state.pic;
    if (id === 'sample') {
      ui.info('🖼️ The sample picture', '<p>Swap the template’s sample picture for one you are <b>allowed</b> to use that fits your event. Look at the picture board: which ones may you use?</p>');
      return;
    }
    let html = `<p><b>${PICS[id].icon} ${esc(PICS[id].name)}</b><br><small>${esc(PICS[id].src)}</small></p>`;
    html += id === 'cc' ? (state.credit ? WHY_PIC.ccOk : WHY_PIC.cc) : WHY_PIC[id];
    if (state.credit && id !== 'cc' && PICS[id].light === 'go') html += '<p><small>This picture does not need a credit line, so it is left off.</small></p>';
    if (PICS[id].light === 'stop') html += '<p>When in doubt, leave it out. Choose a different picture.</p>';
    ui.info('🚦 Picture check', html);
  }

  async function stepBack() {
    if (!needTemplate()) return;
    stage.reveal();
    const cam = stage.camera;
    const z0 = cam.zoom;
    await stage.tween((k) => { cam.zoom = z0 + (0.6 - z0) * k; cam.updateProjectionMatrix(); }, 0.6);
    const j = judge(state);
    const readable = state.slots.title === 'title' && j.contrastOk && !FONTS[state.fonts.title].curly;
    ui.info('👀 From two metres away…', readable
      ? `<p>✅ You can read <b>CLEAN-UP DAY</b> from across the room. That is what a title is for.</p>${j.layout && j.style && j.picOk ? '<p>Your poster is ready for the gallery walk! Now make your own in real Canva.</p>' : '<p>Keep going with the checklist.</p>'}`
      : `<p>⚠️ Hard to read from here. ${state.slots.title !== 'title' ? 'The biggest text is not the title. ' : ''}${!j.contrastOk ? 'The contrast is too low. ' : ''}${FONTS[state.fonts.title].curly ? 'A curly title is hard to read from far away. ' : ''}Fix it, then step back again.</p>`);
    await stage.wait(2.2);
    await stage.tween((k) => { cam.zoom = 0.6 + (z0 - 0.6) * k; cam.updateProjectionMatrix(); }, 0.6);
  }

  function startAgain() {
    state = null;
    redraw();
    ui.toggle(tplBtns, null);
    ui.info('↺ Back to Auntie Esi’s poster', '<p>Everything in a heap: five fonts, clashing colours and no clear title. Pick a template to start your makeover.</p>');
  }

  // ---------- Drawing and checking ----------
  function redraw() {
    const g = posterCanvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (state) drawPoster(g, state);
    else drawHeap(g);
    posterTex.needsUpdate = true;
    syncPanel();
    check();
  }

  function syncPanel() {
    const on = !!state;
    for (const el of editors) {
      el.setAttribute('aria-disabled', String(!on));
      el.style.opacity = on ? '' : '0.55';
    }
    if (!state) {
      checklist.innerHTML = '<li>⬜ Pick a template to start the makeover.</li>';
      contrastBox.className = 'check bad contrastcheck';
      contrastBox.textContent = 'Auntie Esi’s poster: clashing colours. Pick a template first.';
      fontBox.querySelector('.fontcheck').className = 'check bad fontcheck';
      fontBox.querySelector('.fontcheck').textContent = 'Auntie Esi’s poster has 5 fonts!';
      return;
    }
    layBox.querySelectorAll('select').forEach((s) => (s.value = state.slots[s.dataset.slot]));
    fontBox.querySelectorAll('select').forEach((s) => (s.value = state.fonts[s.dataset.font]));
    ui.toggle(palBtns, palBtns[PAL_IDS.indexOf(state.palette)]);
    ui.toggle(picBtns, picBtns[PIC_IDS.indexOf(state.pic)] ?? null);
    creditInput.checked = state.credit;
    stickerBtn.textContent = state.sticker ? '🗑️ Delete the “SALE!” sticker' : '✅ Sticker deleted';
  }

  function check() {
    const j = judge(state);
    // Traffic light
    const lit = j ? (state.pic === 'sample' ? null : j.light) : null;
    for (const [id, m] of Object.entries(lamps)) m.material.emissiveIntensity = id === lit ? 1.1 : 0;
    if (!j) {
      cards.contrast.set('Contrast', 'Pick a template first.');
      cards.light.set('Picture check', 'Use only pictures you may reuse.');
      return;
    }
    cards.contrast.set('Contrast', `${PALETTES[state.palette].name}: ${j.ratio.toFixed(1)} : 1 ${j.contrastOk ? '✅' : '⚠️ too low'}`);
    cards.light.set('Picture check', state.pic === 'sample' ? 'Swap the sample picture.' : { go: '🟢 GO: you may use it.', check: '🟡 CHECK: credit the creator.', stop: '🔴 STOP: you may not use it.' }[j.light]);
    contrastBox.className = `check ${j.contrastOk ? 'good' : 'bad'} contrastcheck`;
    contrastBox.textContent = `${j.contrastOk ? '✅' : '⚠️'} Contrast ${j.ratio.toFixed(1)} : 1 ${j.contrastOk ? '(easy to read)' : '(too low: you have to squint! Aim for 4.5 or more)'}`;
    const fc = fontBox.querySelector('.fontcheck');
    const fontsOk = j.fontCount <= 2 && j.bodyPlain;
    fc.className = `check ${fontsOk ? 'good' : 'bad'} fontcheck`;
    fc.textContent = j.fontCount > 2 ? `⚠️ ${j.fontCount} fonts used. Two is enough.` : j.bodyPlain ? `✅ ${j.fontCount} font${j.fontCount === 1 ? '' : 's'}, easy to read` : '⚠️ Use a plain font for the key information and details.';
    const items = [
      [j.noSample, 'Replace every piece of sample text'],
      [j.slotsOk, 'Title, key information and details at the right levels'],
      [!state.sticker, 'Delete things you don’t need'],
      [fontsOk, 'Check the fonts: two at most'],
      [j.contrastOk && state.palette !== TEMPLATES[state.tpl].palette, 'Change the colours to your own palette, with good contrast'],
      [j.picOk, 'Swap the sample picture for one you may use'],
    ];
    checklist.innerHTML = items.map(([ok, t]) => `<li>${ok ? '✅' : '⬜'} ${t}</li>`).join('');
    if (j.layout) ui.complete('layout');
    if (j.style) ui.complete('style');
    if (j.picOk) ui.complete('picture');
  }

  // ---------- Idle animation ----------
  stage.onTick((dt, t) => {
    const lit = Object.values(lamps).find((m) => m.material.emissiveIntensity > 0);
    if (lit) lit.material.emissiveIntensity = 0.8 + Math.sin(t * 4) * 0.3;
  });

  redraw();
  ui.info('Poster Studio 🎨', '<p>This is <b>Auntie Esi’s poster</b> for the Clean-Up Day: everything in a heap. Five fonts, clashing colours, no clear title. Your eyes don’t know where to look!</p><p>Make it clear and tidy like Auntie Naa’s. Start by picking a <b>template</b> (buttons below, or click a mini poster on the table).</p>');
}

// ---------- Drawing the poster ----------
function font(id, px, level) {
  const f = FONTS[id];
  const weight = f.weight === 'italic' ? 'italic' : level === 'details' && f.weight === 'bold' ? '600' : level === 'key' && f.weight === 'normal' && id === 'opensans' ? 'bold' : f.weight;
  return `${weight} ${Math.round(px)}px ${f.family}`;
}

function wrap(g, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// Fit text inside a box: wrap it, and shrink it until it fits.
function fitText(g, text, fontId, size, level, r, align, color) {
  let px = size;
  let lines;
  for (;;) {
    g.font = font(fontId, px, level);
    lines = wrap(g, text, r.w);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if ((lines.length * px * 1.15 <= r.h && widest <= r.w) || px < 14) break;
    px -= 3;
  }
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  const lh = px * 1.15;
  const y0 = r.y + r.h / 2 - ((lines.length - 1) * lh) / 2;
  const x = align === 'center' ? r.x + r.w / 2 : r.x;
  lines.forEach((l, i) => g.fillText(l, x, y0 + i * lh));
}

const LAYOUTS = {
  banner: { align: 'center', title: { x: 50, y: 50, w: 620, h: 220 }, pic: { x: 60, y: 300, w: 600, h: 360 }, key: { x: 60, y: 690, w: 600, h: 140 }, details: { x: 80, y: 850, w: 560, h: 100 }, sticker: [600, 300] },
  photo: { align: 'center', title: { x: 40, y: 545, w: 640, h: 170 }, pic: { x: 0, y: 0, w: 720, h: 510 }, key: { x: 60, y: 730, w: 600, h: 120 }, details: { x: 80, y: 860, w: 560, h: 92 }, sticker: [580, 90] },
  split: { align: 'left', title: { x: 330, y: 70, w: 350, h: 330 }, pic: { x: 0, y: 0, w: 290, h: 1018 }, key: { x: 330, y: 440, w: 350, h: 230 }, details: { x: 330, y: 700, w: 350, h: 230 }, sticker: [560, 900] },
};

function drawPoster(g, s) {
  const L = LAYOUTS[s.tpl];
  const p = PALETTES[s.palette];
  g.fillStyle = p.bg;
  g.fillRect(0, 0, PW, PH);
  // A thin accent line under the title, and a frame for the picture.
  g.fillStyle = p.accent;
  if (s.tpl === 'banner') g.fillRect(260, 278, 200, 8);
  if (s.tpl === 'photo') g.fillRect(0, 510, PW, 12);
  if (s.tpl === 'split') g.fillRect(290, 0, 12, PH);
  const r = L.pic;
  g.save();
  g.beginPath();
  g.rect(r.x, r.y, r.w, r.h);
  g.clip();
  PAINT[s.pic](g, r.x, r.y, r.w, r.h);
  g.restore();
  for (const l of LEVELS) {
    const t = s.slots[l.id];
    fitText(g, t === 'sample' ? SAMPLE[l.id] : TEXTS[t], s.fonts[l.id], l.size, l.id, L[l.id], L.align, p.fg);
  }
  const pic = PICS[s.pic];
  if (s.credit && pic.credit) {
    g.font = '18px "Open Sans", Arial, sans-serif';
    g.textAlign = L.align === 'center' ? 'center' : 'left';
    g.fillStyle = p.fg;
    g.fillText(pic.credit, L.align === 'center' ? PW / 2 : 330, 990, L.align === 'center' ? 660 : 370);
  }
  if (s.sticker) {
    const [x, y] = L.sticker;
    g.save();
    g.translate(x, y);
    g.rotate(-0.25);
    g.fillStyle = '#E63946';
    g.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const rad = i % 2 ? 62 : 82;
      g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    g.closePath();
    g.fill();
    g.fillStyle = '#FFF';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 30px Impact, sans-serif';
    g.fillText('SALE!', 0, -14);
    g.font = 'bold 24px Impact, sans-serif';
    g.fillText('50% OFF', 0, 18);
    g.restore();
  }
}

// Auntie Esi's poster (Figure 27.0): everything in a heap.
function drawHeap(g) {
  g.fillStyle = '#B8F25C';
  g.fillRect(0, 0, PW, PH);
  g.fillStyle = '#FF4FA3';
  g.fillRect(0, 760, PW, 258);
  const bits = [
    ['come one come all!!!', '"Brush Script MT", "Segoe Script", cursive', 'italic 62px', '#E63946', 360, 90, -0.08],
    ['Clean-Up', '"Comic Sans MS", cursive', 'bold 74px', '#2A9D8F', 220, 230, 0.1],
    ['DAY', 'Impact, sans-serif', '96px', '#FF4FA3', 560, 300, -0.3],
    ['Saturday 9am at the market', '"Courier New", monospace', 'bold 38px', '#3A86FF', 360, 640, 0.05],
    ['bring gloves + water + friends', 'Georgia, serif', 'italic 36px', '#FFBE00', 350, 830, -0.06],
    ['Bozoma Tech Club!!', 'Impact, sans-serif', '50px', '#B8F25C', 360, 920, 0.04],
    ['free!!', '"Comic Sans MS", cursive', 'bold 70px', '#FFFFFF', 140, 700, -0.35],
  ];
  // A tilted photo copied from somewhere, squeezed in the middle.
  g.save();
  g.translate(360, 450);
  g.rotate(0.12);
  g.fillStyle = '#FFF';
  g.fillRect(-170, -120, 340, 240);
  PAINT.news(g, -160, -110, 320, 220);
  g.restore();
  for (const [t, fam, w, col, x, y, rot] of bits) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.font = `${w} ${fam}`;
    g.fillStyle = col;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(t, 0, 0, 680);
    g.restore();
  }
}

// ---------- Little picture painters (x, y, w, h) ----------
const PAINT = {
  sample(g, x, y, w, h) {
    g.fillStyle = '#C9C3CF';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#A59EAD';
    g.beginPath();
    g.moveTo(x + w * 0.15, y + h * 0.8); g.lineTo(x + w * 0.4, y + h * 0.42); g.lineTo(x + w * 0.58, y + h * 0.66); g.lineTo(x + w * 0.7, y + h * 0.52); g.lineTo(x + w * 0.88, y + h * 0.8);
    g.fill();
    g.beginPath(); g.arc(x + w * 0.72, y + h * 0.28, Math.min(w, h) * 0.08, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6B6373';
    g.font = `bold ${Math.min(w, h) * 0.09}px Rubik, Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SAMPLE PHOTO', x + w / 2, y + h * 0.92);
  },
  own(g, x, y, w, h) {
    const sky = g.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#7EC8F2');
    sky.addColorStop(1, '#D9F0FB');
    g.fillStyle = sky;
    g.fillRect(x, y, w, h);
    g.fillStyle = '#C98F5A';
    g.fillRect(x, y + h * 0.78, w, h * 0.22);
    // Market gate arch with a sign.
    g.fillStyle = '#5A4470';
    g.fillRect(x + w * 0.2, y + h * 0.3, w * 0.07, h * 0.5);
    g.fillRect(x + w * 0.73, y + h * 0.3, w * 0.07, h * 0.5);
    g.fillStyle = '#CA1F3F';
    g.fillRect(x + w * 0.16, y + h * 0.2, w * 0.68, h * 0.14);
    g.fillStyle = '#FFF';
    g.font = `bold ${h * 0.08}px Rubik, Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('BOZOMA MARKET', x + w / 2, y + h * 0.275, w * 0.64);
    // Stall umbrellas.
    [[0.4, '#FFBE00'], [0.6, '#2EC4B6']].forEach(([fx, c]) => {
      g.fillStyle = c;
      g.beginPath(); g.arc(x + w * fx, y + h * 0.62, w * 0.09, Math.PI, 0); g.fill();
      g.fillStyle = '#3B3F46';
      g.fillRect(x + w * fx - 2, y + h * 0.62, 4, h * 0.17);
    });
  },
  canva(g, x, y, w, h) {
    g.fillStyle = '#E3F5EF';
    g.fillRect(x, y, w, h);
    // A broom
    g.save();
    g.translate(x + w * 0.38, y + h * 0.5);
    g.rotate(-0.35);
    g.fillStyle = '#B9844F';
    g.fillRect(-w * 0.015, -h * 0.4, w * 0.03, h * 0.6);
    g.fillStyle = '#FFBE00';
    g.beginPath(); g.moveTo(-w * 0.1, h * 0.38); g.lineTo(w * 0.1, h * 0.38); g.lineTo(w * 0.04, h * 0.18); g.lineTo(-w * 0.04, h * 0.18); g.fill();
    g.restore();
    // Two gloves
    [[0.64, '#CA1F3F', 0.2], [0.78, '#5A4470', -0.15]].forEach(([fx, c, r]) => {
      g.save();
      g.translate(x + w * fx, y + h * 0.56);
      g.rotate(r);
      g.fillStyle = c;
      g.beginPath(); g.roundRect(-w * 0.06, -h * 0.12, w * 0.12, h * 0.3, w * 0.04); g.fill();
      for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-w * 0.06 + i * w * 0.03, -h * 0.25, w * 0.025, h * 0.16, w * 0.012); g.fill(); }
      g.restore();
    });
  },
  cc(g, x, y, w, h) {
    g.fillStyle = '#9ED8F5';
    g.fillRect(x, y, w, h * 0.45);
    g.fillStyle = '#2E8BC0';
    g.fillRect(x, y + h * 0.45, w, h * 0.18);
    g.fillStyle = '#F2D49B';
    g.fillRect(x, y + h * 0.63, w, h * 0.37);
    g.fillStyle = '#FFF';
    for (let i = 0; i < 3; i++) g.fillRect(x + w * (0.1 + i * 0.3), y + h * 0.5, w * 0.12, 3);
    // Palm tree
    g.fillStyle = '#8F5F36';
    g.fillRect(x + w * 0.14, y + h * 0.3, w * 0.03, h * 0.45);
    g.fillStyle = '#2A9D5F';
    for (let i = 0; i < 5; i++) {
      g.save(); g.translate(x + w * 0.155, y + h * 0.3); g.rotate(-2.6 + i * 0.6);
      g.beginPath(); g.ellipse(w * 0.08, 0, w * 0.09, h * 0.03, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
    // Rubbish bags, filled by the clean-up team.
    [[0.55, '#24182E'], [0.68, '#3A2B47'], [0.8, '#24182E']].forEach(([fx, c]) => {
      g.fillStyle = c;
      g.beginPath(); g.ellipse(x + w * fx, y + h * 0.8, w * 0.06, h * 0.09, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFBE00';
      g.fillRect(x + w * fx - 4, y + h * 0.7, 8, 5);
    });
  },
  news(g, x, y, w, h) {
    g.fillStyle = '#1D7A3A';
    g.fillRect(x, y, w, h);
    g.strokeStyle = '#FFFFFF88';
    g.lineWidth = 3;
    g.beginPath(); g.arc(x + w / 2, y + h * 0.75, h * 0.25, 0, Math.PI * 2); g.stroke();
    [[0.3, '#CA1F3F'], [0.5, '#FFBE00'], [0.7, '#CA1F3F']].forEach(([fx, c]) => {
      g.fillStyle = '#5B3A29';
      g.beginPath(); g.arc(x + w * fx, y + h * 0.28, h * 0.08, 0, Math.PI * 2); g.fill();
      g.fillStyle = c;
      g.beginPath(); g.roundRect(x + w * fx - w * 0.07, y + h * 0.38, w * 0.14, h * 0.34, 8); g.fill();
      g.fillStyle = '#24182E';
      g.beginPath();
      const sx = x + w * fx, sy = y + h * 0.5, R = h * 0.04;
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? R * 0.45 : R; g.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); }
      g.fill();
    });
    g.fillStyle = '#FFFFFFCC';
    g.font = `bold ${h * 0.08}px Arial, sans-serif`;
    g.textAlign = 'right';
    g.textBaseline = 'bottom';
    g.fillText('© SportsNews', x + w - 8, y + h - 6);
  },
  whatsapp(g, x, y, w, h) {
    g.fillStyle = '#FCE4EC';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#075E54';
    g.fillRect(x, y, w, h * 0.12);
    g.fillStyle = '#FFF';
    for (let i = 0; i < 4; i++) g.fillRect(x + 6 + i * (w - 12) / 4, y + h * 0.04, (w - 12) / 4 - 4, 3);
    // A girl with balloons
    [[0.2, '#CA1F3F'], [0.3, '#FFBE00'], [0.78, '#2EC4B6']].forEach(([fx, c]) => {
      g.fillStyle = c;
      g.beginPath(); g.ellipse(x + w * fx, y + h * 0.32, w * 0.05, h * 0.08, 0, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = '#6B4226';
    g.beginPath(); g.arc(x + w / 2, y + h * 0.45, h * 0.13, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#24182E';
    g.beginPath(); g.arc(x + w / 2, y + h * 0.39, h * 0.13, Math.PI, 0); g.fill();
    g.fillStyle = '#5A4470';
    g.beginPath(); g.roundRect(x + w * 0.34, y + h * 0.6, w * 0.32, h * 0.4, 16); g.fill();
    g.fillStyle = '#24182E';
    g.font = `bold ${h * 0.08}px Arial, sans-serif`;
    g.textAlign = 'center';
    g.fillText('🎂 my birthday!', x + w / 2, y + h * 0.95);
  },
  pro(g, x, y, w, h) {
    const sky = g.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#FF9F1C');
    sky.addColorStop(1, '#FFD23F');
    g.fillStyle = sky;
    g.fillRect(x, y, w, h);
    g.fillStyle = '#CA1F3F';
    g.beginPath(); g.arc(x + w * 0.5, y + h * 0.62, h * 0.2, Math.PI, 0); g.fill();
    g.fillStyle = '#5A4470';
    g.fillRect(x, y + h * 0.62, w, h * 0.38);
    // Watermark
    g.save();
    g.translate(x + w / 2, y + h / 2);
    g.rotate(-0.4);
    g.fillStyle = '#FFFFFF99';
    g.font = `bold ${h * 0.13}px Arial, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = -2; i <= 2; i++) g.fillText('PRO · PRO · PRO', 0, i * h * 0.22);
    g.restore();
    g.font = `${h * 0.18}px sans-serif`;
    g.textAlign = 'left';
    g.textBaseline = 'top';
    g.fillText('👑', x + 6, y + 4);
  },
};

function kenteStripes(g, W, H, vertical = false) {
  const cols = ['#FFBE00', '#0B6E4F', '#CA1F3F', '#FFBE00', '#24182E', '#0B6E4F'];
  const n = 12;
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[i % cols.length];
    if (vertical) g.fillRect(0, (i * H) / n, W, H / n + 1);
    else g.fillRect((i * W) / n, 0, W / n + 1, H);
  }
  g.fillStyle = '#24182E';
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 4; k++) {
      if ((i + k) % 2) continue;
      if (vertical) g.fillRect((k * W) / 4 + W / 16, (i * H) / n + H / n / 3, W / 8, H / n / 3);
      else g.fillRect((i * W) / n + W / n / 3, (k * H) / 4 + H / 16, W / n / 3, H / 8);
    }
  }
}

// A laptop open on Canva: side panel, the design in the middle.
function buildLaptop() {
  const grp = new THREE.Group();
  const base = rbox(1.15, 0.06, 0.78, 0x9aa0a8, 0.03, { metalness: 0.3 });
  base.position.y = 0.03;
  const keys = decal(1.0, 0.42, (g, W, H) => {
    g.fillStyle = '#2B2730';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) g.fillRect(c * (W / 12) + 2, r * (H / 5) + 2, W / 12 - 4, H / 5 - 4);
    g.fillRect(W * 0.3, H * 0.82, W * 0.4, H / 5 - 4);
  }, { px: 96 });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.062, -0.08);
  const lid = new THREE.Group();
  lid.position.set(0, 0.06, -0.38);
  lid.rotation.x = -0.28;
  const shell = rbox(1.15, 0.74, 0.04, 0x9aa0a8, 0.03, { metalness: 0.3 });
  shell.position.y = 0.37;
  const screen = decal(1.06, 0.66, (g, W, H) => {
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#7D2AE8';
    g.fillRect(0, 0, W, H * 0.11);
    g.fillStyle = '#FFF';
    g.font = `bold ${H * 0.07}px Rubik, Arial, sans-serif`;
    g.textBaseline = 'middle';
    g.fillText('Canva', 10, H * 0.056);
    g.fillStyle = '#F4F0F6';
    g.fillRect(0, H * 0.11, W * 0.24, H);
    g.fillStyle = '#24182E';
    g.font = `${H * 0.05}px Rubik, Arial, sans-serif`;
    ['Templates', 'Elements', 'Text', 'Uploads', 'Photos'].forEach((t, i) => g.fillText(t, 10, H * (0.2 + i * 0.1)));
    g.fillText('👑 Pro', 10, H * 0.75);
    g.fillStyle = '#E9E5EC';
    g.fillRect(W * 0.24, H * 0.11, W * 0.76, H);
    g.fillStyle = '#FFF8E7';
    g.fillRect(W * 0.5, H * 0.17, W * 0.24, H * 0.76);
    g.fillStyle = '#24182E';
    g.font = `bold ${H * 0.06}px Impact, sans-serif`;
    g.textAlign = 'center';
    g.fillText('CLEAN-UP', W * 0.62, H * 0.27);
    g.fillStyle = '#2EC4B6';
    g.fillRect(W * 0.53, H * 0.34, W * 0.18, H * 0.3);
    g.fillStyle = '#24182E';
    g.fillRect(W * 0.54, H * 0.72, W * 0.16, H * 0.03);
    g.fillRect(W * 0.56, H * 0.8, W * 0.12, H * 0.02);
    g.strokeStyle = '#FF4FA3';
    g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(W * 0.62, H * 0.15); g.lineTo(W * 0.62, H * 0.95); g.stroke();
  }, { px: 192, transparent: false });
  screen.position.set(0, 0.37, 0.022);
  lid.add(shell, screen);
  grp.add(base, keys, lid);
  return grp;
}

export const config = { camera: [2.2, 6.2, 13], target: [0.5, 2.1, 0], shadowSize: 9, frame: 0.8 };

export const missions = [
  { id: 'layout', text: 'Pick a template, then fix the layout: title, key information and details at the right levels, and delete what you don’t need.', hint: 'Choose CLEAN-UP DAY for Level 1, the date and place for Level 2, “Bring gloves…” for Level 3. Then delete the SALE! sticker.' },
  { id: 'style', text: 'Choose two fonts at most and colours with good contrast.', hint: 'One bold font for the title and a plain one (Open Sans) for the rest. The contrast check must say 4.5 : 1 or more.' },
  { id: 'picture', text: 'Use only a picture you may reuse, and credit it if it is Creative Commons.', hint: 'Your own photo or Canva’s free library is fine. A CC BY photo needs a credit line. Never someone else’s photo.' },
];
