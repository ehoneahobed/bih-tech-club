// Session 15 — Online Safety: build a password fortress. Longer passphrases
// stack more bricks; then send the "guessing robot" to attack the wall.
import { THREE, COLORS, box, mat } from './runtime.js';

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
  const PER = 7;
  const bricks = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < PER; c++) {
      const b = box(0.95, 0.45, 0.8, COLORS.red);
      b.position.set(-3.2 + c * 1.02 + (r % 2 ? 0.5 : 0), 12, 0);
      b.visible = false;
      b.userData = { row: r, rest: 0.25 + r * 0.47 };
      scene.add(b);
      bricks.push(b);
    }

  const bot = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), mat(0x495057, { metalness: 0.4 }));
  body.castShadow = true;
  bot.add(body);
  for (const x of [-0.22, 0.22]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), mat(COLORS.red, { emissive: COLORS.red }));
    eye.position.set(x, 0.15, -0.52);
    bot.add(eye);
  }
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5), mat(0x212529));
  ant.position.y = 0.8;
  bot.add(ant);
  const home = new THREE.Vector3(0, 0.6, -4.5);
  bot.position.copy(home);
  scene.add(bot);

  const treasure = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), mat(COLORS.gold, { emissive: COLORS.gold, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.2 }));
  treasure.position.set(0, 0.8, 3);
  treasure.castShadow = true;
  scene.add(treasure);
  stage.onTick((dt, t) => {
    treasure.rotation.y += dt;
    bot.position.x = attacking ? bot.position.x : Math.sin(t * 1.3) * 0.6;
    for (const b of bricks) {
      const target = b.visible ? b.userData.rest : 12;
      b.position.y += (target - b.position.y) * Math.min(1, dt * 8);
    }
  });

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
    bricks.forEach((b) => {
      b.visible = b.userData.row < rows;
      b.material.color.copy(col);
    });
    bar.style.width = `${Math.min(100, (current.bits / 80) * 100)}%`;
    bar.style.background = `#${col.getHexString()}`;
    const t = crackTime(current.bits);
    cards.wall.set(`Wall: ${current.bits} bits`, t.text === 'instantly' ? 'Cracked instantly!' : `Robot needs ${t.text}`);
    crack.innerHTML = input.value ? `A robot guessing 10 billion times a second needs <b>${t.text}</b>.` : '';
    ui.info(`Strength: ${current.bits} bits`, input.value
      ? (current.notes.length ? `<ul>${current.notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : '<p>Nice — no obvious patterns found.</p>') + '<p>Every extra character multiplies the guesses needed. <b>Five random words</b> beat a short jumble of symbols.</p>'
      : '<p>Start typing. Each row of bricks is about 7 "bits" of strength.</p>');
  }
  input.addEventListener('input', update);

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
    if (wins) {
      const over = new THREE.Vector3(0, 0.6, 2.2);
      await stage.tween((k) => {
        bot.position.lerpVectors(start, over, k);
        bot.position.y = 0.6 + Math.sin(k * Math.PI) * (wallTop + 1.2);
      }, 1.2);
      ui.complete('weak');
      ui.info('💥 Cracked!', `<p>The robot got in after <b>${text}</b>. Make your passphrase <b>longer</b> — add another unusual word.</p>`);
      await stage.wait(1.2);
    } else {
      const hit = new THREE.Vector3(0, 0.6, -0.8);
      await stage.tween((k) => bot.position.lerpVectors(start, hit, k), 0.5);
      await stage.tween((k) => {
        bot.position.lerpVectors(hit, home, k);
        bot.position.y = 0.6 + Math.sin(k * Math.PI) * 1.2;
      }, 0.7);
      ui.complete('wall');
      if (input.value.trim().split(/[\s\-_.]+/).filter((w) => w.length >= 3).length >= 5) ui.complete('five');
      ui.info('🛡️ The wall held!', `<p>The robot would need <b>${text}</b>. Now keep it secret: never share it, don't reuse it on other sites, and turn on 2-step verification when you can.</p>`);
    }
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

export const config = { camera: [7, 6, -9], target: [0, 2, 0], shadowSize: 8 };

export const missions = [
  { id: 'weak', text: 'Try "password123" and send the robot. Watch it break in!', hint: 'Click the "password123" example, then "Send the robot!".' },
  { id: 'wall', text: 'Build a wall that the robot CANNOT break.', hint: 'Make it long. Join several unusual words together.' },
  { id: 'five', text: 'Make your own passphrase of 5 words that holds the robot back.', hint: 'Example idea: pick 5 random things you can see right now. Never use your real password here!' },
];
