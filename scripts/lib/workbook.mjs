// Turns an authored session workbook into the published version:
// sample text in fill-in boxes becomes a faint hint (blank when printed),
// and a toolbar plus the autosave script are added.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = readFileSync(ROOT + 'src/workbook.js', 'utf8');

const STYLE = `
<style id="bih-enhance">
  [contenteditable="true"][data-placeholder]:empty::before { content: attr(data-placeholder); color: #A0A6B8; font-style: italic; font-weight: 400; }
  [contenteditable="true"]:focus { background: #FFF8E6; }
  .wb-bar { position: sticky; top: 0; z-index: 50; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; padding: 10px 12px; margin: -20px -20px 0; background: #3A0CA3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .wb-bar a, .wb-bar button { font: 600 13.5px/1 inherit; font-family: inherit; color: #fff; background: rgba(255,255,255,0.14); border: 0; border-radius: 999px; padding: 9px 14px; cursor: pointer; text-decoration: none; }
  .wb-bar a:hover, .wb-bar button:hover { background: rgba(255,255,255,0.26); }
  .wb-bar .wb-primary { background: #F77F00; }
  .wb-status { color: #fff; font-size: 12.5px; opacity: 0.85; min-width: 1px; }
  @media print { .wb-bar { display: none !important; } [contenteditable="true"][data-placeholder]:empty::before { content: ""; } [contenteditable="true"]:focus { background: none; } }
  @media (max-width: 900px) { .page { padding: 24px 18px !important; } .dual-grid { grid-template-columns: 1fr !important; } table { display: block; overflow-x: auto; } }
</style>`;

const escAttr = (s) => s.replace(/"/g, '&quot;').replace(/\s+/g, ' ').trim();

export function transformWorkbook(html, { n, offline = false, pdfHref = null }) {
  const id = String(n).padStart(2, '0');
  let out = html.replace('<html lang="en">', `<html lang="en" data-session="${id}">`);

  // Only plain-text boxes are converted; boxes holding markup are left alone.
  out = out.replace(/(<(div|span|p|td)\b[^>]*contenteditable="true"[^>]*)>([^<]*)<\/\2>/g, (m, open, tag, text) =>
    text.trim() ? `${open} data-placeholder="${escAttr(text)}"></${tag}>` : m
  );

  if (!out.includes('name="viewport"')) out = out.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">');
  out = out.replace('</head>', `${STYLE}\n</head>`);

  const bar = [
    offline ? '' : `<a href="../sessions/${id}/">← Session ${n} page</a>`,
    `<button type="button" class="wb-primary" data-wb="print">🖨 Print / Save as PDF</button>`,
    pdfHref && !offline ? `<a href="${pdfHref}" download>⬇ Download PDF</a>` : '',
    `<button type="button" data-wb="clear">Clear my answers</button>`,
    `<span class="wb-status" role="status"></span>`,
  ].join('');
  out = out.replace(/<body([^>]*)>/, `<body$1>\n<div class="wb-bar no-print">${bar}</div>`);
  out = out.replace('</body>', `<script>${SCRIPT}</script>\n</body>`);
  return out;
}
