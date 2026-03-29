import { useState, useEffect, useRef, useMemo } from 'react';
import { RICH_PARTS as P } from '../parts';
import { ModalOverlay } from './ModalOverlay';

export interface PaletteItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
}

export interface CommandPaletteProps {
  items: PaletteItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
  placeholder?: string;
  maxVisible?: number;
  filterFn?: (item: PaletteItem, query: string) => boolean;
  footer?: boolean;
}

const defaultFilter = (item: PaletteItem, q: string) =>
  item.label.toLowerCase().includes(q) || item.id.includes(q);

export function CommandPalette({
  items,
  onSelect,
  onClose,
  placeholder = 'Search actions…',
  maxVisible = 14,
  filterFn = defaultFilter,
  footer = true,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((a) => filterFn(a, q)).slice(0, maxVisible);
  }, [query, items, filterFn, maxVisible]);

  useEffect(() => {
    setIdx(0);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && filtered[idx]) {
      e.preventDefault();
      onSelect(filtered[idx].id);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div data-part={P.commandPalette}>
        <div data-part={P.commandPaletteSearch}>
          <span style={{ fontSize: 15, opacity: 0.4 }}>🔍</span>
          <input
            ref={ref}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            data-part={P.commandPaletteInput}
          />
          <kbd data-part={P.commandPaletteKbd}>esc</kbd>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--hc-color-muted)',
              }}
            >
              No actions found
            </div>
          )}
          {filtered.map((a, i) => (
            <div
              key={a.id}
              onClick={() => onSelect(a.id)}
              onMouseEnter={() => setIdx(i)}
              data-part={P.commandPaletteItem}
              data-state={i === idx ? 'active' : undefined}
            >
              {a.icon && (
                <span style={{ width: 24, textAlign: 'center', fontSize: 14 }}>
                  {a.icon}
                </span>
              )}
              <span style={{ flex: 1, fontSize: 13 }}>{a.label}</span>
              {a.shortcut && (
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--hc-color-muted)',
                  }}
                >
                  {a.shortcut}
                </span>
              )}
            </div>
          ))}
        </div>
        {footer && (
          <div data-part={P.commandPaletteFooter}>
            <span>↑↓ navigate</span>
            <span>⏎ run</span>
            <span>esc close</span>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
