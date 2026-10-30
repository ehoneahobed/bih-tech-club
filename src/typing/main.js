// BIH Typing Trainer: stages, the 10-minute warm-up, speed checks, two games and progress.
// Bundled by scripts/build.mjs into typing/typing.js (one classic script, with the
// words from content/typing.json inside), so it also runs from file:// in the USB kit.
import { STAGES, DATA, drillFor, passage } from './text.js';
import { keyboard, hands, POSTURE_SVG } from './keys.js';
import { typer } from './typer.js';
import { load, save, clear, award, passport, addMisses, TARGETS, BADGES } from './store.js';
import { trotroRace, fallingMangoes } from './games.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const app = document.getElementById('tt-app');
const FILE = location.protocol === 'file:';
const sessionHref = (s) => `../sessions/${s.id}/${FILE ? 'index.html' : ''}`;
let data = load();
const persist = () => save(data);
const PASS = 95;
const fmt = (secs) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
const pct = (n) => `${Math.round(n)}%`;

// Short, kind feedback. Accuracy first, always.
function feedback(acc, wpm) {
  if (acc >= 98) return pickOne(['Superb! Clean, careful typing.', 'Brilliant accuracy. Your fingers know the way!', 'Excellent! That was almost perfect.']);
  if (acc >= PASS) return pickOne(['Great accuracy! Well done.', 'Lovely work. Careful and steady.', 'You did it! Accuracy like a pro.']);
  if (acc >= 90) return 'Nearly there! Slow down a little and aim for 95%.';
  if (wpm > 20) return 'You are fast, but too many wrong keys. Slow down: accuracy comes first.';
  return 'Good try! Take it slowly and look at the screen, not your fingers.';
}
const TIPS = [
  '👀 Keep your eyes on the screen, not on the keys.',
  '🏠 After every key, your finger goes back home to the home row.',
  '🪑 Sit up straight with your feet flat on the floor.',
  '🙌 Wrists up! Do not rest them on the desk while you type.',
  '🥁 Type with a steady rhythm, like a drum. Steady beats fast.',
  '🐢 Slow and right is better than fast and wrong. Speed comes later.',
];
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
const stars = (acc) => (acc >= 98 ? 3 : acc >= PASS ? 2 : acc >= 90 ? 1 : 0);
const starHtml = (n) => `<span class="tt-stars" aria-label="${n} of 3 stars">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;

// ---------- Shell ----------
const TABS = [
  ['lessons', '🎓', 'Lessons'],
  ['warmup', '🔥', 'Warm-up'],
  ['check', '⏱️', 'Speed check'],
  ['trotro', '🚐', 'Trotro Race'],
  ['mangoes', '🥭', 'Falling Mangoes'],
  ['progress', '📈', 'My progress'],
];
app.innerHTML = `<div class="tt-phone" hidden><span>📱</span><p><b>This trainer works best with a real keyboard.</b> Typing with your thumbs on a phone is very different from touch typing. Use a computer if you can, or try it here for fun.</p><button type="button" class="btn btn-outline btn-small">Try anyway</button></div>
<div class="tt-tabs" role="tablist" aria-label="Typing trainer">${TABS.map(([id, icon, name]) => `<button type="button" role="tab" data-tab="${id}"><span aria-hidden="true">${icon}</span> ${name}</button>`).join('')}</div>
<div class="tt-toasts" aria-live="polite"></div>
<div class="tt-view"></div>`;
const viewEl = app.querySelector('.tt-view');
const toasts = app.querySelector('.tt-toasts');
const phone = app.querySelector('.tt-phone');
try {
  if (matchMedia('(hover: none) and (pointer: coarse)').matches && !sessionStorage.getItem('bih-typing-phone')) phone.hidden = false;
} catch (e) {}
phone.querySelector('button').addEventListener('click', () => { phone.hidden = true; try { sessionStorage.setItem('bih-typing-phone', '1'); } catch (e) {} });

function toast(html) {
  const t = document.createElement('div');
  t.className = 'tt-toast';
  t.innerHTML = html;
  toasts.append(t);
  setTimeout(() => t.classList.add('out'), 3600);
  setTimeout(() => t.remove(), 4200);
}
function celebrate(badge) { if (badge) toast(`${badge.icon} New badge: <b>${esc(badge.name)}</b>`); return badge; }

let current = null;
function show(id, opts) {
  current?.stop?.();
  current = null;
  app.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === id));
  viewEl.innerHTML = '';
  viewEl.dataset.view = id;
  current = VIEWS[id](viewEl, opts || {}) || null;
  try { history.replaceState(null, '', (opts?.keepQuery ? location.search : location.pathname) + '#' + id); } catch (e) {}
}
app.querySelector('.tt-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) show(b.dataset.tab);
});

// Saves one stage run and works out what it unlocked.
function recordRun(i, st) {
  const stage = STAGES[i];
  const r = data.stages[stage.id] || { runs: 0, acc: 0, wpm: 0, passed: false };
  r.runs++;
  r.acc = Math.max(r.acc, Math.round(st.acc));
  r.wpm = Math.max(r.wpm, st.wpm);
  const passed = st.acc >= PASS;
  let unlocked = null;
  if (passed) {
    r.passed = true;
    if (i + 1 < STAGES.length && data.unlocked < i + 1) { data.unlocked = i + 1; unlocked = STAGES[i + 1]; }
    if (stage.id === 'home') celebrate(award(data, 'home'));
    if (stage.id === 'symbols') celebrate(award(data, 'allkeys'));
  }
  data.stages[stage.id] = r;
  addMisses(data, st.misses);
  persist();
  return { passed, unlocked };
}

// The practice panel used by lessons and the warm-up: text, hint, keyboard and hands.
function practicePanel(el, { compact = false } = {}) {
  el.innerHTML = `<div class="tt-typebox"></div>
    <p class="tt-hint" data-hint></p>
    <div class="tt-kbwrap${compact ? ' compact' : ''}"><div class="tt-kbd"></div><div class="tt-handwrap"></div></div>
    <p class="tt-rule">✋ <b>Wrong key?</b> It turns red. Press <b>Backspace ⌫</b> to rub it out, then type the right key. Every wrong key still counts, so aim for the right key first time.</p>`;
  return { box: el.querySelector('.tt-typebox'), hint: el.querySelector('[data-hint]'), kb: keyboard(el.querySelector('.tt-kbd')), hands: hands(el.querySelector('.tt-handwrap')) };
}

// ---------- Lessons ----------
function lessons(root, { stage } = {}) {
  let i = Math.min(stage ?? data.stage ?? 0, data.unlocked);
  root.innerHTML = `<div class="tt-lessons">
    <aside class="tt-stages" aria-label="Stages"><h3>Your stages</h3><ol></ol><p class="small-tip">Reach <b>${PASS}% accuracy</b> on a stage to unlock the next one. You can replay any stage you have unlocked.</p></aside>
    <div class="tt-card tt-practice">
      <div class="tt-phead"><div><span class="eyebrow" data-count></span><h2 data-title></h2><p class="tt-tip" data-tip></p></div>
        <div class="tt-live"><span><b data-wpm>0</b> wpm</span><span><b data-acc>100%</b> accuracy</span></div></div>
      <div class="tt-meter"><span data-bar></span></div>
      <div class="tt-panel"></div>
      <div class="tt-result" hidden></div>
    </div>
  </div>`;
  const list = root.querySelector('.tt-stages ol');
  const panel = practicePanel(root.querySelector('.tt-panel'));
  const result = root.querySelector('.tt-result');
  const $ = (q) => root.querySelector(q);
  function renderList() {
    list.innerHTML = STAGES.map((s, k) => {
      const r = data.stages[s.id];
      const locked = k > data.unlocked;
      return `<li><button type="button" data-stage="${k}" ${locked ? 'disabled' : ''} class="${k === i ? 'on' : ''} ${r?.passed ? 'passed' : ''}" ${k === i ? 'aria-current="step"' : ''}>
        <span class="tt-sico" aria-hidden="true">${locked ? '🔒' : s.icon}</span><span class="tt-sname">${k + 1}. ${esc(s.title)}</span>
        <span class="tt-sstat">${locked ? 'Locked' : r?.passed ? starHtml(stars(r.acc)) : r ? `Best ${r.acc}%` : 'New'}</span></button></li>`;
    }).join('');
  }
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-stage]'); if (b && !b.disabled) { i = +b.dataset.stage; begin(); } });
  const live = () => { const st = t.stats(); $('[data-wpm]').textContent = st.wpm; $('[data-acc]').textContent = pct(st.acc); $('[data-bar]').style.width = st.progress * 100 + '%'; };
  const t = typer(panel.box, {
    text: '', kb: panel.kb, hands: panel.hands, hint: panel.hint,
    onKey: live,
    onDone: (st) => done(st),
  });
  function begin() {
    data.stage = i; persist();
    const s = STAGES[i];
    $('[data-count]').textContent = `Stage ${i + 1} of ${STAGES.length}`;
    $('[data-title]').textContent = `${s.icon} ${s.title}`;
    $('[data-tip]').innerHTML = s.tip;
    t.setText(drillFor(i));
    result.hidden = true;
    root.querySelector('.tt-panel').hidden = false;
    live();
    renderList();
    t.focus();
  }
  function done(st) {
    const { passed, unlocked } = recordRun(i, st);
    const n = stars(st.acc);
    result.innerHTML = `<div class="tt-res-top">${starHtml(n)}<h3>${esc(feedback(st.acc, st.wpm))}</h3></div>
      <div class="tt-res-nums"><div><b>${pct(st.acc)}</b><span>accuracy</span></div><div><b>${st.wpm}</b><span>words a minute</span></div><div><b>${fmt(st.secs)}</b><span>time</span></div></div>
      ${passed ? (unlocked ? `<p class="tt-unlock">🔓 You unlocked <b>Stage ${i + 2}: ${esc(unlocked.title)}</b>!</p>` : i + 1 < STAGES.length ? '<p class="tt-unlock">✓ Stage passed.</p>' : '<p class="tt-unlock">🏁 You have passed every stage. Keep building speed with the speed check and the games!</p>') : `<p class="tt-muted">You need <b>${PASS}%</b> accuracy to move up. You can do it!</p>`}
      <p class="tt-tipline">${pickOne(TIPS)}</p>
      <div class="btns"><button type="button" class="btn ${passed && i + 1 <= data.unlocked && i + 1 < STAGES.length ? 'btn-outline' : 'btn-primary'}" data-again>↻ Try again</button>${passed && i + 1 < STAGES.length ? `<button type="button" class="btn btn-primary" data-next>Next stage →</button>` : ''}</div>
      <p class="small-tip">Press <b>Enter</b> for ${passed && i + 1 < STAGES.length ? 'the next stage' : 'another go'}.</p>`;
    result.hidden = false;
    root.querySelector('.tt-panel').hidden = true;
    renderList();
    const next = result.querySelector('[data-next]');
    result.querySelector('[data-again]').addEventListener('click', begin);
    next?.addEventListener('click', () => { i++; begin(); });
    (next || result.querySelector('[data-again]')).focus();
  }
  begin();
  return {};
}

// ---------- Speed check ----------
function speedCheck(root) {
  root.innerHTML = `<div class="tt-card tt-check">
    <div class="tt-choose">
      <h2>⏱️ How fast and how careful are you?</h2>
      <p class="tt-muted">Type the sentences as well as you can. Your speed is <b>the letters you type correctly ÷ 5</b> (an average word) for each minute. Wrong keys lower your accuracy.</p>
      <div class="tt-choices">
        <button type="button" class="tt-choice" data-secs="60"><b>1-minute quick check</b><span>A fast check of how you are doing today.</span></button>
        <button type="button" class="tt-choice main" data-secs="180"><b>3-minute speed check</b><span>The real test. It counts for your Typing Passport (Bronze, Silver, Gold).</span></button>
      </div>
    </div>
    <div class="tt-running" hidden>
      <div class="tt-phead"><div><span class="eyebrow" data-kind></span><h2 class="tt-clock" data-clock>1:00</h2><p class="tt-tip">The clock starts when you press the first key.</p></div>
        <div class="tt-live"><span><b data-wpm>0</b> wpm</span><span><b data-acc>100%</b> accuracy</span></div></div>
      <div class="tt-panel"></div>
    </div>
    <div class="tt-result" hidden></div>
  </div>`;
  const $ = (q) => root.querySelector(q);
  const panel = practicePanel($('.tt-panel'), { compact: true });
  let secs = 60, timer = 0, t;
  root.querySelectorAll('[data-secs]').forEach((b) => b.addEventListener('click', () => begin(+b.dataset.secs)));
  function begin(s) {
    secs = s;
    $('.tt-choose').hidden = true; $('.tt-result').hidden = true; $('.tt-running').hidden = false;
    $('[data-kind]').textContent = s === 60 ? '1-minute quick check' : '3-minute speed check';
    $('[data-clock]').textContent = fmt(s);
    t = t || typer(panel.box, { text: '', kb: panel.kb, hands: panel.hands, hint: panel.hint, onDone: () => end() });
    t.setText(passage(secs * 14)); // room for about 160 wpm
    t.focus();
    clearInterval(timer);
    timer = setInterval(tick, 200);
  }
  function tick() {
    const st = t.stats();
    $('[data-clock]').textContent = fmt(Math.max(0, secs - st.secs + 0.99));
    $('[data-wpm]').textContent = st.wpm;
    $('[data-acc]').textContent = pct(st.acc);
    if (st.secs >= secs) end();
  }
  function end() {
    clearInterval(timer);
    const raw = t.finish();
    const min = Math.max(1, Math.min(raw.secs, secs)) / 60;
    const st = { ...raw, wpm: Math.round(raw.correct / 5 / min), gross: Math.round(raw.typed / 5 / min) };
    const before = passport(data);
    data.checks.push({ at: Date.now(), secs, wpm: st.wpm, gross: st.gross, acc: Math.round(st.acc * 10) / 10 });
    data.checks = data.checks.slice(-60);
    const best = st.wpm > (data.best.check || 0);
    if (best) data.best.check = st.wpm;
    addMisses(data, st.misses);
    const badges = [];
    if (st.acc >= 90) for (const n of [20, 30, 40]) if (st.wpm >= n) { const b = award(data, 'wpm' + n); if (b) badges.push(b); }
    persist();
    const after = passport(data);
    const next = TARGETS.find((x) => !after || TARGETS.indexOf(x) > TARGETS.indexOf(after));
    $('.tt-running').hidden = true;
    const r = $('.tt-result');
    r.hidden = false;
    r.innerHTML = `<div class="tt-res-top"><span class="eyebrow">${secs === 60 ? '1-minute quick check' : '3-minute speed check'}</span><h3>${esc(feedback(st.acc, st.wpm))}</h3></div>
      <div class="tt-res-nums big"><div><b>${st.wpm}</b><span>words a minute</span></div><div><b>${pct(st.acc)}</b><span>accuracy</span></div><div><b>${st.gross}</b><span>gross wpm (all keys)</span></div></div>
      <p class="tt-muted">You typed ${st.correct} letters correctly${st.typed - st.correct ? ` and pressed ${st.typed - st.correct} wrong key${st.typed - st.correct === 1 ? '' : 's'}` : ' with no wrong keys'}.${best ? ' <b>🎉 A new personal best!</b>' : ''}</p>
      ${after && after !== before ? `<p class="tt-unlock">${after.icon} You reached <b>${after.name}</b> on your Typing Passport!</p>` : ''}
      ${badges.map((b) => `<p class="tt-new-badge">${b.icon} New badge: <b>${esc(b.name)}</b></p>`).join('')}
      ${next ? `<p class="tt-muted">Next Passport level: <b>${next.icon} ${next.name}</b>, ${next.wpm} wpm at ${next.acc}% accuracy in the 3-minute check.</p>` : ''}
      <div class="btns"><button type="button" class="btn btn-primary" data-again>↻ Go again</button><button type="button" class="btn btn-outline" data-other>Choose another check</button><button type="button" class="btn btn-outline" data-progress>📈 See my progress</button></div>`;
    r.querySelector('[data-again]').addEventListener('click', () => begin(secs));
    r.querySelector('[data-other]').addEventListener('click', () => { r.hidden = true; $('.tt-choose').hidden = false; });
    r.querySelector('[data-progress]').addEventListener('click', () => show('progress'));
    r.querySelector('[data-again]').focus();
  }
  return { stop() { clearInterval(timer); } };
}

// ---------- 10-minute warm-up ----------
// 1 min posture and finger check, 5 min drill at your stage, 3 min of today's words, then a summary.
const PARTS = [
  { id: 'posture', name: 'Posture check', secs: 60 },
  { id: 'drill', name: 'Stage drill', secs: 300 },
  { id: 'words', name: "Today's words", secs: 180 },
  { id: 'summary', name: 'Summary', secs: 0 },
];
function findSession(q) {
  if (!q) return null;
  const n = Number(q);
  return DATA.sessions.find((s) => s.slug === q || s.id === q || (n && s.n === n)) || null;
}
function warmup(root, { session } = {}) {
  const ses = session || findSession(new URLSearchParams(location.search).get('warmup'));
  const choices = DATA.sessions.filter((s) => s.n >= 2);
  root.innerHTML = `<div class="tt-card tt-warm">
    <div class="tt-warm-intro">
      <span class="eyebrow">🔥 10-minute typing warm-up</span>
      <h2>${ses ? `Session ${ses.n}: ${esc(ses.title)}` : 'Warm up your fingers'}</h2>
      <p class="tt-muted">Every session starts with this warm-up. It takes about 10 minutes, and the timer moves you on.</p>
      <ol class="tt-plan">${PARTS.map((p) => `<li><b>${p.name}</b><span>${p.secs ? `${p.secs / 60} min` : 'see how you did'}</span></li>`).join('')}</ol>
      ${ses ? (ses.words.length ? `<p><b>Today's words:</b></p><p class="tt-chips">${ses.words.map((w) => `<span>${esc(w)}</span>`).join('')}</p>` : '') : `<label class="tt-pick">Which session is today? <select data-pick>${choices.map((s) => `<option value="${s.slug}">Session ${s.n}: ${esc(s.title)}</option>`).join('')}</select></label>`}
      <div class="btns"><button type="button" class="btn btn-primary" data-start>Start the 10-minute warm-up →</button></div>
    </div>
    <div class="tt-warm-run" hidden>
      <div class="tt-steps">${PARTS.map((p, k) => `<span data-part="${k}">${k + 1}. ${p.name}</span>`).join('')}<b class="tt-clock-sm" data-clock></b></div>
      <div class="tt-warm-body"></div>
      <div class="tt-warm-foot"><span class="tt-muted" data-left></span><button type="button" class="btn btn-outline btn-small" data-skip>Skip to the next part →</button></div>
    </div>
  </div>`;
  const $ = (q) => root.querySelector(q);
  let sess = ses;
  let part = -1, left = 0, timer = 0, last = 0, t = null, stage = data.unlocked;
  const sum = { correct: 0, typed: 0, secs: 0, misses: {}, runs: 0, words: 0, unlocked: [] };
  const add = (st) => { sum.correct += st.correct; sum.typed += st.typed; sum.secs += st.secs; for (const [k, v] of Object.entries(st.misses)) sum.misses[k] = (sum.misses[k] || 0) + v; };
  $('[data-start]').addEventListener('click', () => {
    sess = sess || findSession($('[data-pick]')?.value);
    $('.tt-warm-intro').hidden = true; $('.tt-warm-run').hidden = false;
    go(0);
    last = performance.now();
    timer = setInterval(tick, 250);
  });
  $('[data-skip]').addEventListener('click', () => next());
  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000; last = now;
    if (document.hidden || part >= 3) return;
    left -= dt;
    const total = PARTS.slice(part + 1, 3).reduce((a, p) => a + p.secs, 0) + Math.max(0, left);
    $('[data-clock]').textContent = `⏱️ ${fmt(Math.max(0, left) + 0.99)}`;
    $('[data-left]').textContent = `About ${Math.ceil(total / 60)} min left in the warm-up`;
    if (left <= 0) next();
  }
  function next() {
    // A part cut short by the clock still counts (stage runs only count when finished).
    if (t && part > 0 && part < 3) { const st = t.stats(); if (st.typed && !st.done) { add(st); addMisses(data, st.misses); persist(); } }
    go(part + 1);
  }
  function go(k) {
    part = k; left = PARTS[k].secs;
    root.querySelectorAll('[data-part]').forEach((el) => { el.className = +el.dataset.part < k ? 'done' : +el.dataset.part === k ? 'on' : ''; });
    $('[data-skip]').hidden = k >= 3;
    $('[data-clock]').textContent = k < 3 ? `⏱️ ${fmt(left)}` : '';
    const body = $('.tt-warm-body');
    t = null;
    if (k === 0) {
      body.innerHTML = `<div class="tt-posture-grid">
        <figure>${POSTURE_SVG}<figcaption>Sit like this before you start.</figcaption></figure>
        <div><h3>Get ready to type</h3>
          <ul class="tt-checks">
            <li><label><input type="checkbox"> 🦶 My feet are flat on the floor.</label></li>
            <li><label><input type="checkbox"> 🪑 My back is straight.</label></li>
            <li><label><input type="checkbox"> 🙌 My wrists are up, not resting on the desk.</label></li>
            <li><label><input type="checkbox"> <span>👆 My index fingers are on <b>F</b> and <b>J</b>. I can feel the bumps.</span></label></li>
          </ul>
          <div class="tt-kbd small"></div><div class="tt-handwrap small"></div>
          <button type="button" class="btn btn-primary" data-ready disabled>Tick all four, then start →</button>
        </div></div>`;
      const kb = keyboard(body.querySelector('.tt-kbd'), { compact: true });
      kb.many('asdfjkl;');
      hands(body.querySelector('.tt-handwrap')).all();
      const boxes = [...body.querySelectorAll('input[type=checkbox]')];
      const ready = body.querySelector('[data-ready]');
      body.addEventListener('change', () => { const all = boxes.every((b) => b.checked); ready.disabled = !all; ready.textContent = all ? "I'm ready! Start the drill →" : 'Tick all four, then start →'; });
      ready.addEventListener('click', () => next());
    } else if (k === 1) {
      body.innerHTML = `<div class="tt-phead"><div><span class="eyebrow" data-count></span><h2 data-title></h2><p class="tt-tip" data-tip></p></div></div><div class="tt-panel"></div>`;
      const panel = practicePanel(body.querySelector('.tt-panel'));
      const label = () => {
        const s = STAGES[stage];
        body.querySelector('[data-count]').textContent = `Your stage: ${stage + 1} of ${STAGES.length}`;
        body.querySelector('[data-title]').textContent = `${s.icon} ${s.title}`;
        body.querySelector('[data-tip]').innerHTML = s.tip;
      };
      label();
      t = typer(panel.box, {
        text: drillFor(stage), kb: panel.kb, hands: panel.hands, hint: panel.hint,
        onDone: (st) => {
          add(st); sum.runs++;
          const r = recordRun(stage, st);
          toast(`${starHtml(stars(st.acc))} ${pct(st.acc)} accuracy · ${st.wpm} wpm. ${r.passed ? 'Well done!' : 'Keep going!'}`);
          if (r.unlocked) { sum.unlocked.push(r.unlocked.title); toast(`🔓 Unlocked: <b>${esc(r.unlocked.title)}</b>`); stage = data.unlocked; label(); }
          t.setText(drillFor(stage));
        },
      });
      t.focus();
    } else if (k === 2) {
      const words = sess?.words?.length ? sess.words : drillFor(stage).split(' ');
      const mix = () => [...words, ...words].sort(() => Math.random() - 0.5).filter((w, k2, a) => w !== a[k2 - 1]).join(' ');
      body.innerHTML = `<div class="tt-phead"><div><span class="eyebrow">Today's words${sess ? ` · Session ${sess.n}` : ''}</span><h2>Type the words of the day</h2><p class="tt-tip">These are words you will meet in today's session. Type each one carefully.</p></div></div><div class="tt-panel"></div>`;
      const panel = practicePanel(body.querySelector('.tt-panel'));
      t = typer(panel.box, {
        text: mix(), kb: panel.kb, hands: panel.hands, hint: panel.hint,
        onWord: () => sum.words++,
        onDone: (st) => { add(st); addMisses(data, st.misses); persist(); toast(`✓ ${pct(st.acc)} accuracy. Here are the words again!`); t.setText(mix()); },
      });
      t.focus();
    } else {
      clearInterval(timer);
      const acc = sum.typed ? (sum.correct / sum.typed) * 100 : 100;
      const wpm = sum.secs ? Math.round(sum.correct / 5 / (sum.secs / 60)) : 0;
      const top = Object.entries(sum.misses).sort((a, b) => b[1] - a[1]).slice(0, 3);
      data.warmups = (data.warmups || 0) + 1;
      const badge = award(data, 'warmup');
      persist();
      const nextSess = sess ? `<a class="btn btn-primary" href="${sessionHref(sess)}">Go to Session ${sess.n} →</a>` : '';
      body.innerHTML = `<div class="tt-result tt-sum">
        <div class="tt-res-top">${starHtml(stars(acc))}<h3>Warm-up done! ${esc(feedback(acc, wpm))}</h3></div>
        <div class="tt-res-nums"><div><b>${pct(acc)}</b><span>accuracy</span></div><div><b>${wpm}</b><span>words a minute</span></div><div><b>${sum.words}</b><span>words of the day typed</span></div></div>
        <ul class="tt-sumlist">
          <li>🎓 You are on <b>Stage ${data.unlocked + 1}: ${esc(STAGES[data.unlocked].title)}</b>.${sum.unlocked.length ? ` Today you unlocked ${sum.unlocked.map(esc).join(', ')}!` : ''}</li>
          ${top.length ? `<li>🔍 Keys to practise: ${top.map(([k]) => `<b class="tt-key">${k === ' ' ? 'Space' : esc(k)}</b>`).join(' ')}</li>` : '<li>🔍 No wrong keys at all. Amazing!</li>'}
          <li>${pickOne(TIPS)}</li>
        </ul>
        ${badge ? `<p class="tt-new-badge">${badge.icon} New badge: <b>${esc(badge.name)}</b></p>` : ''}
        <div class="btns">${nextSess}<button type="button" class="btn btn-outline" data-go="trotro">🚐 Play Trotro Race</button><button type="button" class="btn btn-outline" data-go="progress">📈 My progress</button></div>
      </div>`;
      body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));
    }
  }
  return { stop() { clearInterval(timer); } };
}

// ---------- Games ----------
function game(maker) {
  return (root) => maker(root, {
    data, save: persist, stage: data.unlocked,
    done(r) {
      let badge = null, best = false;
      if (r.misses) addMisses(data, r.misses);
      if ('won' in r) {
        if (r.won && r.pace >= 20) badge = award(data, 'trotro');
        if (r.won) data.best.race = Math.max(data.best.race || 0, r.pace);
      } else {
        best = r.score > (data.best.mango || 0);
        if (best) data.best.mango = r.score;
        if (r.score >= 25) badge = award(data, 'mango');
      }
      persist();
      return { badge, best };
    },
  });
}

// ---------- Progress ----------
function chartSvg(checks) {
  const pts = checks.slice(-12);
  if (!pts.length) return '<p class="tt-empty">No speed checks yet. Do a 1-minute quick check to see your first point here.</p>';
  const W = 520, H = 210, L = 34, R = 12, T = 14, B = 26;
  const max = Math.max(40, ...pts.map((c) => c.wpm)) * 1.1;
  const x = (k) => L + (pts.length === 1 ? (W - L - R) / 2 : (k * (W - L - R)) / (pts.length - 1));
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const lines = TARGETS.map((t) => `<line class="target" x1="${L}" x2="${W - R}" y1="${y(t.wpm)}" y2="${y(t.wpm)}"/><text class="tlabel" x="${W - R}" y="${y(t.wpm) - 4}" text-anchor="end">${t.name} ${t.wpm}</text>`).join('');
  const ticks = [0, 10, 20, 30, 40, 50, 60, 80, 100].filter((v) => v < max).map((v) => `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
  const path = pts.map((c, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(c.wpm).toFixed(1)}`).join(' ');
  const dots = pts.map((c, k) => `<g class="pt"><circle cx="${x(k)}" cy="${y(c.wpm)}" r="5" class="${c.secs >= 180 ? 'full' : ''}"/><circle cx="${x(k)}" cy="${y(c.wpm)}" r="14" class="hit"><title>${new Date(c.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${c.wpm} wpm, ${Math.round(c.acc)}% accuracy (${c.secs / 60}-minute check)</title></circle></g>`).join('');
  const lastPt = pts[pts.length - 1];
  return `<svg class="tt-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Your last ${pts.length} speed checks in words a minute. Latest: ${lastPt.wpm} wpm.">
    <line class="axis" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>${ticks}${lines}
    <path d="${path}"/>${dots}
    <text class="last" x="${x(pts.length - 1)}" y="${y(lastPt.wpm) - 12}" text-anchor="${pts.length > 1 ? 'end' : 'middle'}">${lastPt.wpm} wpm</text>
    <text x="${L}" y="${H - 6}">Older</text><text x="${W - R}" y="${H - 6}" text-anchor="end">Latest</text>
  </svg>
  <p class="small-tip">Filled dots are 3-minute checks; open dots are 1-minute quick checks. Hover a dot for details.</p>`;
}
function progress(root) {
  const pp = passport(data);
  const best = data.best.check || 0;
  const missed = Object.entries(data.missed).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const passedN = STAGES.filter((s) => data.stages[s.id]?.passed).length;
  root.innerHTML = `<div class="tt-progress">
    <div class="tt-card tt-best"><span class="eyebrow">Personal best</span><b class="tt-bignum">${best}<small> wpm</small></b><p class="tt-muted">${data.checks.length ? `From ${data.checks.length} speed check${data.checks.length === 1 ? '' : 's'}.` : 'Do a speed check to set your first best.'}</p>
      <p class="tt-muted">🎓 Stage ${data.unlocked + 1} of ${STAGES.length} · ${passedN} passed<br>🚐 Best race win: ${data.best.race ? `${data.best.race} wpm pace` : 'none yet'}<br>🥭 Most mangoes: ${data.best.mango || 0}</p></div>
    <div class="tt-card tt-passport"><span class="eyebrow">Typing Passport</span>
      <h3>${pp ? `${pp.icon} ${pp.name} reached!` : 'Not stamped yet'}</h3>
      <ul>${TARGETS.map((t) => `<li class="${pp && TARGETS.indexOf(pp) >= TARGETS.indexOf(t) ? 'got' : ''}"><span>${t.icon}</span><b>${t.name}</b><em>${t.wpm} wpm at ${t.acc}% accuracy</em></li>`).join('')}</ul>
      <p class="small-tip">Passport levels count the full 3-minute speed check.</p></div>
    <div class="tt-card tt-clear"><h3>💻 On a shared computer?</h3><p class="tt-muted">Your typing progress is saved only in this browser on this computer. Nothing is sent anywhere. Clear it before you leave a shared PC.</p>
      <button type="button" class="btn btn-outline" data-clear>Clear my typing progress</button></div>
    <div class="tt-card tt-chartcard"><span class="eyebrow">Speed checks</span><h3>Words a minute</h3>${chartSvg(data.checks)}</div>
    <div class="tt-card tt-badges"><span class="eyebrow">Badges</span><h3>${Object.keys(data.badges).length} of ${BADGES.length} earned</h3>
      <ul>${BADGES.map((b) => `<li class="${data.badges[b.id] ? 'got' : ''}" title="${esc(b.text)}"><span>${b.icon}</span><b>${esc(b.name)}</b><small>${esc(b.text)}</small></li>`).join('')}</ul></div>
    <div class="tt-card tt-heat"><span class="eyebrow">Keys you miss most</span><h3>${missed.length ? 'Practise these keys' : 'No missed keys yet'}</h3>
      <div class="tt-kbd"></div>
      ${missed.length ? `<p class="tt-muted">Top misses: ${missed.map(([k, n]) => `<b class="tt-key">${k === ' ' ? 'Space' : esc(k)}</b> ${n}`).join(' · ')}. The redder the key, the more often you missed it.</p>` : '<p class="tt-muted">When you press a wrong key, the key you should have pressed turns red here.</p>'}</div>
  </div>`;
  keyboard(root.querySelector('.tt-heat .tt-kbd'), { compact: true }).heat(data.missed);
  root.querySelector('[data-clear]').addEventListener('click', () => {
    if (!confirm('Clear all your typing progress on this computer? Stages, speed checks and badges will be deleted.')) return;
    clear();
    data = load();
    toast('🧹 Typing progress cleared.');
    show('progress');
  });
}

const VIEWS = { lessons, warmup, check: speedCheck, trotro: game(trotroRace), mangoes: game(fallingMangoes), progress };

// Start: ?warmup=<session> opens the warm-up; #check etc. open a tab.
const startQ = new URLSearchParams(location.search).get('warmup');
const hash = location.hash.slice(1);
if (startQ != null) show('warmup', { keepQuery: true });
else show(VIEWS[hash] ? hash : 'lessons');
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (VIEWS[h] && viewEl.dataset.view !== h) show(h); });
