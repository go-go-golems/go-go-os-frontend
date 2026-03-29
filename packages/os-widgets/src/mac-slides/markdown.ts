import type { MacSlidesDeck, SlideAlignment, SlideDocument } from './types';

function normalizeDirectiveMatch(src: string): RegExpMatchArray | null {
  return (
    src.match(/^<!--\s*align:\s*(center|left)\s*-->\s*\n?/) ??
    src.match(/^&lt;!--\s*align:\s*(center|left)\s*--&gt;\s*\n?/)
  );
}

export function parseSlideDirective(src: string): SlideDocument {
  const match = normalizeDirectiveMatch(src);
  if (!match) {
    return {
      raw: src,
      content: src,
      align: 'auto',
    };
  }

  return {
    raw: src,
    content: src.slice(match[0].length),
    align: match[1] as SlideAlignment,
  };
}

export function splitSlides(markdown: string): SlideDocument[] {
  return markdown
    .split(/\n---\n/)
    .map((slide) => slide.trim())
    .filter((slide) => slide.length > 0)
    .map(parseSlideDirective);
}

export function createDeck(markdown: string): MacSlidesDeck {
  return {
    markdown,
    slides: splitSlides(markdown),
  };
}

function escapeHtml(src: string): string {
  return src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInlineMarkdown(src: string): string {
  let html = escapeHtml(src);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html;
}

function renderHeading(line: string): string | null {
  const match = line.match(/^(#{1,3})\s+(.+)$/);
  if (!match) {
    return null;
  }

  return `<h${match[1].length}>${renderInlineMarkdown(match[2])}</h${match[1].length}>`;
}

export function renderBasicMarkdown(src: string): string {
  const lines = src.split('\n');
  const rendered: string[] = [];

  for (let index = 0; index < lines.length; ) {
    const currentLine = lines[index]?.trim() ?? '';

    if (!currentLine) {
      index += 1;
      continue;
    }

    const heading = renderHeading(currentLine);
    if (heading) {
      rendered.push(heading);
      index += 1;
      continue;
    }

    if (/^- /.test(currentLine)) {
      const items: string[] = [];
      while (index < lines.length) {
        const line = lines[index]?.trim() ?? '';
        if (!/^- /.test(line)) {
          break;
        }
        items.push(`<li>${renderInlineMarkdown(line.replace(/^- /, ''))}</li>`);
        index += 1;
      }
      rendered.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(currentLine)) {
      const items: string[] = [];
      while (index < lines.length) {
        const line = lines[index]?.trim() ?? '';
        if (!/^\d+\. /.test(line)) {
          break;
        }
        items.push(`<li>${renderInlineMarkdown(line.replace(/^\d+\. /, ''))}</li>`);
        index += 1;
      }
      rendered.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const line = lines[index]?.trim() ?? '';
      if (!line || renderHeading(line) || /^- /.test(line) || /^\d+\. /.test(line)) {
        break;
      }
      paragraphLines.push(renderInlineMarkdown(line));
      index += 1;
    }
    rendered.push(`<p>${paragraphLines.join('<br/>')}</p>`);
  }

  return rendered.join('');
}
