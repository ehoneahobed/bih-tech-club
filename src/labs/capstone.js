// Sessions 18–20 — Capstone: "building the whole house". Each project stage
// adds a part of a 3D house: charter = foundation, prototype v0.1 = walls,
// user testing = roof, polish v1.1 = paint + door + flag, then a timed
// 3-minute pitch on stage. Progress is saved so teams continue next session.
import { THREE, COLORS, box, mat, label, setLabel } from './runtime.js';

const KEY = 'bih-capstone-project';
const TRACKS = {
  A: { name: 'School Health & Environment', icon: '🌿', builds: 'A 1-page campaign notice (Word) + a 3-slide pitch (PowerPoint)' },
  B: { name: 'Market & Canteen Bookkeeper', icon: '📊', builds: 'An inventory table with SUM/AVERAGE formulas + a column chart comparing items (or a pie chart of each item\'s share of the total)' },
  C: { name: 'Interactive Educational Game', icon: '🎮', builds: 'A playable Scratch game or quiz with a score variable and restart loop' },
  D: { name: 'Culture & Community Tourism', icon: '🏛️', builds: 'A researched report with citations + a photo/slide guide' },
};
const ROLES = ['Project Manager', 'Designer / Builder', 'Researcher / Tester', 'Presenter'];
// The same three acts as the Session 20 workbook (180 seconds in all).
const PITCH = [
  { part: 'Act 1: The Hook & Problem', secs: 30, tip: 'Introduce the team, grab attention with a question or a surprising fact, and name the real Ghanaian challenge.' },
  { part: 'Act 2: Live Digital Demonstration', secs: 90, tip: 'Show it working. Point at the screen and explain each step. The demo always takes longer than you think.' },
  { part: 'Act 3: Bug Fix & Call to Action', secs: 60, tip: 'Explain one real bug from your Change Log that you fixed after testing, then finish with a clear call to action.' },
];
const POLISH = ['Spell check done on everything', 'Every team member\'s name is on the title', 'Formulas start with = (spreadsheets)', 'Pictures resized from the corner handles', 'Sources cited (in a footer or last slide)', 'No real private data: only fictional names and numbers', 'Final file saved as …_v1.1'];
const blank = () => ({ team: '', track: '', problem: '', who: '', roles: ['', '', '', ''], folder: '', file: '', tests: [], polish: [], speakers: PITCH.map(() => ''), pitched: false });

export default function capstoneLab(stage, ui) {
  const { scene } = stage;
  let p = load();

  // ---------- The house ----------
  const site = box(7, 0.1, 6, 0x95d5b2);
  site.position.y = 0.05;
  scene.add(site);
  const foundation = box(5, 0.4, 4, 0x8d99ae);
  foundation.position.y = 0.3;
  const walls = new THREE.Group();
  const wallMat = mat(0xe9d8a6);
  for (const [w, d, x, z] of [[5, 0.25, 0, -1.88], [0.25, 4, -2.38, 0], [0.25, 4, 2.38, 0], [1.9, 0.25, -1.55, 1.88], [1.9, 0.25, 1.55, 1.88]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, d), wallMat);
    m.position.set(x, 1.7, z);
    m.castShadow = true;
    walls.add(m);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.25), wallMat);
  lintel.position.set(0, 2.65, 1.88);
  walls.add(lintel);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.2, 4), mat(0xbc4749));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 4.0;
  roof.castShadow = true;
  const extras = new THREE.Group();
  const door = box(1.0, 1.8, 0.08, 0x6f4518);
  door.position.set(0, 1.4, 1.95);
  const win1 = box(0.9, 0.7, 0.06, 0x90e0ef, { emissive: 0x1d3557 });
  win1.position.set(-1.55, 2.0, 1.98);
  const win2 = win1.clone();
  win2.position.x = 1.55;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2), mat(0x495057));
  pole.position.set(0, 6.0, 0);
  const flag = box(0.8, 0.5, 0.02, COLORS.gold);
  flag.position.set(0.42, 6.7, 0);
  extras.add(door, win1, win2, pole, flag);
  scene.add(foundation, walls, roof, extras);
  const sign = label('Our project', { scale: 0.5 });
  sign.position.set(0, 0.9, 3.4);
  scene.add(sign);

  // The Demo Day stage beside the house.
  const platform = box(4, 0.4, 2.5, 0x3a0ca3);
  platform.position.set(-6.5, 0.2, 1);
  scene.add(platform);
  const spot = new THREE.SpotLight(0xffe8a3, 0, 12, 0.5, 0.4);
  spot.position.set(-6.5, 7, 3);
  spot.target.position.set(-6.5, 0, 1);
  scene.add(spot, spot.target);
  const timerTag = label('3:00', { scale: 0.8, width: 256 });
  timerTag.position.set(-6.5, 2.6, 1);
  scene.add(timerTag);
  const presenters = [0, 1, 2, 3].map((i) => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 12), mat([COLORS.gold, COLORS.green, COLORS.blue, COLORS.red][i]));
    b.position.y = 0.85;
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0x8d5524));
    h.position.y = 1.5;
    g.add(b, h);
    g.position.set(-7.85 + i * 0.9, 0.4, 1);
    scene.add(g);
    return g;
  });

  const targets = new Map(); // object -> target scale
  stage.onTick((dt) => {
    for (const [o, t] of targets) {
      const s = o.scale.y + (t - o.scale.y) * Math.min(1, dt * 4);
      o.scale.set(o === walls || o === roof || o === extras ? 1 : s, s, o === walls || o === roof || o === extras ? 1 : s);
      if (o === walls || o === roof || o === extras) o.scale.y = s;
      o.visible = s > 0.02;
    }
  });
  function show(o, on) {
    if (!targets.has(o)) {
      o.scale.y = 0.001;
      o.visible = false;
    }
    targets.set(o, on ? 1 : 0.001);
  }

  // ---------- Stage checks ----------
  const charterDone = () => p.team.trim() && p.track && words(p.problem) >= 8 && p.who.trim() && p.roles.filter((r) => r.trim()).length >= 3;
  const fileOk = (n) => /^[A-Za-z0-9]+(_[A-Za-z0-9.]+)+$/.test(n) && /v0\.1/i.test(n) && !/[\\/:*?"<>|\s]/.test(n);
  const protoDone = () => p.folder.trim() && !/\s/.test(p.folder) && fileOk(p.file);
  const testDone = () => p.tests.filter((t) => t.bug.trim() && t.fix.trim()).length >= 2;
  const polishDone = () => p.polish.length === POLISH.length;
  function words(s) {
    return s.trim().split(/\s+/).filter(Boolean).length;
  }

  function refresh() {
    show(foundation, !!charterDone());
    show(walls, !!(charterDone() && protoDone()));
    show(roof, !!(charterDone() && protoDone() && testDone()));
    show(extras, !!(charterDone() && protoDone() && testDone() && polishDone()));
    setLabel(sign, p.team.trim() ? `${TRACKS[p.track]?.icon ?? ''} ${p.team}` : 'Our project');
    if (charterDone()) ui.complete('charter');
    if (charterDone() && protoDone()) ui.complete('proto');
    if (charterDone() && protoDone() && testDone()) ui.complete('test');
    if (charterDone() && protoDone() && testDone() && polishDone()) ui.complete('polish');
    stepper.querySelectorAll('[data-step]').forEach((b) => {
      const ok = [charterDone, protoDone, testDone, polishDone, () => p.pitched][b.dataset.step]();
      b.classList.toggle('ok', !!ok);
    });
    save();
  }

  // ---------- Step panels ----------
  const STEPS = ['1 · Charter', '2 · Prototype', '3 · Test', '4 · Polish', '5 · Pitch'];
  const stepper = ui.element(`<div class="stepper">${STEPS.map((s, i) => `<button type="button" class="lab-btn" data-step="${i}">${s}</button>`).join('')}</div><div class="step-pane"></div>`, ui.group('Build your project, step by step'));
  const pane = stepper.querySelector('.step-pane');
  let step = 0;
  stepper.addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]');
    if (s) openStep(Number(s.dataset.step));
  });

  function openStep(i) {
    step = i;
    stepper.querySelectorAll('[data-step]').forEach((b) => b.classList.toggle('active', Number(b.dataset.step) === i));
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    if (i === 0) {
      pane.innerHTML = `
        <label class="lab-field">Team name <input data-k="team" value="${esc(p.team)}" placeholder="e.g. Clean Water Champions"></label>
        <p class="field-label">Choose ONE track</p>
        <div class="track-grid">${Object.entries(TRACKS).map(([k, t]) => `<button type="button" class="track${p.track === k ? ' active' : ''}" data-track="${k}"><b>${t.icon} Track ${k}</b>${t.name}<small>${t.builds}</small></button>`).join('')}</div>
        <label class="lab-field">Who has the problem? <input data-k="who" value="${esc(p.who)}" placeholder="e.g. Pupils at our school"></label>
        <label class="lab-field">What is the problem? (at least 8 words) <textarea data-k="problem" rows="3" placeholder="e.g. Open water drums let mosquitoes breed, so pupils get malaria and miss lessons.">${esc(p.problem)}</textarea></label>
        <p class="field-label">Team roles (everyone has a job)</p>
        ${ROLES.map((r, j) => `<label class="lab-field inline-field">${r} <input data-role="${j}" value="${esc(p.roles[j])}" placeholder="First name"></label>`).join('')}`;
      info('The Project Charter = the foundation', '<p>Every strong house starts with a strong foundation. Agree as a team on your <b>track</b>, the <b>problem</b> and <b>who</b> it affects, and give everyone a <b>role</b>. Keep it manageable: one problem, one product.</p>');
    }
    if (i === 1) {
      pane.innerHTML = `
        <label class="lab-field">Project folder name <input data-k="folder" value="${esc(p.folder)}" placeholder="e.g. Capstone_EcoTech"></label>
        <label class="lab-field">First saved file name <input data-k="file" value="${esc(p.file)}" placeholder="e.g. Capstone_v0.1_CleanWater.docx"></label>
        <p class="check ${protoDone() ? 'good' : 'bad'}">${protoDone() ? '✅ Folder and file follow the BIH naming standard' : '⚠️ Use underscores (no spaces), no symbols like / : * ?, and include v0.1 in the file name'}</p>`;
      info('Prototype v0.1 = the walls', '<p>A <b>prototype</b> is a rough first version, like a cardboard model of a house. Make your project folder, then save a first "skeleton" file. It does not need to be pretty yet!</p>');
    }
    if (i === 2) {
      const rows = p.tests.length ? p.tests : [{ bug: '', fix: '' }, { bug: '', fix: '' }];
      p.tests = rows;
      pane.innerHTML = `
        <p class="field-label">Change log: what did your testers find, and how did you fix it?</p>
        ${rows.map((t, j) => `<div class="test-row"><input data-bug="${j}" value="${esc(t.bug)}" placeholder="Problem ${j + 1}, e.g. Total row was in the chart"><input data-fix="${j}" value="${esc(t.fix)}" placeholder="How we fixed it"></div>`).join('')}
        <button type="button" class="lab-btn" data-addtest>+ Add another fix</button>`;
      info('User testing = the roof', '<p>You cannot test your own work. Ask another team to <b>use</b> your project while you watch quietly and take notes. Every fix you make protects your project, like a roof keeps out the rain. Record at least <b>2 fixes</b>.</p>');
    }
    if (i === 3) {
      pane.innerHTML = POLISH.map((x, j) => `<label class="inline"><input type="checkbox" data-pol="${j}"${p.polish.includes(j) ? ' checked' : ''}> ${x}</label>`).join('');
      info('Polish v1.1 = paint, doors and windows', '<p>Now make it shine. Go through the checklist together as a team. When everything is ticked, raise your flag!</p>');
    }
    if (i === 4) {
      const names = p.roles.filter((r) => r.trim());
      pane.innerHTML = `
        <p class="field-label">Who speaks in each part? Everyone should have a voice.</p>
        ${PITCH.map((s, j) => `<label class="lab-field inline-field">${s.part} <small>(${s.secs}s)</small> <select data-spk="${j}"><option value="">Choose…</option>${names.map((n) => `<option${p.speakers[j] === n ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`).join('')}
        <div class="btns-inline"><button type="button" class="lab-btn primary" data-pitch>▶ Practise the 3-minute pitch</button><button type="button" class="lab-btn" data-card>🖨 Print our project card</button></div>`;
      info('Demo Day pitch', `<p>Your 3-minute pitch has ${PITCH.length} acts, with a different speaker for each if you can:</p><ol>${PITCH.map((s) => `<li><b>${s.part}</b> (${s.secs}s): ${s.tip}</li>`).join('')}</ol>${names.length ? '' : '<p>⚠️ Add team names in the Charter step first.</p>'}`);
    }
  }

  pane.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.k) p[t.dataset.k] = t.value;
    if (t.dataset.role !== undefined) p.roles[t.dataset.role] = t.value;
    if (t.dataset.bug !== undefined) p.tests[t.dataset.bug].bug = t.value;
    if (t.dataset.fix !== undefined) p.tests[t.dataset.fix].fix = t.value;
    if (t.dataset.spk !== undefined) p.speakers[t.dataset.spk] = t.value;
    refresh();
    if (step === 1) {
      const c = pane.querySelector('.check');
      c.className = `check ${protoDone() ? 'good' : 'bad'}`;
      c.textContent = protoDone() ? '✅ Folder and file follow the BIH naming standard' : '⚠️ Use underscores (no spaces), no symbols like / : * ?, and include v0.1 in the file name';
    }
  });
  pane.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.pol !== undefined) {
      const j = Number(t.dataset.pol);
      p.polish = t.checked ? [...new Set([...p.polish, j])] : p.polish.filter((x) => x !== j);
    }
    if (t.dataset.spk !== undefined) p.speakers[t.dataset.spk] = t.value;
    refresh();
  });
  pane.addEventListener('click', (e) => {
    const tr = e.target.closest('[data-track]');
    if (tr) {
      p.track = tr.dataset.track;
      refresh();
      openStep(0);
    }
    if (e.target.closest('[data-addtest]')) {
      p.tests.push({ bug: '', fix: '' });
      openStep(2);
    }
    if (e.target.closest('[data-pitch]')) pitch();
    if (e.target.closest('[data-card]')) printCard();
  });

  // ---------- Pitch practice ----------
  let pitching = false;
  async function pitch() {
    if (pitching) return;
    pitching = true;
    spot.intensity = 60;
    let t = 180;
    for (let j = 0; j < PITCH.length && pitching; j++) {
      const s = PITCH[j];
      const who = p.speakers[j] || 'someone';
      const idx = Math.max(0, p.roles.indexOf(p.speakers[j]));
      presenters.forEach((g, k) => (g.position.z = k === idx ? 1.6 : 1));
      info(`🎤 ${s.part}: ${who}`, `<p><b>${s.tip}</b></p><p>Time for this part: ${s.secs} seconds. (Practice mode: each second goes 4× faster.)</p>`);
      for (let k = 0; k < s.secs && pitching; k++) {
        // A real timer, not animation frames: those pause when the 3D view is scrolled off-screen.
        await new Promise((r) => setTimeout(r, 250));
        t--;
        setLabel(timerTag, `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, { width: 256, color: t < 30 ? '#E63946' : '#3A0CA3' });
      }
    }
    presenters.forEach((g) => (g.position.z = 1));
    spot.intensity = 0;
    if (pitching) {
      p.pitched = true;
      ui.complete('pitch');
      const allSpeak = new Set(p.speakers.slice(0, PITCH.length).filter(Boolean)).size >= Math.min(2, p.roles.filter((r) => r.trim()).length);
      info('👏 Time! That was 3:00 exactly.', `<p>${allSpeak ? 'Great, more than one person spoke.' : '⚠️ Try to give more team members a speaking part.'}</p><p>Now practise it for real with a stopwatch. Tip: the live demo always takes longer than you think, so rehearse it twice.</p>`);
      stage.confetti();
      refresh();
    }
    pitching = false;
    setLabel(timerTag, '3:00', { width: 256 });
  }

  function printCard() {
    const w = window.open('', '_blank');
    if (!w) return info('Pop-up blocked', '<p>Allow pop-ups for this site to print your project card.</p>');
    const t = TRACKS[p.track];
    const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${e(p.team)} · Project card</title>
      <body style="font-family:Arial,sans-serif;max-width:720px;margin:30px auto;color:#1E1E24">
      <h1 style="color:#3A0CA3;margin-bottom:0">${e(p.team || 'Our team')}</h1>
      <p style="margin-top:4px">BIH JHS Tech Club · Capstone project card</p>
      <h3>${t ? `${t.icon} Track ${p.track}: ${t.name}` : 'Track: not chosen'}</h3>
      <p><b>Who has the problem:</b> ${e(p.who)}</p><p><b>The problem:</b> ${e(p.problem)}</p>
      <p><b>Team:</b> ${p.roles.map((r, i) => (r ? `${e(r)} (${ROLES[i]})` : '')).filter(Boolean).join(', ')}</p>
      <p><b>Files:</b> ${e(p.folder)} / ${e(p.file)}</p>
      <h3>Change log</h3><ul>${p.tests.filter((x) => x.bug).map((x) => `<li>${e(x.bug)} → ${e(x.fix)}</li>`).join('')}</ul>
      <h3>Pitch plan (3 minutes)</h3><ol>${PITCH.map((s, i) => `<li>${s.part} (${s.secs}s): ${e(p.speakers[i] || '—')}</li>`).join('')}</ol>
      <script>print()<\/script></body>`);
    w.document.close();
  }

  // ---------- Saving ----------
  function load() {
    try {
      return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    } catch {
      return blank();
    }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {}
  }
  function info(t, h) {
    ui.info(t, h);
  }

  const tools = ui.group('');
  ui.button('🗑 Start a new project', () => {
    if (!confirm('Clear this team\'s saved project on this computer?')) return;
    p = blank();
    refresh();
    openStep(0);
  }, { group: tools });

  refresh();
  openStep([charterDone, protoDone, testDone, polishDone].findIndex((f) => !f()) === -1 ? 4 : [charterDone, protoDone, testDone, polishDone].findIndex((f) => !f()));
}

export const missions = [
  { id: 'charter', text: 'Step 1: complete your Project Charter.', hint: 'Team name, a track, who has the problem, the problem (8+ words) and a role for every member (at least 3). Watch the foundation appear!' },
  { id: 'proto', text: 'Step 2: name your folder and first v0.1 file correctly.', hint: 'Example: folder Capstone_EcoTech, file Capstone_v0.1_CleanWater.docx' },
  { id: 'test', text: 'Step 3: record at least 2 fixes from user testing.', hint: 'Ask another team to try your project. Write what went wrong and how you fixed it.' },
  { id: 'polish', text: 'Step 4: tick every item on the polish checklist.', hint: 'When everything is done, your house gets its door, windows and flag.' },
  { id: 'pitch', text: 'Step 5: give each part a speaker and practise the 3-minute pitch.', hint: 'Everyone should have a voice on Demo Day.' },
];

export const config = { camera: [4, 8, 13], target: [-1.5, 2, 0.5], shadowSize: 12, maxDistance: 30 };
