// Session 25 — Keyboard Shortcuts & Working Faster. Shortcut Race: a prompt
// asks for an action (copy, paste, undo, find, select all, save, switch window,
// screenshot…) and the pupil presses the real shortcut in a focused practice
// area. Only that element listens, and only the shortcuts captured there have
// their browser default stopped. Ones the browser or Windows keeps for itself
// (Alt + Tab, Win + Shift + S, Ctrl + W / T…) are answered by picking the keys
// from on-screen key buttons instead. A 3D keyboard lights up the keys.
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE, COLORS, mat, rbox, cable, decal, label, setLabel } from './runtime.js';

// cap: pressed for real in the practice area. pick: chosen from key buttons.
const SC = [
  { id: 'copy', act: 'Copy', keys: ['Ctrl', 'C'], cap: true, fx: '📋 Copied!', what: 'Copy what you selected. The original stays.', trick: 'C for Copy' },
  { id: 'cut', act: 'Cut', keys: ['Ctrl', 'X'], cap: true, fx: '✂️ Cut!', what: 'Move what you selected: it disappears until you paste.', trick: 'X looks like scissors' },
  { id: 'paste', act: 'Paste', keys: ['Ctrl', 'V'], cap: true, fx: '📌 Pasted!', what: 'Paste where the cursor is.', trick: 'V is a down arrow: put it here' },
  { id: 'undo', act: 'Undo', keys: ['Ctrl', 'Z'], cap: true, fx: '↶ Undone!', what: 'Take back your last action.', trick: 'Z = zap it' },
  { id: 'redo', act: 'Redo', keys: ['Ctrl', 'Y'], cap: true, fx: '↷ Redone!', what: 'Bring back what you undid, if you undid too much.', trick: 'Y comes after Z… nearly!', isNew: true },
  { id: 'all', act: 'Select all', keys: ['Ctrl', 'A'], cap: true, fx: '🟦 All selected', what: 'Select all the text, or every file in a folder.', trick: 'A for All', isNew: true },
  { id: 'save', act: 'Save', keys: ['Ctrl', 'S'], cap: true, fx: '💾 Saved!', what: 'Save your work. Do it every few minutes: power cuts happen!', trick: 'S for Save' },
  { id: 'find', act: 'Find a word', keys: ['Ctrl', 'F'], cap: true, fx: '🔍 Find: Bonwire', what: 'Find a word on a long page or in a long document.', trick: 'F for Find', isNew: true },
  { id: 'print', act: 'Print', keys: ['Ctrl', 'P'], cap: true, fx: '🖨️ Print preview', what: 'Print, with print preview first.', trick: 'P for Print' },
  { id: 'bold', act: 'Make it bold', keys: ['Ctrl', 'B'], cap: true, fx: '𝐁 Bold!', what: 'Bold the selected text. Press again to undo it.', trick: 'B for Bold' },
  { id: 'word', act: 'Jump one word right', keys: ['Ctrl', '→'], cap: true, word: true, fx: '➡️ Jumped a word', what: 'The cursor jumps a whole word instead of one letter.', trick: 'Ctrl makes arrows take big steps', isNew: true },
  { id: 'delword', act: 'Delete a whole word', keys: ['Ctrl', 'Backspace'], cap: true, word: true, fx: '⌫ Word deleted', what: 'Delete the whole word before the cursor in one press.', trick: 'Ctrl makes Backspace take big bites', isNew: true },
  { id: 'switch', act: 'Switch windows', keys: ['Alt', 'Tab'], fx: '🪟 Switched to Chrome', what: 'Hold Alt, tap Tab to step through your windows, let go on the one you want.', trick: 'Alt + Tab = all tabs… of windows' },
  { id: 'snip', act: 'Screenshot part of the screen', keys: ['Win', 'Shift', 'S'], fx: '📸 Snip copied!', what: 'The Snipping Tool opens: drag a box, and the picture is copied, ready to paste.', trick: 'S for Snip', isNew: true },
  { id: 'desktop', act: 'Show the desktop', keys: ['Win', 'D'], fx: '🖥️ Desktop', what: 'Hide every window at once. Press again to bring them back.', trick: 'D for Desktop', isNew: true },
  { id: 'explorer', act: 'Open File Explorer', keys: ['Win', 'E'], fx: '📁 File Explorer', what: 'Open File Explorer to find your files.', trick: 'E for Explorer' },
  { id: 'lock', act: 'Lock the PC', keys: ['Win', 'L'], fx: '🔒 Locked', what: 'Your work stays open, but nobody else can use the PC.', trick: 'L for Lock', isNew: true },
  { id: 'newtab', act: 'Open a new browser tab', keys: ['Ctrl', 'T'], fx: '➕ New tab', what: 'Open a new tab in Chrome or Edge.', trick: 'T for Tab' },
  { id: 'closetab', act: 'Close this browser tab', keys: ['Ctrl', 'W'], fx: '✖️ Tab closed', what: 'Close the tab you are on, at once. Careful: a half-filled form may be lost!', trick: 'W for Window' },
  { id: 'reopen', act: 'Bring back a closed tab', keys: ['Ctrl', 'Shift', 'T'], fx: '♻️ Tab is back!', what: 'Reopen the tab you closed by mistake. A life-saver!', trick: 'T for Tab, Shift to bring it back', isNew: true },
  { id: 'address', act: 'Jump to the address bar', keys: ['Ctrl', 'L'], fx: '🌍 Address bar', what: 'Select the address bar, ready to type a new address or search.', trick: 'L for Location', isNew: true },
  { id: 'refresh', act: 'Refresh the page', keys: ['F5'], fx: '🔄 Refreshed', what: 'Reload the web page. In PowerPoint, F5 starts the slide show!', trick: 'F5 = fresh' },
];
const byId = Object.fromEntries(SC.map((s) => [s.id, s]));
const PICK_KEYS = ['Ctrl', 'Alt', 'Shift', 'Win', 'Tab', 'D', 'E', 'L', 'S', 'T', 'W', 'F5', 'PrtSc'];
const RACE_LEN = 8;
const TARGET = 45; // seconds
const PENALTY = 2;
const HINT_AFTER = 5;
const BEST_KEY = 'bih-shortcut-race-best';

// The 3D keyboard: [legend, code, width]. Legends match the labels in SC.
const ROWS = [
  [['Esc', 'Escape', 1], ...Array.from({ length: 12 }, (_, i) => [`F${i + 1}`, `F${i + 1}`, 1]), ['PrtSc', 'PrintScreen', 1.4]],
  [['`', 'Backquote', 1], ...'1234567890'.split('').map((d) => [d, `Digit${d}`, 1]), ['-', 'Minus', 1], ['=', 'Equal', 1], ['Backspace', 'Backspace', 1.9]],
  [['Tab', 'Tab', 1.5], ...'QWERTYUIOP'.split('').map((c) => [c, `Key${c}`, 1]), ['[', 'BracketLeft', 1], [']', 'BracketRight', 1], ['\\', 'Backslash', 1.4]],
  [['Caps', 'CapsLock', 1.8], ...'ASDFGHJKL'.split('').map((c) => [c, `Key${c}`, 1]), [';', 'Semicolon', 1], ["'", 'Quote', 1], ['Enter', 'Enter', 2.1]],
  [['Shift', 'ShiftLeft', 2.3], ...'ZXCVBNM'.split('').map((c) => [c, `Key${c}`, 1]), [',', 'Comma', 1], ['.', 'Period', 1], ['/', 'Slash', 1], ['Shift', 'ShiftRight', 2.6]],
  [['Ctrl', 'ControlLeft', 1.4], ['Win', 'MetaLeft', 1.2], ['Alt', 'AltLeft', 1.2], ['Space', 'Space', 4.9], ['Alt', 'AltRight', 1.2], ['Ctrl', 'ControlRight', 1.3], ['←', 'ArrowLeft', 1], ['↓', 'ArrowDown', 1], ['↑', 'ArrowUp', 1], ['→', 'ArrowRight', 1]],
];
// A shortcut's key label → the key codes it lights on the 3D keyboard.
const CODES = { Ctrl: ['ControlLeft', 'ControlRight'], Alt: ['AltLeft', 'AltRight'], Shift: ['ShiftLeft', 'ShiftRight'], Win: ['MetaLeft'], Tab: ['Tab'], Backspace: ['Backspace'], '→': ['ArrowRight'], '←': ['ArrowLeft'], F5: ['F5'], PrtSc: ['PrintScreen'] };
const codesFor = (k) => CODES[k] ?? [/^[A-Z]$/.test(k) ? `Key${k}` : k];
const kbd = (keys) => keys.map((k) => `<kbd style="display:inline-block;min-width:1.6em;padding:1px 7px;border:1.5px solid var(--line);border-bottom-width:3px;border-radius:7px;background:#fff;font:600 13px Rubik,system-ui,sans-serif;text-align:center">${k === 'Win' ? '⊞ Win' : k}</kbd>`).join(' + ');
const plain = (keys) => keys.map((k) => (k === 'Win' ? 'Windows key' : k)).join(' + ');

export default function shortcutsLab(stage, ui) {
  const { scene } = stage;
  // ---------- State ----------
  let race = null; // { list, i, start, penalty, mistakes, mouse, noMouse, shownAt }
  let learn = null; // the shortcut being learnt
  let picked = new Set();
  let toast = null; // { text, color, until }
  let best = null;
  try { best = Number(localStorage.getItem(BEST_KEY)) || null; } catch {}
  let learnt = new Set();
  try { learnt = new Set(JSON.parse(localStorage.getItem('bih-shortcut-learnt') || '[]')); } catch {}

  // ---------- Desk, monitor, keyboard, mouse, stopwatch ----------
  const desk = rbox(13, 0.3, 7, 0xc8a27a, 0.08);
  desk.position.y = -0.15;
  scene.add(desk);
  const monitor = new THREE.Group();
  monitor.position.set(0, 0, -2.3);
  scene.add(monitor);
  const MW = 6.4;
  const MH = 3.6;
  const bezel = rbox(MW + 0.3, MH + 0.3, 0.22, 0x2b2730, 0.08);
  bezel.position.set(0, 2.55, 0);
  const stand = rbox(0.5, 1.0, 0.25, 0x3a3f45, 0.05);
  stand.position.set(0, 0.6, -0.15);
  const standFoot = rbox(2.2, 0.1, 1.1, 0x3a3f45, 0.04);
  standFoot.position.set(0, 0.05, 0);
  const screen = decal(MW, MH, () => {}, { px: 400, transparent: false });
  screen.position.set(0, 2.55, 0.115);
  monitor.add(bezel, stand, standFoot, screen);
  monitor.rotation.x = -0.05;

  const board = new THREE.Group();
  const U = 0.5;
  const keys = new Map(); // code -> { mesh, top, baseY, text }
  const CW = 15 * U + 0.45;
  const CD = 6 * U + 0.55;
  const shell = rbox(CW, 0.3, CD, 0x3a2b47, 0.1);
  shell.position.y = 0.15;
  const plate = rbox(15 * U + 0.1, 0.04, 6 * U + 0.16, 0x24182e, 0.03);
  plate.position.set(0, 0.3, -0.04);
  board.add(shell, plate);
  board.add(cable([[0, 0.15, -CD / 2], [0.2, 0.05, -CD / 2 - 0.4], [1.5, 0.03, -CD / 2 - 0.7], [2.2, 0.03, -2.2]], 0x24182e, 0.04));
  const sideMat = mat(0xdee2e6);
  ROWS.forEach((row, r) => {
    let x = -7.5 * U;
    for (const [text, code, w] of row) {
      const geo = topAndSides(new RoundedBoxGeometry(w * U - 0.07, 0.24, U - 0.07, 2, 0.05));
      const top = new THREE.MeshStandardMaterial({ map: keyTop(text, w), roughness: 0.6 });
      const mesh = new THREE.Mesh(geo, [sideMat, top]);
      mesh.castShadow = true;
      mesh.position.set(x + (w * U) / 2, 0.42, (r - 2.5) * U + (r === 0 ? -0.1 : 0));
      board.add(mesh);
      keys.set(code, { mesh, top, baseY: 0.42, text });
      stage.clickable(mesh, () => clickKey(text));
      x += w * U;
    }
  });
  board.rotation.x = 0.06;
  board.position.set(-0.6, 0.02, 1.0);
  scene.add(board);

  // The mouse: it turns upside down for a no-mouse round, like in the workbook.
  const mouse = new THREE.Group();
  const pad = rbox(1.5, 0.04, 1.8, COLORS.blue, 0.04);
  pad.position.y = 0.02;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), mat(0xe9e5ec));
  body.scale.set(0.8, 0.45, 1.25);
  body.position.y = 0.2;
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), mat(0x3a3f45));
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.34, -0.18);
  const mouseBody = new THREE.Group();
  mouseBody.add(body, wheel);
  mouse.add(pad, mouseBody);
  mouse.position.set(4.6, 0, 1.2);
  scene.add(mouse);
  mouse.add(cable([[0, 0.2, -0.45], [0, 0.05, -1.0], [-0.6, 0.03, -2.0], [-2.2, 0.03, -2.7]], 0x24182e, 0.03));
  const noMouseTag = label('🚫 No mouse!', { scale: 0.5, bg: '#CA1F3F', color: '#FFFFFF' });
  noMouseTag.position.set(0, 0.95, 0);
  noMouseTag.visible = false;
  mouse.add(noMouseTag);

  // A stopwatch whose hand sweeps while you race.
  const watch = new THREE.Group();
  const case_ = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.22, 32), mat(COLORS.red));
  case_.rotation.x = Math.PI / 2;
  const face = decal(1.24, 1.24, (g, W, H) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#24182E';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r1 = W * 0.44;
      const r0 = i % 5 ? W * 0.41 : W * 0.37;
      g.save();
      g.translate(W / 2, H / 2);
      g.rotate(a);
      g.fillRect(-1.5, -r1, 3, r1 - r0);
      g.restore();
    }
    g.font = `bold ${H * 0.1}px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.fillText('BIH', W / 2, H * 0.68);
  }, { px: 256 });
  face.position.z = 0.115;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12), mat(0x3a3f45));
  crown.position.y = 0.8;
  const hand = new THREE.Group();
  const needle = rbox(0.05, 0.55, 0.02, COLORS.red, 0.01);
  needle.position.y = 0.24;
  hand.add(needle);
  hand.position.z = 0.13;
  watch.add(case_, face, crown, hand);
  watch.position.set(-4.9, 0.95, 0.4);
  watch.rotation.set(-0.25, 0.3, 0);
  scene.add(watch);
  const watchStand = rbox(0.9, 0.14, 0.6, 0x3a3f45, 0.04);
  watchStand.position.set(-4.9, 0.07, 0.45);
  scene.add(watchStand);

  // ---------- Callouts (most important first: phones show four) ----------
  // These cards only point things out; their text never changes.
  stage.callout(screen, { icon: '⚡', title: 'The prompt', text: 'Do this action, fast!', at: [-MW / 2 + 0.4, MH / 2 - 0.4, 0], dx: -60, dy: -50 });
  stage.callout(keys.get('ControlLeft').mesh, { icon: '⌨️', title: 'Hold, tap, let go', text: 'Hold Ctrl, tap the letter', at: [0, 0.12, 0.1], dx: -90, dy: 80 });
  stage.callout(keys.get('MetaLeft').mesh, { icon: '⊞', title: 'Windows key', text: 'A master key for the PC', at: [0, 0.12, 0.1], dx: 20, dy: 110 });
  stage.callout(watch, { icon: '⏱️', title: 'Timer', text: `Beat ${TARGET} seconds`, at: [0, 0.75, 0], dx: -20, dy: -80 });
  stage.callout(mouse, { icon: '🖱️', title: 'The long way', text: 'Mouse: 5 moves. Shortcut: 1', at: [0, 0.4, 0], dx: 40, dy: -80 });

  // ---------- Side panel ----------
  const raceG = ui.group('Race');
  const startBtn = ui.button(`🏁 Start race (${RACE_LEN} shortcuts)`, () => startRace(false), { primary: true, group: raceG });
  const noMouseBtn = ui.button('🐭 No-mouse round', () => startRace(true), { group: raceG });
  const stopBtn = ui.button('■ Stop', () => stopRace(), { group: raceG });
  const timeLine = ui.element('<p class="crack" aria-live="off"></p>', raceG).firstElementChild;

  const padG = ui.group('Practice area');
  const padEl = ui.element(`<div tabindex="0" role="application" aria-label="Practice area: press the shortcut keys here" style="border:2.5px dashed var(--line);border-radius:14px;padding:14px;text-align:center;background:#fff;outline:none;cursor:text;min-height:92px"></div>`, padG).firstElementChild;
  const pickBox = ui.element('<div></div>', padG).firstElementChild;

  const learnG = ui.group('Learn mode: shortcuts you may not know');
  const learnBtns = SC.filter((s) => s.isNew).map((s) => {
    const b = ui.button(`${learnt.has(s.id) ? '✅ ' : ''}${s.act}`, () => startLearn(s.id), { group: learnG });
    b.dataset.id = s.id;
    return b;
  });

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function current() {
    if (race) return race.list[race.i];
    return learn;
  }
  function renderPad(note) {
    const s = current();
    const focused = document.activeElement === padEl;
    padEl.style.borderStyle = focused ? 'solid' : 'dashed';
    padEl.style.borderColor = focused ? 'var(--plum)' : 'var(--line)';
    padEl.style.boxShadow = focused ? '0 0 0 3px var(--gold)' : 'none';
    if (!s) {
      padEl.innerHTML = `<b style="font-size:16px">⌨️ ${focused ? 'Ready! Press any shortcut you know.' : 'Click here (or Tab to here), then press the keys.'}</b><small style="display:block;color:var(--muted);margin-top:4px">Only this box listens to your keys.</small>`;
      return;
    }
    const showKeys = learn || (race && race.hint);
    padEl.innerHTML = `<span class="mission-label" style="color:var(--muted)">${race ? `Shortcut ${race.i + 1} of ${race.list.length}` : 'Learn mode'}</span>
      <b style="display:block;font-size:22px;margin:2px 0">${esc(s.act)}</b>
      ${showKeys ? `<div style="margin:6px 0">${kbd(s.keys)}</div>` : ''}
      <small style="display:block;color:var(--muted)">${note ?? (s.cap ? (focused ? 'Press the real keys now.' : '👆 Click here first, then press the real keys.') : 'The computer keeps these keys for itself, so pick them below.')}</small>`;
  }
  function renderPick() {
    const s = current();
    if (!s || s.cap) {
      pickBox.innerHTML = '';
      return;
    }
    pickBox.innerHTML = `<div class="mail-card" style="margin-top:8px"><small style="display:block;color:var(--muted);margin-bottom:6px">${s.keys.includes('W') || s.keys.includes('T') ? 'Don\'t press these for real here: Ctrl + W really closes this page! ' : ''}Choose the keys (Space), then press Enter or ✓ Done.</small>
      <div class="btns-inline" style="margin-top:0">${PICK_KEYS.map((k) => `<button type="button" class="lab-btn${picked.has(k) ? ' active' : ''}" data-key="${k}" aria-pressed="${picked.has(k)}">${k === 'Win' ? '⊞ Win' : k}</button>`).join('')}
      <button type="button" class="lab-btn primary" data-done="1">✓ Done</button></div></div>`;
  }
  pickBox.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.done) return submitPick();
    const k = b.dataset.key;
    if (picked.has(k)) picked.delete(k);
    else picked.add(k);
    b.classList.toggle('active', picked.has(k));
    b.setAttribute('aria-pressed', String(picked.has(k)));
    lightPicked();
  });
  // Enter anywhere in the key buttons means "Done" (Space chooses a key).
  pickBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.closest('button[data-key]')) {
      e.preventDefault();
      submitPick();
    }
  });

  // ---------- The practice area: the only place that listens to keys ----------
  const MODS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'OS']);
  function match(s, e) {
    if (!s.cap) return false;
    const want = new Set(s.keys.slice(0, -1));
    const main = s.keys.at(-1);
    const ctrl = e.ctrlKey || e.metaKey || (s.word && e.altKey); // Cmd on a Mac; Option for word jumps
    if (want.has('Ctrl') !== ctrl) return false;
    if (want.has('Shift') !== e.shiftKey) return false;
    if (!s.word && e.altKey) return false;
    if (main === '→') return e.key === 'ArrowRight';
    if (main === 'Backspace') return e.key === 'Backspace';
    return e.key.toLowerCase() === main.toLowerCase() || e.code === `Key${main}`;
  }
  const comboText = (e) => [e.ctrlKey && 'Ctrl', e.metaKey && 'Cmd', e.altKey && 'Alt', e.shiftKey && 'Shift', MODS.has(e.key) ? null : (e.key.length === 1 ? e.key.toUpperCase() : e.key.replace('Arrow', ''))].filter(Boolean).join(' + ');
  padEl.addEventListener('keydown', (e) => {
    pressKey(e.code, true);
    if (MODS.has(e.key)) return;
    const hit = SC.find((s) => match(s, e));
    // Stop the browser's own action only for the shortcuts this lab captures.
    if (hit) e.preventDefault();
    const s = current();
    if (!s) {
      if (hit) {
        flash(hit, true);
        ui.info(`${hit.fx}`, `<p>That was ${kbd(hit.keys)}: <b>${esc(hit.act)}</b>. ${esc(hit.what)}</p><p>Press <b>Start race</b> when you are ready.</p>`);
      }
      return;
    }
    if (!s.cap) return; // this one is answered with the key buttons
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !hit) return; // plain typing or Tab: ignore
    if (match(s, e)) correct(s);
    else wrong(s, hit ? `That was ${kbd(hit.keys)}: <b>${esc(hit.act)}</b>.` : `You pressed <b>${esc(comboText(e))}</b>.`);
  });
  padEl.addEventListener('keyup', (e) => pressKey(e.code, false));
  padEl.addEventListener('focus', () => renderPad());
  padEl.addEventListener('blur', () => { for (const c of keys.keys()) pressKey(c, false); renderPad(); });

  // A mouse click anywhere during a race counts as using the mouse.
  document.addEventListener('pointerdown', (e) => {
    if (!race || race.mouse || e.pointerType !== 'mouse') return;
    race.mouse = true;
    if (race.noMouse) ui.info('🖱️ You touched the mouse!', '<p>This round no longer counts as no-mouse, but keep going. Next time use <b>Tab</b> to move between buttons, <b>Space</b> to choose and <b>Enter</b> to press.</p>');
  }, true);

  // ---------- Answers ----------
  function correct(s) {
    flash(s, true);
    showToast(s.fx, '#2EC4B6');
    if (learn) {
      learnt.add(s.id);
      try { localStorage.setItem('bih-shortcut-learnt', JSON.stringify([...learnt])); } catch {}
      learnBtns.forEach((b) => (b.textContent = `${learnt.has(b.dataset.id) ? '✅ ' : ''}${byId[b.dataset.id].act}`));
      const n = SC.filter((x) => x.isNew && learnt.has(x.id)).length;
      ui.info(`✅ ${s.act}: ${plain(s.keys)}`, `<p>${esc(s.what)}</p><p>💡 Memory trick: <b>${esc(s.trick)}</b>.</p><p>You have learnt <b>${n}</b> new shortcut${n === 1 ? '' : 's'} here.${n < 3 ? ' Pick another one!' : ''} Write the ones you like on your shortcut card.</p>`);
      if (n >= 3) ui.complete('learn');
      learn = null;
      picked = new Set();
      lightTargets();
      renderPad();
      renderPick();
      return;
    }
    race.i++;
    picked = new Set();
    if (race.i >= race.list.length) return finish();
    nextPrompt();
  }
  function wrong(s, what) {
    flash(s, false);
    showToast('✗ Not that one', '#CA1F3F');
    if (race) {
      race.penalty += PENALTY;
      race.mistakes++;
      race.hint = true;
      lightTargets();
    }
    ui.info(`Not quite: we need “${s.act}”`, `<p>${what} ${race ? `That adds <b>${PENALTY} seconds</b>.` : ''}</p><p>The right keys are lit up gold on the keyboard: ${kbd(s.keys)}. Hold the first key, tap the last key, let go.</p>`);
    renderPad();
  }
  function submitPick() {
    const s = current();
    if (!s || s.cap) return;
    const want = new Set(s.keys);
    const ok = picked.size === want.size && [...want].every((k) => picked.has(k));
    if (ok) {
      correct(s);
      padEl.focus({ preventScroll: true });
    } else {
      wrong(s, picked.size ? `You chose <b>${esc([...picked].join(' + '))}</b>.` : 'You did not choose any keys yet.');
      picked = new Set();
      renderPick();
      pickBox.querySelector('button')?.focus({ preventScroll: true });
    }
  }
  function clickKey(text) {
    const s = current();
    const k = text === 'Win' ? 'Win' : text;
    if (s && !s.cap && PICK_KEYS.includes(k)) {
      if (picked.has(k)) picked.delete(k);
      else picked.add(k);
      renderPick();
      lightPicked();
      return;
    }
    const code = [...keys.entries()].find(([, v]) => v.text === text)?.[0];
    if (code) {
      pressKey(code, true);
      setTimeout(() => pressKey(code, false), 150);
    }
    ui.info(`The ${text === 'Win' ? 'Windows' : text} key`, s?.cap ? '<p>Clicking a 3D key is the long way! Click the <b>practice area</b> and press the real keys.</p>' : '<p>Press <b>Start race</b> or pick a shortcut in <b>Learn mode</b>, then use your real keyboard.</p>');
  }

  // ---------- Racing ----------
  function startRace(noMouse) {
    stage.reveal();
    learn = null;
    const caps = shuffle(SC.filter((s) => s.cap && !s.word)).slice(0, RACE_LEN - 2);
    const picks = shuffle(SC.filter((s) => !s.cap)).slice(0, 2);
    race = { list: shuffle([...caps, ...picks]), i: 0, start: performance.now(), penalty: 0, mistakes: 0, mouse: false, noMouse };
    picked = new Set();
    showToast(noMouse ? '🐭 No mouse! Go!' : '🏁 Go!', '#FFBE00');
    flipMouse(noMouse);
    nextPrompt();
    padEl.focus({ preventScroll: true });
    ui.info(noMouse ? '🐭 No-mouse round' : '🏁 The race is on!', `<p>${RACE_LEN} actions, as fast as you can. Wrong keys add ${PENALTY} seconds. ${noMouse ? 'Keep your hand off the mouse: use <b>Tab</b> to reach buttons, <b>Space</b> to choose a key and <b>Enter</b> for Done.' : 'Keys light up gold if you get stuck.'}</p>`);
  }
  function nextPrompt() {
    const s = current();
    race.shownAt = performance.now();
    race.hint = false;
    lightTargets();
    renderPad();
    renderPick();
    if (!s.cap) setTimeout(() => pickBox.querySelector('button')?.focus({ preventScroll: true }), 0);
    else padEl.focus({ preventScroll: true });
  }
  const elapsed = () => (race ? (performance.now() - race.start) / 1000 + race.penalty : 0);
  function finish() {
    const t = elapsed();
    const r = race;
    race = null;
    flipMouse(false);
    lightTargets();
    renderPad('🏆 Finished! Press Start race to go again.');
    renderPick();
    let newBest = false;
    if (!best || t < best) {
      best = t;
      newBest = true;
      try { localStorage.setItem(BEST_KEY, String(t.toFixed(1))); } catch {}
    }
    lastTime = t;
    showToast(`🏁 ${t.toFixed(1)} s`, t < TARGET ? '#2EC4B6' : '#FFBE00');
    const beat = t < TARGET;
    ui.info(`🏁 ${t.toFixed(1)} seconds${newBest ? ' · new best!' : ''}`, `<p>${r.mistakes ? `${r.mistakes} wrong press${r.mistakes === 1 ? '' : 'es'} (+${r.penalty} s). ` : 'No mistakes! '}${beat ? `You beat the ${TARGET}-second target. ⚡` : `The target is ${TARGET} seconds. Try again: accuracy first, then speed.`}</p><p>${r.mouse ? 'You used the mouse this time.' : '🐭 <b>No mouse at all.</b> That is how fast office workers work!'}</p><p>Write your best time in the Page 5 table: <b>${best.toFixed(1)} s</b>.</p>`);
    if (beat) ui.complete('target');
    if (!r.mouse) ui.complete('nomouse');
    if (beat || newBest) stage.confetti();
  }
  let lastTime = null;
  function stopRace() {
    if (!race && !learn) return;
    race = null;
    learn = null;
    picked = new Set();
    flipMouse(false);
    lightTargets();
    renderPad();
    renderPick();
    ui.info('■ Stopped', '<p>Press <b>Start race</b> whenever you are ready.</p>');
  }

  // ---------- Learn mode ----------
  function startLearn(id) {
    if (race) return ui.info('Finish the race first', '<p>Or press <b>■ Stop</b>.</p>');
    learn = byId[id];
    picked = new Set();
    lightTargets();
    renderPad();
    renderPick();
    stage.reveal();
    ui.info(`📚 ${learn.act}: ${plain(learn.keys)}`, `<p>${esc(learn.what)}</p><p>💡 Memory trick: <b>${esc(learn.trick)}</b>.</p><p>${learn.cap ? 'Now try it: click the practice area and press the keys.' : 'Windows or the browser keeps these keys for itself, so here you pick them. Try them for real on Page 5!'}</p>`);
    if (learn.cap) padEl.focus({ preventScroll: true });
    else setTimeout(() => pickBox.querySelector('button')?.focus({ preventScroll: true }), 0);
  }

  // ---------- The 3D keyboard reacts ----------
  function pressKey(code, down) {
    const k = keys.get(code);
    if (!k) return;
    k.mesh.position.y = down ? k.baseY - 0.1 : k.baseY;
    if (!down) setTop(k);
  }
  function setTop(k) {
    k.top.emissive.setHex(k.lit ? 0x8a5c00 : 0x000000);
  }
  function lightTargets() {
    const s = current();
    const show = s && (learn || race?.hint);
    const on = new Set(show ? s.keys.flatMap(codesFor) : []);
    for (const [code, k] of keys) {
      k.lit = on.has(code);
      setTop(k);
    }
  }
  function lightPicked() {
    const on = new Set([...picked].flatMap(codesFor));
    const s = current();
    const target = new Set(s && (learn || race?.hint) ? s.keys.flatMap(codesFor) : []);
    for (const [code, k] of keys) {
      k.lit = on.has(code) || target.has(code);
      k.top.emissive.setHex(on.has(code) ? 0x1d5f8a : k.lit ? 0x8a5c00 : 0);
    }
  }
  function flash(s, ok) {
    const codes = s.keys.flatMap(codesFor);
    for (const c of codes) {
      const k = keys.get(c);
      if (!k) continue;
      k.top.emissive.setHex(ok ? 0x0d6b5f : 0x7a0f22);
      k.mesh.position.y = k.baseY - 0.1;
      setTimeout(() => { k.mesh.position.y = k.baseY; setTop(k); }, 260);
    }
  }
  async function flipMouse(on) {
    noMouseTag.visible = on;
    const from = mouseBody.rotation.z;
    const to = on ? Math.PI : 0;
    if (from === to) return;
    await stage.tween((k) => {
      mouseBody.rotation.z = from + (to - from) * k;
      mouseBody.position.y = Math.sin(k * Math.PI) * 0.5 + (on ? 0.2 * k : 0.2 * (1 - k));
    }, 0.5);
  }
  function showToast(text, color) {
    toast = { text, color, until: performance.now() + 1100 };
  }

  // ---------- Monitor ----------
  let lastDraw = 0;
  function drawScreen() {
    const c = screen.material.map.image;
    const g = c.getContext('2d');
    const W = c.width;
    const H = c.height;
    g.fillStyle = '#F4F0F6';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#24182E';
    g.fillRect(0, 0, W, H * 0.13);
    g.fillStyle = '#FFBE00';
    g.font = `bold ${H * 0.07}px Rubik, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    g.fillText('⚡ SHORTCUT RACE', W * 0.03, H * 0.067);
    g.textAlign = 'right';
    g.fillStyle = '#ffffff';
    g.fillText(race ? `${elapsed().toFixed(1)} s` : best ? `Best: ${best.toFixed(1)} s` : `Target: ${TARGET} s`, W * 0.97, H * 0.067);
    g.textAlign = 'center';
    const s = current();
    if (s) {
      g.fillStyle = '#8a7f94';
      g.font = `600 ${H * 0.055}px Rubik, system-ui, sans-serif`;
      g.fillText(race ? `SHORTCUT ${race.i + 1} OF ${race.list.length}` : 'LEARN MODE', W / 2, H * 0.24);
      g.fillStyle = '#24182E';
      let px = H * 0.16;
      do g.font = `bold ${px}px Rubik, system-ui, sans-serif`;
      while (g.measureText(s.act).width > W * 0.9 && (px -= 4) > 20);
      g.fillText(s.act, W / 2, H * 0.42);
      g.fillStyle = '#5c5266';
      g.font = `${H * 0.06}px Rubik, system-ui, sans-serif`;
      g.fillText(learn || race?.hint ? plain(s.keys) : s.cap ? 'Press the real keys' : 'Pick the keys on the panel', W / 2, H * 0.58);
    } else {
      g.fillStyle = '#24182E';
      g.font = `bold ${H * 0.1}px Rubik, system-ui, sans-serif`;
      g.fillText(lastTime ? `Last race: ${lastTime.toFixed(1)} s` : 'Ready to race?', W / 2, H * 0.36);
      g.fillStyle = '#5c5266';
      g.font = `${H * 0.06}px Rubik, system-ui, sans-serif`;
      g.fillText('Hold the first key · tap the last key · let go', W / 2, H * 0.52);
    }
    // Progress dots.
    if (race) {
      const n = race.list.length;
      for (let i = 0; i < n; i++) {
        g.fillStyle = i < race.i ? '#2EC4B6' : i === race.i ? '#FFBE00' : '#d9d3de';
        g.beginPath();
        g.arc(W / 2 + (i - (n - 1) / 2) * W * 0.06, H * 0.7, H * 0.022, 0, Math.PI * 2);
        g.fill();
      }
    }
    // The document line, and what the last shortcut did.
    g.fillStyle = '#ffffff';
    g.fillRect(W * 0.08, H * 0.78, W * 0.84, H * 0.14);
    g.fillStyle = '#3B3343';
    g.font = `${H * 0.05}px Calibri, Carlito, Arial, sans-serif`;
    g.fillText('Waakye is the best breakfast in Ghana.', W / 2, H * 0.85);
    if (toast && performance.now() < toast.until) {
      g.font = `bold ${H * 0.07}px Rubik, system-ui, sans-serif`;
      const tw = g.measureText(toast.text).width + W * 0.06;
      g.fillStyle = toast.color;
      g.beginPath();
      g.roundRect(W / 2 - tw / 2, H * 0.62, tw, H * 0.14, H * 0.05);
      g.fill();
      g.fillStyle = toast.color === '#FFBE00' || toast.color === '#2EC4B6' ? '#24182E' : '#ffffff';
      g.fillText(toast.text, W / 2, H * 0.695);
    }
    g.textAlign = 'left';
    screen.material.map.needsUpdate = true;
  }
  stage.onTick((dt, t) => {
    if (t - lastDraw > 0.1) {
      lastDraw = t;
      drawScreen();
      if (race) {
        timeLine.innerHTML = `⏱️ <b>${elapsed().toFixed(1)} s</b> · target ${TARGET} s${best ? ` · best ${best.toFixed(1)} s` : ''}${race.mouse ? ' · 🖱️ mouse used' : ''}`;
        // Stuck? After a few seconds the right keys light up (and cost nothing).
        if (!race.hint && (performance.now() - race.shownAt) / 1000 > HINT_AFTER) {
          race.hint = true;
          lightTargets();
          renderPad();
        }
      } else timeLine.innerHTML = best ? `🏆 Best time on this computer: <b>${best.toFixed(1)} s</b> (target ${TARGET} s)` : `Target: under <b>${TARGET} s</b>`;
    }
    hand.rotation.z = race ? -((elapsed() % 60) / 60) * Math.PI * 2 : hand.rotation.z * 0.9;
    if (race) setLabel(watchTag, `${elapsed().toFixed(1)} s`);
  });
  const watchTag = label('', { scale: 0.5 });
  watchTag.position.set(0, -0.95, 0);
  watch.add(watchTag);
  setLabel(watchTag, best ? `Best ${best.toFixed(1)} s` : `${TARGET} s`);

  renderPad();
  renderPick();
  drawScreen();
  ui.info('Shortcut Race ⚡', `<p>A shortcut is the short path through the market: one quick press instead of five mouse moves.</p><p>Press <b>Start race</b>: a prompt shows an action like <b>Copy</b>. Press the real shortcut in the <b>practice area</b>. For the keys Windows keeps for itself, like <b>Alt + Tab</b>, pick them from the key buttons. Beat <b>${TARGET} seconds</b>!</p><p class="small-tip">You need a real keyboard for the race. On a phone, use Learn mode.</p>`);
}

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// Regroups a box geometry into sides (material 0) and top (material 1): two draw calls per key.
function topAndSides(geo) {
  const idx = geo.index ? Array.from(geo.index.array) : Array.from({ length: geo.attributes.position.count }, (_, i) => i);
  const groups = geo.groups;
  const sides = groups.filter((g, i) => i !== 2).flatMap((g) => idx.slice(g.start, g.start + g.count));
  const top = idx.slice(groups[2].start, groups[2].start + groups[2].count);
  geo.setIndex([...sides, ...top]);
  geo.clearGroups();
  geo.addGroup(0, sides.length, 0);
  geo.addGroup(sides.length, top.length, 1);
  return geo;
}
// The printed top of a keycap.
function keyTop(text, w) {
  const c = document.createElement('canvas');
  c.width = Math.round(Math.min(512, 128 * w));
  c.height = Math.round(c.width / w);
  const g = c.getContext('2d');
  g.scale(c.height / 128, c.height / 128);
  const W = 128 * w;
  g.fillStyle = '#F7F5F9';
  g.fillRect(0, 0, W, 128);
  const special = ['Ctrl', 'Alt', 'Shift', 'Win', 'Tab'].includes(text);
  if (special) {
    g.fillStyle = '#FFF0C2';
    g.fillRect(0, 0, W, 128);
  }
  g.fillStyle = '#24182E';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const t = text === 'Win' ? '⊞' : text;
  let px = t.length > 2 ? 40 : 60;
  if (text === 'Win') px = 70;
  do g.font = `bold ${px}px Rubik, system-ui, sans-serif`;
  while (g.measureText(t).width > W - 24 && (px -= 2) > 12);
  g.fillText(t, W / 2, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export const missions = [
  { id: 'target', text: `Finish a race in under ${TARGET} seconds.`, hint: 'Press "Start race". Hold the first key, tap the last key, let go. Wrong keys add 2 seconds.' },
  { id: 'nomouse', text: 'Finish a whole race without touching the mouse.', hint: 'Try "No-mouse round". Tab moves between buttons, Space chooses a key, Enter means Done.' },
  { id: 'learn', text: 'Learn 3 new shortcuts in Learn mode and do each one.', hint: 'Choose a shortcut you have never used, read what it does, then press (or pick) its keys.' },
];

export const config = { camera: [1.5, 8.2, 9.5], target: [0, 1.4, -0.2], shadowSize: 9, frame: 0.92, minDistance: 4 };
