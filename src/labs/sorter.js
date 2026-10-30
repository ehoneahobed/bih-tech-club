// Session 18 — What Is AI? Teach the Robot: a recycling robot learns from
// examples. Pupils label things on the conveyor belt (Plastic, Paper or Cans)
// and each one goes onto the robot's memory shelf (its training data). Then
// the robot sorts things it has never seen by finding the most similar example
// on its shelf (1-nearest-neighbour). Too few, one-sided or wrongly labelled
// examples lead to confident mistakes.
import { THREE, COLORS, mat, rbox, decal, label, setLabel } from './runtime.js';

const CATS = {
  plastic: { name: 'Plastic', icon: '🧴', color: COLORS.gold, css: '#FFBE00', ink: '#24182E' },
  paper: { name: 'Paper', icon: '📰', color: COLORS.green, css: '#2EC4B6', ink: '#24182E' },
  cans: { name: 'Cans', icon: '🥫', color: COLORS.blue, css: '#5A4470', ink: '#FFFFFF' },
};
const CAT_IDS = Object.keys(CATS);

// What the robot's camera and hand "measure" for each thing (0 = not at all, 1 = very).
// It never sees the words "plastic" or "paper": only these numbers.
const FEATURES = [
  ['shiny', 'dull'],
  ['see-through', 'not see-through'],
  ['bendy', 'stiff'],
  ['heavy', 'light'],
  ['crinkly', 'smooth'],
  ['easy to tear', 'hard to tear'],
];
// Tricky things look like a different kind (a carton is shiny, a crushed can is bendy).
const ITEMS = {
  bottle: { cat: 'plastic', name: 'water bottle', a: 'a', f: [0.7, 0.9, 0.45, 0.3, 0.2, 0.05] },
  sachet: { cat: 'plastic', name: '“pure water” sachet', a: 'a', f: [0.6, 0.8, 0.95, 0.15, 0.45, 0.15] },
  cup: { cat: 'plastic', name: 'plastic cup', a: 'a', f: [0.55, 0.6, 0.5, 0.1, 0.2, 0.05] },
  gallon: { cat: 'plastic', name: 'cooking-oil gallon', a: 'a', f: [0.65, 0.35, 0.35, 0.5, 0.1, 0] },
  rubber: { cat: 'plastic', name: 'black “rubber” bag', a: 'a', f: [0.4, 0.15, 1, 0.05, 0.9, 0.35], tricky: true },
  news: { cat: 'paper', name: 'newspaper', a: 'a', f: [0.1, 0, 0.9, 0.15, 0.7, 0.9] },
  page: { cat: 'paper', name: 'exercise-book page', a: 'an', f: [0.05, 0.1, 0.85, 0.05, 0.55, 0.95] },
  box: { cat: 'paper', name: 'cardboard box', a: 'a', f: [0.05, 0, 0.25, 0.45, 0.25, 0.6] },
  bag: { cat: 'paper', name: 'paper bag', a: 'a', f: [0.1, 0, 0.75, 0.15, 0.85, 0.8] },
  carton: { cat: 'paper', name: 'juice carton', a: 'a', f: [0.5, 0, 0.3, 0.35, 0.15, 0.3], tricky: true },
  drink: { cat: 'cans', name: 'drinks can', a: 'a', f: [0.95, 0, 0.2, 0.3, 0.1, 0] },
  tomato: { cat: 'cans', name: 'tomato tin', a: 'a', f: [0.85, 0, 0.05, 0.7, 0.1, 0] },
  milk: { cat: 'cans', name: 'milk tin', a: 'a', f: [0.85, 0, 0.05, 0.55, 0.05, 0] },
  sardine: { cat: 'cans', name: 'sardine tin', a: 'a', f: [0.9, 0, 0.15, 0.4, 0.05, 0] },
  crushed: { cat: 'cans', name: 'crushed can', a: 'a', f: [0.75, 0, 0.6, 0.3, 0.75, 0], tricky: true },
};
const KINDS = Object.keys(ITEMS);
const PER_SHELF = 6; // examples per column of the memory shelf
const TESTS = 5;
const BIG = 1.25; // things on the belt are drawn a little larger than life
const SMALL = 0.8; // and a little smaller on the shelf

// Scene layout (world units).
const BELT_Y = 0.88; // the belt's top surface
const BELT_Z = 1.3;
const BELT_START = -4.3;
const SCAN_X = -0.62; // where things stop under the scanner, in front of the robot
const SACK = new THREE.Vector3(-5.3, 1.05, 1.2);
const BIN_X = { plastic: 2.15, paper: 3.35, cans: 4.55 };
const BIN_Z = 1.25;
const SHELF_POS = new THREE.Vector3(-2.75, 0, -1.75);
const PLANK_Y = [1.12, 1.92, 2.72];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const theName = (kind) => `the ${ITEMS[kind].name}`;
const aName = (kind) => `${ITEMS[kind].a} ${ITEMS[kind].name}`;
const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const alike = (d) => Math.max(1, Math.round(100 * (1 - d / 2)));

export default function sorterLab(stage, ui) {
  const { scene } = stage;

  // ---------- The recycling yard ----------
  const floor = rbox(11.8, 0.14, 5.2, 0xe7e0d4, 0.06);
  floor.position.set(-0.1, -0.07, -0.05);
  scene.add(floor);
  // Painted yellow lines mark the sorting area in front of the bins.
  const lines = decal(4.2, 1.7, (g, W, H) => {
    g.strokeStyle = '#FFBE00';
    g.lineWidth = 10;
    g.setLineDash([26, 18]);
    g.strokeRect(8, 8, W - 16, H - 16);
  }, { px: 128 });
  lines.rotation.x = -Math.PI / 2;
  lines.position.set(3.35, 0.002, 1.25);
  scene.add(lines);

  // ---------- Conveyor belt ----------
  const belt = new THREE.Group();
  const frameLen = 4.95;
  const frameX = BELT_START - 0.55 + frameLen / 2;
  const frame = rbox(frameLen, 0.22, 0.98, 0x3b3f46, 0.06);
  frame.position.set(frameX, BELT_Y - 0.13, BELT_Z);
  belt.add(frame);
  const beltTex = stripes();
  const beltTop = new THREE.Mesh(new THREE.PlaneGeometry(frameLen - 0.15, 0.8), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.9 }));
  beltTop.rotation.x = -Math.PI / 2;
  beltTop.position.set(frameX, BELT_Y - 0.015, BELT_Z);
  beltTop.receiveShadow = true;
  belt.add(beltTop);
  for (const z of [BELT_Z - 0.47, BELT_Z + 0.47]) {
    const rail = rbox(frameLen, 0.08, 0.06, COLORS.gold, 0.02);
    rail.position.set(frameX, BELT_Y + 0.02, z);
    belt.add(rail);
  }
  for (const x of [frameX - frameLen / 2, frameX + frameLen / 2]) {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.0, 16), mat(0x6b6f78, { metalness: 0.3 }));
    roller.rotation.x = Math.PI / 2;
    roller.position.set(x, BELT_Y - 0.13, BELT_Z);
    belt.add(roller);
    for (const z of [BELT_Z - 0.38, BELT_Z + 0.38]) {
      const leg = rbox(0.14, BELT_Y - 0.2, 0.14, 0x2b2730, 0.03);
      leg.position.set(x + (x < frameX ? 0.25 : -0.25), (BELT_Y - 0.2) / 2, z);
      belt.add(leg);
    }
  }
  // The scanner arch: new things stop under it so the robot can look at them.
  const arch = new THREE.Group();
  for (const z of [-0.55, 0.55]) {
    const post = rbox(0.1, 0.85, 0.1, COLORS.purple, 0.03);
    post.position.set(0, 0.42, z);
    arch.add(post);
  }
  const bar = rbox(0.16, 0.18, 1.24, COLORS.purple, 0.04);
  bar.position.y = 0.92;
  const scanSign = decal(1.0, 0.13, (g, W, H) => {
    g.fillStyle = '#FFBE00';
    g.font = `bold ${H * 0.62}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('◉ SCANNER', W / 2, H * 0.55);
  }, { px: 48 });
  scanSign.rotation.y = Math.PI / 2;
  scanSign.position.set(0.081, 0.92, 0);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), mat(COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.2 }));
  lamp.position.set(0, 1.06, 0);
  arch.add(bar, scanSign, lamp);
  arch.position.set(SCAN_X, BELT_Y, BELT_Z);
  belt.add(arch);
  // A "Ghana Must Go" bag full of rubbish feeds the belt.
  const sack = new THREE.Mesh(lumpy(0.58, 2, 0.12), mat(0xffffff, { map: plaid(), roughness: 0.8 }));
  sack.scale.set(1, 0.85, 1);
  sack.position.set(SACK.x, 0.5, SACK.z);
  sack.castShadow = true;
  belt.add(sack);
  scene.add(belt);

  // ---------- Memory shelf (training data) ----------
  const shelf = new THREE.Group();
  shelf.position.copy(SHELF_POS);
  const back = rbox(4.3, 2.75, 0.12, 0xf4f0f6, 0.05);
  back.position.set(0, 2.3, -0.02);
  shelf.add(back);
  for (const x of [-2.15, 2.15]) {
    const post = rbox(0.16, 3.75, 0.16, COLORS.blue, 0.04);
    post.position.set(x, 1.875, 0);
    shelf.add(post);
  }
  for (const y of PLANK_Y) {
    const plank = rbox(4.2, 0.07, 0.58, 0xc8a27a, 0.025);
    plank.position.set(0, y - 0.035, 0.27);
    shelf.add(plank);
  }
  for (const x of [-0.7, 0.7]) {
    const div = rbox(0.04, 2.05, 0.5, 0xd9d3de, 0.015);
    div.position.set(x, 2.1, 0.25);
    shelf.add(div);
  }
  CAT_IDS.forEach((c, i) => {
    const head = decal(1.25, 0.32, (g, W, H) => {
      g.fillStyle = CATS[c].css;
      g.beginPath(); g.roundRect(2, 2, W - 4, H - 4, H * 0.3); g.fill();
      g.fillStyle = CATS[c].ink;
      g.font = `bold ${H * 0.52}px Rubik, system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(CATS[c].name.toUpperCase(), W / 2, H * 0.55);
    }, { px: 64 });
    head.position.set((i - 1) * 1.4, 3.42, 0.05);
    shelf.add(head);
  });
  const title = rbox(2.9, 0.42, 0.1, COLORS.purple, 0.06);
  title.position.set(0, 3.98, 0);
  const titleText = decal(2.8, 0.38, (g, W, H) => {
    g.fillStyle = '#FFFFFF';
    g.font = `bold ${H * 0.5}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText("ROBOT'S MEMORY", W / 2, H * 0.55);
  }, { px: 64 });
  titleText.position.set(0, 3.98, 0.052);
  shelf.add(title, titleText);
  scene.add(shelf);
  const slotPos = (cat, i) => new THREE.Vector3((CAT_IDS.indexOf(cat) - 1) * 1.4 + (i % 2 ? 0.33 : -0.31), PLANK_Y[2 - Math.floor(i / 2)], 0.3);
  const tagGeo = new THREE.BoxGeometry(0.26, 0.09, 0.02);
  const tagMats = Object.fromEntries(CAT_IDS.map((c) => [c, mat(CATS[c].color)]));

  // ---------- Bins (the robot's output) ----------
  const bins = {};
  for (const c of CAT_IDS) {
    const b = makeBin(c);
    b.position.set(BIN_X[c], 0, BIN_Z);
    scene.add(b);
    const tag = label('', { scale: 0.62 });
    tag.position.set(0, 1.55, 0);
    tag.visible = false;
    b.add(tag);
    const inside = new THREE.Group();
    b.add(inside);
    bins[c] = { group: b, tag, inside };
    stage.clickable(b, () => teach(c));
  }

  // ---------- Robot ----------
  const robot = buildRobot();
  robot.group.position.set(0.8, 0, 0.3);
  robot.group.scale.setScalar(1.12);
  scene.add(robot.group);

  // ---------- Thinking: compare lines, the most similar example, a spark ----------
  const compare = new THREE.Group();
  scene.add(compare);
  const compareMat = new THREE.LineBasicMaterial({ color: COLORS.blue, transparent: true, opacity: 0.45 });
  const think = new THREE.Mesh(new THREE.BufferGeometry(), mat(COLORS.gold, { emissive: COLORS.gold, emissiveIntensity: 0.55 }));
  think.userData.noInk = true;
  think.visible = false;
  scene.add(think);
  const patternDot = new THREE.Object3D();
  think.add(patternDot);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), mat(0xffffff, { emissive: COLORS.gold, emissiveIntensity: 1 }));
  spark.userData.noInk = true;
  think.add(spark);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 28), mat(COLORS.gold, { emissive: COLORS.gold, emissiveIntensity: 0.7 }));
  halo.rotation.x = Math.PI / 2;
  halo.userData.noInk = true;
  halo.visible = false;
  scene.add(halo);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.32, 1, 20, 1, true), new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
  beam.userData.noInk = true;
  beam.visible = false;
  scene.add(beam);

  // ---------- Callouts (most important first: phones show four) ----------
  const cards = {
    robot: stage.callout(robot.head, { icon: '🤖', title: 'Sorting robot', text: 'It learns from examples, not rules.', at: [0, 0.75, 0], dx: 70, dy: -75 }),
    shelf: stage.callout(shelf, { icon: '🧠', title: 'Training data', text: 'Every example you teach it is kept here.', at: [-2.1, 3.6, 0], dx: -40, dy: -60 }),
    item: stage.callout(arch, { icon: '📦', title: 'New data', text: 'Something the robot must sort.', at: [0, -0.1, 0.5], dx: -90, dy: 110 }),
    bins: stage.callout(bins.paper.group, { icon: '🗑️', title: 'Its guess', text: 'Output: the bin it chooses.', at: [0, 1.05, 0], dx: 40, dy: 105 }),
    pattern: stage.callout(patternDot, { icon: '✨', title: 'Pattern', text: 'It finds the most similar example.', at: [0, 0, 0], dx: -60, dy: -70 }),
  };

  // ---------- Side panel ----------
  const teachGroup = ui.group('1 · Teach: what is this?');
  const itemBox = ui.element('<div class="mail-card" aria-live="polite"></div>', teachGroup).firstElementChild;
  const labelBtns = CAT_IDS.map((c) => {
    const b = ui.button(`${CATS[c].icon} ${CATS[c].name}`, () => teach(c), { group: teachGroup });
    b.style.borderColor = CATS[c].css;
    b.style.borderWidth = '2.5px';
    return b;
  });
  const skipBtn = ui.button('Skip ▸', () => skip(), { group: teachGroup });
  skipBtn.title = 'Put this one back and show something else';

  const testGroup = ui.group('2 · Test: can it sort new things?');
  const testBtn = ui.button('🤖 Let the robot sort', () => runTest(), { primary: true, group: testGroup });
  const results = ui.element('<ol class="readout" style="list-style:none;padding:0;margin:4px 0 0;font-family:inherit;font-size:13px;line-height:1.45;display:grid;gap:4px"></ol>', testGroup).firstElementChild;

  const memGroup = ui.group('Robot memory');
  const memText = ui.element('<p class="crack"></p>', memGroup).firstElementChild;
  const forgetBtn = ui.button('🧹 Forget everything', () => forget(), { group: memGroup });

  // ---------- State ----------
  let memory = []; // { thing, label, mesh, tag }
  let queue = [];
  let round = 0;
  let current = null; // { thing, mesh } on the belt, waiting for a label
  let busy = false;
  let testing = false;

  function setBusy(on) {
    busy = on;
    // aria-disabled (not disabled) so a keyboard user's focus stays on the button.
    for (const b of [...labelBtns, skipBtn, testBtn, forgetBtn]) {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.5' : '';
    }
  }

  function thing(kind, jitter) {
    const f = ITEMS[kind].f.map((v) => (jitter ? Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 0.12)) : v));
    return { kind, f };
  }
  // Mix the kinds so the first few things are one of each: easy ones first, tricky ones last.
  function refill() {
    const lists = CAT_IDS.map((c) => [...shuffle(KINDS.filter((k) => ITEMS[k].cat === c && !ITEMS[k].tricky)), ...KINDS.filter((k) => ITEMS[k].cat === c && ITEMS[k].tricky)]);
    const order = shuffle([0, 1, 2]);
    for (let i = 0; i < 5; i++) for (const c of order) queue.push(thing(lists[c][i], round > 0));
    round++;
  }
  const nextThing = () => {
    if (!queue.length) refill();
    return queue.shift();
  };

  function describe(t) {
    const bars = FEATURES.map(([hi], i) => `<span>${hi}</span><span style="display:block;height:8px;margin-top:5px;border-radius:99px;background:var(--plum-tint)"><span style="display:block;height:100%;width:${Math.round(t.f[i] * 100)}%;border-radius:99px;background:var(--plum)"></span></span>`).join('');
    return `<b style="font-size:15px">📦 On the belt: ${esc(aName(t.kind))}</b>
      <details style="margin-top:6px"><summary style="cursor:pointer;color:var(--muted);font-size:13px">🔍 What the robot measures</summary>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px;margin-top:6px">${bars}</div>
      <small style="display:block;margin-top:6px;color:var(--muted)">The robot only sees these numbers, never the word “plastic” or “paper”.</small></details>`;
  }

  function memSummary() {
    const n = (c) => memory.filter((m) => m.label === c).length;
    memText.innerHTML = memory.length
      ? `Memory: <b>${memory.length}</b> example${memory.length === 1 ? '' : 's'} · ${CAT_IDS.map((c) => `${CATS[c].icon} ${n(c)}`).join(' · ')}`
      : 'Memory: <b>empty</b>. The robot knows nothing yet.';
  }

  // ---------- Moving things ----------
  const beltPos = (x) => new THREE.Vector3(x, BELT_Y, BELT_Z);
  async function arc(obj, to, { height = 1, duration = 0.7, scale } = {}) {
    const from = obj.position.clone();
    const s0 = obj.scale.x;
    await stage.tween((k) => {
      obj.position.lerpVectors(from, to, k);
      obj.position.y += Math.sin(k * Math.PI) * height;
      if (scale !== undefined) obj.scale.setScalar(s0 + (scale - s0) * k);
    }, duration);
  }
  // A thing pops out of the sack and rides the belt to the scanner.
  async function rideIn(t) {
    const mesh = makeItem(t.kind);
    mesh.position.copy(SACK);
    mesh.scale.setScalar(0.3);
    mesh.rotation.y = (Math.random() - 0.5) * 0.6;
    scene.add(mesh);
    await arc(mesh, beltPos(BELT_START), { height: 0.6, duration: 0.45, scale: BIG });
    let last = BELT_START;
    await stage.tween((k) => {
      const x = BELT_START + (SCAN_X - BELT_START) * k;
      beltTex.offset.x -= ((x - last) * beltTex.repeat.x) / frameLen;
      last = x;
      mesh.position.x = x;
    }, 1.1);
    return mesh;
  }
  async function backToSack(mesh) {
    await arc(mesh, SACK, { height: 1, duration: 0.5, scale: 0.2 });
    scene.remove(mesh);
  }

  async function nextTeach() {
    setBusy(true);
    const t = nextThing();
    itemBox.innerHTML = '<b style="font-size:15px">📦 Something is coming…</b>';
    robot.screen('TEACH ME!', '#2EC4B6');
    const mesh = await rideIn(t);
    current = { thing: t, mesh };
    itemBox.innerHTML = describe(t);
    lamp.material.emissiveIntensity = 0.9;
    setBusy(false);
  }

  async function teach(cat) {
    if (busy || testing || !current) return;
    const n = memory.filter((m) => m.label === cat).length;
    if (n >= PER_SHELF) {
      ui.info(`The ${CATS[cat].name} shelf is full`, '<p>The robot has room for 6 examples of each kind. Teach another kind, test it, or press <b>Forget everything</b> to start again.</p>');
      return;
    }
    const { thing: t, mesh } = current;
    current = null;
    lamp.material.emissiveIntensity = 0.2;
    // Into the memory shelf, in the column the pupil chose (even if it is wrong).
    const slot = slotPos(cat, n);
    const world = shelf.localToWorld(slot.clone());
    pose({ head: -1.0, l: -0.9 }, 0.3);
    const fly = arc(mesh, world, { height: 1.4, duration: 0.8, scale: SMALL }).then(() => {
      shelf.attach(mesh);
      mesh.position.copy(slot);
      const tag = new THREE.Mesh(tagGeo, tagMats[cat]);
      tag.position.set(slot.x, slot.y - 0.075, 0.57);
      shelf.add(tag);
      entry.tag = tag;
      pose({ head: 0, l: 0 }, 0.4);
    });
    const entry = { thing: t, label: cat, mesh, tag: null };
    memory.push(entry);
    memSummary();
    const wrong = ITEMS[t.kind].cat !== cat;
    ui.info(`📚 Learnt: ${ITEMS[t.kind].name} = ${CATS[cat].name}`,
      `<p>The robot put it on its memory shelf. It now has <b>${memory.length}</b> example${memory.length === 1 ? '' : 's'} to learn from.</p>`
      + (wrong ? `<p>🤫 Psst: that is really <b>${CATS[ITEMS[t.kind].cat].name}</b>. The robot cannot tell. It believes whatever you teach it!</p>` : '')
      + '<p>Teach more, or press <b>Let the robot sort</b> to test it.</p>');
    setBusy(true);
    await Promise.all([fly, nextTeach()]);
  }

  async function skip() {
    if (busy || testing || !current) return;
    const { thing: t, mesh } = current;
    current = null;
    queue.push(t);
    setBusy(true);
    await backToSack(mesh);
    await nextTeach();
  }

  function clearBins() {
    for (const c of CAT_IDS) {
      bins[c].inside.clear();
      bins[c].tag.visible = false;
    }
  }

  function forget() {
    if (busy || testing) return;
    for (const m of memory) {
      shelf.remove(m.mesh);
      if (m.tag) shelf.remove(m.tag);
    }
    memory = [];
    clearBins();
    results.innerHTML = '';
    cards.bins.set('Its guess', 'Output: the bin it chooses.');
    memSummary();
    robot.screen('MEMORY EMPTY', '#FFBE00');
    ui.info('🧹 Memory wiped', '<p>The robot has forgotten everything. Its shelf is empty, so it cannot sort anything until you teach it again.</p>');
  }

  // ---------- The robot's "brain": find the most similar example ----------
  function nearest(t) {
    let best = null;
    let bd = Infinity;
    for (const m of memory) {
      const d = dist(t.f, m.thing.f);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return { ex: best, d: bd };
  }
  function shared(a, b) {
    const out = [];
    FEATURES.forEach(([hi, lo], i) => {
      if (a[i] >= 0.5 && b[i] >= 0.5) out.push([hi, Math.min(a[i], b[i])]);
      else if (a[i] <= 0.3 && b[i] <= 0.3) out.push([lo, 0.85 - Math.max(a[i], b[i]) - (i === 1 ? 0.3 : 0)]);
    });
    out.sort((x, y) => y[1] - x[1]);
    return out.slice(0, 2).map((x) => x[0]).join(' and ') || 'a bit alike';
  }

  // Five new things: a mix of all three kinds, mostly kinds it has not seen,
  // at most one tricky one, and another copy of anything taught with a wrong label.
  function pickTests() {
    const inMem = new Set(memory.map((m) => m.thing.kind));
    const counts = Object.fromEntries(shuffle(CAT_IDS).map((c, i) => [c, i ? 2 : 1]));
    let tricky = Math.random() < 0.6 ? 1 : 0;
    const picks = [];
    for (const c of CAT_IDS) {
      const ofCat = KINDS.filter((k) => ITEMS[k].cat === c);
      let fresh = shuffle(ofCat.filter((k) => !inMem.has(k) && !ITEMS[k].tricky));
      const trick = ofCat.find((k) => !inMem.has(k) && ITEMS[k].tricky);
      if (trick && tricky) {
        fresh.splice(Math.floor(Math.random() * Math.min(counts[c], fresh.length + 1)), 0, trick);
      }
      const pool = [...fresh, ...shuffle(ofCat.filter((k) => inMem.has(k))), ...shuffle(ofCat)];
      const chosen = [...new Set(pool)].slice(0, counts[c]);
      if (chosen.includes(trick)) tricky = 0;
      picks.push(...chosen);
    }
    const wrongKind = memory.find((m) => m.label !== ITEMS[m.thing.kind].cat)?.thing.kind;
    if (wrongKind && !picks.includes(wrongKind)) {
      let i = picks.length - 1;
      while (ITEMS[picks[i]].cat !== ITEMS[wrongKind].cat) i--;
      picks[i] = wrongKind;
    }
    return shuffle(picks).map((k) => ({ ...thing(k, true), again: inMem.has(k) }));
  }

  async function runTest() {
    if (busy || testing) return;
    stage.reveal();
    if (!memory.length) {
      robot.screen('???', '#FFBE00');
      ui.info("🤷 I can't guess yet!", '<p>The robot has <b>no examples</b> in its memory, so it has nothing to compare with. Teach it first: tell it what a few things on the belt are.</p>');
      return;
    }
    testing = true;
    setBusy(true);
    if (current) {
      queue.unshift(current.thing);
      backToSack(current.mesh);
      current = null;
    }
    lamp.material.emissiveIntensity = 0.2;
    clearBins();
    itemBox.innerHTML = '<b style="font-size:15px">🤖 The robot is sorting on its own…</b><small style="display:block;color:var(--muted)">Watch it compare each new thing with its memory shelf.</small>';
    results.innerHTML = '';
    const snapshot = memory.length;
    const goodPerCat = Object.fromEntries(CAT_IDS.map((c) => [c, memory.filter((m) => m.label === c && ITEMS[m.thing.kind].cat === c).length]));
    let right = 0;
    let learntMistake = false;
    const notes = [];
    const tests = pickTests();
    cards.bins.set('Its guess', `Sorting… 0 of ${tests.length} right`);
    for (let n = 0; n < tests.length; n++) {
      const t = tests[n];
      const truth = ITEMS[t.kind].cat;
      robot.screen('NEXT!', '#2EC4B6');
      itemBox.innerHTML = `<b style="font-size:15px">📦 New thing ${n + 1} of ${tests.length}: ${esc(t.again ? `another ${ITEMS[t.kind].name}` : aName(t.kind))}</b><small style="display:block;color:var(--muted)">The robot has not seen this one before.</small>`;
      const mesh = await rideIn(t);
      lamp.material.emissiveIntensity = 0.9;

      // 1. Scan it and compare it with every example on the shelf.
      robot.screen('HMM…', '#FFBE00');
      await pose({ head: -0.7, l: -0.3 }, 0.3);
      showBeam(mesh);
      const p = mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0));
      for (const m of memory) {
        const q = m.mesh.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.15, 0));
        compare.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p, q]), compareMat));
      }
      await stage.wait(0.8);
      beam.visible = false;
      disposeKids(compare);

      // 2. The most similar example wins.
      const { ex, d } = nearest(t);
      const guess = ex.label;
      const exAt = ex.mesh.getWorldPosition(new THREE.Vector3());
      showThink(p, exAt.clone().add(new THREE.Vector3(0, 0.15, 0)));
      halo.position.copy(exAt).add(new THREE.Vector3(0, 0.03, 0));
      halo.visible = true;
      const s0 = ex.mesh.scale.x;
      await Promise.all([
        stage.tween((k) => spark.position.copy(thinkCurve.getPoint(k)), 0.7),
        stage.tween((k) => ex.mesh.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * 0.35)), 0.7),
        pose({ head: -1.1 }, 0.4),
      ]);
      robot.screen(`${CATS[guess].name.toUpperCase()}!`, CATS[guess].css);
      await stage.wait(0.5);

      // 3. Drop it into the bin it chose.
      const ok = guess === truth;
      if (ok) right++;
      lamp.material.emissiveIntensity = 0.2;
      await pose({ head: 0.8, l: -1.1, r: 0.2 }, 0.3);
      const bin = bins[guess];
      const k = bin.inside.children.length;
      const top = bin.group.position.clone().add(new THREE.Vector3(0, 1.25, 0));
      pose({ l: 0, r: 1.0 }, 0.6);
      await arc(mesh, top, { height: 1.0, duration: 0.75, scale: 0.9 });
      bin.inside.attach(mesh);
      const rest = new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.15 + k * 0.1, (Math.random() - 0.5) * 0.3);
      const from = mesh.position.clone();
      await stage.tween((q) => mesh.position.lerpVectors(from, rest, q), 0.3);
      think.visible = halo.visible = false;
      setLabel(bin.tag, ok ? '✓ Right!' : `✗ Wrong! It's ${CATS[truth].name}`, ok ? { bg: '#2EC4B6', color: '#24182E' } : { bg: '#CA1F3F', color: '#FFFFFF' });
      for (const c of CAT_IDS) bins[c].tag.visible = bins[c] === bin;
      robot.screen(ok ? 'YES! ✓' : 'OOPS ✗', ok ? '#2EC4B6' : '#CA1F3F');
      pose({ head: 0, r: 0 }, 0.4);
      cards.bins.set('Its guess', `Sorting… ${right} of ${n + 1} right`);

      // 4. Explain the choice.
      const item = t.again ? `new ${ITEMS[t.kind].name}` : ITEMS[t.kind].name;
      const exName = ITEMS[ex.thing.kind].name;
      const exWrong = ex.label !== ITEMS[ex.thing.kind].cat;
      const knowsTruth = memory.some((m) => m.label === truth);
      let why;
      if (ok) {
        why = `It looked most like the ${exName} you taught it (${alike(d)}% alike), and you said that was ${CATS[guess].name}.`;
      } else if (exWrong) {
        learntMistake = true;
        why = `It looked most like the ${exName} on its shelf. But you told the robot the ${exName} was <b>${CATS[ex.label].name}</b>, so it copied your mistake! Bad examples in, bad answers out.`;
        if (!ex.flag) {
          ex.flag = label('❗ Wrong label', { scale: 0.45, bg: '#CA1F3F', color: '#FFFFFF' });
          ex.flag.position.set(0, 0.55, 0);
          ex.mesh.add(ex.flag);
        }
      } else if (!knowsTruth) {
        why = `It is really <b>${CATS[truth].name}</b>, but the robot has never been shown any ${CATS[truth].name}, so it could not choose that bin. The most similar thing it knew was the ${exName}: both are ${shared(t.f, ex.thing.f)}.`;
      } else {
        why = `It is really <b>${CATS[truth].name}</b>. The robot thought the ${item} looked like the ${exName} you showed it: both are ${shared(t.f, ex.thing.f)}. Teach it more ${CATS[truth].name} examples like this one.`;
      }
      results.insertAdjacentHTML('beforeend', `<li style="padding:5px 8px;border-radius:8px;background:${ok ? 'var(--green-tint)' : 'var(--red-tint)'}">${ok ? '✅' : '❌'} <b>${esc(item)}</b> → ${CATS[guess].icon} ${CATS[guess].name}<br><small style="color:var(--muted)">Most like: ${esc(exName)} (${CATS[ex.label].name}) · ${alike(d)}% alike</small></li>`);
      ui.info(ok ? `✅ Right! The ${item} is ${CATS[truth].name}` : (exWrong ? '❌ Caught it! A mistake it learnt from you' : `❌ Wrong! The ${item} went in ${CATS[guess].name}`), `<p>${why}</p>`);
      if (!ok) notes.push(`<li><b>${esc(item)}</b>: ${why}</li>`);
      if (exWrong && !ok) ui.complete('bad');
      await stage.wait(ok ? 1.0 : 2.2);
    }

    // ---------- Result ----------
    const total = tests.length;
    cards.bins.set('Its guess', `Score: ${right} of ${total} right`);
    robot.screen(`${right} / ${total} RIGHT`, right >= 4 ? '#2EC4B6' : '#FFBE00');
    for (const c of CAT_IDS) bins[c].tag.visible = false;
    const lesson = snapshot <= 2
      ? '<p>With only a couple of examples, the robot has hardly anything to compare with. It still guesses, and it sounds sure of itself!</p>'
      : learntMistake
        ? '<p>A wrong example on the shelf taught the robot a wrong pattern. AI is only as good as the examples it learns from.</p>'
        : right >= 4
          ? '<p>Good, varied, correctly labelled examples lead to good guesses. That is how real AI is trained, with millions of examples.</p>'
          : '<p>To do better, teach it more examples, including the tricky ones it got wrong.</p>';
    ui.info(`🏁 The robot got ${right} of ${total} right`, lesson + (notes.length ? `<p><b>What went wrong:</b></p><ul>${notes.join('')}</ul>` : ''));
    if (snapshot === 2 && right < total) ui.complete('two');
    if (total === TESTS && right >= 4 && CAT_IDS.every((c) => goodPerCat[c] >= 2)) ui.complete('good');
    testing = false;
    await nextTeach();
  }

  // ---------- Thinking visuals ----------
  let thinkCurve = null;
  function showThink(a, b) {
    const mid = a.clone().lerp(b, 0.5);
    mid.y = Math.max(a.y, b.y) + 0.9;
    thinkCurve = new THREE.CatmullRomCurve3([a, mid, b]);
    think.geometry.dispose();
    think.geometry = new THREE.TubeGeometry(thinkCurve, 40, 0.035, 6, false);
    patternDot.position.copy(thinkCurve.getPoint(0.5));
    spark.position.copy(a);
    think.visible = true;
  }
  function showBeam(mesh) {
    const from = robot.eye.getWorldPosition(new THREE.Vector3());
    const to = mesh.position.clone().add(new THREE.Vector3(0, 0.2, 0));
    const len = from.distanceTo(to);
    beam.scale.set(1, len, 1);
    beam.position.copy(from).lerp(to, 0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    beam.visible = true;
  }
  function disposeKids(group) {
    for (const c of [...group.children]) {
      c.geometry?.dispose();
      group.remove(c);
    }
  }

  // ---------- Robot poses (head turn, left and right arms) ----------
  function pose(to, duration) {
    const from = { head: robot.head.rotation.y, l: robot.armL.rotation.z, r: robot.armR.rotation.z };
    const goal = { ...from, ...to };
    return stage.tween((k) => {
      robot.head.rotation.y = from.head + (goal.head - from.head) * k;
      robot.armL.rotation.z = from.l + (goal.l - from.l) * k;
      robot.armR.rotation.z = from.r + (goal.r - from.r) * k;
    }, duration);
  }

  stage.onTick((dt, t) => {
    robot.bulb.material.emissiveIntensity = (testing ? 0.6 : 0.3) + Math.abs(Math.sin(t * (testing ? 6 : 2))) * 0.7;
    robot.body.position.y = Math.sin(t * 2) * 0.015;
    if (halo.visible) halo.rotation.z += dt * 2;
  });

  memSummary();
  ui.info('Teach the robot 🤖', '<p>Normal programs follow <b>rules</b> that a person wrote, like your Scratch scripts. This robot is different: it <b>learns from examples</b>.</p><p>Tell it what each thing on the belt is: <b>Plastic</b>, <b>Paper</b> or <b>Cans</b> (use the buttons, or click a bin). Then press <b>Let the robot sort</b> and see what it learnt.</p>');
  nextTeach();
}

// ---------- Models ----------

// A friendly robot: big eyes, antenna, a chest screen, two arms, on tracks.
function buildRobot() {
  const group = new THREE.Group();
  const body = new THREE.Group(); // bobs gently
  group.add(body);
  const shell = 0xe9e5ec;
  for (const x of [-0.46, 0.46]) {
    const track = rbox(0.28, 0.38, 1.0, 0x2b2730, 0.12);
    track.position.set(x, 0.19, 0);
    group.add(track);
  }
  const base = rbox(0.8, 0.24, 0.8, 0x3b3f46, 0.06);
  base.position.y = 0.38;
  const torso = rbox(1.2, 0.95, 0.85, shell, 0.16);
  torso.position.y = 0.95;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.16, 14), mat(COLORS.blue));
  neck.position.y = 1.48;
  body.add(base, torso, neck);
  const screen = decal(0.82, 0.42, () => {}, { px: 128, transparent: false });
  screen.position.set(0, 1.0, 0.428);
  body.add(screen);
  const badge = decal(0.3, 0.12, (g, W, H) => {
    g.fillStyle = '#2EC4B6';
    g.beginPath(); g.roundRect(0, 0, W, H, H / 2); g.fill();
    g.fillStyle = '#24182E';
    g.font = `bold ${H * 0.62}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('♻ SORT-BOT', W / 2, H * 0.55);
  }, { px: 40 });
  badge.position.set(0, 0.64, 0.428);
  body.add(badge);

  const head = new THREE.Group();
  head.position.y = 1.56;
  body.add(head);
  const skull = rbox(1.0, 0.62, 0.74, shell, 0.18);
  skull.position.y = 0.31;
  const face = rbox(0.78, 0.4, 0.04, 0x2b2730, 0.08);
  face.position.set(0, 0.33, 0.36);
  head.add(skull, face);
  let eye = null;
  for (const x of [-0.18, 0.18]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), mat(0xffffff, { emissive: 0x2ec4b6, emissiveIntensity: 0.35 }));
    white.scale.z = 0.45;
    white.position.set(x, 0.37, 0.39);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(COLORS.purple));
    pupil.position.set(x, 0.37, 0.43);
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14), mat(COLORS.gold));
    ear.rotation.z = Math.PI / 2;
    ear.position.set(x > 0 ? 0.53 : -0.53, 0.31, 0);
    head.add(white, pupil, ear);
    eye ??= pupil;
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 14, Math.PI), mat(COLORS.gold, { emissive: COLORS.gold, emissiveIntensity: 0.4 }));
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.24, 0.39);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32), mat(0x2b2730));
  stalk.position.y = 0.78;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), mat(COLORS.gold, { emissive: COLORS.gold }));
  bulb.position.y = 0.97;
  head.add(smile, stalk, bulb);

  // Arms swing from gold shoulder joints; each ends in a two-finger gripper.
  const [armL, armR] = [-0.7, 0.7].map((x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.22, 0);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat(COLORS.gold));
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.5, 10), mat(COLORS.blue));
    arm.position.y = -0.3;
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), mat(0x2b2730));
    wrist.position.y = -0.58;
    pivot.add(joint, arm, wrist);
    for (const fx of [-0.055, 0.055]) {
      const finger = rbox(0.045, 0.18, 0.09, 0x2b2730, 0.02);
      finger.position.set(fx, -0.69, 0);
      pivot.add(finger);
    }
    body.add(pivot);
    return pivot;
  });
  group.traverse((m) => m.isMesh && !m.userData.noInk && (m.castShadow = true));

  const cv = screen.material.map.image;
  const draw = (text, color) => {
    const g = cv.getContext('2d');
    g.fillStyle = '#1b1220';
    g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let px = 46;
    do g.font = `bold ${px}px Rubik, system-ui, sans-serif`;
    while (g.measureText(text).width > cv.width - 20 && (px -= 2) > 12);
    g.fillText(text, cv.width / 2, cv.height * 0.54);
    screen.material.map.needsUpdate = true;
  };
  return { group, body, head, armL, armR, eye, bulb, screen: draw };
}

// A round recycling bin in the colour of its kind, with a printed sign.
function makeBin(cat) {
  const c = CATS[cat];
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 1.05, 24, 1, true), mat(c.color, { side: THREE.DoubleSide }));
  body.position.y = 0.525;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), mat(0x3b3f46));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.03;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 8, 28), mat(COLORS.purple));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.05;
  const sign = decal(0.74, 0.5, (x, W, H) => {
    x.fillStyle = '#ffffff';
    x.beginPath(); x.roundRect(3, 3, W - 6, H - 6, 18); x.fill();
    x.fillStyle = '#24182E';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = `${H * 0.36}px system-ui, sans-serif`;
    x.fillText('♻', W / 2, H * 0.32);
    let px = H * 0.3;
    do x.font = `bold ${px}px Rubik, system-ui, sans-serif`;
    while (x.measureText(c.name.toUpperCase()).width > W - 16 && (px -= 2) > 10);
    x.fillText(c.name.toUpperCase(), W / 2, H * 0.72);
  }, { px: 128 });
  sign.position.set(0, 0.56, 0.477);
  sign.rotation.x = -0.075;
  for (const m of [body, floor, rim]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  g.add(body, floor, rim, sign);
  return g;
}

// Each kind of thing is built once; the belt, shelf and bins show clones that
// share its geometry and materials (light on old school PCs).
const protos = new Map();
function makeItem(kind) {
  if (!protos.has(kind)) {
    const g = new THREE.Group();
    BUILD[kind](g);
    g.traverse((m) => m.isMesh && !m.userData.noInk && (m.castShadow = true));
    protos.set(kind, g);
  }
  return protos.get(kind).clone();
}

const metal = () => mat(0xd4d6dc, { metalness: 0.3, roughness: 0.3 });
function cyl(rt, rb, h, color, extra, seg = 18, open = false) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), typeof color === 'object' ? color : mat(color, extra));
}
function at(m, x, y, z) {
  m.position.set(x, y, z);
  return m;
}
const flat = (m) => ((m.rotation.x = -Math.PI / 2), m);
const text = (g, t, x, y, px, color, weight = 'bold') => {
  g.fillStyle = color;
  g.font = `${weight} ${px}px Rubik, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(t, x, y);
};
// A label wrapped round a can or bottle; the front is the middle of the canvas.
function wrapTex(draw) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  draw(c.getContext('2d'), 256, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const wrapped = (r, h, draw, extra) => {
  const m = cyl(r, r, h, 0xffffff, { map: wrapTex(draw), ...extra }, 20, true);
  m.rotation.y = Math.PI; // brings the middle of the canvas to the front (+z)
  return m;
};

const BUILD = {
  bottle(g) {
    const clear = mat(0xa9dcef, { transparent: true, opacity: 0.8, roughness: 0.15 });
    g.add(at(cyl(0.12, 0.12, 0.4, clear), 0, 0.2, 0));
    g.add(at(cyl(0.045, 0.12, 0.12, clear), 0, 0.46, 0));
    g.add(at(wrapped(0.124, 0.13, (x, W, H) => {
      x.fillStyle = '#2e86c1';
      x.fillRect(0, 0, W, H);
      text(x, 'AQUA', W / 2, H / 2, 34, '#ffffff');
    }), 0, 0.2, 0));
    g.add(at(cyl(0.05, 0.05, 0.06, COLORS.blue), 0, 0.55, 0));
  },
  sachet(g) {
    g.add(at(rbox(0.56, 0.08, 0.38, 0xdcf1fb, 0.035), 0, 0.04, 0));
    const print = decal(0.5, 0.32, (x, W, H) => {
      x.fillStyle = '#2e86c1';
      x.beginPath();
      x.moveTo(0, H * 0.72);
      for (let i = 0; i <= 8; i++) x.lineTo((W * i) / 8, H * (0.72 + (i % 2 ? 0.06 : -0.06)));
      x.lineTo(W, H);
      x.lineTo(0, H);
      x.fill();
      text(x, 'PURE', W / 2, H * 0.25, H * 0.24, '#1f5f99');
      text(x, 'WATER', W / 2, H * 0.5, H * 0.24, '#1f5f99');
    }, { px: 96 });
    g.add(at(flat(print), 0, 0.082, 0));
  },
  cup(g) {
    const m = mat(0xdcecf5, { side: THREE.DoubleSide, roughness: 0.3 });
    g.add(at(cyl(0.16, 0.11, 0.34, m, null, 18, true), 0, 0.17, 0));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 6, 24), mat(0xffffff));
    rim.rotation.x = Math.PI / 2;
    g.add(at(rim, 0, 0.34, 0));
    g.add(at(wrapped(0.142, 0.07, (x, W, H) => {
      x.fillStyle = '#ca1f3f';
      x.fillRect(0, 0, W, H);
    }), 0, 0.23, 0));
    g.add(at(flat(new THREE.Mesh(new THREE.CircleGeometry(0.11, 18), m)), 0, 0.005, 0));
  },
  gallon(g) {
    g.add(at(rbox(0.32, 0.42, 0.22, 0xf2c94c, 0.06, { roughness: 0.35 }), 0, 0.21, 0));
    g.add(at(cyl(0.05, 0.05, 0.07, COLORS.red), 0.08, 0.45, 0));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.025, 8, 12, Math.PI), mat(0xf2c94c));
    g.add(at(handle, -0.06, 0.41, 0));
    const lbl = decal(0.24, 0.18, (x, W, H) => {
      x.fillStyle = '#ffffff';
      x.beginPath(); x.roundRect(0, 0, W, H, 10); x.fill();
      text(x, 'OIL', W / 2, H * 0.4, H * 0.42, '#ca1f3f');
      text(x, '1 litre', W / 2, H * 0.78, H * 0.2, '#24182e', 'normal');
    }, { px: 64 });
    g.add(at(lbl, 0, 0.2, 0.112));
  },
  rubber(g) {
    const bag = new THREE.Mesh(lumpy(0.22, 1, 0.25), mat(0x2b2730, { flatShading: true, roughness: 0.4 }));
    bag.scale.set(1.1, 0.8, 0.85);
    g.add(at(bag, 0, 0.17, 0));
    for (const x of [-0.08, 0.08]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 6, 12, Math.PI), mat(0x2b2730));
      h.rotation.y = x * 3;
      g.add(at(h, x, 0.3, 0));
    }
  },
  news(g) {
    g.add(at(rbox(0.56, 0.05, 0.4, 0xf1ede4, 0.015), 0, 0.025, 0));
    const print = decal(0.52, 0.36, (x, W, H) => {
      text(x, 'DAILY NEWS', W / 2, H * 0.12, H * 0.15, '#24182e');
      x.fillStyle = '#24182e';
      x.fillRect(W * 0.04, H * 0.22, W * 0.92, 2);
      x.fillStyle = '#9b91a4';
      x.fillRect(W * 0.05, H * 0.3, W * 0.42, H * 0.34);
      for (let i = 0; i < 9; i++) x.fillRect(W * 0.53, H * (0.3 + i * 0.07), W * 0.42, H * 0.03);
      for (let i = 0; i < 4; i++) x.fillRect(W * 0.05, H * (0.72 + i * 0.07), W * 0.42, H * 0.03);
    }, { px: 128 });
    g.add(at(flat(print), 0, 0.052, 0));
  },
  page(g) {
    g.add(at(rbox(0.42, 0.014, 0.54, 0xffffff, 0.006), 0, 0.012, 0));
    const print = decal(0.4, 0.52, (x, W, H) => {
      x.strokeStyle = '#8fb8e8';
      x.lineWidth = 2;
      for (let y = H * 0.16; y < H; y += H * 0.07) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
      x.strokeStyle = '#ca1f3f';
      x.beginPath(); x.moveTo(W * 0.16, 0); x.lineTo(W * 0.16, H); x.stroke();
      x.strokeStyle = '#24182e';
      x.lineWidth = 3;
      for (let r = 0; r < 6; r++) {
        x.beginPath();
        const y = H * (0.2 + r * 0.14);
        for (let i = 0; i < 26; i++) x.lineTo(W * (0.22 + i * 0.026 * (r % 3 ? 1 : 0.7)), y - Math.abs(Math.sin(i * 1.7 + r)) * H * 0.03);
        x.stroke();
      }
    }, { px: 128 });
    g.add(at(flat(print), 0, 0.021, 0));
  },
  box(g) {
    g.add(at(rbox(0.52, 0.36, 0.4, 0xc8955a, 0.03, { roughness: 0.9 }), 0, 0.18, 0));
    g.add(at(rbox(0.1, 0.012, 0.41, 0xe2c38f, 0.004), 0, 0.362, 0));
    const print = decal(0.42, 0.22, (x, W, H) => {
      x.strokeStyle = '#5a3b1f';
      x.fillStyle = '#5a3b1f';
      x.lineWidth = 6;
      for (const ax of [0.15, 0.32]) {
        x.beginPath(); x.moveTo(W * ax, H * 0.85); x.lineTo(W * ax, H * 0.25); x.stroke();
        x.beginPath(); x.moveTo(W * ax - 14, H * 0.38); x.lineTo(W * ax, H * 0.12); x.lineTo(W * ax + 14, H * 0.38); x.fill();
      }
      text(x, 'THIS', W * 0.7, H * 0.32, H * 0.28, '#5a3b1f');
      text(x, 'WAY UP', W * 0.7, H * 0.68, H * 0.24, '#5a3b1f');
    }, { px: 96 });
    g.add(at(print, 0, 0.19, 0.202));
  },
  bag(g) {
    g.add(at(rbox(0.34, 0.4, 0.22, 0xb9864f, 0.02, { roughness: 0.95 }), 0, 0.2, 0));
    g.add(at(rbox(0.35, 0.06, 0.23, 0x9c6c3c, 0.02), 0, 0.41, 0));
    const print = decal(0.22, 0.2, (x, W, H) => {
      x.fillStyle = '#ffbe00';
      x.beginPath(); x.arc(W / 2, H * 0.42, H * 0.3, 0, 7); x.fill();
      text(x, 'SHOP', W / 2, H * 0.42, H * 0.18, '#24182e');
    }, { px: 64 });
    g.add(at(print, 0, 0.2, 0.112));
  },
  carton(g) {
    g.add(at(rbox(0.24, 0.4, 0.22, 0xfdfcf8, 0.02, { roughness: 0.3 }), 0, 0.2, 0));
    const roof = rbox(0.24, 0.12, 0.12, 0xfdfcf8, 0.02, { roughness: 0.3 });
    roof.rotation.x = Math.PI / 4;
    g.add(at(roof, 0, 0.4, 0));
    const print = decal(0.22, 0.3, (x, W, H) => {
      x.fillStyle = '#f28c28';
      x.fillRect(0, H * 0.45, W, H * 0.55);
      x.fillStyle = '#ffbe00';
      x.beginPath(); x.arc(W / 2, H * 0.7, W * 0.22, 0, 7); x.fill();
      x.fillStyle = '#2e8b57';
      x.beginPath(); x.ellipse(W * 0.6, H * 0.5, W * 0.1, W * 0.05, -0.5, 0, 7); x.fill();
      text(x, 'JUICE', W / 2, H * 0.22, H * 0.15, '#f28c28');
    }, { px: 96 });
    g.add(at(print, 0, 0.2, 0.112));
    const straw = cyl(0.014, 0.014, 0.2, COLORS.red, null, 8);
    straw.rotation.z = 0.3;
    g.add(at(straw, 0.06, 0.52, 0));
  },
  drink(g) {
    const t = (x, W, H) => {
      x.fillStyle = '#ca1f3f';
      x.fillRect(0, 0, W, H);
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.moveTo(0, H * 0.75);
      for (let i = 0; i <= 16; i++) x.lineTo((W * i) / 16, H * (0.72 + Math.sin(i) * 0.06));
      x.lineTo(W, H * 0.85);
      x.lineTo(0, H * 0.85);
      x.fill();
      text(x, 'FIZZ', W / 2, H * 0.38, 26, '#ffffff');
    };
    g.add(at(wrapped(0.12, 0.34, t, { metalness: 0.25, roughness: 0.3 }), 0, 0.17, 0));
    g.add(at(cyl(0.105, 0.12, 0.03, metal()), 0, 0.355, 0));
    g.add(at(flat(rbox(0.06, 0.035, 0.008, 0x9aa0aa, 0.004)), 0.03, 0.372, 0));
  },
  tomato(g) {
    g.add(at(cyl(0.15, 0.15, 0.3, metal()), 0, 0.15, 0));
    g.add(at(wrapped(0.153, 0.22, (x, W, H) => {
      x.fillStyle = '#ca1f3f';
      x.fillRect(0, 0, W, H);
      x.fillStyle = '#ffbe00';
      x.fillRect(0, H * 0.82, W, H * 0.1);
      x.fillStyle = '#ff5a4e';
      x.beginPath(); x.arc(W * 0.38, H * 0.45, H * 0.24, 0, 7); x.fill();
      x.fillStyle = '#2e8b57';
      x.fillRect(W * 0.37, H * 0.16, 6, 8);
      text(x, 'TOMATO', W * 0.6, H * 0.45, 15, '#ffffff');
    }, { metalness: 0.1 }), 0, 0.15, 0));
  },
  milk(g) {
    g.add(at(cyl(0.15, 0.15, 0.2, metal()), 0, 0.1, 0));
    g.add(at(wrapped(0.153, 0.14, (x, W, H) => {
      x.fillStyle = '#2e5aa8';
      x.fillRect(0, 0, W, H);
      x.fillStyle = '#ffffff';
      x.beginPath(); x.ellipse(W / 2, H * 0.5, W * 0.12, H * 0.34, 0, 0, 7); x.fill();
      text(x, 'MILK', W / 2, H * 0.52, 16, '#2e5aa8');
    }, { metalness: 0.1 }), 0, 0.1, 0));
  },
  sardine(g) {
    g.add(at(rbox(0.44, 0.08, 0.27, 0xd4d6dc, 0.04, { metalness: 0.3, roughness: 0.3 }), 0, 0.04, 0));
    const print = decal(0.36, 0.2, (x, W, H) => {
      x.fillStyle = '#2e86c1';
      x.beginPath(); x.ellipse(W * 0.42, H * 0.58, W * 0.24, H * 0.18, 0, 0, 7); x.fill();
      x.beginPath(); x.moveTo(W * 0.64, H * 0.58); x.lineTo(W * 0.78, H * 0.4); x.lineTo(W * 0.78, H * 0.76); x.fill();
      x.fillStyle = '#ffffff';
      x.beginPath(); x.arc(W * 0.28, H * 0.54, 4, 0, 7); x.fill();
      text(x, 'SARDINES', W / 2, H * 0.18, H * 0.2, '#24182e');
    }, { px: 96 });
    g.add(at(flat(print), -0.02, 0.082, 0));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 14), mat(0x9aa0aa));
    ring.rotation.x = Math.PI / 2;
    g.add(at(ring, 0.18, 0.085, 0));
  },
  crushed(g) {
    // A drinks can squashed flat and bent: a cylinder pushed in and out.
    const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.34, 14, 4);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const s = 1 + 0.25 * Math.sin(y * 30 + pos.getX(i) * 20);
      pos.setXYZ(i, pos.getX(i) * s * 1.3, y * 0.6 + Math.sin(pos.getX(i) * 9) * 0.04, pos.getZ(i) * s * 0.55);
    }
    geo.computeVertexNormals();
    const can = new THREE.Mesh(geo, mat(COLORS.red, { flatShading: true, metalness: 0.25, roughness: 0.35 }));
    can.rotation.z = Math.PI / 2;
    can.rotation.y = 0.4;
    g.add(at(can, 0, 0.1, 0));
  },
};

// A rounded lump (rubbish sack, plastic bag): a sphere with its points pushed in and out.
function lumpy(r, detail, amount) {
  const geo = new THREE.IcosahedronGeometry(r, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let k = 0; k < pos.count; k++) {
    v.fromBufferAttribute(pos, k);
    v.multiplyScalar(1 - amount / 2 + amount * Math.abs(Math.sin(v.x * 37 + v.y * 23 + v.z * 51)));
    pos.setXYZ(k, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// The belt's rubber surface: dark with light ribs (power-of-two, so it can repeat).
function stripes() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#3b3f46';
  g.fillRect(0, 0, 64, 32);
  g.fillStyle = '#565b64';
  g.fillRect(28, 0, 8, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(18, 1);
  return t;
}

// The red, blue and white check of a "Ghana Must Go" bag.
function plaid() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f0f6';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? 'rgba(46,90,168,0.55)' : 'rgba(202,31,63,0.55)';
    g.fillRect(i * 32 + 6, 0, 14, 128);
    g.fillRect(0, i * 32 + 6, 128, 14);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const config = { camera: [3.4, 6.6, 10.5], target: [-0.7, 1.7, 0], shadowSize: 8, frame: 0.84 };

export const missions = [
  { id: 'two', text: 'Teach the robot only 2 examples, then test it. Watch it make mistakes.', hint: 'Label 2 things, then press "Let the robot sort". Taught more already? Press "Forget everything" first.' },
  { id: 'good', text: 'Teach it at least 2 examples of every kind (6 or more), then get 4 out of 5 right.', hint: 'Give it 2 Plastic, 2 Paper and 2 Cans, all labelled correctly. More examples help!' },
  { id: 'bad', text: 'Give it a wrong example on purpose, then test it and catch the mistake it learnt.', hint: 'Call a plastic bottle or sachet "Paper", then press "Let the robot sort" and watch.' },
];
