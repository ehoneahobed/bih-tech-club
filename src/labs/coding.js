// Sessions 16–17 — Block Programming: snap together blocks, run them on a 3D
// coordinate stage, use loops to save work, collect litter for points and
// step through code one block at a time to find bugs.
import { THREE, COLORS, mat, rbox, decal, label, setLabel } from './runtime.js';

const SCALE = 1 / 50; // 50 stage steps = 1 world unit (stage is 480 × 360 like Scratch)
const BLOCKS = {
  move: { text: 'move (n) steps', cat: 'motion', args: [10] },
  right: { text: 'turn ↻ (n) degrees', cat: 'motion', args: [90] },
  left: { text: 'turn ↺ (n) degrees', cat: 'motion', args: [90] },
  goto: { text: 'go to x: (n) y: (n)', cat: 'motion', args: [0, 0] },
  repeat: { text: 'repeat (n)', cat: 'control', args: [4] },
  // Scratch's repeat is one C-shaped block; 'end' is its bottom edge, shown as a row here.
  end: { text: '└ end of repeat (bottom of the C)', cat: 'control c-end', args: [] },
  penDown: { text: 'pen down', cat: 'pen', args: [] },
  penUp: { text: 'pen up', cat: 'pen', args: [] },
  say: { text: 'say (t)', cat: 'looks', args: ['Hello!'] },
};
const PRESETS = {
  'Square — the long way': [['penDown'], ['move', 100], ['right', 90], ['move', 100], ['right', 90], ['move', 100], ['right', 90], ['move', 100], ['right', 90]],
  'Square — with a loop': [['penDown'], ['repeat', 4], ['move', 100], ['right', 90], ['end']],
  'Clean-up route': [['goto', -180, 120], ['penDown'], ['repeat', 2], ['move', 360], ['right', 90], ['move', 120], ['right', 90], ['end'], ['say', 'School is clean!']],
  'Buggy star (fix me!)': [['penDown'], ['repeat', 5], ['move', 150], ['right', 72], ['end']],
};
const LITTER = [[-120, 120], [60, 120], [180, 120], [-40, 0], [140, 0], [-160, -120], [100, -110]];
const GROUND = -0.42; // the floor the board's feet stand on (the board top is y = 0)
const trailMat = new THREE.MeshBasicMaterial({ color: COLORS.purple });
const dotGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12);

export default function codingLab(stage, ui) {
  const { scene } = stage;

  // ---------- Stage ----------
  // The x / y stage is a printed board in a plum frame, on stubby feet.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(480 * SCALE, 360 * SCALE), new THREE.MeshStandardMaterial({ map: gridTexture(), roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  scene.add(floor, boardFrame());
  for (const [t, x, z] of [['x: -240', -5.3, 0], ['x: 240', 5.3, 0], ['y: 180', 0, -4.0], ['y: -180', 0, 4.0]]) {
    const l = label(t, { scale: 0.28, width: 256 });
    l.position.set(x, 0.4, z);
    scene.add(l);
  }
  const bin = litterBin();
  bin.position.set(-5.75, GROUND, 3.35);
  scene.add(bin);
  const binned = new THREE.Group(); // litter already dropped in the bin
  bin.add(binned);

  const { sprite, pen } = makeSprite();
  scene.add(sprite);
  const bubble = label('', { scale: 0.4 });
  bubble.position.y = 1.5;
  bubble.visible = false;
  sprite.add(bubble);
  const trail = new THREE.Group();
  scene.add(trail);
  const litterGroup = new THREE.Group();
  scene.add(litterGroup);

  // ---------- Callouts ----------
  // The floor is rotated flat, so its local (x, y) is the stage's (x, y) in world units.
  stage.callout(floor, { icon: '🎯', title: 'Centre (0, 0)', text: 'x: across · y: up and down', at: [0, 0, 0], dx: -140, dy: 90 });
  const spriteCard = stage.callout(sprite, { icon: '🐥', title: 'Sprite', text: '', at: [0, 0.7, 0], dx: 120, dy: -70 });
  let penCard = null;
  let scoreCard = null;
  let lastLitter = LITTER[0];
  // The score card points at the next piece of litter, or where the last one was.
  function pinScore() {
    const next = litterGroup.children[0];
    if (scoreCard && scoreCard.obj === (next ?? floor)) return;
    scoreCard?.remove();
    const [x, y] = next ? [0, 0] : lastLitter;
    scoreCard = stage.callout(next ?? floor, { icon: '🧹', title: '', at: next ? [0, 0.05, 0] : [x * SCALE, y * SCALE, 0], dx: 130, dy: -50 });
    tagScore();
  }
  function tagScore() {
    scoreCard.set(`Score: ${s.score} of ${LITTER.length}`, 'The score is a variable');
    scoreCard.card.classList.toggle('done', s.score === LITTER.length);
  }
  // place() runs every frame of a move, so only rewrite the sprite card a few times a second.
  let spriteText = '';
  let spriteAt = 0;
  let spriteTimer = 0;
  function tagSprite() {
    const t = `x: ${Math.round(s.x)}, y: ${Math.round(s.y)}`;
    if (t === spriteText) return;
    clearTimeout(spriteTimer);
    const wait = 150 - (performance.now() - spriteAt);
    if (wait > 0) return void (spriteTimer = setTimeout(tagSprite, wait));
    spriteText = t;
    spriteAt = performance.now();
    spriteCard.set('Sprite', t);
  }

  // Sprite state in stage coordinates (Scratch-style: direction 90 = facing right).
  const s = { x: 0, y: 0, dir: 90, pen: false, score: 0 };
  function place() {
    sprite.position.set(s.x * SCALE, 0, -s.y * SCALE);
    sprite.rotation.y = -(s.dir * Math.PI) / 180; // the beak points to -z ("up" the stage) at direction 0
    pen.position.y = s.pen ? 0 : 0.14; // the marker touches the board only when the pen is down
    readout.innerHTML = `x: <b>${Math.round(s.x)}</b> &nbsp; y: <b>${Math.round(s.y)}</b> &nbsp; direction: <b>${Math.round(s.dir)}°</b> &nbsp; score: <b>${s.score}</b>`;
    tagSprite();
  }
  function reset() {
    Object.assign(s, { x: 0, y: 0, dir: 90, pen: false, score: 0 });
    trail.clear();
    penCard?.remove();
    penCard = null;
    litterGroup.clear();
    binned.clear();
    LITTER.forEach(([x, y], i) => {
      const item = litterItem(i);
      item.position.set(x * SCALE, 0.02, -y * SCALE);
      item.rotation.y = (i * 2.4) % Math.PI;
      item.userData.xy = [x, y];
      litterGroup.add(item);
    });
    pinScore();
    bubble.visible = false;
    place();
  }
  function checkLitter() {
    for (const l of [...litterGroup.children]) {
      const [x, y] = l.userData.xy;
      if (Math.hypot(x - s.x, y - s.y) < 35) {
        litterGroup.remove(l);
        toBin(l);
        s.score++;
        lastLitter = [x, y];
        pinScore();
        tagScore();
      }
    }
  }

  // ---------- Program editor (HTML) ----------
  let program = [];
  const editor = ui.element('<ol class="script"></ol><p class="readout"></p>', ui.group('Your script · starts “when ▶ clicked”'));
  const list = editor.querySelector('.script');
  const readout = editor.querySelector('.readout');
  function renderProgram(active = -1) {
    let depth = 0;
    list.innerHTML = program.map((b, i) => {
      const def = BLOCKS[b[0]];
      if (b[0] === 'end') depth = Math.max(0, depth - 1);
      let n = 0;
      const html = def.text.replace(/\((n|t)\)/g, (_, k) => `<input data-i="${i}" data-a="${n++}" ${k === 'n' ? 'type="number"' : ''} value="${b[n]}" size="4">`);
      const row = `<li class="blk ${def.cat}${i === active ? ' running' : ''}" style="margin-left:${depth * 18}px">${html}<button type="button" data-del="${i}" aria-label="Remove block">✕</button></li>`;
      if (b[0] === 'repeat') depth++;
      return row;
    }).join('') || '<li class="empty">Click blocks below to add them here.</li>';
  }
  list.addEventListener('input', (e) => {
    const { i, a } = e.target.dataset;
    if (i === undefined) return;
    const def = BLOCKS[program[i][0]];
    program[i][Number(a) + 1] = typeof def.args[a] === 'number' ? Number(e.target.value) || 0 : e.target.value;
  });
  list.addEventListener('click', (e) => {
    const d = e.target.dataset.del;
    if (d !== undefined) {
      program.splice(Number(d), 1);
      renderProgram();
    }
  });

  const palette = ui.group('Blocks');
  for (const [id, def] of Object.entries(BLOCKS)) {
    const b = ui.button(def.text.replace(/\(n\)/g, def.args[0] ?? '').replace(/\(t\)/, def.args[0] ?? ''), () => {
      program.push([id, ...def.args]);
      renderProgram();
    }, { group: palette });
    b.classList.add('blk', ...def.cat.split(' '));
  }

  // ---------- Interpreter ----------
  function compile() {
    const stack = [];
    const jumps = {};
    program.forEach((b, i) => {
      if (b[0] === 'repeat') stack.push(i);
      if (b[0] === 'end') {
        if (!stack.length) throw new Error(`Block ${i + 1} is the bottom of a repeat, but there is no repeat above it.`);
        const open = stack.pop();
        jumps[open] = i;
        jumps[i] = open;
      }
    });
    if (stack.length) throw new Error(`The "repeat" at block ${stack[0] + 1} has no bottom. Add "end of repeat" after the blocks it should repeat.`);
    return jumps;
  }

  let running = false;
  let stepResolve = null;
  let stepMode = false;

  async function exec(b) {
    const [op, a, c] = b;
    if (op === 'move') {
      const x0 = s.x;
      const y0 = s.y;
      const rad = (s.dir * Math.PI) / 180;
      let x1 = x0 + Math.sin(rad) * a;
      let y1 = y0 + Math.cos(rad) * a;
      const hitEdge = Math.abs(x1) > 240 || Math.abs(y1) > 180;
      x1 = Math.max(-240, Math.min(240, x1));
      y1 = Math.max(-180, Math.min(180, y1));
      await stage.tween((k) => {
        s.x = x0 + (x1 - x0) * k;
        s.y = y0 + (y1 - y0) * k;
        checkLitter();
        place();
      }, Math.max(0.15, Math.abs(a) / 300));
      if (s.pen) drawLine(x0, y0, x1, y1);
      if (hitEdge) say('Ouch, the edge!');
    } else if (op === 'right' || op === 'left') {
      const d0 = s.dir;
      const d1 = d0 + (op === 'right' ? a : -a);
      await stage.tween((k) => {
        s.dir = d0 + (d1 - d0) * k;
        place();
      }, 0.25);
      s.dir = ((d1 % 360) + 360) % 360;
    } else if (op === 'goto') {
      const x0 = s.x;
      const y0 = s.y;
      const x1 = Math.max(-240, Math.min(240, a));
      const y1 = Math.max(-180, Math.min(180, c));
      await stage.tween((k) => {
        s.x = x0 + (x1 - x0) * k;
        s.y = y0 + (y1 - y0) * k;
        place();
      }, 0.4);
      if (s.pen) drawLine(x0, y0, x1, y1);
      checkLitter();
    } else if (op === 'penDown') s.pen = true;
    else if (op === 'penUp') s.pen = false;
    else if (op === 'say') {
      say(String(a));
      await stage.wait(0.8);
    }
    place();
  }

  // Collected litter hops in an arc into the bin and stays there, poking out of the top.
  function toBin(item) {
    const from = item.position.clone().sub(bin.position);
    const n = binned.children.length;
    const to = new THREE.Vector3(Math.sin(n * 2.1) * 0.16, 1.02 + n * 0.03, Math.cos(n * 2.1) * 0.12);
    binned.add(item);
    item.position.copy(from);
    stage.tween((k) => {
      item.position.lerpVectors(from, to, k);
      item.position.y += Math.sin(k * Math.PI) * 1.6;
      item.scale.setScalar(1.3 - 0.4 * k);
    }, 0.7);
  }

  function say(text) {
    setLabel(bubble, `💬 ${text}`);
    bubble.visible = true;
  }

  function drawLine(x0, y0, x1, y1) {
    const a = new THREE.Vector3(x0 * SCALE, 0.05, -y0 * SCALE);
    const b = new THREE.Vector3(x1 * SCALE, 0.05, -y1 * SCALE);
    const len = a.distanceTo(b);
    if (len < 0.01) return;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, len), trailMat);
    seg.position.copy(a).lerp(b, 0.5);
    seg.lookAt(b);
    seg.userData.noInk = true;
    // A round dot at the end, so corners look drawn with a marker.
    const dot = new THREE.Mesh(dotGeo, trailMat);
    dot.position.z = len / 2;
    dot.userData.noInk = true;
    seg.add(dot);
    trail.add(seg);
    // Pin the pen card to the first line drawn; reset() removes it with the trail.
    if (!penCard) {
      penCard = stage.callout(seg, { icon: '✏️', title: 'Pen trail', text: '"pen down" draws a line', dx: 110, dy: 120 });
    }
  }

  async function run(step = false) {
    stage.reveal();
    if (running) return;
    let jumps;
    try {
      jumps = compile();
    } catch (err) {
      ui.info('🐞 Bug found before running', `<p>${err.message}</p>`);
      return;
    }
    if (!program.length) return ui.info('Empty script', '<p>Add some blocks first!</p>');
    running = true;
    stepMode = step;
    reset();
    const counters = {};
    let pc = 0;
    let executed = 0;
    ui.info(step ? '🔎 Debug mode' : '▶ Running…', step ? '<p>Press <b>Next step</b> to run one block at a time. Watch the highlighted block and the x / y numbers — where does the sprite stop doing what you expected?</p>' : '<p>The computer follows your blocks <b>in order</b>, exactly as written.</p>');
    while (pc < program.length && running) {
      const b = program[pc];
      renderProgram(pc);
      if (stepMode) await new Promise((r) => (stepResolve = r));
      if (!running) break;
      if (b[0] === 'repeat') {
        counters[pc] = counters[pc] ?? b[1];
        if (counters[pc] <= 0) {
          delete counters[pc];
          pc = jumps[pc] + 1;
          continue;
        }
        counters[pc]--;
      } else if (b[0] === 'end') {
        pc = jumps[pc];
        continue;
      } else {
        await exec(b);
        executed++;
      }
      pc++;
    }
    renderProgram();
    const finished = running;
    running = false;
    // In Scratch the bottom of a repeat is part of the repeat block, so don't count it.
    const blocks = program.filter((b) => b[0] !== 'end').length;
    if (finished) {
      ui.complete('run');
      if (program.some((b) => b[0] === 'repeat')) ui.complete('loop');
      if (step) ui.complete('debug');
      const turns = program.filter((b) => b[0] === 'right' || b[0] === 'left');
      if (turns.some((b) => b[1] === 144) && trail.children.length >= 5) ui.complete('star');
      if (s.score === LITTER.length) ui.complete('litter');
    }
    ui.info('✅ Finished', `<p>Your script has <b>${blocks}</b> blocks but the sprite carried out <b>${executed}</b> actions${program.some((b) => b[0] === 'repeat') ? ' — that is the power of a <b>loop</b>!' : '. Could a <b>repeat</b> loop make it shorter?'}</p>${s.score ? `<p>🧹 Litter collected: <b>${s.score}</b> of ${LITTER.length}. The <b>score</b> is a <b>variable</b> — a box that remembers a number.</p>` : ''}`);
  }

  const runG = ui.group('Run');
  ui.button('▶ Run', () => run(false), { primary: true, group: runG });
  ui.button('🔎 Debug (step by step)', () => run(true), { group: runG });
  ui.button('⏭ Next step', () => stepResolve?.(), { group: runG });
  ui.button('⏹ Stop', () => {
    running = false;
    stepResolve?.();
  }, { group: runG });
  ui.button('🧽 Clear script', () => {
    program = [];
    renderProgram();
    reset();
  }, { group: runG });

  const pre = ui.group('Example scripts');
  for (const [name, blocks] of Object.entries(PRESETS))
    ui.button(name, () => {
      program = blocks.map((b) => [...b]);
      renderProgram();
      reset();
      ui.info(name, name.startsWith('Buggy')
        ? '<p>This is meant to draw a 5-pointed star, but it draws a pentagon! Use <b>Debug</b> to step through it. Hint: for a star, each turn must be <b>144°</b>, not 72°.</p>'
        : name.includes('loop')
          ? '<p>Same square, but only <b>4 Scratch blocks</b> instead of 9 (the repeat is one C-shaped block that wraps around the blocks inside it). Loops save you hours of work — like pounding fufu: repeat the same action until done.</p>'
          : name.includes('Clean')
            ? '<p>Can you change the route so the sprite picks up <b>all 7</b> pieces of litter? Edit the numbers and run again.</p>'
            : '<p>Nine blocks, lots of repetition. Can you spot the pattern that repeats?</p>');
    }, { group: pre });

  program = PRESETS['Square — with a loop'].map((b) => [...b]);
  renderProgram();
  reset();
  ui.info('Code the sprite', '<p>An <b>algorithm</b> is a list of steps in the right order — like the kelewele recipe. Add blocks, press <b>Run</b>, and watch the sprite follow them on the x / y stage.</p>');
}

// ---------- Models ----------
// The board under the printed stage: a base, a raised plum frame and four feet.
function boardFrame() {
  const g = new THREE.Group();
  const W = 480 * SCALE;
  const D = 360 * SCALE;
  const base = rbox(W + 0.5, 0.3, D + 0.5, COLORS.blue, 0.08);
  base.position.y = -0.15;
  g.add(base);
  for (const [w, d, x, z] of [[W + 0.5, 0.2, 0, -D / 2 - 0.15], [W + 0.5, 0.2, 0, D / 2 + 0.15], [0.2, D + 0.1, -W / 2 - 0.15, 0], [0.2, D + 0.1, W / 2 + 0.15, 0]]) {
    const rail = rbox(w, 0.14, d, COLORS.purple, 0.05);
    rail.position.set(x, 0.05, z);
    g.add(rail);
  }
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, -GROUND - 0.3, 12), mat(COLORS.purple));
    foot.position.set(x * (W / 2 - 0.1), (GROUND - 0.3) / 2, z * (D / 2 - 0.1));
    foot.castShadow = true;
    g.add(foot);
  }
  // A printed name plate on the front edge of the base.
  const plate = decal(3.2, 0.2, (c, w, h) => {
    c.fillStyle = '#FFBE00';
    c.font = `bold ${h * 0.7}px Rubik, system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('SCRATCH STAGE  ·  480 × 360 STEPS', w / 2, h / 2 + 2);
  }, { px: 64 });
  plate.position.set(0, -0.15, D / 2 + 0.252);
  g.add(plate);
  return g;
}

// A little chick with big eyes, a beak that shows which way it faces, feet,
// and a marker pen held under its belly (lowered for "pen down").
function makeSprite() {
  const sprite = new THREE.Group();
  const gold = mat(COLORS.gold);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), gold);
  body.scale.set(1, 0.92, 1.05);
  body.position.y = 0.66;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), gold);
  head.position.set(0, 1.0, -0.13);
  head.castShadow = true;
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 12), mat(COLORS.red));
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 0.97, -0.39);
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), mat(COLORS.red));
  tuft.position.set(0, 1.25, -0.08);
  tuft.rotation.x = -0.3;
  sprite.add(body, head, beak, tuft);
  for (const x of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), mat(0xffffff));
    eye.position.set(x * 0.08, 1.05, -0.29);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), mat(COLORS.purple));
    pupil.position.set(x * 0.08, 1.05, -0.35);
    pupil.userData.noInk = true;
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat(0xf0a500));
    wing.scale.set(0.35, 0.8, 1);
    wing.position.set(x * 0.29, 0.68, 0.02);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), mat(COLORS.red));
    leg.position.set(x * 0.13, 0.22, 0);
    const foot = rbox(0.12, 0.05, 0.2, COLORS.red, 0.02);
    foot.position.set(x * 0.13, 0.045, -0.05);
    sprite.add(eye, pupil, wing, leg, foot);
  }
  // A floor arrow: the sprite's "direction", printed on the board under it.
  const arrow = decal(0.5, 0.8, (c, w, h) => {
    c.fillStyle = 'rgba(202,31,63,0.85)';
    c.beginPath();
    c.moveTo(w / 2, 0);
    c.lineTo(w, h * 0.42);
    c.lineTo(w * 0.68, h * 0.42);
    c.lineTo(w * 0.68, h);
    c.lineTo(w * 0.32, h);
    c.lineTo(w * 0.32, h * 0.42);
    c.lineTo(0, h * 0.42);
    c.closePath();
    c.fill();
  }, { px: 64 });
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(0, 0.03, -0.45);
  sprite.add(arrow);
  // The marker: white barrel, plum cap and tip (the same colour as the trail).
  const pen = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.34, 12), mat(0xffffff));
  barrel.position.y = 0.26;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 12), mat(COLORS.purple));
  cap.position.y = 0.44;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 12), mat(COLORS.purple));
  tip.rotation.x = Math.PI;
  tip.position.y = 0.06;
  pen.add(barrel, cap, tip);
  sprite.add(pen);
  sprite.scale.setScalar(1.2);
  return { sprite, pen };
}

// Seven pieces of litter, made from four kinds: water sachets, bottles, paper balls and a can.
function litterItem(i) {
  const g = new THREE.Group();
  const kind = ['sachet', 'bottle', 'paper', 'sachet', 'can', 'paper', 'bottle'][i % 7];
  if (kind === 'sachet') {
    const bag = rbox(0.36, 0.07, 0.26, 0xcdeefc, 0.03);
    bag.position.y = 0.035;
    const print = decal(0.3, 0.2, (c, w, h) => {
      c.fillStyle = '#2e86c1';
      c.fillRect(0, h * 0.62, w, h * 0.2);
      c.font = `bold ${h * 0.26}px Rubik, system-ui, sans-serif`;
      c.textAlign = 'center';
      c.fillText('PURE', w / 2, h * 0.3);
      c.fillText('WATER', w / 2, h * 0.56);
    }, { px: 64 });
    print.rotation.x = -Math.PI / 2;
    print.position.y = 0.072;
    g.add(bag, print);
  } else if (kind === 'bottle') {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.3, 14), mat(0xa9dcef, { transparent: true, opacity: 0.85, roughness: 0.2 }));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.11, 14), mat(COLORS.red));
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.075, 0.08, 14), body.material);
    neck.position.y = 0.19;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 10), mat(COLORS.blue));
    cap.position.y = 0.25;
    b.add(body, band, neck, cap);
    b.rotation.z = Math.PI / 2; // lying on its side
    b.position.y = 0.075;
    g.add(b);
  } else if (kind === 'paper') {
    // A crumpled ball: an icosphere with its corners pushed in and out.
    const geo = new THREE.IcosahedronGeometry(0.12, 1);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, k);
      v.multiplyScalar(0.8 + 0.4 * Math.abs(Math.sin(v.x * 91 + v.y * 57 + v.z * 23)));
      pos.setXYZ(k, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const ball = new THREE.Mesh(geo, mat(0xf4f1ea, { flatShading: true }));
    ball.position.y = 0.11;
    ball.rotation.set(0.4, 0.8, 0.2);
    g.add(ball);
  } else {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.22, 14), mat(COLORS.red, { metalness: 0.3 }));
    can.rotation.z = Math.PI / 2;
    can.position.y = 0.065;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.04, 14), mat(0xd9d9d9, { metalness: 0.5 }));
    ring.position.y = 0.09;
    can.add(ring);
    g.add(can);
  }
  g.scale.setScalar(1.3);
  return g;
}

// A tapered green bin with a rim and a recycling sign, standing beside the board.
function litterBin() {
  const g = new THREE.Group();
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 1.0, 20, 1, true), mat(0x2e8b57, { side: THREE.DoubleSide }));
  can.position.y = 0.5;
  can.castShadow = true;
  const floorDisc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), mat(0x1f5f3b));
  floorDisc.rotation.x = -Math.PI / 2;
  floorDisc.position.y = 0.02;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24), mat(0x1f5f3b));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.0;
  const sign = decal(0.4, 0.4, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
    c.fill();
    c.font = `${h * 0.62}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#2e8b57';
    c.fillText('♻', w / 2, h * 0.53);
  }, { px: 96 });
  sign.position.set(0, 0.55, 0.392);
  sign.rotation.x = -0.08;
  g.add(can, floorDisc, rim, sign);
  return g;
}

// The printed stage: a grid every 20 steps, darker lines every 100, red x and
// y axes with arrows and numbers (2 canvas pixels = 1 stage step).
function gridTexture() {
  const c = document.createElement('canvas');
  c.width = 960;
  c.height = 720;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 960, 720);
  const lines = (step, color, width) => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    for (let x = 480 % step; x <= 960; x += step) g.moveTo(x, 0), g.lineTo(x, 720);
    for (let y = 360 % step; y <= 720; y += step) g.moveTo(0, y), g.lineTo(960, y);
    g.stroke();
  };
  lines(40, '#ece6f2', 2);
  lines(200, '#cfc3dc', 3);
  g.strokeStyle = '#CA1F3F';
  g.fillStyle = '#CA1F3F';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(480, 6);
  g.lineTo(480, 720);
  g.moveTo(0, 360);
  g.lineTo(954, 360);
  g.stroke();
  for (const [x, y, a] of [[954, 360, 0], [480, 6, -Math.PI / 2]]) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.beginPath();
    g.moveTo(6, 0);
    g.lineTo(-18, -11);
    g.lineTo(-18, 11);
    g.fill();
    g.restore();
  }
  g.font = 'bold 22px Rubik, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'top';
  for (const v of [-200, -100, 100, 200]) g.fillText(v, 480 + v * 2, 368);
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  for (const v of [-100, 100]) g.fillText(v, 490, 360 - v * 2);
  g.font = 'bold 30px Rubik, system-ui, sans-serif';
  g.fillText('x', 924, 334);
  g.fillText('y', 496, 22);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export const config = { camera: [0, 6.6, 9], target: [0, 0, 0.3], shadowSize: 8, maxPolar: Math.PI * 0.45, groundY: GROUND, frame: 1.06 };

export const missions = [
  { id: 'run', text: 'Press ▶ Run and watch the sprite draw a square.', hint: 'The sprite follows the blocks in order, from top to bottom.' },
  { id: 'loop', text: 'Load "Square — the long way", then "Square — with a loop". Which is shorter?', hint: 'A repeat loop does the same job with fewer blocks.' },
  { id: 'debug', text: 'Load "Buggy star" and run it in Debug mode, step by step.', hint: 'Press "Debug", then "Next step" again and again. Watch the numbers.' },
  { id: 'star', text: 'Fix the bug so the sprite draws a 5-pointed star.', hint: 'Change the turn from 72 to 144 degrees, then Run.' },
  { id: 'litter', text: 'Change the clean-up route so the sprite collects ALL 7 pieces of litter.', hint: 'Look at the x and y of each piece. You can add "go to x: y:" blocks.' },
];
