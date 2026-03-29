import type { MouseEvent, PointerEvent } from 'react';
import { PARTS } from '../../../parts';

export interface WindowTitleBarProps {
  title: string;
  icon?: string;
  focused?: boolean;
  onClose?: () => void;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
}

export function shouldPrefixWindowIcon(title: string, icon?: string): boolean {
  if (!icon) {
    return false;
  }
  return !title.trimStart().startsWith(icon);
}

export function WindowTitleBar({ title, icon, focused, onClose, onPointerDown, onContextMenu }: WindowTitleBarProps) {
  const prefixIcon = shouldPrefixWindowIcon(title, icon) ? `${icon} ` : '';

  return (
    <div
      data-part={PARTS.windowingWindowTitleBar}
      data-state={focused ? 'focused' : undefined}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    >
      <button
        type="button"
        data-part={PARTS.windowingCloseButton}
        aria-label={`Close ${title}`}
        onClick={(event) => {
          event.stopPropagation();
          onClose?.();
        }}
      />
      <div data-part={PARTS.windowingWindowTitle}>
        {prefixIcon}
        {title}
      </div>
    </div>
  );
}
