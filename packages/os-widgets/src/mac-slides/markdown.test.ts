import { describe, expect, it } from 'vitest';
import { createDeck, parseSlideDirective, renderBasicMarkdown, splitSlides } from './markdown';

describe('macSlides markdown helpers', () => {
  it('parses alignment directives from slide headers', () => {
    expect(parseSlideDirective('<!-- align: center -->\n# Title').align).toBe('center');
    expect(parseSlideDirective('<!-- align: left -->\n# Title').align).toBe('left');
    expect(parseSlideDirective('# Title').align).toBe('auto');
  });

  it('splits markdown into trimmed slides', () => {
    const slides = splitSlides('# One\n\n---\n\n# Two');
    expect(slides).toHaveLength(2);
    expect(slides[0].content).toContain('# One');
    expect(slides[1].content).toContain('# Two');
  });

  it('renders simple markdown and creates deck metadata', () => {
    expect(renderBasicMarkdown('# Hello')).toContain('<h1>Hello</h1>');
    expect(createDeck('# One\n\n---\n\n# Two').slides).toHaveLength(2);
  });

  it('renders ordered and unordered lists without placeholder tags', () => {
    const html = renderBasicMarkdown('- One\n- Two\n\n1. First\n2. Second');
    expect(html).toContain('<ul><li>One</li><li>Two</li></ul>');
    expect(html).toContain('<ol><li>First</li><li>Second</li></ol>');
    expect(html).not.toContain('oli>');
  });

  it('escapes html and preserves inline formatting inside paragraphs', () => {
    const html = renderBasicMarkdown('Use **bold** and `code` with <script>.');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('&lt;script&gt;');
  });
});
