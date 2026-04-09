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
export declare function ToolPalette({ tools, selected, onSelect, columns }: ToolPaletteProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ToolPalette.d.ts.map