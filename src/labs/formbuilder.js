// Session 21 — Online Forms & Surveys. Survey Builder: build "Our Class Survey"
// on a big 3D form by choosing the right question type for each question, mark
// questions Required, delete a question that asks for personal data you don't
// need, publish and share it (link or QR code), then watch classmates' answers
// arrive as paper slips in a clear ballot box and turn into a Summary chart.
import { THREE, COLORS, mat, rbox, box, decal, label, setLabel } from './runtime.js';

const TYPES = {
  short: { name: 'Short answer', icon: '✏️' },
  para: { name: 'Paragraph', icon: '📄' },
  mc: { name: 'Multiple choice', icon: '🔘' },
  check: { name: 'Checkboxes', icon: '☑️' },
  dropdown: { name: 'Drop-down', icon: '🔽' },
  scale: { name: 'Linear scale', icon: '📏' },
  date: { name: 'Date', icon: '📅' },
};
const TYPE_IDS = Object.keys(TYPES);
// The questions from the workbook's Lab Mission, with the types that fit them.
const BANK = [
  { id: 'class', q: 'What class are you in?', best: ['dropdown', 'mc'], choices: ['JHS 1', 'JHS 2', 'JHS 3'], one: true },
  { id: 'travel', q: 'How do you usually travel to school?', best: ['mc', 'dropdown'], choices: ['Walk', 'Trotro or bus', 'Taxi', 'Bicycle', 'Car', 'Other'], one: true },
  { id: 'minutes', q: 'How many minutes does it take you to get to school?', best: ['short'], number: true },
  { id: 'food', q: 'What is your favourite local food?', best: ['mc', 'dropdown'], choices: ['Jollof', 'Waakye', 'Fufu', 'Banku', 'Kenkey', 'Red-red', 'Other'], one: true },
  { id: 'after', q: 'What do you do after school?', best: ['check'], choices: ['Homework', 'Help at home', 'Play sport', 'Watch TV', 'Read'], many: true },
  { id: 'enjoy', q: 'How much do you enjoy Tech Club?', best: ['scale'], choices: ['1', '2', '3', '4', '5'], howMuch: true },
  { id: 'idea', q: 'One idea to make our school better', best: ['para'], words: true },
];
const PHONE = { id: 'phone', q: 'What is your full name and phone number?', type: 'short', required: true };
// 20 classmates' answers (the second 20 answer the same way). Half walk, like Figure 21.4.
const ANSWERS = {
  class: { 'JHS 1': 8, 'JHS 2': 7, 'JHS 3': 5 },
  travel: { Walk: 10, 'Trotro or bus': 5, Taxi: 2, Bicycle: 2, Car: 1 },
  food: { Jollof: 7, Waakye: 5, Fufu: 3, Banku: 2, Kenkey: 2, 'Red-red': 1 },
  after: { Homework: 15, 'Help at home': 12, 'Play sport': 9, 'Watch TV': 8, Read: 5 },
  enjoy: { 1: 1, 2: 1, 3: 3, 4: 6, 5: 9 },
};
const BATCH = 20;
const PIE = ['#2EC4B6', '#FFBE00', '#CA1F3F', '#5A4470', '#E8A33D', '#24182E', '#9a8fa6'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default function formBuilderLab(stage, ui, host) {
  const { scene } = stage;
  // ---------- State ----------
  let form = [{ ...PHONE }]; // the draft someone started: it already asks for too much!
  let nextIdx = 0;
  let published = false;
  let shared = { link: false, qr: false };
  let responses = 0;
  let chartQ = null;
  let busy = false;
  let readDone = false;

  // ---------- Room: a low table for everything ----------
  const top = rbox(14, 0.3, 7, 0xc8a27a, 0.08);
  top.position.set(0, -0.15, 0);
  scene.add(top);

  // ---------- The big form (a tall card on a stand) ----------
  const FW = 720;
  const FH = 1280;
  const formCv = document.createElement('canvas');
  formCv.width = FW;
  formCv.height = FH;
  const formTex = new THREE.CanvasTexture(formCv);
  formTex.colorSpace = THREE.SRGBColorSpace;
  formTex.anisotropy = 8;
  const formG = new THREE.Group();
  formG.position.set(-1.3, 0, -1.0);
  formG.rotation.y = 0.12;
  scene.add(formG);
  const FWW = 3.1;
  const FHW = FWW * (FH / FW);
  const frame = rbox(FWW + 0.24, FHW + 0.24, 0.16, COLORS.purple, 0.1);
  frame.position.set(0, 0.5 + FHW / 2, 0);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(FWW, FHW), new THREE.MeshBasicMaterial({ map: formTex, toneMapped: false }));
  screen.position.set(0, 0.5 + FHW / 2, 0.085);
  screen.userData.noInk = true;
  const foot = rbox(2.2, 0.16, 1.2, 0x3a2b47, 0.06);
  foot.position.set(0, 0.08, 0.1);
  const neck = rbox(0.5, 0.5, 0.2, 0x3a2b47, 0.05);
  neck.position.set(0, 0.35, -0.02);
  formG.add(frame, screen, foot, neck);

  // ---------- The clear ballot box ----------
  const boxG = new THREE.Group();
  boxG.position.set(1.5, 0, 1.6);
  boxG.rotation.y = -0.15;
  scene.add(boxG);
  const BW = 1.9;
  const BH = 1.6;
  const BD = 1.4;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), new THREE.MeshStandardMaterial({ color: 0xdff3f8, transparent: true, opacity: 0.28, roughness: 0.1, depthWrite: false }));
  glass.position.y = BH / 2;
  glass.userData.noInk = true;
  boxG.add(glass);
  // Plum edges, a lid with a slot and a seal, like a real ballot box.
  const edgeGeo = new THREE.BoxGeometry(1, 1, 1);
  const edgeMat = mat(COLORS.purple);
  const addEdge = (w, h, d, x, y, z) => {
    const e = new THREE.Mesh(edgeGeo, edgeMat);
    e.scale.set(w, h, d);
    e.position.set(x, y, z);
    e.castShadow = true;
    boxG.add(e);
  };
  for (const x of [-BW / 2, BW / 2]) for (const z of [-BD / 2, BD / 2]) addEdge(0.07, BH, 0.07, x, BH / 2, z);
  for (const y of [0.035, BH]) {
    for (const z of [-BD / 2, BD / 2]) addEdge(BW + 0.07, 0.07, 0.07, 0, y, z);
    for (const x of [-BW / 2, BW / 2]) addEdge(0.07, 0.07, BD + 0.07, x, y, 0);
  }
  const lid = rbox(BW + 0.16, 0.1, BD + 0.16, 0xf4f0f6, 0.03);
  lid.position.y = BH + 0.05;
  const slot = box(0.9, 0.02, 0.1, 0x24182e);
  slot.position.y = BH + 0.105;
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), mat(COLORS.red));
  seal.position.set(BW / 2 - 0.25, BH + 0.115, BD / 2 - 0.2);
  boxG.add(lid, slot, seal);
  const boxSign = decal(1.5, 0.42, () => {}, { px: 96 });
  boxSign.position.set(0, BH * 0.55, BD / 2 + 0.04);
  boxG.add(boxSign);
  function drawBoxSign() {
    const c = boxSign.material.map.image;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.roundRect(4, 4, c.width - 8, c.height - 8, 18);
    g.fill();
    g.fillStyle = '#24182E';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${c.height * 0.3}px Rubik, system-ui, sans-serif`;
    g.fillText('RESPONSES', c.width / 2, c.height * 0.33);
    g.fillStyle = responses ? '#CA1F3F' : '#8a7f94';
    g.font = `bold ${c.height * 0.32}px Rubik, system-ui, sans-serif`;
    g.fillText(`${responses} ${responses === 1 ? 'answer' : 'answers'}`, c.width / 2, c.height * 0.7);
    boxSign.material.map.needsUpdate = true;
  }
  // Paper slips pile up inside.
  const slipGeo = new THREE.BoxGeometry(0.42, 0.012, 0.28);
  const slipMat = mat(0xffffff, { roughness: 0.9 });
  const slips = [];

  // ---------- Classmates' phones (where answers come from) ----------
  const phones = [];
  const phoneTex = [];
  [[-4.7, 1.7, 0.35], [-3.6, 2.4, -0.1], [-2.5, 2.0, -0.35]].forEach(([x, z, ry], i) => {
    const p = new THREE.Group();
    const body = rbox(0.72, 0.08, 1.4, 0x2b2730, 0.08);
    body.position.y = 0.04;
    const scr = decal(0.64, 1.24, () => {}, { px: 256, transparent: false });
    scr.rotation.x = -Math.PI / 2;
    scr.position.y = 0.082;
    p.add(body, scr);
    p.position.set(x, 0, z);
    p.rotation.y = ry;
    scene.add(p);
    phones.push(p);
    phoneTex.push(scr);
    stage.clickable(p, () => (published ? share('link') : publish()));
    void i;
  });
  function drawPhones() {
    phoneTex.forEach((scr, i) => {
      const c = scr.material.map.image;
      const g = c.getContext('2d');
      const W = c.width;
      const H = c.height;
      g.fillStyle = '#ECE5DD';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#24182E';
      g.fillRect(0, 0, W, H * 0.1);
      g.fillStyle = '#ffffff';
      g.font = `bold ${H * 0.04}px Rubik, system-ui, sans-serif`;
      g.textBaseline = 'middle';
      g.fillText('JHS 1 Class 📚', W * 0.06, H * 0.05);
      const bubble = (y, h, text, me) => {
        g.fillStyle = me ? '#DCF8C6' : '#ffffff';
        g.beginPath();
        g.roundRect(me ? W * 0.18 : W * 0.05, y, W * 0.77, h, 14);
        g.fill();
        g.fillStyle = '#24182E';
        g.font = `${H * 0.034}px Rubik, system-ui, sans-serif`;
        text.forEach((t, j) => {
          g.fillStyle = t.startsWith('forms.') ? '#1d4ed8' : '#24182E';
          g.fillText(t, (me ? W * 0.18 : W * 0.05) + 12, y + 24 + j * H * 0.045);
        });
      };
      bubble(H * 0.14, H * 0.1, ['Who has finished the', 'maths homework? 😅'], false);
      if (shared.link) bubble(H * 0.28, H * 0.19, ['Please answer our class', 'survey! It is anonymous:', 'forms.gle/OurClass21'], true);
      if (shared.link && responses && i !== 1) bubble(H * 0.5, H * 0.1, ['Done ✅', ''], false);
      if (shared.link && responses >= BATCH && i === 1) bubble(H * 0.5, H * 0.1, ['Answered! 👍', ''], false);
      if (!shared.link) {
        g.fillStyle = '#8a7f94';
        g.font = `${H * 0.034}px Rubik, system-ui, sans-serif`;
        g.textAlign = 'center';
        g.fillText('No survey link yet…', W / 2, H * 0.6);
        g.textAlign = 'left';
      }
      scr.material.map.needsUpdate = true;
    });
  }

  // ---------- QR poster on a little easel ----------
  const qrG = new THREE.Group();
  qrG.position.set(-4.4, 0, -1.2);
  qrG.rotation.y = 0.35;
  scene.add(qrG);
  const easel = rbox(1.9, 2.4, 0.08, 0xc8a27a, 0.04);
  easel.position.set(0, 1.5, 0);
  easel.rotation.x = -0.12;
  const legA = rbox(0.08, 1.4, 0.08, 0x8d6e4c, 0.02);
  legA.position.set(0, 0.62, -0.55);
  legA.rotation.x = 0.5;
  qrG.add(easel, legA);
  const qrPoster = decal(1.7, 2.2, () => {}, { px: 256, transparent: false });
  qrPoster.position.set(0, 1.5, 0.045);
  qrPoster.rotation.x = -0.12;
  qrG.add(qrPoster);
  stage.clickable(qrG, () => (published ? share('qr') : publish()));
  function drawQR() {
    const c = qrPoster.material.map.image;
    const g = c.getContext('2d');
    const W = c.width;
    const H = c.height;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#24182E';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${H * 0.07}px Rubik, system-ui, sans-serif`;
    g.fillText('OUR CLASS SURVEY', W / 2, H * 0.08);
    const s = W * 0.72;
    const x0 = (W - s) / 2;
    const y0 = H * 0.16;
    if (shared.qr) {
      // A pretend QR code: three finder squares and a pattern of dots.
      const n = 25;
      const cell = s / n;
      let seed = 21;
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rnd() < 0.48) g.fillRect(x0 + x * cell, y0 + y * cell, cell, cell);
      for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
        g.fillStyle = '#ffffff';
        g.fillRect(x0 + fx * cell - cell, y0 + fy * cell - cell, cell * 9, cell * 9);
        g.fillStyle = '#24182E';
        g.fillRect(x0 + fx * cell, y0 + fy * cell, cell * 7, cell * 7);
        g.fillStyle = '#ffffff';
        g.fillRect(x0 + (fx + 1) * cell, y0 + (fy + 1) * cell, cell * 5, cell * 5);
        g.fillStyle = '#24182E';
        g.fillRect(x0 + (fx + 2) * cell, y0 + (fy + 2) * cell, cell * 3, cell * 3);
      }
      g.font = `bold ${H * 0.06}px Rubik, system-ui, sans-serif`;
      g.fillStyle = '#CA1F3F';
      g.fillText('📷 Point your camera here', W / 2, H * 0.86);
      g.fillStyle = '#8a7f94';
      g.font = `${H * 0.04}px Rubik, system-ui, sans-serif`;
      g.fillText('(a pretend QR code)', W / 2, H * 0.94);
    } else {
      g.strokeStyle = '#d9d3de';
      g.lineWidth = 6;
      g.setLineDash([16, 12]);
      g.strokeRect(x0, y0, s, s);
      g.setLineDash([]);
      g.fillStyle = '#8a7f94';
      g.font = `${H * 0.05}px Rubik, system-ui, sans-serif`;
      g.fillText('QR code goes here', W / 2, y0 + s / 2);
    }
    qrPoster.material.map.needsUpdate = true;
  }

  // ---------- Summary chart (pie for one-answer questions, bars for many) ----------
  const chartG = new THREE.Group();
  chartG.position.set(4.6, 0, 0.2);
  chartG.rotation.y = -0.2;
  scene.add(chartG);
  // A Summary card: an upright board with the title, the chart in front of it.
  const plinth = rbox(3.9, 0.3, 1.7, 0xf4f0f6, 0.06);
  plinth.position.set(0, 0.15, -0.2);
  const boardC = rbox(3.9, 3.8, 0.12, 0xffffff, 0.06);
  boardC.position.set(0, 2.05, -0.95);
  const headC = rbox(3.9, 0.62, 0.14, COLORS.purple, 0.06);
  headC.position.set(0, 3.65, -0.94);
  chartG.add(plinth, boardC, headC);
  const chartTitle = decal(3.7, 0.5, () => {}, { px: 96 });
  chartTitle.position.set(0, 3.65, -0.865);
  chartG.add(chartTitle);
  const pie = new THREE.Group();
  pie.position.set(0, 1.85, -0.55);
  pie.rotation.x = Math.PI / 2 - 0.3; // its face turned towards you
  chartG.add(pie);
  const pieTags = new THREE.Group();
  pieTags.position.copy(pie.position);
  pieTags.rotation.copy(pie.rotation);
  chartG.add(pieTags);
  const bars = new THREE.Group();
  bars.position.set(0, 0.3, -0.45);
  chartG.add(bars);
  const barGeo = new THREE.BoxGeometry(1, 1, 1);
  const barMats = PIE.map((c) => mat(new THREE.Color(c).getHex()));
  const tags = [];
  const tag = (i, parent) => {
    if (!tags[i]) tags[i] = label('', { scale: 0.5 });
    parent.add(tags[i]);
    return tags[i];
  };
  function drawChartTitle(text) {
    const c = chartTitle.material.map.image;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let px = c.height * 0.46;
    do g.font = `bold ${px}px Rubik, system-ui, sans-serif`;
    while (g.measureText(text).width > c.width - 30 && (px -= 2) > 10);
    g.fillText(text, c.width / 2, c.height * 0.54);
    chartTitle.material.map.needsUpdate = true;
  }
  const counts = (q, n) => {
    const out = (q.choices ?? []).filter((c) => c !== 'Other').map((c) => [c, 0]);
    const dist = ANSWERS[q.id] ?? {};
    const tot = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    for (const row of out) row[1] = Math.round(((dist[row[0]] ?? 0) * n) / (q.id === 'after' ? BATCH : tot));
    return out;
  };
  function drawChart() {
    for (const c of [...pie.children]) { c.geometry.dispose(); pie.remove(c); }
    for (const c of [...bars.children]) bars.remove(c);
    tags.forEach((t) => (t.visible = false));
    const q = form.find((x) => x.id === chartQ);
    if (!q || !responses) {
      drawChartTitle(responses ? 'Summary: pick a question' : 'Summary: no answers yet');
      return;
    }
    const data = counts(q, responses);
    const total = data.reduce((a, b) => a + b[1], 0) || 1;
    const usePie = q.type === 'mc' || q.type === 'dropdown';
    drawChartTitle(`${shortQ(q.q)} · ${responses} responses`);
    if (usePie) {
      let a = 0;
      data.forEach(([name, n], i) => {
        if (!n) return;
        const len = (n / total) * Math.PI * 2;
        const slice = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.3, 40, 1, false, a, len), barMats[i % barMats.length]);
        const mid = a + len / 2;
        const out = i === 0 ? 0.1 : 0;
        slice.position.set(Math.sin(mid) * out, data[0][1] === n ? 0.06 : 0, Math.cos(mid) * out);
        slice.castShadow = true;
        pie.add(slice);
        const t = tag(i, pieTags);
        t.visible = true;
        t.position.set(Math.sin(mid) * 0.85, 0.3, Math.cos(mid) * 0.85);
        setLabel(t, [`${name}`, `${Math.round((n / total) * 100)}%`]);
        a += len;
      });
    } else {
      const max = Math.max(...data.map((d) => d[1]), 1);
      const gap = 3.0 / data.length;
      data.forEach(([name, n], i) => {
        const h = Math.max(0.02, (n / max) * 2.4);
        const b = new THREE.Mesh(barGeo, barMats[1 + (i % 4)]);
        b.scale.set(gap * 0.62, h, 0.6);
        b.position.set(-1.5 + gap * (i + 0.5), h / 2, 0);
        b.castShadow = true;
        bars.add(b);
        const t = tag(i, bars);
        t.visible = true;
        t.position.set(-1.5 + gap * (i + 0.5), h + 0.3, 0.1);
        setLabel(t, [name, String(n)]);
      });
    }
  }
  const shortQ = (s) => (s.length > 32 ? s.slice(0, 30) + '…' : s);

  // ---------- Rendering the form ----------
  let cardsY = {}; // question id -> canvas y of its card (for callouts)
  function renderForm() {
    const g = formCv.getContext('2d');
    g.fillStyle = '#EEE8F6';
    g.fillRect(0, 0, FW, FH);
    g.fillStyle = '#24182E';
    g.fillRect(0, 0, FW, 64);
    g.fillStyle = '#ffffff';
    g.font = 'bold 26px Rubik, Arial, sans-serif';
    g.textBaseline = 'middle';
    g.fillText('📋 Our Class Survey', 22, 33);
    g.textAlign = 'right';
    g.fillStyle = published ? '#2EC4B6' : '#FFBE00';
    g.font = 'bold 22px Rubik, Arial, sans-serif';
    g.fillText(published ? '● Published' : '○ Draft', FW - 22, 33);
    g.textAlign = 'left';
    // Title card.
    const card = (y, h, accent) => {
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.roundRect(24, y, FW - 48, h, 14);
      g.fill();
      if (accent) {
        g.fillStyle = accent;
        g.beginPath();
        g.roundRect(24, y, FW - 48, 12, [14, 14, 0, 0]);
        g.fill();
      }
    };
    card(84, 150, '#5A4470');
    g.fillStyle = '#24182E';
    g.font = 'bold 40px Rubik, Arial, sans-serif';
    g.fillText('Our Class Survey', 48, 136);
    g.fillStyle = '#5c5266';
    g.font = '21px Rubik, Arial, sans-serif';
    g.fillText('The Tech Club is asking about travel and food to', 48, 180);
    g.fillText('practise data skills. Answers are anonymous.', 48, 208);
    let y = 252;
    const avail = FH - y - 20;
    const per = form.length ? Math.min(150, (avail - form.length * 14) / form.length) : 150;
    cardsY = {};
    form.forEach((q, i) => {
      card(y, per);
      cardsY[q.id] = y + per / 2;
      if (q.flash) {
        g.fillStyle = '#FFBE00';
        g.fillRect(24, y + 8, 8, per - 16);
      }
      g.fillStyle = '#24182E';
      let px = 24;
      const text = `${i + 1}. ${q.q}`;
      do g.font = `600 ${px}px Rubik, Arial, sans-serif`;
      while (g.measureText(text + ' *').width > FW - 100 && (px -= 1) > 14);
      g.fillText(text, 48, y + per * 0.27);
      if (q.required) {
        g.fillStyle = '#CA1F3F';
        g.fillText(' *', 48 + g.measureText(text).width, y + per * 0.27);
      }
      drawWidget(g, q, 48, y + per * 0.62, FW - 96, per);
      y += per + 14;
    });
    if (!form.length) {
      g.fillStyle = '#8a7f94';
      g.font = '24px Rubik, Arial, sans-serif';
      g.fillText('No questions yet. Add one!', 48, y + 40);
    }
    formTex.needsUpdate = true;
    placeCards();
  }
  function drawWidget(g, q, x, y, w, per) {
    g.font = '19px Rubik, Arial, sans-serif';
    g.fillStyle = '#5c5266';
    g.strokeStyle = '#8a7f94';
    g.lineWidth = 2.5;
    const t = q.type;
    if (t === 'short' || t === 'para') {
      g.fillText(t === 'short' ? (q.number ? 'Your answer (a number from 1 to 100)' : 'Your answer') : 'Long answer text', x, y - 4);
      g.fillRect(x, y + 12, w * (t === 'short' ? 0.55 : 0.95), 2);
      if (t === 'para' && per > 110) g.fillRect(x, y + 34, w * 0.95, 2);
    } else if (t === 'mc' || t === 'check') {
      let cx = x;
      for (const c of q.choices.slice(0, 4)) {
        if (t === 'mc') { g.beginPath(); g.arc(cx + 9, y, 9, 0, Math.PI * 2); g.stroke(); } else g.strokeRect(cx, y - 9, 18, 18);
        g.fillText(c, cx + 26, y + 1);
        cx += 40 + g.measureText(c).width;
        if (cx > x + w - 90) break;
      }
      if (q.choices.length > 4) g.fillText('…', cx, y + 1);
    } else if (t === 'dropdown') {
      g.strokeRect(x, y - 18, 220, 36);
      g.fillText('Choose          ▾', x + 12, y + 1);
    } else if (t === 'scale') {
      g.fillText('Not at all', x, y + 1);
      for (let i = 0; i < 5; i++) {
        const cx = x + 130 + i * 56;
        g.beginPath(); g.arc(cx, y, 10, 0, Math.PI * 2); g.stroke();
        g.fillText(String(i + 1), cx - 5, y - 24);
      }
      g.fillText('Very much!', x + 130 + 5 * 56, y + 1);
    } else if (t === 'date') {
      g.strokeRect(x, y - 18, 220, 36);
      g.fillText('dd/mm/yyyy   📅', x + 12, y + 1);
    }
  }

  // ---------- Callouts (most important first: phones show four) ----------
  const fLocal = (cy) => [FWW / 2, FHW / 2 - (cy / FH) * FHW, 0];
  const cards = {
    form: stage.callout(screen, { icon: '📝', title: 'Your form', text: 'Each question has a type', at: [-FWW / 2, FHW / 2 - 0.5, 0], dx: -120, dy: -30 }),
    privacy: stage.callout(screen, { icon: '✂️', title: 'Ask only what you need', text: 'Is every question needed?', at: fLocal(300), dx: 150, dy: -40 }),
    box: stage.callout(boxG, { icon: '📮', title: 'Responses', text: 'Every answer is counted for you', at: [0, BH + 0.1, 0], dx: -90, dy: -70 }),
    chart: stage.callout(chartG, { icon: '📊', title: 'Summary', text: 'The form draws the chart', at: [1.9, 1.2, -0.5], dx: 50, dy: 70 }),
    share: stage.callout(qrG, { icon: '🔗', title: 'Share', text: 'A link or a QR code', at: [0.8, 2.4, 0], dx: -20, dy: -70 }),
  };
  function placeCards() {
    const p = form.find((q) => q.id === 'phone');
    if (p) {
      cards.privacy.at.set(...fLocal(cardsY.phone));
      cards.privacy.set('Ask only what you need', 'Is every question needed?', '✂️');
    } else {
      cards.privacy.at.set(...fLocal(150));
      cards.privacy.set('Only what you need', 'No names, no phone numbers', '✅');
    }
    cards.box.set('Responses', responses ? `${responses} answers, counted for you` : 'Every answer is counted for you', '📮');
    cards.share.set('Share', shared.link || shared.qr ? `Shared by ${[shared.link && 'link', shared.qr && 'QR code'].filter(Boolean).join(' and ')}` : 'A link or a QR code', '🔗');
  }

  // ---------- Side panel ----------
  const buildG = ui.group('1 · Build: choose the question type');
  const nextBox = ui.element('<div class="mail-card" aria-live="polite"></div>', buildG).firstElementChild;
  const typeBtns = TYPE_IDS.map((t) => {
    const b = ui.button(`${TYPES[t].icon} ${TYPES[t].name}`, () => addQuestion(t), { group: buildG });
    b.dataset.t = t;
    return b;
  });
  const skipBtn = ui.button('Skip ▸', () => skip(), { group: buildG });

  const listG = ui.group('Your form');
  const list = ui.element('<ol style="list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:13.5px"></ol>', listG).firstElementChild;
  list.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b || busy) return;
    const i = Number(b.dataset.i);
    if (b.dataset.act === 'req') toggleRequired(i);
    if (b.dataset.act === 'del') del(i);
  });

  const shareG = ui.group('2 · Publish and share');
  const pubBtn = ui.button('🚀 Publish', () => publish(), { primary: true, group: shareG });
  const linkBtn = ui.button('🔗 Copy responder link', () => share('link'), { group: shareG });
  const qrBtn = ui.button('▦ Make a QR code', () => share('qr'), { group: shareG });

  const collectG = ui.group('3 · Collect and read the results');
  const collectBtn = ui.button(`📨 Let ${BATCH} classmates answer`, () => collect(), { primary: true, group: collectG });
  const chartPick = ui.element('<div class="btns-inline" style="margin-top:0"></div>', collectG).firstElementChild;
  chartPick.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-q]');
    if (!b) return;
    chartQ = b.dataset.q;
    drawChart();
    renderChartPick();
    renderRead();
    explainChart();
  });
  const readBox = ui.element('<div></div>', collectG).firstElementChild;
  readBox.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-ans]');
    if (b) answerRead(b.dataset.ans);
  });

  const chartable = () => form.filter((q) => ['mc', 'dropdown', 'check', 'scale'].includes(q.type) && ANSWERS[q.id]);
  function renderList() {
    list.innerHTML = form.map((q, i) => `<li style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:6px 8px;border-radius:10px;background:#fff;border:1.5px solid var(--line)">
      <span style="flex:1 1 150px"><b>${i + 1}.</b> ${esc(q.q)}<br><small style="color:var(--muted)">${TYPES[q.type].icon} ${TYPES[q.type].name}</small></span>
      <button type="button" class="lab-btn${q.required ? ' active' : ''}" data-act="req" data-i="${i}" aria-pressed="${q.required}" style="padding:4px 10px">* Required</button>
      <button type="button" class="lab-btn" data-act="del" data-i="${i}" aria-label="Delete question ${i + 1}" title="Delete this question" style="padding:4px 10px">🗑</button></li>`).join('') || '<li style="color:var(--muted)">No questions yet.</li>';
  }
  function renderNext() {
    const q = nextQ();
    nextBox.innerHTML = q
      ? `<span class="mission-label" style="color:var(--muted)">Next question</span><b style="font-size:15px">“${esc(q.q)}”</b><small style="display:block;color:var(--muted);margin-top:4px">${q.choices ? `Answers: ${q.choices.map(esc).join(', ')}` : q.number ? 'Answer: a number' : 'Answer: their own words'}. Which type fits best?</small>`
      : '<b>✅ Every question from the workbook is in your form.</b><small style="display:block;color:var(--muted)">Now publish and share it.</small>';
    typeBtns.forEach((b) => { b.setAttribute('aria-disabled', String(!q || busy)); b.style.opacity = !q || busy ? '0.5' : ''; });
  }
  function renderChartPick() {
    const qs = chartable();
    chartPick.innerHTML = responses && qs.length ? `<span class="lab-group-title" style="width:100%">Summary chart for</span>${qs.map((q) => `<button type="button" class="lab-btn${q.id === chartQ ? ' active' : ''}" data-q="${q.id}">${esc(shortQ(q.q))}</button>`).join('')}` : '';
  }
  function renderRead() {
    const q = form.find((x) => x.id === chartQ);
    if (!q || responses < BATCH || readDone) {
      readBox.innerHTML = readDone ? '<p class="check good">✅ You read the chart correctly.</p>' : '';
      return;
    }
    const data = counts(q, responses);
    readBox.innerHTML = `<div class="mail-card"><b>📖 Read the chart</b><p style="margin:6px 0">Which answer did the most classmates choose for “${esc(shortQ(q.q))}”?</p><div class="btns-inline">${data.map(([n]) => `<button type="button" class="lab-btn" data-ans="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>`;
  }
  function setBusy(on) {
    busy = on;
    for (const b of [pubBtn, linkBtn, qrBtn, collectBtn, skipBtn]) {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.5' : '';
    }
    renderNext();
  }
  const refresh = () => {
    renderForm();
    renderList();
    renderNext();
    renderChartPick();
    renderRead();
    drawBoxSign();
    checkBuild();
  };

  // ---------- Building ----------
  const inForm = (id) => form.some((q) => q.id === id);
  function nextQ() {
    const left = BANK.filter((q) => !inForm(q.id));
    if (!left.length) return null;
    return left[nextIdx % left.length];
  }
  function skip() {
    if (busy) return;
    nextIdx++;
    renderNext();
  }
  function whyNot(q, t) {
    const n = TYPES[t].name;
    if (q.one && t === 'check') return `<b>Checkboxes</b> let people tick <b>many</b> answers, but each pupil has just one answer here. Use a pick-ONE type.`;
    if (q.many && (t === 'mc' || t === 'dropdown')) return `<b>${n}</b> lets people pick only <b>one</b> answer, but pupils do several things after school. Which type lets them pick <b>many</b>?`;
    if (q.choices && !q.howMuch && (t === 'short' || t === 'para')) return `If everyone types, you get “jollof”, “Jollof rice”, “JOLLOF” and “jolof”: four spellings the computer counts as four different answers! <b>Choices are easier to count than typing.</b>`;
    if (q.howMuch) return `“How much?” on a line from 1 to 5 is exactly what a <b>Linear scale</b> is for: not at all … very much!`;
    if (q.number && t !== 'short') return `Minutes can be any number: 7, 25, 48… A list of choices or a scale cannot hold them all. Use <b>Short answer</b> (and later, response validation: a number from 1 to 100).`;
    if (q.words && t === 'short') return `Short answer is for a word or a number. An idea needs room to write: try <b>Paragraph</b>.`;
    if (q.words) return `There is no list of answers for an idea. People need to write it in their own words.`;
    if (t === 'date') return `<b>Date</b> is for days, like “Which day can you help?”. The form records the time of each answer by itself.`;
    if (t === 'scale') return `A <b>Linear scale</b> is for “how much”, from 1 to 5. This question has named answers.`;
    return `<b>${n}</b> does not fit this question well.`;
  }
  async function addQuestion(t) {
    const q = nextQ();
    if (busy || !q) return;
    if (!q.best.includes(t)) {
      ui.info(`Hmm, not ${TYPES[t].name}`, `<p>${whyNot(q, t)}</p><p>Try another type for “${esc(q.q)}”.</p>`);
      return;
    }
    const item = { id: q.id, q: q.q, type: t, required: false, choices: q.choices, number: q.number, flash: true };
    form.push(item);
    nextIdx = 0;
    if (!chartQ && ANSWERS[q.id] && t !== 'short') chartQ = q.id;
    refresh();
    const why = {
      dropdown: 'A drop-down saves space when the list is long, and everyone picks ONE.',
      mc: 'Multiple choice: everyone picks ONE answer, and the answers are easy to count.',
      check: 'Checkboxes: people can tick MANY answers.',
      short: 'Short answer: a word or a number. Good for minutes, with validation so nobody types “a lot”.',
      para: 'Paragraph: room for people\'s own words. Leave it optional (not Required).',
      scale: 'Linear scale: a number on a line, from “not at all” to “very much”.',
    }[t];
    ui.info(`✅ ${TYPES[t].name}: good choice`, `<p>${why}</p><p>Should everyone have to answer it? Press <b>* Required</b> in “Your form”.</p>`);
    stage.reveal();
    await stage.wait(1.2);
    item.flash = false;
    renderForm();
  }
  function toggleRequired(i) {
    const q = form[i];
    if (!q) return;
    q.required = !q.required;
    refresh();
    if (q.id === 'phone') return ui.info(q.required ? '* Required' : 'Not required', '<p>Required or not, ask yourself first: <b>does a survey about travel and food need this at all?</b></p>');
    ui.info(q.required ? `* Required: “${shortQ(q.q)}”` : 'Optional now', q.required ? '<p>A red star appears, and the form will not send until this is answered. Switch it on for the questions everyone must answer. Leave “extra” ones, like an idea, optional.</p>' : '<p>People can now skip this question.</p>');
  }
  function del(i) {
    const q = form[i];
    if (!q) return;
    form.splice(i, 1);
    if (chartQ === q.id) chartQ = chartable()[0]?.id ?? null;
    refresh();
    drawChart();
    if (q.id === 'phone') {
      ui.complete('privacy');
      ui.info('✂️ Deleted: you asked only what you need', '<p>A survey about travel and food does not need anyone\'s <b>name or phone number</b>. Every extra question is extra personal data you must protect. Now the description\'s promise is true: the answers really are <b>anonymous</b>.</p>');
    } else {
      ui.info('🗑 Question deleted', `<p>“${esc(q.q)}” is gone. You can add it again from <b>1 · Build</b>.</p>`);
    }
  }
  function checkBuild() {
    const bank = form.filter((q) => q.id !== 'phone');
    const types = new Set(bank.map((q) => q.type));
    const req = bank.filter((q) => q.required).length;
    if (bank.length >= 5 && types.size >= 4 && req >= 3) ui.complete('build');
  }

  // ---------- Publishing and sharing ----------
  function publish() {
    if (busy) return;
    if (!form.some((q) => q.id !== 'phone')) return ui.info('Nothing to publish yet', '<p>Add some questions first, in <b>1 · Build</b>.</p>');
    published = true;
    pubBtn.textContent = '✅ Published';
    refresh();
    ui.info('🚀 Published: accepting responses', `<p>Your form is live, but nobody knows about it yet. Share it: <b>Copy responder link</b> for the class chat, or make a <b>QR code</b> for a poster.</p>${inForm('phone') ? '<p>⚠️ Before anyone answers: read your questions again. Is there one you do not need?</p>' : ''}`);
  }
  async function share(kind) {
    if (busy) return;
    if (!published) return ui.info('Publish first', '<p>An unpublished form is not accepting responses. Press <b>Publish</b>, then share it.</p>');
    shared[kind] = true;
    stage.reveal();
    if (kind === 'link') {
      drawPhones();
      phones.forEach((p, i) => stage.tween((k) => (p.position.y = Math.sin(k * Math.PI) * 0.25), 0.4 + i * 0.1));
      ui.info('🔗 Link shared in the class chat', '<p>You pasted <b>forms.gle/OurClass21</b> into the class WhatsApp group. Everyone can answer on their own phone, whenever they are free.</p>');
    } else {
      drawQR();
      const s0 = qrG.scale.x;
      await stage.tween((k) => qrG.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * 0.12)), 0.5);
      ui.info('▦ QR code made', '<p>Print it on a poster: people answer by pointing a phone camera at it. (In Chrome: ⋮ menu → <b>Cast, save and share → Create QR code</b>.)</p>');
    }
    refresh();
  }

  // ---------- Collecting answers ----------
  async function collect() {
    if (busy) return;
    if (!published) return ui.info('“This form is not accepting responses”', '<p>That is what classmates would see! You have not published it yet. Press <b>Publish</b>.</p>');
    if (!shared.link && !shared.qr) return ui.info('Nobody has the link!', '<p>The form is published, but no one knows where it is. Share the <b>link</b> or a <b>QR code</b> first.</p>');
    if (responses >= BATCH * 2) return ui.info('That is everyone', '<p>All 40 classmates have answered. Read the Summary chart!</p>');
    setBusy(true);
    stage.reveal();
    if (!responses) chartQ = inForm('travel') && form.find((q) => q.id === 'travel').type !== 'short' ? 'travel' : chartQ ?? chartable()[0]?.id ?? null;
    const asked = inForm('phone');
    ui.info('📨 Answers are arriving…', '<p>Each slip is one person\'s answers. The form counts them and draws the chart for you, so nobody loses their place.</p>');
    const from = phones.map((p) => p.position.clone().add(new THREE.Vector3(0, 0.3, 0)));
    const slotW = boxG.localToWorld(new THREE.Vector3(0, BH + 0.4, 0));
    const jobs = [];
    for (let i = 0; i < BATCH; i++) {
      jobs.push((async () => {
        await stage.wait(i * 0.28);
        const s = new THREE.Mesh(slipGeo, slipMat);
        s.castShadow = true;
        const a = from[i % from.length];
        s.position.copy(a);
        scene.add(s);
        await stage.tween((k) => {
          s.position.lerpVectors(a, slotW, k);
          s.position.y += Math.sin(k * Math.PI) * 1.6;
          s.rotation.set(k * 3, k * 2, 0);
        }, 0.7);
        // Drop through the slot onto the pile.
        boxG.attach(s);
        const n = slips.length;
        const rest = new THREE.Vector3((Math.sin(n * 2.3) * 0.5), 0.05 + Math.floor(n / 6) * 0.03, Math.cos(n * 1.7) * 0.35);
        const start = s.position.clone();
        s.rotation.set(0, n * 0.9, 0);
        await stage.tween((k) => s.position.lerpVectors(start, rest, k * k), 0.3);
        slips.push(s);
        if (slips.length > 40) boxG.remove(slips.shift());
        responses++;
        drawBoxSign();
        if (responses % 2 === 0 || responses === BATCH) drawChart();
        const y0 = boxG.position.y;
        stage.tween((k) => (boxG.position.y = y0 + Math.sin(k * Math.PI) * 0.03), 0.15);
      })());
    }
    await Promise.all(jobs);
    boxG.position.y = 0;
    drawChart();
    drawPhones();
    setBusy(false);
    refresh();
    explainChart(asked);
  }
  function explainChart(asked) {
    const q = form.find((x) => x.id === chartQ);
    if (!q || !responses) return;
    const data = counts(q, responses);
    const total = data.reduce((a, b) => a + b[1], 0);
    const top = [...data].sort((a, b) => b[1] - a[1])[0];
    const usePie = q.type === 'mc' || q.type === 'dropdown';
    ui.info(`📊 Summary: ${responses} responses`, `<p>The <b>Responses → Summary</b> tab drew a <b>${usePie ? 'pie chart' : 'bar chart'}</b> for “${esc(q.q)}”. ${usePie ? 'A pie shows how big each answer is compared to the whole.' : 'People could tick several answers, so the bars can add up to more than the number of people.'}</p>${usePie ? `<p>The biggest slice is <b>${esc(top[0])}</b>: ${top[1]} of ${total}.</p>` : ''}<p class="small-tip">Next session you will analyse answers like these in a spreadsheet (Responses → Link to Sheets).</p>${asked ? '<p>⚠️ Your box now holds 20 names and phone numbers. Did a travel and food survey need them? Delete that question!</p>' : ''}`);
  }
  function answerRead(ans) {
    const q = form.find((x) => x.id === chartQ);
    if (!q) return;
    const data = counts(q, responses);
    const top = [...data].sort((a, b) => b[1] - a[1])[0];
    const total = data.reduce((a, b) => a + b[1], 0);
    if (ans === top[0]) {
      readDone = true;
      renderRead();
      ui.complete('collect');
      ui.info('✅ You read the chart', `<p><b>${esc(top[0])}</b> has the biggest ${q.type === 'mc' || q.type === 'dropdown' ? 'slice' : 'bar'}: ${top[1]} of ${responses} classmates. A finding says it with a number, like “${top[1] === responses / 2 ? 'Half' : top[1]} of us ${q.id === 'travel' ? 'walk to school' : `chose ${esc(top[0])}`}.”</p>`);
      stage.confetti();
    } else {
      const n = data.find((d) => d[0] === ans)?.[1] ?? 0;
      ui.info('Look again', `<p><b>${esc(ans)}</b> has ${n} of ${total}. Find the biggest slice or the tallest bar.</p>`);
    }
  }

  stage.onTick((dt, t) => {
    seal.rotation.y += dt;
    if (busy) slot.material.emissive?.setHex(Math.sin(t * 10) > 0 ? 0x332200 : 0);
  });

  drawPhones();
  drawQR();
  drawChart();
  refresh();
  ui.info('Survey Builder 🗳️', '<p>Someone started <b>Our Class Survey</b> for you. Read it carefully!</p><p>Add questions from the workbook: for each one, choose the <b>question type</b> that fits. The right type makes the form easy to answer and easy to count.</p>');
}

export const missions = [
  { id: 'build', text: 'Add 5 questions with the right types (4 types or more), and make 3 of them Required.', hint: 'Read each question and pick the type that fits. Then press "* Required" in Your form.' },
  { id: 'privacy', text: 'Find the question that asks for personal data you do not need, and delete it.', hint: 'Does a survey about travel and food need anyone\'s name or phone number?' },
  { id: 'collect', text: 'Publish and share your survey, collect 20 answers, then read the Summary chart.', hint: 'Publish, then copy the link or make a QR code. When the answers arrive, answer the chart question.' },
];

export const config = { camera: [3.5, 7.5, 13.5], target: [0.5, 2.0, 0.2], shadowSize: 10, frame: 0.9 };
