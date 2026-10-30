// Sessions 10–11 — Spreadsheets & Charts: type numbers into a mini spreadsheet,
// watch 3D column or pie charts update, and see SUM / AVERAGE / MAX / MIN live.
import { THREE, COLORS, box, mat, rbox, decal, label, setLabel } from './runtime.js';

const START = [
  ['Monday', 45],
  ['Tuesday', 60],
  ['Wednesday', 38],
  ['Thursday', 72],
  ['Friday', 90],
];
// No gold here: gold is kept for the MAX column.
const PALETTE = [0x5a4470, 0xca1f3f, 0x2ec4b6, 0x8a7a98, 0x24182e, 0x2a9d8f];

export default function chartLab(stage, ui) {
  const { scene } = stage;
  const rows = START.map(([a, b]) => ({ item: a, value: b }));
  let type = 'column';

  // ---------- Spreadsheet (HTML) ----------
  const sheet = ui.element(`
    <table class="mini-sheet">
      <thead><tr><th></th><th>A</th><th>B</th></tr></thead>
      <tbody>
        <tr><th>1</th><td><b>Day</b></td><td><b>Canteen sales (GH₵)</b></td></tr>
        ${rows.map((r, i) => `<tr><th>${i + 2}</th><td><input data-i="${i}" data-k="item" value="${r.item}" aria-label="A${i + 2}"></td><td><input data-i="${i}" data-k="value" type="number" min="0" max="500" value="${r.value}" aria-label="B${i + 2}"></td></tr>`).join('')}
        <tr class="fx"><th>7</th><td><code>=SUM(B2:B6)</code></td><td data-out="sum"></td></tr>
        <tr class="fx"><th>8</th><td><code>=AVERAGE(B2:B6)</code></td><td data-out="avg"></td></tr>
        <tr class="fx"><th>9</th><td><code>=MAX(B2:B6)</code></td><td data-out="max"></td></tr>
        <tr class="fx"><th>10</th><td><code>=MIN(B2:B6)</code></td><td data-out="min"></td></tr>
      </tbody>
    </table>`, ui.group('Edit the data — the chart updates'));
  sheet.addEventListener('input', (e) => {
    const { i, k } = e.target.dataset;
    if (i === undefined) return;
    rows[i][k] = k === 'value' ? Math.max(0, Math.min(500, Number(e.target.value) || 0)) : e.target.value;
    draw();
    if (k === 'value') ui.complete('edit');
    const top = Math.max(...rows.map((r) => r.value));
    if (rows.findIndex((r) => r.value === top) !== 4) ui.complete('newmax');
  });

  const g = ui.group('Chart type');
  const bc = ui.button('📊 Column', () => setType('column', bc), { group: g });
  const bp = ui.button('🥧 Pie', () => setType('pie', bp), { group: g });
  function setType(t, b) {
    type = t;
    if (t === 'pie') ui.complete('pie');
    ui.toggle([bc, bp], b);
    draw();
    ui.info(t === 'column' ? 'Column chart' : 'Pie chart', t === 'column'
      ? '<p><b>Column charts compare amounts.</b> Taller column = bigger number. The <b style="color:#8A5C00">gold</b> column is the MAX.</p><p>Tip: select only <code>A1:B6</code> — never include the total row, or every other bar will look tiny.</p>'
      : '<p><b>Pie charts show parts of a whole.</b> Each slice is that day\'s share of the week\'s total (the SUM). Use them for a few categories that add up to 100%.</p>');
  }

  // ---------- 3D chart ----------
  const chart = new THREE.Group();
  scene.add(chart);
  const pie = new THREE.Group();
  scene.add(pie);
  const bars = [];
  const tags = [];
  const title = label('Canteen sales this week', { scale: 0.7, width: 1024 });
  title.position.set(0, 6.4, -1);
  scene.add(title);

  // Axis + grid lines for the column view, on a framed chart board.
  const axis = new THREE.Group();
  const grid = [];
  for (let v = 0; v <= 100; v += 25) {
    const y = (v / 100) * 5;
    const line = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xadb5bd }));
    line.position.set(0, y + 0.01, -1.1);
    axis.add(line);
    grid.push(line);
  }
  buildFrame(axis);
  scene.add(axis);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.7, 0.14, 64), mat(0xe9e5ec));
  plinth.position.y = -0.07;
  plinth.receiveShadow = true;
  pie.add(plinth);
  const sheetView = buildLaptop();
  scene.add(sheetView.laptop);
  const axisTags = [];

  rows.forEach((_, i) => {
    const bar = box(1.1, 1, 1.1, PALETTE[i]);
    bar.geometry.translate(0, 0.5, 0);
    chart.add(bar);
    bars.push({ mesh: bar, h: 0.01 });
    const t = label('', { scale: 0.5 });
    chart.add(t);
    tags.push(t);
    stage.clickable(bar, () => cellInfo(i));
  });
  const cellInfo = (i) => ui.complete('cell') || ui.info(`Cell B${i + 2}`, `<p><b>${rows[i].item}</b>: GH₵ ${rows[i].value}. This value lives in cell <b>B${i + 2}</b> (column B, row ${i + 2}).</p>`);

  // ---------- Callouts ----------
  // Each view gets its own cards. A card on a column does the same as clicking that column.
  const cards = {};
  function pin(key, obj, o) {
    if (cards[key]?.obj !== obj) {
      cards[key]?.remove();
      cards[key] = Object.assign(stage.callout(obj, o), { obj });
    }
    cards[key].set(o.title, o.text, o.icon);
  }
  const unpin = (...keys) => keys.forEach((k) => (cards[k]?.remove(), delete cards[k]));
  const pinBar = (key, i, o) => pin(key, bars[i].mesh, { at: [0, 1, 0], ...o, onClick: () => cellInfo(i) });

  function stats() {
    const v = rows.map((r) => r.value);
    const sum = v.reduce((a, b) => a + b, 0);
    return { sum, avg: sum / v.length, max: Math.max(...v), min: Math.min(...v) };
  }

  function draw() {
    const s = stats();
    sheet.querySelector('[data-out=sum]').textContent = s.sum;
    sheet.querySelector('[data-out=avg]').textContent = s.avg.toFixed(1);
    sheet.querySelector('[data-out=max]').textContent = s.max;
    sheet.querySelector('[data-out=min]').textContent = s.min;
    sheetView.draw(rows, s);

    const scaleMax = Math.max(100, Math.ceil(s.max / 50) * 50);
    axisTags.forEach((t) => scene.remove(t));
    axisTags.length = 0;
    axis.visible = chart.visible = type === 'column';
    pie.visible = type === 'pie';

    if (type === 'column') {
      [0, 0.5, 1].forEach((f) => {
        const t = label(`${Math.round(scaleMax * f)}`, { scale: 0.42, width: 256 });
        t.position.set(-4.9, f * 5 + 0.1, -1.1);
        scene.add(t);
        axisTags.push(t);
      });
      grid.forEach((l, i) => (l.position.y = i * 1.25 + 0.01));
      rows.forEach((r, i) => {
        const x = -3.4 + i * 1.7;
        bars[i].mesh.position.set(x, 0, 0);
        bars[i].target = Math.max(0.02, (r.value / scaleMax) * 5);
        bars[i].mesh.material.color.setHex(r.value === s.max ? COLORS.gold : PALETTE[i]);
        setLabel(tags[i], [`${r.item}`, `${r.value}`], { width: 512, height: 220 });
        tags[i].scale.set(1.45, 0.62, 1);
        tags[i].userData.x = x;
      });
      const top = rows.findIndex((r) => r.value === s.max);
      const cell = top === 0 ? 1 : 0;
      unpin('pie');
      pin('title', title, { icon: '🏷️', title: 'Chart title', text: 'What the chart shows', dx: 190, dy: -45 });
      pin('axis', axis, { icon: '📏', title: 'Axis', text: `The scale: 0 to ${scaleMax}`, at: [-4.3, 5, -1.1], dx: -110, dy: -80 });
      pinBar('max', top, { icon: '🏆', title: 'MAX', text: `Gold = best day: ${rows[top].item}`, dx: 70, dy: -65 });
      pinBar('cell', cell, { icon: '🔗', title: `Cell B${cell + 2}`, text: `Holds ${rows[cell].item}'s number`, at: [0, 0.3, 0.55], dx: -130, dy: 70 });
    } else {
      pie.clear();
      pie.add(plinth);
      let a = 0;
      rows.forEach((r, i) => {
        const share = s.sum ? r.value / s.sum : 1 / rows.length;
        const slice = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.6 + share * 2, 48, 1, false, a, share * Math.PI * 2), mat(PALETTE[i]));
        slice.position.y = (0.6 + share * 2) / 2;
        const mid = a + share * Math.PI;
        slice.position.x = Math.sin(mid) * 0.15;
        slice.position.z = Math.cos(mid) * 0.15;
        slice.castShadow = true;
        pie.add(slice);
        const t = label([r.item, `${Math.round(share * 100)}%`], { scale: 0.42, height: 220 });
        t.scale.set(0.95, 0.42, 1);
        t.position.set(Math.sin(mid) * 3.9, 1.6, Math.cos(mid) * 3.9);
        pie.add(t);
        a += share * Math.PI * 2;
      });
      unpin('axis', 'max', 'cell');
      pin('title', title, { icon: '🏷️', title: 'Chart title', text: 'What the chart shows', dx: 190, dy: -45 });
      pin('pie', pie, { icon: '🥧', title: 'Whole = SUM', text: `The slices add up to GH₵ ${s.sum}`, at: [0, 1.2, 0], dx: -150, dy: 170 });
    }
  }

  stage.onTick((dt) => {
    bars.forEach((b, i) => {
      b.h += ((b.target ?? 0.01) - b.h) * Math.min(1, dt * 7);
      b.mesh.scale.y = b.h;
      tags[i].position.set(tags[i].userData.x ?? 0, b.h + 0.45, 0);
    });
    pie.rotation.y += type === 'pie' ? dt * 0.15 : 0; // the round plinth turns with it, unseen
  });

  setType('column', bc);
}

export const config = { camera: [6, 6.5, 11], target: [0.4, 2.4, 0], shadowSize: 8, groundY: -0.14, frame: 1.08 };

export const missions = [
  { id: 'cell', text: 'Click a column to find out which cell it comes from.', hint: 'Every cell has an address: a column letter + a row number, like B3.' },
  { id: 'edit', text: 'Change one of the sales numbers in column B.', hint: 'Watch the column grow or shrink, and the SUM change by itself.' },
  { id: 'newmax', text: 'Make a different day the best day (the gold MAX column).', hint: 'Give Monday, Tuesday, Wednesday or Thursday a number bigger than Friday\'s.' },
  { id: 'pie', text: 'Switch to a pie chart.', hint: 'A pie shows how big each part is compared to the whole.' },
];

// ---------- Chart models ----------
// The board behind the columns: frame, value axis with tick marks, category
// ticks on the base and a title plaque. It belongs to the column view only.
function buildFrame(axis) {
  const board = rbox(9.4, 5.7, 0.1, 0xffffff, 0.04, { emissive: 0x2a2a2a });
  board.position.set(0, 2.75, -1.32);
  const rim = rbox(9.7, 6.0, 0.08, COLORS.blue, 0.05);
  rim.position.set(0, 2.75, -1.4);
  const plaque = rbox(4.8, 0.7, 0.14, COLORS.purple, 0.08);
  plaque.position.set(0, 6.25, -1.3);
  const base = rbox(9.7, 0.14, 2.8, 0xe9e5ec, 0.04);
  base.position.set(0, -0.07, 0);
  const post = box(0.07, 5.25, 0.07, COLORS.purple);
  post.position.set(-4.3, 2.62, -1.1);
  axis.add(board, rim, plaque, base, post);
  for (let i = 0; i <= 8; i++) {
    const tick = box(i % 2 ? 0.14 : 0.26, 0.035, 0.05, COLORS.purple);
    tick.position.set(-4.3 - (i % 2 ? 0.07 : 0.13), (i / 8) * 5 + 0.01, -1.1);
    axis.add(tick);
  }
  // Floor: category axis along the front, with a tick between columns.
  const floor = decal(9.7, 2.8, (g, w, h) => {
    g.strokeStyle = 'rgba(90,68,112,0.25)';
    g.lineWidth = 2;
    for (let x = 0; x <= w; x += w / 24) g.strokeRect(x, 0, 0, h);
    for (let y = 0; y <= h; y += h / 7) g.strokeRect(0, y, w, 0);
    g.fillStyle = '#24182E';
    const ax = (y) => h * (0.5 + y / 2.8); // world z -> canvas y
    const cx = (x) => w * ((x + 4.85) / 9.7); // world x -> canvas x
    g.fillRect(cx(-4.3), ax(0.7) - 3, cx(4.3) - cx(-4.3), 6);
    for (let i = 0; i <= 5; i++) g.fillRect(cx(-4.25 + i * 1.7) - 3, ax(0.7) - 3, 6, 26);
  }, { px: 256 });
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.002;
  axis.add(floor);
}

// A laptop beside the chart, its screen showing the same spreadsheet cells, live.
function buildLaptop() {
  const laptop = new THREE.Group();
  const base = rbox(2.5, 0.1, 1.7, 0x8d939b, 0.04);
  base.position.y = 0.05;
  const keys = decal(2.3, 1.5, (g, w, h) => {
    g.fillStyle = '#2b2730';
    for (let r = 0; r < 5; r++)
      for (let k = 0; k < 12; k++) g.fillRect(14 + k * ((w - 28) / 12), 12 + r * 34, (w - 28) / 12 - 5, 28);
    g.strokeStyle = '#5c5864';
    g.lineWidth = 3;
    g.strokeRect(w * 0.36, h * 0.74, w * 0.28, h * 0.22);
  });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.102, 0.05);
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.1, -0.82);
  hinge.rotation.x = -0.3;
  const lid = rbox(2.5, 1.65, 0.07, 0x8d939b, 0.03);
  lid.position.y = 0.825;
  const screen = decal(2.34, 1.5, () => {}, { px: 512, transparent: false });
  screen.position.set(0, 0.825, 0.037);
  hinge.add(lid, screen);
  laptop.add(base, keys, hinge);
  laptop.position.set(6.1, 0, 2.2);
  laptop.rotation.y = -0.45;
  laptop.scale.setScalar(1.3);
  const cv = screen.material.map.image;
  const draw = (rows, s) => {
    const g = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#24182E';
    g.fillRect(0, 0, w, 44);
    g.fillStyle = '#fff';
    g.font = '24px Rubik, Arial, sans-serif';
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    g.fillText('Canteen sales - Spreadsheet', w / 2, 23);
    // Formula bar
    g.textAlign = 'left';
    g.fillStyle = '#F4F0F6';
    g.fillRect(0, 44, w, 40);
    g.fillStyle = '#24182E';
    g.font = 'italic bold 22px Georgia, serif';
    g.fillText('fx', 14, 64);
    g.font = '22px Consolas, monospace';
    g.fillText('=MAX(B2:B6)', 60, 64);
    // Cell grid: row numbers, columns A and B
    const top = 84;
    const rh = (h - top) / 11;
    const cx = [0, 46, 340, w];
    const cells = [['', 'A', 'B'], ['1', 'Day', 'Sales (GH₵)'], ...rows.map((r, i) => [`${i + 2}`, r.item, `${r.value}`]),
      ['7', 'SUM', `${s.sum}`], ['8', 'AVERAGE', s.avg.toFixed(1)], ['9', 'MAX', `${s.max}`], ['10', 'MIN', `${s.min}`]];
    cells.forEach((row, r) => {
      const y = top + r * rh;
      row.forEach((txt, c) => {
        const head = r === 0 || c === 0;
        const isMax = (r >= 2 && r <= 6 && rows[r - 2].value === s.max && c === 2) || (r === 9 && c === 2);
        g.fillStyle = isMax ? '#FFBE00' : head ? '#E4DEEA' : r >= 7 ? '#F7F4F9' : '#fff';
        g.fillRect(cx[c], y, cx[c + 1] - cx[c], rh);
        g.strokeStyle = '#C9C1D1';
        g.lineWidth = 1.5;
        g.strokeRect(cx[c], y, cx[c + 1] - cx[c], rh);
        g.fillStyle = '#24182E';
        g.font = `${r === 1 || head ? 'bold ' : ''}21px Arial, sans-serif`;
        g.textAlign = c === 2 && r > 1 ? 'right' : head ? 'center' : 'left';
        const x = g.textAlign === 'right' ? cx[3] - 12 : g.textAlign === 'center' ? (cx[c] + cx[c + 1]) / 2 : cx[c] + 10;
        g.fillText(String(txt).slice(0, 22), x, y + rh / 2 + 1);
      });
    });
    screen.material.map.needsUpdate = true;
  };
  return { laptop, draw };
}
