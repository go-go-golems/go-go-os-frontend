function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlinePass(text: string) {
  let output = escapeHtml(text);
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="mac-browser-link" data-href="$2">$1</a>');
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  output = output.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  return output;
}

export function parseBrowserMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  let html = '';
  let inCode = false;
  let codeBlock = '';
  let inList = false;
  let listType: 'ul' | 'ol' | '' = '';
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
      inList = false;
      listType = '';
    }
  };

  const flushTable = () => {
    if (!inTable || tableRows.length < 2) {
      inTable = false;
      tableRows = [];
      return;
    }
    html += '<table><thead><tr>';
    for (const header of tableRows[0]) {
      html += `<th>${inlinePass(header.trim())}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (let index = 2; index < tableRows.length; index += 1) {
      html += '<tr>';
      for (const cell of tableRows[index]) {
        html += `<td>${inlinePass(cell.trim())}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    inTable = false;
    tableRows = [];
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(codeBlock.replace(/\n$/, ''))}</code></pre>`;
        inCode = false;
        codeBlock = '';
      } else {
        flushList();
        flushTable();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBlock += `${line}\n`;
      continue;
    }

    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        flushList();
        inTable = true;
        tableRows = [];
      }
      tableRows.push(
        line
          .split('|')
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1),
      );
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!line.trim()) {
      flushList();
      html += '<br/>';
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      html += `<h${level}>${inlinePass(heading[2])}</h${level}>`;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushList();
      html += '<hr/>';
      continue;
    }

    if (line.startsWith('>')) {
      flushList();
      html += `<blockquote>${inlinePass(line.replace(/^>\s?/, ''))}</blockquote>`;
      continue;
    }

    const unordered = line.match(/^[-*+]\s+(.+)/);
    if (unordered) {
      if (!inList || listType !== 'ul') {
        flushList();
        html += '<ul>';
        inList = true;
        listType = 'ul';
      }
      html += `<li>${inlinePass(unordered[1])}</li>`;
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)/);
    if (ordered) {
      if (!inList || listType !== 'ol') {
        flushList();
        html += '<ol>';
        inList = true;
        listType = 'ol';
      }
      html += `<li>${inlinePass(ordered[1])}</li>`;
      continue;
    }

    flushList();
    html += `<p>${inlinePass(line)}</p>`;
  }

  if (inCode) {
    html += `<pre><code>${escapeHtml(codeBlock)}</code></pre>`;
  }
  flushList();
  flushTable();
  return html;
}
