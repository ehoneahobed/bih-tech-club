// Session 22 — Spreadsheets 3: Working with Data. Data Sorter: the class survey
// as a standing 3D sheet, one physical strip per row (one row = one person).
// Sorting moves whole strips; sorting column D on its own (the classic mistake)
// slides only the Minutes blocks and scrambles everyone's answers until you undo.
// A filter hides rows without deleting them, and =IF(D2>=30,"Long trip","Short trip")
// labels every row, while a 3D column chart (one column per pupil) rearranges itself.
import { THREE, COLORS, mat, rbox, box, decal, label, setLabel } from './runtime.js';

// The first rows of Class_Survey (workbook page 2), cut to 10 pupils.
const DATA = [
  [1, 'JHS 1', 'Walk', 15, 'Jollof', 2, 5],
  [2, 'JHS 2', 'Trotro or bus', 40, 'Waakye', 4, 4],
  [3, 'JHS 1', 'Walk', 10, 'Banku', 1, 5],
  [4, 'JHS 3', 'Taxi', 30, 'Jollof', 3, 4],
  [5, 'JHS 2', 'Walk', 20, 'Fufu', 5, 3],
  [6, 'JHS 1', 'Trotro or bus', 55, 'Kenkey', 2, 5],
  [7, 'JHS 3', 'Bicycle', 25, 'Jollof', 6, 4],
  [8, 'JHS 2', 'Walk', 5, 'Red-red', 3, 5],
  [9, 'JHS 1', 'Trotro or bus', 45, 'Jollof', 1, 3],
  [10, 'JHS 3', 'Car', 35, 'Waakye', 4, 2],
];
// Columns: letter, name, width (world units), key in a row.
const COLS = [
  ['A', 'No.', 0.5, 'no'],
  ['B', 'Class', 0.8, 'cls'],
  ['C', 'Travel', 1.45, 'travel'],
  ['D', 'Minutes', 0.85, 'mins'],
  ['E', 'Food', 0.95, 'food'],
  ['F', 'Screen hrs', 0.75, 'screen'],
  ['G', 'Enjoy', 0.6, 'enjoy'],
  ['H', 'Trip', 1.15, 'trip'],
];
const RN = 0.42; // width of the grey row-number column
const RH = 0.42; // row height
const SW = RN + COLS.reduce((a, c) => a + c[2], 0);
const PXU = 200; // canvas pixels per world unit
const colX = (i) => RN + COLS.slice(0, i).reduce((a, c) => a + c[2], 0); // left edge, from the strip's left
const TRAVEL = { Walk: '#2EC4B6', 'Trotro or bus': '#FFBE00', Taxi: '#CA1F3F', Bicycle: '#5A4470', Car: '#8a8f99' };
const TRIP = { 'Long trip': '#CA1F3F', 'Short trip': '#2EC4B6' };
const SORTS = [['no', 'No.'], ['cls', 'Class'], ['travel', 'Travel'], ['mins', 'Minutes'], ['food', 'Food']];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function dataSortLab(stage, ui, host) {
  const { scene } = stage;

  // ---------- State ----------
  const rows = DATA.map(([no, cls, travel, mins, food, screen, enjoy]) => ({ no, cls, travel, mins, food, screen, enjoy }));
  let order = rows.map((r) => r.no); // top to bottom
  let filter = null; // a Travel value, or null
  let trip = { applied: false, filled: false, op: '>=', n: 30, a: 'Long trip', b: 'Short trip' };
  let history = [];
  let busy = false;
  let sortKey = 'mins';
  const flags = { safe: false, mistake: false, undone: false, filtered: false };

  // ---------- Desk and the standing sheet ----------
  const floor = rbox(15.6, 0.25, 6.5, 0xc8a27a, 0.08);
  floor.position.set(1.2, -0.125, 0);
  scene.add(floor);
  const sheet = new THREE.Group();
  sheet.position.set(-SW / 2 - 1.4, 0, 0);
  scene.add(sheet);
  const TOPY = 6.15; // top of the column-letter strip
  const back = rbox(SW + 0.3, TOPY + 0.95, 0.12, 0x3a2b47, 0.06);
  back.position.set(SW / 2, (TOPY + 0.95) / 2, -0.2);
  sheet.add(back);
  for (const x of [0.3, SW - 0.3]) {
    const leg = rbox(0.5, 0.12, 1.4, 0x3a2b47, 0.04);
    leg.position.set(x, 0.06, 0.2);
    sheet.add(leg);
  }
  // Formula bar and column letters.
  const fx = decal(SW, 0.42, () => {}, { px: 84, transparent: false });
  fx.position.set(SW / 2, TOPY + 0.55, -0.13);
  sheet.add(fx);
  const letters = decal(SW, 0.3, (g, W, H) => {
    g.fillStyle = '#E4DFEA';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#5c5266';
    g.font = `600 ${H * 0.62}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const s = W / SW;
    COLS.forEach(([l, , w], i) => {
      g.fillText(l, (colX(i) + w / 2) * s, H * 0.55);
      g.fillRect(colX(i) * s, 0, 2, H);
    });
  }, { px: 60, transparent: false });
  letters.position.set(SW / 2, TOPY + 0.17, -0.13);
  sheet.add(letters);
  // The header row (row 1) is frozen: pinned at the top with two pins.
  const headY = TOPY - RH / 2 - 0.04;
  const head = rbox(SW, RH, 0.16, 0x24182e, 0.03);
  head.position.set(SW / 2, headY, 0);
  sheet.add(head);
  const headText = decal(SW, RH, () => {}, { px: Math.round(RH * PXU) });
  headText.position.set(SW / 2, headY, 0.082);
  sheet.add(headText);
  for (const x of [0.2, SW - 0.2]) {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), mat(COLORS.red));
    pin.position.set(x, headY + 0.12, 0.1);
    sheet.add(pin);
  }
  function drawHead() {
    const c = headText.material.map.image;
    const g = c.getContext('2d');
    const s = c.width / SW;
    g.clearRect(0, 0, c.width, c.height);
    g.textBaseline = 'middle';
    g.fillStyle = '#c9c1d1';
    g.font = `600 ${c.height * 0.42}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.fillText('1', (RN / 2) * s, c.height / 2);
    COLS.forEach(([, name, w, key], i) => {
      if (key === 'trip' && !trip.applied) return;
      g.fillStyle = '#ffffff';
      g.textAlign = 'left';
      let px = c.height * 0.4;
      const room = w * s - (filterOn ? 44 : 18);
      do g.font = `bold ${px}px Rubik, system-ui, sans-serif`;
      while (g.measureText(name).width > room && (px -= 1) > 10);
      g.fillText(name, colX(i) * s + 10, c.height / 2);
      if (filterOn && key !== 'trip') {
        // Little filter arrows in the header row; the Travel one shows it is filtered.
        const ax = (colX(i) + w) * s - 26;
        g.fillStyle = key === 'travel' && filter ? '#FFBE00' : '#ffffff';
        g.fillRect(ax - 4, c.height * 0.25, 26, c.height * 0.5);
        g.fillStyle = '#24182E';
        g.font = `bold ${c.height * 0.34}px Rubik, system-ui, sans-serif`;
        g.fillText(key === 'travel' && filter ? '⏷' : '▾', ax, c.height / 2);
      }
    });
    headText.material.map.needsUpdate = true;
  }
  let filterOn = false;

  // One strip per row, plus a separate Minutes block (so the classic mistake can move it alone).
  const stripGeo = new THREE.BoxGeometry(SW, RH - 0.04, 0.12);
  const stripMat = mat(0xffffff, { roughness: 0.8 });
  const blockGeo = new THREE.BoxGeometry(COLS[3][2] - 0.06, RH - 0.1, 0.1);
  const blockMat = mat(0xfff7e0, { roughness: 0.7 });
  const minBlocks = new Map(); // minutes value -> { mesh, text }
  for (const r of rows) {
    const g = new THREE.Group();
    const s = new THREE.Mesh(stripGeo, stripMat);
    s.position.x = SW / 2;
    s.castShadow = true;
    s.receiveShadow = true;
    const t = decal(SW, RH - 0.04, () => {}, { px: Math.round((RH - 0.04) * PXU) });
    t.position.set(SW / 2, 0, 0.061);
    g.add(s, t);
    sheet.add(g);
    r.strip = g;
    r.text = t;
    stage.clickable(g, () => describeRow(r));
    // The Minutes block for this value.
    const bg = new THREE.Group();
    const bm = new THREE.Mesh(blockGeo, blockMat);
    bm.castShadow = true;
    const bt = decal(COLS[3][2] - 0.08, RH - 0.12, () => {}, { px: 64 });
    bt.position.z = 0.051;
    bg.add(bm, bt);
    sheet.add(bg);
    minBlocks.set(r.mins, { mesh: bg, text: bt, value: r.mins });
    drawBlock(minBlocks.get(r.mins));
    stage.clickable(bg, () => describeRow(r));
  }
  function drawBlock(b) {
    const c = b.text.material.map.image;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#24182E';
    g.font = `bold ${c.height * 0.62}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    g.fillText(String(b.value), c.width - 14, c.height * 0.54);
    b.text.material.map.needsUpdate = true;
  }
  const blockX = colX(3) + COLS[3][2] / 2;
  const rowById = (no) => rows.find((r) => r.no === no);
  const tripOf = (r) => {
    const v = r.mins;
    const ok = { '>=': v >= trip.n, '>': v > trip.n, '<=': v <= trip.n, '<': v < trip.n, '=': v === trip.n, '<>': v !== trip.n }[trip.op];
    return ok ? trip.a : trip.b;
  };
  const visible = () => order.filter((no) => !filter || rowById(no).travel === filter);
  const sheetRow = (no) => order.indexOf(no) + 2; // spreadsheet row number (rows never renumber)

  function drawStrip(r) {
    const c = r.text.material.map.image;
    const g = c.getContext('2d');
    const s = c.width / SW;
    const H = c.height;
    g.clearRect(0, 0, c.width, H);
    g.fillStyle = '#E4DFEA';
    g.fillRect(0, 0, RN * s, H);
    g.textBaseline = 'middle';
    g.font = `600 ${H * 0.44}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.fillStyle = filter ? '#1d4ed8' : '#5c5266';
    g.fillText(String(sheetRow(r.no)), (RN / 2) * s, H / 2);
    g.textAlign = 'left';
    COLS.forEach(([, , w, key], i) => {
      const x = colX(i) * s;
      g.fillStyle = '#d9d3de';
      g.fillRect(x, 0, 2, H);
      if (key === 'mins') return; // the Minutes block sits here
      let v = r[key];
      if (key === 'trip') {
        if (!trip.applied || (!trip.filled && order[0] !== r.no)) return;
        v = tripOf(r);
        g.fillStyle = TRIP[v] ?? '#5A4470';
        g.beginPath();
        g.roundRect(x + 6, H * 0.16, w * s - 12, H * 0.68, H * 0.3);
        g.fill();
        g.fillStyle = TRIP[v] === '#FFBE00' || !TRIP[v] ? '#24182E' : '#ffffff';
        g.font = `bold ${H * 0.4}px Rubik, system-ui, sans-serif`;
        g.fillText(String(v), x + 16, H / 2);
        g.font = `600 ${H * 0.44}px Rubik, system-ui, sans-serif`;
        return;
      }
      if (key === 'travel') {
        g.fillStyle = TRAVEL[v];
        g.beginPath();
        g.arc(x + 18, H / 2, H * 0.14, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#24182E';
        g.fillText(String(v), x + 34, H / 2);
        return;
      }
      g.fillStyle = '#24182E';
      const num = typeof v === 'number';
      g.textAlign = num ? 'right' : 'left';
      g.fillText(String(v), num ? x + w * s - 12 : x + 10, H / 2);
      g.textAlign = 'left';
    });
    r.text.material.map.needsUpdate = true;
  }
  const slotY = (k) => headY - RH * (k + 1);

  // ---------- The chart: one column per pupil, in table order ----------
  const chart = new THREE.Group();
  chart.position.set(5.0, 0, -0.2);
  scene.add(chart);
  const CB = 4.6;
  const base = rbox(CB + 0.4, 0.2, 1.6, 0xf4f0f6, 0.05);
  base.position.set(0, 0.1, 0);
  chart.add(base);
  const wall = rbox(CB + 0.4, 4.3, 0.1, 0xffffff, 0.04);
  wall.position.set(0, 2.25, -0.75);
  chart.add(wall);
  const plaque = rbox(CB + 0.2, 0.5, 0.12, COLORS.purple, 0.06);
  plaque.position.set(0, 4.65, -0.72);
  chart.add(plaque);
  const plaqueText = decal(CB + 0.1, 0.46, () => {}, { px: 80 });
  plaqueText.position.set(0, 4.65, -0.655);
  chart.add(plaqueText);
  function drawPlaque() {
    const c = plaqueText.material.map.image;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#ffffff';
    g.font = `bold ${c.height * 0.4}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(trip.applied && trip.filled ? 'Minutes to school: Long or Short trip?' : 'Minutes to school (one column per pupil)', c.width / 2, c.height * 0.55);
    plaqueText.material.map.needsUpdate = true;
  }
  const UNIT = 3.4 / 55; // world height per minute
  const colGeo = new THREE.BoxGeometry(1, 1, 1);
  const colMats = new Map();
  const colMat = (css) => {
    if (!colMats.has(css)) colMats.set(css, mat(new THREE.Color(css).getHex()));
    return colMats.get(css);
  };
  for (const r of rows) {
    const m = new THREE.Mesh(colGeo, colMat(TRAVEL[r.travel]));
    m.castShadow = true;
    chart.add(m);
    r.col = m;
    r.colH = r.mins * UNIT;
    r.colX = 0;
    r.valTag = label('', { scale: 0.42 });
    r.noTag = label('', { scale: 0.38, bg: 'rgba(0,0,0,0)' });
    chart.add(r.valTag, r.noTag);
    stage.clickable(m, () => describeRow(r));
  }
  // The IF threshold: a see-through sheet at 30 minutes.
  const line = new THREE.Mesh(new THREE.BoxGeometry(CB + 0.2, 0.03, 1.2), new THREE.MeshBasicMaterial({ color: COLORS.red, transparent: true, opacity: 0.35, depthWrite: false }));
  line.userData.noInk = true;
  line.visible = false;
  chart.add(line);
  const lineTag = label('30 minutes', { scale: 0.42, bg: '#CA1F3F', color: '#FFFFFF' });
  lineTag.visible = false;
  chart.add(lineTag);
  // A legend for the travel colours.
  const legend = decal(CB, 0.36, () => {}, { px: 64 });
  legend.rotation.x = -Math.PI / 2;
  legend.position.set(0, 0.205, 0.6);
  chart.add(legend);
  function drawLegend() {
    const c = legend.material.map.image;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.font = `600 ${c.height * 0.5}px Rubik, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    const items = trip.applied && trip.filled ? Object.entries(TRIP) : Object.entries(TRAVEL);
    let x = 10;
    for (const [k, col] of items) {
      g.fillStyle = col;
      g.fillRect(x, c.height * 0.25, c.height * 0.5, c.height * 0.5);
      g.fillStyle = '#24182E';
      g.fillText(k, x + c.height * 0.62, c.height * 0.52);
      x += c.height * 0.9 + g.measureText(k).width + 18;
    }
    legend.material.map.needsUpdate = true;
  }

  // ---------- Callouts (most important first: phones show four) ----------
  const cards = {
    row: stage.callout(sheet, { icon: '➖', title: 'One row = one person', text: 'Sorting moves the whole row', at: [SW, slotY(0), 0.1], dx: 120, dy: -40 }),
    header: stage.callout(head, { icon: '📌', title: 'Header row', text: 'Row 1, frozen at the top', at: [-SW / 2, 0, 0.1], dx: -90, dy: -60 }),
    chart: stage.callout(chart, { icon: '📊', title: 'Chart', text: 'One column per pupil', at: [CB / 2, 3.2, -0.7], dx: 40, dy: -60 }),
    mins: stage.callout(sheet, { icon: '⏱️', title: 'Column D', text: 'Minutes to school', at: [blockX, slotY(9) - 0.1, 0.1], dx: -20, dy: 70 }),
    fx: stage.callout(fx, { icon: 'ƒx', title: 'Formula bar', text: 'Shows what is in a cell', at: [-SW / 2 + 0.3, 0, 0], dx: -70, dy: -50 }),
  };

  // ---------- Placing everything (with an arc so you can see rows travel) ----------
  function targetLayout() {
    const vis = visible();
    const n = vis.length;
    const gap = CB / Math.max(n, 1);
    const pos = new Map();
    vis.forEach((no, k) => pos.set(no, { y: slotY(k), cx: -CB / 2 + gap * (k + 0.5), w: Math.min(0.42, gap * 0.7), shown: true }));
    for (const no of order) if (!pos.has(no)) pos.set(no, { y: slotY(Math.min(vis.length, 9)), cx: 0, w: 0.3, shown: false });
    return pos;
  }
  function snapshotPositions() {
    const m = new Map();
    for (const r of rows) m.set(r.no, { y: r.strip.position.y, s: r.strip.scale.y, cx: r.colX, h: r.colH, w: r.col.scale.x, cs: r.col.scale.z });
    const b = new Map();
    for (const [v, bl] of minBlocks) b.set(v, { y: bl.mesh.position.y, s: bl.mesh.scale.y });
    return { m, b };
  }
  // owner: which row each Minutes block currently belongs to.
  const ownerOf = (v) => rows.find((r) => r.mins === v);
  async function layout(dur = 0.9, mode = 'rows') {
    const from = snapshotPositions();
    const to = targetLayout();
    rows.forEach(drawStrip);
    drawHead();
    drawLegend();
    drawPlaque();
    for (const r of rows) {
      const c = trip.applied && trip.filled ? TRIP[tripOf(r)] : TRAVEL[r.travel];
      r.col.material = colMat(c ?? '#5A4470');
    }
    const apply = (k) => {
      const lift = Math.sin(k * Math.PI);
      for (const r of rows) {
        const a = from.m.get(r.no);
        const b = to.get(r.no);
        const moving = mode === 'rows' && Math.abs(a.y - b.y) > 0.01;
        r.strip.position.set(0, a.y + (b.y - a.y) * k, moving ? lift * 0.7 : 0);
        const sy = a.s + ((b.shown ? 1 : 0.02) - a.s) * k;
        r.strip.scale.set(1, Math.max(0.02, sy), 1);
        r.strip.visible = sy > 0.03;
        // chart column
        r.colX = a.cx + (b.cx - a.cx) * k;
        const hh = r.mins * UNIT * (b.shown ? 1 : 0);
        r.colH = a.h + (hh - a.h) * k;
        const w = a.w + (b.w - a.w) * k;
        r.col.scale.set(w, Math.max(0.001, r.colH), 0.5);
        r.col.position.set(r.colX, 0.2 + r.colH / 2, 0);
        r.col.visible = r.colH > 0.01;
        r.valTag.position.set(r.colX, 0.2 + r.colH + 0.22, 0.1);
        r.noTag.position.set(r.colX, 0.2 + r.colH / 2, 0.3);
        r.valTag.visible = r.noTag.visible = b.shown && k > 0.5;
      }
      // Minutes blocks follow the row that owns their value.
      for (const [v, bl] of minBlocks) {
        const owner = ownerOf(v);
        const a = from.b.get(v);
        const b = to.get(owner.no);
        const by = b.y;
        const moving = Math.abs(a.y - by) > 0.01;
        const lifted = mode === 'column' ? (moving ? lift * 1.0 : 0) : (mode === 'rows' && moving ? lift * 0.7 : 0);
        bl.mesh.position.set(blockX, a.y + (by - a.y) * k, 0.12 + lifted);
        const sy = a.s + ((b.shown ? 1 : 0.02) - a.s) * k;
        bl.mesh.scale.set(1, Math.max(0.02, sy), 1);
        bl.mesh.visible = sy > 0.03;
      }
    };
    for (const r of rows) {
      setLabel(r.valTag, String(r.mins));
      setLabel(r.noTag, `#${r.no}`, { color: '#FFFFFF' });
    }
    if (dur) await stage.tween(apply, dur);
    else apply(1);
    // The "row" card follows the top row; IF threshold appears with the labels.
    cards.row.at.set(SW, slotY(0), 0.1);
    const showLine = trip.applied && trip.filled;
    line.visible = lineTag.visible = showLine;
    line.position.set(0, 0.2 + trip.n * UNIT, 0);
    lineTag.position.set(-CB / 2 - 0.1, 0.2 + trip.n * UNIT + 0.25, 0.4);
    setLabel(lineTag, `${trip.n} minutes`);
    drawFx();
  }

  // ---------- Formula bar ----------
  let fxText = { cell: 'D2', text: '' };
  function drawFx() {
    const c = fx.material.map.image;
    const g = c.getContext('2d');
    const W = c.width;
    const H = c.height;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#c9c1d1';
    g.lineWidth = 3;
    g.strokeRect(2, 2, W - 4, H - 4);
    g.fillStyle = '#F4F0F6';
    g.fillRect(4, 4, W * 0.09, H - 8);
    g.fillStyle = '#24182E';
    g.textBaseline = 'middle';
    g.font = `600 ${H * 0.45}px Rubik, system-ui, sans-serif`;
    g.fillText(fxText.cell, 16, H / 2);
    g.font = `italic bold ${H * 0.45}px Georgia, serif`;
    g.fillStyle = '#5c5266';
    g.fillText('ƒx', W * 0.1 + 10, H / 2);
    g.font = `${H * 0.46}px ui-monospace, Menlo, monospace`;
    g.fillStyle = '#24182E';
    g.fillText(fxText.text, W * 0.1 + 60, H / 2);
    fx.material.map.needsUpdate = true;
  }

  // ---------- Side panel ----------
  const sortG = ui.group('Sort: click one cell, then Data → Sort');
  const keyBtns = SORTS.map(([k, n]) => {
    const b = ui.button(n, () => { sortKey = k; ui.toggle(keyBtns, b); fxText = { cell: `${COLS.find((c) => c[3] === k)[0]}2`, text: String(rowById(order[0])[k]) }; drawFx(); }, { group: sortG });
    b.dataset.k = k;
    return b;
  });
  ui.toggle(keyBtns, keyBtns[3]);
  const upBtn = ui.button('↑ Smallest to largest (A to Z)', () => sortRows(1), { group: sortG });
  const downBtn = ui.button('↓ Largest to smallest (Z to A)', () => sortRows(-1), { primary: true, group: sortG });
  const mistakeBtn = ui.button('⚠️ Select column D only, then sort', () => sortOneColumn(), { group: sortG });
  mistakeBtn.style.borderColor = '#CA1F3F';
  mistakeBtn.style.borderWidth = '2px';

  const filterG = ui.group('Filter: Travel');
  const filterBtns = ['Walk', 'Trotro or bus', 'Taxi', 'Bicycle', 'Car'].map((v) => {
    const b = ui.button(v, () => setFilter(v), { group: filterG });
    b.dataset.v = v;
    return b;
  });
  const clearBtn = ui.button('✕ Clear filter', () => setFilter(null), { group: filterG });

  const ifG = ui.group('IF: label every row');
  const ifField = ui.element(`<label class="lab-field">Type a formula for H2 (Trip)
    <input type="text" spellcheck="false" autocomplete="off" placeholder='=IF(D2>=30,"Long trip","Short trip")' aria-label="Formula for cell H2"></label>`, ifG);
  const ifInput = ifField.querySelector('input');
  ifInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); enterIf(); } });
  const enterBtn = ui.button('↵ Enter', () => enterIf(), { group: ifG });
  const fillBtn = ui.button('⤓ Drag the AutoFill handle down', () => fillDown(), { group: ifG });
  const showBtn = ui.button('💡 Show me the formula', () => {
    ifInput.value = '=IF(D2>=30,"Long trip","Short trip")';
    ifInput.focus();
    ui.info('The workbook formula', '<p><code>=IF(D2>=30,"Long trip","Short trip")</code></p><p>1. The <b>test</b>: is D2 (Minutes) 30 or more?<br>2. The answer if <b>true</b>: "Long trip".<br>3. The answer if <b>false</b>: "Short trip".<br>Words go in "quotation marks". Now press <b>Enter</b>.</p>');
  }, { group: ifG });

  const editG = ui.group('Edit');
  const undoBtn = ui.button('↶ Undo (Ctrl + Z)', () => undo(), { group: editG });
  const allBtns = [...keyBtns, upBtn, downBtn, mistakeBtn, ...filterBtns, clearBtn, enterBtn, fillBtn, showBtn, undoBtn];
  function setBusy(on) {
    busy = on;
    for (const b of allBtns) {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.5' : '';
    }
    if (!on) undoBtn.style.opacity = history.length ? '' : '0.5';
  }
  host.tabIndex = 0;
  host.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    }
  });

  // ---------- Undo ----------
  const intact = () => rows.every((r, i) => r.mins === DATA[i][3]);
  function save() {
    history.push(JSON.stringify({ order, mins: rows.map((r) => r.mins), filter, trip }));
    if (history.length > 30) history.shift();
  }
  async function undo() {
    if (busy || !history.length) return;
    const wasBroken = !intact();
    const s = JSON.parse(history.pop());
    order = s.order;
    rows.forEach((r, i) => (r.mins = s.mins[i]));
    filter = s.filter;
    trip = s.trip;
    syncFilterBtns();
    setBusy(true);
    await layout(0.8, wasBroken ? 'column' : 'rows');
    setBusy(false);
    if (wasBroken && intact()) {
      flags.undone = true;
      ui.info('↶ Undone: every row is whole again', '<p><b>Ctrl + Z</b> put each pupil\'s minutes back in their own row. In a real sheet, undo <b>straight away</b> if you see this mistake: the longer you wait, the harder it is to fix.</p>');
      checkSort();
    } else ui.info('↶ Undone', '<p><b>Ctrl + Z</b> took back your last action.</p>');
  }

  // ---------- Sorting ----------
  async function sortRows(dir) {
    if (busy) return;
    stage.reveal();
    save();
    const key = sortKey;
    order = [...order].sort((a, b) => {
      const x = rowById(a)[key];
      const y = rowById(b)[key];
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * dir || a - b;
    });
    setBusy(true);
    await layout(1.1, 'rows');
    setBusy(false);
    const top = rowById(order[0]);
    const name = SORTS.find((s) => s[0] === key)[1];
    const broken = !intact();
    fxText = { cell: `${COLS.find((c) => c[3] === key)[0]}2`, text: String(top[key]) };
    drawFx();
    ui.info(`${dir < 0 ? '↓' : '↑'} Sorted by ${name}`, `<p>Every strip moved as a whole, so each pupil kept <b>all</b> their answers. Row 2 is now pupil <b>No. ${top.no}</b>: ${esc(top.cls)}, ${esc(top.travel)}, ${top.mins} minutes, ${esc(top.food)}.</p><p>Look at the chart: the columns moved into the same order.</p>${broken ? '<p>⚠️ But the minutes are still mixed up from the one-column sort. Sorting again does not fix broken rows: press <b>Undo</b> until they are whole.</p>' : ''}`);
    if (key === 'mins' && dir < 0 && !broken) flags.safe = true;
    checkSort();
  }
  async function sortOneColumn() {
    if (busy) return;
    stage.reveal();
    save();
    // Only column D is sorted: the minutes are handed out largest-first to the rows as they stand.
    // (If D already runs largest-first, it is sorted smallest-first instead, so something always moves.)
    const vis = visible();
    const now = vis.map((no) => rowById(no).mins);
    const desc = now.some((v, k) => k && v > now[k - 1]);
    const vals = [...now].sort((a, b) => (desc ? b - a : a - b));
    vis.forEach((no, k) => (rowById(no).mins = vals[k]));
    setBusy(true);
    await layout(1.2, 'column');
    setBusy(false);
    if (intact()) {
      history.pop();
      ui.info('Nothing changed', '<p>Column D was already in order for these rows. Sort the whole table by another column first, then try again.</p>');
      return;
    }
    flags.mistake = true;
    const bad = rows.filter((r) => r.mins !== DATA[r.no - 1][3]).sort((a, b) => Math.abs(b.mins - DATA[b.no - 1][3]) - Math.abs(a.mins - DATA[a.no - 1][3]))[0];
    setLabel(bad.valTag, `${bad.mins}?!`, { bg: '#CA1F3F', color: '#FFFFFF' });
    ui.info('😱 The classic mistake: broken rows!', `<p>Column D was sorted on its own (${desc ? 'largest' : 'smallest'} first). Only the <b>Minutes</b> blocks moved. Everybody else's answers stayed where they were, so now pupil No. ${bad.no} (${esc(bad.travel)}) takes <b>${bad.mins} minutes</b>, but really took ${DATA[bad.no - 1][3]}. The data is wrong!</p><p>Never select just one column before you sort. Press <b>Undo (Ctrl + Z)</b> straight away.</p>`);
  }
  function checkSort() {
    if (flags.safe && flags.mistake && flags.undone) ui.complete('sort');
    else if (flags.safe && !flags.mistake) ui.info('✅ A safe sort', `<p>Whole rows moved together. Now see what can go wrong: press <b>⚠️ Select column D only, then sort</b>, and then <b>Undo</b> it.</p>`);
    else if (flags.mistake && flags.undone && !flags.safe) ui.info('Now sort safely', '<p>Choose <b>Minutes</b> and press <b>↓ Largest to smallest</b>, so whole rows move together.</p>');
  }

  // ---------- Filtering ----------
  function syncFilterBtns() {
    ui.toggle(filterBtns, filterBtns.find((b) => b.dataset.v === filter));
  }
  async function setFilter(v) {
    if (busy) return;
    if (v === filter && v !== null) return;
    stage.reveal();
    save();
    filter = v;
    filterOn = filterOn || !!v;
    syncFilterBtns();
    setBusy(true);
    await layout(0.8, 'rows');
    setBusy(false);
    if (v) {
      const vis = visible().map(rowById);
      const mins = vis.map((r) => r.mins);
      ui.info(`⏷ Filter: only “${v}”`, `<p><b>${vis.length}</b> row${vis.length === 1 ? '' : 's'} left: spreadsheet rows ${vis.map((r) => sheetRow(r.no)).join(', ')} (the blue numbers). The other rows are <b>hidden, not deleted</b>.</p><p>Their minutes: ${mins.join(', ')}.${v === 'Trotro or bus' ? ' Every pupil who comes by trotro or bus takes 40 minutes or more!' : ''}</p><p>Press <b>Clear filter</b> to bring every row back.</p>`);
      if (v === 'Trotro or bus') flags.filtered = true;
    } else {
      ui.info('✕ Filter cleared', `<p>All ${rows.length} rows are back. Nothing was deleted: a filter only <b>hides</b> rows while you look at some of them.</p>`);
      if (flags.filtered) ui.complete('filter');
    }
  }

  // ---------- IF ----------
  function parseIf(raw) {
    const s = raw.trim().replace(/[“”]/g, '"');
    if (!s) return { err: 'Type the formula first, or press <b>Show me the formula</b>.' };
    if (!s.startsWith('=')) return { err: 'A formula must start with <b>=</b>. Without it, the sheet just shows your words as text.' };
    if (!/^=\s*IF\s*\(/i.test(s)) return { err: 'This formula should start with <b>=IF(</b>.' };
    if ((s.match(/"/g) || []).length < 4) return { err: 'Words go in <b>"quotation marks"</b>: "Long trip" and "Short trip".' };
    const m = s.match(/^=\s*IF\s*\(\s*([A-Z]+)(\d+)\s*(>=|<=|<>|>|<|=)\s*(\d+)\s*[,;]\s*"([^"]*)"\s*[,;]\s*"([^"]*)"\s*\)\s*$/i);
    if (!m) return { err: 'Check the three parts, separated by commas: the test, the answer if true, the answer if false. Every ( needs a ).' };
    const [, col, rowN, op, n, a, b] = m;
    if (col.toUpperCase() !== 'D') return { err: `<b>${esc(col.toUpperCase())}</b> is not the Minutes column. Minutes are in column <b>D</b>.` };
    if (rowN !== '2') return { err: `This formula goes in H2, so it should look at the same row: <b>D2</b>, not D${esc(rowN)}.` };
    return { op, n: Number(n), a, b };
  }
  async function enterIf() {
    if (busy) return;
    const p = parseIf(ifInput.value);
    if (p.err) return ui.info('Hmm, the formula needs fixing', `<p>${p.err}</p>`);
    save();
    trip = { applied: true, filled: false, ...p };
    fxText = { cell: 'H2', text: `=IF(D2${p.op}${p.n},"${p.a}","${p.b}")` };
    setBusy(true);
    await layout(0.3, 'rows');
    setBusy(false);
    const top = rowById(order[0]);
    ui.info(`H2 shows “${tripOf(top)}”`, `<p>The test checked row 2: <b>${top.mins} ${p.op} ${p.n}</b> is ${tripOf(top) === p.a ? 'TRUE' : 'FALSE'}, so H2 shows <b>"${esc(tripOf(top))}"</b>.</p><p>Only one cell has the formula. Now <b>drag the AutoFill handle down</b> to copy it to every row.</p>`);
  }
  async function fillDown() {
    if (busy) return;
    if (!trip.applied) return ui.info('Nothing to fill yet', '<p>Type the IF formula in H2 and press <b>Enter</b> first.</p>');
    save();
    trip = { ...trip, filled: true };
    setBusy(true);
    await layout(0.8, 'rows');
    setBusy(false);
    const long = rows.filter((r) => tripOf(r) === trip.a).length;
    const exact = trip.op === '>=' && trip.n === 30 && trip.a.trim().toLowerCase() === 'long trip' && trip.b.trim().toLowerCase() === 'short trip';
    const taxi = rowById(4);
    ui.info('⤓ Filled down to every row', `<p>Each row now has its own formula: row 3 checks D3, row 4 checks D4… The chart turned red for “${esc(trip.a)}” and green for “${esc(trip.b)}”, with a line at ${trip.n} minutes.</p><p><code>=COUNTIF(H2:H11,"${esc(trip.a)}")</code> would show <b>${long}</b>.</p>${!exact && trip.op === '>' && trip.n === 30 ? `<p>Look at pupil No. 4: ${taxi.mins} minutes is <b>${esc(tripOf(taxi))}</b>, because 30 is not <i>more than</i> 30. The workbook uses <b>&gt;=</b> (30 or more).</p>` : ''}${exact ? '' : '<p>The workbook formula is <code>=IF(D2>=30,"Long trip","Short trip")</code>. Try that one!</p>'}`);
    if (exact && intact()) ui.complete('if');
    else if (exact) ui.info('The labels are wrong too!', '<p>IF used the scrambled minutes from the one-column sort. Undo until the rows are whole, then fill down again.</p>');
  }

  function describeRow(r) {
    if (busy) return;
    const real = DATA[r.no - 1][3];
    fxText = { cell: `D${sheetRow(r.no)}`, text: String(r.mins) };
    drawFx();
    ui.info(`Row ${sheetRow(r.no)}: pupil No. ${r.no}`, `<p>${esc(r.cls)} · ${esc(r.travel)} · <b>${r.mins} minutes</b> · ${esc(r.food)} · screen ${r.screen} h · enjoys Tech Club ${r.enjoy}/5${trip.applied && trip.filled ? ` · <b>${esc(tripOf(r))}</b>` : ''}</p>${r.mins !== real ? `<p>⚠️ This pupil really takes <b>${real}</b> minutes. The one-column sort broke this row!</p>` : '<p>One row is one person: all these answers belong together.</p>'}`);
  }

  drawHead();
  drawLegend();
  drawPlaque();
  drawFx();
  layout(0);
  setBusy(false);
  ui.info('Data Sorter 🧮', '<p>This is the class survey sheet. Each strip is <b>one row = one person</b>, and each column is one question. Row 1, the <b>header row</b>, is frozen at the top.</p><p>The chart on the right has one column per pupil (their minutes), in the same order as the table. Try sorting, filtering and an <b>IF</b> formula.</p>');
}

export const missions = [
  { id: 'sort', text: 'Sort by Minutes, largest first, so whole rows move. Then sort column D on its own and undo the mess.', hint: 'Choose "Minutes" and press "Largest to smallest". Then try "Select column D only", and press Undo (Ctrl + Z).' },
  { id: 'filter', text: 'Filter Travel to show only "Trotro or bus", read the rows left, then clear the filter.', hint: 'The hidden rows are not deleted. "Clear filter" brings them all back.' },
  { id: 'if', text: 'Type =IF(D2>=30,"Long trip","Short trip") in H2, press Enter and fill it down to every row.', hint: 'Every row must still be whole. Stuck? Press "Show me the formula".' },
];

export const config = { camera: [3.4, 6.8, 13.5], target: [1.3, 3.4, 0], shadowSize: 11, frame: 1.0 };
