// Sessions 16–17 — Create & Format Documents: format a real-looking page on a 3D
// desk. Bold, size, alignment, bullets, numbering, heading styles, spell check
// (including the "Kwesi" dilemma) and print preview with a working printer.
import { THREE, COLORS, box, mat, rbox, cable, decal } from './runtime.js';

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
  buildDesk(scene);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  // The page is one plane on its own: clicks on it are turned into paragraphs via hit.uv.
  const page = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6 * (H / W)), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  page.position.set(-1.2, 5.3, -0.6);
  page.rotation.x = -0.12;
  page.castShadow = true;
  scene.add(page);
  scene.add(buildHolder(page));
  scene.add(buildLaptop(tex));

  const { printer, led, screen: lcd } = buildPrinter();
  printer.position.set(PRINTER.x, DESK_TOP, PRINTER.z);
  scene.add(printer);
  stage.clickable(printer, () => preview());
  scene.add(cable([[2.6, DESK_TOP + 0.04, 1.2], [2.95, DESK_TOP + 0.03, 0.6], [3.05, DESK_TOP + 0.04, -0.2], [3.7, DESK_TOP + 0.35, -0.62]], GREY, 0.035));

  stage.clickable(page, (o, e, hit) => {
    if (!hit?.uv) return;
    const y = (1 - hit.uv.y) * H;
    const i = bounds.findIndex((b) => y >= b[0] && y <= b[1]);
    if (i >= 0) pick(e.shiftKey ? toggle(i) : [i]);
  });
  const toggle = (i) => (selected.has(i) ? [...selected].filter((j) => j !== i) : [...selected, i]);
  function pick(list) {
    selected = new Set(list);
    render();
    ui.complete('select');
    describe();
  }

  // ---------- Callouts ----------
  // Cards sit beside the page so they never cover its text. Clicking one
  // selects that part of the page, runs the spell check or print preview.
  let squiggleAt = 0; // canvas y of the first red squiggle
  const PH = 4.6 * (H / W);
  const pageY = (y) => PH / 2 - (y / H) * PH; // canvas y → page local y
  const cards = {
    title: stage.callout(page, { icon: '🔠', title: 'Title', text: 'Big, bold and centred', dx: -100, dy: 12, onClick: () => pick([0]) }),
    heading: stage.callout(page, { icon: '🔖', title: 'Heading', text: 'Organises the page', dx: -100, dy: 22, onClick: () => pick([2, 6]) }),
    bullets: stage.callout(page, { icon: '•', title: 'Bulleted list', text: 'Items in any order', dx: 150, dy: 0, onClick: () => pick([3, 4, 5]) }),
    spell: stage.callout(page, { icon: '〰️', title: 'Red squiggle', text: 'Spell check (F7) finds it', dx: 150, dy: -20, onClick: () => spellCheck() }),
    printer: stage.callout(printer, { icon: '🖨', title: 'Printer', text: 'Print preview checks first', at: [0.2, 0.62, 1.02], dx: 20, dy: 70, onClick: () => preview() }),
  };
  // Pin each card to the edge of its paragraph, wherever formatting moved it.
  function placeCards() {
    const mid = (i) => pageY((bounds[i][0] + bounds[i][1]) / 2);
    cards.title.at?.set(-2.3, mid(0), 0);
    cards.heading.at?.set(-2.3, mid(2), 0);
    cards.bullets.at?.set(2.3, (mid(3) + mid(5)) / 2, 0);
    const left = SPELLING.filter((s) => !dictionary.has(s.word) && paras.some((p) => p.text.includes(s.word)));
    if (squiggleAt) cards.spell.at?.set(2.3, pageY(squiggleAt), 0);
    cards.spell.set(left.length ? 'Red squiggle' : 'Spelling checked', left.length ? 'Spell check (F7) finds it' : 'No red squiggles left', left.length ? '〰️' : '✅');
  }

  // ---------- Rendering the page ----------
  function render() {
    const g = canvas.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, W, H);
    const M = 80;
    let y = 90;
    let num = 0;
    bounds = [];
    squiggleAt = 0;
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
          squiggleAt ||= by;
        }
      });
      bounds.push([top - px * 0.6, top + lines.length * lh]);
      y += lines.length * lh + (p.role === 'heading' || p.role === 'title' ? px * 0.55 : px * 0.5);
    });
    tex.needsUpdate = true;
    placeCards();
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
    // The printed copy feeds out of the front slot onto the output tray.
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(SHEET, SHEET * (H / W)), new THREE.MeshStandardMaterial({ map: tex.clone(), side: THREE.DoubleSide, roughness: 0.9 }));
    sheet.material.map.needsUpdate = true;
    sheet.rotation.x = -Math.PI / 2;
    sheet.castShadow = true;
    scene.add(sheet);
    const half = (SHEET * (H / W)) / 2;
    const front = PRINTER.z + PRINTER.d / 2;
    const from = new THREE.Vector3(PRINTER.x, DESK_TOP + 0.6, front - half - 0.05);
    const to = new THREE.Vector3(PRINTER.x, DESK_TOP + 0.4, front + half - 0.3);
    led.material.emissive.setHex(COLORS.gold);
    lcd('Printing…');
    await stage.tween((k) => {
      sheet.position.lerpVectors(from, to, k);
      sheet.rotation.x = -Math.PI / 2 + Math.sin(k * Math.PI) * 0.06; // a little curl as it slides out
      printer.position.x = PRINTER.x + Math.sin(k * 90) * 0.006; // the printer hums
    }, 1.8, (k) => k);
    printer.position.x = PRINTER.x;
    led.material.emissive.setHex(COLORS.green);
    lcd('Ready');
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

export const config = { camera: [5, 6.5, 10], target: [0.5, 4.6, 0], frame: 1.08, shadowSize: 9, minDistance: 5 };

// ---------- Desk models ----------
const DESK_TOP = 1.75;
const PRINTER = { x: 4.55, z: 0.3, d: 2.0 };
const SHEET = 1.4; // width of the printed copy
const GREY = 0x3a3f45;

function buildDesk(scene) {
  const top = rbox(12.6, 0.3, 6, 0xc8a27a, 0.08);
  top.position.y = DESK_TOP - 0.15;
  scene.add(top);
  for (const [x, z] of [[-5.9, -2.6], [5.9, -2.6], [-5.9, 2.6], [5.9, 2.6]]) {
    const leg = box(0.28, DESK_TOP - 0.3, 0.28, 0x8d6e4c);
    leg.position.set(x, (DESK_TOP - 0.3) / 2, z);
    scene.add(leg);
  }
  const deskMat = rbox(6.2, 0.03, 3.4, COLORS.blue, 0.015);
  deskMat.position.set(-1.1, DESK_TOP + 0.015, 0.3);
  scene.add(deskMat);

  // A pencil pot, for scale.
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.7, 20), mat(COLORS.red));
  pot.position.set(-5.0, DESK_TOP + 0.35, 1.5);
  pot.castShadow = true;
  scene.add(pot);
  [[-0.08, 0.05, 0.12], [0.1, -0.06, -0.1], [0, 0.1, 0.02]].forEach(([dx, dz, tilt], i) => {
    const pencil = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), mat(i === 1 ? COLORS.purple : COLORS.gold));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), mat(0xe8c9a0));
    tip.position.y = 0.56;
    pencil.add(stick, tip);
    pencil.position.set(-5.0 + dx, DESK_TOP + 0.85, 1.5 + dz);
    pencil.rotation.set(tilt, 0, -tilt);
    scene.add(pencil);
  });
}

// A hardboard copy holder: the page is clipped to it and it leans on a back strut.
function buildHolder(page) {
  const g = new THREE.Group();
  g.position.copy(page.position);
  g.rotation.copy(page.rotation);
  const board = rbox(5.0, 6.9, 0.08, 0x9c6b3e, 0.03);
  board.position.set(0, -0.05, -0.06);
  const lip = rbox(5.1, 0.22, 0.5, GREY, 0.05);
  lip.position.set(0, -3.42, 0.12);
  const clip = rbox(1.5, 0.34, 0.12, 0xb8bcc4, 0.04, { metalness: 0.6, roughness: 0.3 });
  clip.position.set(0, 3.2, 0.05);
  const lever = rbox(1.1, 0.1, 0.34, 0xb8bcc4, 0.04, { metalness: 0.6, roughness: 0.3 });
  lever.position.set(0, 3.42, 0.14);
  lever.rotation.x = 0.5;
  g.add(board, lip, clip, lever);
  // The strut runs from the back of the board down to the desk.
  g.add(cable([[0, 1.0, -0.12], [0, -3.36, -1.82]], GREY, 0.06));
  return g;
}

// The laptop the page is typed on; its screen shows the same page, live.
function buildLaptop(pageTex) {
  const g = new THREE.Group();
  const base = rbox(2.2, 0.09, 1.5, 0x8d939b, 0.04);
  base.position.y = 0.045;
  const keys = decal(2.0, 1.3, (c, w, h) => {
    c.fillStyle = '#2b2730';
    for (let r = 0; r < 5; r++)
      for (let k = 0; k < 12; k++) c.fillRect(14 + k * ((w - 28) / 12), 12 + r * 34, (w - 28) / 12 - 5, 28);
    c.fillRect(w * 0.3, 12 + 5 * 34, w * 0.4, 26); // space bar
    c.strokeStyle = '#5c5864';
    c.lineWidth = 3;
    c.strokeRect(w * 0.36, h * 0.74, w * 0.28, h * 0.22); // touchpad
  });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(0, 0.092, 0.05);
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.09, -0.72);
  hinge.rotation.x = -0.28;
  const lid = rbox(2.2, 1.45, 0.06, 0x8d939b, 0.03);
  lid.position.y = 0.725;
  const screen = decal(2.04, 1.3, drawWordProcessor, { px: 512, transparent: false });
  screen.position.set(0, 0.725, 0.032);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * (W / H), 0.8), new THREE.MeshBasicMaterial({ map: pageTex, toneMapped: false }));
  sheet.userData.noInk = true;
  sheet.position.set(0, 0.725 - 0.1625, 0.035);
  hinge.add(lid, screen, sheet);
  g.add(base, keys, hinge);
  g.position.set(1.5, DESK_TOP + 0.03, 1.95);
  g.rotation.y = -0.38;
  g.scale.setScalar(1.2);
  return g;
}

// A word-processor window: title bar, ribbon tabs, Home tab buttons, status bar.
function drawWordProcessor(g, w, h) {
  g.fillStyle = '#D9D4DE';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#24182E';
  g.fillRect(0, 0, w, 40);
  g.fillStyle = '#fff';
  g.font = '22px Rubik, Arial, sans-serif';
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText('A Greener School - Document', w / 2, 21);
  g.textAlign = 'left';
  g.fillStyle = '#F4F0F6';
  g.fillRect(0, 40, w, 112);
  g.fillStyle = '#24182E';
  ['File', 'Home', 'Insert', 'Layout', 'Review'].forEach((t, i) => g.fillText(t, 18 + i * 92, 60));
  g.fillStyle = '#CA1F3F';
  g.fillRect(104, 74, 66, 4);
  // Home tab: font box, B I U, alignment, bullets, styles.
  g.strokeStyle = '#8A7A98';
  g.lineWidth = 2;
  g.fillStyle = '#fff';
  g.fillRect(16, 90, 150, 28);
  g.strokeRect(16, 90, 150, 28);
  g.fillRect(172, 90, 46, 28);
  g.strokeRect(172, 90, 46, 28);
  g.fillStyle = '#24182E';
  g.font = '18px Arial, sans-serif';
  g.fillText('Calibri  ▾', 24, 105);
  g.fillText('12', 182, 105);
  [['B', 'bold 20px Arial'], ['I', 'italic 20px Georgia'], ['U', '20px Arial']].forEach(([t, f], i) => {
    g.font = f;
    g.fillText(t, 236 + i * 32, 105);
  });
  g.fillRect(236 + 64, 116, 14, 2);
  for (let a = 0; a < 4; a++)
    for (let l = 0; l < 4; l++) {
      const lw = a === 3 || l % 2 === 0 ? 22 : 14;
      const x = 350 + a * 36 + (a === 1 ? (22 - lw) / 2 : a === 2 ? 22 - lw : 0);
      g.fillRect(x, 94 + l * 6, lw, 3);
    }
  for (let l = 0; l < 3; l++) {
    g.beginPath();
    g.arc(508, 97 + l * 9, 3, 0, Math.PI * 2);
    g.fill();
    g.fillRect(516, 96 + l * 9, 16, 3);
  }
  ['Title', 'Heading', 'Normal'].forEach((t, i) => {
    g.fillStyle = '#fff';
    g.fillRect(552 + i * 82, 86, 76, 38);
    g.strokeRect(552 + i * 82, 86, 76, 38);
    g.fillStyle = '#24182E';
    g.font = `${i === 0 ? 'bold 20px' : i === 1 ? 'bold 16px' : '15px'} Arial, sans-serif`;
    g.fillText(t, 560 + i * 82, 106);
  });
  g.fillStyle = '#E8E4EC';
  g.fillRect(0, 152, w, 2);
  g.fillStyle = '#24182E';
  g.fillRect(0, h - 24, w, 24);
  g.fillStyle = '#fff';
  g.font = '15px Arial, sans-serif';
  g.fillText('Page 1 of 1      English (Ghana)', 14, h - 12);
}

// An inkjet-style printer: paper tray at the back, slot and output tray at the front.
function buildPrinter() {
  const g = new THREE.Group();
  const body = rbox(2.6, 0.85, PRINTER.d, 0xe9ecef, 0.1);
  body.position.y = 0.425;
  const lid = rbox(2.6, 0.16, PRINTER.d, GREY, 0.06);
  lid.position.y = 0.92;
  const slot = box(1.9, 0.09, 0.06, 0x15121a);
  slot.position.set(0, 0.62, PRINTER.d / 2);
  const outTray = rbox(1.8, 0.05, 1.6, GREY, 0.02);
  outTray.position.set(0, 0.36, PRINTER.d / 2 + 0.78);
  // Paper waiting in the tilted input tray.
  const feed = new THREE.Group();
  feed.position.set(0, 0.95, -PRINTER.d / 2 + 0.12);
  feed.rotation.x = -0.45;
  const backTray = rbox(2.0, 1.1, 0.05, GREY, 0.02);
  backTray.position.y = 0.5;
  const paper = box(1.7, 0.85, 0.05, 0xffffff);
  paper.position.set(0, 0.48, 0.05);
  feed.add(backTray, paper);
  // Controls: a power button, the status LED and a small display.
  const power = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), mat(GREY));
  power.rotation.x = Math.PI / 2;
  power.position.set(0.82, 0.78, PRINTER.d / 2 + 0.01);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), mat(COLORS.green, { emissive: COLORS.green }));
  led.position.set(1.06, 0.78, PRINTER.d / 2 + 0.01);
  let msg = 'Ready';
  const draw = (c, w, h) => {
    c.fillStyle = '#3a3f45';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#BFE6C9';
    c.fillRect(10, 10, w * 0.56, h - 20);
    c.fillStyle = '#1d3b26';
    c.font = 'bold 40px Arial, sans-serif';
    c.textBaseline = 'middle';
    c.fillText(msg, 22, h / 2);
    [['#2EC4B6', '▶'], ['#CA1F3F', '✕']].forEach(([col, t], i) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(w * 0.7 + i * w * 0.16, h / 2, h * 0.28, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff';
      c.font = 'bold 30px Arial';
      c.textAlign = 'center';
      c.fillText(t, w * 0.7 + i * w * 0.16, h / 2 + 2);
      c.textAlign = 'left';
    });
  };
  const panel = decal(1.2, 0.4, draw, { px: 128, transparent: false });
  panel.rotation.x = -Math.PI / 2;
  panel.position.set(0.5, 1.002, 0.62);
  const vents = decal(1.5, 0.4, (c, w, h) => {
    c.fillStyle = '#9aa1a9';
    for (let i = 0; i < 9; i++) c.fillRect(8 + i * (w / 9), 8, w / 9 - 14, h - 16);
  }, { px: 64 });
  vents.rotation.y = Math.PI / 2;
  vents.position.set(1.302, 0.45, -0.2);
  g.add(body, lid, slot, outTray, feed, power, led, panel, vents);
  const screen = (text) => {
    msg = text;
    draw(panel.material.map.image.getContext('2d'), panel.material.map.image.width, panel.material.map.image.height);
    panel.material.map.needsUpdate = true;
  };
  return { printer: g, led, screen };
}
