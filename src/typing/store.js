// Typing progress, saved only in this browser (localStorage "bih-typing").
// Every access is wrapped: private windows and full storage must never break the trainer.
const KEY = 'bih-typing';

export const TARGETS = [
  { id: 'bronze', name: 'Bronze', wpm: 15, acc: 90, icon: '🥉' },
  { id: 'silver', name: 'Silver', wpm: 25, acc: 92, icon: '🥈' },
  { id: 'gold', name: 'Gold', wpm: 35, acc: 95, icon: '🥇' },
];
export const BADGES = [
  { id: 'wpm20', icon: '⚡', name: '20 wpm', text: 'A speed check at 20 words a minute (90% accuracy or more)' },
  { id: 'wpm30', icon: '🚀', name: '30 wpm', text: 'A speed check at 30 words a minute (90% accuracy or more)' },
  { id: 'wpm40', icon: '🏆', name: '40 wpm', text: 'A speed check at 40 words a minute (90% accuracy or more)' },
  { id: 'home', icon: '🏠', name: 'Home row hero', text: 'Pass the home-row stage' },
  { id: 'allkeys', icon: '⌨️', name: 'Every key', text: 'Pass the symbols stage' },
  { id: 'trotro', icon: '🚐', name: 'Trotro champion', text: 'Beat the 20 wpm pace trotro to Circle' },
  { id: 'mango', icon: '🥭', name: 'Mango picker', text: 'Catch 25 mangoes in one game' },
  { id: 'warmup', icon: '🔥', name: 'Warmed up', text: 'Finish a 10-minute warm-up' },
];

const fresh = () => ({ v: 1, unlocked: 0, stage: 0, stages: {}, checks: [], best: { check: 0, race: 0, mango: 0 }, badges: {}, missed: {}, sound: false, warmups: 0 });

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && d.v === 1) { const f = fresh(); return { ...f, ...d, best: { ...f.best, ...d.best } }; }
  } catch (e) {}
  return fresh();
}
export function save(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
}
export function clear() {
  try { localStorage.removeItem(KEY); } catch (e) {}
}

// Returns the badge if it is new, so the page can celebrate it.
export function award(d, id) {
  if (d.badges[id]) return null;
  d.badges[id] = Date.now();
  return BADGES.find((b) => b.id === id);
}

// Passport level: the best 3-minute check that meets both the speed and the accuracy.
export function passport(d) {
  let level = null;
  for (const c of d.checks) if (c.secs >= 180) for (const t of TARGETS) if (c.wpm >= t.wpm && c.acc >= t.acc && (!level || TARGETS.indexOf(t) > TARGETS.indexOf(level))) level = t;
  return level;
}

export function addMisses(d, misses) {
  for (const [ch, n] of Object.entries(misses)) d.missed[ch] = (d.missed[ch] || 0) + n;
}
