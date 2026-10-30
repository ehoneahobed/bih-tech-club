// Session 12 (and Session 15 re-tries) — Search Detective. A detective's desk
// in a library: a vague search buries you under a mountain of result cards;
// smart keywords and the four operators ("exact phrase", -minus, site:, OR)
// shrink the pile to the right page. Then sort sources with the 4-Way
// Fact-Check Shield, and spot the paid advert on a results page.
import { THREE, COLORS, rbox, mat, decal, label, setLabel } from './runtime.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const font = (px, w = 600) => `${w} ${px}px Rubik, system-ui, sans-serif`;

// ---------- The pretend Web: a small index of pages ----------
// `w` is how many similar pages each one stands for, so a vague search shows
// "About 48,000,000 results" while the right page is just one.
const DOCS = [
  { id: 'top10', site: 'travelghana-blog.example.com', title: 'Top 10 parks in Ghana you must visit', snip: 'From Mole to Kakum, the best parks, beaches and hotels for your holiday…', words: 'top 10 parks ghana visit mole and kakum national park beaches holiday travel', w: 21000000 },
  { id: 'gardens', site: 'accra-living.example.com', title: 'Parks and gardens in Accra', snip: 'Where to relax in the city: gardens, parks and play areas…', words: 'parks gardens accra ghana city relax play', w: 14000000 },
  { id: 'tourism', site: 'visit-ghana-guide.example.com', title: 'Ghana tourism: beaches, castles and parks', snip: 'Plan a trip: Cape Coast Castle, the beaches and the parks…', words: 'ghana tourism beaches castles parks cape coast trip', w: 8200000 },
  { id: 'kakum', site: 'en.wikipedia.org', title: 'Kakum National Park - Wikipedia', snip: 'Kakum National Park is a national park in the Central Region of Ghana. It is known for its canopy walkway…', words: 'kakum national park ghana central region canopy walkway forest', w: 3600000 },
  { id: 'kids', site: 'animal-facts.example.org', title: 'Elephants: amazing facts for kids', snip: 'Elephants are the largest land animals. They live in Africa and Asia…', words: 'elephants facts kids africa asia largest land animals', w: 9400000 },
  { id: 'clinic', site: 'skin-clinic.example.com', title: 'Mole removal clinic · National Park Road', snip: 'Worried about a mole on your skin? Visit our clinic on National Park Road, Ghana. We also treat elephant skin (dry skin)…', words: 'mole removal skin clinic national park road ghana elephants elephant dry skin', w: 180000 },
  { id: 'lodge', site: 'mole-lodge.example.com', title: 'Mole National Park hotel: watch elephants from your room!', snip: 'Book a room at our hotel inside Mole National Park. Elephants walk past the pool…', words: 'mole national park hotel elephants room book pool ghana', w: 260000 },
  { id: 'safari', site: 'safari-deals.example.com', title: 'Elephants of Mole National Park: hotel and safari deals', snip: 'Cheap hotel packages with elephant safaris in Mole National Park, Ghana…', words: 'elephants mole national park hotel safari deals cheap packages ghana', w: 150000 },
  { id: 'wiki', site: 'en.wikipedia.org', title: 'Mole National Park - Wikipedia', snip: 'Mole National Park is Ghana\'s largest wildlife refuge. Elephants, antelopes and baboons live there…', words: 'mole national park ghana largest wildlife elephants antelopes baboons savanna', w: 1 },
  { id: 'trip', site: 'knust.edu.gh', title: 'Our field trip to Mole National Park', snip: 'Students saw elephants at the water hole, then stayed at the park hotel…', words: 'field trip mole national park students elephants water hole hotel ghana university', w: 1 },
  { id: 'target', site: 'ug.edu.gh', title: 'Elephants of Mole National Park: a field study', snip: 'University researchers counted the elephants in Mole National Park and studied what they eat…', words: 'elephants mole national park field study university researchers counted eat ghana', w: 1 },
  // Case 2: kenkey or banku.
  { id: 'gaKenkey', site: 'ghana-kitchen.example.com', title: 'How to make Ga kenkey at home: recipe', snip: 'A step-by-step recipe: mix the corn dough, wrap it in dried corn husks and cook it…', words: 'ga kenkey recipe make home corn dough cook husks ghana', w: 120000 },
  { id: 'banku', site: 'auntie-ama-cooks.example.com', title: 'Easy banku recipe with okro stew', snip: 'Our family recipe for soft banku: corn and cassava dough, stirred until smooth…', words: 'banku recipe easy okro stew corn cassava dough cook ghana', w: 90000 },
  { id: 'fante', site: 'ghana-kitchen.example.com', title: 'Fante kenkey recipe, step by step', snip: 'Fante kenkey is wrapped in plantain leaves. Here is how to cook it…', words: 'fante kenkey recipe step plantain leaves cook ghana', w: 30000 },
  { id: 'diff', site: 'food-talk.example.org', title: 'Kenkey and banku: what is the difference?', snip: 'Both are made from corn dough, but kenkey is wrapped and steamed…', words: 'kenkey banku difference corn dough wrapped steamed ghana', w: 40000 },
  { id: 'menu', site: 'kumasi-chopbar.example.com', title: 'Banku and tilapia: our menu and prices', snip: 'Come and eat at our chop bar in Kumasi. Banku, tilapia and pepper…', words: 'banku tilapia menu prices chop bar kumasi eat', w: 60000 },
];
const CASES = [
  {
    id: 'mole', icon: '🐘', name: 'Mole elephants', start: 'parks ghana',
    brief: 'Your project is about the <b>elephants</b> in <b>Mole National Park</b>. Your teacher wants a page from a <b>Ghanaian university</b> (.edu.gh), and <b>no hotel adverts</b>.',
    chips: ['"Mole National Park"', 'elephants', '-hotel', 'site:edu.gh', '- hotel', 'site: edu.gh'],
    solved: (hits, q) => hits.length === 1 && hits[0].id === 'target' && q.phrase && q.not && q.site,
  },
  {
    id: 'food', icon: '🍲', name: 'Kenkey or banku', start: 'how can i cook kenkey or banku please',
    brief: 'You need <b>recipes</b> for a cooking project, and <b>either kenkey or banku</b> will do. You want every recipe page, and nothing that is not a recipe.',
    chips: ['kenkey', 'OR', 'banku', 'recipe', 'or'],
    solved: (hits, q) => q.any && hits.length === 3 && ['gaKenkey', 'banku', 'fante'].every((id) => hits.some((h) => h.id === id)),
  },
];
// Chatty words a search engine does not need.
const FILLER = new Set(['please', 'tell', 'me', 'how', 'can', 'i', 'what', 'is', 'the', 'a', 'an', 'of', 'to', 'about', 'some', 'our', 'my', 'get', 'find', 'want', 'show', 'give', 'you', 'do', 'in', 'for', 'and']);
const stem = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9.\s]/g, ' ').replace(/\.(?=\s|$)/g, ' ').split(/\s+/).filter(Boolean);
for (const d of DOCS) {
  const ws = norm(d.words).map(stem);
  d.set = new Set(ws);
  d.text = ` ${ws.join(' ')} `;
}

// Read a search the way a search engine does.
function parse(q) {
  const units = [];
  const notes = new Set();
  const re = /"([^"]*)("?)|(\S+)/g;
  let m;
  let orNext = false;
  const join = (u) => {
    const prev = units[units.length - 1];
    if (orNext && prev && (prev.type === 'word' || prev.type === 'phrase' || prev.type === 'any')) {
      units.pop();
      units.push({ type: 'any', of: [...(prev.type === 'any' ? prev.of : [prev]), u] });
    } else units.push(u);
    orNext = false;
  };
  while ((m = re.exec(q))) {
    if (m[1] !== undefined) {
      if (!m[2]) notes.add('quote-open');
      const ws = norm(m[1]).map(stem);
      if (ws.length) join({ type: 'phrase', v: ws.join(' '), raw: m[1].trim() });
      continue;
    }
    const w = m[3];
    if (w === 'OR') { if (units.length) orNext = true; continue; }
    if (w === '-') { notes.add('minus-space'); continue; }
    if (w.startsWith('-')) {
      const ws = norm(w.slice(1)).map(stem);
      if (ws.length) units.push({ type: 'not', v: ws.join(' '), raw: w.slice(1) });
      continue;
    }
    if (/^site:/i.test(w)) {
      const v = w.slice(5).toLowerCase().replace(/^\.+/, '');
      if (!v) notes.add('site-space');
      else units.push({ type: 'site', v });
      continue;
    }
    if (w === 'or') notes.add('or-small');
    const ws = norm(w);
    if (!ws.length) continue;
    if (ws.length === 1 && FILLER.has(ws[0])) { notes.add('filler'); continue; }
    for (const x of ws) join({ type: 'word', v: stem(x), raw: x });
  }
  const has = (t) => units.some((u) => u.type === t);
  return { units, notes, phrase: has('phrase') || units.some((u) => u.type === 'any' && u.of.some((x) => x.type === 'phrase')), not: has('not'), site: has('site'), any: has('any') };
}
function matches(d, u) {
  if (u.type === 'word') return d.set.has(u.v);
  if (u.type === 'phrase') return d.text.includes(` ${u.v} `);
  if (u.type === 'not') return !d.text.includes(` ${u.v} `);
  if (u.type === 'site') return d.site === u.v || d.site.endsWith('.' + u.v);
  if (u.type === 'any') return u.of.some((x) => matches(d, x));
  return true;
}
function search(q) {
  const p = parse(q);
  const hits = p.units.some((u) => u.type !== 'not' && u.type !== 'site') ? DOCS.filter((d) => p.units.every((u) => matches(d, u))) : [];
  hits.sort((a, b) => b.w - a.w);
  // Search engines round big counts ("About 47,400,000 results").
  const sum = hits.reduce((s, d) => s + d.w, 0);
  const total = sum < 1000 ? sum : Number(sum.toPrecision(3));
  return { p, hits, total };
}

// ---------- Sources to sort with the 4-Way Shield ----------
const SHIELD = [
  { id: 'who', q: 'WHO?', ask: 'Who wrote this? Is it an expert?' },
  { id: 'when', q: 'WHEN?', ask: 'When was it published? Is it out of date?' },
  { id: 'why', q: 'WHY?', ask: 'Why does it exist? To teach, or to sell?' },
  { id: 'agree', q: 'AGREE?', ask: 'Does another, independent source agree?' },
];
const SOURCES = [
  { site: 'ghs.gov.gh', title: 'Malaria: how to protect your family', by: 'Ghana Health Service', date: 'Updated March 2026', text: 'Sleep under a treated mosquito net every night, and go to a clinic quickly if you have a fever.', ok: true, why: 'A government health agency (.gov.gh) says who wrote it, it is recent, and it exists to help people. Other health websites agree.' },
  { site: 'ghana-breaking-news24.example.net', title: 'SHARE BEFORE THEY DELETE THIS!!! Akosombo Dam to close forever', by: 'No author', date: 'No date', text: 'Insiders say the dam will close tomorrow and the lights will go off for ever. Share with everyone!!!', ok: false, q: 'who', why: '<b>WHO?</b> Nobody says who wrote it, so you cannot check whether they know anything. A strange address and shouting capitals are warning signs too.' },
  { site: 'ug.edu.gh', title: 'Fish in Lake Volta: a five-year study', by: 'Dr A. Mensah, Department of Fisheries', date: 'June 2025', text: 'Our team counted the fish caught at 20 landing sites around Lake Volta every month for five years.', ok: true, why: 'A university (.edu.gh), a named expert, a date, and it was written to teach. That passes the shield.' },
  { site: 'old-school-news.example.com', title: 'BECE moved to December!', by: 'Staff writer', date: 'Posted 12 March 2015', text: 'This year the BECE will be written in December instead of June, the ministry says.', ok: false, q: 'when', why: '<b>WHEN?</b> It was posted in <b>2015</b>. "This year" meant 2015, so it tells you nothing about this year. Always check the date.' },
  { site: 'miracle-cure.example.com', title: 'Lime tea cures malaria in ONE day! Buy now: GH₵200', by: 'Dr Wonder', date: '2026', text: 'Forget the clinic! Drink our Miracle Lime Tea. Order today, only 3 packs left!', ok: false, q: 'why', why: '<b>WHY?</b> The page exists to <b>sell</b> you something, not to teach. Malaria needs a clinic, never a "miracle" tea.' },
  { site: 'en.wikipedia.org', title: 'Kakum National Park', by: 'Many editors · 24 references', date: 'Last edited 2026', text: 'Kakum is in the Central Region. Its canopy walkway, about 350 metres long, hangs high above the forest floor.', ok: true, why: 'A good place to <b>start</b>: it is dated and the references at the bottom let you check it. Still check one more source.' },
  { site: 'amazing-facts-gh.example.org', title: 'Did you know? Kakum\'s canopy walkway is 5 km long!', by: 'Kojo A.', date: 'May 2026', text: 'The walkway at Kakum is five kilometres long, the longest in the world!', ok: false, q: 'agree', why: '<b>AGREE?</b> No other source agrees: Wikipedia and the park say the walkway is about <b>350 metres</b>, not 5 km. A fact only one website tells you is not trustworthy yet.' },
];

// ---------- A results page with an advert (Figure 12.2) ----------
const AD_QUERY = '"Kakum National Park" canopy walkway';
const RESULTS = [
  { ad: true, site: 'www.cheap-tours.example.com', title: 'Cheap Kakum Tours - Book Now, 50% Off!', snip: 'Best price guaranteed. Limited offer…' },
  { site: 'en.wikipedia.org › wiki › Kakum_National_Park', title: 'Kakum National Park - Wikipedia', snip: 'Kakum National Park is a national park in the Central Region of Ghana. It is known for its canopy walkway…', best: true },
  { site: 'kakum-hotels.example.com', title: 'Hotels near Kakum canopy walkway: compare prices', snip: 'Find cheap rooms near the park. Compare 40 hotels…' },
  { site: 'ghana-breaking-news24.example.net', title: 'KAKUM WALKWAY COLLAPSED?!! (WATCH)', snip: 'You will not believe what happened… share before it is deleted!!!' },
];
const AD_WHY = [
  '<b>Sponsored</b> means someone <b>paid</b> to be at the top. It is an advert, not the best answer. Skip it unless you really want to buy something.',
  '',
  'A hotel price list: it exists to sell rooms, not to teach you about the walkway.',
  'A rumour site: a shouting headline, "share before it is deleted", and no other site reports it.',
];

// ---------- Drawing the monitor ----------
function wrapText(g, s, x, y, w, lh, max = 2) {
  const words = s.split(' ');
  let line = '';
  let n = 0;
  for (let i = 0; i < words.length; i++) {
    const t = line ? `${line} ${words[i]}` : words[i];
    if (g.measureText(t).width > w && line) {
      if (n === max - 1) { g.fillText(line.replace(/\s*\S*$/, '') + '…', x, y + n * lh); return; }
      g.fillText(line, x, y + n * lh);
      n++;
      line = words[i];
    } else line = t;
  }
  if (line) g.fillText(line, x, y + n * lh);
}
// The monitor is drawn on a 640 × 400 grid, scaled to its canvas.
function drawMonitor(g, W, H, v) {
  g.save();
  g.scale(W / 640, H / 400);
  W = 640;
  H = 400;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  // The "Market Queen" search engine: the market queen who knows every stall.
  g.fillStyle = '#24182e';
  g.fillRect(0, 0, W, 54);
  g.fillStyle = '#ffbe00';
  g.beginPath(); g.moveTo(14, 38); g.lineTo(14, 18); g.lineTo(22, 28); g.lineTo(30, 14); g.lineTo(38, 28); g.lineTo(46, 18); g.lineTo(46, 38); g.closePath(); g.fill();
  g.fillStyle = '#ffffff';
  g.font = font(17, 700);
  g.fillText('Market Queen', 54, 28);
  g.font = font(10, 500);
  g.fillStyle = '#d9d3de';
  g.fillText('SEARCH', 56, 44);
  g.fillStyle = '#ffffff';
  g.beginPath(); g.roundRect(180, 11, 440, 32, 16); g.fill();
  g.fillStyle = '#24182e';
  g.font = font(15, 600);
  let q = v.query || 'Type your keywords…';
  while (q.length > 4 && g.measureText(q).width > 380) q = '…' + q.slice(2);
  g.fillText(q, 196, 28);
  g.strokeStyle = '#5a4470';
  g.lineWidth = 2.5;
  g.beginPath(); g.arc(598, 26, 7, 0, 7); g.moveTo(603, 31); g.lineTo(609, 37); g.stroke();
  // Tabs: All, Images, Maps, News.
  g.font = font(12, 600);
  ['All', 'Images', 'Maps', 'News', 'Videos'].forEach((t, k) => {
    g.fillStyle = k === 0 ? '#ca1f3f' : '#5a4470';
    g.fillText(t, 20 + k * 66, 70);
  });
  g.fillStyle = '#ca1f3f';
  g.fillRect(16, 79, 28, 3);
  g.fillStyle = '#e6e1ea';
  g.fillRect(0, 84, W, 1);
  if (v.view === 'source') {
    drawSource(g, W, H, v);
    g.restore();
    return;
  }
  const rows = v.view === 'ads' ? RESULTS : v.hits.slice(0, 3).map((d) => ({ site: d.site, title: d.title, snip: d.snip, best: d.id === 'target' }));
  g.fillStyle = '#857a90';
  g.font = font(12, 500);
  g.fillText(v.view === 'ads' ? 'About 1,240,000 results' : v.searched ? (v.hits.length ? `About ${v.total.toLocaleString('en-GB')} result${v.total === 1 ? '' : 's'}` : 'No results. Check your operators and spelling.') : 'Press Search to see results', 20, 100);
  let y = 118;
  rows.forEach((r, i) => {
    const pick = v.view === 'ads' && v.pick === i;
    if (pick || (v.solved && r.best)) {
      g.fillStyle = pick ? (r.ad ? '#ffe9a6' : '#dff3ee') : '#dff3ee';
      g.fillRect(8, y - 6, W - 16, 78);
    }
    if (r.ad) {
      g.fillStyle = '#24182e';
      g.font = font(11, 800);
      g.fillText('Sponsored', 20, y + 4);
    }
    g.fillStyle = '#2a7d4f';
    g.font = font(11.5, 500);
    g.fillText(r.site, r.ad ? 92 : 20, y + 4);
    g.fillStyle = '#1d4ed8';
    g.font = font(16, 700);
    let t = r.title;
    while (g.measureText(t).width > W - 50) t = t.slice(0, -2);
    g.fillText(t === r.title ? t : t + '…', 20, y + 24);
    g.fillStyle = '#5a4470';
    g.font = font(12, 400);
    wrapText(g, r.snip, 20, y + 44, W - 50, 15, 2);
    y += 92;
  });
  if (v.solved) {
    g.fillStyle = '#2a9d8f';
    g.beginPath(); g.roundRect(W - 176, 92, 160, 22, 11); g.fill();
    g.fillStyle = '#ffffff';
    g.font = font(12, 700);
    g.fillText('✔ Case solved!', W - 160, 103);
  }
  g.restore();
}
function drawSource(g, W, H, v) {
  const s = v.source;
  if (!s) {
    g.fillStyle = '#5a4470';
    g.font = font(20, 700);
    g.textAlign = 'center';
    g.fillText(v.sourceDone || 'All sources sorted!', W / 2, 220);
    return;
  }
  g.fillStyle = '#efeaf2';
  g.beginPath(); g.roundRect(16, 96, W - 32, 26, 13); g.fill();
  g.fillStyle = '#24182e';
  g.font = font(13, 600);
  g.fillText(s.site, 32, 109);
  g.font = font(22, 700);
  wrapText(g, s.title, 20, 148, W - 40, 26, 2);
  g.font = font(13, 600);
  g.fillStyle = '#5a4470';
  g.fillText(`By: ${s.by}`, 20, 206);
  g.fillText(`Date: ${s.date}`, 20, 226);
  g.fillStyle = '#24182e';
  g.font = font(15, 400);
  wrapText(g, s.text, 20, 262, W - 40, 21, 4);
  if (v.verdict) {
    g.fillStyle = v.verdict.ok ? '#2a9d8f' : '#ca1f3f';
    g.beginPath(); g.roundRect(W - 230, 360, 214, 30, 15); g.fill();
    g.fillStyle = '#ffffff';
    g.font = font(14, 700);
    g.textAlign = 'center';
    g.fillText(v.verdict.text, W - 123, 375);
  }
}
function drawShield(g, W, H, lit, ok) {
  g.clearRect(0, 0, W, H);
  const path = () => {
    g.beginPath();
    g.moveTo(W * 0.5, H * 0.02);
    g.quadraticCurveTo(W * 0.78, H * 0.1, W * 0.97, H * 0.08);
    g.lineTo(W * 0.95, H * 0.5);
    g.quadraticCurveTo(W * 0.9, H * 0.82, W * 0.5, H * 0.98);
    g.quadraticCurveTo(W * 0.1, H * 0.82, W * 0.05, H * 0.5);
    g.lineTo(W * 0.03, H * 0.08);
    g.quadraticCurveTo(W * 0.22, H * 0.1, W * 0.5, H * 0.02);
    g.closePath();
  };
  path();
  g.save();
  g.clip();
  SHIELD.forEach((s, k) => {
    const x = k % 2 ? W / 2 : 0;
    const y = k < 2 ? 0 : H * 0.5;
    g.fillStyle = lit === s.id ? (ok ? '#2ec4b6' : '#ffbe00') : ['#5a4470', '#24182e', '#24182e', '#5a4470'][k];
    g.fillRect(x, y, W / 2, H * 0.5);
  });
  g.restore();
  g.strokeStyle = '#ffbe00';
  g.lineWidth = W * 0.03;
  path();
  g.stroke();
  g.beginPath(); g.moveTo(W / 2, H * 0.03); g.lineTo(W / 2, H * 0.97); g.moveTo(W * 0.04, H * 0.5); g.lineTo(W * 0.96, H * 0.5); g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  SHIELD.forEach((s, k) => {
    const x = k % 2 ? W * 0.72 : W * 0.28;
    const y = k < 2 ? H * 0.3 : H * 0.66;
    g.fillStyle = lit === s.id ? '#24182e' : '#ffffff';
    g.font = font(W * 0.082, 800);
    g.fillText(s.q, x, y);
  });
}

export default function searchLab(stage, ui) {
  const { scene } = stage;
  const wood = 0x9a6b3f;
  const DESK_Y = 1.5;

  // ---------- The room: a kente rug, bookshelves and a detective's desk ----------
  const rug = decal(9, 6, (g, W, H) => {
    const cols = ['#ffbe00', '#2a7d4f', '#ca1f3f', '#24182e', '#ffbe00', '#2a7d4f'];
    const bw = W / 18;
    for (let i = 0; i < 18; i++) {
      g.fillStyle = cols[i % cols.length];
      g.fillRect(i * bw, 0, bw, H);
      for (let j = 0; j < 12; j++) {
        if ((i + j) % 3) continue;
        g.fillStyle = cols[(i + 3) % cols.length];
        g.fillRect(i * bw + bw * 0.2, j * (H / 12) + H * 0.02, bw * 0.6, H / 24);
      }
    }
    g.strokeStyle = '#24182e';
    g.lineWidth = 8;
    g.strokeRect(4, 4, W - 8, H - 8);
  }, { px: 256, transparent: false });
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-0.6, 0.012, 0.2);
  scene.add(rug);

  // Bookshelves, each with one instanced set of books (cheap to draw).
  const bookGeo = new THREE.BoxGeometry(1, 1, 1);
  const bookMat = mat(0xffffff, { roughness: 0.7 });
  const spines = [0xca1f3f, 0x24182e, 0xffbe00, 0x2a7d4f, 0x5a4470, 0x2ec4b6, 0x8a5c00, 0x1d3d8f];
  function shelf(x, z, ry) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    const back = rbox(2.6, 3.6, 0.1, 0x6b4a2b, 0.03);
    back.position.set(0, 1.8, -0.35);
    const sideL = rbox(0.1, 3.6, 0.8, 0x7d5733, 0.03);
    sideL.position.set(-1.3, 1.8, 0);
    const sideR = sideL.clone();
    sideR.position.x = 1.3;
    g.add(back, sideL, sideR);
    for (let k = 0; k < 4; k++) {
      const s = rbox(2.6, 0.08, 0.8, 0x7d5733, 0.02);
      s.position.set(0, 0.06 + k * 1.12, 0);
      g.add(s);
    }
    const books = new THREE.InstancedMesh(bookGeo, bookMat, 48);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    let i = 0;
    for (let row = 0; row < 3; row++) {
      let bx = -1.2;
      while (bx < 1.12 && i < 48) {
        const w = 0.1 + ((i * 37) % 7) * 0.018;
        const h = 0.62 + ((i * 53) % 5) * 0.07;
        const lean = (i * 13) % 11 === 0 ? 0.18 : 0;
        q.setFromEuler(new THREE.Euler(0, 0, lean));
        m4.compose(new THREE.Vector3(bx + w / 2, 0.1 + row * 1.12 + h / 2, 0.02), q, new THREE.Vector3(w, h, 0.55));
        books.setMatrixAt(i, m4);
        books.setColorAt(i, c.setHex(spines[(i * 5) % spines.length]));
        bx += w + 0.012;
        i++;
      }
    }
    books.count = i;
    books.castShadow = true;
    g.add(books);
    scene.add(g);
    return g;
  }
  shelf(-4.4, -2.6, 0.25);
  shelf(4.3, -2.7, -0.25);

  // The desk.
  const top = rbox(5.4, 0.16, 2.5, wood, 0.04);
  top.position.set(0.5, DESK_Y, 0);
  scene.add(top);
  for (const [x, z] of [[-2.0, -1.05], [3.0, -1.05], [-2.0, 1.05], [3.0, 1.05]]) {
    const leg = rbox(0.16, DESK_Y, 0.16, 0x7d5733, 0.03);
    leg.position.set(x, DESK_Y / 2, z);
    scene.add(leg);
  }
  const D = DESK_Y + 0.08;

  // The monitor with the search engine.
  const mon = new THREE.Group();
  mon.position.set(-0.1, D, -0.55);
  mon.rotation.y = 0.05;
  const mfoot = rbox(1.0, 0.05, 0.55, 0x24182e, 0.02);
  mfoot.position.y = 0.025;
  const mneck = rbox(0.14, 0.5, 0.08, 0x24182e, 0.03);
  mneck.position.set(0, 0.28, -0.08);
  const mtilt = new THREE.Group();
  mtilt.position.y = 0.5;
  mtilt.rotation.x = -0.2;
  const bezel = rbox(3.7, 2.34, 0.1, 0x24182e, 0.05);
  bezel.position.y = 1.17;
  const view = { view: 'search', query: '', hits: [], total: 0, searched: false, solved: false, pick: -1, source: null, verdict: null };
  const screen = decal(3.56, 2.225, (g, W, H) => drawMonitor(g, W, H, view), { px: 640, transparent: false });
  screen.position.set(0, 1.17, 0.052);
  mtilt.add(bezel, screen);
  mon.add(mfoot, mneck, mtilt);
  scene.add(mon);
  const redraw = () => {
    const c = screen.material.map.image;
    drawMonitor(c.getContext('2d'), c.width, c.height, view);
    screen.material.map.needsUpdate = true;
  };

  // Keyboard and mouse.
  const kb = rbox(1.7, 0.05, 0.5, 0xe9e4ec, 0.02);
  kb.position.set(-0.15, D + 0.025, 0.55);
  const keys = decal(1.6, 0.42, (g, W, H) => {
    g.fillStyle = '#ffffff';
    const kw = W / 15;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) {
      if (r === 3 && c > 3 && c < 10) continue;
      g.beginPath(); g.roundRect(kw * 0.55 + c * kw, H * 0.08 + r * H * 0.22, kw * 0.8, H * 0.17, 3); g.fill();
    }
    g.beginPath(); g.roundRect(kw * 4.55, H * 0.74, kw * 5.8, H * 0.17, 3); g.fill();
  }, { px: 96 });
  keys.rotation.x = -Math.PI / 2;
  keys.position.set(-0.15, D + 0.052, 0.55);
  const mouse = rbox(0.16, 0.07, 0.25, 0xe9e4ec, 0.035);
  mouse.position.set(0.95, D + 0.035, 0.6);
  scene.add(kb, keys, mouse);

  // A magnifying glass, a detective's hat and a desk lamp.
  const glass = new THREE.Group();
  const ringG = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 10, 32), mat(0x8a5c00, { metalness: 0.5, roughness: 0.35 }));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), mat(0xbfe3f2, { transparent: true, opacity: 0.45, roughness: 0.1 }));
  lens.userData.noInk = true;
  const handle = rbox(0.09, 0.09, 0.5, 0x24182e, 0.04);
  handle.position.set(0, 0, 0.5);
  glass.add(ringG, lens, handle);
  glass.rotation.x = -Math.PI / 2;
  glass.rotation.z = 0.6;
  glass.position.set(-1.35, D + 0.05, 0.75);
  scene.add(glass);
  const hat = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.04, 28), mat(0x6b5a45));
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.3, 24), mat(0x6b5a45));
  crown.position.y = 0.17;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.07, 24), mat(0x24182e));
  band.position.y = 0.06;
  band.userData.noInk = true;
  hat.add(brim, crown, band);
  hat.position.set(-1.6, D + 0.02, -0.6);
  hat.rotation.z = 0.08;
  scene.add(hat);
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.06, 20), mat(COLORS.red));
  lampBase.position.set(2.85, D + 0.03, -0.85);
  const arm1 = rbox(0.06, 0.9, 0.06, 0x24182e, 0.02);
  arm1.position.set(2.85, D + 0.48, -0.85);
  arm1.rotation.z = 0.25;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.32, 20, 1, true), mat(COLORS.red, { side: THREE.DoubleSide }));
  shade.position.set(2.62, D + 0.98, -0.75);
  shade.rotation.z = 0.7;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), mat(0xfff3c4, { emissive: 0xffe08a, emissiveIntensity: 1 }));
  bulb.position.set(2.56, D + 0.9, -0.73);
  bulb.userData.noInk = true;
  scene.add(lampBase, arm1, shade, bulb);
  // A little Ghana flag on the desk.
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), mat(0x24182e));
  pole.position.set(-1.85, D + 0.35, 0.15);
  pole.userData.noInk = true;
  const flag = decal(0.42, 0.28, (g, W, H) => {
    ['#ca1f3f', '#ffbe00', '#2a7d4f'].forEach((c, k) => { g.fillStyle = c; g.fillRect(0, (k * H) / 3, W, H / 3 + 1); });
    g.fillStyle = '#24182e';
    g.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const r = k % 2 ? H * 0.07 : H * 0.16; g.lineTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); }
    g.fill();
  }, { px: 64, transparent: false });
  flag.position.set(-1.64, D + 0.57, 0.15);
  scene.add(pole, flag);

  // ---------- The 4-Way Fact-Check Shield ----------
  const shieldG = new THREE.Group();
  shieldG.position.set(2.45, D, -0.15);
  shieldG.rotation.y = 0.05;
  const stand = rbox(0.6, 0.06, 0.35, 0x24182e, 0.02);
  stand.position.y = 0.03;
  const post = rbox(0.08, 0.3, 0.08, 0x24182e, 0.02);
  post.position.set(0, 0.2, -0.05);
  const shieldBack = rbox(1.0, 1.15, 0.06, 0x8a5c00, 0.05);
  shieldBack.position.set(0, 0.92, -0.06);
  shieldBack.rotation.x = -0.12;
  let lit = null;
  let litOk = false;
  const face = decal(1.12, 1.24, (g, W, H) => drawShield(g, W, H, null, false), { px: 256 });
  face.position.set(0, 0.92, -0.02);
  face.rotation.x = -0.12;
  shieldG.add(stand, post, shieldBack, face);
  scene.add(shieldG);
  function lightShield(id, ok) {
    lit = id;
    litOk = ok;
    const c = face.material.map.image;
    drawShield(c.getContext('2d'), c.width, c.height, lit, litOk);
    face.material.map.needsUpdate = true;
  }

  // ---------- Two trays: trustworthy and fake ----------
  function tray(x, color, text) {
    const g = new THREE.Group();
    g.position.set(x, D, 0.75);
    const base = rbox(0.95, 0.05, 0.7, color, 0.02);
    base.position.y = 0.025;
    g.add(base);
    for (const [w, d, px, pz] of [[0.95, 0.05, 0, 0.33], [0.95, 0.05, 0, -0.33], [0.05, 0.7, 0.45, 0], [0.05, 0.7, -0.45, 0]]) {
      const wall = rbox(w, 0.16, d, color, 0.015);
      wall.position.set(px, 0.1, pz);
      g.add(wall);
    }
    const sign = decal(0.9, 0.2, (c, W, H) => {
      c.fillStyle = '#ffffff';
      c.beginPath(); c.roundRect(0, 0, W, H, H * 0.3); c.fill();
      c.fillStyle = '#24182e';
      let px = H * 0.5;
      do c.font = font(px, 800); while (c.measureText(text).width > W * 0.92 && (px -= 2) > 8);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, W / 2, H * 0.54);
    }, { px: 80 });
    sign.position.set(0, 0.11, 0.358);
    g.add(sign);
    scene.add(g);
    g.userData.count = 0;
    return g;
  }
  const trustTray = tray(1.0, 0x2a9d8f, '✅ TRUSTWORTHY');
  const fakeTray = tray(2.1, COLORS.red, '🚩 FAKE / RUMOUR');
  const cardGeo = new THREE.BoxGeometry(0.62, 0.025, 0.44);
  const sortedCards = [];
  function dropCard(trayG, ok) {
    const m = new THREE.Mesh(cardGeo, mat(ok ? 0xffffff : 0xffe1e6));
    m.castShadow = true;
    const n = trayG.userData.count++;
    const start = screen.localToWorld(new THREE.Vector3(0, 0, 0.2));
    const end = trayG.localToWorld(new THREE.Vector3((n % 2) * 0.06 - 0.03, 0.07 + n * 0.03, 0));
    m.position.copy(start);
    scene.add(m);
    sortedCards.push(m);
    return stage.tween((k) => {
      m.position.lerpVectors(start, end, k);
      m.position.y += Math.sin(k * Math.PI) * 0.6;
      m.rotation.y = (1 - k) * 1.5 + (n % 3 - 1) * 0.1;
    }, 0.55);
  }
  function clearTrays() {
    for (const m of sortedCards) { scene.remove(m); m.material.dispose(); }
    sortedCards.length = 0;
    trustTray.userData.count = fakeTray.userData.count = 0;
  }

  // ---------- The mountain of results ----------
  const PILE = 170;
  const PILE_AT = new THREE.Vector3(-3.8, 0, 1.0);
  const pileMat = mat(0xffffff, { roughness: 0.8 });
  const pile = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.025, 0.36), pileMat, PILE);
  pile.castShadow = true;
  pile.receiveShadow = true;
  const cardTints = [0xffffff, 0xf4f0f6, 0xfff6dc, 0xe6f4f1, 0xffffff];
  const homes = [];
  const m4 = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpC = new THREE.Color();
  for (let i = 0; i < PILE; i++) {
    // A heap: lower layers wide, upper layers narrow, like a real mountain of paper.
    const layer = Math.floor(Math.sqrt(i) * 1.5);
    const r = Math.max(0.12, 1.55 - layer * 0.075) * Math.sqrt(((i * 0.618) % 1) + 0.05);
    const a = i * 2.39996;
    homes.push({
      p: new THREE.Vector3(PILE_AT.x + Math.cos(a) * r, 0.03 + layer * 0.085 + ((i * 7) % 5) * 0.012, PILE_AT.z + Math.sin(a) * r * 0.85),
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(((i * 11) % 7 - 3) * 0.05, a * 1.7, ((i * 5) % 7 - 3) * 0.05)),
      fly: new THREE.Vector3((((i * 31) % 9) - 4) * 0.4, 3 + (i % 5) * 0.5, (((i * 17) % 9) - 4) * 0.3),
    });
    pile.setColorAt(i, tmpC.setHex(cardTints[i % cardTints.length]));
  }
  // Show the first `n` cards; the rest fly away (k = 0..1 for the move).
  let shown = PILE;
  const scaleNow = new Float32Array(PILE).fill(1);
  function placePile(target, k, from) {
    const one = new THREE.Vector3(1, 1, 1);
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < PILE; i++) {
      const on = i < target;
      const was = from[i];
      const sc = was + ((on ? 1 : 0) - was) * k;
      scaleNow[i] = sc;
      p.copy(homes[i].p);
      if (!on && was > 0) p.addScaledVector(homes[i].fly, k);
      if (on && was < 1) p.addScaledVector(homes[i].fly, 1 - k);
      s.copy(one).multiplyScalar(Math.max(sc, 0.0001));
      m4.compose(p, homes[i].q, s);
      pile.setMatrixAt(i, m4);
    }
    pile.instanceMatrix.needsUpdate = true;
  }
  placePile(PILE, 1, scaleNow);
  scene.add(pile);
  // The one right answer: a gold-edged card on top of the pile when a case is solved.
  const answer = new THREE.Group();
  const answerCard = rbox(0.9, 0.05, 0.62, COLORS.gold, 0.02);
  const answerFace = decal(0.82, 0.54, (g, W, H) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a7d4f';
    g.font = font(H * 0.13, 600);
    g.textBaseline = 'middle';
    g.fillText('ug.edu.gh', W * 0.08, H * 0.2);
    g.fillStyle = '#1d4ed8';
    g.font = font(H * 0.16, 800);
    g.fillText('Elephants of Mole', W * 0.08, H * 0.45);
    g.fillText('National Park', W * 0.08, H * 0.65);
    g.fillStyle = '#2a9d8f';
    g.font = font(H * 0.14, 800);
    g.fillText('✔ The right page!', W * 0.08, H * 0.86);
  }, { px: 128, transparent: false });
  answerFace.rotation.x = -Math.PI / 2;
  answerFace.position.y = 0.027;
  answer.add(answerCard, answerFace);
  answer.position.set(PILE_AT.x, 0.2, PILE_AT.z);
  answer.visible = false;
  scene.add(answer);
  const pileTag = label(`About ${search(CASES[0].start).total.toLocaleString('en-GB')} results`, { scale: 0.62, color: '#CA1F3F' });
  pileTag.position.set(PILE_AT.x, 2.2, PILE_AT.z);
  scene.add(pileTag);
  const cardsFor = (total, n) => (n <= 3 ? n : Math.max(4, Math.min(PILE, Math.round(Math.log10(total + 1) * 22))));
  async function setPile(total, n, solvedCase) {
    const target = cardsFor(total, n);
    const from = Float32Array.from(scaleNow);
    const height = homes[Math.max(0, target - 1)]?.p.y ?? 0;
    answer.visible = false;
    setLabel(pileTag, n ? `About ${total.toLocaleString('en-GB')} result${total === 1 ? '' : 's'}` : 'No results', { color: n && n <= 3 ? '#2A9D8F' : '#CA1F3F' });
    pileTag.position.y = 0.9 + height + 0.5;
    await stage.tween((k) => placePile(target, k, from), 0.9);
    shown = target;
    if (solvedCase === 'mole') {
      answer.visible = true;
      answer.position.y = 2.4;
      await stage.tween((k) => (answer.position.y = 2.4 - k * (2.4 - 0.12)), 0.5);
    }
  }

  // ---------- Callout cards (most important first: phones show four) ----------
  const cards = {
    box: stage.callout(screen, { icon: '🔎', title: 'Search box', text: 'Type 2–6 keywords, not a chatty question', at: [0.4, 0.98, 0], dx: 40, dy: -95, onClick: () => explain('box') }),
    pile: stage.callout(pile, { icon: '📚', title: 'Results pile', text: 'Vague search, mountain of results', at: [PILE_AT.x + 0.3, 0.6, PILE_AT.z + 0.4], dx: -10, dy: 130, onClick: () => explain('pile') }),
    shield: stage.callout(face, { icon: '🛡️', title: 'Fact-check shield', text: 'Who? When? Why? Agree?', at: [0, 0.6, 0], dx: 130, dy: -80, onClick: () => explain('shield') }),
    trays: stage.callout(trustTray, { icon: '🗂️', title: 'Sort the sources', text: 'Trustworthy, or fake and rumour', at: [0.5, 0.15, 0.3], dx: 100, dy: 100, onClick: () => explain('trays') }),
    ad: stage.callout(screen, { icon: '📢', title: 'Sponsored', text: 'Someone paid to be on top', at: [-1.45, 0.43, 0], dx: -250, dy: -110, onClick: () => explain('ad') }),
  };
  const ABOUT = {
    box: ['🔎 The search box', '<p>A <b>search engine</b> (Google, Bing, DuckDuckGo) is the <b>market queen</b> of the Web: it has already catalogued billions of pages. Type the <b>keywords</b> you expect to see on the perfect page, not a chatty question.</p>'],
    pile: ['📚 The mountain of results', '<p>A vague search like <b>parks ghana</b> matches millions of pages. Every keyword and operator you add makes the pile smaller, until only the pages you need are left.</p>'],
    shield: ['🛡️ The 4-Way Fact-Check Shield', `<p>Before a fact goes into your project, ask:</p><ul>${SHIELD.map((s) => `<li><b>${s.q}</b> ${s.ask}</li>`).join('')}</ul><p>If two independent, reliable sources agree, the fact is trustworthy.</p>`],
    trays: ['🗂️ Trustworthy or fake?', '<p>Good places to start: <b>.gov.gh</b> government agencies, <b>.edu.gh</b> universities, established national news, and Wikipedia (check its references). Warning signs: no author or date, shouting capitals, strange addresses, and nobody else reporting it.</p>'],
    ad: ['📢 Sponsored results', '<p>Results marked <b>Sponsored</b> or <b>Ad</b> are adverts: someone <b>paid</b> to be at the top. Read the address and the snippet before you click, and skip the adverts unless you want to buy something.</p>'],
  };
  function explain(k) { ui.info(...ABOUT[k]); }
  stage.clickable(mon, () => explain('box'));
  stage.clickable(pile, () => explain('pile'));
  stage.clickable(shieldG, () => explain('shield'));
  stage.clickable(trustTray, () => explain('trays'));
  stage.clickable(fakeTray, () => explain('trays'));

  // ---------- Side panel: three parts ----------
  let part = 1;
  const tabs = ui.group('Three parts');
  const tabBtns = [
    ui.button('1 🔎 Narrow it', () => showPart(1), { group: tabs }),
    ui.button('2 🛡️ Sort sources', () => showPart(2), { group: tabs }),
    ui.button('3 📢 Spot the ad', () => showPart(3), { group: tabs }),
  ];
  const box3 = ui.group('');
  let busy = false;
  function setBusy(on) {
    busy = on;
    // aria-disabled (not disabled) keeps a keyboard user's focus on the button.
    box3.querySelectorAll('button, input').forEach((b) => {
      b.setAttribute('aria-disabled', String(on));
      b.style.opacity = on ? '0.55' : '';
    });
  }
  function showPart(n) {
    if (busy) return;
    part = n;
    ui.toggle(tabBtns, tabBtns[n - 1]);
    tabBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === n - 1)));
    box3.innerHTML = '';
    lightShield(null, false);
    [partNarrow, partSort, partAds][n - 1]();
  }
  const title = (t) => ui.element(`<span class="lab-group-title">${esc(t)}</span>`, box3);

  // ---------- Part 1: narrow the search ----------
  const solved = { mole: ui.isDone('narrow'), food: ui.isDone('narrow') };
  let caseIdx = 0;
  let lastQuery = null;
  let caseBtns = [];
  function partNarrow() {
    const c = CASES[caseIdx];
    view.view = 'search';
    title('Pick a case');
    const row = ui.group('');
    box3.appendChild(row);
    caseBtns = CASES.map((cc, i) => {
      const b = ui.button(`${cc.icon} Case ${i + 1}: ${cc.name}${solved[cc.id] ? ' ✅' : ''}`, () => { if (busy) return; caseIdx = i; lastQuery = null; showPart(1); }, { group: row });
      if (i === caseIdx) b.classList.add('active');
      b.setAttribute('aria-pressed', String(i === caseIdx));
      return b;
    });
    ui.element(`<div class="mail-card"><small class="mail-count">${c.icon} Case ${caseIdx + 1}</small><p style="margin:4px 0 0">${c.brief}</p></div>`, box3);
    const field = ui.element('<label class="lab-field">Search box (type, or press the word buttons)<input type="text" autocomplete="off" spellcheck="false"></label>', box3);
    const input = field.querySelector('input');
    input.value = c.start;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    title('Add to the search');
    const chips = ui.group('');
    box3.appendChild(chips);
    for (const chip of c.chips) {
      ui.button(chip, () => {
        if (busy) return;
        input.value = `${input.value.trim()} ${chip}`.trim();
        input.focus();
      }, { group: chips });
    }
    const go = ui.group('');
    box3.appendChild(go);
    ui.button('🔎 Search', () => run(), { primary: true, group: go });
    ui.button('✖ Clear the box', () => { if (busy) return; input.value = ''; input.focus(); }, { group: go });
    ui.button('↺ Start again', () => { if (busy) return; input.value = c.start; lastQuery = null; run(); }, { group: go });
    async function run() {
      if (busy) return;
      const q = input.value.trim().slice(0, 120);
      setBusy(true);
      try { await doSearch(c, q); } finally { setBusy(false); }
    }
    view.query = c.start;
    view.searched = false;
    view.solved = false;
    redraw();
    ui.info(`${c.icon} Case ${caseIdx + 1}: ${c.name}`, `<p>${c.brief}</p><p>The search box already says <b>${esc(c.start)}</b>. Press <b>🔎 Search</b> to see how big the pile is, then add keywords and operators to shrink it.</p>`);
  }
  const OP_TEXT = {
    phrase: '<b>"Quotes"</b> keep the words together, in this exact order, so pages that just mention "mole" and "park" somewhere fall away.',
    not: '<b>The minus</b> left out every page with that word. No space after the minus!',
    site: '<b>site:</b> keeps only pages from that kind of website. No space after the colon.',
    any: '<b>OR</b> (in capitals) means <b>either word will do</b>, so you get pages about both.',
  };
  const NOTE_TEXT = {
    filler: 'You do not need chatty words like "please", "how" or "can": search engines hunt for <b>keywords</b>.',
    'minus-space': 'There is a <b>space after the minus</b>, so it did nothing, and the word after it now <b>counts</b> instead of being left out! Write <code>-hotel</code>.',
    'site-space': 'There is a <b>space after site:</b>, so it did nothing. Write <code>site:edu.gh</code> with no space.',
    'or-small': 'A small <b>or</b> is just another word that must be on the page. Type <b>OR</b> in capital letters.',
    'quote-open': 'A quote mark is missing: put one at each end of the phrase.',
  };
  async function doSearch(c, q) {
    const r = search(q);
    const prev = lastQuery;
    lastQuery = r;
    view.query = q;
    view.hits = r.hits;
    view.total = r.total;
    view.searched = true;
    const done = c.solved(r.hits, r.p);
    view.solved = done;
    redraw();
    stage.reveal();
    await setPile(r.total, r.hits.length, done ? c.id : null);
    const used = ['phrase', 'not', 'site', 'any'].filter((k) => r.p[k]);
    const notes = [...r.p.notes].map((n) => `<li>⚠️ ${NOTE_TEXT[n]}</li>`).join('');
    const ops = used.map((k) => `<li>${OP_TEXT[k]}</li>`).join('');
    const n = (x) => `<b>${x.toLocaleString('en-GB')}</b> result${x === 1 ? '' : 's'}`;
    const change = prev ? `From ${n(prev.total)} to ${n(r.total)}.` : `${n(r.total)}.`;
    if (done) {
      solved[c.id] = true;
      if (solved.mole && solved.food) ui.complete('narrow');
      const other = CASES.find((x) => !solved[x.id]);
      ui.info('🕵🏾 Case solved!', `<p>${change} ${c.id === 'mole' ? 'Only the <b>ug.edu.gh</b> field study is left: a university page about Mole\'s elephants, with no hotels.' : 'Exactly the <b>three recipe pages</b>: kenkey ones and banku ones, and nothing else.'}</p><ul>${ops}</ul>${other ? `<p>Next: <b>${other.icon} ${other.name}</b> (press its case button above).</p>` : '<p>🏆 Both cases solved with all four operators. Next: part <b>2 🛡️ Sort sources</b>.</p>'}`);
      const b = caseBtns[CASES.indexOf(c)];
      if (b) b.textContent = `${c.icon} Case ${CASES.indexOf(c) + 1}: ${c.name} ✅`;
      return;
    }
    let tip = '';
    if (!r.hits.length) tip = c.id === 'food' && !r.p.any ? 'No single page has <b>all</b> of your words. If either word will do, put <b>OR</b> (capitals) between them.' : 'Nothing matched. Check each operator: no space after - or site:, and OR in capitals.';
    else if (c.id === 'mole') {
      if (!r.p.phrase) tip = 'Try putting <b>"Mole National Park"</b> in quotes, so the three words stay together.';
      else if (!r.hits.every((d) => d.set.has('elephant'))) tip = 'Add the keyword <b>elephants</b>.';
      else if (r.hits.some((d) => d.set.has('hotel'))) tip = 'Hotel pages are still in the pile. Leave them out with <b>-hotel</b>.';
      else if (!r.p.site) tip = 'Your teacher wants a university page: add <b>site:edu.gh</b>.';
      else tip = 'Close! Read the brief again: which words should be on the page?';
    } else {
      if (!r.p.any) tip = 'If <b>either</b> kenkey or banku will do, put <b>OR</b> between them.';
      else if (r.hits.some((d) => !d.set.has('recipe'))) tip = 'Some pages are not recipes. Add the keyword <b>recipe</b>.';
      else tip = 'Close! Make sure you have every recipe page and nothing else.';
    }
    ui.info(`🔎 ${r.hits.length ? `${r.total.toLocaleString('en-GB')} result${r.total === 1 ? '' : 's'}` : 'No results'}`, `<p>${change}</p>${ops || notes ? `<ul>${ops}${notes}</ul>` : ''}<p>💡 ${tip}</p>`);
  }

  // ---------- Part 2: sort the sources ----------
  let order = [];
  let si = 0;
  let firstTry = true;
  let right = 0;
  let stageOf = 'trust'; // 'trust' (trustworthy or fake?) then 'shield' (which question?)
  function partSort() {
    view.view = 'source';
    if (!order.length || si >= order.length) newRound();
    drawSort();
  }
  function newRound() {
    order = shuffle(SOURCES.map((_, i) => i));
    si = 0;
    right = 0;
    firstTry = true;
    stageOf = 'trust';
    clearTrays();
  }
  function drawSort() {
    box3.innerHTML = '';
    title(`Source ${Math.min(si + 1, order.length)} of ${order.length} · ✅ ${right} right first time`);
    if (si >= order.length) {
      view.source = null;
      const perfect = right === order.length;
      view.sourceDone = perfect ? 'All 7 sorted correctly! 🏆' : `${right} of ${order.length} right first time`;
      redraw();
      if (perfect) ui.complete('sources');
      ui.info(perfect ? '🏆 Case closed: every source sorted!' : '🔁 Nearly there', `<p>You sorted <b>${right} of ${order.length}</b> right first time.${perfect ? ' You used every question on the shield: <b>Who? When? Why? Agree?</b>' : ' Press <b>↺ Try again</b> and get them all right first time.'}</p><p>Remember: when a fact is going into your project, two independent, reliable sources should agree.</p>`);
      const row = ui.group('');
      box3.appendChild(row);
      ui.button('↺ Try again', () => { newRound(); drawSort(); }, { group: row });
      if (perfect) ui.button('Next: 3 📢 Spot the ad ▶', () => showPart(3), { primary: true, group: row });
      return;
    }
    const s = SOURCES[order[si]];
    view.source = s;
    view.verdict = null;
    redraw();
    ui.element(`<div class="mail-card"><div class="mail-row addr" style="padding-left:0">${esc(s.site)}</div><p style="margin:6px 0;font-size:15px"><b>${esc(s.title)}</b></p><div class="mail-row"><span>By:</span> ${esc(s.by)}</div><div class="mail-row"><span>Date:</span> ${esc(s.date)}</div><p style="margin:6px 0 0">${esc(s.text)}</p></div>`, box3);
    const row = ui.group('');
    box3.appendChild(row);
    if (stageOf === 'trust') {
      if (si === 0 && firstTry) ui.info('🛡️ Trustworthy or fake?', '<p>Read each source on the screen. Is it <b>trustworthy</b>, or a <b>fake or rumour</b>? For each fake, name the shield question that gives it away.</p>');
      ui.button('✅ Trustworthy', () => judge(true), { group: row });
      ui.button('🚩 Fake or rumour', () => judge(false), { primary: true, group: row });
    } else {
      ui.element('<span class="lab-group-title">Which shield question exposes it?</span>', row);
      for (const q of SHIELD) ui.button(`${q.q} ${q.ask}`, () => pickShield(q.id), { group: row });
    }
  }
  async function judge(ok) {
    if (busy) return;
    const s = SOURCES[order[si]];
    if (ok !== s.ok) {
      firstTry = false;
      ui.info(ok ? '🤔 Look again' : '🤔 Actually, that one is fine', ok ? `<p>Something about this one should worry you. Check it against the shield: <b>Who? When? Why? Agree?</b></p>` : `<p>${s.why}</p><p>Try again.</p>`);
      return;
    }
    if (!s.ok) {
      stageOf = 'shield';
      ui.info('🚩 Yes, it is fake or a rumour', '<p>Now name the shield question that exposes it.</p>');
      drawSort();
      return;
    }
    setBusy(true);
    view.verdict = { ok: true, text: '✅ Passes the shield' };
    redraw();
    stage.reveal();
    ui.info('✅ Trustworthy', `<p>${s.why}</p>`);
    await dropCard(trustTray, true);
    next();
  }
  async function pickShield(id) {
    if (busy) return;
    const s = SOURCES[order[si]];
    if (id !== s.q) {
      firstTry = false;
      lightShield(id, false);
      const q = SHIELD.find((x) => x.id === id);
      ui.info(`🤔 Not ${q.q}`, `<p>${q.ask} Look at the source again: that part looks fine. Which question really gives it away?</p>`);
      return;
    }
    setBusy(true);
    lightShield(id, true);
    view.verdict = { ok: false, text: `🚩 Exposed by ${SHIELD.find((x) => x.id === id).q}` };
    redraw();
    stage.reveal();
    ui.info('🛡️ Exposed!', `<p>${s.why}</p>`);
    await dropCard(fakeTray, false);
    next();
  }
  function next() {
    if (firstTry) right++;
    si++;
    firstTry = true;
    stageOf = 'trust';
    setBusy(false);
    lightShield(null, false);
    drawSort();
  }

  // ---------- Part 3: spot the advert ----------
  let adStep = 'ad';
  function partAds() {
    view.view = 'ads';
    view.query = AD_QUERY;
    view.pick = -1;
    adStep = 'ad';
    redraw();
    drawAds();
    ui.info('📢 Read before you click', `<p>You searched <b>${esc(AD_QUERY)}</b>. Look at the results on the screen. First: <b>which result is an advert?</b></p>`);
  }
  function drawAds() {
    box3.innerHTML = '';
    title(adStep === 'ad' ? 'Step 1 · Which result is an advert?' : adStep === 'best' ? 'Step 2 · Which page would you open for your project?' : 'Done!');
    const row = ui.group('');
    box3.appendChild(row);
    RESULTS.forEach((r, i) => {
      const b = ui.button(`${i + 1}. ${r.title}`, () => pickResult(i), { group: row });
      b.title = r.site;
    });
    if (adStep === 'done') ui.button('↺ Try again', () => partAds(), { group: row });
  }
  function pickResult(i) {
    if (busy) return;
    const r = RESULTS[i];
    view.pick = i;
    redraw();
    stage.reveal();
    if (adStep === 'ad') {
      if (r.ad) {
        adStep = 'best';
        cards.ad.card.classList.add('done');
        ui.info('📢 Spotted it!', `<p>${AD_WHY[0]}</p><p>Step 2: read the <b>address</b> and the <b>snippet</b> of the others. Which page would you open for your project?</p>`);
      } else ui.info('🤔 Look again', '<p>Look for the small word <b>Sponsored</b> (or <b>Ad</b>) next to a result, usually at the very top.</p>');
    } else if (adStep === 'best') {
      if (r.best) {
        adStep = 'done';
        ui.complete('ad');
        ui.info('✅ The best page', '<p><b>en.wikipedia.org</b>: the address tells you who runs it, and the snippet is about the park and its walkway, which is just what you need. A good start: check its references, and find one more source that agrees.</p>');
      } else ui.info('🤔 Not that one', `<p>${AD_WHY[i]}</p><p>Read the addresses again: which one is an encyclopedia page about the park?</p>`);
    }
    drawAds();
  }

  showPart(1);
  if (ui.isDone('ad')) cards.ad.card.classList.add('done');
  ui.info('🕵🏾 Welcome, Search Detective', '<p>Every case starts with a <b>vague search</b> and a mountain of results. Add <b>keywords</b> and the four operators, <b>"quotes"</b>, <b>-minus</b>, <b>site:</b> and <b>OR</b>, until only the right page is left.</p><p>Then sort sources with the <b>4-Way Fact-Check Shield</b>, and spot the paid advert.</p>');

  // The lamp glows softly.
  stage.onTick((dt, t) => { bulb.material.emissiveIntensity = 0.9 + Math.sin(t * 2) * 0.1; });
}

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const missions = [
  { id: 'narrow', text: 'Solve both cases: shrink the pile to the right pages with "quotes", -minus, site: and OR.', hint: 'No space after - or site:, and type OR in capitals. Watch the pile shrink each time.' },
  { id: 'sources', text: 'Sort all 7 sources right first time, naming the shield question that exposes each fake.', hint: 'Who wrote it? When? Why does it exist? Does another source agree?' },
  { id: 'ad', text: 'Spot the Sponsored result, then choose the best real page to open.', hint: 'Look for the small word "Sponsored". Then read each address and snippet.' },
];

export const config = { camera: [2.6, 8.6, 11.5], target: [-0.6, 1.5, 0], shadowSize: 8, frame: 0.72, minDistance: 4 };
