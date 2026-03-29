import { describe, expect, it } from 'vitest';
import { cycleAlignment, replaceCurrentSlideAlignment } from './helpers';

describe('macSlides helpers', () => {
  it('cycles slide alignment in the expected order', () => {
    expect(cycleAlignment('auto')).toBe('center');
    expect(cycleAlignment('center')).toBe('left');
    expect(cycleAlignment('left')).toBe('auto');
  });

  it('rewrites the current slide alignment directive in-place', () => {
    const markdown = '# One\n\n---\n\n<!-- align: center -->\n# Two';

    expect(replaceCurrentSlideAlignment(markdown, 1)).toContain('<!-- align: left -->\n# Two');
    expect(replaceCurrentSlideAlignment(markdown, 0)).toContain('<!-- align: center -->\n# One');
  });

  it('removes explicit directives when cycling back to auto', () => {
    const markdown = '<!-- align: left -->\n# Solo';
    expect(replaceCurrentSlideAlignment(markdown, 0)).toBe('# Solo');
  });
});
