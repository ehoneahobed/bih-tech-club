// Sessions 4–5 — Files, Folders & File Operations: a 3D filing tree from the
// drive down to files. Open folders, follow the path, then copy, cut, delete
// and restore files from the Recycle Bin.
import { THREE, COLORS, box, mat, label } from './runtime.js';

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

const FILE_COLORS = { doc: 0x4361ee, img: 0x2ec4b6, sheet: 0x2a9d8f };

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
  const binMesh = new THREE.Group();
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 1.4, 24, 1, true), mat(0x6c757d, { side: THREE.DoubleSide }));
  can.position.y = 0.7;
  can.castShadow = true;
  binMesh.add(can);
  binMesh.position.set(6.2, 0, 3.2);
  world.add(binMesh);
  function binClick() {
    if (!bin.length) return ui.info('Recycle Bin', '<p>Empty. When you delete a file it waits here so you can still rescue it. Emptying the bin deletes files for good.</p>');
    const item = bin.pop();
    item.parent.children.push(item.node);
    item.parent.open = true;
    ui.complete('restore');
    rebuild();
    ui.info('♻️ Restored!', `<p><b>${item.node.name}</b> went back to <b>${pathOf(item.node).join(' › ')}</b>. Right-click → <b>Restore</b> does the same on a real computer.</p>`);
  }
  stage.clickable(binMesh, binClick);

  function makeNode(node) {
    const g = new THREE.Group();
    if (node.kind === 'drive') {
      const d = box(2.4, 0.7, 1.4, 0x495057);
      d.position.y = 0.35;
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.07), mat(0x2ec4b6, { emissive: 0x2ec4b6 }));
      led.position.set(0.95, 0.4, 0.71);
      g.add(d, led);
    } else if (node.kind === 'folder') {
      const back = box(1.5, 1.0, 0.12, 0xe9c46a);
      back.position.y = 0.5;
      const tab = box(0.6, 0.18, 0.12, 0xe9c46a);
      tab.position.set(-0.45, 1.08, 0);
      const front = box(1.5, 0.85, 0.08, 0xf4d58d);
      front.position.set(0, 0.43, 0.1);
      front.rotation.x = -0.18;
      g.add(back, tab, front);
      g.userData.front = front;
    } else {
      const paper = box(0.75, 1.0, 0.05, 0xffffff);
      paper.position.y = 0.5;
      const band = box(0.75, 0.22, 0.06, FILE_COLORS[node.kind] ?? COLORS.blue);
      band.position.y = 0.89;
      g.add(paper, band);
    }
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

  let targets = new Map();
  function rebuild() {
    const pos = new Map();
    place(root, -leaves(root) * 0.95, 0, pos);
    const visible = walk(root, null, 0, []);
    const keep = new Set(visible.map((v) => v.node));
    for (const [node, g] of objects) if (!keep.has(node)) {
      world.remove(g);
      stage.unclickable(g);
      objects.delete(node);
    }
    lines.clear();
    for (const { node, parent } of visible) {
      if (!objects.has(node)) {
        const g = makeNode(node);
        g.position.copy(parent ? pos.get(parent) : pos.get(node));
        objects.set(node, g);
      }
      const g = objects.get(node);
      if (g.userData.front) g.userData.front.rotation.x = node.open ? -0.55 : -0.18;
      // File names are long: every second file has its name below, so neighbours don't overlap.
      if (!node.children && parent) {
        const low = parent.children.indexOf(node) % 2 === 1;
        g.userData.tag.position.set(0, low ? -0.3 : 1.45, low ? 0.3 : 0);
      }
      const sel = node === selected;
      g.traverse((m) => m.isMesh && m.material.emissive?.setHex(sel ? 0x553300 : 0x000000));
      if (parent) {
        const a = pos.get(parent).clone().setY(0.05);
        const b = pos.get(node).clone().setY(0.05);
        const mid = a.clone().setZ((a.z + b.z) / 2);
        const pts = [a, mid, mid.clone().setX(b.x), b];
        lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x24182e })));
      }
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
    await stage.tween((k) => {
      g.position.lerpVectors(start, end, k);
      g.position.y += Math.sin(k * Math.PI) * 2;
      g.scale.setScalar(1 - k * 0.6);
    }, 0.8);
    parent.children.splice(parent.children.indexOf(node), 1);
    bin.push({ node, parent });
    selected = null;
    rebuild();
    ui.complete('delete');
    ui.info('🗑️ Sent to the Recycle Bin', '<p>The file is not gone yet! <b>Click the Recycle Bin</b> to restore it. Files on a USB drive skip the bin — they are deleted immediately.</p>');
  }, { group: ops });
  ui.button('↺ Reset', () => {
    for (const g of objects.values()) {
      world.remove(g);
      stage.unclickable(g);
    }
    objects.clear();
    root = tree();
    bin.length = 0;
    selected = mode = null;
    rebuild();
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
