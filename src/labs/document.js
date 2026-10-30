// Sessions 8–9 — Create & Format Documents: format a real-looking page on a 3D
// desk. Bold, size, alignment, bullets, numbering, heading styles, spell check
// (including the "Kwesi" dilemma) and print preview with a working printer.
import { THREE, COLORS, box, mat } from './runtime.js';

const W = 900;
const H = 1272; // A4 proportions
const plain = () => ({ bold: false, italic: false, underline: false, size: 12, align: 'left', list: null, role: 'body' });
const START = () => [
  { text: 'a greener school', ...plain() },
  { text: 'Our school compound has too much litter. Plastic sachets block the gutters after rain, and we can recyle many of them instead of burning them.', ...plain() },
  { text: 'Three actions', ...plain() },
  { text: 'Put a bin beside every classroom block', ...plain() },
  { text: 'Pick up litter for ten minutes every Friday', ...plain() },
  { text: 'Bring a reusable water bottle', ...plain() },
  { text: 'How to sort litter', ...plain() },
  { text: 'Collect the litter in one place', ...plain() },
  { text: 'Separate plastic from paper', ...plain() },
  { text: 'Take the plastic to the recycling point', ...plain() },
  { text: 'Written by Kwesi Mensah, JHS 1', ...plain(), italic: false },
];
const SPELLING = [
  { word: 'recyle', fix: 'recycle', note: 'A real spelling mistake. Choose <b>Change</b>.' },
  { word: 'Kwesi', fix: null, note: 'Not a mistake! The computer\'s dictionary simply doesn\'t know many Ghanaian names. Choose <b>Add to dictionary</b>, never "Change" to a wrong English word.' },
];

export default function documentLab(stage, ui, host) {
  const { scene } = stage;
  let paras = START();
  let selected = new Set([0]);
  let dictionary = new Set();
  let bounds = [];

  // ---------- 3D desk, page and printer ----------
  const desk = box(12, 0.3, 6, 0xc8a27a);
  desk.position.y = 1.6;
  scene.add(desk);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const page = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6 * (H / W)), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  page.position.set(-1.2, 5.3, -0.6);
  page.rotation.x = -0.12;
  page.castShadow = true;
  scene.add(page);
  const stand = box(4.9, 0.25, 0.6, 0x495057);
  stand.position.set(-1.2, 1.85, -0.4);
  scene.add(stand);

  const printer = new THREE.Group();
  const pBody = box(2.4, 1.1, 1.8, 0xe9ecef);
  pBody.position.y = 0.55;
  const pTop = box(2.4, 0.15, 1.8, 0x343a40);
  pTop.position.y = 1.15;
  const slot = box(1.8, 0.06, 0.2, 0x111111);
  slot.position.set(0, 0.75, 0.9);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06), mat(COLORS.green, { emissive: COLORS.green }));
  led.position.set(0.95, 1.0, 0.91);
  printer.add(pBody, pTop, slot, led);
  printer.position.set(4.2, 1.75, 0.5);
  scene.add(printer);
  stage.clickable(printer, () => preview());

  stage.clickable(page, (o, e, hit) => {
    if (!hit?.uv) return;
    const y = (1 - hit.uv.y) * H;
    const i = bounds.findIndex((b) => y >= b[0] && y <= b[1]);
    if (i < 0) return;
    if (e.shiftKey) selected.has(i) ? selected.delete(i) : selected.add(i);
    else selected = new Set([i]);
    render();
    ui.complete('select');
    describe();
  });

  // ---------- Rendering the page ----------
  function render() {
    const g = canvas.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    const M = 80;
    let y = 90;
    let num = 0;
    bounds = [];
    paras.forEach((p, i) => {
      const px = p.size * 3;
      const indent = p.list ? 50 : 0;
      g.font = `${p.italic ? 'italic ' : ''}${p.bold ? 'bold ' : ''}${px}px Calibri, Carlito, "Segoe UI", Arial, sans-serif`;
      g.fillStyle = p.role === 'heading' ? '#24182E' : '#3B3343';
      g.textBaseline = 'alphabetic';
      const maxW = W - 2 * M - indent;
      const lines = wrap(g, p.text, maxW);
      const lh = px * 1.35;
      const top = y - px * 0.4;
      if (selected.has(i)) {
        g.fillStyle = 'rgba(67,97,238,0.16)';
        g.fillRect(M - 14, top - px * 0.6, W - 2 * M + 28, lines.length * lh + px * 0.35);
        g.fillStyle = p.role === 'heading' ? '#24182E' : '#3B3343';
      }
      num = p.list === 'number' ? num + 1 : 0;
      lines.forEach((line, li) => {
        const lw = g.measureText(line).width;
        let x = M + indent;
        if (p.align === 'center') x = M + indent + (maxW - lw) / 2;
        if (p.align === 'right') x = W - M - lw;
        const by = y + li * lh + px * 0.35;
        if (li === 0 && p.list) g.fillText(p.list === 'bullet' ? '•' : `${num}.`, M + 8, by);
        if (p.align === 'justify' && li < lines.length - 1) justify(g, line, M + indent, by, maxW);
        else g.fillText(line, x, by);
        if (p.underline) g.fillRect(x, by + 4, lw, Math.max(2, px / 14));
        // Red squiggles under words the spell checker doesn't know.
        for (const s of SPELLING) {
          if (dictionary.has(s.word)) continue;
          const at = line.indexOf(s.word);
          if (at < 0) continue;
          const sx = x + g.measureText(line.slice(0, at)).width;
          squiggle(g, sx, by + 6, g.measureText(s.word).width);
        }
      });
      bounds.push([top - px * 0.6, top + lines.length * lh]);
      y += lines.length * lh + (p.role === 'heading' || p.role === 'title' ? px * 0.55 : px * 0.5);
    });
    tex.needsUpdate = true;
    checkMissions();
  }

  function wrap(g, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (g.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    lines.push(line);
    return lines;
  }
  function justify(g, line, x, y, maxW) {
    const words = line.split(' ');
    const gap = (maxW - words.reduce((s, w) => s + g.measureText(w).width, 0)) / Math.max(1, words.length - 1);
    for (const w of words) {
      g.fillText(w, x, y);
      x += g.measureText(w).width + gap;
    }
  }
  function squiggle(g, x, y, w) {
    g.save();
    g.strokeStyle = '#E63946';
    g.lineWidth = 2.5;
    g.beginPath();
    for (let i = 0; i <= w; i += 6) g.lineTo(x + i, y + (i / 6) % 2 * 4);
    g.stroke();
    g.restore();
  }

  function describe() {
    const p = paras[[...selected][0]];
    if (!p) return;
    ui.info(selected.size > 1 ? `${selected.size} paragraphs selected` : 'Selected paragraph', `<p>“${p.text.slice(0, 60)}${p.text.length > 60 ? '…' : ''}”</p><p>Font size <b>${p.size}</b> · ${p.bold ? '<b>Bold</b> · ' : ''}${p.italic ? '<i>Italic</i> · ' : ''}${p.underline ? '<u>Underline</u> · ' : ''}aligned <b>${p.align}</b>${p.list ? ` · ${p.list === 'bullet' ? 'bulleted' : 'numbered'} list` : ''}</p><p class="small-tip">Tip: hold <b>Shift</b> and click to select more than one paragraph.</p>`);
  }

  // ---------- Ribbon ----------
  const each = (fn) => {
    selected.forEach((i) => fn(paras[i], i));
    render();
    describe();
  };
  const ribbon = ui.group('Ribbon · Home tab');
  ui.button('B', () => each((p) => (p.bold = !allSel('bold'))), { group: ribbon }).classList.add('rb-b');
  ui.button('I', () => each((p) => (p.italic = !allSel('italic'))), { group: ribbon }).classList.add('rb-i');
  ui.button('U', () => each((p) => (p.underline = !allSel('underline'))), { group: ribbon }).classList.add('rb-u');
  ui.button('A−', () => each((p) => (p.size = Math.max(8, p.size - 2))), { group: ribbon });
  ui.button('A+', () => each((p) => (p.size = Math.min(36, p.size + 2))), { group: ribbon });
  const allSel = (k) => [...selected].every((i) => paras[i][k]);

  const align = ui.group('Alignment');
  for (const [a, label] of [['left', '⬅ Left'], ['center', '↔ Centre'], ['right', 'Right ➡'], ['justify', '☰ Justify']])
    ui.button(label, () => each((p) => (p.align = a)), { group: align });

  const lists = ui.group('Lists & styles');
  ui.button('• Bullets', () => each((p) => (p.list = p.list === 'bullet' ? null : 'bullet')), { group: lists });
  ui.button('1. Numbering', () => each((p) => (p.list = p.list === 'number' ? null : 'number')), { group: lists });
  ui.button('Title style', () => each((p) => Object.assign(p, { role: 'title', size: 26, bold: true, list: null })), { group: lists });
  ui.button('Heading style', () => each((p) => Object.assign(p, { role: 'heading', size: 16, bold: true, list: null })), { group: lists });
  ui.button('Normal style', () => each((p) => Object.assign(p, plain(), { text: p.text })), { group: lists });

  const tools = ui.group('Review & print');
  ui.button('🔤 Spell check (F7)', () => spellCheck(), { group: tools });
  ui.button('Aa Capitalise title', () => {
    paras[0].text = paras[0].text.replace(/\b\w/g, (c) => c.toUpperCase());
    render();
    ui.info('Capitalised', '<p>Titles start each important word with a capital letter: <b>A Greener School</b>.</p>');
  }, { group: tools });
  ui.button('🖨 Print preview', () => preview(), { primary: true, group: tools });
  ui.button('↺ Start again', () => {
    paras = START();
    dictionary = new Set();
    selected = new Set([0]);
    render();
  }, { group: tools });

  // Real shortcuts while the lab has focus.
  host.tabIndex = 0;
  host.addEventListener('pointerdown', (e) => !e.target.closest('input, button') && host.focus({ preventScroll: true }));
  host.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.target.closest('input')) return;
    const k = e.key.toLowerCase();
    const map = { b: 'bold', i: 'italic', u: 'underline' };
    if (map[k]) {
      e.preventDefault();
      each((p) => (p[map[k]] = !allSel(map[k])));
    } else if (k === 'e') {
      e.preventDefault();
      each((p) => (p.align = 'center'));
    } else if (k === 'l') {
      e.preventDefault();
      each((p) => (p.align = 'left'));
    }
  });

  // ---------- Spell check ----------
  function spellCheck() {
    const issue = SPELLING.find((s) => !dictionary.has(s.word) && paras.some((p) => p.text.includes(s.word)));
    if (!issue) {
      ui.complete('spell');
      return ui.info('✅ Spelling and grammar check complete', '<p>No more red squiggles. Remember: the computer can\'t catch everything. Read your work aloud too!</p>');
    }
    ui.info(`Not in dictionary: “${issue.word}”`, `<p>${issue.note}</p><div class="btns-inline">${issue.fix ? `<button type="button" class="lab-btn primary" data-sp="change">Change to “${issue.fix}”</button>` : ''}<button type="button" class="lab-btn" data-sp="add">Add to dictionary</button><button type="button" class="lab-btn" data-sp="ignore">Ignore</button></div>`);
    host.querySelector('.lab-info').onclick = (e) => {
      const act = e.target.dataset.sp;
      if (!act) return;
      if (act === 'change') {
        if (!issue.fix) return;
        paras.forEach((p) => (p.text = p.text.replace(issue.word, issue.fix)));
      } else if (act === 'add' && issue.fix) {
        ui.info('Hmm, are you sure?', `<p>“${issue.word}” really is misspelled. Adding it to the dictionary means the computer will never warn you again. Try <b>Change</b> instead.</p>`);
        return;
      } else dictionary.add(issue.word);
      render();
      spellCheck();
    };
  }

  // ---------- Print preview ----------
  async function preview() {
    const problems = [];
    if (SPELLING.some((s) => !dictionary.has(s.word) && paras.some((p) => p.text.includes(s.word)))) problems.push('There are still red squiggles. Run the spell check.');
    if (!paras[0].bold || paras[0].size < 20) problems.push('The title is not big and bold yet.');
    if (paras[0].align !== 'center') problems.push('The title is not centred.');
    if (problems.length) return ui.info('🔍 Print preview: not ready yet', `<ul>${problems.map((p) => `<li>${p}</li>`).join('')}</ul><p>Check spelling, names and layout <b>before</b> you print. Paper and ink cost money!</p>`);
    ui.complete('print');
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6 * (H / W)), new THREE.MeshStandardMaterial({ map: tex.clone(), side: THREE.DoubleSide }));
    sheet.material.map.needsUpdate = true;
    sheet.rotation.x = -Math.PI / 2;
    scene.add(sheet);
    led.material.emissive.setHex(COLORS.gold);
    const from = new THREE.Vector3(4.2, 2.55, 0.6);
    const to = new THREE.Vector3(4.2, 1.8, 2.3);
    await stage.tween((k) => sheet.position.lerpVectors(from, to, k), 1.6);
    led.material.emissive.setHex(COLORS.green);
    ui.info('🖨 Printed!', '<p>Your page came out of the printer. Before printing for real, always ask: <b>do I really need a paper copy?</b></p>');
    setTimeout(() => scene.remove(sheet), 6000);
  }

  function checkMissions() {
    const t = paras[0];
    if (t.bold && t.size >= 20) ui.complete('title');
    if (t.align === 'center') ui.complete('centre');
    if ([3, 4, 5].every((i) => paras[i].list === 'bullet')) ui.complete('bullets');
    if ([7, 8, 9].every((i) => paras[i].list === 'number')) ui.complete('numbers');
    if (paras[2].role === 'heading' && paras[6].role === 'heading') ui.complete('headings');
  }

  render();
  ui.info('Your document', '<p>This page needs formatting! <b>Click a paragraph</b> on the page to select it, then use the ribbon buttons. You can also use real shortcuts: <b>Ctrl + B</b> bold, <b>Ctrl + I</b> italic, <b>Ctrl + U</b> underline, <b>Ctrl + E</b> centre.</p>');
}

export const missions = [
  { id: 'select', text: 'Click the title "a greener school" on the page to select it.', hint: 'Selected text turns light blue. You must select before you format!' },
  { id: 'title', text: 'Make the title bold and bigger (size 20 or more).', hint: 'Use B and A+, or the "Title style" button.' },
  { id: 'centre', text: 'Centre the title.', hint: 'Press "↔ Centre" or Ctrl + E.' },
  { id: 'bullets', text: 'Turn the three actions into a bulleted list.', hint: 'Click the first action, hold Shift and click the other two, then press "• Bullets". Bullets are for items in any order.' },
  { id: 'numbers', text: 'Turn the three sorting steps into a numbered list.', hint: 'Numbers are for steps that must happen in order.' },
  { id: 'headings', text: 'Give "Three actions" and "How to sort litter" the Heading style.', hint: 'Headings show the reader how the page is organised.' },
  { id: 'spell', text: 'Run the spell check and fix every red squiggle.', hint: 'One is a real mistake. One is a Ghanaian name the computer doesn\'t know!' },
  { id: 'print', text: 'Open Print preview and print your page.', hint: 'Print preview checks your work first.' },
];

export const config = { camera: [5, 6.5, 10], target: [0.5, 4.4, 0], shadowSize: 9, minDistance: 5 };
