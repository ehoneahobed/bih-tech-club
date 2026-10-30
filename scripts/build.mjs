// Builds the static site into dist/ (this is what Vercel runs).
//   content/sessions.json      -> the course map (titles, levels, which 3D lab)
//   content/workbooks/*.html   -> the authored workbooks
//   packs/pdf/*.pdf            -> PDFs made locally with `npm run pdf`
//   content/mentor/*.md        -> mentor guides
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { zipSync, strToU8 } from 'fflate';
import { transformWorkbook } from './lib/workbook.mjs';
import { renderMarkdown } from './lib/markdown.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
// DIST_DIR lets several test builds run side by side (e.g. DIST_DIR=/tmp/a/).
const DIST = process.env.DIST_DIR ? process.env.DIST_DIR.replace(/\/?$/, '/') : ROOT + 'dist/';
const course = JSON.parse(readFileSync(ROOT + 'content/sessions.json', 'utf8'));
// Link previews need absolute URLs. SITE_URL overrides it for a custom domain.
const SITE = (process.env.SITE_URL || course.site).replace(/\/$/, '');
const VERSION = new Date().toISOString();
const levels = Object.fromEntries(course.levels.map((l) => [l.id, l]));

export const LABS = {
  computer: { title: 'Explore the Computer', icon: '🖥️', blurb: 'Click every part of a desktop and a laptop, power them on, and follow a key press from input to process to output.' },
  keyboard: { title: 'The Living Keyboard', icon: '⌨️', blurb: 'Press real keys and watch the 3D keyboard respond. See the four zones and the finger map, then take the home-row drill.' },
  desktop: { title: 'Window Wrangler', icon: '🪟', blurb: 'Double-click icons to open programmes, then minimise, maximise, close and switch between windows on the taskbar.' },
  files: { title: 'The Filing Tree', icon: '📁', blurb: 'Walk from the drive down to a file. Copy, cut, rename and delete files, then rescue them from the Recycle Bin.' },
  internet: { title: 'Internet Town', icon: '🌍', blurb: 'Send a web request (and see why HTTPS matters), follow an email through the digital post office, and co-edit a cloud document.' },
  chart: { title: '3D Spreadsheet Charts', icon: '📊', blurb: 'Type numbers into a mini spreadsheet and watch columns and pie slices grow, with SUM, AVERAGE, MAX and MIN updating live.' },
  password: { title: 'Password Fortress', icon: '🛡️', blurb: 'Build a wall of bricks with a practice passphrase, then send the guessing robot to see whether it can break in.' },
  coding: { title: 'Code the Sprite', icon: '🤖', blurb: 'Snap together motion, loop and pen blocks, run them on an x/y stage, collect litter for points and debug step by step.' },
  document: { title: 'Format a Real Document', icon: '📝', blurb: 'Select paragraphs on a 3D page and use the ribbon: bold, sizes, alignment, bullets, numbering, heading styles, spell check, then print it on a 3D printer.' },
  slides: { title: 'Slide Design & Show Time', icon: '🎤', blurb: 'Fix a badly designed deck (contrast, the 6-by-6 rule, a squished picture, carnival animations), then present it in a 3D classroom with real slide-show keys.' },
  phishing: { title: 'Spot the Phish', icon: '🎣', blurb: 'Emails land on your desk one by one. Check the sender, the subject and where the link really goes, then keep it or shred it.' },
  sorter: { title: 'Teach the Robot', icon: '🧠', blurb: 'Show a recycling robot examples of plastic, paper and cans, then watch it sort things it has never seen. Give it bad examples and see how AI gets things wrong.' },
  aihelper: { title: 'AI Helper Check', icon: '💬', blurb: 'Ask a pretend AI helper on a 3D phone. Build a clear prompt, catch its confident mistakes against a trusted source, and decide what you should never type into a chatbot.' },
  capstone: { title: 'Build the Whole House', icon: '🏠', blurb: 'Each capstone step builds part of a 3D house: charter, prototype, testing and polish. Then practise your timed 3-minute pitch on the Demo Day stage. Saved between sessions.' },
};
const labsOf = (s) => (Array.isArray(s.lab) ? s.lab : s.lab ? [s.lab] : []);

const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const write = (rel, data) => {
  mkdirSync(DIST + rel.replace(/[^/]+$/, ''), { recursive: true });
  writeFileSync(DIST + rel, data);
};

// "Last updated" comes from git. Vercel may clone only recent history, which
// would date old files to the oldest commit it fetched, so fetch the rest first.
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
try {
  if (git('rev-parse', '--is-shallow-repository') === 'true') {
    try { git('fetch', '--unshallow', '--quiet'); } catch { console.warn('Shallow git clone: "Last updated" dates may be wrong. Set VERCEL_DEEP_CLONE=true in Vercel.'); }
  }
} catch {}

function lastUpdated(file) {
  try {
    const d = git('log', '-1', '--format=%cs', '--', file);
    if (d) return d;
  } catch {}
  return statSync(ROOT + file).mtime.toISOString().slice(0, 10);
}
const fmtDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------- Layout ----------
// Every page wears the Bozoma Innovation Hub look: plum header with the white
// logo, Outfit headings, and the BIH footer.
function layout({ title, description, body, path, active, image = 'site', noindex = false, head = '' }) {
  const depth = (path.match(/\//g) || []).length;
  // The 404 page is served at whatever address was asked for, so it links from the site root.
  const up = path === '404.html' ? '/' : '../'.repeat(depth);
  const url = `${SITE}/${path.replace(/index\.html$/, '')}`;
  const nav = [['', 'Sessions', 'home'], ['labs/', '3D Labs', 'labs'], ['mentors/', 'For mentors', 'mentors']]
    .map(([href, text, key]) => `<a href="${up}${href}"${active === key ? ' aria-current="page"' : ''}>${text}</a>`).join('')
    + `<a class="nav-cta" href="${up}start/"${active === 'start' ? ' aria-current="page"' : ''}>Start here</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(course.programme)} · ${esc(course.organisation)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og/${image}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#24182e">
<link rel="canonical" href="${url}">
<link rel="icon" href="${up}assets/icon-192.png">
<link rel="apple-touch-icon" href="${up}assets/icon-180.png">
<link rel="manifest" href="${up}manifest.webmanifest">
<link rel="preload" href="${up}fonts/outfit.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}site.css">
${head}
</head>
<body>
<a class="skip" href="#main">Skip to the content</a>
<header class="site-head"><div class="wrap">
  <a class="brand" href="${up}"><img src="${up}assets/logo-white.png" alt="Tech Club · Bozoma Innovation Hub" width="232" height="46"></a>
  <nav class="nav" aria-label="Main">${nav}</nav>
</div></header>
<main id="main">${body}</main>
<footer><div class="wrap">
  <div class="foot-grid">
    <div class="foot-brand">
      <img src="${up}assets/logo-white.png" alt="Tech Club · Bozoma Innovation Hub" width="232" height="46">
      <p>The ${esc(course.programme)} is a Bozoma Innovation Hub programme that takes junior high pupils from their first click to their first digital project.</p>
    </div>
    <div><h4>The club</h4><ul>
      <li><a href="${up}start/">Start here</a></li>
      <li><a href="${up}">All ${course.sessions.length} sessions</a></li>
      <li><a href="${up}labs/">3D labs</a></li>
      <li><a href="${up}mentors/">For mentors</a></li>
    </ul></div>
    <div><h4>Downloads</h4><ul>
      ${web(`<li><a href="${up}downloads/BIH-Tech-Club-All-Sessions.zip" download>All study packs (.zip)</a></li>
      <li><a href="${up}downloads/BIH-Tech-Club-Offline-Kit.zip" download>Offline Club Kit (USB)</a></li>`)}
      <li><a href="${up}mentors/#downloads">Printable PDFs</a></li>
    </ul></div>
    <div><h4>Bozoma Innovation Hub</h4><ul>
      <li><a href="https://bozomainnovationhub.com" rel="noopener">bozomainnovationhub.com</a></li>
      <li><a href="mailto:info@bozomainnovationhub.com">info@bozomainnovationhub.com</a></li>
      <li>Aiyinasi, Ellembele District, Western Region, Ghana</li>
    </ul></div>
  </div>
  <div class="foot-bottom">
    <span>© ${new Date().getFullYear()} ${esc(course.organisation)}. World-class begins at home.</span>
    <span>Updated ${fmtDate(new Date().toISOString().slice(0, 10))}<span class="offline-ready" hidden> · ✓ Pages you open keep working offline on this device</span></span>
  </div>
</div></footer>
<script src="${up}site.js" defer></script>
</body>
</html>`;
}

// The plum heading band used at the top of every inner page.
const pageHero = ({ eyebrow, title, lead = '', extra = '' }) => `<div class="session-hero"><div class="wrap">
  ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}
  <h1>${title}</h1>
  ${lead ? `<p>${lead}</p>` : ''}${extra}
</div></div>`;

// Parts of a page that exist only on the website (downloads) or only in the
// USB kit. kitPage() keeps the right one; the website ignores the kit comments.
const web = (html) => `<!--web-->${html}<!--/web-->`;
const kitOnly = (html) => `<!--kit${html}kit-->`;

// three.js lives under a versioned folder, so the year-long browser cache on
// /vendor never serves an old copy after an upgrade.
const THREE_DIR = `vendor/three@${JSON.parse(readFileSync(ROOT + 'node_modules/three/package.json', 'utf8')).version}/`;
const IMPORT_MAP = (up) => `<script type="importmap">{"imports":{"three":"${up}${THREE_DIR}three.module.min.js","three/addons/":"${up}${THREE_DIR}addons/"}}</script>`;

function labBlock(id, up) {
  const lab = LABS[id];
  return `<div class="lab" data-lab="${id}" aria-label="${esc(lab.title)} 3D lab">
  <div class="lab-canvas"><div class="lab-status">Loading 3D lab…</div><span class="lab-hint">Drag to look around · scroll or pinch to zoom · click things</span></div>
  <div class="lab-side"><div class="lab-missions" aria-live="polite"></div><div class="lab-info" aria-live="polite"></div><div class="lab-controls"></div></div>
</div>`;
}

// ---------- Build ----------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(ROOT + 'assets', DIST + 'assets', { recursive: true });
cpSync(ROOT + 'src/labs', DIST + 'labs', { recursive: true });
cpSync(ROOT + 'src/site.css', DIST + 'site.css');
cpSync(ROOT + 'src/site.js', DIST + 'site.js');
// Brand fonts (Outfit for headings, Rubik for text), served from the site so they work offline.
const FONTS = { outfit: 'node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2', rubik: 'node_modules/@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2' };
for (const [name, file] of Object.entries(FONTS)) cpSync(ROOT + file, DIST + `fonts/${name}.woff2`);
const three = ROOT + 'node_modules/three/';
for (const f of ['three.module.min.js', 'three.core.min.js']) cpSync(three + 'build/' + f, DIST + THREE_DIR + f);
// The three.js add-ons the labs import (runtime.js).
for (const f of ['controls/OrbitControls.js', 'geometries/RoundedBoxGeometry.js']) cpSync(three + 'examples/jsm/' + f, DIST + THREE_DIR + 'addons/' + f);
cpSync(three + 'LICENSE', DIST + THREE_DIR + 'LICENSE');

const logo = readFileSync(ROOT + 'assets/logo.png');
const allZip = {};
const warnings = [];
const sessions = course.sessions.map((s) => {
  const id = pad(s.n);
  const src = `content/workbooks/session-${id}.html`;
  const pdfSrc = ROOT + `packs/pdf/session-${id}.pdf`;
  const hasPdf = existsSync(pdfSrc);
  if (!hasPdf) warnings.push(`Session ${s.n}: no PDF yet (run "npm run pdf")`);
  else if (statSync(pdfSrc).mtimeMs < statSync(ROOT + src).mtimeMs) warnings.push(`Session ${s.n}: PDF is older than the workbook (run "npm run pdf")`);
  return { ...s, id, src, hasPdf, pdfSrc, updated: lastUpdated(src), level: levels[s.level] };
});

for (const s of sessions) {
  const html = readFileSync(ROOT + s.src, 'utf8');
  const pdfHref = s.hasPdf ? `../downloads/pdf/BIH-Tech-Club-Session-${s.id}.pdf` : null;
  write(`workbooks/session-${s.id}.html`, transformWorkbook(html, { n: s.n, pdfHref }));
  const offline = transformWorkbook(html, { n: s.n, offline: true });

  const folder = `BIH-Tech-Club-Session-${s.id}`;
  const files = {
    [`${folder}/Session-${s.id}-Workbook.html`]: strToU8(offline),
    [`${folder}/README.txt`]: strToU8(readme(s)),
    [`${folder}/logo.png`]: logo,
  };
  if (s.hasPdf) {
    const pdf = readFileSync(s.pdfSrc);
    files[`${folder}/Session-${s.id}-Workbook.pdf`] = pdf;
    write(`downloads/pdf/BIH-Tech-Club-Session-${s.id}.pdf`, pdf);
  }
  write(`downloads/BIH-Tech-Club-Session-${s.id}.zip`, zipSync(files, { level: 9 }));
  Object.assign(allZip, Object.fromEntries(Object.entries(files).filter(([k]) => !k.endsWith('logo.png')).map(([k, v]) => [`BIH-Tech-Club-All-Sessions/${k}`, v])));
}
allZip['BIH-Tech-Club-All-Sessions/logo.png'] = logo;
write('downloads/BIH-Tech-Club-All-Sessions.zip', zipSync(allZip, { level: 9 }));

function readme(s) {
  return `BIH JHS TECH CLUB · SESSION ${s.n}: ${s.title.toUpperCase()}
${s.level.name}
Last updated: ${fmtDate(s.updated)}

WHAT IS IN THIS PACK
- Session-${s.id}-Workbook.html  Open it in any web browser (Chrome, Edge, Firefox).
                                 It works with no internet. You can type answers straight
                                 into the boxes; they are saved in that browser on that
                                 computer. Use "Print / Save as PDF" to keep a copy.
${s.hasPdf ? `- Session-${s.id}-Workbook.pdf   The same workbook, ready to print for paper practice.\n` : ''}
${labsOf(s).length ? `3D LAB
This session has interactive 3D labs (${labsOf(s).map((l) => `"${LABS[l].title}"`).join(', ')}).
Open them on the club website, or use the Offline Club Kit
(BIH-Tech-Club-Offline-Kit.zip) to run every lab with no internet.\n` : ''}
SAFETY REMINDERS
- Use fictional information in practice tasks.
- Never write a real password in your workbook.
- Ask your mentor before installing, deleting or sharing anything.

Bozoma Innovation Hub · ${course.programme}
`;
}

// ---------- Pages ----------
// Pieces of the mentor guide that pupils also see: what they will learn, and
// the answer key (inside "Finished? Check your answers", for self-study).
const guideSection = (id, heading) => {
  const file = ROOT + `content/mentor/session-${id}.md`;
  if (!existsSync(file)) return '';
  const md = readFileSync(file, 'utf8');
  const m = md.match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return m ? m[1].trim() : '';
};
const outcomesOf = (id) => guideSection(id, 'Learning outcomes').split('\n').filter((l) => /^\d+\.\s/.test(l)).map((l) => l.replace(/^\d+\.\s+/, ''));

// The steps through each session. Most workbooks teach on pages 1–4, have the
// hands-on Lab Mission on page 5 and the review on page 6; 20 and 22 (capstone) differ.
function stepsFor(s) {
  const wb = (page) => `../../workbooks/session-${s.id}.html${page ? `#page-${page}` : ''}`;
  const open = (page, text) => `<a class="btn btn-primary btn-small" href="${wb(page)}">${text}</a>`;
  const labs = labsOf(s);
  const lab = labs.length ? {
    title: 'Explore the 3D lab', time: '15 min', labStep: labs.join(' '),
    text: `Play with the 3D model below. The 🎯 missions tell you exactly what to do next${labs.length > 1 ? ' (this session has two labs)' : ''}. When you finish every mission, this step ticks itself.`,
    actions: `<a class="btn btn-outline btn-small" href="#lab">Go to the 3D lab ↓</a>${labs.map((l) => `<span class="small-tip" data-missions="${l}"></span>`).join('')}`,
  } : null;
  const answers = guideSection(s.id, 'Answer key');
  const check = (page, text) => ({
    title: 'Check yourself', time: '10 min', text,
    actions: `${open(page, `📖 Open page ${page}`)}`,
    after: answers ? `<details class="answers"><summary>Finished? Check your answers</summary><div class="answers-body">${renderMarkdown(answers)}</div></details>` : '',
  });
  const save = { title: 'Rate yourself and save your work', time: '5 min', text: 'Tick how confident you feel on the last page, then press <b>🖨 Print / Save as PDF</b> in the workbook to keep a copy. On a shared computer, press <b>Clear my answers</b> when you have saved it.', actions: open(6, '📖 Open the last page') };
  if (s.n === 20) return [
    { title: 'Learn the plan', time: '25 min', text: 'Read pages 1–3 of the workbook: how a real project is planned, and the four project tracks.', actions: open(1, '📖 Open the workbook') },
    { title: 'Fill in your project canvas', time: '20 min', text: 'With your team, complete the project canvas on page 4, including a role for every member.', actions: open(4, '📖 Open page 4') },
    lab,
    { title: 'Set up your project folder', time: '20 min', text: 'Do the Lab Mission on page 5 on a real computer: make your project folder and save your first v0.1 file.', actions: open(5, '📖 Open page 5') },
    check(6, 'Work through the Milestone 1 checklist on page 6 with your team.'),
    save,
  ].filter(Boolean);
  if (s.n === 22) return [
    { title: 'Get ready for Demo Day', time: '20 min', text: 'Read pages 1–3: the 3-act pitch, staying calm on stage, and what to do if something goes wrong.', actions: open(1, '📖 Open the workbook') },
    lab,
    { title: 'Give your pitch', time: '40 min', text: 'Follow the Lab Mission on page 4: present your project in 3 minutes, then answer questions for 1 minute.', actions: open(4, '📖 Open page 4') },
    { title: 'Reflect and graduate', time: '15 min', text: 'Read page 5, take the Digital Leader\'s Oath and fill in your certificate on page 6.', actions: open(5, '📖 Open page 5'), after: answers ? `<details class="answers"><summary>Mentor notes on the reflection questions</summary><div class="answers-body">${renderMarkdown(answers)}</div></details>` : '' },
    save,
  ].filter(Boolean);
  return [
    { title: 'Learn the ideas', time: '35 min', text: 'Read pages 1–4 of the workbook and try every small task. Type your answers straight into the boxes: they save by themselves.', actions: open(1, '📖 Open the workbook') },
    lab,
    { title: 'Do the Lab Mission', time: '25 min', text: `Page 5 is the hands-on task. Do it on a real computer, step by step${s.needs ? `. You need: ${esc(s.needs).replace(/^(A|An|Your|Internet|The) /, (w) => w.toLowerCase())}` : ''}.`, actions: open(5, '📖 Open page 5') },
    check(6, 'Answer the questions on page 6 without looking back, then check your answers below.'),
    save,
  ].filter(Boolean);
}

// A picture of the session's 3D lab, made by `npm run thumbs`, if there is one.
const thumb = (lab, up) => (lab && existsSync(ROOT + `assets/labs/${lab}.jpg`) ? `<img class="card-thumb" src="${up}assets/labs/${lab}.jpg" alt="" width="390" height="300" loading="lazy">` : '');
const card = (s, up) => `<a class="card" href="${up}sessions/${s.id}/" style="--accent:${s.level.color}" data-card="${s.id}">
  ${thumb(labsOf(s)[0], up)}<span class="status"></span>
  <span class="num">Session ${s.n}</span>
  <h4>${esc(s.title)}</h4>
  <p>${esc(s.summary)}</p>
  <span class="tags">${labsOf(s).map((l) => `<span class="tag tag-lab">${LABS[l].icon} ${esc(LABS[l].title)}</span>`).join('')}</span>
</a>`;

const byLevel = course.levels.map((l) => ({ l, items: sessions.filter((s) => s.level.id === l.id) })).filter((g) => g.items.length);
const labCount = Object.keys(LABS).length;
const HOW = `<div class="steps4">
    <div class="step-card"><span class="n">01</span><div class="ico">📖</div><h3>Learn</h3><p>Read the workbook. Plain words, Ghanaian examples and small tasks you type straight into the page.</p></div>
    <div class="step-card"><span class="n">02</span><div class="ico">🧊</div><h3>Explore</h3><p>Play with a 3D model of the idea. Missions tell you what to try next.</p></div>
    <div class="step-card"><span class="n">03</span><div class="ico">🖱️</div><h3>Practise</h3><p>Do the Lab Mission on a real computer, one numbered step at a time.</p></div>
    <div class="step-card"><span class="n">04</span><div class="ico">✅</div><h3>Check</h3><p>Answer the review questions, check your answers, and rate how confident you feel.</p></div>
  </div>`;

write('index.html', layout({
  title: `${course.programme} · ${course.organisation}`,
  description: 'Free session-by-session workbooks, interactive 3D labs and printable study packs from the Bozoma Innovation Hub JHS Tech Club.',
  path: '',
  active: 'home',
  body: `
<section class="hero"><div class="wrap">
  <span class="chip-label"><i>✦</i> ${esc(course.organisation)} · JHS Tech Club</span>
  <h1>Learn it. Build it.<br><em>Show it.</em></h1>
  <p>${sessions.length} sessions that take you from your very first click to your own digital project. Study with your club, or on your own at your own pace.</p>
  <div class="btns">
    <a class="btn btn-primary" href="start/">New here? Start here →</a>
    <a class="btn btn-light" href="sessions/01/">Go to Session 1</a>
  </div>
  <div class="continue" data-continue=""><span>Welcome back! Carry on with <b></b></span><a class="btn btn-light btn-small" href="#">Continue →</a></div>
  <div class="stats">
    <div class="stat"><b>${sessions.length}</b><span>sessions</span></div>
    <div class="stat"><b>${labCount}</b><span>3D labs</span></div>
    <div class="stat"><b>100%</b><span>free · works offline</span></div>
  </div>
</div></section>
<section class="band-white"><div class="wrap">
  <span class="eyebrow">How every session works</span>
  <h2 class="section-title">Four steps, about 90 minutes</h2>
  <p class="section-lead">Every session follows the same path, so you always know what to do next. Each session page ticks off your steps as you go.</p>
  ${HOW}
</div></section>
<section><div class="wrap">
  <span class="eyebrow">The learning journey</span>
  <h2 class="section-title">From switching on to Demo Day</h2>
  <p class="section-lead">Work through the sessions in order: each one builds on the last. <span data-done-count="${sessions.length}"></span></p>
  ${byLevel.map(({ l, items }) => `<div class="level">
    <div class="level-head"><span class="level-dot" style="background:${l.color}"></span><h3>${esc(l.name)}</h3><span>${esc(l.theme)}</span></div>
    <div class="grid">${items.map((s) => card(s, '')).join('')}</div>
  </div>`).join('')}
</div></section>
<section class="band-gold"><div class="wrap">
  <h2 class="section-title">Running the club at your school?</h2>
  <p>Mentor guides with timings and answer keys, printable workbooks, and a kit that runs the whole course from a USB drive with no internet.</p>
  <div class="btns"><a class="btn btn-dark" href="mentors/">For mentors</a>${web('<a class="btn btn-outline" href="downloads/BIH-Tech-Club-All-Sessions.zip" download>⬇ Download all study packs</a>')}</div>
</div></section>`,
}));

write('start/index.html', layout({
  title: `Start here · ${course.programme}`,
  description: 'How to study with the BIH JHS Tech Club on your own or with a club: what you need, how each session works, saving your work and getting help.',
  path: 'start/',
  active: 'start',
  body: `${pageHero({ eyebrow: 'Start here', title: 'How to learn with the Tech Club', lead: 'Everything you need to study on your own or with your club. It takes two minutes to read.' })}
<section><div class="wrap">
  <h2 class="section-title">Before you begin</h2>
  <div class="help-grid">
    <div><b>💻 A computer</b><p>A desktop or laptop is best, because most tasks are about using a real computer. A phone works for reading and the 3D labs.</p></div>
    <div><b>🌐 Internet: helpful, not needed</b><p>Once a page has opened, it keeps working offline on that device. Mentors can also bring the whole course on a USB drive.</p></div>
    <div><b>⏱️ About 90 minutes a session</b><p>You can split a session over two days. Your ticks and answers wait for you.</p></div>
    <div><b>🤝 A mentor or buddy (if you can)</b><p>Self-study works, but it is more fun with someone to show your work to.</p></div>
  </div>
</div></section>
<section class="band-white"><div class="wrap">
  <h2 class="section-title">How to study one session</h2>
  <ol class="start-list">
    <li><b>Open the session page</b><p>Start with <a href="../sessions/01/">Session 1</a> and go in order. The top of each page tells you what you will learn and what you need.</p></li>
    <li><b>Follow the numbered steps</b><p>Each session page has a list of steps: learn, explore, practise, check. The step to do next is outlined in red.</p></li>
    <li><b>Type into the workbook</b><p>The workbook is a 6-page booklet in your browser. Click a box and type: your answers save by themselves on that computer.</p></li>
    <li><b>Play the 3D lab</b><p>Drag to look around, click things, and follow the 🎯 missions. Press 🔊 to hear the instructions read aloud.</p></li>
    <li><b>Check your answers</b><p>When you have answered the last page, open <i>Finished? Check your answers</i> on the session page. Try first, then check!</p></li>
    <li><b>Tick the step, then save a copy</b><p>Tick each step when you finish it. Press <b>Print / Save as PDF</b> in the workbook to keep your work.</p></li>
  </ol>
</div></section>
<section><div class="wrap two">
  <div class="panel">
    <h2>💾 Where is my work saved?</h2>
    <ul class="pack-list">
      <li>Your answers and ticks are saved <b>only in this browser on this computer</b>. Nothing is sent anywhere.</li>
      <li>On another computer you start fresh, so save a PDF if you want to take your work with you.</li>
      <li>On a shared school computer, press <b>Clear my answers</b> in the workbook after saving your PDF.</li>
    </ul>
    <p style="margin:14px 0 0"><button class="btn btn-outline btn-small" type="button" data-reset-progress>Clear my progress ticks on this device</button></p>
  </div>
  <div class="panel">
    <h2>🆘 If you get stuck</h2>
    <ul class="pack-list">
      <li>Read the step again slowly, then look for the <b>Panic Button</b> or <b>Help</b> box in the workbook.</li>
      <li>In a 3D lab, read the 👉 <b>Do this next</b> box and its 💡 hint.</li>
      <li>Ask your mentor, a teacher or a friend. Show them the page you are on.</li>
      <li>Never install anything, delete files you did not make, or share personal details. Ask first.</li>
    </ul>
  </div>
</div></section>
<section class="band-gold"><div class="wrap">
  <h2 class="section-title">Ready? Your first session takes about 90 minutes.</h2>
  <div class="btns"><a class="btn btn-dark" href="../sessions/01/">Start Session 1: ${esc(sessions[0].title)} →</a></div>
</div></section>`,
}));

sessions.forEach((s, i) => {
  const prev = sessions[i - 1];
  const next = sessions[i + 1];
  const up = '../../';
  const steps = stepsFor(s);
  const outcomes = outcomesOf(s.id);
  write(`sessions/${s.id}/index.html`, layout({
    title: `Session ${s.n}: ${s.title} · BIH Tech Club`,
    description: s.summary,
    path: `sessions/${s.id}/`,
    image: `session-${s.id}`,
    head: labsOf(s).length ? IMPORT_MAP(up) : '',
    body: `
<div class="session-hero"><div class="wrap">
  <div class="crumbs"><a href="${up}">All sessions</a> › ${esc(s.level.name)}</div>
  <span class="eyebrow">Session ${s.n} of ${sessions.length}</span>
  <h1>${esc(s.title)}</h1>
  <p>${esc(s.summary)}</p>
  <div class="btns">
    <a class="btn btn-primary" href="#path">Start the steps ↓</a>
    <a class="btn btn-light" href="${up}workbooks/session-${s.id}.html">📖 Open the workbook</a>
  </div>
  <div class="course-bar"><div class="meter" data-course-done="${sessions.length}"><span></span></div><span></span></div>
</div></div>
<section><div class="wrap two">
  <div class="outcomes">
    <h2>By the end, you will be able to:</h2>
    ${outcomes.length ? `<ul>${outcomes.map((o) => `<li>${renderMarkdown(o).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ul>` : `<p>${esc(s.summary)}</p>`}
  </div>
  <div class="outcomes">
    <h2>What you need</h2>
    <div class="need"><span>⏱️ About 90 minutes</span>${s.needs ? `<span>💻 ${esc(s.needs)}</span>` : ''}<span>📖 The workbook (opens in your browser)</span>${labsOf(s).length ? '<span>🧊 The 3D lab on this page</span>' : ''}</div>
    <p class="small-tip" style="margin:14px 0 0">No computer at home? ${s.hasPdf ? `<a href="${up}downloads/pdf/BIH-Tech-Club-Session-${s.id}.pdf" download>Print the PDF</a>` : 'Print the workbook'} and practise on paper.</p>
  </div>
</div></section>
<section class="band-white" id="path"><div class="wrap">
  <span class="eyebrow">Your path · <span data-path-count></span></span>
  <h2 class="section-title">Follow these steps in order</h2>
  <p class="section-lead">Tick each step when you finish it. Your ticks are saved on this device, so you can stop and come back later.</p>
  <ol class="path" data-path="${s.id}" data-title="${esc(s.title)}">
    ${steps.map((st) => `<li${st.labStep ? ` data-lab-step="${st.labStep}"` : ''}><div>
      <h3>${st.title} <small>⏱️ ${st.time}</small></h3>
      <p>${st.text}</p>
      <div class="actions">${st.actions}<label class="mark-done"><input type="checkbox"> I've done this</label></div>
      ${st.after || ''}
    </div></li>`).join('')}
  </ol>
  <div class="path-done"><h3>🎉 Session ${s.n} complete!</h3><p>Brilliant work. ${next ? `Next up: <b>Session ${next.n}: ${esc(next.title)}</b>.` : 'You have finished the whole course!'}</p>${next ? `<a class="btn btn-primary" href="${up}sessions/${next.id}/">Go to Session ${next.n} →</a>` : ''}</div>
</div></section>
${labsOf(s).map((l, k) => `<section${k === 0 ? ' id="lab"' : ''}><div class="wrap">
  <span class="eyebrow">3D lab${labsOf(s).length > 1 ? ` ${k + 1} of ${labsOf(s).length}` : ''}</span>
  <h2 class="section-title">${LABS[l].icon} ${esc(LABS[l].title)}</h2>
  <p class="section-lead">${esc(LABS[l].blurb)} Follow the 🎯 missions on the right: they tell you what to do next.</p>
  ${labBlock(l, up)}
</div></section>`).join('')}${labsOf(s).length ? `<script type="module" src="${up}labs/main.js"></script>` : ''}
<section${labsOf(s).length ? '' : ' class="band-white"'}><div class="wrap">
  <h2 class="section-title">Stuck? Try this</h2>
  <div class="help-grid">
    <div><b>📖 Read it again, slowly</b><p>Most problems are one missed word. Look for the Panic Button or Help box in the workbook.</p></div>
    <div><b>🧊 The 3D lab won't load?</b><p>Refresh the page. On a very old computer it may not show 3D. The workbook still has everything you need.</p></div>
    <div><b>💾 My answers disappeared?</b><p>Answers save on the computer you typed them on. Open the workbook on that same computer and browser.</p></div>
    <div><b>🤝 Still stuck?</b><p>Ask your mentor, a teacher or a friend. Show them the step number you are on.</p></div>
  </div>
  ${web(`<p class="small-tip" style="margin-top:18px">Going somewhere without internet? <a href="${up}downloads/BIH-Tech-Club-Session-${s.id}.zip" download>Download this session's study pack</a> (workbook, PDF and README). Last updated ${fmtDate(s.updated)}.</p>`)}
</div></section>
<section style="padding-top:0"><div class="wrap pager">
  ${prev ? `<a href="${up}sessions/${prev.id}/"><small>← Previous</small>Session ${prev.n}: ${esc(prev.title)}</a>` : '<span></span>'}
  ${next ? `<a class="next" href="${up}sessions/${next.id}/"><small>Next →</small>Session ${next.n}: ${esc(next.title)}</a>` : ''}
</div></section>`,
  }));
});

write('labs/index.html', layout({
  title: '3D Labs · BIH Tech Club',
  description: 'Interactive 3D labs that make computer skills hands-on and fun.',
  path: 'labs/',
  active: 'labs',
  body: `${pageHero({ eyebrow: '3D labs', title: 'Learn by playing', lead: `${labCount} hands-on 3D models you can rotate, click and play with. Each one belongs to a session and has missions that guide you step by step. They work best on a computer with a mouse.` })}
<section><div class="wrap">
  <div class="grid lab-gallery">${Object.entries(LABS).map(([id, lab]) => {
    const used = sessions.filter((s) => labsOf(s).includes(id));
    if (!used.length) return '';
    return `<a class="card" href="../sessions/${used[0].id}/#lab" style="--accent:${used[0].level.color}">
      ${thumb(id, '../')}<span class="num">${used.map((s) => `Session ${s.n}`).join(' · ')}</span>
      <h4>${lab.icon} ${esc(lab.title)}</h4><p>${esc(lab.blurb)}</p></a>`;
  }).join('')}</div>
</div></section>`,
}));

// ---------- Mentor guides ----------
// The guides include answer keys, so they are kept out of search engines and
// linked only from the mentors page, not from the pupils' session pages.
const guides = sessions.filter((s) => existsSync(ROOT + `content/mentor/session-${s.id}.md`));
guides.forEach((s, i) => {
  const prev = guides[i - 1];
  const next = guides[i + 1];
  const up = '../../';
  write(`mentors/${s.id}/index.html`, layout({
    title: `Mentor guide · Session ${s.n}: ${s.title} · BIH Tech Club`,
    description: `How to run Session ${s.n}: timings, preparation, common mistakes and the answer key.`,
    path: `mentors/${s.id}/`,
    image: `session-${s.id}`,
    active: 'mentors',
    noindex: true,
    body: `<div class="session-hero" style="--accent:${s.level.color}"><div class="wrap">
  <div class="crumbs"><a href="${up}mentors/">For mentors</a> › Mentor guide</div>
  <div class="btns no-print">
    <a class="btn btn-primary" href="${up}sessions/${s.id}/">Session ${s.n} page</a>
    <a class="btn btn-outline" href="${up}workbooks/session-${s.id}.html">📖 Pupil workbook</a>
    <button class="btn btn-outline" type="button" onclick="print()">🖨 Print this guide</button>
  </div>
  <div class="meta">Last updated ${fmtDate(lastUpdated(`content/mentor/session-${s.id}.md`))}</div>
</div></div>
<section><div class="wrap"><article class="guide">${renderMarkdown(readFileSync(ROOT + `content/mentor/session-${s.id}.md`, 'utf8'))}</article></div></section>
<section style="padding-top:0" class="no-print"><div class="wrap pager">
  ${prev ? `<a href="${up}mentors/${prev.id}/"><small>← Previous guide</small>Session ${prev.n}: ${esc(prev.title)}</a>` : '<span></span>'}
  ${next ? `<a class="next" href="${up}mentors/${next.id}/"><small>Next guide →</small>Session ${next.n}: ${esc(next.title)}</a>` : ''}
</div></section>`,
  }));
});
const hasGuide = new Set(guides.map((s) => s.id));

write('mentors/index.html', layout({
  title: 'For mentors · BIH Tech Club',
  description: 'Mentor guides, session links and downloads for running the BIH JHS Tech Club.',
  path: 'mentors/',
  active: 'mentors',
  body: `${pageHero({ eyebrow: 'For mentors', title: 'Running the Tech Club', lead: 'Everything you need to run a session: shareable links, a mentor guide for every session with timings and answer keys, printable workbooks and offline options.' })}
<section><div class="wrap">
  <div class="how">
    <div><b>1 · Share the link</b><p>Send <code>/sessions/01/</code>, <code>/sessions/02/</code> and so on. Learners open the workbook from there.</p></div>
    ${web(`<div><b>2 · No internet at the school?</b><p>Two options. <b>Easiest:</b> on each lab PC, while it has internet, open this page and press the button below. The whole course, labs included, then works offline on that PC. <b>Or:</b> copy the <a href="../downloads/BIH-Tech-Club-Offline-Kit.zip" download>Offline Club Kit</a> to a USB drive, unzip it on each PC and open <i>index.html</i>.</p></div>`)}${kitOnly(`<div><b>2 · This is the Offline Club Kit</b><p>Everything here, the 3D labs included, works with no internet. When you next have internet, get the newest kit from <b>${SITE.replace('https://', '')}/mentors/</b>.</p></div>`)}
    <div><b>3 · Paper practice</b><p>Print the PDF for learners without devices at home. Fill-in boxes print as blank lines.</p></div>
    <div><b>3D labs & missions</b><p>Every session has a 3D lab with 🎯 missions: a step-by-step checklist with hints. Project the lab and do mission 1 together, then let pairs continue. 🔊 reads instructions aloud.</p></div>
    <div><b>4 · Answers stay local</b><p>Typed answers are saved only in that browser on that PC. On shared machines, remind learners to print or save as PDF, then press <i>Clear my answers</i>.</p></div>
  </div>
  <h2 class="section-title" style="margin-top:44px" id="downloads">Mentor guides and downloads</h2>
  ${web(`<div class="panel save-all"><button class="btn btn-primary" type="button" data-save-all>💾 Save the whole course on this computer</button><p data-save-status aria-live="polite">About 1 MB to download. Do this once on each lab PC while it has internet.</p></div>`)}
  ${web(`<p class="section-lead"><a href="../downloads/BIH-Tech-Club-All-Sessions.zip" download>All ${sessions.length} study packs (.zip)</a> · <a href="../downloads/BIH-Tech-Club-Offline-Kit.zip" download>Offline Club Kit for USB (.zip, whole site with 3D labs)</a></p>`)}
  <div class="table-wrap"><table class="mini-sheet mentor-table">
    <thead><tr><th>Session</th><th>Mentor guide</th>${web('<th>Study pack</th>')}<th>PDF</th><th>Updated</th></tr></thead>
    <tbody>${sessions.map((s) => `<tr><td>${s.n}. ${esc(s.title)}</td><td>${hasGuide.has(s.id) ? `<a href="${s.id}/">Guide</a>` : '—'}</td>${web(`<td><a href="../downloads/BIH-Tech-Club-Session-${s.id}.zip" download>.zip</a></td>`)}<td>${s.hasPdf ? `<a href="../downloads/pdf/BIH-Tech-Club-Session-${s.id}.pdf" download>.pdf</a>` : '—'}</td><td>${fmtDate(s.updated)}</td></tr>`).join('')}</tbody>
  </table></div>
</div></section>`,
}));

write('404.html', layout({
  title: 'Page not found · BIH Tech Club',
  description: 'This page does not exist.',
  path: '404.html',
  noindex: true,
  body: `${pageHero({ eyebrow: 'Page not found', title: 'We couldn\'t find that page', lead: 'The link may have a typo, or the page has moved. If you are offline, this page was not saved on this device yet.', extra: '<div class="btns"><a class="btn btn-primary" href="/">See all sessions</a><a class="btn btn-light" href="/start/">Start here</a></div>' })}`,
}));

write('version.json', JSON.stringify({ built: VERSION, sessions: sessions.map((s) => ({ n: s.n, title: s.title, updated: s.updated, pdf: s.hasPdf, mentorGuide: hasGuide.has(s.id) })) }, null, 2));

// ---------- Search engines and installable app ----------
const publicPages = ['', 'start/', 'labs/', 'mentors/', ...sessions.map((s) => `sessions/${s.id}/`)];
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicPages.map((p) => `  <url><loc>${SITE}/${p}</loc>${p.startsWith('sessions/') ? `<lastmod>${sessions.find((s) => p.includes(s.id)).updated}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);
write('manifest.webmanifest', JSON.stringify({
  name: course.programme,
  short_name: 'BIH Tech Club',
  description: 'Session workbooks and interactive 3D labs for the BIH JHS Tech Club.',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#3a0ca3',
  icons: [192, 512].map((n) => ({ src: `/assets/icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' })),
}, null, 2));

// Everything except the downloads and preview cards is saved for offline use.
const walk = (dir) => readdirSync(DIST + dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`]));
const siteFiles = walk('');
const ALL = siteFiles
  .filter((f) => !/^(downloads\/[^/]+\.zip|assets\/og\/)/.test(f) && !/\.(json|txt|xml)$|LICENSE$|^sw\.js$/.test(f))
  .map((f) => '/' + f.replace(/(^|\/)index\.html$/, '$1'));
// Saved on the first visit: about 100 KB compressed. PDFs are saved only by "Save the whole course".
const CORE = ALL.filter((u) => /^\/(start\/|sessions\/\d+\/|labs\/|mentors\/|404\.html|site\.(css|js)|fonts\/\w+\.woff2|assets\/(logo|logo-white|icon-192)\.png)?$/.test(u));
const SW_ALL = ALL.filter((u) => !u.startsWith('/downloads/pdf/'));
write('sw.js', readFileSync(ROOT + 'src/sw.js', 'utf8').replace('__VERSION__', VERSION).replace('__CORE__', JSON.stringify(CORE)).replace('__ALL__', JSON.stringify(SW_ALL)));

// ---------- Offline Club Kit (USB) ----------
// The whole site as plain files that open from a USB drive or the PC's disk
// with no internet and no web server. Browsers block ES modules on file://,
// so the labs are bundled into one classic script.
const labsBundle = await esbuild({ entryPoints: [ROOT + 'src/labs/main.js'], bundle: true, format: 'iife', minify: true, write: false, logLevel: 'error' });
const KIT = 'BIH-Tech-Club-Offline-Kit/';
const kit = { [`${KIT}labs/labs.bundle.js`]: labsBundle.outputFiles[0].contents };
for (const f of siteFiles) {
  if (/^(downloads\/[^/]+\.zip|assets\/og\/|labs\/[^/]+\.js$|vendor\/three@[^/]+\/(three|addons))/.test(f) || /^(sw\.js|manifest\.webmanifest|robots\.txt|sitemap\.xml|version\.json|404\.html)$/.test(f)) continue;
  let data = readFileSync(DIST + f);
  if (f.endsWith('.html')) data = strToU8(kitPage(data.toString('utf8')));
  // Browsers refuse to load font files from file://, so the kit's stylesheet carries them inside.
  if (f === 'site.css') data = strToU8(data.toString('utf8').replace(/url\(fonts\/(\w+)\.woff2\)/g, (m, name) => `url(data:font/woff2;base64,${readFileSync(ROOT + FONTS[name]).toString('base64')})`));
  if (f.startsWith('fonts/')) continue;
  kit[KIT + f] = data;
}
kit[`${KIT}README.txt`] = strToU8(`BIH JHS TECH CLUB · OFFLINE CLUB KIT
Built ${fmtDate(VERSION.slice(0, 10))}

The whole club website (all ${sessions.length} sessions, workbooks, PDFs, mentor guides
and every 3D lab) on one USB drive. No internet needed.

1. Copy this folder to the PC (or leave it on the USB drive).
2. Open index.html in Chrome, Edge or Firefox.
3. Typed workbook answers are saved in that browser on that PC.
   On shared PCs, print or save as PDF, then press "Clear my answers".

Get the newest kit from ${SITE}/mentors/
`);
write('downloads/BIH-Tech-Club-Offline-Kit.zip', zipSync(kit, { level: 9 }));

function kitPage(html) {
  return html
    .replace(/<script type="importmap">[\s\S]*?<\/script>\n?/, '')
    .replace(/<script type="module" src="([^"]*)labs\/main\.js"><\/script>/, '<script src="$1labs/labs.bundle.js"></script>')
    .replace(/<link rel="(manifest|canonical|preload)"[^>]*>\n?/g, '')
    .replace(/<!--web-->[\s\S]*?<!--\/web-->/g, '')
    .replace(/<!--kit([\s\S]*?)kit-->/g, '$1')
    // file:// shows a folder listing for "sessions/01/", so name the file.
    .replace(/href="((?:\.\.\/)*(?:[\w-]+\/)*)"/g, 'href="$1index.html"')
    .replace(/href="((?:\.\.\/)+(?:[\w-]+\/)*|(?:[\w-]+\/)+)(#[\w-]+)"/g, 'href="$1index.html$2"')
    .replace(/href="\/(labs\/)?"/g, (m, sub) => `href="${sub || ''}index.html"`);
}

console.log(`Built ${sessions.length} sessions, ${guides.length} mentor guides, ${labCount} labs → dist/`);
if (warnings.length) console.warn('Warnings:\n  ' + warnings.join('\n  '));
