// Session 15 — Online Safety: build a password fortress. Longer passphrases
// stack more bricks; then send the "guessing robot" to attack the wall.
import { THREE, COLORS, box, mat, rbox, decal } from './runtime.js';

const COMMON = ['password', '123456', '12345678', 'qwerty', 'abc123', 'letmein', 'iloveyou', 'admin', 'welcome', 'football', 'ghana', 'blackstars', 'jesus', 'princess', 'monkey', '111111', '000000', 'password1'];
const SEQUENCES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const GUESSES_PER_SECOND = 1e10; // a fast offline cracking rig

export function strength(pw) {
  if (!pw) return { bits: 0, notes: [] };
  const notes = [];
  const lower = pw.toLowerCase();
  if (COMMON.some((c) => lower.replace(/[^a-z0-9]/g, '').startsWith(c))) {
    notes.push('Starts with one of the most common passwords in the world — robots try these first.');
    return { bits: Math.min(10, pw.length), notes };
  }
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  let bits = pw.length * Math.log2(pool);

  // Passphrases: estimate by words drawn from a ~7,000-word vocabulary.
  // Words split by spaces, - _ . or CamelCase (ChalkMangoBicycle) all count.
  const words = pw.trim().split(/[\s\-_.]+|(?<=[a-z])(?=[A-Z])/).filter((w) => w.length >= 3);
  if (words.length >= 3) {
    bits = Math.min(bits, words.length * 12.8 + (/[0-9]/.test(pw) ? 3 : 0) + (/[^a-zA-Z0-9\s\-_.]/.test(pw) ? 4 : 0));
    notes.push(`Passphrase spotted: ${words.length} words. Length beats complexity!`);
  }
  for (const s of SEQUENCES)
    for (let i = 0; i + 4 <= s.length; i++)
      if (lower.includes(s.slice(i, i + 4))) {
        bits -= 12;
        notes.push(`Contains a keyboard or number sequence ("${s.slice(i, i + 4)}…").`);
        i = s.length;
      }
  if (/(.)\1\1/.test(pw)) {
    bits -= 8;
    notes.push('Repeats the same character three times.');
  }
  if (/^[A-Z][a-z]+[0-9]{1,4}[!@#$]?$/.test(pw)) {
    bits = Math.min(bits, 28);
    notes.push('Follows the "Word + numbers" pattern that robots try early.');
  }
  if (pw.length < 8) notes.push('Shorter than 8 characters.');
  return { bits: Math.max(1, Math.round(bits)), notes };
}

export function crackTime(bits) {
  const seconds = Math.pow(2, bits) / 2 / GUESSES_PER_SECOND;
  const units = [['years', 31557600], ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]];
  if (seconds < 1) return { seconds, text: 'instantly' };
  if (seconds > 31557600 * 1e9) return { seconds, text: 'more than a billion years' };
  for (const [u, s] of units)
    if (seconds >= s) {
      const v = seconds / s;
      return { seconds, text: `about ${v >= 1000 ? Math.round(v).toLocaleString() : v.toFixed(v < 10 ? 1 : 0)} ${u}` };
    }
}

export default function passwordLab(stage, ui) {
  const { scene } = stage;
  const ROWS = 12;
  scene.add(buildGround());
  scene.add(buildFortress());

  // Bricks share one geometry and one speckled material; odd rows start and
  // end with a half brick, like a real bond. The grey core behind is the mortar.
  const brickMat = mat(COLORS.red, { map: speckles(), roughness: 0.8 });
  const fullGeo = rbox(0.95, 0.45, 0.8, 0, 0.05).geometry;
  const halfGeo = rbox(0.44, 0.45, 0.8, 0, 0.05).geometry;
  const bricks = [];
  for (let r = 0; r < ROWS; r++) {
    const xs = r % 2 ? [-3.28, ...[0, 1, 2, 3, 4, 5].map((c) => (c - 2.5) * 1.02), 3.28] : [0, 1, 2, 3, 4, 5, 6].map((c) => (c - 3) * 1.02);
    xs.forEach((x, c) => {
      const half = r % 2 && (c === 0 || c === xs.length - 1);
      const b = new THREE.Mesh(half ? halfGeo : fullGeo, brickMat);
      b.castShadow = b.receiveShadow = true;
      b.position.set(x, 12, 0);
      b.visible = false;
      b.userData = { row: r, rest: 0.25 + r * 0.47 };
      scene.add(b);
      bricks.push(b);
    });
  }
  const mortar = box(6.9, 1, 0.62, 0xd9d3de);
  mortar.geometry.translate(0, 0.5, 0);
  mortar.scale.y = 0.001;
  scene.add(mortar);
  let mortarH = 0;

  const { bot, arms, screen: botScreen, bulb } = buildRobot();
  const home = new THREE.Vector3(0, 0.6, -4.5);
  bot.position.copy(home);
  scene.add(bot);

  const treasure = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), mat(COLORS.gold, { emissive: COLORS.gold, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.2 }));
  treasure.scale.y = 1.25;
  treasure.position.set(0, 1.25, 3);
  treasure.castShadow = true;
  scene.add(treasure);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.5, 20), mat(0xc4bfca));
  plinth.position.set(0, 0.25, 3);
  plinth.castShadow = plinth.receiveShadow = true;
  scene.add(plinth);

  // The chest screen flicks through guesses; after an attack it shows the result.
  let shown = { text: '', until: 0 };
  let nextGuess = 0;
  stage.onTick((dt, t) => {
    treasure.rotation.y += dt;
    bot.position.x = attacking ? bot.position.x : Math.sin(t * 1.3) * 0.6;
    arms.forEach((a, i) => (a.rotation.x = Math.sin(t * (attacking ? 14 : 3) + i * Math.PI) * (attacking ? 0.8 : 0.25)));
    bulb.material.emissiveIntensity = 0.4 + Math.abs(Math.sin(t * 4)) * 0.8;
    for (const b of bricks) {
      const target = b.visible ? b.userData.rest : 12;
      b.position.y += (target - b.position.y) * Math.min(1, dt * 8);
    }
    const goal = Math.max(0, Math.min(ROWS, Math.ceil(current.bits / 7)) * 0.47 - 0.03);
    mortarH += (goal - mortarH) * Math.min(1, dt * 4);
    mortar.scale.y = Math.max(0.001, mortarH);
    mortar.visible = mortarH > 0.02;
    if (t > shown.until && t > nextGuess) {
      nextGuess = t + (attacking ? 0.06 : 0.35);
      botScreen(guess(), '#2EC4B6');
    }
  });
  const showResult = (text, color) => {
    shown = { text, until: Infinity }; // held until the next guessing round
    botScreen(text, color, true);
  };
  const resumeGuessing = () => (shown.until = 0);

  const panel = ui.element(`
    <label class="lab-field">Try a <b>practice</b> password (never your real one!)
      <input type="text" autocomplete="off" spellcheck="false" placeholder="e.g. five random words">
    </label>
    <div class="meter"><span></span></div>
    <p class="crack"></p>`, ui.group('Build your fortress'));
  const input = panel.querySelector('input');
  const bar = panel.querySelector('.meter span');
  const crack = panel.querySelector('.crack');

  // ---------- Callouts ----------
  // The wall card rides on the bottom-middle brick, so it shows once the wall exists.
  const cards = {
    account: stage.callout(treasure, { icon: '💎', title: 'Your account', text: 'The treasure the robot wants', at: [0, 0.6, 0], dx: -170, dy: -60 }),
    bot: stage.callout(bot, { icon: '🤖', title: 'Guessing robot', text: '10 billion guesses every second', at: [0, 0.6, 0], dx: 130, dy: 90, onClick: () => sendRobot() }),
    wall: stage.callout(bricks[3], { icon: '🧱', title: 'Password wall', at: [0, 0.22, 0], dx: -110, dy: 85 }),
  };

  let current = { bits: 0, notes: [] };
  function update() {
    current = strength(input.value);
    const rows = Math.min(ROWS, Math.ceil(current.bits / 7));
    const hue = Math.min(1, current.bits / 70);
    const col = new THREE.Color().setHSL(hue * 0.33, 0.75, 0.5);
    bricks.forEach((b) => (b.visible = b.userData.row < rows));
    brickMat.color.copy(col);
    bar.style.width = `${Math.min(100, (current.bits / 80) * 100)}%`;
    bar.style.background = `#${col.getHexString()}`;
    const t = crackTime(current.bits);
    cards.wall.set(`Wall: ${current.bits} bits`, t.text === 'instantly' ? 'Cracked instantly!' : `Robot needs ${t.text}`);
    crack.innerHTML = input.value ? `A robot guessing 10 billion times a second needs <b>${t.text}</b>.` : '';
    ui.info(`Strength: ${current.bits} bits`, input.value
      ? (current.notes.length ? `<ul>${current.notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : '<p>Nice — no obvious patterns found.</p>') + '<p>Every extra character multiplies the guesses needed. <b>Five random words</b> beat a short jumble of symbols.</p>'
      : '<p>Start typing. Each row of bricks is about 7 "bits" of strength.</p>');
  }
  input.addEventListener('input', () => {
    resumeGuessing();
    update();
  });

  let attacking = false;
  const g = ui.group('Test it');
  async function sendRobot() {
    if (attacking) return;
    if (!input.value) return ui.info('Type a practice password first', '<p>The robot needs something to attack! Try one of the examples below.</p>');
    attacking = true;
    const { seconds, text } = crackTime(current.bits);
    const wins = seconds < 86400 * 30; // cracked within a month
    const wallTop = 0.25 + Math.min(ROWS, Math.ceil(current.bits / 7)) * 0.47;
    const start = bot.position.clone();
    resumeGuessing();
    const turn = (from, to) => (k) => (bot.rotation.y = from + (to - from) * Math.min(1, k * 3));
    if (wins) {
      const over = new THREE.Vector3(0, 0.6, 1.9);
      const face = turn(0, Math.PI);
      await stage.tween((k) => {
        face(k);
        bot.position.lerpVectors(start, over, k);
        bot.position.y = 0.6 + Math.sin(k * Math.PI) * (wallTop + 1.2);
      }, 1.2);
      ui.complete('weak');
      showResult('CRACKED!', '#CA1F3F');
      ui.info('💥 Cracked!', `<p>The robot got in after <b>${text}</b>. Make your passphrase <b>longer</b> — add another unusual word.</p>`);
      await stage.wait(1.2);
    } else {
      const hit = new THREE.Vector3(0, 0.6, -0.8);
      const face = turn(0, Math.PI);
      await stage.tween((k) => {
        face(k);
        bot.position.lerpVectors(start, hit, k);
      }, 0.5);
      showResult('BLOCKED', '#FFBE00');
      const back = turn(Math.PI, Math.PI * 2);
      await stage.tween((k) => {
        back(k);
        bot.position.lerpVectors(hit, home, k);
        bot.position.y = 0.6 + Math.sin(k * Math.PI) * 1.2;
      }, 0.7);
      ui.complete('wall');
      if (input.value.trim().split(/[\s\-_.]+/).filter((w) => w.length >= 3).length >= 5) ui.complete('five');
      ui.info('🛡️ The wall held!', `<p>The robot would need <b>${text}</b>. Now keep it secret: never share it, don't reuse it on other sites, and turn on 2-step verification when you can.</p>`);
    }
    bot.rotation.y = 0;
    bot.position.copy(home);
    attacking = false;
  }
  ui.button('🤖 Send the robot!', sendRobot, { primary: true, group: g });
  const ex = ui.group('Compare examples');
  for (const sample of ['password123', 'Kwame2012', 'T#9k!', 'mango-trotro-sunrise-42', 'mango trotro sunrise kente jollof'])
    ui.button(sample, () => {
      input.value = sample;
      update();
    }, { group: ex });

  update();
}

export const config = { camera: [7, 6, -9], target: [0, 2, 0], shadowSize: 9, groundY: -0.2 };

export const missions = [
  { id: 'weak', text: 'Try "password123" and send the robot. Watch it break in!', hint: 'Click the "password123" example, then "Send the robot!".' },
  { id: 'wall', text: 'Build a wall that the robot CANNOT break.', hint: 'Make it long. Join several unusual words together.' },
  { id: 'five', text: 'Make your own passphrase of 5 words that holds the robot back.', hint: 'Example idea: pick 5 random things you can see right now. Never use your real password here!' },
];

// ---------- Fortress models ----------
const STONE = 0xc4bfca;

// A pinch of grit so the bricks read as fired clay; tinted by the material colour.
function speckles() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 120; i++) {
    g.fillStyle = `rgba(36,24,46,${0.03 + Math.random() * 0.06})`;
    g.fillRect(Math.random() * 128, Math.random() * 64, 2 + Math.random() * 3, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A sandy island with a beaten path from the robot to the gate.
function buildGround() {
  const g = new THREE.Group();
  const grass = rbox(9.6, 0.2, 12.4, 0xe4dccd, 0.08);
  grass.position.set(0, -0.1, -0.4);
  const path = decal(1.8, 11.6, (c, w, h) => {
    c.fillStyle = '#d3c3a0';
    c.beginPath();
    c.roundRect(w * 0.1, 0, w * 0.8, h, w * 0.3);
    c.fill();
    c.fillStyle = 'rgba(120,90,50,0.25)';
    for (let i = 0; i < 90; i++) c.fillRect(w * 0.15 + Math.random() * w * 0.7, Math.random() * h, 4, 3);
  }, { px: 64 });
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.003, -0.5);
  g.add(grass, path);
  return g;
}

// The account's castle: a keep with a barred gate between two round towers.
function buildFortress() {
  const g = new THREE.Group();
  const keep = rbox(3.2, 2.0, 1.4, STONE, 0.05);
  keep.position.y = 1.0;
  g.add(keep);
  for (let i = 0; i < 5; i++) {
    const merlon = box(0.36, 0.34, 0.3, STONE);
    merlon.position.set(-1.4 + i * 0.7, 2.17, -0.55);
    g.add(merlon);
  }
  const gate = decal(1.0, 1.4, (c, w, h) => {
    c.fillStyle = '#4a2f1c';
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, w / 2);
    c.arc(w / 2, w / 2, w / 2, Math.PI, 0);
    c.lineTo(w, h);
    c.fill();
    c.strokeStyle = '#FFBE00';
    c.lineWidth = 10;
    for (let x = w / 6; x < w; x += w / 6) c.strokeRect(x, w * 0.2, 0, h);
    for (let y = w * 0.45; y < h; y += h / 5) c.strokeRect(0, y, w, 0);
    c.fillStyle = '#FFBE00';
    c.beginPath();
    c.arc(w / 2, h * 0.62, w * 0.09, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#24182E';
    c.fillRect(w / 2 - 6, h * 0.62, 12, h * 0.1); // keyhole
  }, { px: 128 });
  gate.rotation.y = Math.PI; // faces the robot
  gate.position.set(0, 0.7, -0.703);
  g.add(gate);
  for (const x of [-1.9, 1.9]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 2.8, 20), mat(STONE));
    tower.position.set(x, 1.4, 0);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.62, 0.3, 20), mat(STONE));
    crown.position.set(x, 2.95, 0);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.0, 20), mat(COLORS.red));
    roof.position.set(x, 3.6, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6), mat(COLORS.purple));
    pole.position.set(x, 4.35, 0);
    const flag = box(0.4, 0.24, 0.02, COLORS.gold);
    flag.position.set(x + 0.21, 4.5, 0);
    const slit = box(0.1, 0.4, 0.02, COLORS.purple);
    slit.position.set(x, 1.9, -0.6);
    g.add(tower, crown, roof, pole, flag, slit);
  }
  g.traverse((m) => m.isMesh && (m.castShadow = m.receiveShadow = true));
  g.position.set(0, 0, 4.6);
  return g;
}

// A friendly robot: big eyes, antenna, waving arms, tracks and a chest screen.
function buildRobot() {
  const outer = new THREE.Group();
  const bot = new THREE.Group(); // built at 1 unit, shown a little larger
  bot.scale.setScalar(1.25);
  bot.position.y = 0.15;
  outer.add(bot);
  const shell = 0xe9e5ec;
  const body = rbox(0.95, 0.72, 0.7, shell, 0.12);
  body.position.y = -0.08;
  const head = rbox(0.8, 0.52, 0.6, shell, 0.14);
  head.position.y = 0.58;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12), mat(COLORS.blue));
  neck.position.y = 0.3;
  bot.add(body, head, neck);
  for (const x of [-0.42, 0.42]) {
    const track = rbox(0.24, 0.3, 0.8, 0x2b2730, 0.1);
    track.position.set(x, -0.45, 0);
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12), mat(COLORS.blue));
    ear.rotation.z = Math.PI / 2;
    ear.position.set(x * 1.0, 0.58, 0);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), mat(0xffffff));
    eye.scale.z = 0.5;
    eye.position.set(x * 0.4, 0.63, -0.29);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(COLORS.purple, { emissive: 0x2ec4b6, emissiveIntensity: 0.5 }));
    pupil.position.set(x * 0.4, 0.63, -0.335);
    bot.add(track, ear, eye, pupil);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 14, Math.PI), mat(COLORS.purple));
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.5, -0.3);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3), mat(0x2b2730));
  stalk.position.y = 0.98;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), mat(COLORS.gold, { emissive: COLORS.gold }));
  bulb.position.y = 1.16;
  bot.add(smile, stalk, bulb);
  // Arms swing from the shoulders.
  const arms = [-0.55, 0.55].map((x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.12, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 10), mat(COLORS.blue));
    arm.position.y = -0.21;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat(0x2b2730));
    hand.position.y = -0.46;
    pivot.add(arm, hand);
    bot.add(pivot);
    return pivot;
  });
  const screen = decal(0.66, 0.4, () => {}, { px: 128, transparent: false });
  screen.rotation.y = Math.PI; // the robot's front faces -z
  screen.position.set(0, -0.06, -0.352);
  bot.add(screen);
  bot.traverse((m) => m.isMesh && (m.castShadow = true));
  const cv = screen.material.map.image;
  const draw = (text, color, big = false) => {
    const g = cv.getContext('2d');
    g.fillStyle = '#1b1220';
    g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.font = 'bold 22px Consolas, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (!big) g.fillText('TRYING…', cv.width / 2, cv.height * 0.25);
    g.fillStyle = color;
    let px = big ? 48 : 36;
    do g.font = `bold ${px}px Consolas, monospace`;
    while (g.measureText(text).width > cv.width - 16 && (px -= 2) > 12);
    g.fillText(text, cv.width / 2, cv.height * (big ? 0.5 : 0.62));
    screen.material.map.needsUpdate = true;
  };
  return { bot: outer, arms, screen: draw, bulb };
}

// The robot's next guess: a common password, a word plus digits, or a jumble.
function guess() {
  const r = Math.random();
  if (r < 0.45) return COMMON[Math.floor(Math.random() * COMMON.length)];
  if (r < 0.75) return COMMON[Math.floor(Math.random() * 12)] + Math.floor(Math.random() * 999);
  const abc = 'abcdefghijkmnopqrstuvwxyz0123456789!#';
  return Array.from({ length: 6 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
}
