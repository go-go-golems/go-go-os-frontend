import { PARTS } from '../../parts';

export type GridCellSize = 'small' | 'medium' | 'large';

export interface GridCell {
  value?: string;
  label?: string;
  color?: string;
  disabled?: boolean;
  style?: string;
}

export interface GridSelection {
  row: number;
  col: number;
  cellIndex: number;
}

export interface GridBoardProps {
  rows: number;
  cols: number;
  cells?: GridCell[];
  selectedIndex?: number | null;
  cellSize?: GridCellSize;
  disabled?: boolean;
  onSelect?: (selection: GridSelection) => void;
}

function sizePx(cellSize: GridCellSize): number {
  switch (cellSize) {
    case 'small':
      return 44;
    case 'large':
      return 76;
    case 'medium':
    default:
      return 60;
  }
}

function fallbackCellLabel(row: number, col: number): string {
  return `${row + 1},${col + 1}`;
}

export function GridBoard({
  rows,
  cols,
  cells = [],
  selectedIndex,
  cellSize = 'medium',
  disabled,
  onSelect,
}: GridBoardProps) {
  const normalizedRows = Number.isFinite(rows) ? Math.max(1, Math.floor(rows)) : 1;
  const normalizedCols = Number.isFinite(cols) ? Math.max(1, Math.floor(cols)) : 1;
  const edge = sizePx(cellSize);

  return (
    <div data-part={PARTS.confirmWidgetBody}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${normalizedCols}, ${edge}px)`,
          gap: 4,
        }}
      >
        {Array.from({ length: normalizedRows * normalizedCols }).map((_, index) => {
          const row = Math.floor(index / normalizedCols);
          const col = index % normalizedCols;
          const cell = cells[index] ?? {};
          const isDisabled = disabled || cell.disabled === true;
          const isSelected = selectedIndex === index;
          const label = cell.label ?? cell.value ?? fallbackCellLabel(row, col);

          return (
            <button
              key={index}
              type="button"
              data-part={PARTS.confirmGridCell}
              data-state={isSelected ? 'active' : undefined}
              disabled={isDisabled}
              onClick={() => onSelect?.({ row, col, cellIndex: index })}
              style={{
                width: edge,
                height: edge,
                ...(cell.color ? { background: cell.color } : {}),
                ...(cell.style ? { borderStyle: cell.style } : {}),
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
