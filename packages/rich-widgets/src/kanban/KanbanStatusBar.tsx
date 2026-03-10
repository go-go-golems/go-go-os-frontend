import { WidgetStatusBar } from '../primitives/WidgetStatusBar';

export interface KanbanStatusMetric {
  label: string;
  value: string | number;
}

export interface KanbanStatusBarProps {
  metrics: KanbanStatusMetric[];
}

export function KanbanStatusBar({ metrics }: KanbanStatusBarProps) {
  return (
    <WidgetStatusBar>
      {metrics.map((metric) => (
        <span key={metric.label}>
          {metric.value} {metric.label}
        </span>
      ))}
    </WidgetStatusBar>
  );
}
