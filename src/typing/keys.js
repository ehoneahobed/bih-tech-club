// The on-screen keyboard, the finger map and the two pictures (hands, posture).
// Finger colours match Figure 2.2 in the Session 2 workbook:
// pinky red, ring amber, middle green, index blue; thumbs share the Spacebar.

export const FINGERS = {
  lp: { name: 'left pinky', type: 'pinky' },
  lr: { name: 'left ring finger', type: 'ring' },
  lm: { name: 'left middle finger', type: 'middle' },
  li: { name: 'left index finger', type: 'index' },
  th: { name: 'thumb', type: 'thumb' },
  ri: { name: 'right index finger', type: 'index' },
  rm: { name: 'right middle finger', type: 'middle' },
  rr: { name: 'right ring finger', type: 'ring' },
  rp: { name: 'right pinky', type: 'pinky' },
};
// The home key each finger returns to (Session 2: "Each finger has its own home key").
export const HOME = { lp: 'a', lr: 's', lm: 'd', li: 'f', ri: 'j', rm: 'k', rr: 'l', rp: ';', th: ' ' };

// A common US-layout keyboard. [base, shifted] pairs; objects are wide keys.
const ROWS = [
  [['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'], { id: 'Backspace', label: 'Backspace', short: '⌫', w: 2 }],
  [{ id: 'Tab', label: 'Tab', short: '⇥', w: 1.5 }, ...'qwertyuiop'.split(''), ['[', '{'], [']', '}'], { id: '\\', pair: ['\\', '|'], w: 1.5 }],
  [{ id: 'Caps', label: 'Caps Lock', short: 'Caps', w: 1.75 }, ...'asdfghjkl'.split(''), [';', ':'], ["'", '"'], { id: 'Enter', label: 'Enter ↵', short: '↵', w: 2.25 }],
  [{ id: 'ShiftL', label: '⇧ Shift', short: '⇧', w: 2.25 }, ...'zxcvbnm'.split(''), [',', '<'], ['.', '>'], ['/', '?'], { id: 'ShiftR', label: '⇧ Shift', short: '⇧', w: 2.75 }],
  [{ gap: 4 }, { id: 'Space', label: 'Spacebar', short: '', w: 6.5 }, { gap: 4.5 }],
];
const FINGER_OF = {};
const own = (f, keys) => keys.forEach((k) => (FINGER_OF[k] = f));
own('lp', ['`', '1', 'q', 'a', 'z', 'Tab', 'Caps', 'ShiftL']);
own('lr', ['2', 'w', 's', 'x']);
own('lm', ['3', 'e', 'd', 'c']);
own('li', ['4', '5', 'r', 't', 'f', 'g', 'v', 'b']);
own('ri', ['6', '7', 'y', 'u', 'h', 'j', 'n', 'm']);
own('rm', ['8', 'i', 'k', ',']);
own('rr', ['9', 'o', 'l', '.']);
own('rp', ['0', '-', '=', 'p', '[', ']', '\\', ';', "'", '/', 'Enter', 'Backspace', 'ShiftR']);
own('th', ['Space']);

// Which key (and Shift or not) types each character.
export const CHAR = { ' ': { id: 'Space', shift: false }, '\b': { id: 'Backspace', shift: false } };
for (const row of ROWS) for (const k of row) {
  if (typeof k === 'string') { CHAR[k] = { id: k, shift: false }; CHAR[k.toUpperCase()] = { id: k, shift: true }; }
  else if (Array.isArray(k) || k.pair) { const [b, s] = k.pair || k; CHAR[b] = { id: b, shift: false }; CHAR[s] = { id: b, shift: true }; }
}
const keyId = (k) => (typeof k === 'string' ? k : Array.isArray(k) ? k[0] : k.id);

// Everything a pupil needs to know about the next character.
export function keyFor(ch) {
  const c = CHAR[ch];
  if (!c) return null;
  const finger = FINGER_OF[c.id];
  const left = finger && finger[0] === 'l';
  return { ...c, finger, shiftId: c.shift ? (left ? 'ShiftR' : 'ShiftL') : null, shiftFinger: c.shift ? (left ? 'rp' : 'lp') : null };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const keyName = (ch) => (ch === ' ' ? 'Spacebar' : ch === ';' ? '; (semicolon)' : ch === "'" ? "' (apostrophe)" : ch === '"' ? '" (quote)' : ch === ',' ? ', (comma)' : ch === '.' ? '. (full stop)' : ch);

// "Next: F · left index finger" plus "hold Shift with your right pinky".
export function hintFor(ch) {
  const k = keyFor(ch);
  if (!k) return '';
  const f = FINGERS[k.finger];
  const dot = (id) => `<i class="tt-dot f-${FINGERS[id].type}"></i>`;
  const main = ch === ' ' ? `${dot('th')}Spacebar · either <b>thumb</b>` : `${dot(k.finger)}<b class="tt-key">${esc(keyName(ch))}</b> · your <b>${f.name}</b>`;
  return main + (k.shift ? ` <span class="tt-shift">+ hold ${dot(k.shiftFinger)}<b>Shift</b> with your <b>${FINGERS[k.shiftFinger].name}</b></span>` : '');
}

// ---------- On-screen keyboard ----------
// el gets the keys; call show(ch) to light the next key, heat(map) for the missed-keys view.
export function keyboard(el, { compact = false } = {}) {
  el.classList.add('tt-kb');
  if (compact) el.classList.add('compact');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = ROWS.map((row) => `<div class="tt-row">${row.map((k) => {
    if (k.gap) return `<span class="tt-gap" style="--w:${k.gap}"></span>`;
    const id = keyId(k);
    const f = FINGER_OF[id];
    const w = k.w || 1;
    const pair = Array.isArray(k) ? k : k.pair;
    const label = pair ? `<small>${esc(pair[1])}</small>${esc(pair[0])}` : typeof k === 'string' ? esc(k.toUpperCase()) : `<span class="lf">${esc(k.label)}</span><span class="ls">${esc(k.short ?? k.label)}</span>`;
    return `<span class="tt-k f-${FINGERS[f].type}${w > 1 ? ' wide' : ''}${id === 'f' || id === 'j' ? ' bump' : ''}" data-k="${esc(id)}" style="--w:${w}">${label}</span>`;
  }).join('')}</div>`).join('');
  const keys = {};
  el.querySelectorAll('[data-k]').forEach((k) => (keys[k.dataset.k] = k));
  let lit = [];
  return {
    show(ch) {
      lit.forEach((k) => k.classList.remove('next', 'next-shift'));
      lit = [];
      const k = ch != null && keyFor(ch);
      if (!k) return;
      if (keys[k.id]) { keys[k.id].classList.add('next'); lit.push(keys[k.id]); }
      if (k.shiftId) { keys[k.shiftId].classList.add('next-shift'); lit.push(keys[k.shiftId]); }
    },
    // Light several keys at once (the home row in the posture check).
    many(chars) { this.show(null); for (const ch of chars) { const k = keyFor(ch); if (k && keys[k.id]) { keys[k.id].classList.add('next'); lit.push(keys[k.id]); } } },
    press(ch, ok) {
      const k = keyFor(ch);
      const key = k && keys[k.id];
      if (!key) return;
      key.classList.remove('hit', 'miss');
      void key.offsetWidth; // restart the little flash
      key.classList.add(ok ? 'hit' : 'miss');
    },
    // Missed-keys heat map: misses per key, shaded from pale gold to red.
    heat(missed) {
      el.classList.add('heat');
      const per = {};
      for (const [ch, n] of Object.entries(missed || {})) { const k = keyFor(ch); if (k) per[k.id] = (per[k.id] || 0) + n; }
      const max = Math.max(1, ...Object.values(per));
      for (const [id, key] of Object.entries(keys)) {
        const n = per[id] || 0;
        key.style.setProperty('--heat', n ? (0.25 + 0.75 * (n / max)).toFixed(2) : 0);
        key.classList.toggle('hot', n > 0);
        key.title = n ? `${n} miss${n === 1 ? '' : 'es'}` : '';
      }
    },
  };
}

// ---------- Hands (seen from above) ----------
// Each fingertip wears its colour; the finger to use next glows.
const HAND = [
  // finger, x, top, height
  ['p', 18, 62, 74], ['r', 58, 34, 102], ['m', 98, 22, 114], ['i', 138, 38, 98],
];
export function hands(el) {
  const side = (s) => `<g class="tt-hand" ${s === 'r' ? 'transform="translate(520 0) scale(-1 1)"' : ''}>
    <rect class="palm" x="14" y="112" width="166" height="84" rx="38"/>
    ${HAND.map(([f, x, y, h]) => `<g data-f="${s}${f}" class="tt-finger f-${FINGERS[s + f].type}"><rect class="fg" x="${x}" y="${y}" width="36" height="${h}" rx="18"/><circle class="tip" cx="${x + 18}" cy="${y + 18}" r="11"/></g>`).join('')}
    <g data-f="th${s}" class="tt-finger f-thumb"><g transform="rotate(58 160 172)"><rect class="fg" x="142" y="100" width="36" height="80" rx="18"/><circle class="tip" cx="160" cy="118" r="11"/></g></g>
  </g>`;
  el.classList.add('tt-hands');
  el.innerHTML = `<svg viewBox="0 0 520 214" role="img" aria-label="Your two hands. The finger to use next is lit up.">${side('l')}${side('r')}
    <text x="100" y="212" text-anchor="middle">Left hand</text><text x="420" y="212" text-anchor="middle">Right hand</text></svg>`;
  const fingers = {};
  el.querySelectorAll('[data-f]').forEach((g) => (fingers[g.dataset.f] = g));
  return {
    show(ch) {
      Object.values(fingers).forEach((g) => g.classList.remove('on'));
      const k = ch != null && keyFor(ch);
      if (!k) return;
      if (k.finger === 'th') { fingers.thl.classList.add('on'); fingers.thr.classList.add('on'); }
      else fingers[k.finger]?.classList.add('on');
      if (k.shiftFinger) fingers[k.shiftFinger].classList.add('on');
    },
    all() { Object.entries(fingers).forEach(([id, g]) => g.classList.toggle('on', !id.startsWith('th'))); },
  };
}

// ---------- Posture picture (side view) ----------
export const POSTURE_SVG = `<svg class="tt-posture" viewBox="0 0 440 300" role="img" aria-label="A pupil sitting well at a computer: eyes on the screen, back straight, wrists up and feet flat on the floor.">
  <line class="floor" x1="10" y1="282" x2="430" y2="282"/>
  <g class="furn">
    <rect x="52" y="182" width="96" height="12" rx="5"/><rect x="50" y="92" width="12" height="98" rx="6"/>
    <rect x="60" y="194" width="8" height="88"/><rect x="134" y="194" width="8" height="88"/>
    <rect x="200" y="150" width="226" height="11" rx="4"/><rect x="398" y="161" width="10" height="121"/>
    <rect x="356" y="54" width="14" height="86" rx="4"/><rect x="350" y="138" width="34" height="8" rx="3"/><rect x="362" y="118" width="6" height="22"/>
    <rect x="232" y="143" width="62" height="7" rx="2" class="kbd"/>
  </g>
  <line class="sight" x1="140" y1="66" x2="354" y2="86"/>
  <g class="body">
    <circle cx="122" cy="62" r="24" class="head"/>
    <line x1="114" y1="92" x2="106" y2="182"/>
    <line x1="116" y1="106" x2="160" y2="150"/><line x1="160" y1="150" x2="234" y2="136"/>
    <line x1="106" y1="184" x2="196" y2="186"/><line x1="196" y1="186" x2="198" y2="272"/><line x1="196" y1="276" x2="232" y2="276"/>
  </g>
  <g class="tag"><circle cx="250" cy="76" r="5"/><text x="250" y="52" text-anchor="middle">👀 Eyes on the screen</text></g>
  <g class="tag"><circle cx="110" cy="140" r="5"/><text x="12" y="132">Back</text><text x="12" y="149">straight</text></g>
  <g class="tag"><circle cx="232" cy="136" r="5"/><text x="292" y="110" text-anchor="middle">Wrists up, not</text><text x="292" y="126" text-anchor="middle">on the desk</text></g>
  <g class="tag"><circle cx="214" cy="276" r="5"/><text x="246" y="250">Feet flat</text><text x="246" y="267">on the floor</text></g>
</svg>`;
