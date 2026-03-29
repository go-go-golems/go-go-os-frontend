import type { ReactNode } from 'react';
import { RICH_PARTS as P } from '../parts';

export interface EmptyStateProps {
  icon?: string;
  message: ReactNode;
  className?: string;
}

export function EmptyState({ icon, message, className }: EmptyStateProps) {
  return (
    <div data-part={P.widgetEmptyState} className={className}>
      {icon && <div data-part={P.widgetEmptyIcon}>{icon}</div>}
      <div>{message}</div>
    </div>
  );
}
