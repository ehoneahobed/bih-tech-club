// Turns an authored session workbook into the published version:
// - Bozoma Innovation Hub branding: brand colours, Outfit/Rubik fonts, the logo
//   lockup on page 1 and the mark on every page header;
// - sample text in fill-in boxes becomes a faint hint (blank when printed);
// - each page gets an anchor (#page-1 … #page-6) so session steps can open it;
// - a toolbar with page jumps, print and clear, plus the autosave script.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = readFileSync(ROOT + 'src/workbook.js', 'utf8');
const data = (file, type) => `data:${type};base64,` + readFileSync(ROOT + file).toString('base64');
// Embedded so the offline packs and PDFs look the same as the website.
const FONTS = `@font-face { font-family: "Outfit"; font-weight: 100 900; font-display: swap; src: url(${data('node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2', 'font/woff2')}) format("woff2"); }
  @font-face { font-family: "Rubik"; font-weight: 300 900; font-display: swap; src: url(${data('node_modules/@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2', 'font/woff2')}) format("woff2"); }`;
const MARK = data('assets/logo-mark.png', 'image/png');

// The authored workbooks use an older purple/orange palette. These are swapped
// for the BIH colours. Colours that draw real software (Excel green, Word blue,
// Scratch blocks) and the green/red "right/wrong" colours are left alone.
const PALETTE = {
  '3A0CA3': '24182E', // purple → BIH plum
  '1E1E24': '24182E', // near-black → plum
  'F77F00': 'CA1F3F', // orange badges and accents → BIH red
  'E63946': 'CA1F3F', // red → BIH red
  '4361EE': '5A4470', // blue accent → soft plum
  '2EC4B6': '1F8A70', // teal → readable green
  'E0E7FF': 'F4F0F6', // pale blue tints → pale plum
  'EEF2FF': 'F4F0F6',
  'FFF7ED': 'FFF7DB', // pale orange → pale gold
  'C2410C': '8A5C00', // orange text → BIH gold text
};
const rebrand = (html) => html.replace(/#([0-9a-f]{6})\b/gi, (m, hex) => (PALETTE[hex.toUpperCase()] ? '#' + PALETTE[hex.toUpperCase()] : m));

const STYLE = `
<style id="bih-enhance">
  ${FONTS}
  body { font-family: "Rubik", "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; background-color: #F9F9F9 !important; }
  h1, h2, h3, .header-title, .badge { font-family: "Outfit", "Rubik", "Segoe UI", Arial, sans-serif !important; }
  h1, h2, h3 { font-weight: 600 !important; letter-spacing: -0.01em; }
  .header-title { display: flex; align-items: center; gap: 10px; letter-spacing: 0.04em !important; }
  .header-title::before { content: ""; width: 26px; height: 26px; flex: none; background: url(${MARK}) center / contain no-repeat; }
  .header-bar { border-bottom-color: #CA1F3F !important; }
  .page { scroll-margin-top: 70px; }
  .wb-lockup { display: flex; flex-direction: column; line-height: 1.05; }
  .wb-lockup b { font-weight: 800; font-size: 21px; color: #24182E; letter-spacing: 0.06em; }
  .wb-lockup small { font-family: "Rubik", sans-serif; font-weight: 500; font-size: 10.5px; color: #CA1F3F; letter-spacing: 0.22em; }
  .header-title:has(.wb-lockup)::before { width: 38px; height: 38px; }
  [contenteditable="true"][data-placeholder]:empty::before { content: attr(data-placeholder); color: #A39AAB; font-style: italic; font-weight: 400; }
  [contenteditable="true"]:focus { background: #FFF7DB; }
  .wb-bar { position: sticky; top: 0; z-index: 50; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; padding: 10px 12px; margin: -20px -20px 0; background: #24182E; font-family: "Rubik", -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wb-bar a, .wb-bar button { font: 500 13.5px/1 inherit; font-family: inherit; color: #fff; background: rgba(255,255,255,0.1); border: 0; border-radius: 999px; padding: 9px 14px; cursor: pointer; text-decoration: none; }
  .wb-bar a:hover, .wb-bar button:hover { background: rgba(255,255,255,0.22); }
  .wb-bar .wb-primary { background: #CA1F3F; }
  .wb-bar .wb-primary:hover { background: #A8172F; }
  .wb-pages { display: inline-flex; align-items: center; gap: 3px; color: rgba(255,255,255,0.7); font-size: 12.5px; padding: 0 4px; }
  .wb-pages a { padding: 7px 10px; min-width: 30px; text-align: center; }
  .wb-pages a.on { background: #FFBE00; color: #24182E; }
  .wb-status { color: #FFBE00; font-size: 12.5px; min-width: 1px; }
  .wb-foot { margin: 18px auto 30px; text-align: center; font: 12.5px "Rubik", sans-serif; color: #6B6373; }
  .wb-foot a { color: #CA1F3F; }
  @media print { .wb-bar, .wb-foot { display: none !important; } [contenteditable="true"][data-placeholder]:empty::before { content: ""; } [contenteditable="true"]:focus { background: none; } }
  @media (max-width: 900px) { .page { padding: 24px 18px !important; } .dual-grid { grid-template-columns: 1fr !important; } table { display: block; overflow-x: auto; } }
  /* Phones only (printing also counts as a narrow page, and the PDFs are fitted without these). */
  @media screen and (max-width: 900px) { svg, img { max-width: 100%; height: auto; } .meta-row { flex-wrap: wrap; gap: 6px 10px !important; } .meta-row .editable-line { min-width: 120px; flex: 1 1 120px; max-width: none !important; } * { min-width: 0; } .wb-pages > span { display: none; } }
</style>`;

// Highlights the page-jump button for the page in view.
const PAGER = `(function () {
  var links = document.querySelectorAll('.wb-pages a');
  if (!('IntersectionObserver' in window) || !links.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('.page[id]').forEach(function (p) { io.observe(p); });
})();`;

const escAttr = (s) => s.replace(/"/g, '&quot;').replace(/\s+/g, ' ').trim();

export function transformWorkbook(html, { n, offline = false, pdfHref = null }) {
  const id = String(n).padStart(2, '0');
  let out = rebrand(html).replace('<html lang="en">', `<html lang="en" data-session="${id}">`);

  // Only plain-text boxes are converted; boxes holding markup are left alone.
  out = out.replace(/(<(div|span|p|td)\b[^>]*contenteditable="true"[^>]*)>([^<]*)<\/\2>/g, (m, open, tag, text) =>
    text.trim() ? `${open} data-placeholder="${escAttr(text)}"></${tag}>` : m
  );

  // Page 1's header carries the club name: show it as the logo lockup.
  out = out.replace(/<div class="header-title">Bozoma Innovation Hub • Tech Club<\/div>/g,
    '<div class="header-title"><span class="wb-lockup"><b>TECH CLUB</b><small>BOZOMA INNOVATION HUB</small></span></div>');
  let page = 0;
  out = out.replace(/<div class="page">/g, () => `<div class="page" id="page-${++page}">`);

  if (!out.includes('name="viewport"')) out = out.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">');
  out = out.replace('</head>', `${STYLE}\n</head>`);

  const bar = [
    offline ? '' : `<a href="../sessions/${id}/#path">← Session ${n} steps</a>`,
    `<span class="wb-pages" aria-label="Jump to a page"><span>Page</span>${Array.from({ length: page }, (_, i) => `<a href="#page-${i + 1}">${i + 1}</a>`).join('')}</span>`,
    `<button type="button" class="wb-primary" data-wb="print">🖨 Print / Save as PDF</button>`,
    pdfHref && !offline ? `<a href="${pdfHref}" download>⬇ PDF</a>` : '',
    `<button type="button" data-wb="clear">Clear my answers</button>`,
    `<span class="wb-status" role="status"></span>`,
  ].join('');
  out = out.replace(/<body([^>]*)>/, `<body$1>\n<div class="wb-bar no-print">${bar}</div>`);
  const foot = `<p class="wb-foot no-print">BIH JHS Tech Club · a <a href="https://bozomainnovationhub.com">Bozoma Innovation Hub</a> programme · Your answers are saved only on this computer.</p>`;
  out = out.replace('</body>', `${foot}\n<script>${SCRIPT}\n${PAGER}</script>\n</body>`);
  return out;
}
