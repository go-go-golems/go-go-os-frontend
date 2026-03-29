import { useEffect, useRef, useState } from 'react';
import { PARTS } from '../../parts';

export interface ContextMenuActionEntry {
  id: string;
  label: string;
  commandId?: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  payload?: Record<string, unknown>;
}

export type ContextMenuEntry = string | { separator: true } | ContextMenuActionEntry;

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  /** Backward-compatible string selection callback. */
  onSelect: (item: string) => void;
  onAction?: (entry: ContextMenuActionEntry) => void;
  onClose: () => void;
}

function isSeparator(entry: ContextMenuEntry): entry is { separator: true } {
  return typeof entry !== 'string' && 'separator' in entry;
}

function isActionEntry(entry: ContextMenuEntry): entry is ContextMenuActionEntry {
  return typeof entry !== 'string' && !isSeparator(entry);
}

export function ContextMenu({ x, y, items, onSelect, onAction, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Clamp menu position to stay within the viewport
  const [pos, setPos] = useState({ left: x, top: y });
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + rect.width > vw - 8) left = vw - rect.width - 8;
    if (top + rect.height > vh - 8) top = vh - rect.height - 8;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    setPos({ left, top });
  }, [x, y]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Determine if any item has a checkmark or shortcut for layout columns
  const hasChecks = items.some(
    (e) => isActionEntry(e) && e.checked !== undefined,
  );
  const hasShortcuts = items.some(
    (e) => isActionEntry(e) && e.shortcut,
  );

  return (
    <div
      data-part={PARTS.contextMenu}
      ref={ref}
      role="menu"
      style={{ left: pos.left, top: pos.top }}
      tabIndex={-1}
      data-has-checks={hasChecks || undefined}
      data-has-shortcuts={hasShortcuts || undefined}
    >
      {items.map((entry, i) =>
        isSeparator(entry) ? (
          <div key={`sep-${i}`} data-part={PARTS.contextMenuSeparator} role="separator" />
        ) : isActionEntry(entry) ? (
          <button
            key={entry.id}
            type="button"
            data-part={PARTS.contextMenuItem}
            role="menuitem"
            disabled={entry.disabled}
            aria-checked={entry.checked ? true : undefined}
            data-state={activeIndex === i ? 'active' : undefined}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(-1)}
            onClick={() => {
              if (entry.disabled) return;
              if (onAction) {
                onAction(entry);
              } else if (entry.commandId) {
                onSelect(entry.commandId);
              }
              onClose();
            }}
          >
            <span data-part={PARTS.contextMenuItemCheck}>
              {entry.checked ? '✓' : ''}
            </span>
            <span data-part={PARTS.contextMenuItemLabel}>{entry.label}</span>
            {entry.shortcut ? (
              <span data-part={PARTS.contextMenuItemShortcut}>{entry.shortcut}</span>
            ) : null}
          </button>
        ) : (
          <button
            key={`${entry}-${i}`}
            data-part={PARTS.contextMenuItem}
            type="button"
            role="menuitem"
            data-state={activeIndex === i ? 'active' : undefined}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(-1)}
            onClick={() => {
              onSelect(entry);
              onClose();
            }}
          >
            {hasChecks ? <span data-part={PARTS.contextMenuItemCheck} /> : null}
            <span data-part={PARTS.contextMenuItemLabel}>{entry}</span>
          </button>
        ),
      )}
    </div>
  );
}
