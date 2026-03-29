import type { CSSProperties } from 'react';
import { PARTS } from '../../parts';

export interface ToolDef {
  icon: string;
  label: string;
}

export interface ToolPaletteProps {
  tools: ToolDef[];
  selected: number;
  onSelect: (index: number) => void;
  columns?: number;
}

export function ToolPalette({ tools, selected, onSelect, columns }: ToolPaletteProps) {
  const style: CSSProperties | undefined = columns != null ? { ['--hc-tool-columns' as string]: columns } : undefined;

  return (
    <div data-part={PARTS.toolPalette} role="toolbar" aria-label="Tool palette" style={style}>
      {tools.map((t, i) => (
        <div
          key={`${t.label}-${i}`}
          data-part={PARTS.toolPaletteItem}
          data-state={selected === i ? 'selected' : undefined}
          role="radio"
          aria-checked={selected === i}
          aria-label={t.label}
          title={t.label}
          onClick={() => onSelect(i)}
        >
          {t.icon}
        </div>
      ))}
    </div>
  );
}
