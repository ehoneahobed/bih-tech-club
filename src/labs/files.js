// Sessions 4–5 — Files, Folders & File Operations: a 3D filing tree from the
// drive down to files. Open folders, follow the path, then copy, cut, delete
// and restore files from the Recycle Bin.
import { THREE, COLORS, box, rbox, mat, decal, cable, label } from './runtime.js';

const tree = () => ({
  name: 'C: Drive', kind: 'drive', open: true, children: [
    { name: 'Documents', kind: 'folder', open: true, children: [
      { name: 'Tech Club Practice', kind: 'folder', open: true, children: [
        { name: 'First_Practice.docx', kind: 'doc' },
        { name: 'Greener_School.docx', kind: 'doc' },
      ] },
      { name: 'Science', kind: 'folder', open: false, children: [{ name: 'Water_Cycle_Notes.docx', kind: 'doc' }] },
    ] },
    { name: 'Pictures', kind: 'folder', open: false, children: [{ name: 'Club_Logo.png', kind: 'img' }] },
    { name: 'Downloads', kind: 'folder', open: false, children: [] },
    { name: 'Desktop', kind: 'folder', open: false, children: [] },
  ],
});

const FILE_COLORS = { doc: 0x3d6fd6, img: 0x2ec4b6, sheet: 0x2a9d8f };
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
const MANILA = 0xe9c46a;

// ---------- Model parts ----------
// A flat outline (list of [x, y]) pushed out to a thin slab, centred on z = 0.
function slab(points, depth, color, extra) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geo, mat(color, extra));
  m.castShadow = m.receiveShadow = true;
  return m;
}
// A printed label wrapped round part of a cylinder (the bin's recycling sticker).
function wrapDecal(r, h, arc, draw) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = Math.round(256 * h / (r * arc));
  draw(c.getContext('2d'), c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.CylinderGeometry(r, r, h, 16, 1, true, -arc / 2, arc);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  m.userData.noInk = true;
  return m;
}
function freeGroup(g) {
  g.traverse((m) => {
    if (!m.isMesh && !m.isLine) return;
    m.geometry?.dispose();
    if (!m.userData.isInk) { m.material.map?.dispose(); m.material.dispose(); }
  });
}

// The drive: a hard-disk box with a printed "C:" plate, vents and a busy light.
function driveModel(g) {
  const body = rbox(2.4, 0.7, 1.4, 0x3b3f46, 0.08, { metalness: 0.3, roughness: 0.45 });
  body.position.y = 0.38;
  const front = decal(2.3, 0.6, (c, W, H) => {
    c.fillStyle = '#e9e4ec';
    c.beginPath(); c.roundRect(W * 0.03, H * 0.18, W * 0.3, H * 0.64, 10); c.fill();
    c.fillStyle = '#24182e';
    c.font = `bold ${H * 0.42}px Rubik, system-ui, sans-serif`;
    c.textBaseline = 'middle';
    c.fillText('C:', W * 0.07, H * 0.52);
    c.fillStyle = '#ca1f3f';
    c.fillRect(W * 0.03, H * 0.18, W * 0.018, H * 0.64);
    c.strokeStyle = '#1d2026';
    c.lineWidth = H * 0.05;
    c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = W * (0.42 + i * 0.045);
      c.beginPath(); c.moveTo(x, H * 0.28); c.lineTo(x, H * 0.72); c.stroke();
    }
  }, { px: 128 });
  front.position.set(0, 0.38, 0.702);
  const top = decal(1.5, 0.8, (c, W, H) => {
    c.fillStyle = '#f9f9f9';
    c.beginPath(); c.roundRect(0, 0, W, H, 14); c.fill();
    c.fillStyle = '#5a4470';
    c.fillRect(0, 0, W, H * 0.22);
    c.fillStyle = '#ffffff';
    c.font = `bold ${H * 0.13}px Rubik, system-ui, sans-serif`;
    c.fillText('LOCAL DISK (C:)', W * 0.05, H * 0.15);
    c.fillStyle = '#24182e';
    c.font = `${H * 0.11}px Rubik, system-ui, sans-serif`;
    c.fillText('Storage  500 GB', W * 0.05, H * 0.42);
    c.fillText('Windows, apps, your files', W * 0.05, H * 0.6);
    for (let i = 0; i < 40; i++) c.fillRect(W * 0.05 + i * W * 0.012, H * 0.72, (i % 3) + 1.5, H * 0.18);
  }, { px: 256 });
  top.rotation.x = -Math.PI / 2;
  top.position.set(-0.3, 0.732, 0);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mat(0x2ec4b6, { emissive: 0x2ec4b6, emissiveIntensity: 0.8 }));
  led.position.set(0.95, 0.38, 0.7);
  led.userData.glow = true;
  g.add(body, front, top, led);
  for (const x of [-1, 1]) for (const z of [-0.55, 0.55]) {
    const foot = rbox(0.25, 0.06, 0.25, 0x1d2026, 0.02);
    foot.position.set(x, 0.03, z);
    g.add(foot);
  }
  g.userData.led = led;
}

// A manila folder: back panel with tab, sheets inside and a front flap on a hinge.
function folderModel(g, node) {
  const back = slab([[-0.75, 0], [0.75, 0], [0.75, 1.0], [-0.08, 1.0], [-0.16, 1.16], [-0.68, 1.16], [-0.75, 1.06]], 0.05, MANILA);
  const papers = new THREE.Group();
  for (const [x, y, z, rz] of [[-0.05, 0.47, 0.045, 0.03], [0.08, 0.45, 0.07, -0.04]]) {
    const p = box(1.25, 0.9, 0.012, 0xfdfcf8);
    p.position.set(x, y, z);
    p.rotation.z = rz;
    papers.add(p);
  }
  // The flap has a thumb notch cut in its top edge.
  const notch = [];
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI * (i / 6);
    notch.push([0.18 * Math.cos(a), 0.86 - 0.08 * Math.sin(a)]);
  }
  const flap = slab([[-0.75, 0], [0.75, 0], [0.75, 0.86], ...notch, [-0.75, 0.86]], 0.04, 0xf4d58d);
  flap.position.z = 0.02;
  const sticker = decal(1.1, 0.26, (c, W, H) => {
    c.fillStyle = '#ffffff';
    c.beginPath(); c.roundRect(2, 2, W - 4, H - 4, 8); c.fill();
    c.fillStyle = '#24182e';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    let px = H * 0.56;
    do c.font = `bold ${px}px Rubik, system-ui, sans-serif`;
    while (c.measureText(node.name).width > W * 0.9 && (px -= 2) > 8);
    c.fillText(node.name, W / 2, H * 0.54);
  }, { px: 96 });
  sticker.position.set(0, 0.42, 0.042);
  const hinge = new THREE.Group();
  hinge.position.z = 0.1;
  hinge.add(flap, sticker);
  g.add(back, papers, hinge);
  g.userData.front = hinge;
  g.userData.papers = papers;
}

// A sheet of paper with a folded corner and a printed type icon.
function fileModel(g, node) {
  const w = 0.75, h = 1.0, c = 0.2;
  const color = FILE_COLORS[node.kind] ?? COLORS.blue;
  const paper = slab([[-w / 2, 0], [w / 2, 0], [w / 2, h - c], [w / 2 - c, h], [-w / 2, h]], 0.04, 0xffffff);
  const fold = slab([[w / 2 - c, h], [w / 2 - c, h - c], [w / 2, h - c]], 0.012, 0xd9d3de);
  fold.position.z = 0.026;
  const ext = (node.name.match(/\.(\w+)$/)?.[1] ?? '').toUpperCase();
  const print = decal(w, h, (g2, W, H) => {
    const col = hex(color);
    g2.fillStyle = col;
    g2.beginPath(); g2.roundRect(W * 0.1, H * 0.08, W * 0.42, H * 0.2, 10); g2.fill();
    g2.fillStyle = '#ffffff';
    g2.font = `bold ${H * 0.085}px Rubik, system-ui, sans-serif`;
    g2.textAlign = 'center';
    g2.textBaseline = 'middle';
    g2.fillText(ext || 'FILE', W * 0.31, H * 0.185);
    if (node.kind === 'img') {
      // A little photo: sky, sun and two hills.
      g2.fillStyle = '#dff4f2';
      g2.fillRect(W * 0.1, H * 0.36, W * 0.8, H * 0.5);
      g2.fillStyle = '#ffbe00';
      g2.beginPath(); g2.arc(W * 0.7, H * 0.48, W * 0.08, 0, 7); g2.fill();
      g2.fillStyle = col;
      g2.beginPath(); g2.moveTo(W * 0.1, H * 0.86); g2.lineTo(W * 0.36, H * 0.54); g2.lineTo(W * 0.6, H * 0.86); g2.fill();
      g2.fillStyle = '#2a9d8f';
      g2.beginPath(); g2.moveTo(W * 0.4, H * 0.86); g2.lineTo(W * 0.66, H * 0.62); g2.lineTo(W * 0.9, H * 0.86); g2.fill();
      g2.strokeStyle = '#24182e';
      g2.lineWidth = 3;
      g2.strokeRect(W * 0.1, H * 0.36, W * 0.8, H * 0.5);
    } else if (node.kind === 'sheet') {
      g2.strokeStyle = col;
      g2.lineWidth = 3;
      for (let i = 0; i <= 6; i++) { g2.beginPath(); g2.moveTo(W * 0.1, H * (0.38 + i * 0.08)); g2.lineTo(W * 0.9, H * (0.38 + i * 0.08)); g2.stroke(); }
      for (let i = 0; i <= 3; i++) { g2.beginPath(); g2.moveTo(W * (0.1 + i * 0.267), H * 0.38); g2.lineTo(W * (0.1 + i * 0.267), H * 0.86); g2.stroke(); }
    } else {
      // Lines of writing, with a coloured heading.
      g2.fillStyle = col;
      g2.fillRect(W * 0.1, H * 0.38, W * 0.55, H * 0.045);
      g2.fillStyle = '#9b91a4';
      [0.8, 0.75, 0.8, 0.6, 0.8, 0.78, 0.45].forEach((l, i) => g2.fillRect(W * 0.1, H * (0.48 + i * 0.065), W * l, H * 0.025));
    }
  }, { px: 192 });
  print.position.set(0, h / 2, 0.022);
  g.add(paper, fold, print);
}

// The Recycle Bin: a pedal bin with a hinged lid and a recycling sticker.
function binModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.52, 1.25, 32), mat(0x9aa3ab, { metalness: 0.45, roughness: 0.35 }));
  body.position.y = 0.68;
  body.castShadow = body.receiveShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.56, 0.1, 32), mat(0x3b3f46));
  base.position.y = 0.05;
  const sticker = wrapDecal(0.585, 0.5, 1.3, (c, W, H) => {
    c.fillStyle = '#2a9d8f';
    c.beginPath(); c.roundRect(4, 4, W - 8, H - 8, 18); c.fill();
    // Three chasing arrows round a triangle.
    c.strokeStyle = '#ffffff';
    c.fillStyle = '#ffffff';
    c.lineWidth = W * 0.05;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.3;
    for (let i = 0; i < 3; i++) {
      const a0 = -Math.PI / 2 + i * (2 * Math.PI / 3) + 0.35;
      const a1 = a0 + 1.4;
      c.beginPath(); c.arc(cx, cy, r, a0, a1); c.stroke();
      const x = cx + r * Math.cos(a1), y = cy + r * Math.sin(a1);
      const t = a1 + Math.PI / 2;
      c.beginPath();
      c.moveTo(x + Math.cos(t) * W * 0.08, y + Math.sin(t) * W * 0.08);
      c.lineTo(x + Math.cos(t + 2.2) * W * 0.07, y + Math.sin(t + 2.2) * W * 0.07);
      c.lineTo(x + Math.cos(t - 2.2) * W * 0.07, y + Math.sin(t - 2.2) * W * 0.07);
      c.fill();
    }
  });
  sticker.position.y = 0.72;
  const pedal = rbox(0.4, 0.06, 0.26, 0x3b3f46, 0.02);
  pedal.position.set(0, 0.12, 0.62);
  pedal.rotation.x = 0.15;
  // The lid swings up on a hinge at the back.
  const hinge = new THREE.Group();
  hinge.position.set(0, 1.31, -0.62);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 32), mat(0x6c757d, { metalness: 0.4, roughness: 0.35 }));
  lid.position.z = 0.62;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.64, 32, 8, 0, Math.PI * 2, 0, 0.5), mat(0x6c757d, { metalness: 0.4, roughness: 0.35 }));
  dome.position.set(0, -0.26, 0.62);
  const handle = rbox(0.3, 0.06, 0.08, 0x3b3f46, 0.02);
  handle.position.set(0, 0.0, 1.29);
  hinge.add(lid, dome, handle);
  // A screwed-up page that shows when the bin is not empty.
  const trash = new THREE.Group();
  for (const [x, z, s] of [[-0.15, 0.05, 0.22], [0.18, -0.1, 0.18]]) {
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat(0xfdfcf8, { flatShading: true }));
    ball.position.set(x, 1.22, z);
    trash.add(ball);
  }
  trash.visible = false;
  g.add(body, base, sticker, pedal, hinge, trash);
  g.userData = { hinge, trash };
  return g;
}

export default function filesLab(stage, ui) {
  const { scene } = stage;
  let root = tree();
  const bin = [];
  const objects = new Map(); // node -> mesh group
  const world = new THREE.Group();
  scene.add(world);
  const lines = new THREE.Group();
  world.add(lines);

  // Recycle Bin
  const binMesh = binModel();
  binMesh.position.set(6.2, 0, 3.2);
  world.add(binMesh);
  const lidTo = (a, t = 0.35) => {
    const h = binMesh.userData.hinge;
    const a0 = h.rotation.x;
    return stage.tween((k) => (h.rotation.x = a0 + (a - a0) * k), t);
  };
  const binState = () => {
    binMesh.userData.trash.visible = bin.length > 0;
    lidTo(bin.length ? -0.45 : 0);
  };
  function binClick() {
    if (!bin.length) return ui.info('Recycle Bin', '<p>Empty. When you delete a file it waits here so you can still rescue it. Emptying the bin deletes files for good.</p>');
    const item = bin.pop();
    item.parent.children.push(item.node);
    item.parent.open = true;
    ui.complete('restore');
    rebuild();
    binState();
    ui.info('♻️ Restored!', `<p><b>${item.node.name}</b> went back to <b>${pathOf(item.node).join(' › ')}</b>. Right-click → <b>Restore</b> does the same on a real computer.</p>`);
  }
  stage.clickable(binMesh, binClick);

  function makeNode(node) {
    const g = new THREE.Group();
    if (node.kind === 'drive') driveModel(g);
    else if (node.kind === 'folder') folderModel(g, node);
    else fileModel(g, node);
    // The drive's name is on its callout card.
    if (node.kind !== 'drive') {
      const t = label(node.name, { scale: 0.42, color: '#5A4470' });
      t.position.y = 1.45;
      g.add(t);
      g.userData.tag = t;
    }
    world.add(g);
    stage.clickable(g, () => onClick(node));
    return g;
  }
  // The drive's light flickers when it is busy reading or writing.
  let busyLight = 0;
  stage.onTick((dt) => {
    const led = objects.get(root)?.userData.led;
    if (!led) return;
    busyLight = Math.max(0, busyLight - dt);
    led.material.emissiveIntensity = busyLight > 0 && Math.sin(busyLight * 60) > 0 ? 1.6 : 0.5;
  });

  // ---------- Layout ----------
  function walk(node, parent, depth, out) {
    out.push({ node, parent, depth });
    if (node.children && node.open) for (const c of node.children) walk(c, node, depth + 1, out);
    return out;
  }
  function leaves(node) {
    if (!node.children || !node.open || !node.children.length) return 1;
    return node.children.reduce((s, c) => s + leaves(c), 0);
  }
  function place(node, x0, depth, pos) {
    const width = leaves(node) * 1.9;
    pos.set(node, new THREE.Vector3(x0 + width / 2, 0, -4 + depth * 2.6));
    let x = x0;
    if (node.children && node.open) for (const c of node.children) {
      place(c, x, depth + 1, pos);
      x += leaves(c) * 1.9;
    }
  }

  // A neat ink line along the floor: down from the parent, across, then down to the child.
  function treeLine(a, b) {
    const y = 0.04, r = 0.18;
    const mz = (a.z + b.z) / 2;
    const dx = b.x - a.x;
    const s = Math.sign(dx);
    const pts = Math.abs(dx) < 0.01
      ? [[a.x, y, a.z], [b.x, y, b.z]]
      : [[a.x, y, a.z], [a.x, y, mz - r], [a.x + s * r * 0.3, y, mz - r * 0.3], [a.x + s * r, y, mz], [b.x - s * r, y, mz], [b.x - s * r * 0.3, y, mz + r * 0.3], [b.x, y, mz + r], [b.x, y, b.z]];
    const m = cable(pts, 0x24182e, 0.025);
    m.castShadow = false;
    m.userData.noInk = true;
    return m;
  }

  let targets = new Map();
  function rebuild() {
    const pos = new Map();
    place(root, -leaves(root) * 0.95, 0, pos);
    const visible = walk(root, null, 0, []);
    const keep = new Set(visible.map((v) => v.node));
    for (const [node, g] of objects) if (!keep.has(node)) {
      world.remove(g);
      stage.unclickable(g);
      freeGroup(g);
      objects.delete(node);
    }
    freeGroup(lines);
    lines.clear();
    for (const { node, parent } of visible) {
      if (!objects.has(node)) {
        const g = makeNode(node);
        g.position.copy(parent ? pos.get(parent) : pos.get(node));
        objects.set(node, g);
      }
      const g = objects.get(node);
      if (g.userData.front) g.userData.front.rotation.x = node.open ? 0.95 : 0.1;
      if (g.userData.papers) g.userData.papers.visible = node.children.length > 0;
      // File names are long: every second file has its name below, so neighbours don't overlap.
      if (!node.children && parent) {
        const low = parent.children.indexOf(node) % 2 === 1;
        g.userData.tag.position.set(0, low ? -0.3 : 1.45, low ? 0.3 : 0);
      }
      const sel = node === selected;
      g.traverse((m) => m.isMesh && !m.userData.glow && m.material.emissive?.setHex(sel ? 0x553300 : 0x000000));
      if (parent) lines.add(treeLine(pos.get(parent), pos.get(node)));
    }
    targets = pos;
    drawCallouts();
  }
  stage.onTick((dt) => {
    for (const [node, g] of objects) {
      const p = targets.get(node);
      if (p) g.position.lerp(p, Math.min(1, dt * 6));
    }
  });

  function parentOf(target, node = root) {
    for (const c of node.children ?? []) {
      if (c === target) return node;
      const p = parentOf(target, c);
      if (p) return p;
    }
    return null;
  }
  function pathOf(node) {
    const out = [];
    for (let n = node; n; n = parentOf(n)) out.unshift(n.name);
    return out;
  }

  // ---------- Interaction ----------
  let selected = null;
  let mode = null; // 'copy' | 'cut'

  function onClick(node) {
    busyLight = 0.6;
    const isFolder = node.kind === 'folder' || node.kind === 'drive';
    if (mode && isFolder) return paste(node);
    if (isFolder) {
      node.open = !node.open;
      selected = null;
      rebuild();
      if (node.name === 'Science' && node.open) ui.complete('open-folder');
      ui.info(`📁 ${node.name}`, `<p><b>Path:</b> <code>${pathOf(node).join(' › ')}</code></p><p>${node.kind === 'drive' ? 'The <b>drive</b> is the big storage cabinet. Everything lives inside it.' : `A <b>folder</b> is a container. It holds <b>${node.children.length}</b> item(s). Click again to ${node.open ? 'close' : 'open'} it.`}</p>`);
      return;
    }
    selected = node;
    rebuild();
    ui.complete('path');
    ui.info(`📄 ${node.name}`, `<p><b>Path:</b> <code>${pathOf(node).join(' › ')}</code></p><p>A <b>file</b> is one saved piece of work. Now choose <b>Copy</b>, <b>Cut</b>, <b>Rename</b> or <b>Delete</b>.</p>`);
  }

  function requireFile() {
    if (!selected) {
      ui.info('Select a file first', '<p>Click a file (a white page) in the tree, then try again.</p>');
      return false;
    }
    return true;
  }

  async function paste(folder) {
    const node = selected;
    const from = parentOf(node);
    if (mode === 'copy') {
      const copy = { ...node, name: folder === from ? node.name.replace(/(\.\w+)$/, ' - Copy$1') : node.name };
      folder.children.push(copy);
      ui.complete('copy');
      ui.info('📋 Copied (Ctrl + C, Ctrl + V)', `<p>Like a photocopy machine: <b>${node.name}</b> is still in <b>${from.name}</b>, and a copy is now in <b>${folder.name}</b>. Two files exist.</p>`);
    } else {
      from.children.splice(from.children.indexOf(node), 1);
      folder.children.push(node);
      ui.complete('move');
      ui.info('✂️ Moved (Ctrl + X, Ctrl + V)', `<p>Like moving a desk to a new room: <b>${node.name}</b> left <b>${from.name}</b> and now lives in <b>${folder.name}</b>. Still only one file.</p>`);
    }
    folder.open = true;
    mode = null;
    selected = null;
    rebuild();
  }

  // ---------- Callouts ----------
  // Cards stay on the stable parts of the hierarchy (drive, Documents, Tech Club Practice, bin)
  // and on one file: the selected one, or else the first file shown.
  const cards = {};
  function pin(key, obj, icon, title, text, at, dx, dy, onClick, mission) {
    if (cards[key] && cards[key].obj !== obj) {
      cards[key].remove();
      delete cards[key];
    }
    if (!obj) return;
    cards[key] ??= Object.assign(stage.callout(obj, { at, dx, dy, onClick }), { obj });
    cards[key].set(title, text, icon);
    cards[key].card.classList.toggle('done', !!mission && ui.isDone(mission));
  }
  function drawCallouts() {
    const docs = root.children.find((c) => c.name === 'Documents');
    const practice = docs?.children.find((c) => c.name === 'Tech Club Practice');
    const file = selected ?? walk(root, null, 0, []).find((v) => !v.node.children)?.node;
    pin('drive', objects.get(root), '💽', 'C: Drive', 'The storage cabinet: holds everything', [-1.2, 0.5, 0], -170, -30, () => onClick(root));
    pin('main', objects.get(docs), '📁', 'Main folder', 'A container for your files', [-0.75, 0.5, 0], -150, -10, () => onClick(docs));
    pin('sub', objects.get(practice), '📂', 'Subfolder', 'A folder inside a folder', [-0.75, 0.5, 0], -130, 0, () => onClick(practice));
    const [title, text] = mode ? ['Pick a folder', `Click where it should go (${mode === 'copy' ? 'Copy' : 'Cut'})`] : selected ? ['Path', pathOf(parentOf(selected)).join(' › ')] : ['File', 'One saved piece of work'];
    pin('file', objects.get(file), '📄', title, text, [0, 0.4, 0.03], -20, 110, () => onClick(file), 'path');
    pin('bin', binMesh, '🗑️', `Recycle Bin (${bin.length})`, bin.length ? 'Click to restore the last file' : 'Deleted files wait here', [0, 0.3, 0.65], 20, 85, binClick, 'restore');
  }

  const ops = ui.group('File operations');
  ui.button('📋 Copy', () => {
    if (!requireFile()) return;
    mode = 'copy';
    drawCallouts();
    ui.info('Copy — now pick a destination', `<p>Click the folder where the copy should go. The original <b>${selected.name}</b> will stay where it is.</p>`);
  }, { group: ops });
  ui.button('✂️ Cut (Move)', () => {
    if (!requireFile()) return;
    mode = 'cut';
    drawCallouts();
    ui.info('Cut — now pick a destination', `<p>Click the folder where <b>${selected.name}</b> should move to.</p>`);
  }, { group: ops });
  ui.button('✏️ Rename (F2)', () => {
    if (!requireFile()) return;
    const name = prompt('New file name (BIH standard: Topic_Detail_Name, no spaces):', selected.name);
    if (!name) return;
    const bad = name.match(/[\\/:*?"<>|]/g);
    if (bad) return ui.info('🚫 Illegal characters', `<p>File names cannot contain <code>${[...new Set(bad)].join(' ').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code>. The forbidden set is <code>\\ / : * ? " &lt; &gt; |</code>.</p>`);
    const old = selected.name;
    selected.name = name;
    const g = objects.get(selected);
    world.remove(g);
    stage.unclickable(g);
    freeGroup(g);
    objects.delete(selected);
    rebuild();
    if (!/\s/.test(name)) ui.complete('rename');
    ui.info('Renamed', `<p><b>${old}</b> → <b>${name}</b>${/\s/.test(name) ? '<br>Tip: the BIH standard uses underscores instead of spaces.' : ''}</p>`);
  }, { group: ops });
  ui.button('🗑️ Delete', async () => {
    if (!requireFile()) return;
    const node = selected;
    const parent = parentOf(node);
    const g = objects.get(node);
    const start = g.position.clone();
    const end = binMesh.position.clone().setY(1.2);
    busyLight = 0.8;
    lidTo(-1.25, 0.3);
    await stage.tween((k) => {
      g.position.lerpVectors(start, end, k);
      g.position.y += Math.sin(k * Math.PI) * 2;
      g.scale.setScalar(1 - k * 0.6);
    }, 0.8);
    parent.children.splice(parent.children.indexOf(node), 1);
    bin.push({ node, parent });
    selected = null;
    rebuild();
    binState();
    ui.complete('delete');
    ui.info('🗑️ Sent to the Recycle Bin', '<p>The file is not gone yet! <b>Click the Recycle Bin</b> to restore it. Files on a USB drive skip the bin — they are deleted immediately.</p>');
  }, { group: ops });
  ui.button('↺ Reset', () => {
    for (const g of objects.values()) {
      world.remove(g);
      stage.unclickable(g);
      freeGroup(g);
    }
    objects.clear();
    root = tree();
    bin.length = 0;
    selected = mode = null;
    rebuild();
    binState();
  }, { group: ops });

  rebuild();
  ui.info('The computer filing hierarchy', '<p><b>Drive › Folder › Sub-folder › File.</b> Click folders to open and close them. Click a file to see its full path, then try copying, cutting and deleting it.</p>');
}

export const config = { camera: [-1.2, 10, 12.5], target: [-1.2, 0, 0.5], shadowSize: 14, maxDistance: 30 };

export const missions = [
  { id: 'open-folder', text: 'Open the "Science" folder.', hint: 'Click the yellow Science folder under Documents.' },
  { id: 'path', text: 'Click a file (a white page) to see its full path.', hint: 'The path shows every folder you pass through, like an address.' },
  { id: 'copy', text: 'Copy a file into another folder.', hint: 'Click a file, press "Copy", then click the folder it should go to.' },
  { id: 'move', text: 'Move a file with "Cut".', hint: 'Cut moves the file. It leaves its old folder.' },
  { id: 'rename', text: 'Rename a file using the BIH standard (no spaces).', hint: 'Example: Science_Poster_Ama.docx. Use underscores _ instead of spaces.' },
  { id: 'delete', text: 'Delete a file.', hint: 'Watch it fly into the Recycle Bin.' },
  { id: 'restore', text: 'Rescue the file from the Recycle Bin.', hint: 'Click the grey bin to restore the last file you deleted.' },
];
