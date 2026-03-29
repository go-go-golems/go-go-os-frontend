import { RICH_PARTS as P } from '../parts';

export interface SeparatorProps {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function Separator({ orientation = 'vertical', className }: SeparatorProps) {
  return (
    <span
      data-part={P.widgetSeparator}
      data-orientation={orientation}
      className={className}
    />
  );
}
