import { RICH_PARTS as P } from '../parts';
import { MARKER_SHAPES } from './rendering';
import type { ChartDataset, ChartType } from './types';

const DASH_SVG_PATTERNS = [[''], ['6,3'], ['2,2'], ['8,3,2,3']];

export function LegendBar({
  series,
  chartType,
}: {
  series: ChartDataset['series'];
  chartType: ChartType;
}) {
  return (
    <div data-part={P.cvLegend}>
      {series.map((seriesItem, index) => (
        <div key={seriesItem.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {chartType === 'line' ? (
            <svg width="22" height="10">
              <line
                x1="0"
                y1="5"
                x2="22"
                y2="5"
                stroke="#000"
                strokeWidth="2"
                strokeDasharray={DASH_SVG_PATTERNS[index % DASH_SVG_PATTERNS.length].join('')}
              />
              {MARKER_SHAPES[index % MARKER_SHAPES.length] === 'circle' ? (
                <circle cx="11" cy="5" r="3" fill="#fff" stroke="#000" strokeWidth="1.5" />
              ) : (
                <rect x="8" y="2" width="6" height="6" fill="#fff" stroke="#000" strokeWidth="1.5" />
              )}
            </svg>
          ) : (
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 10,
                border: '1px solid var(--hc-color-border)',
                background: `repeating-linear-gradient(${45 + index * 30}deg, var(--hc-color-fg) 0px, var(--hc-color-fg) 1px, var(--hc-color-bg) 1px, var(--hc-color-bg) 3px)`,
              }}
            />
          )}
          <span style={{ fontSize: 10 }}>{seriesItem.name}</span>
        </div>
      ))}
    </div>
  );
}
