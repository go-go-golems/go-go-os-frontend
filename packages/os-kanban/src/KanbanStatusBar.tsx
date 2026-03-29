import { WidgetStatusBar } from '@go-go-golems/os-widgets';

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
