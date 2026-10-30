// Sessions 20–22 — Capstone: "building the whole house". Each project stage
// adds a part of a 3D house: charter = foundation, prototype v0.1 = walls,
// user testing = roof, polish v1.1 = paint + door + flag, then a timed
// 3-minute pitch on stage. Progress is saved so teams continue next session.
import { THREE, COLORS, box, mat, rbox, cable, decal, label, setLabel } from './runtime.js';

const KEY = 'bih-capstone-project';
const TRACKS = {
  A: { name: 'School Health & Environment', icon: '🌿', builds: 'A 1-page campaign notice (Word) + a 3-slide pitch (PowerPoint)' },
  B: { name: 'Market & Canteen Bookkeeper', icon: '📊', builds: 'An inventory table with SUM/AVERAGE formulas + a column chart comparing items (or a pie chart of each item\'s share of the total)' },
  C: { name: 'Interactive Educational Game', icon: '🎮', builds: 'A playable Scratch game or quiz with a score variable and restart loop' },
  D: { name: 'Culture & Community Tourism', icon: '🏛️', builds: 'A researched report with citations + a photo/slide guide' },
};
const ROLES = ['Project Manager', 'Designer / Builder', 'Researcher / Tester', 'Presenter'];
// The same three acts as the Session 22 workbook (180 seconds in all).
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
  // The compound (always there): grass with a laterite path, a mango tree,
  // a water tank and a signboard. The house parts appear step by step.
  const site = rbox(8.4, 0.1, 7, 0x8cc084, 0.04);
  site.position.y = 0.05;
  const lawn = decal(8.3, 6.9, drawLawn, { px: 512 });
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.102;
  scene.add(site, lawn, mangoTree(3.3, -2.55), polytank(-3.45, -1.7));
  const signpost = signboard();
  signpost.position.set(-2.3, 0.1, 3.0);
  scene.add(signpost);

  // Step 1: a concrete slab with a porch and two steps up to the door.
  const foundation = new THREE.Group();
  foundation.position.y = 0.1;
  const slab = rbox(5.2, 0.4, 4.2, 0xa7a9ac, 0.04);
  slab.position.y = 0.2;
  foundation.add(slab);
  for (const [h, z] of [[0.27, 2.25], [0.13, 2.55]]) {
    const st = rbox(1.6, h, 0.3, 0xb8babd, 0.03);
    st.position.set(0, h / 2, z);
    foundation.add(st);
  }

  // Step 2: sandcrete block walls (a tiled block texture, sized per face).
  const walls = new THREE.Group();
  const wallMat = mat(RAW, { map: blockTexture() });
  for (const [w, d, x, z] of [[5, 0.25, 0, -1.88], [0.25, 4, -2.38, 0], [0.25, 4, 2.38, 0], [1.9, 0.25, -1.55, 1.88], [1.9, 0.25, 1.55, 1.88]]) {
    const m = blockBox(w, 2.4, d, wallMat);
    m.position.set(x, 1.7, z);
    walls.add(m);
  }
  const lintel = blockBox(1.2, 0.5, 0.25, wallMat);
  lintel.position.set(0, 2.65, 1.88);
  walls.add(lintel);

  // Step 3: a gable roof of ridged longspan sheets, with block gables,
  // fascia boards and a ridge cap. The group sits on the wall tops.
  const roof = new THREE.Group();
  roof.position.y = 2.9;
  const pitchAngle = Math.atan2(ROOF_H, 2);
  const sheetMat = mat(0xb8323f, { side: THREE.DoubleSide, roughness: 0.45, metalness: 0.2 });
  for (const side of [1, -1]) {
    const sheet = new THREE.Mesh(corrugated(5.9, 2.4 / Math.cos(pitchAngle)), sheetMat);
    sheet.castShadow = true;
    sheet.rotation.x = pitchAngle - Math.PI / 2;
    const pivot = new THREE.Group();
    pivot.rotation.y = side > 0 ? 0 : Math.PI;
    sheet.position.y = ROOF_H + 0.05;
    pivot.add(sheet);
    const fascia = rbox(5.95, 0.16, 0.05, COLORS.purple, 0.02);
    fascia.position.set(0, ROOF_H + 0.02 - 2.4 * Math.tan(pitchAngle), 2.42);
    pivot.add(fascia);
    for (const x of [-2.97, 2.97]) {
      const barge = rbox(0.05, 0.14, 2.4 / Math.cos(pitchAngle), COLORS.purple, 0.02);
      barge.rotation.x = pitchAngle;
      barge.position.set(x, ROOF_H + 0.02 - 1.2 * Math.tan(pitchAngle), 1.2);
      pivot.add(barge);
    }
    roof.add(pivot);
    const gable = new THREE.Mesh(gableGeometry(), wallMat);
    gable.rotation.y = Math.PI / 2;
    gable.position.x = side > 0 ? 2.25 : -2.5;
    gable.castShadow = true;
    roof.add(gable);
  }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6, 10), mat(0x8f2431, { roughness: 0.4, metalness: 0.2 }));
  ridge.rotation.z = Math.PI / 2;
  ridge.position.y = ROOF_H + 0.1;
  roof.add(ridge);

  // Step 4: a painted band, a wooden door, louvre windows and the club flag.
  const extras = new THREE.Group();
  for (const [w, d, x, z] of [[5.06, 0.03, 0, -2.015], [0.03, 4.06, -2.515, 0], [0.03, 4.06, 2.515, 0], [1.92, 0.03, -1.56, 2.015], [1.92, 0.03, 1.56, 2.015]]) {
    const band = box(w, 0.55, d, 0x8c3b2e);
    band.position.set(x, 0.78, z);
    extras.add(band);
  }
  const door = woodenDoor();
  door.position.set(0, 0.5, 1.9);
  extras.add(door);
  for (const [x, z, ry] of [[-1.55, 2.0, 0], [1.55, 2.0, 0], [2.5, 0, Math.PI / 2], [-2.5, 0, -Math.PI / 2]]) {
    const w = louvreWindow();
    w.position.set(x, 1.95, z);
    w.rotation.y = ry;
    extras.add(w);
  }
  const { pole, flag } = flagpole();
  pole.position.set(-3.55, 0.1, 2.3);
  extras.add(pole);
  scene.add(foundation, walls, roof, extras);
  const sign = label('Our project', { scale: 0.5 });
  sign.position.set(0, 0.88, 0.07);
  signpost.add(sign);

  // The Demo Day stage beside the house.
  const platform = rbox(4, 0.4, 2.5, COLORS.purple, 0.05);
  platform.position.set(-6.5, 0.2, 1);
  scene.add(platform);
  const { group: demo, slide, timerBoard, mic, lamps } = demoStage();
  scene.add(demo);
  const spot = new THREE.SpotLight(0xffe8a3, 0, 12, 0.5, 0.4);
  spot.position.set(-6.5, 7, 3);
  spot.target.position.set(-6.5, 0, 1);
  scene.add(spot, spot.target);
  const timerTag = label('3:00', { scale: 0.7, bg: '#1b1222', color: '#FFBE00' });
  timerTag.position.set(0, 0, 0.08);
  timerBoard.add(timerTag);
  const presenters = [0, 1, 2, 3].map((i) => {
    const g = presenter(i);
    g.position.set(-7.85 + i * 0.9, 0.4, 1);
    scene.add(g);
    return g;
  });
  let slideTeam = null;
  function drawScreen() {
    const team = p.team.trim();
    if (team === slideTeam) return;
    slideTeam = team;
    const tex = slide.material.map;
    drawSlide(tex.image.getContext('2d'), tex.image.width, tex.image.height, team, TRACKS[p.track]);
    tex.needsUpdate = true;
  }

  // Polish paints the raw grey blocks cream; the flag waves.
  let painted = false;
  const paint = new THREE.Color();
  stage.onTick((dt, t) => {
    paint.set(painted ? PAINT : RAW);
    wallMat.color.lerp(paint, Math.min(1, dt * 3));
    waveFlag(flag, t);
  });

  // ---------- Callouts ----------
  // One card per built part, one where the next part goes and one on the pitch
  // stage. Clicking a card opens that step.
  const PARTS = [
    [foundation, '🧱', [2.6, 0.4, 1.6], 110, 60],
    [walls, '🏗️', [2.5, 1.5, -0.9], 150, 10],
    [roof, '🧪', [1.6, 0.6, 1.2], 170, -30],
    [extras, '🚩', [-3.1, 4.0, 2.3], 150, -105],
  ];
  const DONE = ['Step 1 done: foundation', 'Step 2 done: the walls', 'Step 3 done: the roof', 'Step 4 done: flag raised'];
  // Where the next part will go, what to do to build it, and the card offset.
  const NEXT = [
    [[0, 0.1, 1.6], 'Fill in the charter to lay the foundation', 130, 60],
    [[-1.6, 0.5, 1.6], 'Save a v0.1 file to put up the walls', 60, 110],
    [[-1.6, 2.9, 1.9], 'Record 2 fixes to put on the roof', -110, -110],
    [[0, 1.4, 1.95], 'Tick the checklist to add the door', 20, 130],
  ];
  // Cards are made and removed here (not just hidden) as parts come and go.
  const cards = [];
  let nextCard = null;
  let next = -1;
  const pitchCard = stage.callout(platform, { icon: '🎤', at: [0, 0.2, 1.25], dx: -40, dy: 75, onClick: () => openStep(4) });
  function tagCards(built) {
    PARTS.forEach(([obj, icon, at, dx, dy], i) => {
      if (built[i] && !cards[i]) {
        cards[i] = stage.callout(obj, { icon, title: STEPS[i], text: DONE[i], at, dx, dy, onClick: () => openStep(i) });
        cards[i].card.classList.add('done');
      }
      if (!built[i] && cards[i]) {
        cards[i].remove();
        cards[i] = null;
      }
    });
    const n = built.indexOf(false);
    if (n !== next) {
      nextCard?.remove();
      nextCard = n === -1 ? null : stage.callout(null, { icon: '👉', title: `Next: ${STEPS[n].split(' · ')[1]}`, text: NEXT[n][1], at: NEXT[n][0], dx: NEXT[n][2], dy: NEXT[n][3], onClick: () => openStep(n) });
      next = n;
    }
    if (!pitching) pitchCard.set(STEPS[4], p.pitched ? 'Practised: 3 minutes' : '3-minute timer, 3 acts');
    pitchCard.card.classList.toggle('done', !!p.pitched);
  }

  const targets = new Map(); // object -> target scale
  stage.onTick((dt) => {
    for (const [o, t] of targets) {
      const s = o.scale.y + (t - o.scale.y) * Math.min(1, dt * 4);
      if (o === foundation) o.scale.setScalar(s);
      else o.scale.y = s; // walls, roof and extras grow upwards
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
    painted = !!(charterDone() && protoDone() && testDone() && polishDone());
    drawScreen();
    setLabel(sign, p.team.trim() ? `${TRACKS[p.track]?.icon ?? ''} ${p.team}` : 'Our project');
    if (charterDone()) ui.complete('charter');
    if (charterDone() && protoDone()) ui.complete('proto');
    if (charterDone() && protoDone() && testDone()) ui.complete('test');
    if (charterDone() && protoDone() && testDone() && polishDone()) ui.complete('polish');
    stepper.querySelectorAll('[data-step]').forEach((b) => {
      const ok = [charterDone, protoDone, testDone, polishDone, () => p.pitched][b.dataset.step]();
      b.classList.toggle('ok', !!ok);
    });
    // A part is only built once every step before it is done too.
    const built = [charterDone, protoDone, testDone, polishDone].map((f) => !!f());
    tagCards(built.map((_, i) => built.slice(0, i + 1).every(Boolean)));
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
    stage.reveal();
    if (pitching) return;
    pitching = true;
    spot.intensity = 60;
    lamps.forEach((l) => l.emissive.setHex(0xffbe00));
    let t = 180;
    for (let j = 0; j < PITCH.length && pitching; j++) {
      const s = PITCH[j];
      const who = p.speakers[j] || 'someone';
      const idx = Math.max(0, p.roles.indexOf(p.speakers[j]));
      presenters.forEach((g, k) => (g.position.z = k === idx ? 1.6 : 1));
      mic.position.x = presenters[idx].position.x; // the speaker steps up to the microphone
      pitchCard.set(s.part.split(':')[0], `${who} speaks: ${s.secs} seconds`);
      info(`🎤 ${s.part}: ${who}`, `<p><b>${s.tip}</b></p><p>Time for this part: ${s.secs} seconds. (Practice mode: each second goes 4× faster.)</p>`);
      for (let k = 0; k < s.secs && pitching; k++) {
        // A real timer, not animation frames: those pause when the 3D view is scrolled off-screen.
        await new Promise((r) => setTimeout(r, 250));
        t--;
        setLabel(timerTag, `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, { color: t < 30 ? '#FF6B81' : '#FFBE00' });
      }
    }
    presenters.forEach((g) => (g.position.z = 1));
    mic.position.x = -6.5;
    spot.intensity = 0;
    lamps.forEach((l) => l.emissive.setHex(0x000000));
    if (pitching) {
      p.pitched = true;
      ui.complete('pitch');
      const allSpeak = new Set(p.speakers.slice(0, PITCH.length).filter(Boolean)).size >= Math.min(2, p.roles.filter((r) => r.trim()).length);
      info('👏 Time! That was 3:00 exactly.', `<p>${allSpeak ? 'Great, more than one person spoke.' : '⚠️ Try to give more team members a speaking part.'}</p><p>Now practise it for real with a stopwatch. Tip: the live demo always takes longer than you think, so rehearse it twice.</p>`);
      stage.confetti();
      refresh();
    }
    pitching = false;
    setLabel(timerTag, '3:00', { color: '#FFBE00' });
    refresh();
  }

  function printCard() {
    const w = window.open('', '_blank');
    if (!w) return info('Pop-up blocked', '<p>Allow pop-ups for this site to print your project card.</p>');
    const t = TRACKS[p.track];
    const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${e(p.team)} · Project card</title>
      <body style="font-family:Arial,sans-serif;max-width:720px;margin:30px auto;color:#24182E">
      <p style="color:#CA1F3F;font-weight:700;letter-spacing:2px;font-size:12px;margin:0">BOZOMA INNOVATION HUB · BIH JHS TECH CLUB</p><h1 style="color:#24182E;margin-bottom:0">${e(p.team || 'Our team')}</h1>
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

// ---------- Models ----------
const RAW = 0xb9b4aa; // bare sandcrete blocks
const PAINT = 0xf3e3b5; // cream paint after the polish step
const ROOF_H = 1.2; // ridge height above the wall tops
const TILE = [0.8, 0.4]; // one texture tile = two courses of 0.4 m × 0.2 m blocks

function blockTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#c9c1b2';
  g.lineWidth = 4;
  g.beginPath();
  for (const y of [2, 64]) g.moveTo(0, y), g.lineTo(256, y);
  for (const x of [2, 130]) g.moveTo(x, 0), g.lineTo(x, 64);
  for (const x of [66, 194]) g.moveTo(x, 64), g.lineTo(x, 128);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// A box whose block texture keeps the same block size on every face.
function blockBox(w, h, d, material) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  const size = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x −x +y −y +z −z
  for (let i = 0; i < uv.count; i++) {
    const [su, sv] = size[Math.floor(i / 4)];
    uv.setXY(i, (uv.getX(i) * su) / TILE[0], (uv.getY(i) * sv) / TILE[1]);
  }
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function gableGeometry() {
  const shape = new THREE.Shape([new THREE.Vector2(-2, 0), new THREE.Vector2(2, 0), new THREE.Vector2(0, ROOF_H)]);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: false });
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TILE[0], uv.getY(i) / TILE[1]);
  return geo;
}

// A ridged (trapezoid-profile) roofing sheet: ridges run down the slope (−y),
// the profile rises towards +z. Flat faces, so the ink picks out every ridge.
function corrugated(len, width) {
  const P = 0.24;
  const H = 0.035;
  const prof = [];
  for (let x = -len / 2; x < len / 2 - 1e-6; x += P) prof.push([x, 0], [x + P * 0.3, H], [x + P * 0.55, H], [x + P * 0.85, 0]);
  prof.push([len / 2, 0]);
  const v = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const [x0, z0] = prof[i];
    const [x1, z1] = prof[i + 1];
    v.push(x0, 0, z0, x0, -width, z0, x1, 0, z1, x1, 0, z1, x0, -width, z0, x1, -width, z1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.computeVertexNormals();
  return geo;
}

// A panelled wooden door in its frame; the origin is the bottom of the doorway.
function woodenDoor() {
  const g = new THREE.Group();
  const frameC = 0x5a3a1e;
  for (const x of [-0.56, 0.56]) {
    const jamb = box(0.08, 1.9, 0.27, frameC);
    jamb.position.set(x, 0.95, 0);
    g.add(jamb);
  }
  const head = box(1.2, 0.08, 0.27, frameC);
  head.position.y = 1.86;
  const panel = box(1.02, 1.82, 0.06, 0x9a6332);
  panel.position.y = 0.91;
  const face = decal(0.98, 1.78, (c, w, h) => {
    c.strokeStyle = 'rgba(70,40,15,0.55)';
    c.lineWidth = 3;
    for (let x = w / 6; x < w; x += w / 6) c.beginPath(), c.moveTo(x, 0), c.lineTo(x, h), c.stroke();
    c.strokeStyle = 'rgba(60,32,10,0.8)';
    c.lineWidth = 6;
    c.strokeRect(w * 0.14, h * 0.08, w * 0.72, h * 0.36);
    c.strokeRect(w * 0.14, h * 0.54, w * 0.72, h * 0.38);
  }, { px: 128 });
  face.position.set(0, 0.91, 0.032);
  const plate = rbox(0.07, 0.2, 0.02, COLORS.gold, 0.01);
  plate.position.set(0.38, 0.92, 0.035);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), mat(COLORS.gold, { metalness: 0.5, roughness: 0.3 }));
  knob.position.set(0.38, 0.9, 0.08);
  g.add(head, panel, face, plate, knob);
  return g;
}

// A louvre window: plum frame, five tilted glass blades and a concrete sill.
function louvreWindow() {
  const g = new THREE.Group();
  const frameC = COLORS.purple;
  for (const [w, h, x, y] of [[0.95, 0.07, 0, 0.365], [0.95, 0.07, 0, -0.365], [0.07, 0.8, -0.44, 0], [0.07, 0.8, 0.44, 0]]) {
    const bar = box(w, h, 0.1, frameC);
    bar.position.set(x, y, 0);
    g.add(bar);
  }
  const back = box(0.82, 0.66, 0.02, 0x34495e);
  back.position.z = -0.02;
  g.add(back);
  const glass = mat(0xb9dfee, { roughness: 0.15, metalness: 0.1 });
  for (let k = 0; k < 5; k++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.13, 0.012), glass);
    blade.position.set(0, -0.26 + k * 0.13, 0.02);
    blade.rotation.x = -0.55;
    g.add(blade);
  }
  const sill = rbox(1.08, 0.06, 0.2, 0xb8babd, 0.02);
  sill.position.set(0, -0.43, 0.05);
  g.add(sill);
  return g;
}

// A flagpole on a concrete base with the club flag (a plane that waves).
function flagpole() {
  const pole = new THREE.Group();
  const base = rbox(0.4, 0.2, 0.4, 0xb8babd, 0.03);
  base.position.y = 0.1;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.2, 10), mat(0x9aa0a6, { metalness: 0.4, roughness: 0.35 }));
  rod.position.y = 2.2;
  rod.castShadow = true;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat(COLORS.gold, { metalness: 0.4 }));
  ball.position.y = 4.34;
  const flag = decal(1.0, 0.62, (c, w, h) => {
    c.fillStyle = '#24182E';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#CA1F3F';
    c.fillRect(0, h * 0.8, w, h * 0.2);
    c.fillStyle = '#FFBE00';
    c.font = `bold ${h * 0.42}px Rubik, system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('BIH', w / 2, h * 0.36);
    c.fillStyle = '#ffffff';
    c.font = `bold ${h * 0.12}px Rubik, system-ui, sans-serif`;
    c.fillText('JHS TECH CLUB', w / 2, h * 0.66);
  }, { px: 128, transparent: false });
  flag.geometry.dispose();
  flag.geometry = new THREE.PlaneGeometry(1.0, 0.62, 10, 1);
  flag.geometry.translate(0.5, 0, 0); // hinge on the pole
  flag.userData.x0 = Float32Array.from(flag.geometry.attributes.position.array);
  flag.material.side = THREE.DoubleSide;
  flag.position.set(0.035, 3.95, 0);
  pole.add(base, rod, ball, flag);
  return { pole, flag };
}

function waveFlag(flag, t) {
  const pos = flag.geometry.attributes.position;
  const x0 = flag.userData.x0;
  for (let i = 0; i < pos.count; i++) {
    const x = x0[i * 3];
    pos.setZ(i, Math.sin(x * 6 - t * 3.5) * 0.07 * x);
  }
  pos.needsUpdate = true;
}

function mangoTree(x, z) {
  const g = new THREE.Group();
  const bark = 0x6b4a2b;
  g.add(cable([[x, 0.05, z], [x + 0.05, 0.9, z], [x - 0.05, 1.6, z + 0.05]], bark, 0.13));
  g.add(cable([[x + 0.03, 1.1, z], [x + 0.35, 1.6, z + 0.1], [x + 0.6, 1.9, z + 0.1]], bark, 0.06));
  for (const [dx, dy, dz, r, c] of [[0, 2.15, 0, 0.8, 0x3f7d3a], [0.55, 1.95, 0.25, 0.55, 0x4f9a45], [-0.5, 1.9, 0.2, 0.55, 0x4f9a45], [0.1, 2.6, -0.1, 0.5, 0x5aa84e], [-0.15, 1.85, -0.45, 0.5, 0x3f7d3a]]) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(c, { flatShading: true, roughness: 0.8 }));
    leaf.position.set(x + dx, dy, z + dz);
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

// The black water tank on a block stand that many Ghanaian homes have.
function polytank(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0.1, z);
  const stand = rbox(1.0, 0.6, 1.0, 0xa7a9ac, 0.04);
  stand.position.y = 0.3;
  const black = mat(0x2a2a2e, { roughness: 0.6 });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.95, 20), black);
  tank.position.y = 1.08;
  tank.castShadow = true;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 14), black);
  lid.position.y = 1.59;
  g.add(stand, tank, lid);
  for (const y of [0.85, 1.3]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.445, 0.025, 6, 24), black);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    g.add(ring);
  }
  return g;
}

function signboard() {
  const g = new THREE.Group();
  for (const x of [-0.55, 0.55]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 8), mat(0x6b4a2b));
    post.position.set(x, 0.575, 0);
    g.add(post);
  }
  const board = rbox(1.5, 0.5, 0.06, COLORS.blue, 0.03);
  board.position.y = 0.88;
  g.add(board);
  return g;
}

// Grass with tufts and a laterite path from the front edge to the steps,
// with a branch to the flagpole. Canvas (u, v) = world (x, z) on the site.
function drawLawn(g, W, H) {
  const u = (x) => ((x + 4.15) / 8.3) * W;
  const v = (z) => ((z + 3.45) / 6.9) * H;
  g.fillStyle = '#8cc084';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(46,110,52,0.45)';
  g.lineWidth = 2;
  for (let i = 0; i < 260; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 12345.678) % 1;
    const px = Math.abs(x) * W;
    const py = Math.abs(y) * H;
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(px - 3, py - 7);
    g.moveTo(px + 3, py);
    g.lineTo(px + 5, py - 6);
    g.stroke();
  }
  g.fillStyle = '#c0703f';
  g.strokeStyle = '#9a5530';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(u(-0.75), v(3.45));
  g.lineTo(u(-0.65), v(2.5));
  g.lineTo(u(0.65), v(2.5));
  g.lineTo(u(0.75), v(3.45));
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(u(-0.6), v(2.95));
  g.lineTo(u(-3.4), v(2.15));
  g.lineTo(u(-3.45), v(2.5));
  g.lineTo(u(-0.65), v(3.3));
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(255,240,220,0.35)';
  for (let z = 2.7; z < 3.4; z += 0.28) g.fillRect(u(-0.45), v(z), u(0.45) - u(-0.45), v(0.12) - v(0));
}

// The Demo Day stage set (in world coordinates): steps, a lighting rig, a
// projector screen, a microphone stand and a countdown timer board.
function demoStage() {
  const g = new THREE.Group();
  const X = -6.5;
  const dark = 0x1b1222;
  const apron = decal(3.6, 0.26, (c, w, h) => {
    c.fillStyle = '#FFBE00';
    c.font = `bold ${h * 0.62}px Rubik, system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('★ DEMO DAY  ·  BIH JHS TECH CLUB ★', w / 2, h / 2 + 2);
  }, { px: 64 });
  apron.position.set(X, 0.2, 2.252);
  g.add(apron);
  for (const [h, z] of [[0.27, 2.4], [0.13, 2.7]]) {
    const st = rbox(0.8, h, 0.3, COLORS.blue, 0.03);
    st.position.set(X - 1.4, h / 2, z);
    g.add(st);
  }
  // Lighting rig at the back: two posts, a bar and two lamps (they glow while pitching).
  const metal = mat(0x6c6f75, { metalness: 0.5, roughness: 0.4 });
  for (const x of [X - 1.9, X + 1.9]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.9, 8), metal);
    post.position.set(x, 2.35, -0.1);
    g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.9, 8), metal);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(X, 4.25, -0.1);
  g.add(bar);
  const lamps = [];
  for (const x of [X - 1.1, X + 1.1]) {
    const can = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.34, 12), mat(dark));
    const lensMat = mat(0xfff3c4, { emissive: 0x000000, emissiveIntensity: 1.5 });
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 12), lensMat);
    lens.position.y = -0.18;
    lamps.push(lensMat);
    can.add(body, lens);
    can.position.set(x, 4.0, -0.05);
    can.rotation.x = -0.9; // aimed down at the presenters
    g.add(can);
  }
  // The projector screen behind the presenters (its slide shows the team name).
  const screen = rbox(3.3, 1.9, 0.1, dark, 0.04);
  screen.position.set(X, 2.25, 0.05);
  for (const x of [X - 1.5, X + 1.5]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), metal);
    leg.position.set(x, 0.85, 0.05);
    g.add(leg);
  }
  const slide = decal(3.1, 1.72, () => {}, { px: 280, transparent: false });
  slide.position.set(X, 2.25, 0.102);
  g.add(screen, slide);
  // The microphone stand (moved to whoever is speaking).
  const mic = new THREE.Group();
  mic.position.set(X, 0.4, 1.95);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.03, 14), mat(dark));
  foot.position.y = 0.015;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.15, 6), metal);
  rod.position.y = 0.6;
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.1, 4, 10), mat(0x3a3a40, { metalness: 0.4 }));
  head.position.set(0, 1.22, -0.03);
  head.rotation.x = -0.6;
  mic.add(foot, rod, head);
  g.add(mic);
  // The countdown timer board on a post at the front corner.
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 8), metal);
  post.position.set(X + 1.65, 1.05, 1.95);
  const timerBoard = rbox(0.9, 0.5, 0.1, dark, 0.04);
  timerBoard.position.set(X + 1.65, 1.9, 1.95);
  g.add(post, timerBoard);
  return { group: g, slide, timerBoard, mic, lamps };
}

function drawSlide(g, W, H, team, track) {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#24182E';
  g.fillRect(0, 0, W, H * 0.2);
  g.fillStyle = '#FFBE00';
  g.font = `bold ${H * 0.1}px Rubik, system-ui, sans-serif`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText('DEMO DAY', W * 0.05, H * 0.1);
  g.fillStyle = '#24182E';
  g.textAlign = 'center';
  let size = H * 0.15;
  const name = team || 'Our project';
  g.font = `bold ${size}px Rubik, system-ui, sans-serif`;
  while (g.measureText(name).width > W * 0.9 && size > 10) g.font = `bold ${(size -= 2)}px Rubik, system-ui, sans-serif`;
  g.fillText(name, W / 2, H * 0.38);
  g.fillStyle = '#5A4470';
  g.font = `${H * 0.075}px Rubik, system-ui, sans-serif`;
  g.fillText(track ? track.name : 'Problem · Demo · Call to action', W / 2, H * 0.52);
  // A little bar chart, as if the team is showing results.
  const bars = [0.35, 0.55, 0.45, 0.8];
  bars.forEach((b, i) => {
    g.fillStyle = ['#CA1F3F', '#FFBE00', '#5A4470', '#2EC4B6'][i];
    const bw = W * 0.08;
    g.fillRect(W * 0.32 + i * bw * 1.4, H * 0.94 - b * H * 0.32, bw, b * H * 0.32);
  });
  g.fillStyle = '#24182E';
  g.fillRect(W * 0.3, H * 0.94, W * 0.42, 3);
}

// A friendly presenter in a club T-shirt (origin at the feet).
const SHIRTS = [COLORS.gold, COLORS.green, COLORS.blue, COLORS.red];
const SKIN = [0x8d5524, 0x6b3e1f, 0x7a4a26, 0x5c3418];
function presenter(i) {
  const g = new THREE.Group();
  const skin = mat(SKIN[i]);
  const shirt = mat(SHIRTS[i]);
  const dark = mat(0x3b2f4a);
  for (const x of [-0.08, 0.08]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.46, 8), i % 2 ? skin : dark);
    leg.position.set(x, 0.25, 0);
    const shoe = rbox(0.12, 0.06, 0.2, 0x1e1410, 0.025);
    shoe.position.set(x, 0.03, 0.03);
    g.add(leg, shoe);
  }
  if (i % 2) {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.25, 0.3, 14), dark);
    skirt.position.y = 0.42;
    g.add(skirt);
  }
  const body = rbox(0.42, 0.52, 0.26, SHIRTS[i], 0.1);
  body.position.y = 0.78;
  g.add(body);
  for (const x of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.46, 8), skin);
    arm.position.set(x * 0.26, 0.73, 0);
    arm.rotation.z = x * 0.18;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 10), shirt);
    sleeve.position.set(x * 0.25, 0.95, 0);
    sleeve.rotation.z = x * 0.18;
    g.add(arm, sleeve);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skin);
  head.position.y = 1.23;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.178, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), mat(0x1e1410));
  hair.position.y = 1.24;
  hair.rotation.x = -0.25;
  g.add(head, hair);
  for (const x of [-0.06, 0.06]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mat(0x140c10));
    eye.position.set(x, 1.26, 0.155);
    eye.userData.noInk = true;
    g.add(eye);
  }
  const smile = decal(0.12, 0.06, (c, w, h) => {
    c.strokeStyle = '#2a1410';
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(w / 2, -h * 0.2, h * 0.9, Math.PI * 0.25, Math.PI * 0.75);
    c.stroke();
  }, { px: 32 });
  smile.position.set(0, 1.17, 0.17);
  g.add(smile);
  g.scale.setScalar(1.15);
  return g;
}

export const missions = [
  { id: 'charter', text: 'Step 1: complete your Project Charter.', hint: 'Team name, a track, who has the problem, the problem (8+ words) and a role for every member (at least 3). Watch the foundation appear!' },
  { id: 'proto', text: 'Step 2: name your folder and first v0.1 file correctly.', hint: 'Example: folder Capstone_EcoTech, file Capstone_v0.1_CleanWater.docx' },
  { id: 'test', text: 'Step 3: record at least 2 fixes from user testing.', hint: 'Ask another team to try your project. Write what went wrong and how you fixed it.' },
  { id: 'polish', text: 'Step 4: tick every item on the polish checklist.', hint: 'When everything is done, your house gets its door, windows and flag.' },
  { id: 'pitch', text: 'Step 5: give each part a speaker and practise the 3-minute pitch.', hint: 'Everyone should have a voice on Demo Day.' },
];

export const config = { camera: [4, 8, 13], target: [-1.5, 2, 0.5], shadowSize: 12, maxDistance: 30 };
