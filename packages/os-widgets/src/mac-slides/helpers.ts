import { parseSlideDirective } from './markdown';
import type { SlideAlignment } from './types';

export function cycleAlignment(align: SlideAlignment): SlideAlignment {
  if (align === 'auto') {
    return 'center';
  }
  if (align === 'center') {
    return 'left';
  }
  return 'auto';
}

export function replaceCurrentSlideAlignment(markdown: string, slideIndex: number): string {
  const parts = markdown.split(/\n---\n/);
  const index = Math.min(slideIndex, Math.max(parts.length - 1, 0));
  const current = parts[index]?.trimStart() ?? '';
  const parsed = parseSlideDirective(current);
  const nextAlign = cycleAlignment(parsed.align);
  let nextContent = parsed.content.trimStart();

  if (nextAlign !== 'auto') {
    nextContent = `<!-- align: ${nextAlign} -->\n${nextContent}`;
  }

  parts[index] = nextContent;
  return parts.join('\n---\n');
}
