// Renders each workbook to an A4 PDF in packs/pdf/ using headless Chromium.
// Run locally after editing a workbook:  npm run pdf  (or: npm run pdf -- 3 7)
// The PDFs are committed, so Vercel only copies them and never needs a browser.
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { transformWorkbook } from './lib/workbook.mjs';
import { findBrowser } from './lib/browser.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const course = JSON.parse(readFileSync(ROOT + 'content/sessions.json', 'utf8'));
const only = process.argv.slice(2).map(Number).filter(Boolean);

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
    footerTemplate: `<div style="font:8px Helvetica,Arial,sans-serif;width:100%;text-align:center;color:#6B6373">Bozoma Innovation Hub · BIH JHS Tech Club · Session ${s.n} · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  });
  console.log(`PDF  session ${id}  scale ${scale}  ${s.title}`);
}
await browser.close();
