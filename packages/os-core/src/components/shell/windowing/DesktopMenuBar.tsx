import { useId } from 'react';
import { PARTS } from '../../../parts';
import type { DesktopCommandInvocation, DesktopMenuEntry, DesktopMenuSection } from './types';

function isSeparator(entry: DesktopMenuEntry): entry is { separator: true } {
  return 'separator' in entry && entry.separator === true;
}

export interface DesktopMenuBarProps {
  sections: DesktopMenuSection[];
  activeMenuId: string | null;
  onActiveMenuChange?: (menuId: string | null) => void;
  onCommand?: (commandId: string, menuId: string, invocation: DesktopCommandInvocation) => void;
}

export function DesktopMenuBar({ sections, activeMenuId, onActiveMenuChange, onCommand }: DesktopMenuBarProps) {
  const menuBaseId = useId();

  return (
    <div
      data-part={PARTS.windowingMenuBar}
      role="menubar"
      aria-label="Desktop menu bar"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onActiveMenuChange?.(null);
        }
      }}
    >
      {sections.map((section) => {
        const isOpen = activeMenuId === section.id;
        const panelId = `${menuBaseId}-${section.id}`;

        return (
          <div key={section.id} style={{ position: 'relative' }}>
            <button
              type="button"
              data-part={PARTS.windowingMenuButton}
              data-state={isOpen ? 'open' : undefined}
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => onActiveMenuChange?.(isOpen ? null : section.id)}
              onMouseEnter={() => {
                if (activeMenuId && activeMenuId !== section.id) {
                  onActiveMenuChange?.(section.id);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onActiveMenuChange?.(section.id);
                }
              }}
            >
              {section.label}
            </button>
            {isOpen ? (
              <div id={panelId} data-part={PARTS.windowingMenuPanel} role="menu" aria-label={section.label}>
                {section.items.map((entry, idx) =>
                  isSeparator(entry) ? (
                    <hr key={`sep-${idx}`} data-part={PARTS.windowingMenuSeparator} />
                  ) : (
                    <button
                      key={entry.id}
                      type="button"
                      data-part={PARTS.windowingMenuItem}
                      role="menuitem"
                      disabled={entry.disabled}
                      onClick={() => {
                        onCommand?.(entry.commandId, section.id, { source: 'menu', menuId: section.id });
                        onActiveMenuChange?.(null);
                      }}
                    >
                      <span>{entry.label}</span>
                      {entry.shortcut ? <span data-part={PARTS.windowingMenuShortcut}>{entry.shortcut}</span> : null}
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
