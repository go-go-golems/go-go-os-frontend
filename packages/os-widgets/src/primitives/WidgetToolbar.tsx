import type { ReactNode } from 'react';
import { RICH_PARTS as P } from '../parts';

export interface WidgetToolbarProps {
  children: ReactNode;
  className?: string;
}

export function WidgetToolbar({ children, className }: WidgetToolbarProps) {
  return (
    <div data-part={P.widgetToolbar} className={className}>
      {children}
    </div>
  );
}
