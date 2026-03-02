/**
 * Simple Markdown → HTML parser.
 * Produces inline-styled HTML for the preview pane.
 * Uses CSS custom properties so it works with any theme.
 */

function escaped(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlinePass(text: string): string {
  let out = escaped(text);
  // Images
  out = out.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%;border:1px solid var(--hc-color-border);margin:4px 0" />',
  );
  // Links
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:var(--hc-color-accent);text-decoration:underline" target="_blank">$1</a>',
  );
  // Inline code
  out = out.replace(
    /`([^`]+)`/g,
    '<code style="background:var(--hc-color-alt, #e8e8e8);padding:1px 5px;font-family:var(--hc-font-family);font-size:11px;border:1px solid var(--hc-color-border)">$1</code>',
  );
  // Bold+italic
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Strikethrough
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return out;
}

export function parseMarkdown(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inCode = false;
  let codeBlock = '';
  let inList = false;
  let listType = '';
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
      inList = false;
    }
  };

  const flushTable = () => {
    if (!inTable || tableRows.length < 2) {
      inTable = false;
      tableRows = [];
      return;
    }
    html += '<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:11px">';
    const headers = tableRows[0];
    html += '<thead><tr>';
    for (const h of headers) {
      html += `<th style="border:1px solid var(--hc-color-border);padding:4px 10px;text-align:left;background:var(--hc-color-alt, #f0f0f0)">${inlinePass(h.trim())}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (let i = 2; i < tableRows.length; i++) {
      html += '<tr>';
      for (const c of tableRows[i]) {
        html += `<td style="border:1px solid var(--hc-color-border);padding:4px 10px">${inlinePass(c.trim())}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    inTable = false;
    tableRows = [];
  };

  for (const line of lines) {
    // Code block toggle
    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre style="background:var(--hc-color-alt, #e8e8e8);border:1px solid var(--hc-color-border);padding:10px 12px;margin:8px 0;overflow-x:auto;font-family:var(--hc-font-family);font-size:11px;line-height:1.4"><code>${escaped(codeBlock.replace(/\n$/, ''))}</code></pre>`;
        inCode = false;
        codeBlock = '';
      } else {
        flushList();
        flushTable();
        inCode = true;
        codeBlock = '';
      }
      continue;
    }
    if (inCode) {
      codeBlock += line + '\n';
      continue;
    }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        flushList();
        inTable = true;
        tableRows = [];
      }
      const cells = line
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Blank line
    if (line.trim() === '') {
      flushList();
      html += '<br/>';
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      flushList();
      const lvl = hMatch[1].length;
      const sizes: Record<number, number> = { 1: 18, 2: 15, 3: 13, 4: 12, 5: 11, 6: 11 };
      html += `<h${lvl} style="font-size:${sizes[lvl]}px;margin:${lvl <= 2 ? '16px 0 8px' : '12px 0 6px'};font-weight:bold;color:var(--hc-color-accent);border-bottom:${lvl <= 2 ? '1px solid var(--hc-color-border)' : 'none'};padding-bottom:${lvl <= 2 ? '4px' : '0'}">${inlinePass(hMatch[2])}</h${lvl}>`;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushList();
      html +=
        '<hr style="border:none;border-top:2px solid var(--hc-color-border);margin:12px 0"/>';
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      flushList();
      const content = line.replace(/^>\s?/, '');
      html += `<blockquote style="border-left:3px solid var(--hc-color-accent);margin:8px 0;padding:4px 12px;background:var(--hc-color-alt, #f0f0f0);color:var(--hc-color-muted)">${inlinePass(content)}</blockquote>`;
      continue;
    }

    // Checkbox
    const cbMatch = line.match(/^[-*]\s+\[([ x])\]\s+(.+)/);
    if (cbMatch) {
      flushList();
      const checked = cbMatch[1] === 'x';
      html += `<div style="margin:2px 0;display:flex;align-items:center;gap:6px"><span style="font-size:14px">${checked ? '☑' : '☐'}</span><span style="${checked ? 'text-decoration:line-through;opacity:0.5' : ''}">${inlinePass(cbMatch[2])}</span></div>`;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        html += "<ul style='margin:4px 0;padding-left:20px'>";
        inList = true;
        listType = 'ul';
      }
      html += `<li style="margin:2px 0">${inlinePass(ulMatch[1])}</li>`;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        html += "<ol style='margin:4px 0;padding-left:20px'>";
        inList = true;
        listType = 'ol';
      }
      html += `<li style="margin:2px 0">${inlinePass(olMatch[1])}</li>`;
      continue;
    }

    flushList();
    html += `<p style="margin:4px 0;line-height:1.5">${inlinePass(line)}</p>`;
  }

  if (inCode) {
    html += `<pre style="background:var(--hc-color-alt, #e8e8e8);border:1px solid var(--hc-color-border);padding:10px 12px;margin:8px 0;overflow-x:auto;font-family:var(--hc-font-family);font-size:11px"><code>${escaped(codeBlock)}</code></pre>`;
  }
  flushList();
  flushTable();
  return html;
}
