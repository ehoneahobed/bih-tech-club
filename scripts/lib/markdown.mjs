// A small Markdown renderer for the mentor guides. It supports only what
// content/mentor/_TEMPLATE.md uses: headings, paragraphs, bullet, numbered and
// checklist items, pipe tables, blockquotes, **bold**, *italic* and `code`.
// Everything is HTML-escaped first, so guide text can never add markup.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Code spans are set aside first, so a * or | inside `=B2*C2` is never read as formatting.
function inline(s) {
  const code = [];
  return esc(s)
    .replace(/`([^`]+)`/g, (_, c) => `\u0000${code.push(c) - 1}\u0000`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${code[i]}</code>`);
}

// Split a table row on | but not on a | inside `code`.
function cells(row) {
  const out = [''];
  let inCode = false;
  for (const ch of row.trim().replace(/^\||\|$/g, '')) {
    if (ch === '`') inCode = !inCode;
    if (ch === '|' && !inCode) out.push('');
    else out[out.length - 1] += ch;
  }
  return out.map((c) => c.trim());
}

export function renderMarkdown(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }

    if (line.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
      continue;
    }

    if (line.trim().startsWith('|') && /^\s*\|?[\s:-]+\|/.test(lines[i + 1] || '')) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    const list = line.match(/^\s*(-|\d+\.)\s+/);
    if (list) {
      const ordered = list[1] !== '-';
      const items = [];
      const start = ordered ? parseInt(list[1], 10) : 1;
      // A numbered list carries on across a blank line, so "1." "" "2." is one list.
      const nextItem = () => /^\s*(-|\d+\.)\s+/.test(lines[i]) && /^\s*\d+\./.test(lines[i]) === ordered;
      while (i < lines.length && (nextItem() || (ordered && !lines[i].trim() && /^\s*\d+\.\s+/.test(lines[i + 1] || '')))) {
        if (!lines[i].trim()) { i++; continue; }
        let text = lines[i++].replace(/^\s*(-|\d+\.)\s+/, '');
        // Wrapped continuation lines belong to the item above.
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*(-|\d+\.)\s+/.test(lines[i])) text += ' ' + lines[i++].trim();
        const box = text.match(/^\[( |x)\]\s+(.*)/i);
        items.push(box ? `<li class="task"><input type="checkbox"${box[1] === ' ' ? '' : ' checked'} aria-label="Done"> ${inline(box[2])}</li>` : `<li>${inline(text)}</li>`);
      }
      out.push(ordered ? `<ol${start !== 1 ? ` start="${start}"` : ''}>${items.join('')}</ol>` : `<ul${items[0].startsWith('<li class="task"') ? ' class="checklist"' : ''}>${items.join('')}</ul>`);
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>|\s*(-|\d+\.)\s+|\s*\|)/.test(lines[i])) para.push(lines[i++].trim());
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    else out.push(`<p>${inline(lines[i++])}</p>`);
  }
  return out.join('\n');
}
