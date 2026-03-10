import type { ReactNode } from 'react';
import { Btn } from '@hypercard/engine';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { Separator } from '../primitives/Separator';

export interface KanbanHeaderBarProps {
  title?: string;
  subtitle?: string;
  searchQuery: string;
  searchPlaceholder?: string;
  primaryActionLabel?: string;
  onPrimaryAction: () => void;
  onSearchChange: (value: string) => void;
  children?: ReactNode;
}

export function KanbanHeaderBar({
  title = 'Kanban',
  subtitle,
  searchQuery,
  searchPlaceholder = 'Search...',
  primaryActionLabel = '+ New',
  onPrimaryAction,
  onSearchChange,
  children,
}: KanbanHeaderBarProps) {
  return (
    <WidgetToolbar>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 140 }}>
        <span style={{ fontWeight: 'bold', fontSize: 10 }}>{title}</span>
        {subtitle ? <span style={{ fontSize: 9, opacity: 0.65 }}>{subtitle}</span> : null}
      </div>

      <Separator />

      <Btn
        onClick={onPrimaryAction}
        style={{ fontSize: 10, fontWeight: 'bold' }}
      >
        {primaryActionLabel}
      </Btn>

      <Separator />

      <input
        data-part="field-input"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        style={{ width: 140 }}
      />

      {children ? (
        <>
          <Separator />
          {children}
        </>
      ) : null}
    </WidgetToolbar>
  );
}
