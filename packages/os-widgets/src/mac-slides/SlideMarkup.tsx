import { RICH_PARTS as P } from '../parts';
import { renderBasicMarkdown } from './markdown';
import type { SlideAlignment } from './types';

export function SlideMarkup({
  content,
  align,
}: {
  content: string;
  align: SlideAlignment;
}) {
  return (
    <div
      data-part={P.msSlideContent}
      data-align={align}
      dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(content) }}
    />
  );
}
