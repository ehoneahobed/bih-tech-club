// Sessions 10–11 — Spreadsheets & Charts: type numbers into a mini spreadsheet,
// watch 3D column or pie charts update, and see SUM / AVERAGE / MAX / MIN live.
import { THREE, COLORS, box, mat, label, setLabel } from './runtime.js';

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
  const bars = [];
  const tags = [];
  const title = label('Canteen sales this week', { scale: 0.7, width: 1024 });
  title.position.set(0, 6.4, -1);
  scene.add(title);

  // Axis + grid lines for the column view
  const axis = new THREE.Group();
  for (let v = 0; v <= 100; v += 25) {
    const y = (v / 100) * 5;
    const line = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xadb5bd }));
    line.position.set(0, y + 0.01, -1.1);
    axis.add(line);
  }
  scene.add(axis);
  const axisTags = [];

  rows.forEach((_, i) => {
    const bar = box(1.1, 1, 1.1, PALETTE[i]);
    bar.geometry.translate(0, 0.5, 0);
    chart.add(bar);
    bars.push({ mesh: bar, h: 0.01 });
    const t = label('', { scale: 0.5 });
    chart.add(t);
    tags.push(t);
    stage.clickable(bar, () => ui.complete('cell') || ui.info(`Cell B${i + 2}`, `<p><b>${rows[i].item}</b>: GH₵ ${rows[i].value}. This value lives in cell <b>B${i + 2}</b> (column B, row ${i + 2}).</p>`));
  });

  const pie = new THREE.Group();
  scene.add(pie);

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
      axis.children.forEach((l, i) => (l.position.y = i * 1.25 + 0.01));
      rows.forEach((r, i) => {
        const x = -3.4 + i * 1.7;
        bars[i].mesh.position.set(x, 0, 0);
        bars[i].target = Math.max(0.02, (r.value / scaleMax) * 5);
        bars[i].mesh.material.color.setHex(r.value === s.max ? COLORS.gold : PALETTE[i]);
        setLabel(tags[i], [`${r.item}`, `${r.value}`], { width: 512, height: 220 });
        tags[i].scale.set(1.45, 0.62, 1);
        tags[i].userData.x = x;
      });
    } else {
      pie.clear();
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
    }
  }

  stage.onTick((dt) => {
    bars.forEach((b, i) => {
      b.h += ((b.target ?? 0.01) - b.h) * Math.min(1, dt * 7);
      b.mesh.scale.y = b.h;
      tags[i].position.set(tags[i].userData.x ?? 0, b.h + 0.45, 0);
    });
    pie.rotation.y += type === 'pie' ? dt * 0.15 : 0;
  });

  setType('column', bc);
}

export const config = { camera: [0, 5.5, 12], target: [0, 2.6, 0], shadowSize: 8 };

export const missions = [
  { id: 'cell', text: 'Click a column to find out which cell it comes from.', hint: 'Every cell has an address: a column letter + a row number, like B3.' },
  { id: 'edit', text: 'Change one of the sales numbers in column B.', hint: 'Watch the column grow or shrink, and the SUM change by itself.' },
  { id: 'newmax', text: 'Make a different day the best day (the gold MAX column).', hint: 'Give Monday, Tuesday, Wednesday or Thursday a number bigger than Friday\'s.' },
  { id: 'pie', text: 'Switch to a pie chart.', hint: 'A pie shows how big each part is compared to the whole.' },
];
