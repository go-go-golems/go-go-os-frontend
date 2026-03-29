import type { ReactNode } from 'react';
import { REPL_PARTS as P } from './parts';

export interface WidgetStatusBarProps {
  children: ReactNode;
  className?: string;
}

export function WidgetStatusBar({ children, className }: WidgetStatusBarProps) {
  return (
    <div data-part={P.widgetStatusBar} className={className}>
      {children}
    </div>
  );
}
