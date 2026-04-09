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
export declare function GridBoard({ rows, cols, cells, selectedIndex, cellSize, disabled, onSelect, }: GridBoardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=GridBoard.d.ts.map