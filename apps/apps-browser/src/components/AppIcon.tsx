import type { MouseEvent } from 'react';
import type { AppManifestDocument } from '../domain/types';
import './AppIcon.css';

export interface AppIconProps {
  app: AppManifestDocument;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function AppIcon({ app, selected, onClick, onDoubleClick, onContextMenu }: AppIconProps) {
  const healthy = app.healthy !== false;
  const hasReflection = app.reflection?.available === true;

  return (
    <button
      type="button"
      data-part="app-icon"
      data-state={selected ? 'selected' : undefined}
      aria-pressed={selected}
      aria-label={app.name}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onDoubleClick?.();
        }
      }}
    >
      <span data-part="app-icon-frame" aria-hidden="true">
        {app.required && <span data-part="app-icon-required">&#x25C8;</span>}
        <span
          data-part="app-icon-health"
          data-variant={healthy ? 'healthy' : 'unhealthy'}
        >
          {healthy ? '\u25CF' : '\u25CB'}
        </span>
        <span
          data-part="app-icon-glyph"
          data-variant={healthy ? undefined : 'unhealthy'}
        >
          {healthy ? '\u25A6\u25A6' : '\u2591\u2591'}
        </span>
        {hasReflection && <span data-part="app-icon-reflection">&#x2605;</span>}
      </span>
      <span
        data-part="app-icon-label"
        data-variant={healthy ? undefined : 'unhealthy'}
      >
        {healthy ? '' : '\u26A0 '}{app.name}
      </span>
    </button>
  );
}
