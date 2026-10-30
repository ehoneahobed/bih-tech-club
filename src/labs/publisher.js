// Session 18 — Documents 3: Real Documents. Page Layout Studio: an A4 page on a
// drafting board on a desk. Pupils insert the Open Day "Order of Events" table
// (add a row with Tab, make a header row), insert the club logo (a side handle
// squashes it, a corner handle keeps its shape), wrap text, set the margins and
// orientation, and add a header and a page number, until the poster fits on one page.
import { THREE, COLORS, mat, rbox, box, cable, decal } from './runtime.js';

const CM = 40; // canvas pixels per centimetre: A4 portrait is 840 × 1188
const A4 = { w: 21, h: 29.7 };
const MARGINS = { normal: 2.54, narrow: 1.27 };
const LOGO_A = 4 / 3; // the logo's real shape (width ÷ height)
const PAGE_H = 4.9; // world height of the page in portrait
const WPC = PAGE_H / A4.h; // world units per centimetre
const FONT = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';
const HEAD = ['Time', 'Item', 'By'];
const EVENTS = [
  ['10:00 am', 'Arrival of guests', 'Ushers'],
  ['10:15 am', 'National Anthem', 'All'],
  ['10:20 am', 'Welcome address', 'Club President'],
  ['10:30 am', 'Typing race', 'JHS 1'],
  ['10:45 am', 'Poster show', 'JHS 2'],
  ['11:00 am', 'Robot demo', 'JHS 3'],
  ['11:15 am', 'Vote of thanks', 'Club Secretary'],
  ['11:20 am', 'Closing prayer', 'Chaplain'],
];
const BODY = 'Come and see what the Bozoma Innovation Hub Tech Club has learned this term: fast typing, real documents, spreadsheets and charts, and a robot that sorts rubbish. Parents, teachers and pupils are all welcome. Entry is free, and visitors can join a typing race too!';

const fresh = () => ({ orient: 'portrait', margins: 'normal', header: false, pageNum: false, table: null, pic: null, sel: null });

export default function publisherLab(stage, ui, host) {
  const { scene, camera, renderer } = stage;
  let st = fresh();
  let history = [];
  let busy = false;
  let L = {}; // where things were drawn on the page, in canvas pixels
  let marginAnim = null; // margin (cm) while it animates

  // ---------- Desk, drafting board, page ----------
  const DESK = 1.6;
  buildDesk(scene, DESK);
  const board = new THREE.Group();
  board.position.set(0, DESK, -0.9);
  board.rotation.x = -0.16; // leaning back on its struts
  scene.add(board);
  const mat0 = rbox(6.2, 5.75, 0.12, 0x2f7d5d, 0.05);
  mat0.position.set(0, 2.875, 0);
  board.add(mat0);
  // Cutting-mat grid, 1 cm squares at the page's scale.
  const grid = decal(6.0, 5.55, (g, W, H) => {
    g.strokeStyle = 'rgba(255,255,255,0.22)';
    g.lineWidth = 1.5;
    const step = W / (6.0 / WPC);
    for (let x = 0; x <= W; x += step) g.strokeRect(x, 0, 0, H);
    for (let y = 0; y <= H; y += step) g.strokeRect(0, y, W, 0);
    g.strokeStyle = 'rgba(255,190,0,0.55)';
    g.lineWidth = 3;
    for (let x = 0; x <= W; x += step * 5) g.strokeRect(x, 0, 0, H);
    for (let y = 0; y <= H; y += step * 5) g.strokeRect(0, y, W, 0);
  }, { px: 512 });
  grid.position.set(0, 2.875, 0.061);
  board.add(grid);
  const ledge = rbox(6.4, 0.2, 0.45, 0xc8a27a, 0.05);
  ledge.position.set(0, 0.1, 0.2);
  board.add(ledge);
  // Struts behind, down to the desk.
  for (const x of [-2.4, 2.4]) board.add(cable([[x, 4.4, -0.08], [x, 0.0, -1.35]], 0x8d6e4c, 0.07));
  const sizeTag = decal(2.6, 0.18, () => {}, { px: 64 });
  sizeTag.position.set(1.7, 0.1, 0.43);
  board.add(sizeTag);
  function drawSizeTag() {
    const c = sizeTag.material.map.image;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#24182E';
    g.font = `bold ${c.height * 0.6}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    g.fillText(`A4 · 21 × 29.7 cm · ${st.orient === 'portrait' ? 'Portrait' : 'Landscape'}`, c.width - 6, c.height * 0.55);
    sizeTag.material.map.needsUpdate = true;
  }

  const cv = document.createElement('canvas');
  let tex = null;
  const page = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  page.castShadow = true;
  const sheet = new THREE.Group(); // turns on its side when the orientation changes
  sheet.add(page);
  page.position.z = 0.075;
  board.add(sheet);
  // A thin card behind the page, so it reads as paper with a little thickness.
  const back = rbox(1, 1, 0.02, 0xe9e5ec, 0.005);
  back.position.z = 0.062;
  sheet.add(back);

  // The ruler above the page shows the margins as grey ends, like Word's ruler.
  const ruler = decal(1, 0.28, () => {}, { px: 64, transparent: false });
  ruler.userData.noInk = true;
  board.add(ruler);

  const dims = (o = st.orient) => (o === 'portrait' ? { w: A4.w * WPC, h: PAGE_H } : { w: PAGE_H, h: A4.w * WPC });
  function placeSheet(o = st.orient) {
    const d = dims(o);
    page.scale.set(d.w, d.h, 1);
    back.scale.set(d.w + 0.04, d.h + 0.04, 1);
    sheet.position.set(0, 0.22 + d.h / 2, 0);
    sheet.rotation.z = 0;
    ruler.scale.set(d.w / 1, 1, 1);
    ruler.position.set(0, 0.22 + d.h + 0.22, 0.075);
  }
  function drawRuler() {
    const c = ruler.material.map.image;
    const g = c.getContext('2d');
    const W = c.width;
    const H = c.height;
    const cmW = st.orient === 'portrait' ? A4.w : A4.h;
    const m = marginAnim ?? MARGINS[st.margins];
    const px = W / cmW;
    g.fillStyle = '#fffdf6';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#c9c1d1';
    g.fillRect(0, 0, m * px, H);
    g.fillRect(W - m * px, 0, m * px, H);
    g.fillStyle = '#24182E';
    g.font = `${H * 0.34}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (let i = 0; i <= cmW; i++) {
      const x = i * px;
      g.fillRect(x - 1, 0, 2, i % 5 ? H * 0.25 : H * 0.42);
      if (i % 5 === 0 && i > 0 && i < cmW) g.fillText(String(i), x, H * 0.5);
    }
    g.strokeStyle = '#24182E';
    g.lineWidth = 3;
    g.strokeRect(0, 0, W, H);
    ruler.material.map.needsUpdate = true;
  }

  // ---------- The logo picture (drawn once, then stretched however the pupil drags it) ----------
  const logo = document.createElement('canvas');
  logo.width = 480;
  logo.height = 360;
  drawLogo(logo.getContext('2d'), 480, 360);
  // The printed photo of the logo waits on the desk, ready to be inserted.
  const photo = new THREE.Group();
  const card = rbox(1.2, 0.03, 0.9, 0xffffff, 0.01);
  const print = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.825), new THREE.MeshBasicMaterial({ map: canvasTex(logo), toneMapped: false }));
  print.rotation.x = -Math.PI / 2;
  print.position.y = 0.017;
  print.userData.noInk = true;
  photo.add(card, print);
  const PHOTO_AT = new THREE.Vector3(4.15, DESK + 0.02, 1.2);
  photo.position.copy(PHOTO_AT);
  photo.rotation.y = -0.25;
  scene.add(photo);
  stage.clickable(photo, () => insertPicture());

  // ---------- Rendering the page ----------
  function render() {
    const land = st.orient === 'landscape';
    const CW = Math.round((land ? A4.h : A4.w) * CM);
    const CH = Math.round((land ? A4.w : A4.h) * CM);
    if (!tex || cv.width !== CW || cv.height !== CH) {
      cv.width = CW;
      cv.height = CH;
      tex?.dispose();
      tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      page.material.map = tex;
      page.material.needsUpdate = true;
    }
    const g = cv.getContext('2d');
    const m = (marginAnim ?? MARGINS[st.margins]) * CM;
    const x0 = m;
    const cw = CW - 2 * m;
    const bottom = CH - m;
    L = { CW, CH, m, x0, cw, bottom, pic: null, table: null, overflow: false };
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, CW, CH);
    g.save();
    g.setLineDash([12, 9]);
    g.strokeStyle = '#E8A33D';
    g.lineWidth = 2.5;
    g.strokeRect(m, m, cw, CH - 2 * m);
    g.restore();

    g.save();
    g.beginPath();
    g.rect(0, 0, CW, bottom);
    g.clip();
    g.textBaseline = 'alphabetic';
    let y = m;
    // Title and the key facts, big, bold and centred.
    g.fillStyle = '#24182E';
    fitFont(g, 'TECH CLUB OPEN DAY', `bold ${land ? 84 : 70}px ${FONT}`, cw);
    g.textAlign = 'center';
    y += land ? 78 : 66;
    g.fillText('TECH CLUB OPEN DAY', x0 + cw / 2, y);
    y += 50;
    g.fillStyle = '#CA1F3F';
    fitFont(g, 'Friday 27 November · 2:00 pm · School ICT lab', `bold 30px ${FONT}`, cw);
    g.fillText('Friday 27 November · 2:00 pm · School ICT lab', x0 + cw / 2, y);
    y += 34;
    g.textAlign = 'left';

    // The paragraph, with the picture placed by its wrap setting.
    const pic = st.pic;
    const lh = 37;
    g.font = `27px ${FONT}`;
    g.fillStyle = '#3B3343';
    let py = y + 6;
    let obstacle = null;
    if (pic) {
      L.pic = { x: x0, y: py, w: pic.w, h: pic.h };
      if (pic.wrap === 'behind') {
        g.drawImage(logo, x0, py, pic.w, pic.h);
      } else {
        g.drawImage(logo, x0, py, pic.w, pic.h);
        if (pic.wrap === 'inline') py += pic.h + 10;
        else obstacle = { right: x0 + pic.w + 22, bottom: py + pic.h + 8 };
      }
    }
    const words = BODY.split(' ');
    let line = '';
    let ly = py + 28;
    const lineBox = (yy) => (obstacle && yy - 28 < obstacle.bottom ? { x: obstacle.right, w: x0 + cw - obstacle.right } : { x: x0, w: cw });
    g.fillStyle = '#3B3343';
    for (let i = 0; i <= words.length; i++) {
      let b = lineBox(ly);
      // Too narrow beside the picture? Start under it instead.
      while (b.w < 150 && obstacle) {
        ly = obstacle.bottom + 28;
        b = lineBox(ly);
      }
      const w = words[i];
      const test = line ? `${line} ${w}` : w;
      if (i < words.length && (g.measureText(test).width <= b.w || !line)) {
        line = test;
        continue;
      }
      g.fillText(line, b.x, ly);
      line = w ?? '';
      if (i < words.length) ly += lh;
    }
    // (Behind Text takes no room: the words sit on top of the picture.)
    y = Math.max(ly + 12, obstacle ? obstacle.bottom : 0);

    // The Order of Events table.
    if (st.table) {
      y += 22;
      g.fillStyle = '#24182E';
      g.font = `bold 34px ${FONT}`;
      g.fillText('Order of Events', x0, y + 30);
      y += 50;
      const rows = [HEAD, ...st.table.rows];
      const rh = 44;
      const cols = [0.25, 0.45, 0.3].map((f) => f * Math.min(cw, 900));
      const tw = cols.reduce((a, b) => a + b, 0);
      const tx = x0 + (cw - tw) / 2;
      L.table = { x: tx, y, w: tw, h: rows.length * rh };
      rows.forEach((r, ri) => {
        const ry = y + ri * rh;
        const head = ri === 0 && st.table.headerRow;
        if (head) {
          g.fillStyle = '#24182E';
          g.fillRect(tx, ry, tw, rh);
        } else if (ri > 0 && ri === rows.length - 1 && st.table.flash) {
          g.fillStyle = 'rgba(255,190,0,0.28)';
          g.fillRect(tx, ry, tw, rh);
        }
        let cx = tx;
        r.forEach((cell, ci) => {
          g.fillStyle = head ? '#FFFFFF' : '#3B3343';
          g.font = `${head ? 'bold ' : ''}24px ${FONT}`;
          g.fillText(cell, cx + 12, ry + rh * 0.68);
          cx += cols[ci];
        });
      });
      // All Borders.
      g.strokeStyle = '#6b5f78';
      g.lineWidth = 2;
      for (let ri = 0; ri <= rows.length; ri++) g.strokeRect(tx, y + ri * rh, tw, 0);
      let cx = tx;
      for (let ci = 0; ci <= cols.length; ci++) {
        g.strokeRect(cx, y, 0, rows.length * rh);
        cx += cols[ci] ?? 0;
      }
      if (st.sel === 'table') {
        g.strokeStyle = '#2b6cdf';
        g.lineWidth = 4;
        g.strokeRect(tx - 6, y - 6, tw + 12, rows.length * rh + 12);
      }
      y += rows.length * rh;
    }
    g.restore();
    L.contentBottom = y;
    L.overflow = y > bottom + 2 || (L.pic && L.pic.x + L.pic.w > x0 + cw + 2);

    // Picture selection box and its three working handles.
    if (L.pic && st.sel === 'pic') {
      const { x, y: yy, w, h } = L.pic;
      g.strokeStyle = '#2b6cdf';
      g.lineWidth = 3;
      g.strokeRect(x, yy, w, h);
      L.handles = {
        side: { x: x + w, y: yy + h / 2 },
        bottom: { x: x + w / 2, y: yy + h },
        corner: { x: x + w, y: yy + h },
      };
      for (const [k, p] of Object.entries(L.handles)) {
        g.fillStyle = k === 'corner' ? '#FFBE00' : '#ffffff';
        g.strokeStyle = '#24182E';
        g.lineWidth = 4;
        g.beginPath();
        if (k === 'corner') g.arc(p.x, p.y, 20, 0, Math.PI * 2);
        else g.rect(p.x - 15, p.y - 15, 30, 30);
        g.fill();
        g.stroke();
      }
    } else L.handles = null;

    // Header and footer live in the top and bottom margins.
    const hf = Math.max(15, Math.min(24, m * 0.36));
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${hf}px ${FONT}`;
    if (st.header) {
      g.fillStyle = '#7d728a';
      g.fillText('BIH Tech Club Open Day', CW / 2, m / 2);
    }
    if (st.pageNum) {
      g.fillStyle = '#7d728a';
      g.fillText(`Page 1 of ${L.overflow ? 2 : 1}`, CW / 2, CH - m / 2);
    }
    if (L.overflow) {
      g.fillStyle = '#CA1F3F';
      g.fillRect(m, bottom - 4, cw, 8);
      g.font = `bold 24px ${FONT}`;
      g.fillStyle = '#ffffff';
      const msg = '▼ Does not fit: this spills onto page 2';
      const tw = g.measureText(msg).width + 30;
      g.fillStyle = '#CA1F3F';
      g.beginPath();
      g.roundRect(CW / 2 - tw / 2, bottom - 44, tw, 40, 12);
      g.fill();
      g.fillStyle = '#ffffff';
      g.fillText(msg, CW / 2, bottom - 23);
    }
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    tex.needsUpdate = true;
    drawRuler();
    drawSizeTag();
    placeCards();
    checkMissions();
  }

  // ---------- Callouts (most important first: phones show four) ----------
  const local = (px, py) => [px / L.CW - 0.5, 0.5 - py / L.CH, 0];
  const cards = {
    table: stage.callout(page, { icon: '▦', title: 'Table', text: 'Insert → Table', dx: 150, dy: 20, onClick: () => insertTable() }),
    pic: stage.callout(page, { icon: '🖼️', title: 'Picture', text: 'Insert → Pictures', dx: -150, dy: -10, onClick: () => insertPicture() }),
    margins: stage.callout(page, { icon: '📏', title: 'Margins', text: 'The empty border round the page', dx: -140, dy: 60 }),
    header: stage.callout(page, { icon: '🔝', title: 'Header', text: 'Repeats at the top of every page', dx: 140, dy: -50, onClick: () => toggleHeader() }),
    footer: stage.callout(page, { icon: '#️⃣', title: 'Page number', text: 'The computer counts for you', dx: 140, dy: 40, onClick: () => togglePageNum() }),
  };
  function placeCards() {
    const { CW, CH, m } = L;
    if (L.table) cards.table.at.set(...local(L.table.x + L.table.w, L.table.y + L.table.h / 2));
    else cards.table.at.set(...local(CW - m, Math.min(CH - m - 40, (L.contentBottom ?? CH / 2) + 40)));
    cards.table.set('Table', st.table ? (st.table.headerRow ? 'Header row: bold and shaded' : 'Rows across, columns down') : 'Insert → Table', '▦');
    if (L.pic) cards.pic.at.set(...local(L.pic.x, L.pic.y + L.pic.h / 2));
    else cards.pic.at.set(...local(m, 330));
    cards.pic.set(squashed() ? 'Squashed!' : 'Picture', st.pic ? (squashed() ? 'A side handle stretched it' : 'Drag a corner, never a side') : 'Insert → Pictures', squashed() ? '⚠️' : '🖼️');
    cards.margins.at.set(...local(m, CH * 0.82));
    cards.margins.set('Margins', `${st.margins === 'normal' ? 'Normal 2.54 cm' : 'Narrow 1.27 cm'}: the empty border`, '📏');
    cards.header.at.set(...local(CW / 2 + 90, m / 2));
    cards.header.set('Header', st.header ? 'Repeats at the top of every page' : 'Insert → Header', '🔝');
    cards.footer.at.set(...local(CW / 2 + 60, CH - m / 2));
    cards.footer.set(L.overflow ? 'Spills over!' : 'Page number', L.overflow ? 'It no longer fits on one page' : st.pageNum ? 'The computer counts for you' : 'Insert → Page Number', L.overflow ? '⚠️' : '#️⃣');
  }

  // ---------- Ribbon (side panel) ----------
  const insert = ui.group('Insert');
  const bTable = ui.button('▦ Table', () => insertTable(), { group: insert });
  const bPic = ui.button('🖼️ Picture (club logo)', () => insertPicture(), { group: insert });
  const bHead = ui.button('⬆ Header', () => toggleHeader(), { group: insert });
  const bNum = ui.button('#️⃣ Page number', () => togglePageNum(), { group: insert });

  const tableG = ui.group('Table');
  const bRow = ui.button('⇥ Tab in the last cell (new row)', () => addRow(), { group: tableG });
  const bHeadRow = ui.button('Header row: bold + shading', () => headerRow(), { group: tableG });

  const picG = ui.group('Picture: resize and wrap text');
  const bCorner = ui.button('↘ Corner handle: smaller', () => resize('corner', 0.8), { group: picG });
  const bCornerUp = ui.button('↖ Corner: bigger', () => resize('corner', 1.2), { group: picG });
  const bSide = ui.button('↔ Side handle: narrower', () => resize('side', 0.75), { group: picG });
  const wraps = [['inline', 'In Line with Text'], ['square', 'Square'], ['behind', 'Behind Text']].map(([k, t]) => {
    const b = ui.button(t, () => setWrap(k), { group: picG });
    b.dataset.wrap = k;
    return b;
  });

  const layoutG = ui.group('Layout');
  const mBtns = [['normal', 'Margins: Normal'], ['narrow', 'Margins: Narrow']].map(([k, t]) => {
    const b = ui.button(t, () => setMargins(k), { group: layoutG });
    b.dataset.v = k;
    return b;
  });
  const oBtns = [['portrait', '▯ Portrait'], ['landscape', '▭ Landscape']].map(([k, t]) => {
    const b = ui.button(t, () => setOrient(k), { group: layoutG });
    b.dataset.v = k;
    return b;
  });

  const editG = ui.group('Edit');
  const bUndo = ui.button('↶ Undo (Ctrl + Z)', () => undo(), { group: editG });
  const bReset = ui.button('↺ Start again', () => {
    if (busy) return;
    st = fresh();
    history = [];
    placeSheet();
    render();
    syncButtons();
    ui.info('A fresh page', '<p>A new A4 page, Portrait, with Normal margins. A good document maker sets up the page first, like a tailor measuring the cloth before cutting.</p>');
  }, { group: editG });
  const all = [bTable, bPic, bHead, bNum, bRow, bHeadRow, bCorner, bCornerUp, bSide, ...wraps, ...mBtns, ...oBtns, bUndo, bReset];

  function syncButtons() {
    ui.toggle(wraps, wraps.find((b) => b.dataset.wrap === st.pic?.wrap));
    ui.toggle(mBtns, mBtns.find((b) => b.dataset.v === st.margins));
    ui.toggle(oBtns, oBtns.find((b) => b.dataset.v === st.orient));
    bHead.classList.toggle('active', st.header);
    bNum.classList.toggle('active', st.pageNum);
    bHeadRow.classList.toggle('active', !!st.table?.headerRow);
    const dim = (b, off) => { b.style.opacity = off || busy ? '0.5' : ''; b.setAttribute('aria-disabled', String(!!(off || busy))); };
    [bRow, bHeadRow].forEach((b) => dim(b, !st.table));
    [bCorner, bCornerUp, bSide, ...wraps].forEach((b) => dim(b, !st.pic));
    [bTable, bPic, bHead, bNum, ...mBtns, ...oBtns, bReset].forEach((b) => dim(b, false));
    dim(bUndo, !history.length);
  }
  function setBusy(on) {
    busy = on;
    syncButtons();
  }
  function save() {
    history.push(JSON.stringify(st));
    if (history.length > 40) history.shift();
  }
  function commit() {
    render();
    syncButtons();
  }
  // Feedback after an action, with a warning whenever the page no longer fits.
  function tell(title, html) {
    const poke = L.pic && L.pic.x + L.pic.w > L.x0 + L.cw + 2;
    const spill = L.overflow ? `<p class="check bad">⚠️ It no longer fits on one page: ${poke ? 'the picture pokes out past the margin. Make it' : 'make the picture'} smaller with a corner handle.</p>` : '';
    ui.info(title, html + spill);
  }

  // ---------- Actions ----------
  function insertTable() {
    if (busy) return;
    stage.reveal();
    if (st.table) {
      st.sel = 'table';
      commit();
      return tell('The table is already there', '<p>Press <b>Tab in the last cell</b> to add a row, or <b>Header row</b> to make the top row stand out.</p>');
    }
    save();
    st.table = { rows: EVENTS.slice(0, 3).map((r) => [...r]), headerRow: false, added: 0 };
    st.sel = 'table';
    commit();
    tell('▦ Table inserted: 3 columns, 4 rows', '<p>A <b>row</b> goes across, a <b>column</b> goes down and each box is a <b>cell</b>. The top row holds the column names: <b>Time, Item, By</b>.</p><p>Now add an event: click in the very last cell and press <b>Tab</b>. A new row appears!</p>');
  }
  function addRow() {
    if (busy) return;
    if (!st.table) return tell('No table yet', '<p>Insert a table first: <b>Insert → Table</b>.</p>');
    if (st.table.rows.length >= EVENTS.length) return tell('That is the whole programme', '<p>All the events are in the table. Right-click a row → <b>Insert → Insert Rows Below</b> adds a row in the middle, if you ever need one.</p>');
    save();
    st.table.rows.push([...EVENTS[st.table.rows.length]]);
    st.table.added++;
    st.sel = 'table';
    st.table.flash = true;
    commit();
    setTimeout(() => { if (st.table) { st.table.flash = false; render(); } }, 900);
    const r = st.table.rows.at(-1);
    tell('⇥ New row added', `<p>Pressing <b>Tab</b> in the very last cell made a new row: <b>${r[0]} · ${r[1]} · ${r[2]}</b>. It works the same in Word, LibreOffice and Google Docs.</p>${st.table.headerRow ? '' : '<p>Next: make the top row a <b>header row</b>, bold and shaded, so readers see the column names at once.</p>'}`);
  }
  function headerRow() {
    if (busy || !st.table) return;
    save();
    st.table.headerRow = !st.table.headerRow;
    st.sel = 'table';
    commit();
    tell(st.table.headerRow ? '✅ Header row: bold and shaded' : 'Header row turned off', st.table.headerRow ? '<p>The top row now looks different from the events, so the reader knows <b>Time, Item, By</b> are the column names. In Word: select the top row, press <b>B</b>, then <b>Table Design → Shading</b>.</p>' : '<p>Now the column names look like any other row. Turn it back on!</p>');
  }

  async function insertPicture() {
    if (busy) return;
    stage.reveal();
    if (st.pic) {
      st.sel = 'pic';
      commit();
      return tell('The logo is already on the page', '<p>Drag its <b>round corner handle</b> on the page to resize it, or use the buttons. Then choose a <b>Wrap Text</b> option.</p>');
    }
    setBusy(true);
    // The printed photo flies from the desk onto the page.
    const fly = photo.clone();
    scene.add(fly);
    photo.visible = false;
    const to = page.localToWorld(new THREE.Vector3(-0.2, 0.15, 0.3));
    const from = PHOTO_AT.clone();
    const q0 = fly.quaternion.clone();
    const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 - 0.16, 0, 0));
    await stage.tween((k) => {
      fly.position.lerpVectors(from, to, k);
      fly.position.y += Math.sin(k * Math.PI) * 1.2;
      fly.quaternion.slerpQuaternions(q0, q1, k);
      fly.scale.setScalar(1 + k * 0.8);
    }, 0.8);
    scene.remove(fly);
    save();
    const cw = (st.orient === 'portrait' ? A4.w : A4.h) * CM - 2 * MARGINS[st.margins] * CM;
    st.pic = { w: cw * 1.04, h: (cw * 1.04) / LOGO_A, w0: cw * 1.04, wrap: 'inline', corner: false };
    st.sel = 'pic';
    setBusy(false);
    commit();
    tell('🖼️ Picture inserted, far too big!', '<p>Pictures nearly always arrive too big. This one even pokes out past the margin and pushes the words off the page.</p><p>Make it smaller: drag the <b>round gold corner handle</b> on the page (or press <b>Corner handle: smaller</b>). Try a <b>side handle</b> too, and see what happens to the circle in the logo.</p>');
    await stage.wait(1.2);
    photo.visible = true;
    photo.scale.setScalar(0.01);
    stage.tween((k) => photo.scale.setScalar(Math.max(0.01, k)), 0.4);
  }
  const squashed = () => !!st.pic && Math.abs(st.pic.w / st.pic.h / LOGO_A - 1) > 0.04;
  function resize(kind, f, quiet) {
    if (busy || !st.pic) return;
    if (!quiet) save();
    const p = st.pic;
    if (kind === 'corner') {
      p.w = clamp(p.w * f, 90, 1100);
      p.h = clamp(p.h * f, 68, 1100);
      p.corner = true;
    } else if (kind === 'side') p.w = clamp(p.w * f, 60, 1100);
    else p.h = clamp(p.h * f, 50, 1100);
    st.sel = 'pic';
    commit();
    explainResize(kind);
  }
  function explainResize(kind) {
    if (squashed()) {
      tell('😬 Squashed and stretched!', `<p>A <b>${kind === 'side' ? 'side' : 'top or bottom'} handle</b> changes only one direction, so the round logo became an oval. It looks wrong, and everyone notices.</p><p>Press <b>Undo (Ctrl + Z)</b>, then drag a <b>corner</b> handle instead: it keeps the picture's shape.</p>`);
    } else if (kind === 'corner') {
      tell('✅ Corner handle: same shape', `<p>A corner handle changes the width and the height together, so the logo keeps its shape.</p>${st.pic.wrap === 'square' ? '' : '<p>Now choose <b>Wrap Text → Square</b> so the words flow beside the picture.</p>'}`);
    }
  }
  function setWrap(k) {
    if (busy || !st.pic) return;
    save();
    st.pic.wrap = k;
    st.sel = 'pic';
    commit();
    const why = {
      inline: '<p><b>In Line with Text:</b> the picture sits on a line, like one giant letter. Good for a logo on its own line.</p>',
      square: '<p><b>Square:</b> the words flow around the picture\'s sides. Good for a photo beside a paragraph.</p>',
      behind: '<p><b>Behind Text:</b> the picture becomes the background and the words sit on top. Hard to read! Only for a very faint watermark.</p>',
    }[k];
    tell(`Wrap Text → ${wraps.find((b) => b.dataset.wrap === k).textContent}`, why);
  }

  async function setMargins(k) {
    if (busy || st.margins === k) return;
    save();
    setBusy(true);
    const a = MARGINS[st.margins];
    const b = MARGINS[k];
    await stage.tween((t) => {
      marginAnim = a + (b - a) * t;
      render();
    }, 0.45);
    marginAnim = null;
    st.margins = k;
    setBusy(false);
    commit();
    tell(`📏 Margins: ${k === 'normal' ? 'Normal (2.54 cm)' : 'Narrow (1.27 cm)'}`, k === 'narrow' ? '<p>Narrow margins give you more room on the page: good for <b>posters</b>. Printers cannot print right to the edge, so there is always some margin.</p>' : '<p>Normal margins are right for <b>letters and reports</b>. In Word: <b>Layout → Margins</b>.</p>');
  }
  async function setOrient(k) {
    if (busy || st.orient === k) return;
    save();
    setBusy(true);
    stage.reveal();
    // The page turns on its side, then the words re-flow to the new shape.
    const d0 = dims(st.orient);
    const dir = k === 'landscape' ? -1 : 1;
    await stage.tween((t) => {
      sheet.rotation.z = (dir * Math.PI * t) / 2;
      const half = Math.abs(Math.cos(sheet.rotation.z)) * (d0.h / 2) + Math.abs(Math.sin(sheet.rotation.z)) * (d0.w / 2);
      sheet.position.y = 0.22 + half + Math.sin(t * Math.PI) * 0.25;
    }, 0.7);
    st.orient = k;
    placeSheet(k);
    setBusy(false);
    commit();
    tell(k === 'landscape' ? '▭ Landscape: wide, lying down' : '▯ Portrait: tall', k === 'landscape' ? '<p>Landscape turns the page on its side. Good for <b>wide tables, banners, certificates</b> and posters. In Word: <b>Layout → Orientation → Landscape</b>. The words moved by themselves to fit the new shape.</p>' : '<p>Portrait is the usual tall page, for letters, reports and programmes.</p>');
  }
  function toggleHeader() {
    if (busy) return;
    save();
    st.header = !st.header;
    commit();
    tell(st.header ? '🔝 Header added' : 'Header removed', st.header ? '<p>The <b>header</b> is the strip in the top margin. Whatever you type there, like <b>BIH Tech Club Open Day</b>, repeats on every page by itself. In Word: double-click the top margin, or <b>Insert → Header → Blank</b>. It looks pale while you edit the page: it is resting, not gone.</p>' : '<p>The header is gone from every page.</p>');
  }
  function togglePageNum() {
    if (busy) return;
    save();
    st.pageNum = !st.pageNum;
    commit();
    tell(st.pageNum ? '#️⃣ Page number added' : 'Page number removed', st.pageNum ? '<p><b>Insert → Page Number → Bottom of Page</b> put a page number in the <b>footer</b>, the strip in the bottom margin. Never type page numbers by hand: the computer counts for you, even when pages move.</p>' : '<p>The page number is gone.</p>');
  }
  function undo() {
    if (busy || !history.length) return;
    const before = st;
    st = JSON.parse(history.pop());
    if (before.orient !== st.orient) placeSheet();
    commit();
    tell('↶ Undone', `<p><b>Ctrl + Z</b> takes back your last action. ${squashed() ? '' : 'Made a mess? Undo straight away!'}</p>`);
  }

  // ---------- Clicking and dragging on the page ----------
  stage.clickable(page, (o, e, hit) => {
    if (busy || !hit?.uv) return;
    const x = hit.uv.x * L.CW;
    const y = (1 - hit.uv.y) * L.CH;
    const inside = (r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inside(L.pic)) st.sel = 'pic';
    else if (inside(L.table)) st.sel = 'table';
    else if (y < L.m && !st.header) return toggleHeader(); // double-click the top margin opens the header
    else st.sel = null;
    commit();
    if (st.sel === 'pic') tell('Picture selected', '<p>Drag the <b>round gold corner handle</b> to resize it and keep its shape. The square handles on the side and bottom stretch it in one direction only.</p>');
    if (st.sel === 'table') ui.info('Table selected', `<p>${st.table.rows.length + 1} rows and 3 columns. Press <b>Tab in the last cell</b> to add a row.</p>`);
  });
  const wrap = host.querySelector('.lab-canvas');
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane();
  const hitPt = new THREE.Vector3();
  function pagePx(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    page.updateMatrixWorld();
    const n = new THREE.Vector3(0, 0, 1).transformDirection(page.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(n, page.getWorldPosition(new THREE.Vector3()));
    if (!ray.ray.intersectPlane(plane, hitPt)) return null;
    const p = page.worldToLocal(hitPt.clone());
    return { x: (p.x + 0.5) * L.CW, y: (0.5 - p.y) * L.CH };
  }
  function handleAt(p) {
    if (!L.handles || !p) return null;
    let best = null;
    let bd = 48;
    for (const [k, h] of Object.entries(L.handles)) {
      const d = Math.hypot(p.x - h.x, p.y - h.y);
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }
  let drag = null;
  // Capture phase on the canvas wrapper: a drag on a handle resizes instead of turning the view.
  wrap.addEventListener('pointerdown', (e) => {
    if (busy || e.target !== renderer.domElement) return;
    const p = pagePx(e);
    const k = handleAt(p);
    if (!k) return;
    e.stopPropagation();
    save();
    drag = { k, x0: L.pic.x, y0: L.pic.y, a: st.pic.w / st.pic.h, moved: false };
    renderer.domElement.setPointerCapture?.(e.pointerId);
  }, true);
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (!drag) {
      const k = handleAt(pagePx(e));
      if (k) renderer.domElement.style.cursor = k === 'corner' ? 'nwse-resize' : k === 'side' ? 'ew-resize' : 'ns-resize';
      return;
    }
    const p = pagePx(e);
    if (!p) return;
    const pic = st.pic;
    if (drag.k === 'corner') {
      pic.w = clamp(p.x - drag.x0, 90, 1100);
      pic.h = pic.w / drag.a;
      pic.corner = true;
    } else if (drag.k === 'side') pic.w = clamp(p.x - drag.x0, 60, 1100);
    else pic.h = clamp(p.y - drag.y0, 50, 1100);
    drag.moved = true;
    if (!drag.raf) drag.raf = requestAnimationFrame(() => { if (drag) drag.raf = 0; render(); });
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) history.pop();
    commit();
    if (d.moved) explainResize(d.k === 'corner' ? 'corner' : d.k);
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Ctrl + Z works while the lab has focus (not in other boxes on the page).
  host.tabIndex = 0;
  host.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    }
  });

  // ---------- Missions ----------
  function checkMissions() {
    if (st.table && st.table.added > 0 && st.table.headerRow) ui.complete('table');
    if (st.pic && st.pic.corner && !squashed() && st.pic.w < st.pic.w0 * 0.95 && st.pic.wrap === 'square') ui.complete('picture');
    if (st.orient === 'landscape' && st.margins === 'narrow' && st.header && st.pageNum && st.table && st.pic && !L.overflow && !squashed()) {
      if (!ui.isDone('layout')) {
        ui.complete('layout');
        setTimeout(() => ui.info('🎉 A poster that fits on one page', '<p>Landscape, Narrow margins, a header, a page number, a picture in the right shape and a neat table. That is exactly what the typing shop at the junction does. Now make the real one in Word!</p>'), 50);
      }
    }
  }

  placeSheet();
  render();
  syncButtons();
  ui.info('Page Layout Studio', '<p>This is the Tech Club <b>Open Day</b> poster, on an A4 page. The dashed gold line shows the <b>margins</b>.</p><p>Use the ribbon buttons: insert the <b>Order of Events</b> table and the club <b>logo</b>, then set up the page. You can drag the picture\'s handles on the page too.</p>');
}

// ---------- Helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fitFont(g, text, font, maxW) {
  let px = Number(font.match(/(\d+)px/)[1]);
  do g.font = font.replace(/\d+px/, `${px}px`);
  while (g.measureText(text).width > maxW && (px -= 2) > 12);
}
function canvasTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// The club logo: kente stripes, a round badge with a laptop, the club name.
function drawLogo(g, W, H) {
  g.fillStyle = '#FFF7E0';
  g.fillRect(0, 0, W, H);
  const kente = ['#FFBE00', '#CA1F3F', '#2EC4B6', '#24182E', '#FFBE00', '#2EC4B6', '#CA1F3F', '#24182E'];
  const s = W / 16;
  for (let i = 0; i < 16; i++) {
    g.fillStyle = kente[i % kente.length];
    g.fillRect(i * s, 0, s, H * 0.08);
    g.fillRect(i * s, H * 0.92, s, H * 0.08);
  }
  const cx = W / 2;
  const cy = H * 0.43;
  const r = H * 0.27;
  g.fillStyle = '#24182E';
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#FFBE00';
  g.lineWidth = 8;
  g.beginPath();
  g.arc(cx, cy, r - 10, 0, Math.PI * 2);
  g.stroke();
  // A little laptop in the badge.
  g.fillStyle = '#ffffff';
  g.fillRect(cx - r * 0.5, cy - r * 0.42, r, r * 0.62);
  g.fillStyle = '#2EC4B6';
  g.fillRect(cx - r * 0.42, cy - r * 0.34, r * 0.84, r * 0.46);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(cx - r * 0.66, cy + r * 0.36);
  g.lineTo(cx + r * 0.66, cy + r * 0.36);
  g.lineTo(cx + r * 0.54, cy + r * 0.24);
  g.lineTo(cx - r * 0.54, cy + r * 0.24);
  g.fill();
  g.fillStyle = '#24182E';
  g.font = 'bold 46px Rubik, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('BIH TECH CLUB', cx, H * 0.82);
}

function buildDesk(scene, top) {
  const desk = rbox(13, 0.3, 6.4, 0xc8a27a, 0.08);
  desk.position.set(0, top - 0.15, 0);
  scene.add(desk);
  for (const [x, z] of [[-6.1, -2.8], [6.1, -2.8], [-6.1, 2.8], [6.1, 2.8]]) {
    const leg = box(0.28, top - 0.3, 0.28, 0x8d6e4c);
    leg.position.set(x, (top - 0.3) / 2, z);
    scene.add(leg);
  }
  // A pencil pot and a metre rule, for scale.
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.27, 0.72, 20), mat(COLORS.red));
  pot.position.set(4.9, top + 0.36, -0.9);
  pot.castShadow = true;
  scene.add(pot);
  [[-0.1, 0.06, 0.14, COLORS.gold], [0.1, -0.05, -0.12, COLORS.purple], [0, 0.1, 0.03, COLORS.green]].forEach(([dx, dz, tilt, c]) => {
    const pencil = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), mat(c));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), mat(0xe8c9a0));
    tip.position.y = 0.56;
    pencil.add(stick, tip);
    pencil.position.set(4.9 + dx, top + 0.85, -0.9 + dz);
    pencil.rotation.set(tilt, 0, -tilt);
    scene.add(pencil);
  });
  const rule = rbox(4.2, 0.04, 0.32, 0xf2d27a, 0.015);
  rule.position.set(0, top + 0.02, 2.2);
  rule.rotation.y = 0.05;
  scene.add(rule);
  const ticks = decal(4.1, 0.3, (g, W, H) => {
    g.fillStyle = '#24182E';
    for (let i = 0; i <= 40; i++) g.fillRect((i / 40) * (W - 8) + 4, 0, 2, i % 5 ? H * 0.3 : H * 0.55);
  }, { px: 48 });
  ticks.rotation.set(-Math.PI / 2, 0, 0.05);
  ticks.position.set(0, top + 0.042, 2.2);
  scene.add(ticks);

  // The "typing shop" A-frame sign you see at every junction.
  const sign = new THREE.Group();
  const boardMat = 0x24182e;
  for (const s of [1, -1]) {
    const b = rbox(1.7, 2.0, 0.06, boardMat, 0.03);
    b.position.set(0, 1.0, s * 0.3);
    b.rotation.x = s * 0.17;
    sign.add(b);
  }
  const paint = decal(1.55, 1.85, (g, W, H) => {
    g.fillStyle = '#FFBE00';
    g.beginPath();
    g.roundRect(8, 8, W - 16, H * 0.2, 16);
    g.fill();
    g.fillStyle = '#24182E';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${H * 0.085}px Rubik, system-ui, sans-serif`;
    g.fillText('KOFI ENTERPRISE', W / 2, 8 + H * 0.1);
    const lines = [['TYPING', '#FFFFFF'], ['PRINTING', '#2EC4B6'], ['PHOTOCOPY', '#FFFFFF'], ['LAMINATION', '#FFBE00']];
    lines.forEach(([t, c], i) => {
      g.fillStyle = c;
      g.font = `bold ${H * 0.1}px Rubik, system-ui, sans-serif`;
      g.fillText(t, W / 2, H * (0.37 + i * 0.15));
    });
  }, { px: 256 });
  paint.position.set(0, 1.02, 0.338);
  paint.rotation.x = 0.17;
  sign.add(paint);
  sign.position.set(-4.7, top, -0.2);
  sign.rotation.y = 0.35;
  sign.scale.setScalar(1.05);
  scene.add(sign);
}

export const missions = [
  { id: 'table', text: 'Insert the Order of Events table, add a row, then make the top row a header row.', hint: 'Insert → Table. "Tab in the last cell" adds a row, and "Header row" makes the top row bold and shaded.' },
  { id: 'picture', text: 'Insert the club logo, make it smaller with a corner handle and wrap text Square.', hint: 'Drag the round gold corner handle on the page, or use the corner button. Squashed it with a side handle? Press Undo.' },
  { id: 'layout', text: 'Make it a one-page poster: Landscape, Narrow margins, a header and a page number.', hint: 'Use the Layout buttons, then Insert → Header and Insert → Page number. Watch out for the red "spills onto page 2" bar.' },
];

export const config = { camera: [3.0, 7.0, 12], target: [0, 3.75, -0.7], frame: 0.7, shadowSize: 9, minDistance: 5 };
