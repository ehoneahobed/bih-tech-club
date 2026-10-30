// Session 38 — Web Page Builder: build a page about a community from blocks
// on a 3D computer, then look at the HTML behind it and change it.
// 1. Build a page with all four kinds of block: heading, paragraph, picture, link.
// 2. Open the HTML view and match each block to its tag (h1, p, img, a).
// 3. Edit the HTML: change some words, delete a closing tag to see the bug, then fix it.
// Safety: the pupil's HTML is never put into the web page. A tiny parser here
// reads only h1, h2, p, img, a, b, i and br, and the result is drawn on a canvas.
import { THREE, COLORS, rbox, mat, decal } from './runtime.js';

const FONT = 'Rubik, system-ui, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const C = { plum: '#24182e', purple: '#5a4470', gold: '#ffbe00', red: '#ca1f3f', green: '#2ec4b6', teal: '#2a9d8f', muted: '#6b6075', blue: '#1a0dab' };

const KINDS = {
  h1: { name: 'Heading', icon: 'H', col: '#ffbe00', ink: '#24182e', hex: COLORS.gold, what: 'the main heading' },
  p: { name: 'Paragraph', icon: '¶', col: '#5a4470', ink: '#ffffff', hex: COLORS.blue, what: 'a paragraph of text' },
  img: { name: 'Picture', icon: '🖼', col: '#2a9d8f', ink: '#ffffff', hex: 0x2a9d8f, what: 'a picture' },
  a: { name: 'Link', icon: '🔗', col: '#ca1f3f', ink: '#ffffff', hex: COLORS.red, what: 'a link' },
};
const PICTURES = {
  'market.jpg': 'Our busy market',
  'lagoon.jpg': 'The lagoon at sunset',
  'festival.jpg': 'Drummers at our festival',
};
const LINKS = [
  { href: 'https://scratch.mit.edu', text: 'Play my game' },
  { href: 'festival.html', text: 'Read about our festival' },
  { href: 'food.html', text: 'See our favourite food' },
];
const VOID = new Set(['img', 'br']);
const KNOWN = new Set(['h1', 'h2', 'p', 'img', 'a', 'b', 'i', 'br']);
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const attr = (s, name) => {
  const m = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(s);
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? '') : null;
};

// ---------- A tiny, safe HTML reader ----------
// Builds a small tree like a browser would, including its habits with a
// missing closing tag: a new <p> closes an open <p>; a new heading closes an
// open heading; anything else just ends up inside the element left open.
export function parseHTML(src) {
  const root = { tag: 'root', kids: [] };
  const stack = [root];
  const notes = [];
  const top = () => stack[stack.length - 1];
  const openIx = (t) => { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === t) return i; return -1; };
  const closeTo = (i) => { stack.length = i; };
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^<>]*)>/g;
  let last = 0, m;
  const text = (t) => { if (t) top().kids.push({ text: t }); };
  while ((m = re.exec(src))) {
    const before = src.slice(last, m.index);
    if (/<[a-zA-Z/]/.test(before)) notes.push({ kind: 'gt', text: before.slice(before.search(/<[a-zA-Z/]/)).split('\n')[0].trim() });
    text(before);
    last = re.lastIndex;
    const closing = m[1] === '/', tag = m[2].toLowerCase();
    if (!KNOWN.has(tag)) { notes.push({ kind: 'unknown', tag }); continue; }
    if (closing) {
      const i = openIx(tag);
      if (i > 0) {
        // Anything still open inside it was never closed.
        for (let k = stack.length - 1; k > i; k--) if (!stack[k].auto) notes.push({ kind: 'unclosed', tag: stack[k].tag });
        closeTo(i);
      } else if (!VOID.has(tag)) notes.push({ kind: 'stray', tag });
      continue;
    }
    if (VOID.has(tag)) { top().kids.push({ tag, src: attr(m[3], 'src'), alt: attr(m[3], 'alt') }); continue; }
    if (tag === 'p' || tag === 'h1' || tag === 'h2') {
      const pi = openIx('p');
      if (pi > 0) { stack[pi].auto = true; notes.push({ kind: 'autop' }); closeTo(pi); }
      if (tag !== 'p' && /^h[12]$/.test(top().tag)) { notes.push({ kind: 'unclosed', tag: top().tag }); stack.pop(); }
    }
    if (tag === 'a') { const ai = openIx('a'); if (ai > 0) { notes.push({ kind: 'unclosed', tag: 'a' }); closeTo(ai); } }
    const el = { tag, href: tag === 'a' ? attr(m[3], 'href') : null, kids: [] };
    top().kids.push(el);
    stack.push(el);
  }
  const rest = src.slice(last);
  if (/<[a-zA-Z/]/.test(rest)) notes.push({ kind: 'gt', text: rest.slice(rest.search(/<[a-zA-Z/]/)).split('\n')[0].trim() });
  text(rest);
  for (let k = stack.length - 1; k > 0; k--) if (!stack[k].auto) notes.push({ kind: 'unclosed', tag: stack[k].tag, end: true });
  return { root, notes };
}
// Real bugs: a missing closing tag (or a missing >). A harmless browser guess is not counted.
const bugsOf = (notes) => notes.filter((n) => n.kind === 'unclosed' || n.kind === 'gt' || n.kind === 'autop');
// The blocks a page has, in order: [{ tag, text }]
function blocksOf(root) {
  const out = [];
  const textOf = (n) => (n.text !== undefined ? decode(n.text) : (n.kids ?? []).map(textOf).join(''));
  const walk = (n) => {
    for (const k of n.kids ?? []) {
      if (k.text !== undefined) continue;
      if (k.tag === 'h1' || k.tag === 'h2' || k.tag === 'p') out.push({ tag: k.tag === 'h2' ? 'h1' : k.tag, text: textOf(k).replace(/\s+/g, ' ').trim() });
      if (k.tag === 'img') out.push({ tag: 'img', text: k.alt || k.src || '' });
      if (k.tag === 'a') out.push({ tag: 'a', text: textOf(k).replace(/\s+/g, ' ').trim() });
      walk(k);
    }
  };
  walk(root);
  return out;
}

export default function webpageLab(stage, ui) {
  const { scene } = stage;
  const T = 1.65;

  // ---------- Desk ----------
  const desk = rbox(9.4, 0.3, 5.0, 0xc8a27a, 0.05);
  desk.position.y = 1.5;
  scene.add(desk);
  const grain = decal(9.3, 4.9, (g, W, H) => {
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
  for (const x of [-4.2, 4.2]) for (const z of [-2.1, 2.1]) {
    const leg = rbox(0.28, 1.36, 0.28, 0x8a6a4a, 0.04);
    leg.position.set(x, 0.68, z);
    scene.add(leg);
  }
  const rgeo = (w, h, d, r) => { const m = rbox(w, h, d, 0, r); m.material.dispose(); return m.geometry; };

  // ---------- Monitor ----------
  const MW = 5.6, MH = 3.6, SW = 5.3, SH = 3.31;
  const monitor = new THREE.Group();
  const frameMat = mat(0x2f2238, { roughness: 0.4, metalness: 0.2 });
  const bezel = new THREE.Mesh(rgeo(MW, MH, 0.18, 0.1), frameMat);
  bezel.castShadow = true;
  bezel.position.y = MH / 2;
  const screen = decal(SW, SH, () => {}, { px: 600, transparent: false });
  screen.position.set(0, MH / 2 + 0.04, 0.092);
  const chin = decal(0.9, 0.12, (g, W, H) => {
    g.fillStyle = '#d9d3de';
    g.font = `700 ${H * 0.7}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('BIH', W / 2, H * 0.55);
  }, { px: 40 });
  chin.position.set(0, 0.07, 0.092);
  monitor.add(bezel, screen, chin);
  const neck = new THREE.Mesh(rgeo(0.4, 1.1, 0.2, 0.06), frameMat);
  neck.position.set(0, -0.35, -0.12);
  neck.castShadow = true;
  const foot = new THREE.Mesh(rgeo(1.8, 0.1, 1.1, 0.05), frameMat);
  foot.position.set(0, -0.86, 0);
  foot.castShadow = true;
  monitor.add(neck, foot);
  monitor.position.set(0, T + 0.91, -1.2);
  monitor.rotation.x = -0.06;
  scene.add(monitor);
  // Points on the screen for callouts.
  const spot = (x, y) => { const o = new THREE.Object3D(); o.position.set(x, y, 0.1); monitor.add(o); return o; };
  const urlSpot = spot(-0.6, MH - 0.42);
  const codeSpot = spot(-SW / 2 + 0.6, MH * 0.5);
  const pageSpot = spot(SW / 2 - 0.5, MH * 0.62);

  // ---------- Keyboard and mouse ----------
  const kb = rbox(3.4, 0.12, 1.1, 0xe8e2ee, 0.05);
  kb.position.set(-0.2, T + 0.06, 1.1);
  const keys = decal(3.2, 0.95, (g, W, H) => {
    g.fillStyle = '#e8e2ee';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#b8b0c0';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) {
      const w = (W - 16) / 14;
      const x = 8 + c * w, y = 6 + r * ((H - 12) / 5);
      if (r === 4 && c > 3 && c < 10) { if (c === 4) { g.beginPath(); g.roundRect(x, y, w * 6 - 3, (H - 12) / 5 - 3, 3); g.fill(); g.stroke(); } continue; }
      g.beginPath(); g.roundRect(x, y, w - 3, (H - 12) / 5 - 3, 3); g.fill(); g.stroke();
    }
  }, { px: 128, transparent: false });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(-0.2, T + 0.122, 1.1);
  scene.add(kb, keys);
  const mouse = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.22, 6, 12), mat(0xe8e2ee));
  mouse.rotation.x = Math.PI / 2;
  mouse.scale.set(1, 1, 0.55);
  mouse.position.set(1.75, T + 0.09, 1.3);
  mouse.castShadow = true;
  scene.add(mouse);

  // ---------- The block tray ----------
  const tray = new THREE.Group();
  const trayMat = mat(0x8a6a4a, { roughness: 0.7 });
  const tBase = new THREE.Mesh(rgeo(2.5, 0.08, 1.6, 0.03), trayMat);
  tBase.position.y = 0.04;
  tray.add(tBase);
  const toy = {};
  ['h1', 'p', 'img', 'a'].forEach((k, i) => {
    const K = KINDS[k];
    const grp = new THREE.Group();
    const cube = rbox(1.0, 0.45, 0.58, K.hex, 0.08);
    cube.position.y = 0.225;
    const face = decal(0.9, 0.38, (g, W, H) => {
      g.fillStyle = K.ink;
      g.textBaseline = 'middle';
      g.textAlign = 'center';
      g.font = `700 ${H * 0.5}px ${FONT}`;
      g.fillText(`${K.icon} ${K.name}`, W / 2, H * 0.55);
    }, { px: 80 });
    face.position.set(0, 0.225, 0.292);
    const top = decal(0.9, 0.5, (g, W, H) => {
      g.fillStyle = K.ink;
      g.textBaseline = 'middle';
      g.textAlign = 'center';
      g.font = `700 ${H * 0.42}px ${MONO}`;
      g.fillText(`<${k}>`, W / 2, H * 0.55);
    }, { px: 80 });
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, 0.452, 0);
    grp.add(cube, face, top);
    grp.position.set((i % 2) * 1.15 - 0.575, 0.08, Math.floor(i / 2) * 0.72 - 0.36);
    tray.add(grp);
    toy[k] = { grp, cube };
  });
  tray.position.set(3.3, T, 0.9);
  tray.rotation.y = -0.15;
  scene.add(tray);
  const flyer = new THREE.Group();
  const flyCube = new THREE.Mesh(rgeo(1.0, 0.45, 0.58, 0.08), mat(0xffffff));
  flyer.add(flyCube);
  flyer.visible = false;
  scene.add(flyer);

  // ---------- Notebook with a sitemap, a mug and a flag ----------
  const book = rbox(1.6, 0.06, 2.0, 0xfdfcf8, 0.02);
  book.position.set(-3.5, T + 0.03, 0.6);
  book.rotation.y = 0.2;
  const sitemap = decal(1.5, 1.9, (g, W, H) => {
    g.fillStyle = '#fdfcf8';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(90,68,112,0.18)';
    for (let y = H * 0.1; y < H; y += H / 18) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = '#24182e';
    g.font = `700 ${W * 0.09}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('My sitemap', W / 2, H * 0.08);
    const boxAt = (x, y, t, col) => {
      g.strokeStyle = col; g.lineWidth = 3;
      g.strokeRect(x - W * 0.17, y - H * 0.05, W * 0.34, H * 0.1);
      g.fillStyle = '#24182e';
      g.font = `600 ${W * 0.062}px ${FONT}`;
      g.fillText(t, x, y + 1);
    };
    boxAt(W / 2, H * 0.24, 'HOME', '#ca1f3f');
    g.strokeStyle = '#5a4470'; g.lineWidth = 2;
    for (const x of [0.2, 0.5, 0.8]) { g.beginPath(); g.moveTo(W / 2, H * 0.29); g.lineTo(W * x, H * 0.45); g.stroke(); }
    boxAt(W * 0.2, H * 0.5, 'Places', '#2a9d8f');
    boxAt(W * 0.5, H * 0.5, 'Food', '#2a9d8f');
    boxAt(W * 0.8, H * 0.5, 'Map', '#2a9d8f');
    g.font = `500 ${W * 0.06}px ${FONT}`;
    g.textAlign = 'left';
    ['Purpose: show our town', 'Audience: Hub pupils', 'No names or phone nos.!'].forEach((t, i) => g.fillText(t, W * 0.08, H * (0.68 + i * 0.09)));
  }, { px: 200, transparent: false });
  sitemap.rotation.x = -Math.PI / 2;
  sitemap.position.y = 0.031;
  book.add(sitemap);
  scene.add(book);
  const pencil = new THREE.Group();
  const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 6), mat(COLORS.gold));
  const pTip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), mat(0xe8c9a0));
  pTip.position.y = 0.62;
  pencil.add(pBody, pTip);
  pencil.rotation.set(Math.PI / 2, 0, -0.6);
  pencil.position.set(-2.55, T + 0.06, 0.9);
  scene.add(pencil);
  const mug = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.6, 20), mat(COLORS.red));
  cup.position.y = 0.3;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.045, 8, 16), mat(COLORS.red));
  handle.position.set(0.3, 0.32, 0);
  mug.add(cup, handle);
  mug.traverse((m) => m.isMesh && (m.castShadow = true));
  mug.position.set(-3.6, T, -1.2);
  scene.add(mug);
  // A little Ghana flag on a stand.
  const flag = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8), mat(0x8a8494));
  pole.position.y = 0.55;
  const fbase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 16), mat(0x8a8494));
  fbase.position.y = 0.03;
  const cloth = decal(0.6, 0.4, (g, W, H) => {
    ['#ce1126', '#fcd116', '#006b3f'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * H) / 3, W, H / 3 + 1); });
    g.fillStyle = '#000000';
    g.save();
    g.translate(W / 2, H / 2);
    g.beginPath();
    for (let k = 0; k < 10; k++) { const r = k % 2 ? H * 0.07 : H * 0.16; const a = -Math.PI / 2 + (k * Math.PI) / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.fill();
    g.restore();
  }, { px: 64, transparent: false });
  cloth.material.side = THREE.DoubleSide;
  cloth.position.set(0.31, 0.88, 0);
  flag.add(pole, fbase, cloth);
  flag.position.set(-2.3, T, -0.9);
  flag.rotation.y = 0.4;
  scene.add(flag);

  // ---------- State ----------
  const defaults = { heading: 'Our Bozoma', para: 'Our market opens at 6 am. Everyone is welcome!', pic: 'market.jpg', link: 0 };
  const form = { ...defaults };
  let src = '';
  let mode = 'page'; // 'page' | 'html'
  let part = 1, busy = false;
  let hi = null; // block index highlighted in the HTML view
  const matched = new Set();
  let edited = false, bugSeen = false, fixed = false, baseline = '';
  let parsed = parseHTML(src);

  // ---------- Drawing the screen ----------
  const scr = screen.material.map.image;
  const g = scr.getContext('2d');
  const W = scr.width, H = scr.height;
  const f = (px, w = 500, fam = FONT) => `${w} ${px}px ${fam}`;
  function rr(x, y, w, h, r, fill, stroke, lw = 2) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }
  function txt(s, x, y, { size = 20, weight = 500, color = C.plum, align = 'left', max = 0, fam = FONT } = {}) {
    let px = size;
    g.font = f(px, weight, fam);
    while (max && g.measureText(s).width > max && px > 10) g.font = f((px -= 1), weight, fam);
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillText(s, x, y);
  }
  function picture(name, x, y, w, h) {
    g.save();
    g.beginPath(); g.roundRect(x, y, w, h, 10); g.clip();
    const sky = (a, b) => { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(x, y, w, h); };
    if (name === 'market.jpg') {
      sky('#ffd97a', '#fff3cf');
      for (let i = 0; i < 4; i++) {
        const sx = x + 10 + i * (w - 20) / 4, sw = (w - 20) / 4;
        g.fillStyle = ['#ca1f3f', '#2a9d8f', '#ffbe00', '#5a4470'][i];
        g.beginPath(); g.moveTo(sx, y + h * 0.42); g.lineTo(sx + sw / 2, y + h * 0.2); g.lineTo(sx + sw - 6, y + h * 0.42); g.fill();
        g.fillStyle = '#c8a27a'; g.fillRect(sx + 4, y + h * 0.42, sw - 14, h * 0.36);
        for (let j = 0; j < 3; j++) { g.fillStyle = ['#ff8c1a', '#3aa655', '#ffbe00'][j]; g.beginPath(); g.arc(sx + sw * (0.25 + j * 0.22), y + h * 0.5, h * 0.05, 0, 7); g.fill(); }
      }
      g.fillStyle = '#d9b98a'; g.fillRect(x, y + h * 0.8, w, h * 0.2);
    } else if (name === 'lagoon.jpg') {
      sky('#ff9a5a', '#ffd9a0');
      g.fillStyle = '#ffbe00'; g.beginPath(); g.arc(x + w * 0.7, y + h * 0.5, h * 0.16, 0, 7); g.fill();
      g.fillStyle = '#2a6f8f'; g.fillRect(x, y + h * 0.55, w, h * 0.45);
      g.fillStyle = 'rgba(255,190,0,0.6)'; for (let k = 0; k < 4; k++) g.fillRect(x + w * 0.62, y + h * (0.6 + k * 0.08), w * 0.16, 3);
      g.strokeStyle = '#3d2c1e'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + w * 0.2, y + h * 0.56); g.quadraticCurveTo(x + w * 0.18, y + h * 0.3, x + w * 0.24, y + h * 0.15); g.stroke();
      g.fillStyle = '#3d5a3d'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + w * 0.24, y + h * 0.15, w * 0.08, h * 0.03, k * 0.6, 0, 7); g.fill(); }
    } else if (name === 'festival.jpg') {
      sky('#5a4470', '#ca1f3f');
      for (let i = 0; i < 3; i++) {
        const cx = x + w * (0.22 + i * 0.28);
        g.fillStyle = '#8a5a3c'; g.fillRect(cx - w * 0.07, y + h * 0.45, w * 0.14, h * 0.45);
        g.fillStyle = '#f4e3c8'; g.beginPath(); g.ellipse(cx, y + h * 0.45, w * 0.07, h * 0.05, 0, 0, 7); g.fill();
        g.strokeStyle = '#ffbe00'; g.lineWidth = 3;
        for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx - w * 0.07, y + h * (0.55 + k * 0.1)); g.lineTo(cx + w * 0.07, y + h * (0.6 + k * 0.1)); g.stroke(); }
      }
      ['#ffbe00', '#2a9d8f', '#ffffff'].forEach((c, i) => { g.fillStyle = c; g.fillRect(x, y + h * (0.04 + i * 0.05), w, h * 0.03); });
    } else {
      // A picture the browser can't find: it shows a broken-image icon and the alt text.
      g.fillStyle = '#f4f0f6'; g.fillRect(x, y, w, h);
      g.restore();
      g.save();
      g.strokeStyle = '#b8b0c0'; g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
      g.setLineDash([]);
      return false;
    }
    g.restore();
    return true;
  }

  // Lay the parsed page out as lines of styled words.
  function drawPage(x0, y0, w, h, scale) {
    g.save();
    g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    g.fillStyle = '#ffffff';
    g.fillRect(x0, y0, w, h);
    // The site's menu bar (Google Sites style).
    g.fillStyle = '#24182e';
    g.fillRect(x0, y0, w, 40 * scale);
    txt('Our Bozoma', x0 + 16 * scale, y0 + 20 * scale, { size: 16 * scale, weight: 700, color: '#fff' });
    ['Home', 'Places', 'Food', 'Map'].forEach((t, i) => txt(t, x0 + w - (4 - i) * 70 * scale, y0 + 20 * scale, { size: 13 * scale, color: i ? '#d9d3de' : C.gold, weight: i ? 500 : 700 }));
    let y = y0 + 56 * scale;
    const pad = 22 * scale, maxW = w - pad * 2;
    let blockIx = -1;
    const boxes = [];
    const styleOf = (stk) => {
      const head = stk.find((t) => t === 'h1' || t === 'h2');
      const size = (head === 'h1' ? 34 : head === 'h2' ? 26 : 17) * scale;
      return { size, bold: !!head || stk.includes('b'), italic: stk.includes('i'), link: stk.includes('a') };
    };
    let line = [], lineW = 0, lineH = 0, blockTop = y;
    const flush = () => {
      if (!line.length) return;
      const h1 = lineH * 1.25;
      let x = x0 + pad;
      for (const r of line) {
        g.font = `${r.st.italic ? 'italic ' : ''}${r.st.bold ? 700 : 400} ${r.st.size}px ${FONT}`;
        g.fillStyle = r.st.link ? C.blue : C.plum;
        g.textAlign = 'left';
        g.textBaseline = 'middle';
        g.fillText(r.t, x, y + h1 / 2);
        if (r.st.link) { g.fillRect(x, y + h1 / 2 + r.st.size * 0.55, r.w, Math.max(1.5, r.st.size * 0.07)); }
        x += r.w;
      }
      y += h1;
      line = []; lineW = 0; lineH = 0;
    };
    const word = (t, st) => {
      g.font = `${st.italic ? 'italic ' : ''}${st.bold ? 700 : 400} ${st.size}px ${FONT}`;
      const ww = g.measureText(t).width;
      if (lineW + ww > maxW && line.length) flush();
      line.push({ t, st, w: ww });
      lineW += ww;
      lineH = Math.max(lineH, st.size);
    };
    const startBlock = () => { flush(); y += 6 * scale; blockTop = y; };
    const endBlock = (ix, tag) => { flush(); boxes.push({ ix, tag, top: blockTop, bot: y }); y += 6 * scale; };
    const walk = (n, stk) => {
      for (const k of n.kids ?? []) {
        if (k.text !== undefined) {
          const st = styleOf(stk);
          const parts = decode(k.text).replace(/\s+/g, ' ').split(/(?= )/);
          for (const p of parts) if (p.trim() || (line.length && p === ' ')) word(line.length ? p : p.trimStart(), st);
          continue;
        }
        if (k.tag === 'br') { flush(); continue; }
        if (k.tag === 'img') {
          flush();
          const ix = ++blockIx;
          const ih = 120 * scale, iw = Math.min(maxW, 200 * scale);
          const ok = picture(k.src, x0 + pad, y + 4 * scale, iw, ih);
          if (!ok) {
            txt('🖼 ' + (k.alt || k.src || 'picture'), x0 + pad + 10 * scale, y + 4 * scale + ih / 2 - 9 * scale, { size: 13 * scale, color: C.muted, max: iw - 20 * scale });
            txt(`“${k.src || '?'}” not found`, x0 + pad + 10 * scale, y + 4 * scale + ih / 2 + 11 * scale, { size: 11 * scale, color: C.red, max: iw - 20 * scale });
          }
          boxes.push({ ix, tag: 'img', top: y, bot: y + ih + 8 * scale });
          y += ih + 12 * scale;
          continue;
        }
        const isBlock = k.tag === 'h1' || k.tag === 'h2' || k.tag === 'p';
        if (isBlock) { startBlock(); const ix = ++blockIx; walk(k, [...stk, k.tag]); endBlock(ix, k.tag); continue; }
        if (k.tag === 'a') {
          // A link inside a block shares its line; a link on its own gets its own box.
          const own = !stk.some((t) => t === 'p' || t === 'h1' || t === 'h2');
          const ix = ++blockIx;
          if (own) startBlock();
          walk(k, [...stk, 'a']);
          if (own) endBlock(ix, 'a');
          continue;
        }
        walk(k, [...stk, k.tag]);
      }
    };
    walk(parsed.root, []);
    flush();
    if (!blocksOf(parsed.root).length) {
      txt('Your page is empty.', x0 + w / 2, y0 + h * 0.45, { size: 22 * scale, weight: 700, color: C.muted, align: 'center' });
      txt('Add blocks from the tray →', x0 + w / 2, y0 + h * 0.45 + 30 * scale, { size: 15 * scale, color: C.muted, align: 'center' });
    }
    // Colour bands show which block is which in the HTML view.
    if (mode === 'html') {
      const list = blocksOf(parsed.root);
      for (const b of boxes) {
        const kind = list[b.ix]?.tag ?? b.tag;
        const K = KINDS[kind === 'h2' ? 'h1' : kind];
        if (!K) continue;
        g.fillStyle = K.col;
        g.fillRect(x0 + 6 * scale, b.top, 6 * scale, Math.max(8, b.bot - b.top));
        if (hi === b.ix) { g.strokeStyle = K.col; g.lineWidth = 4; g.strokeRect(x0 + 14 * scale, b.top - 2, w - 22 * scale, b.bot - b.top + 4); }
      }
    }
    g.restore();
    return boxes;
  }

  function codeLines() {
    // Soft-wrap the HTML source to the code panel's width.
    const out = [];
    src.split('\n').forEach((l, n) => {
      const max = 37;
      if (!l.length) out.push({ n, t: '' });
      for (let i = 0; i < l.length; i += max) out.push({ n, t: l.slice(i, i + max), cont: i > 0 });
    });
    return out;
  }
  function drawCode(x0, y0, w, h) {
    g.fillStyle = '#1e1526';
    g.fillRect(x0, y0, w, h);
    g.fillStyle = '#2f2238';
    g.fillRect(x0, y0, w, 30);
    txt('my-page.html', x0 + 14, y0 + 15, { size: 14, weight: 600, color: '#d9d3de' });
    const lines = codeLines();
    const lh = Math.min(26, (h - 44) / Math.max(1, lines.length));
    const size = Math.max(11, Math.min(17, lh * 0.72));
    g.font = f(size, 500, MONO);
    const cw = g.measureText('M').width;
    const blockOfLine = lineBlocks();
    lines.forEach((L, i) => {
      const y = y0 + 44 + i * lh;
      const bi = blockOfLine[L.n];
      if (bi !== undefined) {
        const kind = blocksOf(parsed.root)[bi]?.tag;
        const K = KINDS[kind];
        if (K) { g.fillStyle = K.col; g.fillRect(x0 + 2, y - lh / 2, 4, lh); if (hi === bi) { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x0, y - lh / 2, w, lh); } }
      }
      if (!L.cont) txt(String(L.n + 1), x0 + 26, y, { size: size * 0.85, color: '#6b6075', align: 'right', fam: MONO });
      // Colour the tags, attributes and text.
      let x = x0 + 36;
      g.textAlign = 'left';
      const re = /(<\/?[a-zA-Z0-9]*)|([a-zA-Z]+=)|("[^"]*"?)|(>)|([^<>"=]+|.)/g;
      let m, inTag = false;
      while ((m = re.exec(L.t))) {
        let col = '#f4f0f6';
        if (m[1]) { col = '#ff7a93'; inTag = true; } else if (m[4]) { col = '#ff7a93'; inTag = false; } else if (m[2] && inTag) col = '#ffd166'; else if (m[3] && inTag) col = '#7ee0d2';
        g.fillStyle = col;
        g.font = f(size, m[1] || m[4] ? 700 : 500, MONO);
        g.fillText(m[0], x, y);
        x += m[0].length * cw;
      }
    });
  }
  // Which source line starts each block (for the colour marks in the code).
  function lineBlocks() {
    const map = {};
    let ix = 0;
    src.split('\n').forEach((l, n) => {
      const opens = (l.match(/<(h1|h2|p|img|a)\b/gi) ?? []);
      // A link inside a paragraph is part of that paragraph's line.
      if (opens.length) { map[n] = ix; ix += opens.length; }
    });
    return map;
  }

  function drawScreen() {
    g.fillStyle = '#f4f0f6';
    g.fillRect(0, 0, W, H);
    // Browser window
    g.fillStyle = '#e8e2ee';
    g.fillRect(0, 0, W, 76);
    rr(14, 8, 210, 30, [10, 10, 0, 0], '#ffffff');
    txt('🌐 Our Bozoma', 28, 23, { size: 15, weight: 600 });
    ['#ca1f3f', '#ffbe00', '#2ec4b6'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(W - 70 + i * 22, 23, 7, 0, 7); g.fill(); });
    g.fillStyle = '#ffffff';
    g.fillRect(0, 38, W, 38);
    txt('◁  ▷  ↻', 18, 57, { size: 16, color: C.muted });
    rr(110, 43, W - 300, 28, 14, '#f4f0f6');
    txt('🔒 sites.google.com/view/our-bozoma', 126, 57, { size: 15, color: C.plum });
    const btns = [['👁 Page', 'page'], ['</> HTML', 'html']];
    btns.forEach(([t, m], i) => {
      const x = W - 178 + i * 86;
      rr(x, 44, 80, 26, 13, mode === m ? C.plum : '#e8e2ee');
      txt(t, x + 40, 57, { size: 13, weight: 700, color: mode === m ? '#fff' : C.plum, align: 'center' });
    });
    if (mode === 'page') drawPage(0, 76, W, H - 76, 1.35);
    else {
      const cw = Math.round(W * 0.47);
      drawCode(0, 76, cw, H - 76);
      g.fillStyle = '#24182e';
      g.fillRect(cw, 76, 4, H - 76);
      drawPage(cw + 4, 76, W - cw - 4, H - 76, 1.0);
    }
    // Bug banner
    const bugs = bugsOf(parsed.notes);
    if (bugs.length && mode === 'html') {
      rr(W * 0.5, H - 52, W * 0.48, 42, 12, 'rgba(202,31,63,0.95)');
      txt(`🐞 ${bugText(bugs[0], true)}`, W * 0.52, H - 31, { size: 15, weight: 700, color: '#fff', max: W * 0.45 });
    }
    screen.material.map.needsUpdate = true;
  }
  function bugText(b, short) {
    if (b.kind === 'unclosed') return short ? `<${b.tag}> is never closed` : `The <b>&lt;${b.tag}&gt;</b> is never closed. The browser doesn't know where it ends${b.tag === 'h1' || b.tag === 'h2' ? ', so everything after it became part of the heading too' : b.tag === 'a' ? ', so everything after it became part of the link' : ''}.`;
    if (b.kind === 'gt') return short ? 'A tag is missing its >' : `<b>${esc(b.text.slice(0, 24))}</b> is missing its <b>&gt;</b>, so the browser shows it as plain text.`;
    if (b.kind === 'autop') return short ? 'A </p> is missing' : 'A <b>&lt;/p&gt;</b> is missing. The browser guessed where the paragraph ends, but a missing closing tag is still a bug.';
    return '';
  }

  // ---------- Building blocks ----------
  const htmlFor = (kind) => {
    if (kind === 'h1') return `<h1>${esc(form.heading || 'My town')}</h1>`;
    if (kind === 'p') return `<p>${esc(form.para || 'Akwaaba to our town.')}</p>`;
    if (kind === 'img') return `<img src="${form.pic}" alt="${PICTURES[form.pic]}">`;
    const L = LINKS[form.link];
    return `<a href="${L.href}">${L.text}</a>`;
  };
  function reparse() {
    parsed = parseHTML(src);
    drawScreen();
  }
  async function addBlock(kind) {
    if (busy) return;
    if (part !== 1) showPart(1);
    if (kind === 'p' && /\d[\d\s-]{8,}\d/.test(form.para)) {
      return ui.info('🛡️ No phone numbers!', '<p>That looks like a <b>phone number</b>. The web builder\'s safety rules: no personal details (names, phone numbers, addresses) on a website. Change the paragraph first.</p>');
    }
    busy = true;
    setBusy(true);
    const K = KINDS[kind];
    const from = toy[kind].grp.getWorldPosition(new THREE.Vector3());
    const to = monitor.localToWorld(new THREE.Vector3(0, MH / 2, 0.4));
    flyCube.material.color.setHex(K.hex);
    flyer.visible = true;
    stage.reveal();
    await stage.tween((k) => {
      flyer.position.lerpVectors(from, to, k);
      flyer.position.y += Math.sin(k * Math.PI) * 1.4;
      flyer.rotation.set(0, -0.25 * (1 - k), 0);
      flyer.scale.setScalar(1 - k * 0.7);
    }, 0.6);
    flyer.visible = false;
    src += (src && !src.endsWith('\n') ? '\n' : '') + htmlFor(kind);
    reparse();
    busy = false;
    setBusy(false);
    const kinds = new Set(blocksOf(parsed.root).map((b) => b.tag));
    const missing = ['h1', 'p', 'img', 'a'].filter((k) => !kinds.has(k)).map((k) => `${KINDS[k].icon} ${KINDS[k].name}`);
    const WHY = {
      h1: '<p>A big, clear <b>heading</b> tells visitors what the page is about.</p>',
      p: '<p>A <b>paragraph</b> holds your sentences. Keep it short, like a good slide.</p>',
      img: `<p>A <b>picture</b> of a place, not a face: “${esc(PICTURES[form.pic])}”. Only use pictures you are allowed to use.</p>`,
      a: `<p>A <b>link</b> is a door to another page: clicking “${esc(LINKS[form.link].text)}” goes to <b>${esc(LINKS[form.link].href)}</b>.</p>`,
    };
    if (!missing.length) {
      const first = !ui.isDone('build');
      ui.complete('build');
      ui.info(first ? '🏆 Your page has all four blocks!' : `➕ ${K.name} added`, `${WHY[kind]}${first ? '<p>Heading, paragraph, picture and link: a real little web page. Now press <b>2 </> See the HTML</b> to look behind the curtain.</p>' : ''}`);
    } else ui.info(`➕ ${K.name} added`, `${WHY[kind]}<p><small>Still to add: ${missing.join(', ')}.</small></p>`);
    panel1();
  }
  function removeLast() {
    if (busy || !src) return;
    const lines = src.split('\n');
    lines.pop();
    src = lines.join('\n');
    reparse();
    ui.info('↶ Removed', '<p>The last block is gone from the page, and its line is gone from the HTML.</p>');
  }

  // ---------- Side panel ----------
  const tabs = ui.group('Three parts');
  const tabBtns = [
    ui.button('1 🧱 Build', () => showPart(1), { group: tabs }),
    ui.button('2 </> See the HTML', () => showPart(2), { group: tabs }),
    ui.button('3 ✏️ Edit the HTML', () => showPart(3), { group: tabs }),
  ];
  const box = ui.group('');
  const heading = (t) => ui.element(`<span class="lab-group-title">${esc(t)}</span>`, box);
  function setBusy(on) {
    for (const b of box.querySelectorAll('button')) { b.setAttribute('aria-disabled', String(on)); b.style.opacity = on ? '0.5' : ''; }
  }
  const btn = (label, fn, o = {}) => {
    const b = ui.button(label, () => { if (!busy) fn(); }, { group: box, ...o });
    b.dataset.key = o.key ?? label;
    return b;
  };
  function keepFocus(fn) {
    const had = box.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    box.innerHTML = '';
    fn();
    if (had) ([...box.querySelectorAll('button')].find((b) => b.dataset.key === had) ?? box.querySelector('button'))?.focus();
  }
  function showPart(n) {
    if (busy) return;
    part = n;
    ui.toggle(tabBtns, tabBtns[n - 1]);
    tabBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === n - 1)));
    mode = n === 1 ? 'page' : 'html';
    hi = null;
    [panel1, panel2, panel3][n - 1](true);
    drawScreen();
    stage.reveal();
  }

  function panel1(intro) {
    keepFocus(() => {
      heading('Your words (about your community)');
      const d = ui.element(`
        <label class="lab-field">🅷 Heading<input type="text" maxlength="30" data-k="heading" value="${esc(form.heading)}"></label>
        <label class="lab-field">¶ Paragraph<input type="text" maxlength="90" data-k="para" value="${esc(form.para)}"></label>
        <label class="lab-field">🖼 Picture<select data-k="pic">${Object.entries(PICTURES).map(([k, v]) => `<option value="${k}"${form.pic === k ? ' selected' : ''}>${esc(v)} (${k})</option>`).join('')}</select></label>
        <label class="lab-field">🔗 Link<select data-k="link">${LINKS.map((l, i) => `<option value="${i}"${form.link === i ? ' selected' : ''}>${esc(l.text)} → ${esc(l.href)}</option>`).join('')}</select></label>`, box);
      d.querySelectorAll('[data-k]').forEach((el) => el.addEventListener('input', () => { form[el.dataset.k] = el.dataset.k === 'link' ? Number(el.value) : el.value; }));
      heading('Add a block to the page');
      for (const k of ['h1', 'p', 'img', 'a']) btn(`➕ ${KINDS[k].icon} ${KINDS[k].name}`, () => addBlock(k), { key: k, primary: !new Set(blocksOf(parsed.root).map((b) => b.tag)).has(k) });
      btn('↶ Remove the last block', removeLast, { key: 'undo' });
      btn('🗑 Start a new page', () => { src = ''; reparse(); ui.info('🗑 A blank page', '<p>Add a heading first, then a paragraph, a picture and a link.</p>'); panel1(); }, { key: 'new' });
    });
    if (intro) ui.info('🧱 Build a web page', '<p>Make a page about your community, like the “Our Bozoma” site in your workbook. Type your own heading and paragraph (no names or phone numbers!), choose a picture and a link, then press the <b>➕</b> buttons to add the blocks.</p><p>You need all four kinds: a <b>heading</b>, a <b>paragraph</b>, a <b>picture</b> and a <b>link</b>.</p>');
  }

  // ----- Part 2: which tag did each block become? -----
  let quiz = null; // index into the page's blocks
  function panel2(intro) {
    const list = blocksOf(parsed.root);
    const firsts = ['h1', 'p', 'img', 'a'].map((k) => list.findIndex((b) => b.tag === k)).filter((i) => i >= 0);
    keepFocus(() => {
      if (firsts.length < 4) {
        ui.element('<div class="mail-card"><p style="margin:0">Your page needs all four kinds of block first: a heading, a paragraph, a picture and a link.</p></div>', box);
        btn('◀ Back to 1 🧱 Build', () => showPart(1), { primary: true });
        return;
      }
      heading(`Match each block to its tag · ${matched.size} of 4`);
      const next = firsts.find((i) => !matched.has(list[i].tag));
      if (next === undefined) {
        ui.element('<div class="mail-card"><p class="mail-done" style="margin:0">🏆 All four matched!</p></div>', box);
        btn('Next: 3 ✏️ Edit the HTML ▶', () => showPart(3), { primary: true });
      } else {
        quiz = next;
        hi = next;
        const b = list[next];
        ui.element(`<div class="mail-card"><small class="mail-count">The block with the coloured box on the screen:</small><p style="margin:6px 0 0"><b>${b.tag === 'img' ? '🖼 a picture' : '“' + esc(b.text.slice(0, 50)) + '”'}</b></p><small class="mail-count">Which tag made it?</small></div>`, box);
        for (const t of ['h1', 'p', 'img', 'a']) btn(`<${t}>`, () => answer(t), { key: 't-' + t });
      }
    });
    drawScreen();
    if (intro && firsts.length === 4 && matched.size < 4) ui.info('</> Behind the curtain', '<p>The left half of the screen is the page\'s <b>HTML</b>. The browser reads these <b>tags</b> and draws the page on the right. The tags themselves stay hidden.</p><p>The coloured marks show which line made which block. Which tag made the block in the box?</p>');
  }
  function answer(t) {
    const list = blocksOf(parsed.root);
    const b = list[quiz];
    if (!b) return;
    const TAGS = {
      h1: '<b>&lt;h1&gt;…&lt;/h1&gt;</b> makes the main heading.',
      p: '<b>&lt;p&gt;…&lt;/p&gt;</b> makes a paragraph of text.',
      img: '<b>&lt;img src="…" alt="…"&gt;</b> makes a picture. <b>src</b> is the picture file; <b>alt</b> describes it for people who can\'t see it. It has no closing tag.',
      a: '<b>&lt;a href="…"&gt;…&lt;/a&gt;</b> makes a link. <b>href</b> holds the address; the words between the tags are what you click.',
    };
    if (t === b.tag) {
      matched.add(t);
      ui.info(`✅ Yes: <${t}>`, `<p>${TAGS[t]}</p>`);
      if (matched.size === 4) {
        ui.complete('tags');
        ui.info('🏆 You can read HTML!', '<p><b>&lt;h1&gt;</b> heading, <b>&lt;p&gt;</b> paragraph, <b>&lt;img&gt;</b> picture, <b>&lt;a&gt;</b> link. Every web page in the world is built from tags like these.</p><p>Next: <b>3 ✏️ Edit the HTML</b> and change the page yourself.</p>');
      }
    } else ui.info(`🤔 Not <${t}>`, `<p>${TAGS[t]} Look at the line with the same colour mark as the box, and try again.</p>`);
    panel2();
  }

  // ----- Part 3: edit the HTML -----
  let timer = null;
  function panel3(intro) {
    // Each visit starts from the page as it is now.
    if (intro || snapshot === null) { snapshot = src; baseline = textOnly(); }
    keepFocus(() => {
      if (!src.trim()) {
        ui.element('<div class="mail-card"><p style="margin:0">There is no HTML yet. Build a page in part 1 first.</p></div>', box);
        btn('◀ Back to 1 🧱 Build', () => showPart(1), { primary: true });
        return;
      }
      heading('my-page.html (type to change it)');
      const d = ui.element(`<label class="lab-field"><span class="sr-only" style="position:absolute;left:-9999px">The HTML of your page</span><textarea rows="8" spellcheck="false" autocomplete="off" style="font:13.5px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap"></textarea></label><p class="crack wp-status" role="status" style="margin-top:6px"></p>`, box);
      const ta = d.querySelector('textarea');
      ta.value = src;
      statusEl = d.querySelector('.wp-status');
      ta.addEventListener('input', () => {
        src = ta.value.slice(0, 2000);
        clearTimeout(timer);
        timer = setTimeout(afterEdit, 300);
      });
      editor = ta;
      showStatus();
      heading('Helpers');
      btn('✂️ Delete the </h1> for me', () => {
        if (!/<\/h1>/i.test(src)) return ui.info('✂️ No </h1> here', '<p>There is no <b>&lt;/h1&gt;</b> in your HTML. Add a heading block in part 1, or delete another closing tag yourself.</p>');
        src = src.replace(/<\/h1>/i, '');
        editor.value = src;
        afterEdit();
      }, { key: 'cut' });
      btn('↺ Undo all my changes', () => { if (snapshot !== null) { src = snapshot; editor.value = src; afterEdit(true); } }, { key: 'undo' });
    });
    if (intro && src.trim()) ui.info('✏️ Change the HTML', '<p>The box below holds your page\'s HTML. <b>Change a word</b> between the tags (for example in the heading) and watch the page on the screen change.</p><p>Then try a bug: <b>delete a closing tag</b>, like <b>&lt;/h1&gt;</b>. What happens? Then fix it.</p>');
  }
  let statusEl = null, editor = null, snapshot = null;
  function textOnly() { return blocksOf(parseHTML(src).root).map((b) => b.text).join('|'); }
  function showStatus() {
    if (!statusEl) return;
    const bugs = bugsOf(parsed.notes);
    statusEl.innerHTML = bugs.length ? `🐞 <b>Bug:</b> ${bugText(bugs[0])}` : '✅ No bugs: every tag is closed.';
    statusEl.style.color = bugs.length ? '#ca1f3f' : '#2a9d8f';
  }
  function afterEdit(quiet) {
    const hadBug = bugsOf(parsed.notes).length > 0;
    reparse();
    showStatus();
    const bugs = bugsOf(parsed.notes);
    if (textOnly() !== baseline && !bugs.length) edited = true;
    if (quiet) return ui.info('↺ Back to how it was', '<p>Your HTML is back to the blocks you built.</p>');
    if (bugs.length) {
      if (!hadBug) {
        bugSeen = true;
        stage.reveal();
        ui.info('🐞 A bug!', `<p>${bugText(bugs[0])}</p><p>Look at the page on the screen. The computer does <b>exactly</b> what you write. Now fix it: put the closing tag back, with its slash: <b>&lt;/${bugs[0].tag ?? 'h1'}&gt;</b>.</p>`);
      }
    } else if (hadBug && bugSeen) {
      fixed = true;
      ui.info('🔧 Bug fixed!', `<p>Every opening tag has its closing tag again, so the browser knows where each element ends. Spot it, trace it, fix one thing: just like debugging in Scratch.</p>${edited ? '' : '<p>Last step: <b>change some words</b> between the tags and watch the page change.</p>'}`);
    } else if (textOnly() !== baseline) {
      ui.info('✏️ The page changed', '<p>You changed the HTML, and the browser redrew the page. That is all a web page is: text with tags, read by a browser.</p>');
    }
    if (edited && bugSeen && fixed && !bugs.length && !ui.isDone('edit')) {
      ui.complete('edit');
      ui.info('🏆 You are a web builder!', '<p>You changed the page by editing its HTML, made a bug by deleting a closing tag, saw what it did, and fixed it.</p><p>Now try the real thing: write <b>my-page.html</b> in Notepad (Mission 2 on Page 5).</p>');
    }
  }

  // ---------- Clicking the model ----------
  for (const k of ['h1', 'p', 'img', 'a']) stage.clickable(toy[k].grp, () => addBlock(k));
  stage.clickable(monitor, () => {
    if (part === 1) ui.info('🖥 Your web page', '<p>This is how visitors see your page in a browser. Press <b>2 </> See the HTML</b> to see the code behind it.</p>');
    else ui.info('</> The HTML view', '<p>Left: the HTML (tags and text). Right: the page the browser draws from it.</p>');
  });
  stage.clickable(book, () => ui.info('📓 Sitemap', '<p>Before you build, answer three planning questions: <b>purpose</b>, <b>audience</b> and <b>pages</b>. A sitemap is a quick drawing of all the pages and how they connect, with the home page at the top.</p>'));

  // ---------- Callouts (most important first: phones show only four) ----------
  stage.callout(tray, { icon: '🧱', title: 'Blocks', text: 'Each block becomes one HTML element.', at: [0, 0.6, -0.4], dx: 40, dy: -110, onClick: () => showPart(1) });
  stage.callout(codeSpot, { icon: '&lt;/&gt;', title: 'HTML tags', text: '<h1>, <p>, <img> and <a> tell the browser what each part is.'.replace(/</g, '&lt;'), dx: -170, dy: -40, onClick: () => showPart(2) });
  stage.callout(pageSpot, { icon: '🖥️', title: 'The page', text: 'The browser draws it from the HTML.', dx: 170, dy: -60 });
  stage.callout(book, { icon: '📓', title: 'Sitemap', text: 'Plan the pages before you build.', at: [0, 0.1, -0.6], dx: -40, dy: -90 });
  stage.callout(urlSpot, { icon: '🔒', title: 'Web address', text: 'Every site has a URL, like a house address.', dx: -60, dy: -90 });

  // Start with a heading already on the page, so it isn't blank.
  src = htmlFor('h1');
  reparse();
  showPart(1);
}

export const missions = [
  { id: 'build', text: 'Build a page about your community with all four blocks: heading, paragraph, picture and link.', hint: 'Type your words, then press ➕ Paragraph, ➕ Picture and ➕ Link (the heading is already there).' },
  { id: 'tags', text: 'Open the HTML view and match each block to the tag it became: h1, p, img or a.', hint: 'Press 2 &lt;/&gt; See the HTML. The coloured marks join each line of HTML to its block.' },
  { id: 'edit', text: 'Edit the HTML: change some words, delete a closing tag to see the bug, then fix it.', hint: 'In 3 ✏️, change a word in the box. Then delete &lt;/h1&gt;, watch the page, and type &lt;/h1&gt; back.' },
];

export const config = { camera: [2.6, 7.6, 12], target: [0, 3.2, -0.2], shadowSize: 9, frame: 0.7, minDistance: 4 };
