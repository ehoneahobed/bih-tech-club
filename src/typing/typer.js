// The typing engine shared by lessons, the speed check, the warm-up and the trotro race.
// The rule pupils see: a wrong key turns red and must be rubbed out with Backspace
// before you can go on. Every wrong key still counts against accuracy.
import { hintFor } from './keys.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Keys from a hidden text box. On computers we read keydown; phone keyboards
// often send only "input" events, so a few placeholder characters let us notice
// Backspace there too.
const SENT = '~~~~';
export function keyInput(input, { onChar, onBack, onKey }) {
  const reset = () => { input.value = SENT; try { input.setSelectionRange(SENT.length, SENT.length); } catch (e) {} };
  reset();
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || (e.altKey && !e.getModifierState?.('AltGraph'))) return;
    if (e.key === 'Backspace') { e.preventDefault(); onBack?.(); return; }
    if (onKey && onKey(e) === false) { e.preventDefault(); return; }
    if (e.key && e.key.length === 1) { e.preventDefault(); onChar?.(e.key); }
  });
  input.addEventListener('input', () => {
    const v = input.value;
    if (v.length < SENT.length) onBack?.();
    else for (const c of v.slice(SENT.length)) onChar?.(c);
    reset();
  });
  input.addEventListener('focus', reset);
  return { reset };
}

// box: an element we fill with the text, the hidden input and a "click to type" cover.
// Options: text, kb (keyboard), hands, hint (element), onDone(stats), onWord(stats), onKey(ok), onStart.
export function typer(box, opts) {
  box.classList.add('tt-type');
  box.innerHTML = `<div class="tt-text" aria-hidden="true"></div>
    <input class="tt-input" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type the text here">
    <button type="button" class="tt-cover">👆 Click here, then type</button>`;
  const textEl = box.querySelector('.tt-text');
  const input = box.querySelector('.tt-input');
  const cover = box.querySelector('.tt-cover');
  let text = '';
  let spans = [];
  let s;

  function setText(t) {
    text = t;
    s = { pos: 0, wrong: null, typed: 0, correct: 0, misses: {}, acc: 0, since: 0, started: false, finished: false };
    // Each word stays in one piece when lines wrap.
    // Each word keeps its following space, so a new line never starts with a space.
    textEl.innerHTML = (t.match(/[^ ]+ ?| /g) || []).map((w) => `<span class="w">${[...w].map((c) => (c === ' ' ? '<span class="c sp"> </span>' : `<span class="c">${esc(c)}</span>`)).join('')}</span>`).join('');
    spans = [...textEl.querySelectorAll('.c')];
    textEl.scrollTop = 0;
    paint();
  }

  const now = () => performance.now();
  const running = () => s.started && !s.finished && s.since;
  const elapsed = () => s.acc + (running() ? now() - s.since : 0);
  function stats() {
    const secs = elapsed() / 1000;
    const min = Math.max(secs, 1) / 60;
    return {
      secs, chars: s.pos, typed: s.typed, correct: s.correct, misses: s.misses,
      wpm: s.started ? Math.round(s.correct / 5 / min) : 0,
      gross: s.started ? Math.round(s.typed / 5 / min) : 0,
      acc: s.typed ? Math.round((s.correct / s.typed) * 1000) / 10 : 100,
      progress: text.length ? s.pos / text.length : 0,
      done: s.finished,
    };
  }

  function paint(prev) {
    if (prev != null && spans[prev]) spans[prev].classList.remove('cur', 'bad');
    for (let i = prev ?? 0; i < s.pos; i++) spans[i]?.classList.add('ok');
    const cur = spans[s.pos];
    if (cur) {
      cur.classList.add('cur');
      cur.classList.toggle('bad', s.wrong != null);
      // Keep the current line second from the top.
      const line = cur.offsetHeight || 40;
      const top = cur.offsetTop - textEl.offsetTop;
      if (top - textEl.scrollTop > line * 1.2 || top < textEl.scrollTop) textEl.scrollTop = Math.max(0, top - line);
    }
    const next = s.finished ? null : text[s.pos];
    const show = s.wrong != null ? '\b' : next; // a mistake lights Backspace
    opts.kb?.show(show);
    opts.hands?.show(show);
    if (opts.hint) opts.hint.innerHTML = s.finished ? '' : s.wrong != null ? '<span class="tt-fix">Oops! Press <b>Backspace ⌫</b> to rub out the red letter.</span>' : `Next: ${hintFor(next)}`;
  }

  function start() {
    s.started = true;
    s.since = now();
    opts.onStart?.();
  }
  function char(c) {
    if (s.finished || opts.locked?.()) return;
    if (!s.started) start();
    if (!s.since) s.since = now();
    if (s.wrong != null) { // must fix first
      box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      return;
    }
    const want = text[s.pos];
    s.typed++;
    const ok = c === want || (want === ' ' && c === ' ');
    opts.kb?.press(want, ok);
    if (ok) {
      s.correct++;
      const prev = s.pos++;
      if (s.pos >= text.length) { s.acc = elapsed(); s.finished = true; }
      paint(prev);
      opts.onKey?.(true);
      if (want === ' ' || s.finished) opts.onWord?.(stats());
      if (s.finished) opts.onDone?.(stats());
    } else {
      s.wrong = c;
      s.misses[want] = (s.misses[want] || 0) + 1;
      paint(s.pos);
      opts.onKey?.(false);
    }
  }
  function back() {
    if (s.wrong == null) return;
    s.wrong = null;
    paint(s.pos);
  }
  keyInput(input, { onChar: char, onBack: back, onKey: opts.onSpecial });

  // Pause the clock while the page or the box is not in use.
  input.addEventListener('blur', () => { if (running()) { s.acc = elapsed(); s.since = 0; } box.classList.remove('focused'); });
  input.addEventListener('focus', () => { box.classList.add('focused'); });
  box.addEventListener('pointerdown', (e) => { if (e.target !== input) { e.preventDefault(); input.focus({ preventScroll: true }); } });
  cover.addEventListener('click', () => input.focus({ preventScroll: true }));

  setText(opts.text || '');
  return {
    focus: () => input.focus({ preventScroll: true }),
    blur: () => input.blur(),
    stats,
    setText,
    finish() { if (!s.finished) { s.acc = elapsed(); s.finished = true; paint(s.pos); } return stats(); },
    get text() { return text; },
  };
}
