// Sessions 16–17 — Block Programming: snap together blocks, run them on a 3D
// coordinate stage, use loops to save work, collect litter for points and
// step through code one block at a time to find bugs.
import { THREE, COLORS, box, mat, label, setLabel } from './runtime.js';

const SCALE = 1 / 50; // 50 stage steps = 1 world unit (stage is 480 × 360 like Scratch)
const BLOCKS = {
  move: { text: 'move (n) steps', cat: 'motion', args: [10] },
  right: { text: 'turn ↻ (n) degrees', cat: 'motion', args: [90] },
  left: { text: 'turn ↺ (n) degrees', cat: 'motion', args: [90] },
  goto: { text: 'go to x: (n) y: (n)', cat: 'motion', args: [0, 0] },
  repeat: { text: 'repeat (n)', cat: 'control', args: [4] },
  end: { text: 'end repeat', cat: 'control', args: [] },
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

export default function codingLab(stage, ui) {
  const { scene } = stage;

  // ---------- Stage ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(480 * SCALE, 360 * SCALE), new THREE.MeshStandardMaterial({ map: gridTexture(), roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  scene.add(floor);
  for (const [t, x, z] of [['x: -240', -5.3, 0], ['x: 240', 5.3, 0], ['y: 180', 0, -4.0], ['y: -180', 0, 4.0], ['(0, 0)', 0.6, 0.35]]) {
    const l = label(t, { scale: 0.28, width: 256 });
    l.position.set(x, 0.4, z);
    scene.add(l);
  }

  const sprite = new THREE.Group();
  const bodyM = box(0.6, 0.6, 0.6, COLORS.gold);
  bodyM.position.y = 0.4;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 16), mat(COLORS.purple));
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.45, -0.45);
  for (const x of [-0.14, 0.14]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0x111111));
    eye.position.set(x, 0.55, -0.31);
    sprite.add(eye);
  }
  sprite.add(bodyM, nose);
  scene.add(sprite);
  const bubble = label('', { scale: 0.4 });
  bubble.position.y = 1.4;
  bubble.visible = false;
  sprite.add(bubble);

  const trail = new THREE.Group();
  scene.add(trail);
  const litterGroup = new THREE.Group();
  scene.add(litterGroup);

  // Sprite state in stage coordinates (Scratch-style: direction 90 = facing right).
  const s = { x: 0, y: 0, dir: 90, pen: false, score: 0 };
  function place() {
    sprite.position.set(s.x * SCALE, 0, -s.y * SCALE);
    sprite.rotation.y = -(s.dir * Math.PI) / 180; // the nose points to -z ("up" the stage) at direction 0
    readout.innerHTML = `x: <b>${Math.round(s.x)}</b> &nbsp; y: <b>${Math.round(s.y)}</b> &nbsp; direction: <b>${Math.round(s.dir)}°</b> &nbsp; score: <b>${s.score}</b>`;
  }
  function reset() {
    Object.assign(s, { x: 0, y: 0, dir: 90, pen: false, score: 0 });
    trail.clear();
    litterGroup.clear();
    for (const [x, y] of LITTER) {
      const sachet = box(0.35, 0.08, 0.25, 0x4cc9f0);
      sachet.position.set(x * SCALE, 0.08, -y * SCALE);
      sachet.rotation.y = Math.random() * Math.PI;
      sachet.userData.xy = [x, y];
      litterGroup.add(sachet);
    }
    bubble.visible = false;
    place();
  }
  function checkLitter() {
    for (const l of [...litterGroup.children]) {
      const [x, y] = l.userData.xy;
      if (Math.hypot(x - s.x, y - s.y) < 35) {
        litterGroup.remove(l);
        s.score++;
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
    b.classList.add('blk', def.cat);
  }

  // ---------- Interpreter ----------
  function compile() {
    const stack = [];
    const jumps = {};
    program.forEach((b, i) => {
      if (b[0] === 'repeat') stack.push(i);
      if (b[0] === 'end') {
        if (!stack.length) throw new Error(`Block ${i + 1} is an "end repeat" with no repeat above it.`);
        const open = stack.pop();
        jumps[open] = i;
        jumps[i] = open;
      }
    });
    if (stack.length) throw new Error(`The "repeat" at block ${stack[0] + 1} has no "end repeat". Every loop needs a closing block.`);
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

  function say(text) {
    setLabel(bubble, `💬 ${text}`);
    bubble.visible = true;
  }

  function drawLine(x0, y0, x1, y1) {
    const a = new THREE.Vector3(x0 * SCALE, 0.05, -y0 * SCALE);
    const b = new THREE.Vector3(x1 * SCALE, 0.05, -y1 * SCALE);
    const len = a.distanceTo(b);
    if (len < 0.01) return;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, len), new THREE.MeshBasicMaterial({ color: COLORS.purple }));
    seg.position.copy(a).lerp(b, 0.5);
    seg.lookAt(b);
    trail.add(seg);
  }

  async function run(step = false) {
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
    const blocks = program.length;
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
          ? '<p>Same square, but only <b>5 blocks</b> instead of 9. Loops save you hours of work — like pounding fufu: repeat the same action until done.</p>'
          : name.includes('Clean')
            ? '<p>Can you change the route so the sprite picks up <b>all 7</b> pieces of litter? Edit the numbers and run again.</p>'
            : '<p>Nine blocks, lots of repetition. Can you spot the pattern that repeats?</p>');
    }, { group: pre });

  program = PRESETS['Square — with a loop'].map((b) => [...b]);
  renderProgram();
  reset();
  ui.info('Code the sprite', '<p>An <b>algorithm</b> is a list of steps in the right order — like the kelewele recipe. Add blocks, press <b>Run</b>, and watch the sprite follow them on the x / y stage.</p>');
}

function gridTexture() {
  const c = document.createElement('canvas');
  c.width = 960;
  c.height = 720;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 960, 720);
  g.strokeStyle = '#e3e7ff';
  g.lineWidth = 2;
  for (let x = 0; x <= 960; x += 40) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 720);
    g.stroke();
  }
  for (let y = 0; y <= 720; y += 40) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(960, y);
    g.stroke();
  }
  g.strokeStyle = '#4361EE';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(480, 0);
  g.lineTo(480, 720);
  g.moveTo(0, 360);
  g.lineTo(960, 360);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const config = { camera: [0, 8, 7.5], target: [0, 0, 0.3], shadowSize: 7, maxPolar: Math.PI * 0.45 };

export const missions = [
  { id: 'run', text: 'Press ▶ Run and watch the sprite draw a square.', hint: 'The sprite follows the blocks in order, from top to bottom.' },
  { id: 'loop', text: 'Load "Square — the long way", then "Square — with a loop". Which is shorter?', hint: 'A repeat loop does the same job with fewer blocks.' },
  { id: 'debug', text: 'Load "Buggy star" and run it in Debug mode, step by step.', hint: 'Press "Debug", then "Next step" again and again. Watch the numbers.' },
  { id: 'star', text: 'Fix the bug so the sprite draws a 5-pointed star.', hint: 'Change the turn from 72 to 144 degrees, then Run.' },
  { id: 'litter', text: 'Change the clean-up route so the sprite collects ALL 7 pieces of litter.', hint: 'Look at the x and y of each piece. You can add "go to x: y:" blocks.' },
];
