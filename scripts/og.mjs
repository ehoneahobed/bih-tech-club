// Makes the link-preview cards (WhatsApp, Facebook, X) and the app icons in assets/.
// Run locally after changing a session title:  npm run og
// The images are committed, so Vercel never needs a browser.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
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

// Brand fonts, embedded so the cards render the same on any computer.
const font = (file) => 'data:font/woff2;base64,' + readFileSync(ROOT + file).toString('base64');
const FONT_CSS = `@font-face { font-family: Outfit; font-weight: 100 900; src: url(${font('node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2')}); }
  @font-face { font-family: Rubik; font-weight: 300 900; src: url(${font('node_modules/@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2')}); }`;

// Cards in the Bozoma Innovation Hub style: plum, white logo, gold label, soft glows.
const card = ({ kicker, title, sub, white }) => `<!doctype html><html><head><style>
  ${FONT_CSS}
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: #24182e; color: #fff; font-family: Rubik, sans-serif; position: relative; overflow: hidden; }
  .glow { position: absolute; width: 520px; height: 520px; border-radius: 50%; filter: blur(130px); opacity: 0.35; }
  .g1 { background: #ffbe00; left: -120px; top: -200px; } .g2 { background: #ca1f3f; right: -140px; bottom: -260px; }
  .main { position: absolute; inset: 0; padding: 64px 80px; display: flex; flex-direction: column; }
  img { height: 78px; width: auto; align-self: flex-start; }
  .kicker { margin-top: auto; display: inline-block; align-self: flex-start; font-size: 24px; font-weight: 700; color: #ffbe00; letter-spacing: 4px; text-transform: uppercase; }
  h1 { font-family: Outfit, sans-serif; font-weight: 500; font-size: ${title.length > 34 ? 70 : 84}px; line-height: 1.04; margin: 14px 0 22px; letter-spacing: -1px; }
  h1 em { color: #ffbe00; font-style: normal; }
  p { font-size: 28px; color: rgba(255,255,255,0.75); font-weight: 300; }
  .bar { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; background: linear-gradient(90deg, #ca1f3f 0 70%, #ffbe00 70%); }
</style></head><body><div class="glow g1"></div><div class="glow g2"></div><div class="bar"></div><div class="main">
  <img src="${white}"><div class="kicker">${esc(kicker)}</div><h1>${title}</h1><p>${esc(sub)}</p>
</div></body></html>`;

async function shot(html, file) {
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: ROOT + file, type: 'jpeg', quality: 88 });
}

// Logo versions without the white background, cropped to the artwork:
// colour (for white pages), all-white (for the plum header and footer) and the mark alone.
// Each pixel is "un-blended" from white, so the soft edges stay smooth.
await page.setViewportSize({ width: 800, height: 400 });
await page.setContent(`<img id="logo" src="${logo}">`);
const outs = await page.evaluate(async () => {
  const img = document.getElementById('logo');
  await img.decode();
  const crop = (x, y, w, h, white) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(img, x, y, w, h, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h);
    const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const a = 1 - Math.min(p[i], p[i + 1], p[i + 2]) / 255;
      if (a < 0.02) { p[i + 3] = 0; continue; }
      for (let k = 0; k < 3; k++) p[i + k] = white ? 255 : Math.round((p[i + k] - 255 * (1 - a)) / a);
      // The plum text is not quite black, so boost the white version to full strength.
      p[i + 3] = Math.round(Math.min(1, white ? a * 1.18 : a) * 255);
    }
    g.putImageData(d, 0, 0);
    return c.toDataURL('image/png');
  };
  return { color: crop(232, 140, 1112, 222, false), white: crop(232, 140, 1112, 222, true), mark: crop(241, 142, 215, 215, false) };
});
for (const [name, url] of Object.entries(outs)) writeFileSync(ROOT + `assets/logo-${name}.png`, Buffer.from(url.split(',')[1], 'base64'));

await page.setViewportSize({ width: 1200, height: 630 });
const white = 'data:image/png;base64,' + readFileSync(ROOT + 'assets/logo-white.png').toString('base64');
await shot(card({ kicker: 'Bozoma Innovation Hub · JHS Tech Club', title: 'Learn it. Build it. <em>Show it.</em>', sub: `${course.sessions.length} free sessions · workbooks · 3D labs · works offline`, white }), 'assets/og/site.jpg');
for (const s of course.sessions) {
  const id = String(s.n).padStart(2, '0');
  const l = levels[s.level];
  await shot(card({ kicker: `Session ${s.n} · ${l.name.replace(/^Level \d+ · /, '')}`, title: esc(s.title), sub: 'BIH JHS Tech Club · workbook · 3D lab · study pack', white }), `assets/og/session-${id}.jpg`);
}

// Square icons: the logo's mark (x 241–456, y 142–357 in logo.png) centred on white.
for (const size of [180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;width:${size}px;height:${size}px;background:#fff;overflow:hidden">
    <div style="margin:${size * 0.1}px;width:${size * 0.8}px;height:${size * 0.8}px;background:url(${logo}) no-repeat;background-size:${(1600 / 215) * size * 0.8}px auto;background-position:${-(241 / 215) * size * 0.8}px ${-(142 / 215) * size * 0.8}px"></div></body>`);
  await page.screenshot({ path: ROOT + `assets/icon-${size}.png` });
}
await browser.close();
console.log(`Made ${course.sessions.length + 1} preview cards, 3 icons and 3 logo versions in assets/`);
