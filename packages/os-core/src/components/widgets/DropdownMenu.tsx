import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PARTS } from '../../parts';

export interface DropdownMenuProps {
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
  width?: number | string;
}

export function DropdownMenu({ options, selected, onSelect, width = 150 }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const triggerStyle: CSSProperties = { width };
  const panelStyle: CSSProperties = { width: typeof width === 'number' ? width + 4 : width };

  return (
    <div data-part={PARTS.dropdownMenu} ref={ref}>
      <div
        data-part={PARTS.dropdownMenuTrigger}
        data-state={open ? 'open' : undefined}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        style={triggerStyle}
      >
        <span>{options[selected]}</span>
        <span style={{ fontSize: 8, marginLeft: 8 }}>▼</span>
      </div>
      {open && (
        <div data-part={PARTS.dropdownMenuPanel} role="listbox" style={panelStyle}>
          {options.map((opt, i) => (
            <div
              key={`${opt}-${i}`}
              data-part={PARTS.dropdownMenuItem}
              data-state={i === selected ? 'selected' : undefined}
              role="option"
              aria-selected={i === selected}
              onClick={() => {
                onSelect(i);
                setOpen(false);
              }}
            >
              {i === selected ? '✓ ' : '\u00A0\u00A0\u00A0'}
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
