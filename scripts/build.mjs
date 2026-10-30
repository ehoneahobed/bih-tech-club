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
const DIST = ROOT + 'dist/';
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
function layout({ title, description, body, path, active, image = 'site', noindex = false, head = '' }) {
  const depth = (path.match(/\//g) || []).length;
  // The 404 page is served at whatever address was asked for, so it links from the site root.
  const up = path === '404.html' ? '/' : '../'.repeat(depth);
  const url = `${SITE}/${path.replace(/index\.html$/, '')}`;
  const nav = [['', 'Sessions', 'home'], ['labs/', '3D Labs', 'labs'], ['mentors/', 'For mentors', 'mentors']]
    .map(([href, text, key]) => `<a href="${up}${href}"${active === key ? ' aria-current="page"' : ''}>${text}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(course.programme)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og/${image}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#3a0ca3">
<link rel="canonical" href="${url}">
<link rel="icon" href="${up}assets/icon-192.png">
<link rel="apple-touch-icon" href="${up}assets/icon-180.png">
<link rel="manifest" href="${up}manifest.webmanifest">
<link rel="stylesheet" href="${up}site.css">
${head}
</head>
<body>
<header class="site-head"><div class="wrap">
  <a class="brand" href="${up}"><img src="${up}assets/logo.png" alt="Bozoma Innovation Hub Tech Club logo" width="128" height="40"></a>
  <nav class="nav" aria-label="Main">${nav}</nav>
</div></header>
<main>${body}</main>
<footer><div class="wrap">
  <span>© ${new Date().getFullYear()} ${esc(course.organisation)} · ${esc(course.programme)}</span>
  <span>Built ${fmtDate(new Date().toISOString().slice(0, 10))}<span class="offline-ready" hidden> · ✓ Pages you open keep working offline on this device</span></span>
</div></footer>
${SW_REGISTER}
</body>
</html>`;
}

// Only on the website: the USB kit runs from file://, where service workers don't exist.
const SW_REGISTER = `<script data-site-only>
if ('serviceWorker' in navigator && /^https:$|^http:$/.test(location.protocol)) {
  navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready)
    .then(() => document.querySelectorAll('.offline-ready').forEach((el) => { el.hidden = false; }))
    .catch(() => {});
  // Mentors page: "Save the whole course on this computer".
  const btn = document.querySelector('[data-save-all]');
  const out = document.querySelector('[data-save-status]');
  if (btn && out) {
    try { const at = localStorage.getItem('bih-whole-course'); if (at) out.textContent = '✓ Whole course saved on this computer on ' + at + '.'; } catch (e) {}
    btn.addEventListener('click', () => {
      btn.disabled = true;
      out.textContent = 'Starting…';
      navigator.serviceWorker.ready.then((reg) => reg.active.postMessage('save-all'));
    });
    navigator.serviceWorker.addEventListener('message', (e) => {
      const m = e.data || {};
      if (m.type === 'save-progress') out.textContent = 'Saving… ' + m.done + ' of ' + m.total + ' files';
      if (m.type === 'save-done') {
        btn.disabled = false;
        if (m.failed) out.textContent = '⚠️ ' + m.failed + ' of ' + m.total + ' files did not download. Check the internet and press the button again.';
        else {
          const at = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          out.textContent = '✓ Whole course saved on this computer on ' + at + '. It now works with no internet.';
          try { localStorage.setItem('bih-whole-course', at); } catch (e) {}
        }
      }
    });
  }
}
</script>`;

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
const three = ROOT + 'node_modules/three/';
for (const f of ['three.module.min.js', 'three.core.min.js']) cpSync(three + 'build/' + f, DIST + THREE_DIR + f);
cpSync(three + 'examples/jsm/controls/OrbitControls.js', DIST + THREE_DIR + 'addons/controls/OrbitControls.js');
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
const card = (s, up) => `<a class="card" href="${up}sessions/${s.id}/" style="--accent:${s.level.color}">
  <span class="num">Session ${s.n}</span>
  <h4>${esc(s.title)}</h4>
  <p>${esc(s.summary)}</p>
  <span class="tags">${labsOf(s).map((l) => `<span class="tag tag-lab">${LABS[l].icon} ${esc(LABS[l].title)}</span>`).join('')}<span class="tag">Workbook</span>${s.hasPdf ? '<span class="tag">PDF</span>' : ''}</span>
</a>`;

const byLevel = course.levels.map((l) => ({ l, items: sessions.filter((s) => s.level.id === l.id) })).filter((g) => g.items.length);
const labCount = Object.keys(LABS).length;

write('index.html', layout({
  title: `${course.programme} · Study Packs`,
  description: 'Session-by-session study packs, interactive 3D labs and printable workbooks for the Bozoma Innovation Hub JHS Tech Club.',
  path: '',
  active: 'home',
  body: `
<section class="hero"><div class="wrap">
  <h1>Learn it. Build it.<br>Show it.</h1>
  <p>Every ${esc(course.programme)} session in one place: open the interactive workbook, explore the 3D lab, or download the study pack to use offline or print.</p>
  <div class="btns">
    <a class="btn btn-primary" href="sessions/01/">Start at Session 1</a>
    ${web(`<a class="btn btn-light" href="downloads/BIH-Tech-Club-All-Sessions.zip" download>⬇ Download all ${sessions.length} packs</a>`)}
  </div>
  <div class="stats">
    <div class="stat"><b>${sessions.length}</b><span>sessions</span></div>
    <div class="stat"><b>${byLevel.length}</b><span>levels</span></div>
    <div class="stat"><b>${labCount}</b><span>3D labs</span></div>
  </div>
</div></section>
<section><div class="wrap">
  <h2 class="section-title">The learning journey</h2>
  <p class="section-lead">From switching on a computer for the first time to pitching a capstone project on Demo Day.</p>
  ${byLevel.map(({ l, items }) => `<div class="level">
    <div class="level-head"><span class="level-dot" style="background:${l.color}"></span><h3>${esc(l.name)}</h3><span>${esc(l.theme)}</span></div>
    <div class="grid">${items.map((s) => card(s, '')).join('')}</div>
  </div>`).join('')}
</div></section>`,
}));

sessions.forEach((s, i) => {
  const prev = sessions[i - 1];
  const next = sessions[i + 1];
  const up = '../../';
  write(`sessions/${s.id}/index.html`, layout({
    title: `Session ${s.n}: ${s.title} · BIH Tech Club`,
    description: s.summary,
    path: `sessions/${s.id}/`,
    image: `session-${s.id}`,
    head: labsOf(s).length ? IMPORT_MAP(up) : '',
    body: `
<div class="session-hero" style="--accent:${s.level.color}"><div class="wrap">
  <div class="crumbs"><a href="${up}">All sessions</a> › ${esc(s.level.name)}</div>
  <h1>Session ${s.n}: ${esc(s.title)}</h1>
  <p>${esc(s.summary)}</p>
  <div class="btns">
    <a class="btn btn-primary" href="${up}workbooks/session-${s.id}.html">📖 Open the workbook</a>
    ${web(`<a class="btn btn-outline" href="${up}downloads/BIH-Tech-Club-Session-${s.id}.zip" download>⬇ Download study pack (.zip)</a>`)}
    ${s.hasPdf ? `<a class="btn btn-outline" href="${up}downloads/pdf/BIH-Tech-Club-Session-${s.id}.pdf" download>⬇ PDF to print</a>` : ''}
  </div>
  <div class="meta">Last updated ${fmtDate(s.updated)}</div>
</div></div>
${labsOf(s).map((l) => `<section><div class="wrap">
  <h2 class="section-title">${LABS[l].icon} 3D lab: ${esc(LABS[l].title)}</h2>
  <p class="section-lead">${esc(LABS[l].blurb)} Follow the 🎯 missions: they tell you what to do next.</p>
  ${labBlock(l, up)}
</div></section>`).join('')}${labsOf(s).length ? `<script type="module" src="${up}labs/main.js"></script>` : ''}
<section><div class="wrap two">
  <div class="panel">
    <h2>How to use this session</h2>
    <ol class="pack-list">
      <li><b>In the lab:</b> open the workbook and type answers straight into the boxes. They are saved on that computer automatically.</li>
      ${labsOf(s).length ? '<li><b>Explore:</b> try the 3D lab above and complete its 🎯 missions. Press 🔊 to have the instructions read aloud.</li>' : ''}
      <li><b>No internet or device at home?</b> ${web('Download the pack or print')}${kitOnly('Print')} the PDF and practise on paper.</li>
    </ol>
  </div>
  ${web(`<div class="panel">
    <h2>In the study pack</h2>
    <ul class="pack-list">
      <li>Interactive workbook that works offline (HTML)</li>
      ${s.hasPdf ? '<li>Printable workbook (PDF, A4)</li>' : ''}
      <li>A README with safety reminders</li>
    </ul>
  </div>`)}
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
  body: `<section><div class="wrap">
  <h1 class="section-title">3D Labs</h1>
  <p class="section-lead">Hands-on 3D models you can rotate, click and play with. Each one belongs to a session. They run in the browser and work best on a computer with a mouse.</p>
  <div class="grid lab-gallery">${Object.entries(LABS).map(([id, lab]) => {
    const used = sessions.filter((s) => labsOf(s).includes(id));
    if (!used.length) return '';
    return `<a class="card" href="../sessions/${used[0].id}/" style="--accent:${used[0].level.color}">
      <span class="num">${used.map((s) => `Session ${s.n}`).join(' · ')}</span>
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
  body: `<section><div class="wrap">
  <h1 class="section-title">For mentors</h1>
  <p class="section-lead">Each session has its own page with a short link you can share with learners on WhatsApp or the projector. Each one also has a mentor guide with timings, preparation, common mistakes and the answer key.</p>
  <div class="how">
    <div><b>1 · Share the link</b><p>Send <code>/sessions/01/</code>, <code>/sessions/02/</code> and so on. Learners open the workbook from there.</p></div>
    ${web(`<div><b>2 · No internet at the school?</b><p>Two options. <b>Easiest:</b> on each lab PC, while it has internet, open this page and press the button below. The whole course, labs included, then works offline on that PC. <b>Or:</b> copy the <a href="../downloads/BIH-Tech-Club-Offline-Kit.zip" download>Offline Club Kit</a> to a USB drive, unzip it on each PC and open <i>index.html</i>.</p></div>`)}${kitOnly(`<div><b>2 · This is the Offline Club Kit</b><p>Everything here, the 3D labs included, works with no internet. When you next have internet, get the newest kit from <b>${SITE.replace('https://', '')}/mentors/</b>.</p></div>`)}
    <div><b>3 · Paper practice</b><p>Print the PDF for learners without devices at home. Fill-in boxes print as blank lines.</p></div>
    <div><b>3D labs & missions</b><p>Every session has a 3D lab with 🎯 missions: a step-by-step checklist with hints. Project the lab and do mission 1 together, then let pairs continue. 🔊 reads instructions aloud.</p></div>
    <div><b>4 · Answers stay local</b><p>Typed answers are saved only in that browser on that PC. On shared machines, remind learners to print or save as PDF, then press <i>Clear my answers</i>.</p></div>
  </div>
  <h2 class="section-title" style="margin-top:36px">Mentor guides and downloads</h2>
  ${web(`<div class="panel save-all"><button class="btn btn-primary" type="button" data-save-all>💾 Save the whole course on this computer</button><p data-save-status aria-live="polite">About 1 MB to download. Do this once on each lab PC while it has internet.</p></div>`)}
  ${web(`<p class="section-lead"><a href="../downloads/BIH-Tech-Club-All-Sessions.zip" download>All ${sessions.length} study packs (.zip)</a> · <a href="../downloads/BIH-Tech-Club-Offline-Kit.zip" download>Offline Club Kit for USB (.zip, whole site with 3D labs)</a></p>`)}
  <div class="table-wrap"><table class="mini-sheet" style="max-width:860px;background:#fff">
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
  body: `<section><div class="wrap" style="text-align:center;padding:40px 16px">
  <h1 class="section-title">We couldn't find that page</h1>
  <p class="section-lead" style="margin:8px auto 24px">The link may have a typo, or the page has moved. If you are offline, this page wasn't saved on this device yet.</p>
  <div class="btns" style="justify-content:center"><a class="btn btn-primary" href="/">See all sessions</a><a class="btn btn-outline" href="/labs/">3D labs</a></div>
</div></section>`,
}));

write('version.json', JSON.stringify({ built: VERSION, sessions: sessions.map((s) => ({ n: s.n, title: s.title, updated: s.updated, pdf: s.hasPdf, mentorGuide: hasGuide.has(s.id) })) }, null, 2));

// ---------- Search engines and installable app ----------
const publicPages = ['', 'labs/', 'mentors/', ...sessions.map((s) => `sessions/${s.id}/`)];
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
const CORE = ALL.filter((u) => /^\/(sessions\/\d+\/|labs\/|mentors\/|404\.html|site\.css|assets\/(logo|icon-192)\.png)?$/.test(u));
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
    .replace(/<script data-site-only>[\s\S]*?<\/script>\n?/, '')
    .replace(/<script type="importmap">[\s\S]*?<\/script>\n?/, '')
    .replace(/<script type="module" src="([^"]*)labs\/main\.js"><\/script>/, '<script src="$1labs/labs.bundle.js"></script>')
    .replace(/<link rel="(manifest|canonical)"[^>]*>\n?/g, '')
    .replace(/<!--web-->[\s\S]*?<!--\/web-->/g, '')
    .replace(/<!--kit([\s\S]*?)kit-->/g, '$1')
    // file:// shows a folder listing for "sessions/01/", so name the file.
    .replace(/href="((?:\.\.\/)*(?:[\w-]+\/)*)"/g, 'href="$1index.html"')
    .replace(/href="\/(labs\/)?"/g, (m, sub) => `href="${sub || ''}index.html"`);
}

console.log(`Built ${sessions.length} sessions, ${guides.length} mentor guides, ${labCount} labs → dist/`);
if (warnings.length) console.warn('Warnings:\n  ' + warnings.join('\n  '));
