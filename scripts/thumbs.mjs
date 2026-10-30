// Takes a picture of every 3D lab for the session cards and the labs gallery
// (assets/labs/<lab>.jpg). Run locally after changing a lab:  npm run thumbs
// It builds the site to a temporary folder, opens each lab and photographs the
// model alone (no side panel, labels or toolbar). The pictures are committed.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium } from 'playwright-core';
import { findBrowser } from './lib/browser.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const course = JSON.parse(readFileSync(ROOT + 'content/sessions.json', 'utf8'));
const out = mkdtempSync(join(tmpdir(), 'bih-thumbs-'));
execFileSync(process.execPath, [ROOT + 'scripts/build.mjs'], { env: { ...process.env, DIST_DIR: out }, stdio: 'ignore' });

// A tiny static server for the temporary build.
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', jpg: 'image/jpeg', woff2: 'font/woff2', json: 'application/json' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = join(out, p);
  if (!existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[p.split('.').pop()] || 'application/octet-stream' }).end(readFileSync(file));
}).listen(0);
const base = `http://localhost:${server.address().port}`;

// A real GPU makes the pictures sharper and faster; fall back to any Chromium.
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = existsSync(chrome)
  ? await chromium.launch({ executablePath: chrome, headless: true, args: ['--headless=new', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
  : await chromium.launch({ executablePath: findBrowser(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
mkdirSync(ROOT + 'assets/labs', { recursive: true });

const done = new Set();
for (const s of course.sessions) {
  for (const lab of [].concat(s.lab || [])) {
    if (done.has(lab)) continue;
    done.add(lab);
    await page.goto(`${base}/sessions/${String(s.n).padStart(2, '0')}/`);
    const canvas = page.locator(`.lab[data-lab="${lab}"] .lab-canvas`);
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000);
    await page.addStyleTag({ content: '.lab-callouts, .lab-viewbar, .lab-hint, .lab-status { display: none !important; }' });
    await page.waitForTimeout(300);
    await canvas.screenshot({ path: ROOT + `assets/labs/${lab}.jpg`, type: 'jpeg', quality: 82 });
    console.log(`thumb  ${lab}`);
  }
}
await browser.close();
server.close();
rmSync(out, { recursive: true, force: true });
console.log(`Made ${done.size} lab pictures in assets/labs/`);
