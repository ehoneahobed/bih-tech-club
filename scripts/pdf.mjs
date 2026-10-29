// Renders each workbook to an A4 PDF in packs/pdf/ using headless Chromium.
// Run locally after editing a workbook:  npm run pdf  (or: npm run pdf -- 3 7)
// The PDFs are committed, so Vercel only copies them and never needs a browser.
import { readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { transformWorkbook } from './lib/workbook.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const course = JSON.parse(readFileSync(ROOT + 'content/sessions.json', 'utf8'));
const only = process.argv.slice(2).map(Number).filter(Boolean);

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  for (const dir of [`${homedir()}/Library/Caches/ms-playwright`, `${homedir()}/.cache/ms-playwright`]) {
    if (!existsSync(dir)) continue;
    for (const d of readdirSync(dir).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse())
      for (const sub of readdirSync(`${dir}/${d}`)) candidates.unshift(`${dir}/${d}/${sub}/chrome-headless-shell`);
  }
  return candidates.find(existsSync);
}

const executablePath = findBrowser();
if (!executablePath) {
  console.error('No Chrome/Chromium found. Install Google Chrome or set CHROME_PATH.');
  process.exit(1);
}
mkdirSync(ROOT + 'packs/pdf', { recursive: true });
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();
await page.emulateMedia({ media: 'print' });

// Each workbook .page should fill exactly one A4 sheet. Shrink (and let the text
// reflow wider) until the tallest page fits. 718 × 1039 px is A4 inside the margins.
const PRINT_W = 718;
const PRINT_H = 1030;
async function fitScale() {
  for (let scale = 1; scale > 0.7; scale -= 0.02) {
    await page.setViewportSize({ width: Math.round(PRINT_W / scale), height: 1000 });
    const tallest = await page.$$eval('.page', (els) => Math.max(...els.map((e) => e.getBoundingClientRect().height)));
    if (tallest * scale <= PRINT_H) return Number(scale.toFixed(2));
  }
  return 0.7;
}
for (const s of course.sessions) {
  if (only.length && !only.includes(s.n)) continue;
  const id = String(s.n).padStart(2, '0');
  const html = transformWorkbook(readFileSync(ROOT + `content/workbooks/session-${id}.html`, 'utf8'), { n: s.n, offline: true });
  await page.setContent(html, { waitUntil: 'load' });
  const scale = await fitScale();
  await page.pdf({
    scale,
    path: ROOT + `packs/pdf/session-${id}.pdf`,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '12mm', left: '10mm', right: '10mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#888">BIH JHS Tech Club · Session ${s.n} · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  });
  console.log(`PDF  session ${id}  scale ${scale}  ${s.title}`);
}
await browser.close();
