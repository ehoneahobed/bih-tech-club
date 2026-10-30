// Makes the link-preview cards (WhatsApp, Facebook, X) and the app icons in assets/.
// Run locally after changing a session title:  npm run og
// The images are committed, so Vercel never needs a browser.
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { findBrowser } from './lib/browser.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const course = JSON.parse(readFileSync(ROOT + 'content/sessions.json', 'utf8'));
const levels = Object.fromEntries(course.levels.map((l) => [l.id, l]));
const logo = 'data:image/png;base64,' + readFileSync(ROOT + 'assets/logo.png').toString('base64');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const executablePath = findBrowser();
if (!executablePath) {
  console.error('No Chrome/Chromium found. Install Google Chrome or set CHROME_PATH.');
  process.exit(1);
}
mkdirSync(ROOT + 'assets/og', { recursive: true });
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

const card = ({ kicker, title, sub, color }) => `<!doctype html><html><head><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; display: flex; }
  .bar { width: 28px; background: ${color}; position: relative; z-index: 1; }
  .main { flex: 1; padding: 56px 72px; display: flex; flex-direction: column; }
  img { height: 210px; width: auto; align-self: flex-start; margin: -60px 0 -40px -90px; }
  .kicker { margin-top: auto; font-size: 34px; font-weight: 700; color: ${color}; letter-spacing: 1px; text-transform: uppercase; }
  h1 { font-size: ${title.length > 34 ? 66 : 80}px; line-height: 1.05; color: #1e1e24; margin: 10px 0 22px; letter-spacing: -1px; }
  p { font-size: 30px; color: #5c6070; }
</style></head><body><div class="bar"></div><div class="main">
  <img src="${logo}"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p>
</div></body></html>`;

async function shot(html, file) {
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: ROOT + file, type: 'jpeg', quality: 88 });
}

await shot(card({ kicker: course.programme, title: 'Learn it. Build it. Show it.', sub: `${course.sessions.length} sessions · workbooks · 3D labs · offline packs`, color: '#3a0ca3' }), 'assets/og/site.jpg');
for (const s of course.sessions) {
  const id = String(s.n).padStart(2, '0');
  const l = levels[s.level];
  await shot(card({ kicker: `Session ${s.n} · ${l.name.replace(/^Level \d+ · /, '')}`, title: s.title, sub: 'Workbook · 3D lab · study pack', color: l.color }), `assets/og/session-${id}.jpg`);
}

// Square icons: the logo's mark (x 241–456, y 142–357 in logo.png) centred on white.
for (const size of [180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;width:${size}px;height:${size}px;background:#fff;overflow:hidden">
    <div style="margin:${size * 0.1}px;width:${size * 0.8}px;height:${size * 0.8}px;background:url(${logo}) no-repeat;background-size:${(1600 / 215) * size * 0.8}px auto;background-position:${-(241 / 215) * size * 0.8}px ${-(142 / 215) * size * 0.8}px"></div></body>`);
  await page.screenshot({ path: ROOT + `assets/icon-${size}.png` });
}
await browser.close();
console.log(`Made ${course.sessions.length + 1} preview cards and 3 icons in assets/`);
