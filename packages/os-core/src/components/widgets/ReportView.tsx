import type { ActionConfig, ReportSection } from '../../types';
import { Btn } from './Btn';

export interface ReportViewProps {
  sections: ReportSection[];
  actions?: ActionConfig[];
  onAction?: (action: unknown) => void;
}

export function ReportView({ sections, actions, onAction }: ReportViewProps) {
  return (
    <div data-part="report-view">
      <div style={{ border: '2px solid var(--hc-color-border, #000)', maxWidth: 400 }}>
        {sections.map((sec, i) => (
          <div
            key={sec.label}
            data-part="report-row"
            style={{
              borderBottom: i < sections.length - 1 ? '1px solid #ccc' : 'none',
              background: i % 2 ? '#f8f8f4' : '#fff',
            }}
          >
            <span>{sec.label}</span>
            <span style={{ fontWeight: 'bold' }}>{sec.value}</span>
          </div>
        ))}
      </div>
      {actions && (
        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          {actions.map((a) => (
            <Btn key={a.label} variant={a.variant} onClick={() => onAction?.(a.action)}>
              {a.label}
            </Btn>
          ))}
        </div>
      )}
    </div>
  );
}
