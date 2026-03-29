import { ProgressBar } from '@go-go-golems/os-widgets';
import { Sparkline } from '@go-go-golems/os-widgets';
import type { KanbanHighlight } from './types';
import { KANBAN_PARTS as P } from './parts';

export interface KanbanHighlightsProps {
  items: KanbanHighlight[];
}

export function KanbanHighlights({ items }: KanbanHighlightsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section data-part={P.kbHighlights}>
      {items.map((item) => (
        <article key={item.id} data-part={P.kbHighlight} data-tone={item.tone ?? 'neutral'}>
          <div data-part={P.kbHighlightLabel}>{item.label}</div>
          <div data-part={P.kbHighlightValue}>{item.value}</div>
          {item.caption ? <div data-part={P.kbHighlightCaption}>{item.caption}</div> : null}
          {typeof item.progress === 'number' ? <ProgressBar value={item.progress} max={1} /> : null}
          {item.trend && item.trend.length > 0 ? (
            <div data-part={P.kbHighlightTrend}>
              <Sparkline data={item.trend} width={120} height={20} />
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
