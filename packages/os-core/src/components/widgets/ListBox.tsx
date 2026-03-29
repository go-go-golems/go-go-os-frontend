import type { CSSProperties } from 'react';
import { PARTS } from '../../parts';

export interface ListBoxProps {
  items: string[];
  selected: number;
  onSelect: (index: number) => void;
  height?: number | string;
  width?: number | string;
}

export function ListBox({ items, selected, onSelect, height = 90, width = 160 }: ListBoxProps) {
  const style: CSSProperties = { height, width };

  return (
    <div data-part={PARTS.listBox} role="listbox" style={style}>
      {items.map((item, i) => (
        <div
          key={`${item}-${i}`}
          data-part={PARTS.listBoxItem}
          data-state={selected === i ? 'selected' : undefined}
          role="option"
          aria-selected={selected === i}
          onClick={() => onSelect(i)}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
