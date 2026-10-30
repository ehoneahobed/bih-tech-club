// Stages and practice text. Drills are made from the letters a stage allows,
// using real words wherever there are enough of them.
import { HOME, keyFor } from './keys.js';

/* global TYPING_DATA */
export const DATA = typeof TYPING_DATA !== 'undefined' ? TYPING_DATA : { sessions: [], bank: {} };
const BANK = { names: [], places: [], foods: [], sentences: [], numbers: [], symbols: [], ...DATA.bank };

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const PUNCT = `.,?!'"`;
// Each stage adds keys to the ones before it. Pass a run with 95% accuracy to move up.
export const STAGES = [
  { id: 'home', icon: '🏠', title: 'Home row', keys: 'asdfjkl;', tip: 'Rest your fingers on <b>A S D F</b> and <b>J K L ;</b>. Feel the bumps on <b>F</b> and <b>J</b>.' },
  { id: 'gh', icon: '↔️', title: 'G and H', keys: 'gh', tip: 'Stretch your <b>index fingers</b> to the middle: left index to <b>G</b>, right index to <b>H</b>. Then slide back to F and J.' },
  { id: 'ei', icon: '⬆️', title: 'E and I', keys: 'ei', tip: 'Reach up with your <b>middle fingers</b>: left middle to <b>E</b>, right middle to <b>I</b>. Come back home after each key.' },
  { id: 'ru', icon: '⬆️', title: 'R and U', keys: 'ru', tip: 'Reach up with your <b>index fingers</b>: left index to <b>R</b>, right index to <b>U</b>.' },
  { id: 'top', icon: '🔝', title: 'The rest of the top row', keys: 'qwtyop', tip: 'Every top-row key belongs to the finger below it. Keep the other fingers resting on home row.' },
  { id: 'bottom', icon: '⬇️', title: 'Bottom row', keys: 'zxcvbnm', tip: 'Curl your fingers down to the bottom row, then back up to home row.' },
  { id: 'caps', icon: '🔠', title: 'Capitals with Shift', keys: LOWER.toUpperCase(), tip: 'Hold <b>Shift</b> with the pinky of the <b>other</b> hand, tap the letter, then let go. Names and places start with a capital.' },
  { id: 'punct', icon: '❗', title: 'Punctuation', keys: PUNCT, tip: 'Full stop and comma use your ring and middle fingers. <b>?</b> and <b>"</b> need Shift.' },
  { id: 'numbers', icon: '🔢', title: 'Numbers', keys: '0123456789', tip: 'Reach up two rows from home. Each number belongs to the same finger as the letter below it.' },
  { id: 'symbols', icon: '#️⃣', title: 'Common symbols', keys: '@#%&()-+=:/*', tip: 'Most symbols need Shift. Find the key, then hold Shift with the other hand.' },
  { id: 'speed', icon: '🏁', title: 'Speed sentences', keys: '', tip: 'Now type real sentences. Keep your rhythm steady, like a drum. Accuracy first, speed will follow.' },
];
// The characters allowed at each stage (space is always allowed).
let soFar = ' ';
for (const s of STAGES) { soFar += s.keys; s.allowed = new Set(soFar); }

// Common words, tech words and Ghanaian foods. Short lists for the first stages,
// where only a few letters are allowed.
const WORDS = [...new Set(`a as ad add ads all alas ask asks dad dads fad fall falls flask lad lads sad salad salads
gal gals gas glad glass flag flags had has half hall halls hash dash lash shall
aid aide idea ideas side sides slide slides hide like likes life file files field fields shield head heads heal deal deals lead leaf lake sale safe said sail sails skill skills kid kids disk disks dish fish hike jail egg eggs high sigh see seed feed feel feels fee lid leg legs led sea seal desk desks fake shake sheet she he his hill fill gift
rule rules rug rugs fur sure user users read reads red rise hard dark far fire hire area large judge drag rush sugar sir ride rides rail free fresh dress ear ears hear heard here her their there fruit fruits
the to of and in is it you that was for on are with they be at one have this from by hot word but what some we can out other were when up use your how an each which do time if will way about many then them write would so these long make thing him two look more day could go come did number sound no most people my over know water than call first who may down been now find any new work part take get place made live where after back little only round man year came show every good me give our under name very through just form sentence great think say help low line turn much mean before move right boy old too same tell does set three want air well also play small end put home hand land must big such follow act why ask went light kind off need house picture try us again animal point mother world near build self earth father stand own page should country found answer school grow study still learn plant cover food sun four between keep eye never last let city tree cross farm start might story saw sea draw left late run while press close night real few north open seem together next white children begin got walk example paper group always music both mark often letter until river car feet care second book carry took science eat room friend began stop once hear horse cut watch colour face wood main enough girl young ready above ever list talk bird soon body dog family door short class wind question happen ship rock order south problem piece told knew pass since top whole space best hour better true early hold west ground reach fast sing listen six table travel less morning ten simple slow centre love person money road map rain voice town fine fly cry note wait plan star box rest correct able done drive front teach week gave green quick ocean warm minute strong mind clear fact street nothing stay wheel full blue deep moon island foot busy test boat gold dry laugh ran check game shape miss heat snow bring yes fill east paint
mouse keys screen click type save folder email chart slide code team club hub laptop print undo copy paste
fufu banku kenkey waakye kelewele jollof gari shito sobolo kente trotro akwaaba ampe mango plantain`.split(/\s+/).filter(Boolean))];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const fits = (text, allowed) => [...text].every((c) => allowed.has(c));
// n items from a list, never the same one twice in a row.
function some(list, n) {
  const out = [];
  if (!list.length) return out;
  while (out.length < n) { const w = pick(list); if (w !== out[out.length - 1] || list.length === 1) out.push(w); }
  return out;
}

// Real words the stage allows, most of them using its new keys.
export function wordsFor(stageIndex, n, { maxLen = 9 } = {}) {
  const st = STAGES[stageIndex];
  const allowed = STAGES[Math.min(stageIndex, 5)].allowed; // letters only; capitals come from names
  const pool = WORDS.filter((w) => w.length <= maxLen && fits(w, allowed));
  const fresh = stageIndex <= 5 ? pool.filter((w) => [...st.keys].some((k) => w.includes(k))) : [];
  const out = [];
  for (let i = 0; i < n; i++) out.push(fresh.length && Math.random() < 0.7 ? pick(fresh) : pick(pool));
  // From the Shift stage on, mix in Ghanaian names, places and foods.
  if (stageIndex >= 6) for (let i = 0; i < n; i += 3) out[i] = pick([...BANK.names, ...BANK.places.filter((p) => !p.includes(' '))]);
  return out.filter((w, i) => w !== out[i - 1]);
}

// Little finger patterns for new keys: "fgf jhj", or home-row pairs.
function patterns(st) {
  if (st.id === 'home') return some(['asdf', 'jkl;', 'fdsa', ';lkj', 'fj', 'dk', 'sl', 'a;', 'ff', 'jj', 'fjfj', 'dkdk', 'slsl', 'ad', 'jk'], 6);
  return some([...st.keys].flatMap((k) => { const h = HOME[keyFor(k).finger]; return [h + k + h, k + k + h, h + k + k + h]; }), 6);
}

// Short phrases for the Shift stage: "Esi likes waakye", "Yaw lives in Tamale".
function capsPhrases(n) {
  const make = [
    () => `${pick(BANK.names)} likes ${pick(BANK.foods)}`,
    () => `${pick(BANK.names)} lives in ${pick(BANK.places)}`,
    () => `${pick(BANK.names)} and ${pick(BANK.names)} visit ${pick(BANK.places)}`,
    () => `${pick(BANK.names)} cooks ${pick(BANK.foods)}`,
  ];
  return Array.from({ length: n }, () => pick(make)());
}

const sentences = (list, n, allowed) => shuffle(list.filter((s) => !allowed || fits(s, allowed))).slice(0, n);

// One stage run: about two lines of text.
export function drillFor(stageIndex) {
  const st = STAGES[stageIndex];
  if (stageIndex <= 5) return [...patterns(st), ...wordsFor(stageIndex, 9)].join(' ');
  if (st.id === 'caps') return [...capsPhrases(3), ...wordsFor(stageIndex, 3)].join(' ');
  if (st.id === 'punct') {
    const withPunct = BANK.sentences.filter((s) => fits(s, st.allowed) && /[?!'",]/.test(s));
    return [...sentences(withPunct, 2), ...sentences(BANK.sentences, 1, st.allowed)].join(' ');
  }
  if (st.id === 'numbers') return [some(['10', '20', '38', '47', '56', '29', '1 2 3', '4 5 6', '7 8 9', '2026', '15', '100'], 4).join(' '), ...sentences(BANK.numbers, 2)].join(' ');
  if (st.id === 'symbols') return [...sentences(BANK.symbols, 3)].join(' ');
  return sentences([...BANK.sentences, ...BANK.numbers], 3).join(' ');
}

// A long passage of real sentences for the speed check.
export function passage(minChars) {
  const pool = [...BANK.sentences, ...BANK.numbers];
  let out = [];
  let len = 0;
  while (len < minChars) for (const s of shuffle(pool)) { if (s === out[out.length - 1]) continue; out.push(s); len += s.length + 1; if (len >= minChars) break; }
  return out.join(' ');
}

// Text for the trotro race, suited to the stages a pupil has unlocked.
export function raceText(stageIndex) {
  if (stageIndex >= 7) return sentences(BANK.sentences, 3, STAGES[Math.min(stageIndex, 7)].allowed).join(' ');
  if (stageIndex === 6) return capsPhrases(4).join(' ');
  return wordsFor(stageIndex, 16).join(' ');
}

// Single words for the mangoes (no spaces).
export function mangoWords(stageIndex) {
  const base = wordsFor(stageIndex, 60, { maxLen: stageIndex < 2 ? 6 : 8 });
  const extra = stageIndex >= 5 ? BANK.foods.filter((f) => !f.includes(' ') && fits(f, STAGES[5].allowed)) : [];
  return [...new Set([...base, ...extra])].filter((w) => !w.includes(' '));
}
